import { isCellInSameBox, isSamePosition } from '../../lib/sudokuValidator'
import { cn } from '../../lib/utils'
import type {
  CellPosition,
  LastMove,
  NotesBoard,
  SudokuBoard as SudokuBoardType,
} from '../../types/sudoku'
import { SudokuCell } from './SudokuCell'

type SudokuBoardProps = {
  board: SudokuBoardType
  solution?: SudokuBoardType
  notes: NotesBoard
  fixedCells: boolean[][]
  selectedCell: CellPosition | null
  lastMove?: LastMove | null
  invalidCellKeys: Set<string>
  isPaused: boolean
  isInteractionLocked?: boolean
  celebrate?: boolean
  onSelectCell: (row: number, col: number) => void
}

function positionKey(row: number, col: number) {
  return `${row}:${col}`
}

export function SudokuBoard({
  board,
  solution,
  notes,
  fixedCells,
  selectedCell,
  lastMove = null,
  invalidCellKeys,
  isPaused,
  isInteractionLocked = false,
  celebrate = false,
  onSelectCell,
}: SudokuBoardProps) {
  return (
    <div className="relative w-full max-w-[32.5rem]">
      <div
        className={cn(
          'grid aspect-square grid-cols-9 overflow-hidden rounded-[1.35rem] border-2 border-slate-400/90 bg-slate-100/95 shadow-[0_24px_80px_rgba(148,163,184,0.28)] transition dark:border-white/14 dark:bg-slate-950/85 dark:shadow-[0_24px_80px_rgba(2,8,24,0.45)]',
          celebrate && 'sudoku-board-celebrate border-emerald-400/55 shadow-[0_24px_90px_rgba(16,185,129,0.2)] dark:border-emerald-300/28 dark:shadow-[0_24px_90px_rgba(16,185,129,0.26)]',
        )}
      >
        {board.flatMap((row, rowIndex) =>
          row.map((value, columnIndex) => {
            const isSelected =
              selectedCell !== null
              && isSamePosition(selectedCell, { row: rowIndex, col: columnIndex })

            const isHighlighted =
              selectedCell !== null
              && !isSelected
              && (
                selectedCell.row === rowIndex
                || selectedCell.col === columnIndex
                || isCellInSameBox(selectedCell.row, selectedCell.col, rowIndex, columnIndex)
              )

            const isEditableFilled = !fixedCells[rowIndex][columnIndex] && value !== 0
            const isCorrect = Boolean(
              solution
              && isEditableFilled
              && value === solution[rowIndex][columnIndex],
            )
            const isWrong = Boolean(
              solution
              && isEditableFilled
              && value !== solution[rowIndex][columnIndex],
            )
            const isConflicting =
              !fixedCells[rowIndex][columnIndex]
              && !isCorrect
              && invalidCellKeys.has(positionKey(rowIndex, columnIndex))
            const isRecentlyPlacedCorrect = Boolean(
              lastMove
              && lastMove.status === 'correct'
              && lastMove.row === rowIndex
              && lastMove.col === columnIndex,
            )
            const isRecentlyPlacedWrong = Boolean(
              lastMove
              && lastMove.status === 'wrong'
              && lastMove.row === rowIndex
              && lastMove.col === columnIndex,
            )

            return (
              <div
                key={positionKey(rowIndex, columnIndex)}
                className={cn(
                  'border-slate-200 dark:border-white/8',
                  rowIndex === 0 ? 'border-t-0' : 'border-t',
                  columnIndex === 0 ? 'border-l-0' : 'border-l',
                  rowIndex % 3 === 0 && rowIndex !== 0 && 'border-t-2 border-t-slate-400 dark:border-t-white/18',
                  columnIndex % 3 === 0 && columnIndex !== 0 && 'border-l-2 border-l-slate-400 dark:border-l-white/18',
                )}
              >
                <SudokuCell
                  value={value}
                  notes={notes[rowIndex][columnIndex]}
                  isFixed={fixedCells[rowIndex][columnIndex]}
                  isSelected={isSelected}
                  isHighlighted={isHighlighted}
                  isCorrect={isCorrect}
                  isWrong={isWrong}
                  isConflicting={isConflicting}
                  isRecentlyPlacedCorrect={isRecentlyPlacedCorrect}
                  isRecentlyPlacedWrong={isRecentlyPlacedWrong}
                  isDisabled={isPaused || isInteractionLocked}
                  onClick={() => onSelectCell(rowIndex, columnIndex)}
                />
              </div>
            )
          }),
        )}
      </div>

      {isPaused ? (
        <div className="absolute inset-0 flex items-center justify-center rounded-[1.35rem] bg-white/72 backdrop-blur-sm dark:bg-slate-950/78">
          <div className="rounded-[1.4rem] border border-slate-200 bg-white/90 px-5 py-4 text-center shadow-[0_18px_60px_rgba(148,163,184,0.26)] dark:border-white/10 dark:bg-white/8 dark:shadow-[0_18px_60px_rgba(2,8,24,0.35)]">
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-700 dark:text-cyan-200/75">Game paused</p>
            <p className="mt-3 font-display text-2xl font-semibold text-slate-950 dark:text-white sm:text-3xl">Take a breath</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Resume when you&apos;re ready to focus again.</p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
