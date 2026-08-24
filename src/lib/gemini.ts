// Thin client for Gemini's generateContent REST API, used by the admin
// "AI로 만들기" buttons. Calls Google directly from the admin's own browser
// using their own (free-tier) API key -- there's no backend in this app to
// proxy through, and the key never leaves the admin-only screens.
//
// Which model names are actually reachable varies by account/API version,
// so a 404 (model not found) falls through to the next candidate. 503
// (model overloaded) and 429 (rate limited) are also transient -- another
// candidate model, or the same one a moment later, often succeeds -- so
// those retry too instead of failing on the first busy response.
const MODEL_CANDIDATES = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.0-flash', 'gemini-1.5-flash']
const ROUNDS = 2
const ROUND_DELAY_MS = 1500

export class GeminiError extends Error {}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function callModel(model: string, apiKey: string, prompt: string, schema: object) {
  return fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: schema,
        },
      }),
    },
  )
}

const RETRYABLE_STATUSES = new Set([404, 429, 503])

export async function generateGeminiJSON<T>(apiKey: string, prompt: string, schema: object): Promise<T> {
  if (!apiKey.trim()) throw new GeminiError('먼저 API Key를 등록해주세요.')

  let lastStatus = 0
  let lastBody = ''

  for (let round = 0; round < ROUNDS; round++) {
    for (const model of MODEL_CANDIDATES) {
      let res: Response
      try {
        res = await callModel(model, apiKey, prompt, schema)
      } catch {
        throw new GeminiError('AI 서버에 연결하지 못했어요. 인터넷 연결을 확인해주세요.')
      }

      if (res.ok) return parseGeminiResponse<T>(await res.json())

      lastStatus = res.status
      if (!RETRYABLE_STATUSES.has(res.status)) {
        lastBody = await res.text().catch(() => '')
        throw statusToError(res.status, lastBody)
      }
      lastBody = await res.text().catch(() => '')
    }
    if (round < ROUNDS - 1) await sleep(ROUND_DELAY_MS)
  }

  throw statusToError(lastStatus, lastBody)
}

function statusToError(status: number, body: string): GeminiError {
  if (status === 400 || status === 403) {
    return new GeminiError('API Key가 올바르지 않은 것 같아요. API Key 설정을 다시 확인해주세요.')
  }
  if (status === 429) {
    return new GeminiError('요청이 너무 많아요. 잠시 후 다시 시도해주세요.')
  }
  if (status === 503) {
    return new GeminiError('지금 AI 서버가 많이 붐벼요. 잠시 후 다시 시도해주세요.')
  }
  if (status === 404) {
    return new GeminiError('이 API Key로 사용할 수 있는 AI 모델을 찾지 못했어요. Google AI Studio에서 키가 활성화됐는지 확인해주세요.')
  }
  return new GeminiError(`AI 요청이 실패했어요. (오류 코드: ${status}) ${body.slice(0, 150)}`)
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
