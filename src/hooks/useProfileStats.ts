import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from './useAuth'
import type { Difficulty } from '../types/sudoku'

type RecentGame = {
  id: string
  difficulty: Difficulty
  score: number
  timeSeconds: number
  mistakes: number
  hintsUsed: number
  createdAt: string | null
}

type ProfileStats = {
  totalCompletedGames: number
  bestTime: number | null
  averageMistakes: number
  totalHintsUsed: number
  totalScore: number
  bestScore: number
  recentGames: RecentGame[]
  gamesByDifficulty: Record<Difficulty, number>
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
}

type GameRow = {
  id: string
  difficulty: Difficulty
  score: number | null
  time_seconds: number | null
  mistakes: number | null
  hints_used: number | null
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated || !user || !supabase) {
      setGames([])
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
        const { data, error: loadError } = await client
          .from('games')
          .select('id, difficulty, score, time_seconds, mistakes, hints_used, created_at')
          .eq('user_id', userId)
          .eq('completed', true)
          .order('created_at', { ascending: false })

        if (loadError) {
          throw loadError
        }

        if (!isMounted) {
          return
        }

        setGames((data ?? []) as GameRow[])
      } catch (loadStatsError) {
        if (!isMounted) {
          return
        }

        setGames([])
        setError(getErrorMessage(loadStatsError, 'Unable to load profile stats right now.'))
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
      return emptyStats
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
    }
  }, [games])

  return {
    stats,
    loading,
    error,
    hasGames: games.length > 0,
  }
}
