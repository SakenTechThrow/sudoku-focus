import { isCellInSameBox, isSamePosition } from '../../lib/sudokuValidator'
import { cn } from '../../lib/utils'
import type {
  CellPosition,
  NotesBoard,
  SudokuBoard as SudokuBoardType,
} from '../../types/sudoku'
import { SudokuCell } from './SudokuCell'

type SudokuBoardProps = {
  board: SudokuBoardType
  notes: NotesBoard
  fixedCells: boolean[][]
  selectedCell: CellPosition | null
  invalidCellKeys: Set<string>
  isPaused: boolean
  onSelectCell: (row: number, col: number) => void
}

function positionKey(row: number, col: number) {
  return `${row}:${col}`
}

export function SudokuBoard({
  board,
  notes,
  fixedCells,
  selectedCell,
  invalidCellKeys,
  isPaused,
  onSelectCell,
}: SudokuBoardProps) {
  return (
    <div className="relative w-full max-w-[40rem]">
      <div className="grid grid-cols-9 overflow-hidden rounded-[1.5rem] border-2 border-white/14 bg-slate-950/85 shadow-[0_24px_80px_rgba(2,8,24,0.45)]">
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

            const isConflicting = invalidCellKeys.has(positionKey(rowIndex, columnIndex))

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
                  isConflicting={isConflicting}
                  isDisabled={isPaused}
                  onClick={() => onSelectCell(rowIndex, columnIndex)}
                />
              </div>
            )
          }),
        )}
      </div>

      {isPaused ? (
        <div className="absolute inset-0 flex items-center justify-center rounded-[1.5rem] bg-slate-950/78 backdrop-blur-sm">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/8 px-6 py-5 text-center shadow-[0_18px_60px_rgba(2,8,24,0.35)]">
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/75">Game paused</p>
            <p className="mt-3 font-display text-3xl font-semibold text-white">Take a breath</p>
            <p className="mt-2 text-sm text-slate-300">Resume when you&apos;re ready to focus again.</p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
