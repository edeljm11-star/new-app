const CHOSEONG = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
]

const SYLLABLE_START = 0xac00
const SYLLABLE_END = 0xd7a3
const SYLLABLES_PER_CHOSEONG = 21 * 28

// Extracts the leading consonant of each Hangul syllable in a word, e.g.
// "고양이" -> "ㄱㅇㅇ". Non-syllable characters (spaces, punctuation) pass
// through unchanged so partial/odd input never crashes the hint.
export function toChosung(word: string): string {
  let result = ''
  for (const char of word) {
    const code = char.charCodeAt(0)
    if (code >= SYLLABLE_START && code <= SYLLABLE_END) {
      const choseongIndex = Math.floor((code - SYLLABLE_START) / SYLLABLES_PER_CHOSEONG)
      result += CHOSEONG[choseongIndex]
    } else {
      result += char
    }
  }
  return result
}
