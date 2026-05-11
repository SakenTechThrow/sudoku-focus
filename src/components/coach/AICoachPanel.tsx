import { useEffect, useRef } from 'react'
import {
  BrainCircuit,
  Lock,
  RefreshCcw,
  Sparkles,
  Target,
  TriangleAlert,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import type { CandidateValue } from '../../types/sudoku'
import type { AICoachStatus } from '../../hooks/useAICoach'

type AICoachPanelProps = {
  title: string
  message: string
  possibleValues: CandidateValue[]
  status: AICoachStatus
  confidence: string
  focusSignal: number
  onRefresh: () => void
}

function getStatusMeta(status: AICoachStatus) {
  switch (status) {
    case 'fixed':
      return {
        badge: 'Locked clue',
        icon: Lock,
        classes: 'border-sky-300/20 bg-sky-400/10 text-sky-100',
      }
    case 'empty':
      return {
        badge: 'Candidate scan',
        icon: Target,
        classes: 'border-cyan-300/20 bg-cyan-400/10 text-cyan-100',
      }
    case 'filled':
      return {
        badge: 'Confirmed move',
        icon: Sparkles,
        classes: 'border-emerald-300/20 bg-emerald-400/10 text-emerald-100',
      }
    case 'incorrect':
      return {
        badge: 'Needs review',
        icon: TriangleAlert,
        classes: 'border-rose-300/20 bg-rose-400/10 text-rose-100',
      }
    default:
      return {
        badge: 'General tip',
        icon: BrainCircuit,
        classes: 'border-amber-300/20 bg-amber-400/10 text-amber-50',
      }
  }
}

export function AICoachPanel({
  title,
  message,
  possibleValues,
  status,
  confidence,
  focusSignal,
  onRefresh,
}: AICoachPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const statusMeta = getStatusMeta(status)
  const StatusIcon = statusMeta.icon

  useEffect(() => {
    if (focusSignal === 0) {
      return
    }

    panelRef.current?.focus()
  }, [focusSignal])

  return (
    <section
      ref={panelRef}
      tabIndex={-1}
      className="rounded-[2rem] border border-white/10 bg-white/6 p-5 shadow-[0_18px_60px_rgba(2,8,24,0.35)] backdrop-blur-sm outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/75">AI Coach</p>
          <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-white">
            {title}
          </h2>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/55 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-cyan-300/25 hover:bg-slate-900/80"
        >
          <RefreshCcw className="h-3.5 w-3.5" />
          Explain this cell
        </button>
      </div>

      <div className={cn('mt-5 rounded-[1.5rem] border p-4', statusMeta.classes)}>
        <div className="flex items-center gap-2">
          <StatusIcon className="h-4 w-4" />
          <span className="text-xs uppercase tracking-[0.24em]">{statusMeta.badge}</span>
        </div>
        <p className="mt-3 text-sm leading-7">{message}</p>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-100">{confidence}</p>
        <p className="text-xs text-slate-400">Press C to focus the coach</p>
      </div>

      {possibleValues.length > 0 ? (
        <div className="mt-4">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Possible values</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {possibleValues.map((value) => (
              <span
                key={value}
                className="inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 text-sm font-semibold text-cyan-100"
              >
                {value}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}
