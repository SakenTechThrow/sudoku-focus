import type { Difficulty } from '../types/sudoku'

export const AI_COACH_USAGE_STORAGE_KEY = 'sudoku-focus-ai-coach-used'

export type AchievementId =
  | 'first-win'
  | 'no-mistake'
  | 'speed-solver'
  | 'daily-starter'
  | 'three-day-streak'
  | 'hard-mode-hero'
  | 'expert-mind'
  | 'ai-learner'
  | 'social-solver'
  | 'focus-builder'

export type AchievementBadge = {
  id: AchievementId
  title: string
  description: string
  icon: string
  unlocked: boolean
  progressText?: string
}

export type AchievementGameRecord = {
  difficulty: Difficulty
  mistakes: number
  timeSeconds: number
  isDaily: boolean
}

type BuildAchievementsInput = {
  games: AchievementGameRecord[]
  totalCompletedGames: number
  bestDailyStreak: number
  aiCoachUsed: boolean
  socialSolverCount: number
}

export function markAICoachUsed() {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(AI_COACH_USAGE_STORAGE_KEY, 'true')
  } catch {
    // Ignore storage failures so gameplay is never blocked.
  }
}

export function hasUsedAICoach() {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    return window.localStorage.getItem(AI_COACH_USAGE_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export function buildAchievements({
  games,
  totalCompletedGames,
  bestDailyStreak,
  aiCoachUsed,
  socialSolverCount,
}: BuildAchievementsInput): AchievementBadge[] {
  const hasFirstWin = totalCompletedGames >= 1
  const hasNoMistake = games.some((game) => game.mistakes === 0)
  const hasSpeedSolver = games.some((game) => game.timeSeconds > 0 && game.timeSeconds < 300)
  const hasDailyStarter = games.some((game) => game.isDaily)
  const hasHardModeHero = games.some((game) => game.difficulty === 'hard')
  const hasExpertMind = games.some((game) => game.difficulty === 'expert')
  const hasFocusBuilder = totalCompletedGames >= 5
  const hasSocialSolver = socialSolverCount > 0
  const hasAiLearner = aiCoachUsed && hasFirstWin

  return [
    {
      id: 'first-win',
      title: 'First Win',
      description: 'Complete your first puzzle.',
      icon: '🏁',
      unlocked: hasFirstWin,
      progressText: hasFirstWin ? 'Unlocked' : 'Finish 1 puzzle',
    },
    {
      id: 'no-mistake',
      title: 'No Mistake',
      description: 'Complete a puzzle with 0 mistakes.',
      icon: '✨',
      unlocked: hasNoMistake,
      progressText: hasNoMistake ? 'Perfect finish achieved' : 'Solve one board cleanly',
    },
    {
      id: 'speed-solver',
      title: 'Speed Solver',
      description: 'Complete any puzzle under 5 minutes.',
      icon: '⚡',
      unlocked: hasSpeedSolver,
      progressText: hasSpeedSolver ? 'Sub-5 minute solve recorded' : 'Beat the 05:00 mark',
    },
    {
      id: 'daily-starter',
      title: 'Daily Starter',
      description: 'Complete one Daily Challenge.',
      icon: '📅',
      unlocked: hasDailyStarter,
      progressText: hasDailyStarter ? 'Unlocked' : 'Complete your first daily challenge',
    },
    {
      id: 'three-day-streak',
      title: '3-Day Streak',
      description: 'Complete Daily Challenge 3 days in a row.',
      icon: '🔥',
      unlocked: bestDailyStreak >= 3,
      progressText: bestDailyStreak >= 3 ? `${bestDailyStreak}-day streak reached` : `${bestDailyStreak}/3 consecutive days`,
    },
    {
      id: 'hard-mode-hero',
      title: 'Hard Mode Hero',
      description: 'Complete Hard difficulty.',
      icon: '🧠',
      unlocked: hasHardModeHero,
      progressText: hasHardModeHero ? 'Hard session conquered' : 'Finish 1 hard puzzle',
    },
    {
      id: 'expert-mind',
      title: 'Expert Mind',
      description: 'Complete Expert difficulty.',
      icon: '👑',
      unlocked: hasExpertMind,
      progressText: hasExpertMind ? 'Expert session conquered' : 'Finish 1 expert puzzle',
    },
    {
      id: 'ai-learner',
      title: 'AI Learner',
      description: 'Use AI Coach and complete a puzzle.',
      icon: '🤖',
      unlocked: hasAiLearner,
      progressText: hasAiLearner ? 'Coach-powered finish unlocked' : aiCoachUsed ? 'Complete a puzzle to unlock' : 'Use AI Coach during a session',
    },
    {
      id: 'social-solver',
      title: 'Social Solver',
      description: 'Join or create an online room.',
      icon: '🤝',
      unlocked: hasSocialSolver,
      progressText: hasSocialSolver ? `${socialSolverCount} room session${socialSolverCount === 1 ? '' : 's'}` : 'Play with friends online once',
    },
    {
      id: 'focus-builder',
      title: 'Focus Builder',
      description: 'Complete 5 puzzles total.',
      icon: '🏗️',
      unlocked: hasFocusBuilder,
      progressText: hasFocusBuilder ? `${totalCompletedGames} puzzles completed` : `${Math.min(totalCompletedGames, 5)}/5 puzzles completed`,
    },
  ]
}
