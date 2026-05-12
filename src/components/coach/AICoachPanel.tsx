import { useEffect, useRef, useState } from 'react'
import {
  BrainCircuit,
  ChevronDown,
  ChevronUp,
  Lock,
  Sparkles,
  BookOpenText,
  TriangleAlert,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import type { CandidateValue } from '../../types/sudoku'
import type { AICoachStatus } from '../../hooks/useAICoach'

type AICoachPanelProps = {
  title: string
  message: string
  deeperExplanation: string
  suggestedNextStep: string
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
        badge: 'Fixed clue',
        icon: Lock,
        classes: 'border-sky-200 bg-sky-100/85 text-sky-950 dark:border-sky-300/20 dark:bg-sky-400/10 dark:text-sky-100',
      }
    case 'strong':
      return {
        badge: 'Strong move',
        icon: Sparkles,
        classes: 'border-emerald-200 bg-emerald-100/85 text-emerald-950 dark:border-emerald-300/20 dark:bg-emerald-400/10 dark:text-emerald-100',
      }
    case 'conflict':
      return {
        badge: 'Conflict',
        icon: TriangleAlert,
        classes: 'border-rose-200 bg-rose-100/85 text-rose-950 dark:border-rose-300/20 dark:bg-rose-400/10 dark:text-rose-100',
      }
    default:
      return {
        badge: 'Learning tip',
        icon: BrainCircuit,
        classes: 'border-amber-200 bg-amber-100/85 text-amber-950 dark:border-amber-300/20 dark:bg-amber-400/10 dark:text-amber-50',
      }
  }
}

function getIsMobileViewport() {
  if (typeof window === 'undefined') {
    return false
  }

  return window.matchMedia('(max-width: 1023px)').matches
}

export function AICoachPanel({
  title,
  message,
  deeperExplanation,
  suggestedNextStep,
  possibleValues,
  status,
  confidence,
  focusSignal,
  onRefresh,
}: AICoachPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const statusMeta = getStatusMeta(status)
  const StatusIcon = statusMeta.icon
  const [isMobileViewport, setIsMobileViewport] = useState(getIsMobileViewport)
  const [isCollapsed, setIsCollapsed] = useState(getIsMobileViewport)
  const [isTeachingExpanded, setIsTeachingExpanded] = useState(false)

  function handleTeachMeWhy() {
    if (isTeachingExpanded) {
      setIsTeachingExpanded(false)
      return
    }

    onRefresh()
    setIsTeachingExpanded(true)
  }

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 1023px)')

    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobileViewport(event.matches)
      setIsCollapsed((current) => (event.matches ? current : false))
    }

    setIsMobileViewport(mediaQuery.matches)
    setIsCollapsed((current) => (mediaQuery.matches ? current : false))

    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  useEffect(() => {
    if (focusSignal === 0) {
      return
    }

    if (isMobileViewport) {
      setIsCollapsed(false)
    }

    panelRef.current?.focus()
  }, [focusSignal, isMobileViewport])

  useEffect(() => {
    setIsTeachingExpanded(false)
  }, [title, message, status])

  return (
    <section
      ref={panelRef}
      tabIndex={-1}
      className="rounded-[1.8rem] border border-slate-200/90 bg-white/82 p-4 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-sm outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 dark:border-white/10 dark:bg-white/6 dark:shadow-[0_18px_60px_rgba(2,8,24,0.35)] sm:p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-700 dark:text-cyan-200/75">AI Coach</p>
          <h2 className="mt-2 font-display text-xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-2xl">
            {title}
          </h2>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {isMobileViewport ? (
            <button
              type="button"
              onClick={() => setIsCollapsed((current) => !current)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 transition hover:border-cyan-300/35 hover:bg-cyan-50/70 dark:border-white/10 dark:bg-slate-950/55 dark:text-slate-200 dark:hover:bg-slate-900/80"
            >
              {isCollapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
              {isCollapsed ? 'Show AI Coach' : 'Hide AI Coach'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleTeachMeWhy}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 transition hover:border-cyan-300/35 hover:bg-cyan-50/70 dark:border-white/10 dark:bg-slate-950/55 dark:text-slate-200 dark:hover:bg-slate-900/80"
            >
              <BookOpenText className="h-3.5 w-3.5" />
              {isTeachingExpanded ? 'Hide details' : 'Teach me why'}
            </button>
          )}
        </div>
      </div>

      {!isCollapsed ? (
        <>
          <div className="mt-4 lg:hidden">
            <button
              type="button"
              onClick={handleTeachMeWhy}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 transition hover:border-cyan-300/35 hover:bg-cyan-50/70 dark:border-white/10 dark:bg-slate-950/55 dark:text-slate-200 dark:hover:bg-slate-900/80"
            >
              <BookOpenText className="h-3.5 w-3.5" />
              {isTeachingExpanded ? 'Hide details' : 'Teach me why'}
            </button>
          </div>

          <div className={cn('mt-4 rounded-[1.4rem] border p-4', statusMeta.classes)}>
            <div className="flex flex-wrap items-center gap-2">
              <StatusIcon className="h-4 w-4" />
              <span className="text-xs uppercase tracking-[0.24em]">{statusMeta.badge}</span>
              <span className="rounded-full border border-current/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] opacity-80">
                {confidence}
              </span>
            </div>
            <p className="mt-3 text-sm leading-7">{message}</p>
          </div>

          <div className="mt-4 rounded-[1.3rem] border border-slate-200 bg-slate-50/90 px-4 py-3 dark:border-white/10 dark:bg-slate-950/45">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Suggested next step</p>
            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">{suggestedNextStep}</p>
          </div>

          <div className="mt-4 flex items-center justify-end gap-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">Press C to focus the coach</p>
          </div>

          {possibleValues.length > 0 ? (
            <div className="mt-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Possible values</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {possibleValues.map((value) => (
                  <span
                    key={value}
                    className="inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-cyan-200 bg-cyan-100/85 px-3 text-sm font-semibold text-cyan-950 dark:border-cyan-300/20 dark:bg-cyan-400/10 dark:text-cyan-100"
                  >
                    {value}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {isTeachingExpanded ? (
            <div className="mt-4 rounded-[1.3rem] border border-slate-200 bg-white/92 px-4 py-4 dark:border-white/10 dark:bg-slate-950/55">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Why this strategy works</p>
              <p className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-200">{deeperExplanation}</p>
            </div>
          ) : null}
        </>
      ) : (
        <div className="mt-3 rounded-[1.3rem] border border-slate-200 bg-slate-50/90 px-4 py-3 text-sm text-slate-600 dark:border-white/10 dark:bg-slate-950/45 dark:text-slate-300">
          Open the coach when you want a quick strategy tip or a deeper explanation for the selected cell.
        </div>
      )}
    </section>
  )
}
