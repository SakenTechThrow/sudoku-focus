import { Clock3, Lightbulb, NotebookPen, TriangleAlert } from 'lucide-react'
import type { Difficulty, GameStatus } from '../../types/sudoku'

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
  hasStarted: boolean
  isPaused: boolean
  status?: GameStatus
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
  hasStarted,
  isPaused,
  status = 'playing',
  eyebrow = 'Play',
  title = 'Focus Session',
  description = 'Generated puzzles now drive the experience, with difficulty-aware sessions that still preserve timer tracking, notes, hints, pause and resume, and saved progress.',
}: GameSessionHeaderProps) {
  const mistakesRemaining = Math.max(0, mistakeLimit - mistakes)
  const mistakeSummary = status === 'lost'
    ? 'Game over. You used all 3 mistakes.'
    : mistakesRemaining === 1
      ? 'Last chance. One mistake remains.'
      : `${mistakesRemaining} mistake${mistakesRemaining === 1 ? '' : 's'} left.`
  const timerSummary = status === 'won'
    ? 'Stopped after your winning solve'
    : status === 'lost'
      ? 'Stopped after game over'
      : !hasStarted
        ? 'Ready when you are'
      : isPaused
        ? 'Paused and ready to resume'
        : 'Running focus timer'

  return (
    <section className="overflow-hidden rounded-[1.8rem] border border-slate-200/90 bg-white/82 p-4 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-sm dark:border-white/10 dark:bg-white/6 dark:shadow-[0_18px_60px_rgba(2,8,24,0.35)]">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:items-start">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-700 dark:text-cyan-200/75">{eyebrow}</p>
          <h1 className="mt-2.5 font-display text-[1.8rem] font-semibold tracking-tight text-slate-950 dark:text-white sm:text-[2.1rem]">
            {title}
          </h1>
          <p className="mt-2.5 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            {description}
          </p>

          <div className="mt-3.5 max-w-2xl rounded-[1.4rem] border border-slate-200 bg-slate-50/90 p-3.5 dark:border-white/10 dark:bg-slate-950/45">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              Selected session
            </p>
            <div className="mt-2.5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="rounded-full bg-cyan-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-900 dark:bg-cyan-400/14 dark:text-cyan-100">
                    {difficulty}
                  </span>
                  {status !== 'playing' ? (
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-700 dark:border-white/10 dark:bg-white/8 dark:text-slate-200">
                      {status === 'won' ? 'Solved' : 'Game over'}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 font-display text-lg font-semibold text-slate-950 dark:text-white sm:text-xl">
                  {difficultyLabel}
                </p>
                <p className="mt-1 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {difficultyDescription}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
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

        <div className="grid gap-2.5 sm:grid-cols-2 lg:self-stretch">
          <div className="rounded-[1.25rem] border border-cyan-200/80 bg-gradient-to-br from-cyan-100 via-white to-white p-3 dark:border-cyan-300/18 dark:from-cyan-400/14 dark:via-transparent dark:to-transparent">
            <div className="flex items-center gap-2 text-cyan-800 dark:text-cyan-100">
              <Clock3 className="h-4 w-4" />
              <span className="text-xs uppercase tracking-[0.24em]">Timer</span>
            </div>
            <p className="mt-2 font-display text-[1.7rem] font-semibold text-slate-950 dark:text-white">{formattedTime}</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {timerSummary}
              {!hasStarted && status === 'playing'
                ? ' Press Start or make your first move.'
                : ''}
            </p>
          </div>

          <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50/90 p-3 dark:border-white/10 dark:bg-slate-950/45">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-100">
              <TriangleAlert className="h-4 w-4" />
              <span className="text-xs uppercase tracking-[0.24em]">Mistakes</span>
            </div>
            <p className="mt-2 font-display text-[1.7rem] font-semibold text-slate-950 dark:text-white">{mistakes}</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{mistakeSummary}</p>
          </div>

          <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50/90 p-3 dark:border-white/10 dark:bg-slate-950/45">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-100">
              <Lightbulb className="h-4 w-4" />
              <span className="text-xs uppercase tracking-[0.24em]">Hints used</span>
            </div>
            <p className="mt-2 font-display text-[1.7rem] font-semibold text-slate-950 dark:text-white">{hintsUsed}</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Reveal the next correct empty value.</p>
          </div>

          <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50/90 p-3 dark:border-white/10 dark:bg-slate-950/45">
            <div className="flex items-center gap-2 text-fuchsia-700 dark:text-fuchsia-100">
              <NotebookPen className="h-4 w-4" />
              <span className="text-xs uppercase tracking-[0.24em]">Notes mode</span>
            </div>
            <p className="mt-2 font-display text-[1.45rem] font-semibold text-slate-950 dark:text-white">
              {notesMode ? 'ON' : 'OFF'}
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {status === 'playing'
                ? (
                    <>
                      Press <span className="font-semibold text-slate-950 dark:text-white">N</span> to toggle candidates.
                    </>
                  )
                : 'Notes lock when the session ends.'}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
