import { useEffect, useState } from 'react'
import { ArrowRight, LoaderCircle, ShieldCheck } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { sanitizeReturnTo } from '../lib/authRedirect'
import type { AuthActionResult } from '../types/user'

function isValidEmail(email: string) {
  return /\S+@\S+\.\S+/.test(email)
}

function getErrorMessage(error: unknown) {
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

  return 'Something went wrong. Please try again.'
}

export function AuthPage() {
  const {
    authError,
    isAuthenticated,
    isConfigured,
    loading,
    signIn,
    signUp,
  } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [city, setCity] = useState('Almaty')
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [hasCompletedAuthAction, setHasCompletedAuthAction] = useState(false)
  const requestedReturnTo = searchParams.get('returnTo')
  const returnTo = sanitizeReturnTo(requestedReturnTo, '/profile')
  const hasExplicitReturnTo = Boolean(requestedReturnTo)
  const isOnlineRoomReturn = returnTo.startsWith('/online/')

  useEffect(() => {
    if (!loading && isAuthenticated && !hasCompletedAuthAction) {
      navigate(returnTo, { replace: true })
    }
  }, [hasCompletedAuthAction, isAuthenticated, loading, navigate, returnTo])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccessMessage(null)

    const normalizedEmail = email.trim()
    const normalizedUsername = username.trim()
    const normalizedCity = city.trim() || 'Almaty'

    if (!normalizedEmail) {
      setError('Email is required.')
      return
    }

    if (!isValidEmail(normalizedEmail)) {
      setError('Please enter a valid email address.')
      return
    }

    if (!password) {
      setError('Password is required.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    if (mode === 'signup' && !normalizedUsername) {
      setError('Username is required for signup.')
      return
    }

    try {
      let result: AuthActionResult

      if (mode === 'signup') {
        result = await signUp(normalizedEmail, password, normalizedUsername, normalizedCity)
        setSuccessMessage(result.message)

        if (!result.requiresEmailConfirmation) {
          setHasCompletedAuthAction(true)
          window.setTimeout(() => {
            navigate(hasExplicitReturnTo ? returnTo : '/onboarding', { replace: true })
          }, 500)
        }

        return
      }

      result = await signIn(normalizedEmail, password)
      setSuccessMessage(result.message)
      setHasCompletedAuthAction(true)

      window.setTimeout(() => {
        navigate(returnTo, { replace: true })
      }, 400)
    } catch (submissionError) {
      setError(getErrorMessage(submissionError))
    }
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_26rem]">
      <div className="rounded-[2rem] border border-white/10 bg-white/6 p-6 shadow-[0_18px_60px_rgba(2,8,24,0.35)] backdrop-blur-sm sm:p-8">
        <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/75">Auth</p>
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          {mode === 'login' ? 'Welcome back' : 'Create your focus profile'}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
          {mode === 'login'
            ? 'Sign in to keep your progress connected to your profile, leaderboard presence, and future analytics.'
            : 'Start with an account so Sudoku Focus can personalize your profile, city ranking, and long-term progress.'}
        </p>

        {isOnlineRoomReturn ? (
          <div className="mt-5 inline-flex rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-100">
            Sign in to join your friend&apos;s Sudoku room.
          </div>
        ) : null}

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Profiles</p>
            <p className="mt-2 text-sm leading-6 text-slate-200">
              Usernames, city, and XP-ready fields are connected through Supabase.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Auth</p>
            <p className="mt-2 text-sm leading-6 text-slate-200">
              Email and password sign-in keeps the app simple and production-shaped.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Next step</p>
            <p className="mt-2 text-sm leading-6 text-slate-200">
              This foundation is ready for onboarding, game saves, leaderboards, and synced history later.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-white/6 p-6 shadow-[0_18px_60px_rgba(2,8,24,0.35)] backdrop-blur-sm sm:p-8">
        <div className="flex rounded-full border border-white/10 bg-slate-950/50 p-1">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
              mode === 'login'
                ? 'bg-white text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
              mode === 'signup'
                ? 'bg-white text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Sign up
          </button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {!isConfigured ? (
            <div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-50">
              {authError}
            </div>
          ) : null}

          {error ? (
            <div className="rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}

          {successMessage ? (
            <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
              {successMessage}
            </div>
          ) : null}

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                if (error) {
                  setError(null)
                }
              }}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-cyan-300/35"
              placeholder="you@example.com"
              required
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
                if (error) {
                  setError(null)
                }
              }}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-cyan-300/35"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </label>

          {mode === 'signup' ? (
            <>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-200">Username</span>
                <input
                  type="text"
                  value={username}
                  onChange={(event) => {
                    setUsername(event.target.value)
                    if (error) {
                      setError(null)
                    }
                  }}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-cyan-300/35"
                  placeholder="focusmaster"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-200">City</span>
                <input
                  type="text"
                  value={city}
                  onChange={(event) => {
                    setCity(event.target.value)
                    if (error) {
                      setError(null)
                    }
                  }}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-cyan-300/35"
                  placeholder="Almaty"
                />
              </label>
            </>
          ) : null}

          <button
            type="submit"
            disabled={loading || !isConfigured}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            {mode === 'login' ? 'Login to Sudoku Focus' : 'Create account'}
          </button>
        </form>

        <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-slate-950/45 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 text-cyan-200" />
            <p className="text-sm leading-6 text-slate-300">
              Auth is handled with Supabase. After sign in, your profile page becomes the home for identity, city, and future synced progress.
            </p>
          </div>
        </div>

        <p className="mt-5 text-sm text-slate-400">
          Want to explore first? <Link to="/game" className="text-cyan-200 hover:text-cyan-100">Jump into the puzzle board.</Link>
        </p>
      </div>
    </section>
  )
}
