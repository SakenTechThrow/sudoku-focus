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
      className="group relative block overflow-hidden rounded-[2rem] border border-slate-200 bg-white/86 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-sm transition hover:-translate-y-1 hover:border-cyan-300/35 hover:bg-white/94 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 dark:border-white/10 dark:bg-white/6 dark:shadow-[0_18px_60px_rgba(2,8,24,0.35)] dark:hover:border-cyan-300/25 dark:hover:bg-white/8"
    >
      <div
        className={cn(
          'absolute inset-x-0 top-0 h-24 bg-gradient-to-br opacity-100 transition group-hover:opacity-80',
          accent,
        )}
      />
      <div className="relative">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-900/10 bg-slate-950/6 text-cyan-700 dark:border-white/10 dark:bg-slate-950/60 dark:text-cyan-200">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="font-display text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
          {title}
        </h3>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>

        <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-cyan-700 transition group-hover:gap-3 dark:text-cyan-100">
          <span>{actionLabel}</span>
          <ArrowRight className="h-4 w-4" />
        </div>
      </div>
    </Link>
  )
}
