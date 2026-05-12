import type { Difficulty, SudokuBoard } from './sudoku'

export type OnlineMode = 'collaborative' | 'race'

export type OnlineRoomStatus = 'active' | 'completed'

export type OnlineSyncStatus = 'connected' | 'syncing' | 'error'

export type OnlineRoom = {
  id: string
  hostUserId: string
  roomCode: string
  mode: OnlineMode
  difficulty: Difficulty
  puzzle: SudokuBoard
  solution: SudokuBoard
  sharedBoard: SudokuBoard
  status: OnlineRoomStatus
  winnerUserId: string | null
  createdAt: string | null
}

export type OnlineRoomPlayer = {
  id: string
  roomId: string
  userId: string
  displayName: string
  city: string
  personalBoard: SudokuBoard | null
  completed: boolean
  timeSeconds: number
  mistakes: number
  hintsUsed: number
  score: number
  finishedAt: string | null
  createdAt?: string | null
  joinedAt?: string | null
}

export type CreateOnlineRoomInput = {
  mode: OnlineMode
  difficulty: Difficulty
}
