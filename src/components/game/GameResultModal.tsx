import type { ReactNode } from 'react'
import { CheckCircle2, TriangleAlert } from 'lucide-react'
import { ConfettiBurst } from './ConfettiBurst'

type GameResultModalProps = {
  isOpen: boolean
  status: 'won' | 'lost'
  title: string
  subtitle: string
  difficultyLabel: string
  formattedTime: string
  mistakes: number
  hintsUsed: number
  score?: number
  xpGained?: number
  badgeLabel?: string
  extraContent?: ReactNode
  actions?: ReactNode
}

export function GameResultModal({
  isOpen,
  status,
  title,
  subtitle,
  difficultyLabel,
  formattedTime,
  mistakes,
  hintsUsed,
  score,
  xpGained,
  badgeLabel,
  extraContent,
  actions,
}: GameResultModalProps) {
  if (!isOpen) {
    return null
  }

  const isWon = status === 'won'

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/72 p-4 backdrop-blur-md">
      <div
        className={`relative w-full max-w-2xl overflow-hidden rounded-[2rem] border bg-slate-950/95 p-6 shadow-[0_24px_100px_rgba(2,8,24,0.55)] sm:p-7 ${
          isWon
            ? 'border-emerald-300/22'
            : 'border-rose-300/22'
        }`}
      >
        {isWon ? <ConfettiBurst /> : null}

        <div className="relative">
          {badgeLabel ? (
            <p className={`text-xs uppercase tracking-[0.26em] ${
              isWon ? 'text-emerald-200/75' : 'text-rose-200/75'
            }`}
            >
              {badgeLabel}
            </p>
          ) : null}

          <div className={`mt-4 flex h-14 w-14 items-center justify-center rounded-full ${
            isWon
              ? 'bg-emerald-400/15 text-emerald-200'
              : 'bg-rose-400/15 text-rose-200'
          }`}
          >
            {isWon ? <CheckCircle2 className="h-7 w-7" /> : <TriangleAlert className="h-7 w-7" />}
          </div>

          <h2 className="mt-5 font-display text-3xl font-semibold text-white sm:text-[2.15rem]">
            {title}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
            {subtitle}
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Difficulty</p>
              <p className="mt-2 font-display text-2xl font-semibold text-white">{difficultyLabel}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Time</p>
              <p className="mt-2 font-display text-2xl font-semibold text-white">{formattedTime}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Mistakes</p>
              <p className="mt-2 font-display text-2xl font-semibold text-white">{mistakes}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Hints used</p>
              <p className="mt-2 font-display text-2xl font-semibold text-white">{hintsUsed}</p>
            </div>
          </div>

          {typeof score === 'number' || typeof xpGained === 'number' ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {typeof score === 'number' ? (
                <div className="rounded-2xl border border-emerald-300/18 bg-emerald-400/10 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-emerald-100/75">Score</p>
                  <p className="mt-2 font-display text-3xl font-semibold text-white">{score}</p>
                </div>
              ) : null}
              {typeof xpGained === 'number' ? (
                <div className="rounded-2xl border border-cyan-300/18 bg-cyan-400/10 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/75">XP gained</p>
                  <p className="mt-2 font-display text-3xl font-semibold text-white">+{xpGained}</p>
                </div>
              ) : null}
            </div>
          ) : null}

          {extraContent ? <div className="mt-5">{extraContent}</div> : null}
          {actions ? <div className="mt-6">{actions}</div> : null}
        </div>
      </div>
    </div>
  )
}
