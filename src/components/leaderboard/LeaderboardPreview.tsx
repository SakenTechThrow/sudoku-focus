import { Trophy } from 'lucide-react'
import { leaderboardPreview } from '../../constants/site'

export function LeaderboardPreview() {
  return (
    <section className="rounded-[2rem] border border-slate-900/10 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-sm dark:border-white/10 dark:bg-white/6 dark:shadow-[0_18px_60px_rgba(2,8,24,0.35)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-amber-700 dark:text-amber-200/75">
            Community Energy
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
            City leaderboard snapshot
          </h2>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-900/10 bg-amber-300/18 text-amber-800 dark:border-white/10 dark:bg-amber-300/12 dark:text-amber-100">
          <Trophy className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {leaderboardPreview.map((entry) => (
          <div
            key={entry.rank}
            className="flex items-center justify-between rounded-2xl border border-slate-900/10 bg-slate-950/6 px-4 py-3 dark:border-white/10 dark:bg-slate-950/45"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950/7 text-sm font-semibold text-slate-950 dark:bg-white/8 dark:text-white">
                #{entry.rank}
              </div>
              <div>
                <p className="font-medium text-slate-950 dark:text-white">{entry.name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{entry.city}</p>
              </div>
            </div>
            <p className="text-sm text-amber-800 dark:text-amber-100/85">{entry.streak}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
