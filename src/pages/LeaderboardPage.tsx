import { RefreshCw, Trophy } from 'lucide-react'
import { useState } from 'react'
import { LeaderboardTable } from '../components/leaderboard/LeaderboardTable'
import { difficultyConfig, difficultyOrder } from '../constants/difficulty'
import { useLeaderboard } from '../hooks/useLeaderboard'
import type {
  LeaderboardDifficultyFilter,
  LeaderboardScope,
} from '../types/leaderboard'

export function LeaderboardPage() {
  const city = 'Almaty'
  const [scope, setScope] = useState<LeaderboardScope>('global')
  const [difficulty, setDifficulty] = useState<LeaderboardDifficultyFilter>('all')
  const { entries, loading, error, refetch } = useLeaderboard({
    scope,
    difficulty,
    city,
  })

  const scopeOptions: Array<{ value: LeaderboardScope; label: string }> = [
    { value: 'global', label: 'Global' },
    { value: 'city', label: city },
  ]

  const difficultyOptions: Array<{
    value: LeaderboardDifficultyFilter
    label: string
  }> = [
    { value: 'all', label: 'All' },
    ...difficultyOrder.map((level) => ({
      value: level,
      label: difficultyConfig[level].label,
    })),
  ]

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/6 p-6 shadow-[0_18px_60px_rgba(2,8,24,0.35)] backdrop-blur-sm sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)] lg:items-start">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/75">Leaderboard</p>
            <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Leaderboard
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
              Compete by score, speed, and accuracy.
            </p>
          </div>

          <div className="rounded-[1.8rem] border border-white/10 bg-slate-950/45 p-5">
            <div className="flex items-center gap-3 text-amber-100">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-amber-300/12">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Live snapshot</p>
                <p className="mt-1 font-medium text-white">
                  Top 50 {scope === 'city' ? `${city} ` : ''}results
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              Higher score. Faster time. Cleaner solve.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/6 p-6 shadow-[0_18px_60px_rgba(2,8,24,0.35)] backdrop-blur-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Scope</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {scopeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setScope(option.value)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      scope === option.value
                        ? 'bg-white text-slate-950'
                        : 'border border-white/10 bg-slate-950/45 text-slate-200 hover:border-cyan-300/25 hover:bg-slate-900/80'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Difficulty</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {difficultyOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setDifficulty(option.value)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      difficulty === option.value
                        ? 'bg-cyan-300/90 text-slate-950'
                        : 'border border-white/10 bg-slate-950/45 text-slate-200 hover:border-cyan-300/25 hover:bg-slate-900/80'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={refetch}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-400/10 px-5 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/16 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/6 p-4 shadow-[0_18px_60px_rgba(2,8,24,0.35)] backdrop-blur-sm sm:p-6">
        {loading ? (
          <div className="rounded-[1.8rem] border border-white/10 bg-slate-950/35 p-8 text-center">
            <p className="font-display text-2xl font-semibold text-white">Loading leaderboard...</p>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Pulling the latest results from Supabase.
            </p>
          </div>
        ) : error ? (
          <div className="rounded-[1.8rem] border border-rose-300/20 bg-rose-400/10 p-8 text-center">
            <p className="font-display text-2xl font-semibold text-white">Could not load the leaderboard</p>
            <p className="mt-3 text-sm leading-7 text-rose-50">{error}</p>
          </div>
        ) : (
          <LeaderboardTable entries={entries} />
        )}
      </section>
    </div>
  )
}
