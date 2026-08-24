// Thin client for Gemini's generateContent REST API, used by the admin
// "AI로 만들기" buttons. Calls Google directly from the admin's own browser
// using their own (free-tier) API key -- there's no backend in this app to
// proxy through, and the key never leaves the admin-only screens.
//
// Google renames/retires model ids often enough that a hardcoded candidate
// list kept going stale (this is the second time a "model not found" bug
// was reported). Instead, ask the account's own models.list endpoint what
// it actually has access to and use that -- this can't go stale.
const ROUNDS = 2
const ROUND_DELAY_MS = 1500
// A model that's overloaded sometimes hangs instead of returning an error
// status, which used to block the whole request on whichever model got
// tried first. Time each attempt out and move on to the next candidate
// instead of waiting indefinitely.
const REQUEST_TIMEOUT_MS = 15000
// Bound worst-case latency (timeout x candidates x rounds) -- an account can
// have many usable models, but only the first few "flash" ones are worth
// trying before giving up and telling the admin to retry.
const MAX_CANDIDATES = 5

// Try these, in this order, before falling back to whatever else the
// account has access to. Kept as a *preference* layered on top of the
// dynamic models.list discovery below, not a replacement for it -- if
// Google renames or retires one of these ids, generation still works off
// whatever the account actually reports instead of hard-failing again.
// "-pro-" models are noticeably heavier/slower than "-flash-" ones, so pro
// is ordered last: it's a quality fallback, not a first attempt, since
// trying the slowest model first would undercut the point of having a
// fallback chain (getting a fast response even when one model is busy).
const PREFERRED_MODEL_ORDER = [
  'gemini-flash-lite-latest',
  'gemini-flash-latest',
  'gemini-3-flash-preview',
  'gemini-3.1-flash-lite',
  'gemini-pro-latest',
]

export class GeminiError extends Error {}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function extractMessage(body: string): string {
  try {
    const parsed = JSON.parse(body) as { error?: { message?: string } }
    return parsed.error?.message ?? ''
  } catch {
    return ''
  }
}

interface ModelInfo {
  name: string
  supportedGenerationMethods?: string[]
}

async function listModels(apiKey: string): Promise<string[]> {
  let res: Response
  try {
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`)
  } catch {
    throw new GeminiError('AI 서버에 연결하지 못했어요. 인터넷 연결을 확인해주세요.')
  }
  if (!res.ok) {
    throw statusToError(res.status, await res.text().catch(() => ''))
  }
  const data = (await res.json()) as { models?: ModelInfo[] }
  const usable = (data.models ?? [])
    .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
    .map((m) => m.name.replace(/^models\//, ''))

  // Rank by PREFERRED_MODEL_ORDER first; anything not on that list still
  // gets tried, ordered fast ("flash") models before everything else.
  function rank(name: string): number {
    const preferredIndex = PREFERRED_MODEL_ORDER.indexOf(name)
    if (preferredIndex !== -1) return preferredIndex
    const isFlash = name.includes('flash') && !name.includes('image') && !name.includes('tts')
    return PREFERRED_MODEL_ORDER.length + (isFlash ? 0 : 1)
  }
  return [...usable].sort((a, b) => rank(a) - rank(b))
}

async function callModel(model: string, apiKey: string, prompt: string, schema: object) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    return await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: schema,
          },
        }),
      },
    )
  } finally {
    clearTimeout(timeout)
  }
}

const RETRYABLE_STATUSES = new Set([404, 429, 503])

export async function generateGeminiJSON<T>(apiKey: string, prompt: string, schema: object): Promise<T> {
  if (!apiKey.trim()) throw new GeminiError('먼저 API Key를 등록해주세요.')

  const candidates = (await listModels(apiKey)).slice(0, MAX_CANDIDATES)
  if (candidates.length === 0) {
    throw new GeminiError('이 API Key로 사용할 수 있는 AI 모델을 찾지 못했어요. Google AI Studio에서 키가 활성화됐는지 확인해주세요.')
  }

  let lastStatus = 0
  let lastBody = ''
  let sawTimeoutOrNetworkError = false

  for (let round = 0; round < ROUNDS; round++) {
    for (const model of candidates) {
      let res: Response
      try {
        res = await callModel(model, apiKey, prompt, schema)
      } catch {
        // A model that's overloaded or unreachable is exactly the case this
        // fallback exists for -- move on to the next candidate instead of
        // giving up on the whole request.
        sawTimeoutOrNetworkError = true
        continue
      }

      if (res.ok) return parseGeminiResponse<T>(await res.json())

      lastStatus = res.status
      lastBody = await res.text().catch(() => '')
      if (!RETRYABLE_STATUSES.has(res.status)) {
        throw statusToError(res.status, lastBody)
      }
    }
    if (round < ROUNDS - 1) await sleep(ROUND_DELAY_MS)
  }

  if (lastStatus === 0) {
    throw new GeminiError(
      sawTimeoutOrNetworkError
        ? 'AI 서버 응답이 너무 오래 걸리거나 연결에 실패했어요. 잠시 후 다시 시도해주세요.'
        : 'AI 요청이 실패했어요. 다시 시도해주세요.',
    )
  }
  throw statusToError(lastStatus, lastBody)
}

function statusToError(status: number, body: string): GeminiError {
  const detail = extractMessage(body)
  const suffix = detail ? ` (${detail.slice(0, 150)})` : ''
  if (status === 400 || status === 403) {
    return new GeminiError(`API Key가 올바르지 않은 것 같아요. API Key 설정을 다시 확인해주세요.${suffix}`)
  }
  if (status === 429) {
    return new GeminiError('요청이 너무 많아요. 잠시 후 다시 시도해주세요.')
  }
  if (status === 503) {
    return new GeminiError('지금 AI 서버가 많이 붐벼요. 잠시 후 다시 시도해주세요.')
  }
  if (status === 404) {
    return new GeminiError(`이 API Key로 사용할 수 있는 AI 모델을 찾지 못했어요. Google AI Studio에서 키가 활성화됐는지 확인해주세요.${suffix}`)
  }
  return new GeminiError(`AI 요청이 실패했어요. (오류 코드: ${status}) ${(detail || body).slice(0, 150)}`)
}

function parseGeminiResponse<T>(data: unknown): T {
  const text = (data as { candidates?: { content?: { parts?: { text?: string }[] } }[] })?.candidates?.[0]?.content
    ?.parts?.[0]?.text
  if (typeof text !== 'string') {
    throw new GeminiError('AI가 답을 만들지 못했어요. 다시 시도해주세요.')
  }
  try {
    return JSON.parse(text) as T
  } catch {
    throw new GeminiError('AI 응답을 해석하지 못했어요. 다시 시도해주세요.')
  }
}
