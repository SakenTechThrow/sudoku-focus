import { useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { calculateScore, calculateXpFromScore } from '../lib/scoring'
import { withTimeout } from '../lib/withTimeout'
import { useAuth } from './useAuth'
import type { Difficulty, GameStatus, SudokuBoard } from '../types/sudoku'

type SaveCompletedGameInput = {
  difficulty: Difficulty
  puzzle: SudokuBoard
  solution: SudokuBoard
  timeSeconds: number
  mistakes: number
  hintsUsed: number
  status?: GameStatus
  isDaily?: boolean
  challengeDate?: string | null
}

export type SaveCompletedGameResult =
  | { ok: true; message: string; score: number }
  | { ok: false; message: string }

function getErrorMessage(error: unknown, fallbackMessage: string) {
  if (import.meta.env.DEV) {
    console.error('Save completed game error:', error)
  }

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

export function useGamePersistence() {
  const { isAuthenticated, profile, refreshProfile, user } = useAuth()

  const saveCompletedGame = useCallback(async ({
    difficulty,
    puzzle,
    solution,
    timeSeconds,
    mistakes,
    hintsUsed,
    status = 'won',
    isDaily = false,
    challengeDate = null,
  }: SaveCompletedGameInput): Promise<SaveCompletedGameResult> => {
    if (!isAuthenticated || !user) {
      return { ok: false, message: 'Sign in to save your progress.' }
    }

    if (!supabase) {
      return { ok: false, message: 'Supabase is not configured.' }
    }

    if (isDaily && !challengeDate) {
      return { ok: false, message: 'Daily challenge date is missing.' }
    }

    if (status !== 'won') {
      return { ok: false, message: 'Only won games can be saved for points.' }
    }

    const score = calculateScore({
      difficulty,
      timeSeconds,
      mistakes,
      hintsUsed,
      status,
    })

    try {
      return await withTimeout((async (): Promise<SaveCompletedGameResult> => {
        if (isDaily && challengeDate) {
          const { data: existingEntries, error: existingEntryError } = await supabase
            .from('leaderboard_entries')
            .select('id')
            .eq('user_id', user.id)
            .eq('is_daily', true)
            .eq('challenge_date', challengeDate)
            .limit(1)

          if (existingEntryError) {
            throw existingEntryError
          }

          if ((existingEntries ?? []).length > 0) {
            return {
              ok: false,
              message: "You already submitted today's Daily Challenge.",
            }
          }
        }

        const { data: gameData, error: gameError } = await supabase
          .from('games')
          .insert({
            user_id: user.id,
            difficulty,
            puzzle,
            solution,
            time_seconds: timeSeconds,
            mistakes,
            hints_used: hintsUsed,
            completed: true,
            is_daily: isDaily,
            score,
          })
          .select('id')
          .single()

        if (gameError) {
          throw gameError
        }

        const { error: leaderboardError } = await supabase
          .from('leaderboard_entries')
          .insert({
            user_id: user.id,
            game_id: gameData.id,
            username: profile?.username ?? user.email?.split('@')[0] ?? 'Sudoku Focus User',
            city: profile?.city ?? 'Almaty',
            difficulty,
            score,
            time_seconds: timeSeconds,
            mistakes,
            hints_used: hintsUsed,
            is_daily: isDaily,
            challenge_date: challengeDate,
          })

        if (leaderboardError) {
          throw leaderboardError
        }

        const xpGain = calculateXpFromScore(score)
        const nextXp = (profile?.xp ?? 0) + xpGain

        const { error: profileError } = await supabase
          .from('profiles')
          .update({ xp: nextXp })
          .eq('id', user.id)

        if (profileError) {
          throw profileError
        }

        await refreshProfile()

        return {
          ok: true,
          message: 'Game saved successfully.',
          score,
        }
      })(), 15000)
    } catch (error) {
      return {
        ok: false,
        message: getErrorMessage(error, 'Could not save your progress. Please try again.'),
      }
    }
  }, [isAuthenticated, profile?.city, profile?.username, profile?.xp, refreshProfile, user])

  return {
    saveCompletedGame,
  }
}
