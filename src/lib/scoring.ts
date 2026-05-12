import type { Difficulty, GameStatus } from '../types/sudoku'

const baseScores: Record<Difficulty, number> = {
  easy: 5000,
  medium: 8000,
  hard: 12000,
  expert: 16000,
}

type CalculateScoreInput = {
  difficulty: Difficulty
  timeSeconds: number
  mistakes: number
  hintsUsed: number
  status: GameStatus
}

export function calculateScore({
  difficulty,
  timeSeconds,
  mistakes,
  hintsUsed,
  status,
}: CalculateScoreInput) {
  if (status === 'lost') {
    return 0
  }

  const difficultyBonus = difficulty === 'expert'
    ? 1200
    : difficulty === 'hard'
      ? 700
      : 0
  const cleanSolveBonus = mistakes === 0 ? 1500 : 0
  const noHintsBonus = hintsUsed === 0 ? 1000 : 0
  const fastSolveBonus = timeSeconds > 0 && timeSeconds < 300 ? 1000 : 0
  const rawScore =
    baseScores[difficulty]
    - timeSeconds * 2
    - mistakes * 700
    - hintsUsed * 400
    + difficultyBonus
    + cleanSolveBonus
    + noHintsBonus
    + fastSolveBonus

  return Math.max(0, rawScore)
}

export function calculateXpFromScore(score: number) {
  if (score <= 0) {
    return 0
  }

  return Math.max(10, Math.floor(score / 100))
}
