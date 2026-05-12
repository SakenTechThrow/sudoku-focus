import { useEffect, useMemo, useState } from 'react'
import { buildAchievements, hasUsedAICoach, type AchievementBadge } from '../lib/achievements'
import { computeDailyStreaks } from '../lib/streaks'
import { supabase } from '../lib/supabaseClient'
import { withTimeout } from '../lib/withTimeout'
import { useAuth } from './useAuth'
import type { Difficulty } from '../types/sudoku'

export type RecentGame = {
  id: string
  difficulty: Difficulty
  score: number
  timeSeconds: number
  mistakes: number
  hintsUsed: number
  createdAt: string | null
}

export type ProfileStats = {
  totalCompletedGames: number
  bestTime: number | null
  averageMistakes: number
  totalHintsUsed: number
  totalScore: number
  bestScore: number
  recentGames: RecentGame[]
  gamesByDifficulty: Record<Difficulty, number>
  achievements: AchievementBadge[]
  currentDailyStreak: number
  bestDailyStreak: number
  lastDailyDate: string | null
}

const emptyStats: ProfileStats = {
  totalCompletedGames: 0,
  bestTime: null,
  averageMistakes: 0,
  totalHintsUsed: 0,
  totalScore: 0,
  bestScore: 0,
  recentGames: [],
  gamesByDifficulty: {
    easy: 0,
    medium: 0,
    hard: 0,
    expert: 0,
  },
  achievements: [],
  currentDailyStreak: 0,
  bestDailyStreak: 0,
  lastDailyDate: null,
}

type GameRow = {
  id: string
  difficulty: Difficulty
  score: number | null
  time_seconds: number | null
  mistakes: number | null
  hints_used: number | null
  is_daily?: boolean | null
  created_at?: string | null
}

function getErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof Error && error.message) {
    return error.message
  }

  if (
    error
    && typeof error === 'object'
    && 'message' in error
    && typeof error.message === 'string'
    && error.message
  ) {
    return error.message
  }

  return fallbackMessage
}

export function useProfileStats() {
  const { isAuthenticated, user } = useAuth()
  const [games, setGames] = useState<GameRow[]>([])
  const [socialSolverCount, setSocialSolverCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated || !user || !supabase) {
      setGames([])
      setSocialSolverCount(0)
      setError(null)
      setLoading(false)
      return
    }

    const client = supabase
    const userId = user.id
    let isMounted = true
    setLoading(true)
    setError(null)

    async function loadStats() {
      try {
        const [{ data, error: loadError }, { count, error: socialError }] = await withTimeout(
          Promise.all([
            client
              .from('games')
              .select('id, difficulty, score, time_seconds, mistakes, hints_used, is_daily, created_at')
              .eq('user_id', userId)
              .eq('completed', true)
              .order('created_at', { ascending: false }),
            client
              .from('online_room_players')
              .select('id', { count: 'exact', head: true })
              .eq('user_id', userId),
          ]),
          12000,
        )

        if (loadError) {
          throw loadError
        }

        if (!isMounted) {
          return
        }

        setGames((data ?? []) as GameRow[])
        setSocialSolverCount(socialError ? 0 : (count ?? 0))
      } catch (loadStatsError) {
        if (!isMounted) {
          return
        }

        setGames([])
        setSocialSolverCount(0)
        setError(getErrorMessage(loadStatsError, 'Could not load your stats. Please try again.'))
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadStats()

    return () => {
      isMounted = false
    }
  }, [isAuthenticated, user])

  const stats = useMemo<ProfileStats>(() => {
    if (games.length === 0) {
      return {
        ...emptyStats,
        achievements: buildAchievements({
          games: [],
          totalCompletedGames: 0,
          bestDailyStreak: 0,
          aiCoachUsed: hasUsedAICoach(),
          socialSolverCount,
        }),
      }
    }

    const totalCompletedGames = games.length
    const totalScore = games.reduce((sum, game) => sum + (game.score ?? 0), 0)
    const totalHintsUsed = games.reduce((sum, game) => sum + (game.hints_used ?? 0), 0)
    const totalMistakes = games.reduce((sum, game) => sum + (game.mistakes ?? 0), 0)
    const bestTime = games.reduce<number | null>((best, game) => {
      if (game.time_seconds == null) {
        return best
      }

      if (best == null || game.time_seconds < best) {
        return game.time_seconds
      }

      return best
    }, null)

    const bestScore = games.reduce((best, game) => Math.max(best, game.score ?? 0), 0)
    const gamesByDifficulty = games.reduce<Record<Difficulty, number>>((acc, game) => {
      acc[game.difficulty] += 1
      return acc
    }, {
      easy: 0,
      medium: 0,
      hard: 0,
      expert: 0,
    })
    const dailyStreakSummary = computeDailyStreaks(
      games
        .filter((game) => game.is_daily)
        .map((game) => game.created_at ?? null),
    )
    const achievements = buildAchievements({
      games: games.map((game) => ({
        difficulty: game.difficulty,
        mistakes: game.mistakes ?? 0,
        timeSeconds: game.time_seconds ?? 0,
        isDaily: Boolean(game.is_daily),
      })),
      totalCompletedGames,
      bestDailyStreak: dailyStreakSummary.bestDailyStreak,
      aiCoachUsed: hasUsedAICoach(),
      socialSolverCount,
    })

    return {
      totalCompletedGames,
      bestTime,
      averageMistakes: totalMistakes / totalCompletedGames,
      totalHintsUsed,
      totalScore,
      bestScore,
      recentGames: games.slice(0, 5).map((game) => ({
        id: game.id,
        difficulty: game.difficulty,
        score: game.score ?? 0,
        timeSeconds: game.time_seconds ?? 0,
        mistakes: game.mistakes ?? 0,
        hintsUsed: game.hints_used ?? 0,
        createdAt: game.created_at ?? null,
      })),
      gamesByDifficulty,
      achievements,
      currentDailyStreak: dailyStreakSummary.currentDailyStreak,
      bestDailyStreak: dailyStreakSummary.bestDailyStreak,
      lastDailyDate: dailyStreakSummary.lastDailyDate,
    }
  }, [games, socialSolverCount])

  return {
    stats,
    loading,
    error,
    hasGames: games.length > 0,
  }
}
