export type CellValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

export type CandidateValue = Exclude<CellValue, 0>

export type SudokuBoard = CellValue[][]

export type CellNotes = CandidateValue[]

export type NotesBoard = CellNotes[][]

export type CellPosition = {
  row: number
  col: number
}

export type MoveStatus = 'correct' | 'wrong'

export type LastMove = CellPosition & {
  value: CandidateValue
  status: MoveStatus
}

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert'

export type GeneratedPuzzle = {
  difficulty: Difficulty
  puzzle: SudokuBoard
  solution: SudokuBoard
}

export type DailyChallenge = {
  id: string
  challengeDate: string
  difficulty: Difficulty
  puzzle: SudokuBoard
  solution: SudokuBoard
  createdAt: string | null
}

export type CheckResult = {
  status: 'incomplete' | 'incorrect' | 'solved'
  message: string
}

export type GameStatus = 'playing' | 'won' | 'lost'

export type PersistedSudokuGameState = {
  difficulty: Difficulty
  puzzle: SudokuBoard
  solution: SudokuBoard
  board: SudokuBoard
  notes: NotesBoard
  mistakes: number
  hintsUsed: number
  seconds: number
  completed: boolean
  status: GameStatus
  notesMode: boolean
  hasStarted: boolean
  startedAt?: number | null
  isPaused: boolean
}
