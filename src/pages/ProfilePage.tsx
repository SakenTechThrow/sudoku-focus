import { BarChart3, MapPin, Sparkles, UserCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useProfileStats } from '../hooks/useProfileStats'
import { cn } from '../lib/utils'

function formatTime(timeSeconds: number | null) {
  if (timeSeconds == null) {
    return '--:--'
  }

  const minutes = Math.floor(timeSeconds / 60)
  const seconds = timeSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

function formatStreakDate(value: string | null) {
  if (!value) {
    return 'No daily challenge completed yet'
  }

  const date = new Date(`${value}T00:00:00Z`)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

export function ProfilePage() {
  const { isAuthenticated, loading, profile, profileError, refreshProfile, user } = useAuth()
  const { stats, loading: statsLoading, error: statsError, hasGames } = useProfileStats()

  if (loading && isAuthenticated) {
    return (
      <section className="rounded-[2rem] border border-white/10 bg-white/6 p-6 shadow-[0_18px_60px_rgba(2,8,24,0.35)] backdrop-blur-sm sm:p-8">
        <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/75">Profile</p>
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Loading profile...
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
          We&apos;re syncing your identity and profile details from Supabase.
        </p>
      </section>
    )
  }

  if (!isAuthenticated && !loading) {
    return (
      <section className="rounded-[2rem] border border-white/10 bg-white/6 p-6 shadow-[0_18px_60px_rgba(2,8,24,0.35)] backdrop-blur-sm sm:p-8">
        <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/75">Profile</p>
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Sign in to unlock your profile
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
          Your profile stores identity, city, and the foundation for synced progress, leaderboard entries, and future game history.
        </p>
        <Link
          to="/auth"
          className="mt-8 inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-50"
        >
          Go to Login
        </Link>
      </section>
    )
  }

  if (isAuthenticated && !loading && !profile) {
    return (
      <section className="rounded-[2rem] border border-white/10 bg-white/6 p-6 shadow-[0_18px_60px_rgba(2,8,24,0.35)] backdrop-blur-sm sm:p-8">
        <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/75">Profile</p>
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Profile unavailable
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
          {profileError
            ? profileError
            : 'Your account is signed in, but your profile details could not be loaded yet. Try refreshing the profile.'}
        </p>
        <button
          type="button"
          onClick={() => void refreshProfile()}
          className="mt-8 inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-50"
        >
          Retry profile load
        </button>
      </section>
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-white/10 bg-white/6 p-6 shadow-[0_18px_60px_rgba(2,8,24,0.35)] backdrop-blur-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/75">Profile</p>
            <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              {profile?.username ?? 'Sudoku Focus User'}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
              Your account layer is connected. This page now surfaces identity details and a clean foundation for future synced stats.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void refreshProfile()}
            disabled={loading}
            className="rounded-full border border-cyan-300/25 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/16 disabled:cursor-not-allowed disabled:opacity-70"
          >
            Refresh Profile
          </button>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="rounded-[2rem] border border-white/10 bg-white/6 p-6 shadow-[0_18px_60px_rgba(2,8,24,0.35)] backdrop-blur-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
              <div className="flex items-center gap-2 text-cyan-100">
                <UserCircle2 className="h-4 w-4" />
                <span className="text-xs uppercase tracking-[0.24em]">Username</span>
              </div>
              <p className="mt-3 text-lg font-semibold text-white">{profile?.username ?? 'Sudoku Focus User'}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
              <div className="flex items-center gap-2 text-cyan-100">
                <Sparkles className="h-4 w-4" />
                <span className="text-xs uppercase tracking-[0.24em]">XP</span>
              </div>
              <p className="mt-3 text-lg font-semibold text-white">{profile?.xp ?? 0}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
              <div className="flex items-center gap-2 text-cyan-100">
                <Sparkles className="h-4 w-4" />
                <span className="text-xs uppercase tracking-[0.24em]">Games completed</span>
              </div>
              <p className="mt-3 text-lg font-semibold text-white">{stats.totalCompletedGames}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
              <div className="flex items-center gap-2 text-cyan-100">
                <Sparkles className="h-4 w-4" />
                <span className="text-xs uppercase tracking-[0.24em]">Total score</span>
              </div>
              <p className="mt-3 text-lg font-semibold text-white">{stats.totalScore}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
              <div className="flex items-center gap-2 text-cyan-100">
                <MapPin className="h-4 w-4" />
                <span className="text-xs uppercase tracking-[0.24em]">City</span>
              </div>
              <p className="mt-3 text-lg font-semibold text-white">{profile?.city ?? 'Almaty'}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
              <div className="flex items-center gap-2 text-cyan-100">
                <BarChart3 className="h-4 w-4" />
                <span className="text-xs uppercase tracking-[0.24em]">Email</span>
              </div>
              <p className="mt-3 break-all text-lg font-semibold text-white">{profile?.email ?? user?.email ?? 'No email found'}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[2rem] border border-white/10 bg-white/6 p-5 shadow-[0_18px_60px_rgba(2,8,24,0.35)] backdrop-blur-sm">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Daily streak</p>

            {statsLoading ? (
              <p className="mt-4 text-sm text-slate-300">Loading streak...</p>
            ) : statsError ? (
              <p className="mt-4 text-sm text-rose-100">{statsError}</p>
            ) : (
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                  <p className="text-sm text-slate-400">Current streak</p>
                  <p className="mt-2 font-display text-3xl font-semibold text-white">
                    {stats.currentDailyStreak} day{stats.currentDailyStreak === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                  <p className="text-sm text-slate-400">Best streak</p>
                  <p className="mt-2 font-display text-3xl font-semibold text-white">
                    {stats.bestDailyStreak} day{stats.bestDailyStreak === 1 ? '' : 's'}
                  </p>
                  <p className="mt-2 text-sm text-slate-300">
                    Last daily result: {formatStreakDate(stats.lastDailyDate)}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/6 p-5 shadow-[0_18px_60px_rgba(2,8,24,0.35)] backdrop-blur-sm">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Progress overview</p>

            {statsLoading ? (
              <p className="mt-4 text-sm text-slate-300">Loading stats...</p>
            ) : statsError ? (
              <p className="mt-4 text-sm text-rose-100">{statsError}</p>
            ) : !hasGames ? (
              <p className="mt-4 text-sm leading-7 text-slate-300">
                No completed games yet. Finish a puzzle to start building your stats.
              </p>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                  <p className="text-sm text-slate-400">Best time</p>
                  <p className="mt-2 font-display text-3xl font-semibold text-white">
                    {formatTime(stats.bestTime)}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                  <p className="text-sm text-slate-400">Average mistakes</p>
                  <p className="mt-2 font-display text-3xl font-semibold text-white">
                    {stats.averageMistakes.toFixed(1)}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                  <p className="text-sm text-slate-400">Total hints used</p>
                  <p className="mt-2 font-display text-3xl font-semibold text-white">
                    {stats.totalHintsUsed}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                  <p className="text-sm text-slate-400">Best score</p>
                  <p className="mt-2 font-display text-3xl font-semibold text-white">
                    {stats.bestScore}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/6 p-5 shadow-[0_18px_60px_rgba(2,8,24,0.35)] backdrop-blur-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Achievement badges</p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-white">Rewarding progress</h2>
          </div>
          <p className="max-w-2xl text-sm leading-7 text-slate-300">
            Unlock badges as you train daily, solve cleanly, and push into harder sessions.
          </p>
        </div>

        {statsLoading ? (
          <p className="mt-4 text-sm text-slate-300">Loading achievements...</p>
        ) : statsError ? (
          <p className="mt-4 text-sm text-rose-100">{statsError}</p>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {stats.achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={cn(
                  'rounded-[1.6rem] border p-4 transition',
                  achievement.unlocked
                    ? 'border-cyan-300/25 bg-gradient-to-br from-cyan-400/12 via-white/8 to-amber-300/10 shadow-[0_16px_40px_rgba(14,116,144,0.14)]'
                    : 'border-white/10 bg-slate-950/35',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/8 text-2xl">
                    <span aria-hidden="true">{achievement.icon}</span>
                  </div>
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]',
                      achievement.unlocked
                        ? 'bg-cyan-400/14 text-cyan-100'
                        : 'bg-white/8 text-slate-400',
                    )}
                  >
                    {achievement.unlocked ? 'Unlocked' : 'Locked'}
                  </span>
                </div>
                <p className="mt-4 font-display text-xl font-semibold text-white">{achievement.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{achievement.description}</p>
                {achievement.progressText ? (
                  <p className={cn(
                    'mt-3 text-sm font-medium',
                    achievement.unlocked ? 'text-cyan-100' : 'text-slate-400',
                  )}
                  >
                    {achievement.progressText}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/6 p-5 shadow-[0_18px_60px_rgba(2,8,24,0.35)] backdrop-blur-sm">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Recent games</p>
        {statsLoading ? (
          <p className="mt-4 text-sm text-slate-300">Loading recent games...</p>
        ) : statsError ? (
          <p className="mt-4 text-sm text-rose-100">{statsError}</p>
        ) : !hasGames ? (
          <p className="mt-4 text-sm leading-7 text-slate-300">
            Complete your first puzzle to see your recent sessions here.
          </p>
        ) : (
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {stats.recentGames.map((game) => (
              <div key={game.id} className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-white">{game.difficulty}</p>
                  <p className="text-sm text-cyan-100">{game.score} pts</p>
                </div>
                <p className="mt-2 text-sm text-slate-300">
                  {formatTime(game.timeSeconds)} · {game.mistakes} mistakes · {game.hintsUsed} hints
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
