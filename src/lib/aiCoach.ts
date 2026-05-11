import type { CandidateValue, SudokuBoard } from '../types/sudoku'

const candidateValues: CandidateValue[] = [1, 2, 3, 4, 5, 6, 7, 8, 9]

function formatValueList(values: CandidateValue[]) {
  if (values.length === 0) {
    return ''
  }

  if (values.length === 1) {
    return `${values[0]}`
  }

  if (values.length === 2) {
    return `${values[0]} and ${values[1]}`
  }

  return `${values.slice(0, -1).join(', ')}, and ${values.at(-1)}`
}

function hasRowConflict(board: SudokuBoard, row: number, col: number, value: CandidateValue) {
  return board[row].some((cell, columnIndex) => columnIndex !== col && cell === value)
}

function hasColumnConflict(board: SudokuBoard, row: number, col: number, value: CandidateValue) {
  return board.some((boardRow, rowIndex) => rowIndex !== row && boardRow[col] === value)
}

function hasBoxConflict(board: SudokuBoard, row: number, col: number, value: CandidateValue) {
  const boxRowStart = Math.floor(row / 3) * 3
  const boxColStart = Math.floor(col / 3) * 3

  for (let rowIndex = boxRowStart; rowIndex < boxRowStart + 3; rowIndex += 1) {
    for (let colIndex = boxColStart; colIndex < boxColStart + 3; colIndex += 1) {
      const isCurrentCell = rowIndex === row && colIndex === col

      if (!isCurrentCell && board[rowIndex][colIndex] === value) {
        return true
      }
    }
  }

  return false
}

export function getPossibleValues(board: SudokuBoard, row: number, col: number) {
  if (board[row][col] !== 0) {
    return []
  }

  return candidateValues.filter((value) => {
    return !hasRowConflict(board, row, col, value)
      && !hasColumnConflict(board, row, col, value)
      && !hasBoxConflict(board, row, col, value)
  })
}

export function explainSelectedCell(
  board: SudokuBoard,
  solution: SudokuBoard,
  row: number,
  col: number,
) {
  const possibleValues = getPossibleValues(board, row, col)

  if (possibleValues.length === 0) {
    return 'This cell has no legal candidates right now, which usually means another value nearby needs to be corrected first.'
  }

  if (possibleValues.length === 1) {
    return `This cell has a single legal candidate: ${possibleValues[0]}. It fits the row, column, and 3x3 box, and it matches the correct solution.`
  }

  const matchesSolution = possibleValues.includes(solution[row][col] as CandidateValue)

  return matchesSolution
    ? `This cell is empty. Based on its row, column, and 3x3 box, possible candidates are ${formatValueList(possibleValues)}. Try eliminating the least likely options first.`
    : `This cell is empty. The legal candidates are ${formatValueList(possibleValues)}. If the list feels surprising, scan the row and box one more time to remove hidden conflicts.`
}

export function explainMove(
  board: SudokuBoard,
  solution: SudokuBoard,
  row: number,
  col: number,
  value: CandidateValue,
) {
  const reasons: string[] = []

  if (hasRowConflict(board, row, col, value)) {
    reasons.push(`Number ${value} already appears in this row.`)
  }

  if (hasColumnConflict(board, row, col, value)) {
    reasons.push(`Number ${value} already appears in this column.`)
  }

  if (hasBoxConflict(board, row, col, value)) {
    reasons.push(`Number ${value} already appears in this 3x3 box.`)
  }

  if (reasons.length > 0) {
    return `${reasons.join(' ')} Try clearing the cell and scanning those neighbors first.`
  }

  if (value !== solution[row][col]) {
    return `Number ${value} does not break a direct row, column, or box rule, but it still does not match the correct solution for this puzzle. Use candidates to narrow the spot further.`
  }

  return `Number ${value} is a strong move here. It fits the row, column, and 3x3 box, and it matches the solved board.`
}

export function getGeneralStrategyTip(board: SudokuBoard) {
  const emptyCells = board.flat().filter((cell) => cell === 0).length

  if (emptyCells > 50) {
    return 'Try scanning rows and columns with the most givens first. Early Sudoku progress often comes from spotting the easiest eliminations instead of guessing.'
  }

  if (emptyCells > 30) {
    return 'Try scanning the 3x3 box first. Sudoku becomes easier when you eliminate impossible numbers box by box before zooming back out.'
  }

  return 'You are in the refinement phase. Look for cells with only one or two candidates left and compare them against nearby rows and columns to close the board cleanly.'
}
