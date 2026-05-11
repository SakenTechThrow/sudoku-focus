import { useCallback, useEffect, useState } from 'react'
import { isDifficulty } from '../constants/difficulty'
import { supabase, supabaseConfigError } from '../lib/supabaseClient'
import type {
  LeaderboardDifficultyFilter,
  LeaderboardEntry,
  LeaderboardScope,
} from '../types/leaderboard'

type UseLeaderboardOptions = {
  scope: LeaderboardScope
  difficulty: LeaderboardDifficultyFilter
  city?: string
  dailyOnly?: boolean
  challengeDate?: string | null
}

type LeaderboardRow = {
  id: string
  username: string | null
  city: string | null
  difficulty: string | null
  score: number | null
  time_seconds: number | null
  mistakes: number | null
  hints_used: number | null
  is_daily: boolean | null
  challenge_date: string | null
  created_at: string | null
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

function normalizeEntry(row: LeaderboardRow): LeaderboardEntry | null {
  if (!row.id || !row.difficulty || !isDifficulty(row.difficulty)) {
    return null
  }

  return {
    id: row.id,
    username: row.username?.trim() || 'Sudoku Focus Player',
    city: row.city?.trim() || 'Unknown city',
    difficulty: row.difficulty,
    score: row.score ?? 0,
    timeSeconds: row.time_seconds ?? 0,
    mistakes: row.mistakes ?? 0,
    hintsUsed: row.hints_used ?? 0,
    isDaily: row.is_daily ?? false,
    challengeDate: row.challenge_date,
    createdAt: row.created_at,
  }
}

export function useLeaderboard({
  scope,
  difficulty,
  city = 'Almaty',
  dailyOnly = false,
  challengeDate = null,
}: UseLeaderboardOptions) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshCount, setRefreshCount] = useState(0)

  const refetch = useCallback(() => {
    setRefreshCount((current) => current + 1)
  }, [])

  useEffect(() => {
    if (!supabase) {
      setEntries([])
      setLoading(false)
      setError(supabaseConfigError ?? 'Supabase is not configured.')
      return
    }

    const client = supabase
    let isMounted = true
    setLoading(true)
    setError(null)

    async function loadLeaderboard() {
      try {
        let query = client
          .from('leaderboard_entries')
          .select('id, username, city, difficulty, score, time_seconds, mistakes, hints_used, is_daily, challenge_date, created_at')
          .order('score', { ascending: false })
          .order('time_seconds', { ascending: true })
          .limit(50)

        if (scope === 'city') {
          query = query.eq('city', city)
        }

        if (difficulty !== 'all') {
          query = query.eq('difficulty', difficulty)
        }

        if (dailyOnly) {
          query = query.eq('is_daily', true)
        }

        if (challengeDate) {
          query = query.eq('challenge_date', challengeDate)
        }

        const { data, error: loadError } = await query

        if (loadError) {
          throw loadError
        }

        if (!isMounted) {
          return
        }

        const normalizedEntries = ((data ?? []) as LeaderboardRow[])
          .map(normalizeEntry)
          .filter((entry): entry is LeaderboardEntry => entry !== null)

        setEntries(normalizedEntries)
      } catch (loadLeaderboardError) {
        if (!isMounted) {
          return
        }

        setEntries([])
        setError(getErrorMessage(loadLeaderboardError, 'Unable to load leaderboard entries right now.'))
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void loadLeaderboard()

    return () => {
      isMounted = false
    }
  }, [challengeDate, city, dailyOnly, difficulty, refreshCount, scope])

  return {
    entries,
    loading,
    error,
    refetch,
  }
}
