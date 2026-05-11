import type { CellPosition, CellValue, SudokuBoard } from '../types/sudoku'

export function isSamePosition(a: CellPosition, b: CellPosition) {
  return a.row === b.row && a.col === b.col
}

export function getBoxStartIndex(index: number) {
  return Math.floor(index / 3) * 3
}

export function isCellInSameBox(
  row1: number,
  col1: number,
  row2: number,
  col2: number,
) {
  return getBoxStartIndex(row1) === getBoxStartIndex(row2)
    && getBoxStartIndex(col1) === getBoxStartIndex(col2)
}

export function findConflictingCells(
  board: SudokuBoard,
  row: number,
  col: number,
  value: CellValue,
) {
  if (value === 0) {
    return []
  }

  const conflicts: CellPosition[] = []

  for (let column = 0; column < 9; column += 1) {
    if (column !== col && board[row][column] === value) {
      conflicts.push({ row, col: column })
    }
  }

  for (let rowIndex = 0; rowIndex < 9; rowIndex += 1) {
    if (rowIndex !== row && board[rowIndex][col] === value) {
      conflicts.push({ row: rowIndex, col })
    }
  }

  const boxRowStart = getBoxStartIndex(row)
  const boxColumnStart = getBoxStartIndex(col)

  for (let rowIndex = boxRowStart; rowIndex < boxRowStart + 3; rowIndex += 1) {
    for (let columnIndex = boxColumnStart; columnIndex < boxColumnStart + 3; columnIndex += 1) {
      const isCurrentCell = rowIndex === row && columnIndex === col
      const isDuplicate = board[rowIndex][columnIndex] === value
      const alreadyTracked = conflicts.some((cell) => cell.row === rowIndex && cell.col === columnIndex)

      if (!isCurrentCell && isDuplicate && !alreadyTracked) {
        conflicts.push({ row: rowIndex, col: columnIndex })
      }
    }
  }

  return conflicts
}

export function isValidPlacement(
  board: SudokuBoard,
  row: number,
  col: number,
  value: CellValue,
) {
  return findConflictingCells(board, row, col, value).length === 0
}

export function isBoardComplete(board: SudokuBoard) {
  return board.every((row) => row.every((cell) => cell !== 0))
}

export function isSolved(board: SudokuBoard, solution: SudokuBoard) {
  return board.every((row, rowIndex) =>
    row.every((cell, columnIndex) => cell === solution[rowIndex][columnIndex]),
  )
}
