import type { CrosswordPuzzle } from './api'

// Puzzle titles that belong to the same category share a base name, e.g.
// "동물과 자연" and "동물과 자연 2" both group under "동물과 자연".
export function categoryOf(title: string): string {
  return title.replace(/\s+\d+$/, '')
}

export function groupByCategory(puzzles: CrosswordPuzzle[]): [string, CrosswordPuzzle[]][] {
  const groups = new Map<string, CrosswordPuzzle[]>()
  for (const p of puzzles) {
    const category = categoryOf(p.title)
    if (!groups.has(category)) groups.set(category, [])
    groups.get(category)!.push(p)
  }
  return Array.from(groups.entries())
}
