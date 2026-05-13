import type { RealtimeChannel } from '@supabase/supabase-js'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { isDifficulty } from '../constants/difficulty'
import {
  getTournamentBracketRounds,
  getTournamentNextRoundKey,
  getTournamentRoundKeyForPlayerCount,
  isTournamentRoundKey,
} from '../lib/tournamentBracket'
import { generatePuzzle } from '../lib/sudokuGenerator'
import { calculateScore } from '../lib/scoring'
import { supabase, supabaseConfigError } from '../lib/supabaseClient'
import { withTimeout } from '../lib/withTimeout'
import type { GameStatus, SudokuBoard } from '../types/sudoku'
import type {
  CreateTournamentInput,
  SubmitTournamentMatchResultInput,
  SubmitTournamentMatchResultResult,
  Tournament,
  TournamentActionResult,
  TournamentMatch,
  TournamentMatchResult,
  TournamentMatchStatus,
  TournamentPlayer,
  TournamentRoundKey,
  TournamentStatus,
} from '../types/tournament'
import { useAuth } from './useAuth'

const TOURNAMENT_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const TOURNAMENT_NOT_FOUND_MESSAGE = 'Tournament not found.'
const TOURNAMENT_TIMEOUT_MS = 15000
const PROFILE_FALLBACK_CITY = 'Almaty'
const POWER_OF_TWO_PLAYER_COUNTS = new Set([2, 4, 8, 16, 32])

type UseTournamentOptions = {
  enabled?: boolean
}

type TournamentRow = {
  id: string
  host_user_id: string | null
  tournament_code: string | null
  title: string | null
  difficulty: string | null
  status: string | null
  max_players: number | null
  current_round: string | null
  champion_user_id?: string | null
  created_at: string | null
}

type TournamentPlayerRow = {
  id: string
  tournament_id: string | null
  user_id: string | null
  display_name: string | null
  city: string | null
  seed: number | null
  created_at?: string | null
}

type TournamentMatchRow = {
  id: string
  tournament_id: string | null
  round_key: string | null
  match_number: number | null
  player1_id: string | null
  player2_id: string | null
  winner_player_id?: string | null
  puzzle: unknown
  solution: unknown
  status: string | null
  started_at?: string | null
  finished_at?: string | null
}

type TournamentMatchResultRow = {
  id: string
  tournament_id: string | null
  match_id: string | null
  player_id: string | null
  user_id: string | null
  board: unknown
  completed: boolean | null
  failed: boolean | null
  time_seconds: number | null
  mistakes: number | null
  hints_used: number | null
  score: number | null
  submitted_at?: string | null
}

function cloneBoard(board: SudokuBoard): SudokuBoard {
  return board.map((row) => [...row]) as SudokuBoard
}

function isCellValue(value: unknown) {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 9
}

function isSudokuBoard(value: unknown): value is SudokuBoard {
  return Array.isArray(value)
    && value.length === 9
    && value.every(
      (row) => Array.isArray(row) && row.length === 9 && row.every((cell) => isCellValue(cell)),
    )
}

function isTournamentStatus(value: unknown): value is TournamentStatus {
  return value === 'waiting' || value === 'active' || value === 'completed'
}

function isTournamentMatchStatus(value: unknown): value is TournamentMatchStatus {
  return value === 'waiting' || value === 'active' || value === 'completed'
}

function getErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallbackMessage
}

function runWithTimeout<T>(query: PromiseLike<T>, timeoutMs = TOURNAMENT_TIMEOUT_MS) {
  return withTimeout(Promise.resolve(query), timeoutMs)
}

function getDisplayName(username: string | null | undefined, email: string | null | undefined) {
  if (username && username.trim().length > 0) {
    return username.trim()
  }

  if (email && email.includes('@')) {
    return email.split('@')[0]
  }

  return 'Sudoku Focus Player'
}

function createTournamentCode() {
  return Array.from({ length: 6 }, () => {
    const index = Math.floor(Math.random() * TOURNAMENT_CODE_ALPHABET.length)
    return TOURNAMENT_CODE_ALPHABET[index]
  }).join('')
}

function compareRoundKeys(left: TournamentRoundKey, right: TournamentRoundKey) {
  const order = getTournamentBracketRounds(32)
  return order.indexOf(left) - order.indexOf(right)
}

function mapTournament(row: TournamentRow): Tournament | null {
  if (
    !row.id
    || !row.host_user_id
    || !row.tournament_code
    || !row.title
    || !isDifficulty(row.difficulty)
    || !isTournamentStatus(row.status)
    || typeof row.max_players !== 'number'
    || !isTournamentRoundKey(row.current_round)
  ) {
    return null
  }

  return {
    id: row.id,
    hostUserId: row.host_user_id,
    tournamentCode: row.tournament_code,
    title: row.title,
    difficulty: row.difficulty,
    status: row.status,
    maxPlayers: row.max_players,
    currentRound: row.current_round,
    championUserId: row.champion_user_id ?? null,
    createdAt: row.created_at ?? null,
  }
}

function mapTournamentPlayer(row: TournamentPlayerRow): TournamentPlayer | null {
  if (
    !row.id
    || !row.tournament_id
    || !row.user_id
    || !row.display_name
    || !row.city
    || typeof row.seed !== 'number'
  ) {
    return null
  }

  return {
    id: row.id,
    tournamentId: row.tournament_id,
    userId: row.user_id,
    displayName: row.display_name,
    city: row.city,
    seed: row.seed,
    createdAt: row.created_at ?? null,
  }
}

function mapTournamentMatch(row: TournamentMatchRow): TournamentMatch | null {
  if (
    !row.id
    || !row.tournament_id
    || !isTournamentRoundKey(row.round_key)
    || typeof row.match_number !== 'number'
    || !row.player1_id
    || !isSudokuBoard(row.puzzle)
    || !isSudokuBoard(row.solution)
    || !isTournamentMatchStatus(row.status)
  ) {
    return null
  }

  return {
    id: row.id,
    tournamentId: row.tournament_id,
    roundKey: row.round_key,
    matchNumber: row.match_number,
    player1Id: row.player1_id,
    player2Id: row.player2_id ?? null,
    winnerPlayerId: row.winner_player_id ?? null,
    puzzle: cloneBoard(row.puzzle),
    solution: cloneBoard(row.solution),
    status: row.status,
    startedAt: row.started_at ?? null,
    finishedAt: row.finished_at ?? null,
  }
}

function mapTournamentMatchResult(row: TournamentMatchResultRow): TournamentMatchResult | null {
  if (
    !row.id
    || !row.tournament_id
    || !row.match_id
    || !row.player_id
    || !row.user_id
    || !isSudokuBoard(row.board)
  ) {
    return null
  }

  const completed = Boolean(row.completed)
  const failed = Boolean(row.failed)
  const status: GameStatus = completed ? 'won' : failed ? 'lost' : 'playing'

  return {
    id: row.id,
    tournamentId: row.tournament_id,
    matchId: row.match_id,
    playerId: row.player_id,
    userId: row.user_id,
    board: cloneBoard(row.board),
    completed,
    failed,
    timeSeconds: row.time_seconds ?? 0,
    mistakes: row.mistakes ?? 0,
    hintsUsed: row.hints_used ?? 0,
    score: row.score ?? 0,
    status,
    submittedAt: row.submitted_at ?? null,
  }
}

function compareMatchResults(
  left: TournamentMatchResult,
  right: TournamentMatchResult,
  leftSeed: number,
  rightSeed: number,
) {
  if (left.completed !== right.completed) {
    return left.completed ? -1 : 1
  }

  if (left.score !== right.score) {
    return right.score - left.score
  }

  if (left.timeSeconds !== right.timeSeconds) {
    return left.timeSeconds - right.timeSeconds
  }

  if (left.mistakes !== right.mistakes) {
    return left.mistakes - right.mistakes
  }

  return leftSeed - rightSeed
}

export function useTournament(
  tournamentCode?: string,
  options: UseTournamentOptions = {},
) {
  const { enabled = true } = options
  const client = supabase!
  const { user, profile, isAuthenticated } = useAuth()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [players, setPlayers] = useState<TournamentPlayer[]>([])
  const [matches, setMatches] = useState<TournamentMatch[]>([])
  const [results, setResults] = useState<TournamentMatchResult[]>([])
  const [loading, setLoading] = useState(Boolean(tournamentCode && enabled))
  const [actionLoading, setActionLoading] = useState(false)
  const [startingTournament, setStartingTournament] = useState(false)
  const [submittingResult, setSubmittingResult] = useState(false)
  const [membershipLoading, setMembershipLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const normalizedTournamentCode = tournamentCode?.trim().toUpperCase() ?? ''

  const fetchTournamentByCode = useCallback(async (code: string) => {
    const response = await runWithTimeout(
      client
        .from('tournaments')
        .select('*')
        .eq('tournament_code', code)
        .maybeSingle(),
    )
    const { data, error: tournamentError } = response as {
      data: TournamentRow | null
      error: unknown
    }

    if (tournamentError) {
      throw tournamentError
    }

    if (!data) {
      return null
    }

    return mapTournament(data)
  }, [])

  const fetchTournamentPlayers = useCallback(async (tournamentId: string) => {
    const response = await runWithTimeout(
      client
        .from('tournament_players')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('seed', { ascending: true }),
    )
    const { data, error: playersError } = response as {
      data: TournamentPlayerRow[] | null
      error: unknown
    }

    if (playersError) {
      throw playersError
    }

    return (data ?? [])
      .map((row) => mapTournamentPlayer(row as TournamentPlayerRow))
      .filter((row): row is TournamentPlayer => row !== null)
  }, [])

  const fetchTournamentMatches = useCallback(async (tournamentId: string) => {
    const response = await runWithTimeout(
      client
        .from('tournament_matches')
        .select('*')
        .eq('tournament_id', tournamentId),
    )
    const { data, error: matchesError } = response as {
      data: TournamentMatchRow[] | null
      error: unknown
    }

    if (matchesError) {
      throw matchesError
    }

    return (data ?? [])
      .map((row) => mapTournamentMatch(row as TournamentMatchRow))
      .filter((row): row is TournamentMatch => row !== null)
      .sort((left, right) => {
        const roundCompare = compareRoundKeys(left.roundKey, right.roundKey)
        if (roundCompare !== 0) {
          return roundCompare
        }

        return left.matchNumber - right.matchNumber
      })
  }, [])

  const fetchTournamentResults = useCallback(async (tournamentId: string) => {
    const response = await runWithTimeout(
      client
        .from('tournament_match_results')
        .select('*')
        .eq('tournament_id', tournamentId),
    )
    const { data, error: resultsError } = response as {
      data: TournamentMatchResultRow[] | null
      error: unknown
    }

    if (resultsError) {
      throw resultsError
    }

    return (data ?? [])
      .map((row) => mapTournamentMatchResult(row as TournamentMatchResultRow))
      .filter((row): row is TournamentMatchResult => row !== null)
  }, [])

  const ensurePlayerInTournament = useCallback(async (
    nextTournament: Tournament,
    existingPlayers: TournamentPlayer[],
  ) => {
    if (!user) {
      return existingPlayers
    }

    if (existingPlayers.some((player) => player.userId === user.id)) {
      return existingPlayers
    }

    if (nextTournament.status !== 'waiting') {
      return existingPlayers
    }

    if (existingPlayers.length >= nextTournament.maxPlayers) {
      throw new Error('Tournament is full.')
    }

    setMembershipLoading(true)

    try {
      const nextSeed = existingPlayers.length + 1
      const insertPayload = {
        tournament_id: nextTournament.id,
        user_id: user.id,
        display_name: getDisplayName(profile?.username, user.email),
        city: profile?.city ?? PROFILE_FALLBACK_CITY,
        seed: nextSeed,
      }

      const response = await runWithTimeout(
        client
          .from('tournament_players')
          .insert(insertPayload),
      )
      const { error: insertError } = response as { error: unknown }

      if (insertError) {
        throw insertError
      }

      return await fetchTournamentPlayers(nextTournament.id)
    } finally {
      setMembershipLoading(false)
    }
  }, [fetchTournamentPlayers, profile?.city, profile?.username, user])

  const maybeAdvanceTournament = useCallback(async (
    nextTournament: Tournament,
    nextPlayers: TournamentPlayer[],
    nextMatches?: TournamentMatch[],
  ) => {
    if (nextTournament.status !== 'active') {
      return
    }

    const latestMatches = nextMatches ?? await fetchTournamentMatches(nextTournament.id)
    const currentRoundMatches = latestMatches
      .filter((match) => match.roundKey === nextTournament.currentRound)
      .sort((left, right) => left.matchNumber - right.matchNumber)

    if (currentRoundMatches.length === 0 || currentRoundMatches.some((match) => match.status !== 'completed')) {
      return
    }

    const winnerIds = currentRoundMatches
      .map((match) => match.winnerPlayerId)
      .filter((winnerId): winnerId is string => Boolean(winnerId))

    if (winnerIds.length === 0) {
      return
    }

    const nextRoundKey = getTournamentNextRoundKey(nextTournament.currentRound, winnerIds.length)

    if (!nextRoundKey || winnerIds.length === 1) {
      const championPlayer = nextPlayers.find((player) => player.id === winnerIds[0])

      const response = await runWithTimeout(
        client
          .from('tournaments')
          .update({
            status: 'completed',
            champion_user_id: championPlayer?.userId ?? null,
          })
          .eq('id', nextTournament.id),
      )
      const { error: completeError } = response as { error: unknown }

      if (completeError) {
        throw completeError
      }

      return
    }

    const response = await runWithTimeout(
      client
        .from('tournament_matches')
        .select('id')
        .eq('tournament_id', nextTournament.id)
        .eq('round_key', nextRoundKey),
    )
    const { data: existingNextRoundMatches, error: nextRoundError } = response as {
      data: Array<{ id: string }> | null
      error: unknown
    }

    if (nextRoundError) {
      throw nextRoundError
    }

    if ((existingNextRoundMatches?.length ?? 0) > 0) {
      const response = await runWithTimeout(
        client
          .from('tournaments')
          .update({ current_round: nextRoundKey })
          .eq('id', nextTournament.id),
      )
      const { error: updateRoundError } = response as { error: unknown }

      if (updateRoundError) {
        throw updateRoundError
      }

      return
    }

    const nextRoundMatches = winnerIds.reduce<Array<Record<string, unknown>>>((accumulator, winnerId, index, all) => {
      if (index % 2 !== 0) {
        return accumulator
      }

      const opponentId = all[index + 1]

      if (!opponentId) {
        return accumulator
      }

      const generated = generatePuzzle(nextTournament.difficulty)

      accumulator.push({
        tournament_id: nextTournament.id,
        round_key: nextRoundKey,
        match_number: accumulator.length + 1,
        player1_id: winnerId,
        player2_id: opponentId,
        puzzle: generated.puzzle,
        solution: generated.solution,
        status: 'active',
        started_at: new Date().toISOString(),
      })

      return accumulator
    }, [])

    if (nextRoundMatches.length === 0) {
      return
    }

    const response = await runWithTimeout(
      client
        .from('tournament_matches')
        .insert(nextRoundMatches),
    )
    const { error: insertRoundError } = response as { error: unknown }

    if (insertRoundError) {
      throw insertRoundError
    }

    const response = await runWithTimeout(
      client
        .from('tournaments')
        .update({ current_round: nextRoundKey })
        .eq('id', nextTournament.id),
    )
    const { error: updateRoundError } = response as { error: unknown }

    if (updateRoundError) {
      throw updateRoundError
    }
  }, [fetchTournamentMatches])

  const loadTournamentState = useCallback(async (code = normalizedTournamentCode) => {
    if (!enabled || !code) {
      setLoading(false)
      return
    }

    if (!supabase) {
      setError(supabaseConfigError ?? 'Supabase is not configured.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const nextTournament = await fetchTournamentByCode(code)

      if (!nextTournament) {
        setTournament(null)
        setPlayers([])
        setMatches([])
        setResults([])
        setError(TOURNAMENT_NOT_FOUND_MESSAGE)
        return
      }

      const [loadedPlayers, loadedMatches, loadedResults] = await Promise.all([
        fetchTournamentPlayers(nextTournament.id),
        fetchTournamentMatches(nextTournament.id),
        fetchTournamentResults(nextTournament.id),
      ])

      const hydratedPlayers = isAuthenticated
        ? await ensurePlayerInTournament(nextTournament, loadedPlayers)
        : loadedPlayers

      setTournament(nextTournament)
      setPlayers(hydratedPlayers)
      setMatches(loadedMatches)
      setResults(loadedResults)
      setError(null)

      void maybeAdvanceTournament(nextTournament, hydratedPlayers, loadedMatches)
    } catch (loadError) {
      setTournament(null)
      setPlayers([])
      setMatches([])
      setResults([])
      setError(getErrorMessage(loadError, 'Could not load the tournament. Please try again.'))
    } finally {
      setLoading(false)
    }
  }, [
    enabled,
    ensurePlayerInTournament,
    fetchTournamentByCode,
    fetchTournamentMatches,
    fetchTournamentPlayers,
    fetchTournamentResults,
    isAuthenticated,
    maybeAdvanceTournament,
    normalizedTournamentCode,
  ])

  useEffect(() => {
    void loadTournamentState()
  }, [loadTournamentState])

  useEffect(() => {
    if (!supabase || !tournament?.id) {
      return undefined
    }

    const channel = client.channel(`tournament-${tournament.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournaments',
          filter: `id=eq.${tournament.id}`,
        },
        (payload) => {
          if (import.meta.env.DEV) {
            console.log('Tournament realtime update:', payload)
          }
          void loadTournamentState(tournament.tournamentCode)
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournament_players',
          filter: `tournament_id=eq.${tournament.id}`,
        },
        (payload) => {
          if (import.meta.env.DEV) {
            console.log('Tournament players realtime update:', payload)
          }
          void loadTournamentState(tournament.tournamentCode)
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournament_matches',
          filter: `tournament_id=eq.${tournament.id}`,
        },
        (payload) => {
          if (import.meta.env.DEV) {
            console.log('Tournament matches realtime update:', payload)
          }
          void loadTournamentState(tournament.tournamentCode)
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournament_match_results',
          filter: `tournament_id=eq.${tournament.id}`,
        },
        (payload) => {
          if (import.meta.env.DEV) {
            console.log('Tournament results realtime update:', payload)
          }
          void loadTournamentState(tournament.tournamentCode)
        },
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        void client.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [loadTournamentState, tournament?.id, tournament?.tournamentCode])

  const createTournament = useCallback(async ({
    title,
    difficulty,
    maxPlayers,
  }: CreateTournamentInput): Promise<TournamentActionResult> => {
    if (!isAuthenticated || !user) {
      return { ok: false, message: 'Sign in to create a tournament.' }
    }

    if (!supabase) {
      return { ok: false, message: supabaseConfigError ?? 'Supabase is not configured.' }
    }

    setActionLoading(true)
    setError(null)

    try {
      let tournamentCodeCandidate = ''
      let attempts = 0

      while (attempts < 5) {
        attempts += 1
        const nextCode = createTournamentCode()
        const existing = await fetchTournamentByCode(nextCode)

        if (!existing) {
          tournamentCodeCandidate = nextCode
          break
        }
      }

      if (!tournamentCodeCandidate) {
        throw new Error('Could not create a unique tournament code. Please try again.')
      }

      const currentRound = getTournamentRoundKeyForPlayerCount(maxPlayers)

      if (!currentRound) {
        throw new Error('Unsupported tournament size.')
      }

      const createResponse = await runWithTimeout(
        client
          .from('tournaments')
          .insert({
            host_user_id: user.id,
            tournament_code: tournamentCodeCandidate,
            title,
            difficulty,
            status: 'waiting',
            max_players: maxPlayers,
            current_round: currentRound,
          })
          .select('*')
          .single(),
      )
      const { data: createdTournamentRow, error: createError } = createResponse as {
        data: TournamentRow | null
        error: unknown
      }

      if (createError) {
        throw createError
      }

      const createdTournament = createdTournamentRow ? mapTournament(createdTournamentRow) : null

      if (!createdTournament) {
        throw new Error('Could not create the tournament.')
      }

      const playerResponse = await runWithTimeout(
        client
          .from('tournament_players')
          .insert({
            tournament_id: createdTournament.id,
            user_id: user.id,
            display_name: getDisplayName(profile?.username, user.email),
            city: profile?.city ?? PROFILE_FALLBACK_CITY,
            seed: 1,
          }),
      )
      const { error: createPlayerError } = playerResponse as { error: unknown }

      if (createPlayerError) {
        throw createPlayerError
      }

      return { ok: true, tournamentCode: tournamentCodeCandidate }
    } catch (createError) {
      return {
        ok: false,
        message: getErrorMessage(createError, 'Could not create the tournament. Please try again.'),
      }
    } finally {
      setActionLoading(false)
    }
  }, [
    fetchTournamentByCode,
    isAuthenticated,
    profile?.city,
    profile?.username,
    user,
  ])

  const joinTournament = useCallback(async (code: string): Promise<TournamentActionResult> => {
    if (!isAuthenticated || !user) {
      return { ok: false, message: 'Sign in to join a tournament.' }
    }

    if (!supabase) {
      return { ok: false, message: supabaseConfigError ?? 'Supabase is not configured.' }
    }

    const normalizedCode = code.trim().toUpperCase()

    if (!normalizedCode) {
      return { ok: false, message: 'Enter a tournament code.' }
    }

    setActionLoading(true)
    setError(null)

    try {
      const nextTournament = await fetchTournamentByCode(normalizedCode)

      if (!nextTournament) {
        return { ok: false, message: TOURNAMENT_NOT_FOUND_MESSAGE }
      }

      if (nextTournament.status !== 'waiting') {
        return { ok: false, message: 'Tournament already started.' }
      }

      const nextPlayers = await fetchTournamentPlayers(nextTournament.id)
      const currentPlayerEntry = nextPlayers.find((player) => player.userId === user.id)

      if (!currentPlayerEntry && nextPlayers.length >= nextTournament.maxPlayers) {
        return { ok: false, message: 'Tournament is full.' }
      }

      await ensurePlayerInTournament(nextTournament, nextPlayers)

      return { ok: true, tournamentCode: normalizedCode }
    } catch (joinError) {
      return {
        ok: false,
        message: getErrorMessage(joinError, 'Could not join the tournament. Please try again.'),
      }
    } finally {
      setActionLoading(false)
    }
  }, [
    ensurePlayerInTournament,
    fetchTournamentByCode,
    fetchTournamentPlayers,
    isAuthenticated,
    user,
  ])

  const startTournament = useCallback(async (): Promise<TournamentActionResult> => {
    if (!tournament || !user || user.id !== tournament.hostUserId) {
      return { ok: false, message: 'Only the host can start the tournament.' }
    }

    if (!supabase) {
      return { ok: false, message: supabaseConfigError ?? 'Supabase is not configured.' }
    }

    setStartingTournament(true)
    setError(null)

    try {
      const latestPlayers = await fetchTournamentPlayers(tournament.id)

      if (latestPlayers.length < 2) {
        return { ok: false, message: 'Need at least 2 players.' }
      }

      if (!POWER_OF_TWO_PLAYER_COUNTS.has(latestPlayers.length)) {
        return {
          ok: false,
          message: 'Need 2, 4, 8, 16, or 32 players to start this bracket.',
        }
      }

      const roundKey = getTournamentRoundKeyForPlayerCount(latestPlayers.length)

      if (!roundKey) {
        return {
          ok: false,
          message: 'Could not create matches for this tournament size.',
        }
      }

      const latestMatches = await fetchTournamentMatches(tournament.id)

      if (latestMatches.length > 0) {
        return { ok: false, message: 'Tournament already started.' }
      }

      const sortedPlayers = [...latestPlayers].sort((left, right) => left.seed - right.seed)
      const matchPayloads = sortedPlayers.reduce<Array<Record<string, unknown>>>((accumulator, player, index, all) => {
        if (index % 2 !== 0) {
          return accumulator
        }

        const opponent = all[index + 1]

        if (!opponent) {
          return accumulator
        }

        const generated = generatePuzzle(tournament.difficulty)

        accumulator.push({
          tournament_id: tournament.id,
          round_key: roundKey,
          match_number: accumulator.length + 1,
          player1_id: player.id,
          player2_id: opponent.id,
          puzzle: generated.puzzle,
          solution: generated.solution,
          status: 'active',
          started_at: new Date().toISOString(),
        })

        return accumulator
      }, [])

      if (matchPayloads.length === 0) {
        return { ok: false, message: 'Could not create matches.' }
      }

      const insertMatchesResponse = await runWithTimeout(
        client
          .from('tournament_matches')
          .insert(matchPayloads),
      )
      const { error: insertMatchesError } = insertMatchesResponse as { error: unknown }

      if (insertMatchesError) {
        throw insertMatchesError
      }

      const updateTournamentResponse = await runWithTimeout(
        client
          .from('tournaments')
          .update({
            status: 'active',
            current_round: roundKey,
          })
          .eq('id', tournament.id),
      )
      const { error: updateTournamentError } = updateTournamentResponse as { error: unknown }

      if (updateTournamentError) {
        throw updateTournamentError
      }

      await loadTournamentState(tournament.tournamentCode)

      return { ok: true, tournamentCode: tournament.tournamentCode }
    } catch (startError) {
      return {
        ok: false,
        message: getErrorMessage(startError, 'Could not create matches. Please try again.'),
      }
    } finally {
      setStartingTournament(false)
    }
  }, [
    fetchTournamentMatches,
    fetchTournamentPlayers,
    loadTournamentState,
    tournament,
    user,
  ])

  const currentPlayer = useMemo(
    () => players.find((player) => player.userId === user?.id) ?? null,
    [players, user?.id],
  )

  const currentMatch = useMemo(() => {
    if (!currentPlayer) {
      return null
    }

    return matches.find(
      (match) =>
        match.status === 'active'
        && (match.player1Id === currentPlayer.id || match.player2Id === currentPlayer.id),
    ) ?? null
  }, [currentPlayer, matches])

  const currentMatchResult = useMemo(() => {
    if (!currentPlayer || !currentMatch) {
      return null
    }

    return results.find(
      (result) =>
        result.matchId === currentMatch.id
        && result.playerId === currentPlayer.id,
    ) ?? null
  }, [currentMatch, currentPlayer, results])

  const opponentPlayer = useMemo(() => {
    if (!currentPlayer || !currentMatch) {
      return null
    }

    const opponentId = currentMatch.player1Id === currentPlayer.id
      ? currentMatch.player2Id
      : currentMatch.player1Id

    if (!opponentId) {
      return null
    }

    return players.find((player) => player.id === opponentId) ?? null
  }, [currentMatch, currentPlayer, players])

  const playerMatches = useMemo(() => {
    if (!currentPlayer) {
      return []
    }

    return matches.filter(
      (match) => match.player1Id === currentPlayer.id || match.player2Id === currentPlayer.id,
    )
  }, [currentPlayer, matches])

  const latestPlayerMatch = useMemo(() => {
    if (playerMatches.length === 0) {
      return null
    }

    return [...playerMatches].sort((left, right) => {
      const roundCompare = compareRoundKeys(left.roundKey, right.roundKey)

      if (roundCompare !== 0) {
        return roundCompare
      }

      return left.matchNumber - right.matchNumber
    }).at(-1) ?? null
  }, [playerMatches])

  const isChampion = Boolean(tournament && currentPlayer && tournament.championUserId === currentPlayer.userId)
  const isEliminated = Boolean(
    tournament
    && currentPlayer
    && tournament.status !== 'waiting'
    && !currentMatch
    && !isChampion
    && latestPlayerMatch
    && latestPlayerMatch.status === 'completed'
    && latestPlayerMatch.winnerPlayerId !== currentPlayer.id,
  )
  const isWaitingForNextRound = Boolean(
    tournament
    && currentPlayer
    && tournament.status === 'active'
    && !currentMatch
    && latestPlayerMatch
    && latestPlayerMatch.status === 'completed'
    && latestPlayerMatch.winnerPlayerId === currentPlayer.id,
  )
  const isWaitingForOpponent = Boolean(currentMatch && currentMatchResult && currentMatch.status === 'active')

  const submitMatchResult = useCallback(async ({
    matchId,
    board,
    timeSeconds,
    mistakes,
    hintsUsed,
    status,
  }: SubmitTournamentMatchResultInput): Promise<SubmitTournamentMatchResultResult> => {
    if (!tournament || !user || !currentPlayer) {
      return { ok: false, message: 'Join the tournament before submitting a result.' }
    }

    const match = matches.find((item) => item.id === matchId)

    if (!match) {
      return { ok: false, message: 'Match not found.' }
    }

    if (match.status === 'completed') {
      return { ok: false, message: 'This match already has a winner.' }
    }

    if (currentMatchResult && currentMatchResult.matchId === matchId) {
      return { ok: true, message: 'Result already submitted. Waiting for opponent...' }
    }

    setSubmittingResult(true)
    setError(null)

    try {
      const score = calculateScore({
        difficulty: tournament.difficulty,
        timeSeconds,
        mistakes,
        hintsUsed,
        status,
      })

      const resultPayload = {
        tournament_id: tournament.id,
        match_id: matchId,
        player_id: currentPlayer.id,
        user_id: user.id,
        board,
        completed: status === 'won',
        failed: status === 'lost',
        time_seconds: timeSeconds,
        mistakes,
        hints_used: hintsUsed,
        score,
        submitted_at: new Date().toISOString(),
      }

      const submitResponse = await runWithTimeout(
        client
          .from('tournament_match_results')
          .upsert(resultPayload, { onConflict: 'match_id,player_id' }),
      )
      const { error: submitError } = submitResponse as { error: unknown }

      if (submitError) {
        throw submitError
      }

      const loadResultsResponse = await runWithTimeout(
        client
          .from('tournament_match_results')
          .select('*')
          .eq('match_id', matchId),
      )
      const { data: rawResults, error: loadResultsError } = loadResultsResponse as {
        data: TournamentMatchResultRow[] | null
        error: unknown
      }

      if (loadResultsError) {
        throw loadResultsError
      }

      const matchResults = (rawResults ?? [])
        .map((row) => mapTournamentMatchResult(row as TournamentMatchResultRow))
        .filter((row): row is TournamentMatchResult => row !== null)

      if (matchResults.length < 2) {
        await loadTournamentState(tournament.tournamentCode)
        return { ok: true, message: 'Result submitted. Waiting for opponent...' }
      }

      const playerSeedMap = new Map(players.map((player) => [player.id, player.seed]))
      const [leftResult, rightResult] = matchResults
      const leftSeed = playerSeedMap.get(leftResult.playerId) ?? Number.MAX_SAFE_INTEGER
      const rightSeed = playerSeedMap.get(rightResult.playerId) ?? Number.MAX_SAFE_INTEGER
      const comparison = compareMatchResults(leftResult, rightResult, leftSeed, rightSeed)
      const winnerPlayerId = comparison <= 0 ? leftResult.playerId : rightResult.playerId

      const updateMatchResponse = await runWithTimeout(
        client
          .from('tournament_matches')
          .update({
            winner_player_id: winnerPlayerId,
            status: 'completed',
            finished_at: new Date().toISOString(),
          })
          .eq('id', matchId),
      )
      const { error: updateMatchError } = updateMatchResponse as { error: unknown }

      if (updateMatchError) {
        throw updateMatchError
      }

      const latestTournament = await fetchTournamentByCode(tournament.tournamentCode)

      if (latestTournament) {
        const [latestPlayers, latestMatches] = await Promise.all([
          fetchTournamentPlayers(latestTournament.id),
          fetchTournamentMatches(latestTournament.id),
        ])

        await maybeAdvanceTournament(latestTournament, latestPlayers, latestMatches)
      }

      await loadTournamentState(tournament.tournamentCode)

      return { ok: true, message: 'Result submitted.' }
    } catch (submitError) {
      return {
        ok: false,
        message: getErrorMessage(submitError, 'Could not submit result. Please try again.'),
      }
    } finally {
      setSubmittingResult(false)
    }
  }, [
    currentMatchResult,
    currentPlayer,
    fetchTournamentByCode,
    fetchTournamentMatches,
    fetchTournamentPlayers,
    loadTournamentState,
    matches,
    maybeAdvanceTournament,
    players,
    tournament,
    user,
  ])

  const championPlayer = useMemo(
    () => players.find((player) => player.userId === tournament?.championUserId) ?? null,
    [players, tournament?.championUserId],
  )

  const bracketRounds = useMemo(() => {
    if (matches.length > 0) {
      const startRound = [...matches]
        .sort((left, right) => compareRoundKeys(left.roundKey, right.roundKey))[0]
        ?.roundKey

      if (startRound === 'round_32') {
        return ['round_32', 'round_16', 'round_8', 'semi_final', 'final'] as TournamentRoundKey[]
      }

      if (startRound === 'round_16') {
        return ['round_16', 'round_8', 'semi_final', 'final'] as TournamentRoundKey[]
      }

      if (startRound === 'round_8' || startRound === 'quarter_final') {
        return ['round_8', 'semi_final', 'final'] as TournamentRoundKey[]
      }

      if (startRound === 'semi_final') {
        return ['semi_final', 'final'] as TournamentRoundKey[]
      }
    }

    return getTournamentBracketRounds(tournament?.maxPlayers ?? 4)
  }, [matches, tournament?.maxPlayers])

  const refetch = useCallback(async () => {
    await loadTournamentState()
  }, [loadTournamentState])

  return {
    tournament,
    players,
    matches,
    results,
    currentPlayer,
    currentMatch,
    currentMatchResult,
    opponentPlayer,
    championPlayer,
    bracketRounds,
    loading,
    actionLoading,
    startingTournament,
    submittingResult,
    membershipLoading,
    error,
    isHost: Boolean(tournament && user && tournament.hostUserId === user.id),
    canStartTournament: Boolean(tournament && user && tournament.hostUserId === user.id && tournament.status === 'waiting'),
    isWaitingForOpponent,
    isWaitingForNextRound,
    isEliminated,
    isChampion,
    createTournament,
    joinTournament,
    startTournament,
    submitMatchResult,
    refetch,
  }
}
