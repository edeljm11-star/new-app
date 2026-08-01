import { supabase } from '../../lib/supabase'

export interface Vocabulary {
  word: string
  meaning: string
}

export interface TrueFalseItem {
  statement: string
  answer: boolean
}

export interface MainThemeQuiz {
  question: string
  choices: string[]
  answerIndex: number
}

export interface VocabQuizItem {
  word: string
  choices: string[]
  answerIndex: number
  type?: 'vocab' | 'proverb'
}

export interface Story {
  id: string
  emoji: string
  title: string
  paragraphs: string[]
  vocabulary: Vocabulary[]
  trueFalse: TrueFalseItem[]
  mainTheme: MainThemeQuiz
  vocabQuiz: VocabQuizItem[]
}

interface StoryRow {
  id: string
  emoji: string
  title: string
  paragraphs: string[]
  vocabulary: Vocabulary[]
  true_false: TrueFalseItem[]
  main_theme: MainThemeQuiz
  vocab_quiz: VocabQuizItem[]
  sort_order: number
}

function fromRow(row: StoryRow): Story {
  return {
    id: row.id,
    emoji: row.emoji,
    title: row.title,
    paragraphs: row.paragraphs,
    vocabulary: row.vocabulary,
    trueFalse: row.true_false,
    mainTheme: row.main_theme,
    vocabQuiz: row.vocab_quiz,
  }
}

export async function listStories(): Promise<Story[]> {
  const { data, error } = await supabase.from('stories').select('*').order('sort_order')
  if (error) throw error
  return (data as StoryRow[]).map(fromRow)
}

export async function getStory(id: string): Promise<Story> {
  const { data, error } = await supabase.from('stories').select('*').eq('id', id).single()
  if (error) throw error
  return fromRow(data as StoryRow)
}

export async function createStory(item: Omit<Story, 'id'>): Promise<void> {
  const { error } = await supabase.from('stories').insert({
    id: crypto.randomUUID(),
    emoji: item.emoji,
    title: item.title,
    paragraphs: item.paragraphs,
    vocabulary: item.vocabulary,
    true_false: item.trueFalse,
    main_theme: item.mainTheme,
    vocab_quiz: item.vocabQuiz,
    sort_order: Date.now(),
  })
  if (error) throw error
}

export async function updateStory(id: string, item: Omit<Story, 'id'>): Promise<void> {
  const { error } = await supabase
    .from('stories')
    .update({
      emoji: item.emoji,
      title: item.title,
      paragraphs: item.paragraphs,
      vocabulary: item.vocabulary,
      true_false: item.trueFalse,
      main_theme: item.mainTheme,
      vocab_quiz: item.vocabQuiz,
    })
    .eq('id', id)
  if (error) throw error
}

export async function deleteStory(id: string): Promise<void> {
  const { error } = await supabase.from('stories').delete().eq('id', id)
  if (error) throw error
}
