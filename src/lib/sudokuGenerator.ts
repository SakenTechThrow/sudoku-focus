import { difficultyConfig } from '../constants/difficulty'
import type { CandidateValue, CellValue, Difficulty, GeneratedPuzzle, SudokuBoard } from '../types/sudoku'

const candidateValues: CandidateValue[] = [1, 2, 3, 4, 5, 6, 7, 8, 9]

export function createEmptyBoard(): SudokuBoard {
  return Array.from({ length: 9 }, () => Array<CellValue>(9).fill(0) as CellValue[])
}

export function shuffleArray<T>(values: T[]) {
  const shuffled = [...values]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const current = shuffled[index]
    shuffled[index] = shuffled[swapIndex]
    shuffled[swapIndex] = current
  }

  return shuffled
}

export function isSafe(
  board: SudokuBoard,
  row: number,
  col: number,
  value: CandidateValue,
) {
  for (let index = 0; index < 9; index += 1) {
    if (board[row][index] === value || board[index][col] === value) {
      return false
    }
  }

  const boxRowStart = Math.floor(row / 3) * 3
  const boxColStart = Math.floor(col / 3) * 3

  for (let rowIndex = boxRowStart; rowIndex < boxRowStart + 3; rowIndex += 1) {
    for (let colIndex = boxColStart; colIndex < boxColStart + 3; colIndex += 1) {
      if (board[rowIndex][colIndex] === value) {
        return false
      }
    }
  }

  return true
}

export function fillBoard(board: SudokuBoard): boolean {
  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      if (board[row][col] !== 0) {
        continue
      }

      for (const value of shuffleArray(candidateValues)) {
        if (!isSafe(board, row, col, value)) {
          continue
        }

        board[row][col] = value

        if (fillBoard(board)) {
          return true
        }

        board[row][col] = 0
      }

      return false
    }
  }

  return true
}

export function generateSolvedBoard() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const board = createEmptyBoard()

    if (fillBoard(board)) {
      return board
    }
  }

  throw new Error('Unable to generate a solved Sudoku board.')
}

export function removeCells(solution: SudokuBoard, cellsToRemove: number) {
  const puzzle = solution.map((row) => [...row]) as SudokuBoard
  const positions = shuffleArray(Array.from({ length: 81 }, (_, index) => index))

  for (const position of positions.slice(0, cellsToRemove)) {
    const row = Math.floor(position / 9)
    const col = position % 9
    puzzle[row][col] = 0
  }

  return puzzle
}

export function generatePuzzle(difficulty: Difficulty): GeneratedPuzzle {
  const solution = generateSolvedBoard()
  const puzzle = removeCells(solution, difficultyConfig[difficulty].cellsToRemove)

  return {
    difficulty,
    puzzle,
    solution,
  }
}
