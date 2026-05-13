import { ArrowUpRight, MessageCircleHeart, Users2 } from 'lucide-react'
import { TELEGRAM_COMMUNITY_URL } from '../../constants/community'
import { cn } from '../../lib/utils'

type CommunityCardProps = {
  compact?: boolean
  className?: string
}

export function CommunityCard({ compact = false, className }: CommunityCardProps) {
  return (
    <section
      className={cn(
        'overflow-hidden rounded-[2rem] border border-slate-200/90 bg-white/82 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-sm dark:border-white/10 dark:bg-white/6 dark:shadow-[0_18px_60px_rgba(2,8,24,0.35)]',
        compact ? 'p-5' : 'p-6 sm:p-7',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-400/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-800 dark:border-cyan-300/20 dark:bg-cyan-400/8 dark:text-cyan-100">
            <Users2 className="h-3.5 w-3.5" />
            Community
          </div>
          <h2 className={cn(
            'mt-4 font-display font-semibold tracking-tight text-slate-950 dark:text-white',
            compact ? 'text-2xl' : 'text-3xl sm:text-[2rem]',
          )}
          >
            Join the Sudoku Focus Community
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
            Daily drops, updates, and player chat.
          </p>
          <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-400">
            Share feedback. Invite friends. Follow releases.
          </p>
        </div>

        <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white/90 text-cyan-700 shadow-[0_12px_30px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-slate-950/55 dark:text-cyan-100 dark:shadow-none sm:flex">
          <MessageCircleHeart className="h-6 w-6" />
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <a
          href={TELEGRAM_COMMUNITY_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-[color:#f8fbff] transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-cyan-50"
        >
          Join Telegram
          <ArrowUpRight className="h-4 w-4" />
        </a>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Open in Telegram
        </p>
      </div>
    </section>
  )
}
