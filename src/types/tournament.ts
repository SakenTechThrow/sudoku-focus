import type { Difficulty, GameStatus, SudokuBoard } from './sudoku'

export type TournamentStatus = 'waiting' | 'active' | 'completed'

export type TournamentRoundKey =
  | 'round_32'
  | 'round_16'
  | 'round_8'
  | 'quarter_final'
  | 'semi_final'
  | 'final'

export type TournamentMatchStatus = 'waiting' | 'active' | 'completed'

export type Tournament = {
  id: string
  hostUserId: string
  tournamentCode: string
  title: string
  difficulty: Difficulty
  status: TournamentStatus
  maxPlayers: number
  currentRound: TournamentRoundKey
  championUserId: string | null
  createdAt: string | null
}

export type TournamentPlayer = {
  id: string
  tournamentId: string
  userId: string
  displayName: string
  city: string
  seed: number
  createdAt: string | null
}

export type TournamentMatch = {
  id: string
  tournamentId: string
  roundKey: TournamentRoundKey
  matchNumber: number
  player1Id: string
  player2Id: string | null
  winnerPlayerId: string | null
  puzzle: SudokuBoard
  solution: SudokuBoard
  status: TournamentMatchStatus
  startedAt: string | null
  finishedAt: string | null
}

export type TournamentMatchResult = {
  id: string
  tournamentId: string
  matchId: string
  playerId: string
  userId: string
  board: SudokuBoard
  completed: boolean
  failed: boolean
  timeSeconds: number
  mistakes: number
  hintsUsed: number
  score: number
  status: GameStatus
  submittedAt: string | null
}

export type CreateTournamentInput = {
  title: string
  difficulty: Difficulty
  maxPlayers: 4 | 8 | 16 | 32
}

export type TournamentActionResult =
  | { ok: true; tournamentCode: string; message?: string }
  | { ok: false; message: string }

export type SubmitTournamentMatchResultInput = {
  matchId: string
  board: SudokuBoard
  timeSeconds: number
  mistakes: number
  hintsUsed: number
  status: GameStatus
}

export type SubmitTournamentMatchResultResult =
  | { ok: true; message: string }
  | { ok: false; message: string }
