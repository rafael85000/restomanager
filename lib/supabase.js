import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,         // Session persistante même après fermeture
      autoRefreshToken: true,        // Refresh automatique du token
      detectSessionInUrl: false,
      storageKey: 'fimc-auth',
    }
  }
)