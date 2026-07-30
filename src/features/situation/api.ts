import { supabase } from '../../lib/supabase'
import type { EmojiSceneSpec } from '../../components/EmojiScene'

export interface SituationItem {
  id: string
  scene: EmojiSceneSpec
  question: string
  choices: string[]
  answerIndex: number
  explanation: string
}

interface SituationRow {
  id: string
  scene: EmojiSceneSpec
  question: string
  choices: string[]
  answer_index: number
  explanation: string
  sort_order: number
}

function fromRow(row: SituationRow): SituationItem {
  return {
    id: row.id,
    scene: row.scene,
    question: row.question,
    choices: row.choices,
    answerIndex: row.answer_index,
    explanation: row.explanation,
  }
}

export async function listSituations(): Promise<SituationItem[]> {
  const { data, error } = await supabase.from('situations').select('*').order('sort_order')
  if (error) throw error
  return (data as SituationRow[]).map(fromRow)
}

export async function getSituation(id: string): Promise<SituationItem> {
  const { data, error } = await supabase.from('situations').select('*').eq('id', id).single()
  if (error) throw error
  return fromRow(data as SituationRow)
}

export async function createSituation(item: Omit<SituationItem, 'id'>): Promise<void> {
  const { error } = await supabase.from('situations').insert({
    id: crypto.randomUUID(),
    scene: item.scene,
    question: item.question,
    choices: item.choices,
    answer_index: item.answerIndex,
    explanation: item.explanation,
    sort_order: Date.now(),
  })
  if (error) throw error
}

export async function updateSituation(id: string, item: Omit<SituationItem, 'id'>): Promise<void> {
  const { error } = await supabase
    .from('situations')
    .update({
      scene: item.scene,
      question: item.question,
      choices: item.choices,
      answer_index: item.answerIndex,
      explanation: item.explanation,
    })
    .eq('id', id)
  if (error) throw error
}

export async function deleteSituation(id: string): Promise<void> {
  const { error } = await supabase.from('situations').delete().eq('id', id)
  if (error) throw error
}
