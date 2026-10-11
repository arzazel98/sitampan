import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('⚠️ Supabase URL or Anon Key is missing. Pastikan environment variables (VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY) telah diatur di dashboard hosting Anda.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
