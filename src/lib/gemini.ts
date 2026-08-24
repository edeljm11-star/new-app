// Thin client for Gemini's generateContent REST API, used by the admin
// "AI로 만들기" buttons. Calls Google directly from the admin's own browser
// using their own (free-tier) API key -- there's no backend in this app to
// proxy through, and the key never leaves the admin-only screens.
const MODEL = 'gemini-2.5-flash'

export class GeminiError extends Error {}

export async function generateGeminiJSON<T>(apiKey: string, prompt: string, schema: object): Promise<T> {
  if (!apiKey.trim()) throw new GeminiError('먼저 API Key를 등록해주세요.')

  let res: Response
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`,
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
  } catch {
    throw new GeminiError('AI 서버에 연결하지 못했어요. 인터넷 연결을 확인해주세요.')
  }

  if (!res.ok) {
    if (res.status === 400 || res.status === 403) {
      throw new GeminiError('API Key가 올바르지 않은 것 같아요. API Key 설정을 다시 확인해주세요.')
    }
    if (res.status === 429) {
      throw new GeminiError('요청이 너무 많아요. 잠시 후 다시 시도해주세요.')
    }
    throw new GeminiError(`AI 요청이 실패했어요. (오류 코드: ${res.status})`)
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
