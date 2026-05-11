import { useCallback, useEffect, useState } from 'react'
import { isDifficulty } from '../constants/difficulty'
import { supabase, supabaseConfigError } from '../lib/supabaseClient'
import { generatePuzzle } from '../lib/sudokuGenerator'
import type { DailyChallenge, SudokuBoard } from '../types/sudoku'

type DailyChallengeRow = {
  id: string
  challenge_date: string | null
  difficulty: string | null
  puzzle: unknown
  solution: unknown
  created_at: string | null
}

type SupabaseLikeError = {
  code?: string
  message?: string
}

function isCellValue(value: unknown) {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 9
}

function isSudokuBoard(board: unknown): board is SudokuBoard {
  return Array.isArray(board)
    && board.length === 9
    && board.every(
      (row) => Array.isArray(row) && row.length === 9 && row.every((cell) => isCellValue(cell)),
    )
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

export function getTodayChallengeDate() {
  return new Date().toISOString().slice(0, 10)
}

function normalizeChallenge(row: DailyChallengeRow | null): DailyChallenge | null {
  if (
    !row
    || !row.id
    || !row.challenge_date
    || !row.difficulty
    || !isDifficulty(row.difficulty)
    || !isSudokuBoard(row.puzzle)
    || !isSudokuBoard(row.solution)
  ) {
    return null
  }

  return {
    id: row.id,
    challengeDate: row.challenge_date,
    difficulty: row.difficulty,
    puzzle: row.puzzle,
    solution: row.solution,
    createdAt: row.created_at,
  }
}

export function useDailyChallenge() {
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshCount, setRefreshCount] = useState(0)
  const challengeDate = getTodayChallengeDate()

  const refetch = useCallback(() => {
    setRefreshCount((current) => current + 1)
  }, [])

  useEffect(() => {
    if (!supabase) {
      setChallenge(null)
      setLoading(false)
      setError(supabaseConfigError ?? 'Supabase is not configured.')
      return
    }

    const client = supabase
    let isMounted = true
    setLoading(true)
    setError(null)

    async function selectChallenge() {
      const { data, error: selectError } = await client
        .from('daily_challenges')
        .select('id, challenge_date, difficulty, puzzle, solution, created_at')
        .eq('challenge_date', challengeDate)
        .maybeSingle()

      if (selectError) {
        throw selectError
      }

      return normalizeChallenge((data ?? null) as DailyChallengeRow | null)
    }

    async function loadChallenge() {
      try {
        const existingChallenge = await selectChallenge()

        if (existingChallenge) {
          if (isMounted) {
            setChallenge(existingChallenge)
          }
          return
        }

        const generatedChallenge = generatePuzzle('medium')
        const { error: insertError } = await client.from('daily_challenges').insert({
          challenge_date: challengeDate,
          difficulty: generatedChallenge.difficulty,
          puzzle: generatedChallenge.puzzle,
          solution: generatedChallenge.solution,
        })

        if (insertError) {
          const candidateError = insertError as SupabaseLikeError

          if (candidateError.code !== '23505') {
            throw insertError
          }
        }

        const createdChallenge = await selectChallenge()

        if (!createdChallenge) {
          throw new Error('No daily challenge is available right now.')
        }

        if (isMounted) {
          setChallenge(createdChallenge)
        }
      } catch (loadChallengeError) {
        if (!isMounted) {
          return
        }

        setChallenge(null)
        setError(getErrorMessage(loadChallengeError, 'Unable to load today\'s challenge right now.'))
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void loadChallenge()

    return () => {
      isMounted = false
    }
  }, [challengeDate, refreshCount])

  return {
    challenge,
    challengeDate,
    loading,
    error,
    refetch,
  }
}
