import { BookOpen, ExternalLink } from 'lucide-react'

type NFactorialAdCardProps = {
  onDismiss: () => void
  href?: string
}

const DEFAULT_NFACTORIAL_URL = 'https://nfactorial.school'

export function NFactorialAdCard({
  onDismiss,
  href = DEFAULT_NFACTORIAL_URL,
}: NFactorialAdCardProps) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-amber-200/90 bg-[radial-gradient(circle_at_top_left,_rgba(255,245,196,0.95),_rgba(255,255,255,0.96)_52%,_rgba(240,249,255,0.9)_100%)] p-5 shadow-[0_18px_60px_rgba(15,23,42,0.12)] dark:border-amber-300/20 dark:bg-[radial-gradient(circle_at_top_left,_rgba(250,204,21,0.18),_rgba(15,23,42,0.94)_55%,_rgba(8,47,73,0.92)_100%)] dark:shadow-[0_18px_60px_rgba(2,8,24,0.35)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/70 bg-white/85 text-amber-600 shadow-[0_10px_24px_rgba(251,191,36,0.22)] dark:border-white/10 dark:bg-white/8 dark:text-amber-200">
          <BookOpen className="h-5 w-5" />
        </div>
        <span className="rounded-full border border-amber-200 bg-white/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-700 dark:border-amber-300/20 dark:bg-white/10 dark:text-amber-100">
          Sponsored learning break
        </span>
      </div>

      <h2 className="mt-5 font-display text-2xl font-semibold text-slate-950 dark:text-white">
        Boost your problem-solving skills with nFactorial
      </h2>
      <p className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-200">
        You have used several hints. Want to improve your logic, coding, and product-building skills? Explore nFactorial courses and incubator opportunities.
      </p>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-[color:#f8fbff] transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-amber-50"
        >
          Explore nFactorial
          <ExternalLink className="h-4 w-4" />
        </a>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-amber-300 hover:bg-amber-50/70 dark:border-white/10 dark:bg-white/8 dark:text-slate-100 dark:hover:bg-white/12"
        >
          Maybe later
        </button>
      </div>
    </section>
  )
}
