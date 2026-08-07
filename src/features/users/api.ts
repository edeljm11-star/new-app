import { supabase } from '../../lib/supabase'

export interface Profile {
  id: string
  email: string
  createdAt: string
}

interface ProfileRow {
  id: string
  email: string
  created_at: string
}

export async function listProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return (data as ProfileRow[]).map((row) => ({ id: row.id, email: row.email, createdAt: row.created_at }))
}
