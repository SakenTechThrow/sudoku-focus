import { Delete } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { CandidateValue, CellPosition, CellValue } from '../../types/sudoku'

const padValues: CandidateValue[] = [1, 2, 3, 4, 5, 6, 7, 8, 9]

type NumberPadProps = {
  selectedCell: CellPosition | null
  selectedValue: CellValue
  selectedNotes: CandidateValue[]
  isSelectedCellFixed: boolean
  completed: boolean
  isPaused: boolean
  notesMode: boolean
  onValueSelect: (value: CandidateValue) => void
  onClear: () => void
}

export function NumberPad({
  selectedCell,
  selectedValue,
  selectedNotes,
  isSelectedCellFixed,
  completed,
  isPaused,
  notesMode,
  onValueSelect,
  onClear,
}: NumberPadProps) {
  const canEdit = selectedCell !== null && !isSelectedCellFixed && !completed && !isPaused

  return (
    <div className="rounded-[2rem] border border-slate-200/90 bg-white/82 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-sm dark:border-white/10 dark:bg-white/6 dark:shadow-[0_18px_60px_rgba(2,8,24,0.35)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-700 dark:text-cyan-200/75">Number Pad</p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            {isPaused
              ? 'The game is paused. Resume to continue playing.'
              : selectedCell
              ? `Selected cell: row ${selectedCell.row + 1}, column ${selectedCell.col + 1}`
              : 'Pick a cell to enter a number'}
          </p>
        </div>
        <div
          className={cn(
            'rounded-full border px-3 py-1 text-sm',
            notesMode
              ? 'border-fuchsia-200 bg-fuchsia-100/85 text-fuchsia-950 dark:border-fuchsia-300/30 dark:bg-fuchsia-400/10 dark:text-fuchsia-100'
              : 'border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-200',
          )}
        >
          {notesMode
            ? `Notes ${selectedNotes.length > 0 ? `(${selectedNotes.length})` : 'mode'}`
            : selectedValue === 0
              ? 'Empty'
              : `Value ${selectedValue}`}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-5">
        {padValues.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onValueSelect(value)}
            disabled={!canEdit}
            className={cn(
              'min-h-14 rounded-2xl border text-lg font-semibold transition',
              canEdit
                ? 'border-slate-200 bg-white text-slate-950 hover:border-cyan-300/35 hover:bg-cyan-50/75 dark:border-white/10 dark:bg-slate-950/70 dark:text-white dark:hover:bg-slate-900'
                : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:border-white/8 dark:bg-slate-950/40 dark:text-slate-500',
              notesMode && selectedNotes.includes(value) && canEdit && 'border-fuchsia-200 bg-fuchsia-100 text-fuchsia-950 dark:border-fuchsia-300/35 dark:bg-fuchsia-400/16 dark:text-fuchsia-50',
              !notesMode && selectedValue === value && canEdit && 'border-cyan-300/45 bg-cyan-100 text-cyan-950 dark:bg-cyan-400/14 dark:text-white',
            )}
          >
            {value}
          </button>
        ))}
        <button
          type="button"
          onClick={onClear}
          disabled={!canEdit}
          className={cn(
            'col-span-3 flex min-h-14 items-center justify-center gap-2 rounded-2xl border text-sm font-semibold transition sm:col-span-2',
            canEdit
              ? 'border-rose-200 bg-rose-100/85 text-rose-950 hover:border-rose-300 hover:bg-rose-100 dark:border-rose-400/25 dark:bg-rose-400/10 dark:text-rose-100 dark:hover:bg-rose-400/16'
              : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:border-white/8 dark:bg-slate-950/40 dark:text-slate-500',
          )}
        >
          <Delete className="h-4 w-4" />
          Clear / Delete
        </button>
      </div>
    </div>
  )
}
