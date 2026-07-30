import { supabase } from '../../lib/supabase'

export type CrosswordCell = string | null

export interface CrosswordWord {
  number: number
  direction: 'across' | 'down'
  row: number
  col: number
  length: number
  answer: string
  hintText: string
  hintEmoji: string
}

export interface CrosswordPuzzle {
  id: string
  title: string
  grid: CrosswordCell[][]
  words: CrosswordWord[]
}

interface CrosswordRow {
  id: string
  title: string
  grid: CrosswordCell[][]
  words: CrosswordWord[]
  sort_order: number
}

function fromRow(row: CrosswordRow): CrosswordPuzzle {
  return {
    id: row.id,
    title: row.title,
    grid: row.grid,
    words: row.words,
  }
}

export async function listPuzzles(): Promise<CrosswordPuzzle[]> {
  const { data, error } = await supabase.from('crossword_puzzles').select('*').order('sort_order')
  if (error) throw error
  return (data as CrosswordRow[]).map(fromRow)
}

export async function getPuzzle(id: string): Promise<CrosswordPuzzle> {
  const { data, error } = await supabase.from('crossword_puzzles').select('*').eq('id', id).single()
  if (error) throw error
  return fromRow(data as CrosswordRow)
}

export async function createPuzzle(item: Omit<CrosswordPuzzle, 'id'>): Promise<void> {
  const { error } = await supabase.from('crossword_puzzles').insert({
    id: crypto.randomUUID(),
    title: item.title,
    grid: item.grid,
    words: item.words,
    sort_order: Date.now(),
  })
  if (error) throw error
}

export async function updatePuzzle(id: string, item: Omit<CrosswordPuzzle, 'id'>): Promise<void> {
  const { error } = await supabase
    .from('crossword_puzzles')
    .update({
      title: item.title,
      grid: item.grid,
      words: item.words,
    })
    .eq('id', id)
  if (error) throw error
}

export async function deletePuzzle(id: string): Promise<void> {
  const { error } = await supabase.from('crossword_puzzles').delete().eq('id', id)
  if (error) throw error
}
