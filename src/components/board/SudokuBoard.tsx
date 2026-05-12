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
          'grid aspect-square grid-cols-9 overflow-hidden rounded-[1.35rem] border-2 border-white/14 bg-slate-950/85 shadow-[0_24px_80px_rgba(2,8,24,0.45)] transition',
          celebrate && 'sudoku-board-celebrate border-emerald-300/35 shadow-[0_24px_90px_rgba(16,185,129,0.26)] dark:border-emerald-300/28',
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
                  'border-white/8',
                  rowIndex === 0 ? 'border-t-0' : 'border-t',
                  columnIndex === 0 ? 'border-l-0' : 'border-l',
                  rowIndex % 3 === 0 && rowIndex !== 0 && 'border-t-2 border-t-white/18',
                  columnIndex % 3 === 0 && columnIndex !== 0 && 'border-l-2 border-l-white/18',
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
        <div className="absolute inset-0 flex items-center justify-center rounded-[1.35rem] bg-slate-950/78 backdrop-blur-sm">
          <div className="rounded-[1.4rem] border border-white/10 bg-white/8 px-5 py-4 text-center shadow-[0_18px_60px_rgba(2,8,24,0.35)]">
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/75">Game paused</p>
            <p className="mt-3 font-display text-2xl font-semibold text-white sm:text-3xl">Take a breath</p>
            <p className="mt-2 text-sm text-slate-300">Resume when you&apos;re ready to focus again.</p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
