import { supabase } from '../../lib/supabase'

export interface ConversationMessage {
  speaker: 'A' | 'B'
  text?: string
  blank?: boolean
}

export interface ConversationChoice {
  label: string
  isEmoji?: boolean
}

export interface ConversationItem {
  id: string
  situation: string
  messages: ConversationMessage[]
  choices: ConversationChoice[]
  answerIndex: number
}

interface ConversationRow {
  id: string
  situation: string
  messages: ConversationMessage[]
  choices: ConversationChoice[]
  answer_index: number
  sort_order: number
}

function fromRow(row: ConversationRow): ConversationItem {
  return {
    id: row.id,
    situation: row.situation,
    messages: row.messages,
    choices: row.choices,
    answerIndex: row.answer_index,
  }
}

export async function listConversations(): Promise<ConversationItem[]> {
  const { data, error } = await supabase.from('conversations').select('*').order('sort_order')
  if (error) throw error
  return (data as ConversationRow[]).map(fromRow)
}

export async function getConversation(id: string): Promise<ConversationItem> {
  const { data, error } = await supabase.from('conversations').select('*').eq('id', id).single()
  if (error) throw error
  return fromRow(data as ConversationRow)
}

export async function createConversation(item: Omit<ConversationItem, 'id'>): Promise<void> {
  const { error } = await supabase.from('conversations').insert({
    id: crypto.randomUUID(),
    situation: item.situation,
    messages: item.messages,
    choices: item.choices,
    answer_index: item.answerIndex,
    sort_order: Date.now(),
  })
  if (error) throw error
}

export async function updateConversation(id: string, item: Omit<ConversationItem, 'id'>): Promise<void> {
  const { error } = await supabase
    .from('conversations')
    .update({
      situation: item.situation,
      messages: item.messages,
      choices: item.choices,
      answer_index: item.answerIndex,
    })
    .eq('id', id)
  if (error) throw error
}

export async function deleteConversation(id: string): Promise<void> {
  const { error } = await supabase.from('conversations').delete().eq('id', id)
  if (error) throw error
}
