import {
  CheckCircle2,
  Eraser,
  Lightbulb,
  Pause,
  Play,
  RotateCcw,
  SaveOff,
  SquarePen,
  TriangleAlert,
  WandSparkles,
} from 'lucide-react'
import { NumberPad } from '../board/NumberPad'
import { DifficultySelector } from './DifficultySelector'
import { cn } from '../../lib/utils'
import type { CandidateValue, CellPosition, CheckResult, Difficulty } from '../../types/sudoku'

type GameControlPanelProps = {
  difficulty: Difficulty
  selectedCell: CellPosition | null
  selectedValue: CandidateValue | 0
  selectedNotes: CandidateValue[]
  isSelectedCellFixed: boolean
  completed: boolean
  isPaused: boolean
  isComplete: boolean
  checkResult: CheckResult | null
  notesMode: boolean
  hintsUsed: number
  hintActionLabel?: string
  onDifficultySelect: (difficulty: Difficulty) => void
  onValueSelect: (value: CandidateValue) => void
  onClear: () => void
  onToggleNotesMode: () => void
  onRevealHint: () => void
  onCheckSolution: () => CheckResult
  onStartNewGame: () => void
  onResetGame: () => void
  onTogglePause: () => void
  onClearSavedProgress: () => void
  showDifficultySelector?: boolean
  showStartNewGame?: boolean
  showClearSavedProgress?: boolean
  startNewGameLabel?: string
  clearSavedProgressLabel?: string
}

export function GameControlPanel({
  difficulty,
  selectedCell,
  selectedValue,
  selectedNotes,
  isSelectedCellFixed,
  completed,
  isPaused,
  isComplete,
  checkResult,
  notesMode,
  hintsUsed,
  hintActionLabel = 'Hint',
  onDifficultySelect,
  onValueSelect,
  onClear,
  onToggleNotesMode,
  onRevealHint,
  onCheckSolution,
  onStartNewGame,
  onResetGame,
  onTogglePause,
  onClearSavedProgress,
  showDifficultySelector = true,
  showStartNewGame = true,
  showClearSavedProgress = true,
  startNewGameLabel = 'New Game',
  clearSavedProgressLabel = 'Clear Saved Game',
}: GameControlPanelProps) {
  const canInteract = !completed && !isPaused

  return (
    <div className="space-y-6">
      {showDifficultySelector ? (
        <DifficultySelector currentDifficulty={difficulty} onSelect={onDifficultySelect} />
      ) : null}

      <NumberPad
        selectedCell={selectedCell}
        selectedValue={selectedValue}
        selectedNotes={selectedNotes}
        isSelectedCellFixed={isSelectedCellFixed}
        completed={completed}
        isPaused={isPaused}
        notesMode={notesMode}
        onValueSelect={onValueSelect}
        onClear={onClear}
      />

      <div className="rounded-[2rem] border border-slate-200/90 bg-white/82 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-sm dark:border-white/10 dark:bg-white/6 dark:shadow-[0_18px_60px_rgba(2,8,24,0.35)]">
        <div className="grid gap-3">
          {showStartNewGame ? (
            <button
              type="button"
              onClick={onStartNewGame}
              className="flex items-center justify-center gap-2 rounded-2xl border border-cyan-200 bg-cyan-100/85 px-4 py-3 text-sm font-semibold text-cyan-950 transition hover:border-cyan-300 hover:bg-cyan-100 dark:border-cyan-300/25 dark:bg-cyan-400/10 dark:text-cyan-100 dark:hover:bg-cyan-400/16"
            >
              <WandSparkles className="h-4 w-4" />
              {startNewGameLabel}
            </button>
          ) : null}

          <button
            type="button"
            onClick={onTogglePause}
            disabled={completed}
            className={cn(
              'flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition',
              completed
                ? 'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400 dark:border-white/8 dark:bg-slate-950/40 dark:text-slate-500'
                : 'bg-slate-950 text-[color:#f8fbff] hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-cyan-50',
            )}
          >
            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            {isPaused ? 'Resume Game' : 'Pause Game'}
          </button>

          <button
            type="button"
            onClick={onToggleNotesMode}
            disabled={!canInteract}
            className={cn(
              'flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition',
              notesMode && canInteract
                ? 'border-fuchsia-200 bg-fuchsia-100/85 text-fuchsia-950 dark:border-fuchsia-300/35 dark:bg-fuchsia-400/14 dark:text-fuchsia-100'
                : canInteract
                  ? 'border-slate-200 bg-white text-slate-900 hover:border-fuchsia-300/30 hover:bg-fuchsia-50/70 dark:border-white/10 dark:bg-slate-950/55 dark:text-white dark:hover:bg-slate-900/80'
                  : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:border-white/8 dark:bg-slate-950/40 dark:text-slate-500',
            )}
          >
            <SquarePen className="h-4 w-4" />
            {notesMode ? 'Notes Mode Active' : 'Enable Notes Mode'}
          </button>

          <button
            type="button"
            onClick={onRevealHint}
            disabled={!canInteract}
            className={cn(
              'flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition',
              canInteract
                ? 'border-emerald-200 bg-emerald-100/85 text-emerald-950 hover:border-emerald-300 hover:bg-emerald-100 dark:border-emerald-300/25 dark:bg-emerald-400/10 dark:text-emerald-100 dark:hover:bg-emerald-400/16'
                : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:border-white/8 dark:bg-slate-950/40 dark:text-slate-500',
            )}
          >
            <Lightbulb className="h-4 w-4" />
            {hintActionLabel}
            <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs text-inherit dark:bg-white/10">
              {hintsUsed}
            </span>
          </button>
        </div>

        <div className="mt-6 flex items-start gap-3">
          <TriangleAlert className="mt-0.5 h-5 w-5 text-amber-700 dark:text-amber-200" />
          <div>
            <p className="text-sm font-semibold text-slate-950 dark:text-white">Session status</p>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {isPaused
                ? 'The board is paused and protected from input.'
                : isComplete
                  ? 'Every cell is filled. Check the solution or keep reviewing flagged cells.'
                  : 'Numbers, notes, hints, and keyboard shortcuts are all live on this board.'}
            </p>
          </div>
        </div>

        {checkResult ? (
          <div
            className={cn(
              'mt-5 rounded-2xl border px-4 py-3 text-sm font-medium',
              checkResult.status === 'solved'
                ? 'border-emerald-200 bg-emerald-100/85 text-emerald-950 dark:border-emerald-300/25 dark:bg-emerald-400/10 dark:text-emerald-100'
                : checkResult.status === 'incorrect'
                  ? 'border-rose-200 bg-rose-100/85 text-rose-950 dark:border-rose-300/25 dark:bg-rose-400/10 dark:text-rose-100'
                  : 'border-amber-200 bg-amber-100/85 text-amber-950 dark:border-amber-300/25 dark:bg-amber-400/10 dark:text-amber-50',
            )}
          >
            {checkResult.message}
          </div>
        ) : null}

        <div className="mt-5 grid gap-3">
          <button
            type="button"
            onClick={onCheckSolution}
            disabled={isPaused}
            className={cn(
              'flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition',
              isPaused
                ? 'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400 dark:border-white/8 dark:bg-slate-950/40 dark:text-slate-500'
                : 'bg-slate-950 text-[color:#f8fbff] hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-cyan-50',
            )}
          >
            <CheckCircle2 className="h-4 w-4" />
            Check Solution
          </button>
          <button
            type="button"
            onClick={onClear}
            disabled={!canInteract}
            className={cn(
              'flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition',
              canInteract
                ? 'border-rose-200 bg-rose-100/85 text-rose-950 hover:border-rose-300 hover:bg-rose-100 dark:border-rose-400/25 dark:bg-rose-400/10 dark:text-rose-100 dark:hover:bg-rose-400/16'
                : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:border-white/8 dark:bg-slate-950/40 dark:text-slate-500',
            )}
          >
            <Eraser className="h-4 w-4" />
            Clear Value
          </button>
          <button
            type="button"
            onClick={onResetGame}
            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:border-cyan-300/35 hover:bg-cyan-50/70 dark:border-white/10 dark:bg-slate-950/55 dark:text-white dark:hover:bg-slate-900/80"
          >
            <RotateCcw className="h-4 w-4" />
            Reset Current Game
          </button>
          {showClearSavedProgress ? (
            <button
              type="button"
              onClick={onClearSavedProgress}
              className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:border-cyan-300/35 hover:bg-cyan-50/70 dark:border-white/10 dark:bg-slate-950/55 dark:text-white dark:hover:bg-slate-900/80"
            >
              <SaveOff className="h-4 w-4" />
              {clearSavedProgressLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
