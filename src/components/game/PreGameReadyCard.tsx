import { Play } from 'lucide-react'

type ReadyStat = {
  label: string
  value: string
}

type PreGameReadyCardProps = {
  eyebrow?: string
  title: string
  description: string
  actionLabel: string
  onStart: () => void
  stats: ReadyStat[]
  footnote?: string
}

export function PreGameReadyCard({
  eyebrow = 'Ready',
  title,
  description,
  actionLabel,
  onStart,
  stats,
  footnote,
}: PreGameReadyCardProps) {
  return (
    <section className="rounded-[1.9rem] border border-slate-200/90 bg-white/82 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-sm dark:border-white/10 dark:bg-white/6 dark:shadow-[0_18px_60px_rgba(2,8,24,0.35)] sm:p-6">
      <p className="text-xs uppercase tracking-[0.28em] text-cyan-700 dark:text-cyan-200/75">
        {eyebrow}
      </p>
      <h2 className="mt-3 font-display text-[2rem] font-semibold tracking-tight text-slate-950 dark:text-white sm:text-[2.35rem]">
        {title}
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
        {description}
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-[1.35rem] border border-slate-200 bg-slate-50/90 px-4 py-3 dark:border-white/10 dark:bg-slate-950/45"
          >
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
              {stat.label}
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-white sm:text-base">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {footnote ? (
        <div className="mt-5 rounded-[1.35rem] border border-cyan-200 bg-cyan-100/80 px-4 py-3 text-sm leading-6 text-cyan-950 dark:border-cyan-300/20 dark:bg-cyan-400/10 dark:text-cyan-50">
          {footnote}
        </div>
      ) : null}

      <div className="mt-6">
        <button
          type="button"
          onClick={onStart}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-[color:#f8fbff] transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-cyan-50 sm:w-auto"
        >
          <Play className="h-4 w-4" />
          {actionLabel}
        </button>
      </div>
    </section>
  )
}
