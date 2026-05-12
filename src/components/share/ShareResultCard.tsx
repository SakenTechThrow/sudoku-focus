import { useState } from 'react'
import { Check, Copy, Share2 } from 'lucide-react'
import { createShareText } from '../../lib/shareResult'
import type { Difficulty } from '../../types/sudoku'

type ShareResultCardProps = {
  mode: 'game' | 'daily'
  difficulty: Difficulty
  timeSeconds: number
  mistakes: number
  hintsUsed: number
  score: number
  url: string
  className?: string
}

function formatTime(timeSeconds: number) {
  const minutes = Math.floor(timeSeconds / 60)
  const seconds = timeSeconds % 60

  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

export function ShareResultCard({
  mode,
  difficulty,
  timeSeconds,
  mistakes,
  hintsUsed,
  score,
  url,
  className,
}: ShareResultCardProps) {
  const [copied, setCopied] = useState(false)

  const shareText = createShareText({
    mode,
    difficulty,
    timeSeconds,
    mistakes,
    hintsUsed,
    score,
    url,
  })

  async function handleCopyResult() {
    try {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2200)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section className={`rounded-[1.6rem] border border-slate-200/90 bg-white/82 p-4 shadow-[0_14px_40px_rgba(15,23,42,0.12)] backdrop-blur-sm dark:border-white/10 dark:bg-white/6 dark:shadow-[0_18px_60px_rgba(2,8,24,0.35)] ${className ?? ''}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-400/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-800 dark:border-cyan-300/20 dark:bg-cyan-400/8 dark:text-cyan-100">
            <Share2 className="h-3.5 w-3.5" />
            Share result
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Copy a clean result summary and invite others to take on the same challenge.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void handleCopyResult()}
          className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-[color:#f8fbff] transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-cyan-50"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copied!' : 'Copy Result'}
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-3 dark:border-white/10 dark:bg-slate-950/45">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Score</p>
          <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">{score}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-3 dark:border-white/10 dark:bg-slate-950/45">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Time</p>
          <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">{formatTime(timeSeconds)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-3 dark:border-white/10 dark:bg-slate-950/45">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Mistakes</p>
          <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">{mistakes}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-3 dark:border-white/10 dark:bg-slate-950/45">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Hints</p>
          <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">{hintsUsed}</p>
        </div>
      </div>

      <p className="mt-4 text-xs leading-6 text-slate-500 dark:text-slate-400">
        {mode === 'daily'
          ? 'Includes a link back to today’s Daily Challenge.'
          : 'Includes a link back to Play Mode so friends can try a fresh puzzle.'}
      </p>
    </section>
  )
}
