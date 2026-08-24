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
  // Which list group (ConversationGroupKey, kept as a plain string here to
  // avoid a circular import with grouping.ts) this item belongs under.
  // Unset for the original seeded items -- those are grouped by a hardcoded
  // id lookup / id-prefix convention in grouping.ts instead.
  groupKey?: string
  // Short list-display title. Unset for the original seeded items -- those
  // get theirs from a hardcoded id->title lookup in grouping.ts instead.
  title?: string
}

interface ConversationRow {
  id: string
  situation: string
  messages: ConversationMessage[]
  choices: ConversationChoice[]
  answer_index: number
  sort_order: number
  group_key: string | null
  title: string | null
}

function fromRow(row: ConversationRow): ConversationItem {
  return {
    id: row.id,
    situation: row.situation,
    messages: row.messages,
    choices: row.choices,
    answerIndex: row.answer_index,
    groupKey: row.group_key ?? undefined,
    title: row.title ?? undefined,
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
    group_key: item.groupKey ?? null,
    title: item.title ?? null,
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
      group_key: item.groupKey ?? null,
      title: item.title ?? null,
    })
    .eq('id', id)
  if (error) throw error
}

export async function deleteConversation(id: string): Promise<void> {
  const { error } = await supabase.from('conversations').delete().eq('id', id)
  if (error) throw error
}
