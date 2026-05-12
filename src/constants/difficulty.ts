import { MAX_MISTAKES } from './game'
import type { Difficulty } from '../types/sudoku'

export type DifficultyConfig = {
  label: string
  description: string
  cellsToRemove: number
  mistakeLimit: number
}

export const difficultyOrder: Difficulty[] = ['easy', 'medium', 'hard', 'expert']

export const difficultyConfig: Record<Difficulty, DifficultyConfig> = {
  easy: {
    label: 'Easy',
    description: 'Calm warm-up with more starting clues.',
    cellsToRemove: 35,
    mistakeLimit: MAX_MISTAKES,
  },
  medium: {
    label: 'Medium',
    description: 'Balanced challenge for a focused session.',
    cellsToRemove: 45,
    mistakeLimit: MAX_MISTAKES,
  },
  hard: {
    label: 'Hard',
    description: 'Fewer clues with stronger pattern pressure.',
    cellsToRemove: 52,
    mistakeLimit: MAX_MISTAKES,
  },
  expert: {
    label: 'Expert',
    description: 'Minimal clues for deep focus.',
    cellsToRemove: 58,
    mistakeLimit: MAX_MISTAKES,
  },
}

export function isDifficulty(value: unknown): value is Difficulty {
  return typeof value === 'string' && value in difficultyConfig
}
