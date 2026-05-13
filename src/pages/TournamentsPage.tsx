import { useState } from 'react'
import { ArrowRight, CopyPlus, ShieldEllipsis, Trophy, Users } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { CommunityCard } from '../components/community/CommunityCard'
import { difficultyConfig, difficultyOrder } from '../constants/difficulty'
import { useAuth } from '../hooks/useAuth'
import { useTournament } from '../hooks/useTournament'
import { buildAuthRedirectPath } from '../lib/authRedirect'
import { cn } from '../lib/utils'
import type { Difficulty } from '../types/sudoku'

const maxPlayerOptions = [4, 8, 16, 32] as const

export function TournamentsPage() {
  const navigate = useNavigate()
  const { isAuthenticated, profile, user } = useAuth()
  const { createTournament, joinTournament, actionLoading } = useTournament()
  const [title, setTitle] = useState('Sudoku Focus Tournament')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [maxPlayers, setMaxPlayers] = useState<(typeof maxPlayerOptions)[number]>(8)
  const [tournamentCode, setTournamentCode] = useState('')
  const [createFeedback, setCreateFeedback] = useState<string | null>(null)
  const [joinFeedback, setJoinFeedback] = useState<string | null>(null)

  async function handleCreateTournament() {
    setCreateFeedback(null)

    if (!isAuthenticated) {
      navigate(buildAuthRedirectPath('/tournaments'))
      return
    }

    const result = await createTournament({
      title: title.trim() || 'Sudoku Focus Tournament',
      difficulty,
      maxPlayers,
    })

    if (!result.ok) {
      setCreateFeedback(result.message)
      return
    }

    navigate(`/tournaments/${result.tournamentCode}`)
  }

  async function handleJoinTournament() {
    setJoinFeedback(null)

    if (!isAuthenticated) {
      navigate(buildAuthRedirectPath('/tournaments'))
      return
    }

    const result = await joinTournament(tournamentCode)

    if (!result.ok) {
      setJoinFeedback(result.message)
      return
    }

    navigate(`/tournaments/${result.tournamentCode}`)
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200/90 bg-white/82 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-sm dark:border-white/10 dark:bg-white/6 dark:shadow-[0_18px_60px_rgba(2,8,24,0.35)] sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)] lg:items-start">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-700 dark:text-cyan-200/75">
              Tournaments
            </p>
            <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-5xl">
              Sudoku Tournaments
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
              Join a bracket. Solve fast. Advance to the final.
            </p>
          </div>

          <div className="rounded-[1.8rem] border border-slate-200 bg-slate-50/90 p-5 dark:border-white/10 dark:bg-slate-950/45">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white/85 p-4 dark:border-white/10 dark:bg-slate-950/55">
                <CopyPlus className="h-5 w-5 text-cyan-700 dark:text-cyan-100" />
                <p className="mt-3 text-sm font-semibold text-slate-950 dark:text-white">Create</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/85 p-4 dark:border-white/10 dark:bg-slate-950/55">
                <Users className="h-5 w-5 text-cyan-700 dark:text-cyan-100" />
                <p className="mt-3 text-sm font-semibold text-slate-950 dark:text-white">Share</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/85 p-4 dark:border-white/10 dark:bg-slate-950/55">
                <Trophy className="h-5 w-5 text-cyan-700 dark:text-cyan-100" />
                <p className="mt-3 text-sm font-semibold text-slate-950 dark:text-white">Survive</p>
              </div>
            </div>

            <div className="mt-5 rounded-[1.5rem] border border-cyan-300/25 bg-cyan-100/80 p-4 text-sm text-cyan-950 dark:border-cyan-300/20 dark:bg-cyan-400/10 dark:text-cyan-50">
              Fastest focus wins the bracket.
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
        <div className="rounded-[2rem] border border-slate-200/90 bg-white/82 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-sm dark:border-white/10 dark:bg-white/6 dark:shadow-[0_18px_60px_rgba(2,8,24,0.35)]">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
            Create tournament
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold text-slate-950 dark:text-white">
            Build your bracket
          </h2>

          <div className="mt-6 space-y-6">
            <label className="block">
              <span className="text-sm font-medium text-slate-950 dark:text-white">Tournament title</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-cyan-300 dark:border-white/10 dark:bg-slate-950/55 dark:text-white"
                placeholder="Sudoku Focus Tournament"
              />
            </label>

            <div>
              <p className="text-sm font-medium text-slate-950 dark:text-white">Difficulty</p>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {difficultyOrder.map((level) => {
                  const config = difficultyConfig[level]
                  const isActive = difficulty === level

                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setDifficulty(level)}
                      className={cn(
                        'rounded-2xl border px-4 py-4 text-left transition',
                        isActive
                          ? 'border-cyan-300/40 bg-cyan-100/85 dark:bg-cyan-400/14'
                          : 'border-slate-200 bg-white/90 hover:border-cyan-300/35 hover:bg-cyan-50/70 dark:border-white/10 dark:bg-slate-950/45 dark:hover:bg-slate-900/75',
                      )}
                    >
                      <p className="font-display text-lg font-semibold text-slate-950 dark:text-white">
                        {config.label}
                      </p>
                      <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-300">
                        {config.description}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-950 dark:text-white">Bracket size</p>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {maxPlayerOptions.map((option) => {
                  const isActive = maxPlayers === option

                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setMaxPlayers(option)}
                      className={cn(
                        'rounded-2xl border px-4 py-4 text-left transition',
                        isActive
                          ? 'border-cyan-300/40 bg-cyan-100/85 dark:bg-cyan-400/14'
                          : 'border-slate-200 bg-white/90 hover:border-cyan-300/35 hover:bg-cyan-50/70 dark:border-white/10 dark:bg-slate-950/45 dark:hover:bg-slate-900/75',
                      )}
                    >
                      <p className="font-display text-xl font-semibold text-slate-950 dark:text-white">
                        {option}
                      </p>
                      <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        players max
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50/90 p-4 dark:border-white/10 dark:bg-slate-950/45">
              <div className="flex items-center gap-3">
                <ShieldEllipsis className="h-5 w-5 text-cyan-700 dark:text-cyan-100" />
                <div>
                  <p className="text-sm font-semibold text-slate-950 dark:text-white">Selected setup</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {difficultyConfig[difficulty].label} · {maxPlayers}-player bracket
                  </p>
                </div>
              </div>
            </div>

            {isAuthenticated ? (
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Hosting as <span className="font-semibold text-slate-950 dark:text-white">{profile?.username ?? user?.email?.split('@')[0] ?? 'Player'}</span>.
              </p>
            ) : (
              <div className="rounded-[1.6rem] border border-amber-200 bg-amber-100/80 p-4 text-sm text-amber-950 dark:border-amber-300/20 dark:bg-amber-400/10 dark:text-amber-50">
                Sign in to create a tournament.
                <Link
                  to={buildAuthRedirectPath('/tournaments')}
                  className="ml-2 font-semibold underline underline-offset-4"
                >
                  Go to login
                </Link>
              </div>
            )}

            {createFeedback ? (
              <div className="rounded-[1.4rem] border border-rose-200 bg-rose-100/85 px-4 py-3 text-sm text-rose-950 dark:border-rose-300/20 dark:bg-rose-400/10 dark:text-rose-100">
                {createFeedback}
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => void handleCreateTournament()}
              disabled={actionLoading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-[color:#f8fbff] shadow-[0_12px_30px_rgba(15,23,42,0.18)] transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-white dark:text-slate-950 dark:hover:bg-cyan-50"
            >
              {actionLoading ? 'Creating tournament...' : 'Create Tournament'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <section className="rounded-[2rem] border border-slate-200/90 bg-white/82 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-sm dark:border-white/10 dark:bg-white/6 dark:shadow-[0_18px_60px_rgba(2,8,24,0.35)]">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              Join tournament
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold text-slate-950 dark:text-white">
              Enter a code
            </h2>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-slate-950 dark:text-white">Tournament code</span>
                <input
                  value={tournamentCode}
                  onChange={(event) => setTournamentCode(event.target.value.toUpperCase())}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm uppercase tracking-[0.18em] text-slate-950 outline-none transition focus:border-cyan-300 dark:border-white/10 dark:bg-slate-950/55 dark:text-white"
                  placeholder="AB12CD"
                  maxLength={6}
                />
              </label>

              {joinFeedback ? (
                <div className="rounded-[1.4rem] border border-rose-200 bg-rose-100/85 px-4 py-3 text-sm text-rose-950 dark:border-rose-300/20 dark:bg-rose-400/10 dark:text-rose-100">
                  {joinFeedback}
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => void handleJoinTournament()}
                disabled={actionLoading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/12 px-6 py-3 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-400/18 disabled:cursor-not-allowed disabled:opacity-70 dark:text-cyan-100 dark:hover:bg-cyan-400/20"
              >
                {actionLoading ? 'Joining tournament...' : 'Join Tournament'}
              </button>
            </div>
          </section>

          <CommunityCard compact />
        </div>
      </section>
    </div>
  )
}
