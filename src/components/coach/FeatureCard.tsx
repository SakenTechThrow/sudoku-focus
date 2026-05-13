import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { FeatureItem } from '../../types/site'
import { cn } from '../../lib/utils'

type FeatureCardProps = FeatureItem

export function FeatureCard({
  actionLabel,
  accent,
  description,
  icon: Icon,
  to,
  title,
}: FeatureCardProps) {
  return (
    <Link
      to={to}
      aria-label={`${title}: ${actionLabel}`}
      className="group relative block overflow-hidden rounded-[2rem] border border-slate-200/90 bg-white/88 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-sm transition hover:-translate-y-1 hover:border-cyan-300/35 hover:bg-white/96 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 dark:border-white/10 dark:bg-white/6 dark:shadow-[0_18px_60px_rgba(2,8,24,0.35)] dark:hover:border-cyan-300/25 dark:hover:bg-white/8"
    >
      <div
        className={cn(
          'absolute inset-x-0 top-0 h-24 bg-gradient-to-br opacity-100 transition group-hover:opacity-80',
          accent,
        )}
      />
      <div className="relative">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white/90 text-cyan-700 shadow-[0_10px_24px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-slate-950/60 dark:text-cyan-200 dark:shadow-none">
            <Icon className="h-5 w-5" />
          </div>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600 dark:border-white/10 dark:bg-slate-950/55 dark:text-slate-300">
            Feature
          </span>
        </div>
        <h3 className="font-display text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>

        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-cyan-700 transition group-hover:gap-3 group-hover:border-cyan-300/35 group-hover:bg-cyan-50/70 dark:border-white/10 dark:bg-slate-950/55 dark:text-cyan-100 dark:group-hover:bg-slate-900/80">
          <span>{actionLabel}</span>
          <ArrowRight className="h-4 w-4" />
        </div>
      </div>
    </Link>
  )
}
