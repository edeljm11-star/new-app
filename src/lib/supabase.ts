import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// PKCE puts the password-reset code in the URL's query string instead of
// the hash fragment. The app uses HashRouter (routes live in the hash), so
// the default implicit flow's "#access_token=..." would collide with that
// and silently fail to establish a session on the reset-password page.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { flowType: 'pkce' },
})
