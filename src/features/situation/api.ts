import { supabase } from '../../lib/supabase'
import type { EmojiSceneSpec } from '../../components/EmojiScene'

// Matches the 관찰(observe)/감정(emotion)/사고(thought)/적용(apply) structure of
// the original paper worksheet this feature is based on. Optional because
// single-question situations (the pre-existing content) have no category.
export type SituationCategory = 'observe' | 'emotion' | 'thought' | 'apply'

export interface SituationQuestion {
  category?: SituationCategory
  question: string
  choices: string[]
  answerIndex: number
  explanation: string
}

export interface SituationItem {
  id: string
  scene: EmojiSceneSpec
  questions: SituationQuestion[]
}

interface SituationRow {
  id: string
  scene: EmojiSceneSpec
  // Legacy single-question columns, kept in sync with questions[0] so older
  // rows (and anything still reading them) stay valid.
  question: string
  choices: string[]
  answer_index: number
  explanation: string
  questions: SituationQuestion[] | null
  sort_order: number
}

function fromRow(row: SituationRow): SituationItem {
  return {
    id: row.id,
    scene: row.scene,
    questions:
      row.questions && row.questions.length > 0
        ? row.questions
        : [
            {
              question: row.question,
              choices: row.choices,
              answerIndex: row.answer_index,
              explanation: row.explanation,
            },
          ],
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
  const first = item.questions[0]
  const { error } = await supabase.from('situations').insert({
    id: crypto.randomUUID(),
    scene: item.scene,
    question: first.question,
    choices: first.choices,
    answer_index: first.answerIndex,
    explanation: first.explanation,
    questions: item.questions,
    sort_order: Date.now(),
  })
  if (error) throw error
}

export async function updateSituation(id: string, item: Omit<SituationItem, 'id'>): Promise<void> {
  const first = item.questions[0]
  const { error } = await supabase
    .from('situations')
    .update({
      scene: item.scene,
      question: first.question,
      choices: first.choices,
      answer_index: first.answerIndex,
      explanation: first.explanation,
      questions: item.questions,
    })
    .eq('id', id)
  if (error) throw error
}

export async function deleteSituation(id: string): Promise<void> {
  const { error } = await supabase.from('situations').delete().eq('id', id)
  if (error) throw error
}
