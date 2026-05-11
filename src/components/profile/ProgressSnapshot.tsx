import { progressMetrics } from '../../constants/site'

export function ProgressSnapshot() {
  return (
    <section className="rounded-[2rem] border border-slate-900/10 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-sm dark:border-white/10 dark:bg-white/6 dark:shadow-[0_18px_60px_rgba(2,8,24,0.35)]">
      <p className="text-xs uppercase tracking-[0.28em] text-emerald-700 dark:text-emerald-200/75">
        Personal Momentum
      </p>
      <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
        Progress at a glance
      </h2>
      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
        The profile experience will turn performance into a motivating weekly story.
      </p>

      <div className="mt-6 grid gap-3">
        {progressMetrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-2xl border border-slate-900/10 bg-slate-950/6 p-4 dark:border-white/10 dark:bg-slate-950/45"
          >
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm text-slate-500 dark:text-slate-400">{metric.label}</p>
              <p className="font-display text-2xl font-semibold text-slate-950 dark:text-white">{metric.value}</p>
            </div>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{metric.detail}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
