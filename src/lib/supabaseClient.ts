import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

if (import.meta.env.DEV) {
  console.log('Supabase env loaded:', {
    hasUrl: Boolean(import.meta.env.VITE_SUPABASE_URL),
    hasKey: Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY),
  })
}

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabaseConfigError = isSupabaseConfigured
  ? null
  : 'Missing Supabase environment variables. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to continue.'

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null
