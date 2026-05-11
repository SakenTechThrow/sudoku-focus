import { RefreshCw } from 'lucide-react'
import { DailyChallengeSession } from '../components/game/DailyChallengeSession'
import { useDailyChallenge } from '../hooks/useDailyChallenge'

export function DailyChallengePage() {
  const { challenge, challengeDate, loading, error, refetch } = useDailyChallenge()

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/6 p-6 shadow-[0_18px_60px_rgba(2,8,24,0.35)] backdrop-blur-sm sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)] lg:items-start">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/75">Daily Challenge</p>
            <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Daily Challenge
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
              One shared puzzle every day. Compete by score, speed, and accuracy.
            </p>
            <div className="mt-5 inline-flex items-center gap-3 rounded-full border border-white/10 bg-slate-950/45 px-4 py-2">
              <span className="text-xs uppercase tracking-[0.24em] text-cyan-200/80">Today</span>
              <span className="font-medium text-white">{challengeDate}</span>
            </div>
          </div>

          <div className="rounded-[1.8rem] border border-white/10 bg-slate-950/45 p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Challenge rules</p>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Everyone gets the same board for the day. Once you solve it, submit your result to lock in one official daily score.
            </p>
            <button
              type="button"
              onClick={refetch}
              disabled={loading}
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/16 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh challenge
            </button>
          </div>
        </div>
      </section>

      {loading ? (
        <section className="rounded-[2rem] border border-white/10 bg-white/6 p-8 text-center shadow-[0_18px_60px_rgba(2,8,24,0.35)] backdrop-blur-sm">
          <h2 className="font-display text-3xl font-semibold text-white">Loading today&apos;s challenge...</h2>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            Checking Supabase for the shared puzzle and creating it if this is the first visit today.
          </p>
        </section>
      ) : error ? (
        <section className="rounded-[2rem] border border-rose-300/20 bg-rose-400/10 p-8 text-center shadow-[0_18px_60px_rgba(2,8,24,0.35)] backdrop-blur-sm">
          <h2 className="font-display text-3xl font-semibold text-white">Failed to load the daily challenge</h2>
          <p className="mt-3 text-sm leading-7 text-rose-50">{error}</p>
        </section>
      ) : !challenge ? (
        <section className="rounded-[2rem] border border-white/10 bg-white/6 p-8 text-center shadow-[0_18px_60px_rgba(2,8,24,0.35)] backdrop-blur-sm">
          <h2 className="font-display text-3xl font-semibold text-white">No challenge available</h2>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            Today&apos;s challenge could not be prepared yet. Try refreshing in a moment.
          </p>
        </section>
      ) : (
        <DailyChallengeSession challenge={challenge} />
      )}
    </div>
  )
}
