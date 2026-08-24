import type { CrosswordCell, CrosswordWord } from './api'

// Auto-places a list of words onto a crossword grid so every crossing is a
// real, matching-letter intersection -- the same standard-crossword rule
// that was applied by hand earlier to fix puzzles where two touching words
// spelled a meaningless string. A word may only be placed where:
//  - it shares at least one matching letter with an already-placed word, and
//  - every other cell it passes through is either brand new (with empty
//    neighbors on both perpendicular sides, so it can't brush against an
//    unrelated word) or an exact-matching intersection.
// AI only supplies the word/hint/emoji list; this module owns all grid math
// so that guarantee can't be bypassed by a bad AI response.

export interface WordInput {
  answer: string
  hintText: string
  hintEmoji: string
}

export interface GeneratedLayout {
  grid: CrosswordCell[][]
  words: CrosswordWord[]
  unplaced: WordInput[]
}

// A crossword can only connect words that share an actual syllable -- being
// about the same topic isn't enough, and an AI word list often has several
// words that don't share a syllable with anything else in the batch. Rather
// than hope the raw list happens to be well-connected, keep only its
// largest cluster of mutually-reachable words (via shared syllables,
// transitively) before attempting placement.
export function largestConnectedGroup(inputs: WordInput[]): WordInput[] {
  const parent = inputs.map((_, i) => i)
  function find(x: number): number {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]]
      x = parent[x]
    }
    return x
  }
  function union(a: number, b: number) {
    const ra = find(a)
    const rb = find(b)
    if (ra !== rb) parent[ra] = rb
  }
  function sharesSyllable(a: string, b: string): boolean {
    for (const ch of a) if (b.includes(ch)) return true
    return false
  }

  for (let i = 0; i < inputs.length; i++) {
    for (let j = i + 1; j < inputs.length; j++) {
      if (sharesSyllable(inputs[i].answer, inputs[j].answer)) union(i, j)
    }
  }

  const groups = new Map<number, WordInput[]>()
  for (let i = 0; i < inputs.length; i++) {
    const root = find(i)
    if (!groups.has(root)) groups.set(root, [])
    groups.get(root)!.push(inputs[i])
  }

  let best: WordInput[] = []
  for (const group of groups.values()) {
    if (group.length > best.length) best = group
  }
  return best
}

type Direction = 'across' | 'down'

interface Candidate {
  row: number
  col: number
  direction: Direction
}

function key(r: number, c: number): string {
  return `${r},${c}`
}

function step(direction: Direction): [number, number] {
  return direction === 'across' ? [0, 1] : [1, 0]
}

function perpStep(direction: Direction): [number, number] {
  return direction === 'across' ? [1, 0] : [0, 1]
}

function canPlace(map: Map<string, string>, answer: string, row: number, col: number, direction: Direction): boolean {
  const [dr, dc] = step(direction)
  const [pr, pc] = perpStep(direction)

  if (map.has(key(row - dr, col - dc))) return false
  const endR = row + dr * (answer.length - 1)
  const endC = col + dc * (answer.length - 1)
  if (map.has(key(endR + dr, endC + dc))) return false

  let hasIntersection = false
  for (let i = 0; i < answer.length; i++) {
    const r = row + dr * i
    const c = col + dc * i
    const existing = map.get(key(r, c))
    if (existing !== undefined) {
      if (existing !== answer[i]) return false
      hasIntersection = true
    } else {
      if (map.has(key(r + pr, c + pc))) return false
      if (map.has(key(r - pr, c - pc))) return false
    }
  }
  return hasIntersection
}

function findCandidates(map: Map<string, string>, answer: string): Candidate[] {
  const candidates: Candidate[] = []
  for (const [k, ch] of map.entries()) {
    const [er, ec] = k.split(',').map(Number)
    for (let i = 0; i < answer.length; i++) {
      if (answer[i] !== ch) continue
      candidates.push({ row: er, col: ec - i, direction: 'across' })
      candidates.push({ row: er - i, col: ec, direction: 'down' })
    }
  }
  return candidates
}

function bbox(map: Map<string, string>, extra?: { row: number; col: number; direction: Direction; length: number }) {
  let minR = Infinity
  let maxR = -Infinity
  let minC = Infinity
  let maxC = -Infinity
  for (const k of map.keys()) {
    const [r, c] = k.split(',').map(Number)
    minR = Math.min(minR, r)
    maxR = Math.max(maxR, r)
    minC = Math.min(minC, c)
    maxC = Math.max(maxC, c)
  }
  if (extra) {
    const [dr, dc] = step(extra.direction)
    for (let i = 0; i < extra.length; i++) {
      const r = extra.row + dr * i
      const c = extra.col + dc * i
      minR = Math.min(minR, r)
      maxR = Math.max(maxR, r)
      minC = Math.min(minC, c)
      maxC = Math.max(maxC, c)
    }
  }
  return { minR, maxR, minC, maxC }
}

function bestCandidateFor(map: Map<string, string>, answer: string): Candidate | null {
  let best: Candidate | null = null
  let bestScore = Infinity
  for (const cand of findCandidates(map, answer)) {
    if (!canPlace(map, answer, cand.row, cand.col, cand.direction)) continue
    const box = bbox(map, { ...cand, length: answer.length })
    const width = box.maxC - box.minC + 1
    const height = box.maxR - box.minR + 1
    const score = Math.max(width, height) * 1000 + width * height
    if (score < bestScore) {
      bestScore = score
      best = cand
    }
  }
  return best
}

function shuffled<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

// The greedy placer's yield depends heavily on processing order -- an early
// word can claim the only good crossing cell a later word needed. Since
// there's no backtracking, try several shuffles of the input order and keep
// whichever attempt placed the most words (a cheap stand-in for real
// backtracking that works fine at this puzzle's word-count scale).
export function generateCrosswordLayout(inputs: WordInput[]): GeneratedLayout {
  const byLengthDesc = [...inputs].sort((a, b) => b.answer.length - a.answer.length)
  let best: GeneratedLayout | null = null
  const attempts = Math.max(24, inputs.length * 6)
  for (let attempt = 0; attempt < attempts; attempt++) {
    const order = attempt === 0 ? byLengthDesc : shuffled(inputs)
    const result = placeGreedy(order)
    if (!best || result.words.length > best.words.length) best = result
    if (best.unplaced.length === 0) break
  }
  return best!
}

// `order` is the exact processing order to use -- the caller controls
// whether that's a length-sorted default or one of the random shuffles, so
// shuffling actually changes placement outcomes instead of being undone by
// a fixed sort in here.
function placeGreedy(order: WordInput[]): GeneratedLayout {
  const map = new Map<string, string>()
  const placed: (WordInput & { row: number; col: number; direction: Direction })[] = []
  let pending = order

  for (let pass = 0; pass < 3; pass++) {
    const stillUnplaced: WordInput[] = []
    for (const w of pending) {
      if (placed.length === 0) {
        for (let i = 0; i < w.answer.length; i++) map.set(key(0, i), w.answer[i])
        placed.push({ ...w, row: 0, col: 0, direction: 'across' })
        continue
      }
      const best = bestCandidateFor(map, w.answer)
      if (!best) {
        stillUnplaced.push(w)
        continue
      }
      const [dr, dc] = step(best.direction)
      for (let i = 0; i < w.answer.length; i++) map.set(key(best.row + dr * i, best.col + dc * i), w.answer[i])
      placed.push({ ...w, row: best.row, col: best.col, direction: best.direction })
    }
    pending = stillUnplaced
    if (pending.length === 0) break
  }

  if (placed.length === 0) {
    return { grid: [], words: [], unplaced: pending }
  }

  const box = bbox(map)
  const rows = box.maxR - box.minR + 1
  const cols = box.maxC - box.minC + 1
  const grid: CrosswordCell[][] = Array.from({ length: rows }, () => Array.from({ length: cols }, () => null))
  for (const [k, ch] of map.entries()) {
    const [r, c] = k.split(',').map(Number)
    grid[r - box.minR][c - box.minC] = ch
  }

  const startCells: string[] = []
  for (const w of placed) {
    const k = key(w.row - box.minR, w.col - box.minC)
    if (!startCells.includes(k)) startCells.push(k)
  }
  startCells.sort((a, b) => {
    const [ar, ac] = a.split(',').map(Number)
    const [br, bc] = b.split(',').map(Number)
    return ar - br || ac - bc
  })
  const numberOf = new Map(startCells.map((k, i) => [k, i + 1]))

  const words: CrosswordWord[] = placed.map((w) => {
    const row = w.row - box.minR
    const col = w.col - box.minC
    return {
      number: numberOf.get(key(row, col))!,
      direction: w.direction,
      row,
      col,
      length: w.answer.length,
      answer: w.answer,
      hintText: w.hintText,
      hintEmoji: w.hintEmoji,
    }
  })

  return { grid, words, unplaced: pending }
}
