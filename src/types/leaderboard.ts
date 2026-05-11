import type { Difficulty } from './sudoku'

export type LeaderboardScope = 'global' | 'city'

export type LeaderboardDifficultyFilter = 'all' | Difficulty

export type LeaderboardEntry = {
  id: string
  username: string
  city: string
  difficulty: Difficulty
  score: number
  timeSeconds: number
  mistakes: number
  hintsUsed: number
  isDaily: boolean
  challengeDate: string | null
  createdAt: string | null
}
