import type { User } from '@supabase/supabase-js'

export type UserProfile = {
  id: string
  email: string | null
  username: string
  city: string
  xp: number | null
}

export type AuthState = {
  user: User | null
  profile: UserProfile | null
  profileError: string | null
  loading: boolean
  isAuthenticated: boolean
}

export type AuthActionResult = {
  message: string
  requiresEmailConfirmation?: boolean
}

export type SaveGameResult =
  | { ok: true; message: string; score: number }
  | { ok: false; message: string }
