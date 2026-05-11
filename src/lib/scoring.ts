import type { Difficulty } from '../types/sudoku'

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
}

export function calculateScore({
  difficulty,
  timeSeconds,
  mistakes,
  hintsUsed,
}: CalculateScoreInput) {
  const rawScore =
    baseScores[difficulty]
    - timeSeconds * 2
    - mistakes * 500
    - hintsUsed * 300

  return Math.max(0, rawScore)
}
