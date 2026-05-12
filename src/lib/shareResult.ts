import type { Difficulty } from '../types/sudoku'

type ShareMode = 'game' | 'daily'

type CreateShareTextInput = {
  mode: ShareMode
  difficulty: Difficulty
  timeSeconds: number
  mistakes: number
  hintsUsed: number
  score: number
  url: string
}

function formatTime(timeSeconds: number) {
  const minutes = Math.floor(timeSeconds / 60)
  const seconds = timeSeconds % 60

  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

function formatDifficulty(difficulty: Difficulty) {
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
}

export function createShareText({
  mode,
  difficulty,
  timeSeconds,
  mistakes,
  hintsUsed,
  score,
  url,
}: CreateShareTextInput) {
  const headline = mode === 'daily'
    ? 'I solved Sudoku Focus Daily Challenge 🧠'
    : 'I solved a Sudoku Focus puzzle 🧠'

  return [
    headline,
    `Difficulty: ${formatDifficulty(difficulty)}`,
    `Time: ${formatTime(timeSeconds)}`,
    `Mistakes: ${mistakes}`,
    `Hints: ${hintsUsed}`,
    `Score: ${score}`,
    '',
    'Can you beat me?',
    url,
  ].join('\n')
}
