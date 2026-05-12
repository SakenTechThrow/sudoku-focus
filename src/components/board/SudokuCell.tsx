import { cn } from '../../lib/utils'
import type { CandidateValue, CellValue } from '../../types/sudoku'

const noteValues: CandidateValue[] = [1, 2, 3, 4, 5, 6, 7, 8, 9]

type SudokuCellProps = {
  value: CellValue
  notes: CandidateValue[]
  isFixed: boolean
  isSelected: boolean
  isHighlighted: boolean
  isCorrect?: boolean
  isWrong?: boolean
  isConflicting: boolean
  isRecentlyPlacedCorrect?: boolean
  isRecentlyPlacedWrong?: boolean
  isDisabled?: boolean
  onClick: () => void
}

export function SudokuCell({
  value,
  notes,
  isFixed,
  isSelected,
  isHighlighted,
  isCorrect = false,
  isWrong = false,
  isConflicting,
  isRecentlyPlacedCorrect = false,
  isRecentlyPlacedWrong = false,
  isDisabled = false,
  onClick,
}: SudokuCellProps) {
  const ariaStatus = isFixed
    ? 'Fixed clue'
    : isWrong
      ? 'Incorrect value'
      : isCorrect
        ? 'Correct value'
        : value === 0
          ? 'Empty cell'
          : `Value ${value}`

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        'flex aspect-square w-full items-center justify-center text-sm font-semibold transition sm:text-lg md:text-xl',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 focus-visible:ring-inset',
        isFixed && 'bg-slate-900/95 text-white dark:bg-slate-900/95',
        !isFixed && 'bg-slate-950/80 text-cyan-100 hover:bg-slate-900/80 dark:text-cyan-100',
        isHighlighted && !isSelected && !isCorrect && !isWrong && 'bg-cyan-400/10 dark:bg-cyan-400/10',
        isCorrect && 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-300/60 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/40',
        isWrong && 'bg-rose-50 text-rose-700 ring-1 ring-rose-300/70 dark:bg-rose-400/12 dark:text-rose-200 dark:ring-rose-400/50',
        isSelected && 'bg-cyan-300/25 ring-2 ring-cyan-300/75 ring-inset',
        isConflicting && !isWrong && 'ring-1 ring-amber-300/65 ring-inset dark:ring-amber-300/35',
        isRecentlyPlacedCorrect && 'animate-sudoku-correct',
        isRecentlyPlacedWrong && 'animate-sudoku-wrong',
        isDisabled && 'cursor-not-allowed',
      )}
      aria-label={value === 0 ? ariaStatus : `Cell value ${value}. ${ariaStatus}`}
      title={ariaStatus}
    >
      {value !== 0 ? (
        value
      ) : notes.length > 0 ? (
        <span className="grid h-full w-full grid-cols-3 grid-rows-3 gap-px p-1 text-[0.42rem] font-medium text-slate-300 sm:text-[0.56rem]">
          {noteValues.map((note) => (
            <span
              key={note}
              className={cn(
                'flex items-center justify-center',
                notes.includes(note) ? 'text-slate-200' : 'text-transparent',
              )}
            >
              {note}
            </span>
          ))}
        </span>
      ) : (
        <span className="h-1.5 w-1.5 rounded-full bg-cyan-200/35 sm:h-2 sm:w-2" />
      )}
    </button>
  )
}
