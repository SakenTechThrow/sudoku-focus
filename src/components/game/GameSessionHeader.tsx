import { Clock3, Lightbulb, NotebookPen, TriangleAlert } from 'lucide-react'
import type { Difficulty } from '../../types/sudoku'

type GameSessionHeaderProps = {
  difficulty: Difficulty
  difficultyLabel: string
  difficultyDescription: string
  cellsToRemove?: number
  mistakeLimit: number
  formattedTime: string
  mistakes: number
  hintsUsed: number
  notesMode: boolean
  isPaused: boolean
  eyebrow?: string
  title?: string
  description?: string
}

export function GameSessionHeader({
  difficulty,
  difficultyLabel,
  difficultyDescription,
  cellsToRemove,
  mistakeLimit,
  formattedTime,
  mistakes,
  hintsUsed,
  notesMode,
  isPaused,
  eyebrow = 'Play',
  title = 'Focus Session',
  description = 'Generated puzzles now drive the experience, with difficulty-aware sessions that still preserve timer tracking, notes, hints, pause and resume, and saved progress.',
}: GameSessionHeaderProps) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200/90 bg-white/82 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-sm dark:border-white/10 dark:bg-white/6 dark:shadow-[0_18px_60px_rgba(2,8,24,0.35)] sm:p-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)] lg:items-start">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-700 dark:text-cyan-200/75">{eyebrow}</p>
          <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300">
            {description}
          </p>

          <div className="mt-6 max-w-2xl rounded-[1.8rem] border border-slate-200 bg-slate-50/90 p-5 dark:border-white/10 dark:bg-slate-950/45">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              Selected session
            </p>
            <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-cyan-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-900 dark:bg-cyan-400/14 dark:text-cyan-100">
                    {difficulty}
                  </span>
                </div>
                <p className="mt-3 font-display text-2xl font-semibold text-slate-950 dark:text-white">
                  {difficultyLabel}
                </p>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {difficultyDescription}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 sm:justify-end">
                {typeof cellsToRemove === 'number' ? (
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 dark:border-white/10 dark:bg-white/8 dark:text-slate-200">
                    {cellsToRemove} cells removed
                  </span>
                ) : null}
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 dark:border-white/10 dark:bg-white/8 dark:text-slate-200">
                  {mistakeLimit} mistake limit
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-cyan-200/80 bg-gradient-to-br from-cyan-100 via-white to-white p-4 dark:border-cyan-300/18 dark:from-cyan-400/14 dark:via-transparent dark:to-transparent">
            <div className="flex items-center gap-2 text-cyan-800 dark:text-cyan-100">
              <Clock3 className="h-4 w-4" />
              <span className="text-xs uppercase tracking-[0.24em]">Timer</span>
            </div>
            <p className="mt-3 font-display text-4xl font-semibold text-slate-950 dark:text-white">{formattedTime}</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {isPaused ? 'Paused and ready to resume' : 'Running focus timer'}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4 dark:border-white/10 dark:bg-slate-950/45">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-100">
              <TriangleAlert className="h-4 w-4" />
              <span className="text-xs uppercase tracking-[0.24em]">Mistakes</span>
            </div>
            <p className="mt-3 font-display text-4xl font-semibold text-slate-950 dark:text-white">{mistakes}</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Wrong entries are counted instantly. Limit: {mistakeLimit}.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4 dark:border-white/10 dark:bg-slate-950/45">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-100">
              <Lightbulb className="h-4 w-4" />
              <span className="text-xs uppercase tracking-[0.24em]">Hints used</span>
            </div>
            <p className="mt-3 font-display text-4xl font-semibold text-slate-950 dark:text-white">{hintsUsed}</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Reveal the next correct empty value.</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4 dark:border-white/10 dark:bg-slate-950/45">
            <div className="flex items-center gap-2 text-fuchsia-700 dark:text-fuchsia-100">
              <NotebookPen className="h-4 w-4" />
              <span className="text-xs uppercase tracking-[0.24em]">Notes mode</span>
            </div>
            <p className="mt-3 font-display text-3xl font-semibold text-slate-950 dark:text-white">
              {notesMode ? 'ON' : 'OFF'}
            </p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Press <span className="font-semibold text-slate-950 dark:text-white">N</span> to toggle candidates.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
