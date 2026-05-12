import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { User } from '@supabase/supabase-js'
import {
  isSupabaseConfigured,
  supabase,
  supabaseConfigError,
} from '../lib/supabaseClient'
import { withTimeout } from '../lib/withTimeout'
import type { AuthActionResult, AuthState, UserProfile } from '../types/user'

type AuthContextValue = AuthState & {
  isConfigured: boolean
  authError: string | null
  signUp: (
    email: string,
    password: string,
    username: string,
    city?: string,
  ) => Promise<AuthActionResult>
  signIn: (email: string, password: string) => Promise<AuthActionResult>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function normalizeProfile(data: Partial<UserProfile> & { id: string }) {
  return {
    id: data.id,
    email: data.email ?? null,
    username: data.username ?? 'Sudoku Focus User',
    city: data.city ?? 'Almaty',
    xp: data.xp ?? 0,
  } satisfies UserProfile
}

function getErrorMessage(error: unknown, fallbackMessage: string) {
  if (import.meta.env.DEV) {
    console.error('Supabase auth error:', error)
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  if (
    error
    && typeof error === 'object'
    && 'message' in error
    && typeof error.message === 'string'
    && error.message
  ) {
    return error.message
  }

  return fallbackMessage
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [loading, setLoading] = useState(Boolean(supabase))

  const ensureProfile = useCallback(async (
    nextUser: User,
  ) => {
    if (!supabase) {
      return null
    }

    try {
      return await withTimeout((async () => {
        const {
          data: existingProfile,
          error: existingProfileError,
        } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', nextUser.id)
          .maybeSingle()

        if (existingProfileError) {
          throw existingProfileError
        }

        if (existingProfile) {
          const normalizedProfile = normalizeProfile({
            ...existingProfile,
            email: existingProfile.email ?? nextUser.email ?? null,
          } as UserProfile)

          return normalizedProfile
        }

        const fallbackUsername =
          ((nextUser.user_metadata as { username?: string } | undefined)?.username)
          || nextUser.email?.split('@')[0]
          || 'Sudoku Focus User'

        const fallbackCity =
          ((nextUser.user_metadata as { city?: string } | undefined)?.city)
          || 'Almaty'

        const { error: upsertError } = await supabase.from('profiles').upsert(
          {
            id: nextUser.id,
            username: fallbackUsername,
            city: fallbackCity,
            xp: 0,
          },
          { onConflict: 'id' },
        )

        if (upsertError) {
          throw upsertError
        }

        const {
          data: createdProfile,
          error: createdProfileError,
        } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', nextUser.id)
          .maybeSingle()

        if (createdProfileError) {
          throw createdProfileError
        }

        const normalizedCreatedProfile = createdProfile
          ? normalizeProfile({
              ...createdProfile,
              email: createdProfile.email ?? nextUser.email ?? null,
            } as UserProfile)
          : normalizeProfile({
              id: nextUser.id,
              email: nextUser.email ?? null,
              username: fallbackUsername,
              city: fallbackCity,
              xp: 0,
            })

        return normalizedCreatedProfile
      })(), 12000)
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Profile ensure error:', error)
      }

      throw new Error(getErrorMessage(error, 'Could not load your profile. Please try again.'), {
        cause: error,
      })
    }
  }, [])

  const loadProfile = useCallback(async (nextUser: User | null) => {
    if (!nextUser) {
      setProfile(null)
      setProfileError(null)
      return
    }

    const ensuredProfile = await ensureProfile(nextUser)
    setProfile(ensuredProfile)
    setProfileError(null)
  }, [ensureProfile])

  useEffect(() => {
    if (!supabase) {
      return undefined
    }

    const client = supabase

    let isMounted = true

    async function initializeAuth() {
      try {
        const { data, error } = await withTimeout(
          client.auth.getSession(),
          12000,
        )

        if (error) {
          throw error
        }

        const sessionUser = data.session?.user ?? null

        if (!isMounted) {
          return
        }

        setUser(sessionUser)
        await loadProfile(sessionUser)
      } catch (error) {
        if (!isMounted) {
          return
        }

        setProfile(null)
        setProfileError(getErrorMessage(error, 'Could not load your profile. Please try again.'))
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user ?? null
      setUser(sessionUser)
      setLoading(true)

      void loadProfile(sessionUser)
        .catch((error) => {
          setProfile(null)
          setProfileError(getErrorMessage(error, 'Could not load your profile. Please try again.'))
        })
        .finally(() => {
          setLoading(false)
        })
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [loadProfile])

  const signUp = useCallback<AuthContextValue['signUp']>(async (
    email,
    password,
    username,
    city = 'Almaty',
  ) => {
    if (!supabase) {
      throw new Error(supabaseConfigError ?? 'Supabase is not configured.')
    }

    setLoading(true)

    try {
      const normalizedEmail = email.trim()
      const normalizedCity = city.trim() || 'Almaty'
      const normalizedUsername = username.trim()

      const { data, error } = await withTimeout(
        supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: {
              username: normalizedUsername,
              city: normalizedCity,
            },
          },
        }),
        15000,
      )

      if (error) {
        throw new Error(getErrorMessage(error, 'Could not create your account. Please try again.'))
      }

      const authUser = data.user

      if (!authUser) {
        throw new Error('Account created, but no user record was returned.')
      }

      if (!data.session) {
        setUser(null)
        setProfile(null)
        setProfileError(null)
        await ensureProfile({
          ...authUser,
          user_metadata: {
            ...authUser.user_metadata,
            username: normalizedUsername || 'Sudoku Focus User',
            city: normalizedCity,
          },
        } as User)
        return {
          message: 'Account created. Please check your email to confirm your account.',
          requiresEmailConfirmation: true,
        }
      }

      setUser(authUser)
      await loadProfile({
        ...authUser,
        user_metadata: {
          ...authUser.user_metadata,
          username: normalizedUsername || 'Sudoku Focus User',
          city: normalizedCity,
        },
      } as User)
      return {
        message: 'Account created. You are now signed in.',
      }
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Could not create your account. Please try again.'), {
        cause: error,
      })
    } finally {
      setLoading(false)
    }
  }, [ensureProfile, loadProfile])

  const signIn = useCallback<AuthContextValue['signIn']>(async (email, password) => {
    if (!supabase) {
      throw new Error(supabaseConfigError ?? 'Supabase is not configured.')
    }

    setLoading(true)

    try {
      const { data, error } = await withTimeout(
        supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        }),
        15000,
      )

      if (error) {
        throw new Error(getErrorMessage(error, 'Could not sign you in. Please try again.'))
      }

      setUser(data.user)
      setProfileError(null)
      await loadProfile(data.user)
      return {
        message: 'Signed in successfully.',
      }
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Could not sign you in. Please try again.'), {
        cause: error,
      })
    } finally {
      setLoading(false)
    }
  }, [loadProfile])

  const signOut = useCallback<AuthContextValue['signOut']>(async () => {
    if (!supabase) {
      throw new Error(supabaseConfigError ?? 'Supabase is not configured.')
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        throw error
      }

      setUser(null)
      setProfile(null)
      setProfileError(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshProfile = useCallback<AuthContextValue['refreshProfile']>(async () => {
    setLoading(true)

    try {
      await withTimeout(
        loadProfile(user),
        12000,
      )
    } finally {
      setLoading(false)
    }
  }, [loadProfile, user])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    profile,
    profileError,
    loading,
    isAuthenticated: Boolean(user),
    isConfigured: isSupabaseConfigured,
    authError: supabaseConfigError,
    signUp,
    signIn,
    signOut,
    refreshProfile,
  }), [loading, profile, profileError, signIn, signOut, signUp, refreshProfile, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider.')
  }

  return context
}
