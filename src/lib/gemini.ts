// Thin client for Gemini's generateContent REST API, used by the admin
// "AI로 만들기" buttons. Calls Google directly from the admin's own browser
// using their own (free-tier) API key -- there's no backend in this app to
// proxy through, and the key never leaves the admin-only screens.
//
// Which model names are actually reachable varies by account/API version,
// so a 404 (model not found) falls through to the next candidate instead
// of failing outright -- any one of these being valid is enough.
const MODEL_CANDIDATES = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.0-flash', 'gemini-1.5-flash']

export class GeminiError extends Error {}

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

export async function generateGeminiJSON<T>(apiKey: string, prompt: string, schema: object): Promise<T> {
  if (!apiKey.trim()) throw new GeminiError('먼저 API Key를 등록해주세요.')

  let res: Response | null = null
  let lastErrorBody = ''
  for (const model of MODEL_CANDIDATES) {
    try {
      res = await callModel(model, apiKey, prompt, schema)
    } catch {
      throw new GeminiError('AI 서버에 연결하지 못했어요. 인터넷 연결을 확인해주세요.')
    }
    if (res.ok) break
    if (res.status !== 404) break // real error (bad key, quota, etc.) -- don't mask it by retrying
    lastErrorBody = await res.text().catch(() => '')
  }

  if (!res) throw new GeminiError('AI 서버에 연결하지 못했어요.')

  if (!res.ok) {
    if (res.status === 400 || res.status === 403) {
      throw new GeminiError('API Key가 올바르지 않은 것 같아요. API Key 설정을 다시 확인해주세요.')
    }
    if (res.status === 429) {
      throw new GeminiError('요청이 너무 많아요. 잠시 후 다시 시도해주세요.')
    }
    if (res.status === 404) {
      throw new GeminiError('이 API Key로 사용할 수 있는 AI 모델을 찾지 못했어요. Google AI Studio에서 키가 활성화됐는지 확인해주세요.')
    }
    const body = (await res.text().catch(() => '')) || lastErrorBody
    throw new GeminiError(`AI 요청이 실패했어요. (오류 코드: ${res.status}) ${body.slice(0, 150)}`)
  }

  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (typeof text !== 'string') {
    throw new GeminiError('AI가 답을 만들지 못했어요. 다시 시도해주세요.')
  }

  try {
    return JSON.parse(text) as T
  } catch {
    throw new GeminiError('AI 응답을 해석하지 못했어요. 다시 시도해주세요.')
  }
}
