import { supabase } from './supabase'

export async function getGeminiApiKey(): Promise<string | null> {
  const { data: sessionData } = await supabase.auth.getSession()
  const userId = sessionData.session?.user.id
  if (!userId) return null

  const { data, error } = await supabase
    .from('admin_settings')
    .select('gemini_api_key')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data?.gemini_api_key ?? null
}

export async function saveGeminiApiKey(key: string): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession()
  const userId = sessionData.session?.user.id
  if (!userId) throw new Error('로그인이 필요해요.')

  const { error } = await supabase
    .from('admin_settings')
    .upsert({ user_id: userId, gemini_api_key: key, updated_at: new Date().toISOString() })
  if (error) throw error
}
