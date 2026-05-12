import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MAX_MISTAKES } from '../constants/game'
import { isDifficulty } from '../constants/difficulty'
import { useAuth } from './useAuth'
import { createEmptyBoard, generatePuzzle } from '../lib/sudokuGenerator'
import { calculateScore } from '../lib/scoring'
import { supabase, supabaseConfigError } from '../lib/supabaseClient'
import { withTimeout } from '../lib/withTimeout'
import {
  findConflictingCells,
  isBoardComplete,
  isSolved,
} from '../lib/sudokuValidator'
import type {
  CandidateValue,
  CellPosition,
  CheckResult,
  GameStatus,
  LastMove,
  NotesBoard,
  SudokuBoard,
} from '../types/sudoku'
import type {
  CreateOnlineRoomInput,
  OnlineMode,
  OnlineRoom,
  OnlineRoomPlayer,
  OnlineRoomStatus,
  OnlineSyncStatus,
} from '../types/online'

const EMPTY_BOARD = createEmptyBoard()
const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const ONLINE_ROOM_SCHEMA_MIGRATION_MESSAGE =
  'Online room database schema needs migration. Please run the latest SQL migration.'
const ONLINE_ROOM_PLAYER_SCHEMA_MIGRATION_MESSAGE =
  'Online room player schema needs migration. Please add created_at or use joined_at.'
const ROOM_NOT_FOUND_MESSAGE = 'Room not found or expired.'
const SHARED_BOARD_SYNC_ERROR_MESSAGE =
  'Could not sync the shared board. Please refresh or try again.'
type UseOnlineRoomOptions = {
  enabled?: boolean
}

type OnlineRoomRow = {
  id: string
  host_user_id: string | null
  room_code: string | null
  mode: string | null
  difficulty: string | null
  puzzle: unknown
  solution: unknown
  shared_board: unknown
  board?: unknown
  status: string | null
  winner_user_id: string | null
  created_at: string | null
  updated_at?: string | null
}

type OnlineRoomPlayerRow = {
  id: string
  room_id: string | null
  user_id: string | null
  display_name: string | null
  city: string | null
  personal_board: unknown
  completed: boolean | null
  time_seconds: number | null
  mistakes: number | null
  hints_used: number | null
  score: number | null
  finished_at: string | null
  created_at?: string | null
  joined_at?: string | null
}

type ActionResult =
  | { ok: true; roomCode: string; message?: string }
  | { ok: false; message: string }

function cloneBoard(board: SudokuBoard): SudokuBoard {
  return board.map((row) => [...row]) as SudokuBoard
}

function boardDiffers(left: SudokuBoard, right: SudokuBoard) {
  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      if (left[row][col] !== right[row][col]) {
        return true
      }
    }
  }

  return false
}

function cloneNotesBoard(notes: NotesBoard): NotesBoard {
  return notes.map((row) => row.map((cell) => [...cell])) as NotesBoard
}

function createFixedCells(board: SudokuBoard) {
  return board.map((row) => row.map((cell) => cell !== 0))
}

function createEmptyNotesBoard(): NotesBoard {
  return Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => [] as CandidateValue[]),
  )
}

function positionKey(row: number, col: number) {
  return `${row}:${col}`
}

function getInvalidPositions(
  board: SudokuBoard,
  solution: SudokuBoard,
  fixedCells: boolean[][],
) {
  const invalidPositions = new Set<string>()

  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      const value = board[row][col]

      if (value === 0) {
        continue
      }

      if (!fixedCells[row][col] && value !== solution[row][col]) {
        invalidPositions.add(positionKey(row, col))
      }

      const conflicts = findConflictingCells(board, row, col, value)

      if (conflicts.length > 0) {
        invalidPositions.add(positionKey(row, col))

        for (const conflict of conflicts) {
          invalidPositions.add(positionKey(conflict.row, conflict.col))
        }
      }
    }
  }

  return invalidPositions
}

function isCellValue(value: unknown) {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 9
}

function isSudokuBoard(board: unknown): board is SudokuBoard {
  return Array.isArray(board)
    && board.length === 9
    && board.every(
      (row) =>
        Array.isArray(row) && row.length === 9 && row.every((cell) => isCellValue(cell)),
    )
}

function isOnlineMode(value: unknown): value is OnlineMode {
  return value === 'collaborative' || value === 'race'
}

function isOnlineRoomStatus(value: unknown): value is OnlineRoomStatus {
  return value === 'active' || value === 'completed'
}

function getSupabaseErrorContext(error: unknown) {
  if (!error || typeof error !== 'object') {
    return {
      code: '',
      message: '',
      details: '',
      hint: '',
      combined: '',
    }
  }

  const code = 'code' in error && typeof error.code === 'string'
    ? error.code
    : ''
  const message = 'message' in error && typeof error.message === 'string'
    ? error.message
    : ''
  const details = 'details' in error && typeof error.details === 'string'
    ? error.details
    : ''
  const hint = 'hint' in error && typeof error.hint === 'string'
    ? error.hint
    : ''

  return {
    code,
    message,
    details,
    hint,
    combined: `${message} ${details} ${hint}`.toLowerCase(),
  }
}

function isOnlineRoomSchemaError(error: unknown) {
  const { code, combined } = getSupabaseErrorContext(error)
  const mentionsBoardColumn = /\bshared_board\b|\bboard\b/.test(combined)
  const mentionsSchemaIssue = combined.includes('schema cache')
    || combined.includes('could not find')
    || combined.includes('column')
    || combined.includes('not-null')
    || combined.includes('violates not-null constraint')
    || combined.includes('null value')

  return mentionsBoardColumn && (
    code === '42703'
    || code === '23502'
    || code === 'PGRST204'
    || mentionsSchemaIssue
  )
}

function isOnlineRoomPlayerTimestampSchemaError(error: unknown) {
  const { code, combined } = getSupabaseErrorContext(error)
  const mentionsTimestampColumn = combined.includes('online_room_players.created_at')
    || combined.includes('online_room_players.joined_at')
    || (
      combined.includes('online_room_players')
      && (combined.includes('created_at') || combined.includes('joined_at'))
    )
  const mentionsSchemaIssue = combined.includes('schema cache')
    || combined.includes('could not find')
    || combined.includes('column')
    || combined.includes('does not exist')

  return mentionsTimestampColumn && (
    code === '42703'
    || code === 'PGRST204'
    || mentionsSchemaIssue
  )
}

function isOnlineRoomUpdatedAtSchemaError(error: unknown) {
  const { code, combined } = getSupabaseErrorContext(error)
  const mentionsUpdatedAt = combined.includes('online_rooms.updated_at')
    || (combined.includes('online_rooms') && combined.includes('updated_at'))
  const mentionsSchemaIssue = combined.includes('schema cache')
    || combined.includes('could not find')
    || combined.includes('column')
    || combined.includes('does not exist')

  return mentionsUpdatedAt && (
    code === '42703'
    || code === 'PGRST204'
    || mentionsSchemaIssue
  )
}

function getErrorMessage(error: unknown, fallbackMessage: string) {
  if (isOnlineRoomPlayerTimestampSchemaError(error)) {
    return ONLINE_ROOM_PLAYER_SCHEMA_MIGRATION_MESSAGE
  }

  if (isOnlineRoomSchemaError(error)) {
    return ONLINE_ROOM_SCHEMA_MIGRATION_MESSAGE
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

function normalizeRoom(row: OnlineRoomRow | null): OnlineRoom | null {
  const sharedBoard = isSudokuBoard(row?.shared_board)
    ? row.shared_board
    : isSudokuBoard(row?.board)
      ? row.board
      : isSudokuBoard(row?.puzzle)
        ? row.puzzle
        : null

  if (
    !row
    || !row.id
    || !row.host_user_id
    || !row.room_code
    || !row.mode
    || !row.difficulty
    || !row.status
    || !isOnlineMode(row.mode)
    || !isDifficulty(row.difficulty)
    || !isOnlineRoomStatus(row.status)
    || !isSudokuBoard(row.puzzle)
    || !isSudokuBoard(row.solution)
    || !sharedBoard
  ) {
    return null
  }

  return {
    id: row.id,
    hostUserId: row.host_user_id,
    roomCode: row.room_code,
    mode: row.mode,
    difficulty: row.difficulty,
    puzzle: row.puzzle,
    solution: row.solution,
    sharedBoard,
    status: row.status,
    winnerUserId: row.winner_user_id,
    createdAt: row.created_at,
  }
}

function normalizePlayer(row: OnlineRoomPlayerRow): OnlineRoomPlayer | null {
  if (!row.id || !row.room_id || !row.user_id) {
    return null
  }

  if (row.personal_board != null && !isSudokuBoard(row.personal_board)) {
    return null
  }

  return {
    id: row.id,
    roomId: row.room_id,
    userId: row.user_id,
    displayName: row.display_name?.trim() || 'Sudoku Focus Player',
    city: row.city?.trim() || 'Almaty',
    personalBoard: (row.personal_board ?? null) as SudokuBoard | null,
    completed: row.completed ?? false,
    timeSeconds: row.time_seconds ?? 0,
    mistakes: row.mistakes ?? 0,
    hintsUsed: row.hints_used ?? 0,
    score: row.score ?? 0,
    finishedAt: row.finished_at,
    createdAt: row.created_at ?? null,
    joinedAt: row.joined_at ?? null,
  }
}

function generateRoomCode() {
  let roomCode = ''

  for (let index = 0; index < 6; index += 1) {
    const randomIndex = Math.floor(Math.random() * ROOM_CODE_ALPHABET.length)
    roomCode += ROOM_CODE_ALPHABET[randomIndex]
  }

  return roomCode
}

function getDisplayName(email: string | null | undefined, username: string | null | undefined) {
  return username?.trim() || email?.split('@')[0] || 'Sudoku Focus Player'
}

function isRacePlayerFailed(player: Pick<OnlineRoomPlayer, 'completed' | 'mistakes' | 'score' | 'finishedAt'>) {
  return !player.completed && Boolean(player.finishedAt) && player.mistakes >= MAX_MISTAKES && player.score === 0
}

function toRoomRow(room: OnlineRoom): OnlineRoomRow {
  return {
    id: room.id,
    host_user_id: room.hostUserId,
    room_code: room.roomCode,
    mode: room.mode,
    difficulty: room.difficulty,
    puzzle: room.puzzle,
    solution: room.solution,
    shared_board: room.sharedBoard,
    board: room.sharedBoard,
    status: room.status,
    winner_user_id: room.winnerUserId,
    created_at: room.createdAt,
  }
}

function mergeRealtimeRoom(currentRoom: OnlineRoom, partialRow: Partial<OnlineRoomRow>) {
  return normalizeRoom({
    ...toRoomRow(currentRoom),
    ...partialRow,
    puzzle: isSudokuBoard(partialRow.puzzle) ? partialRow.puzzle : currentRoom.puzzle,
    solution: isSudokuBoard(partialRow.solution) ? partialRow.solution : currentRoom.solution,
    shared_board: isSudokuBoard(partialRow.shared_board) ? partialRow.shared_board : currentRoom.sharedBoard,
    board: isSudokuBoard(partialRow.board) ? partialRow.board : currentRoom.sharedBoard,
    status: isOnlineRoomStatus(partialRow.status) ? partialRow.status : currentRoom.status,
    mode: isOnlineMode(partialRow.mode) ? partialRow.mode : currentRoom.mode,
    difficulty: isDifficulty(partialRow.difficulty) ? partialRow.difficulty : currentRoom.difficulty,
    winner_user_id:
      typeof partialRow.winner_user_id === 'string' || partialRow.winner_user_id === null
        ? partialRow.winner_user_id
        : currentRoom.winnerUserId,
    created_at:
      typeof partialRow.created_at === 'string' || partialRow.created_at === null
        ? partialRow.created_at
        : currentRoom.createdAt,
  })
}

export function useOnlineRoom(roomCode?: string, options?: UseOnlineRoomOptions) {
  const { isAuthenticated, profile, user } = useAuth()
  const isEnabled = options?.enabled ?? true
  const [room, setRoom] = useState<OnlineRoom | null>(null)
  const [players, setPlayers] = useState<OnlineRoomPlayer[]>([])
  const [loading, setLoading] = useState(Boolean(roomCode && isEnabled))
  const [actionLoading, setActionLoading] = useState(false)
  const [membershipLoading, setMembershipLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [syncStatus, setSyncStatus] = useState<OnlineSyncStatus>('connected')
  const [localBoard, setLocalBoard] = useState<SudokuBoard>(() => cloneBoard(EMPTY_BOARD))
  const [notes, setNotes] = useState<NotesBoard>(() => createEmptyNotesBoard())
  const [selectedCell, setSelectedCell] = useState<CellPosition | null>(null)
  const [notesMode, setNotesMode] = useState(false)
  const [mistakes, setMistakes] = useState(0)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [lastMove, setLastMove] = useState<LastMove | null>(null)
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing')
  const [completed, setCompleted] = useState(false)
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null)
  const [hasStarted, setHasStarted] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const joinedMembershipKeyRef = useRef<string | null>(null)
  const syncedBoardKeyRef = useRef('')
  const roomRef = useRef<OnlineRoom | null>(null)
  const normalizedRoomCode = roomCode?.trim().toUpperCase() ?? null

  const currentPlayer = useMemo(
    () => (user ? players.find((player) => player.userId === user.id) ?? null : null),
    [players, user],
  )

  const boardSource = useMemo(() => {
    if (!room) {
      return EMPTY_BOARD
    }

    if (room.mode === 'collaborative') {
      return room.sharedBoard
    }

    return currentPlayer?.personalBoard ?? room.puzzle
  }, [currentPlayer?.personalBoard, room])
  const remoteBoardKey = useMemo(() => JSON.stringify(boardSource), [boardSource])

  const fixedCells = useMemo(
    () => createFixedCells(room?.puzzle ?? EMPTY_BOARD),
    [room?.puzzle],
  )
  const isGameOver = gameStatus !== 'playing'
  const mistakeLimit = MAX_MISTAKES
  const mistakesRemaining = Math.max(0, mistakeLimit - mistakes)
  const selectedValue = selectedCell ? localBoard[selectedCell.row][selectedCell.col] : 0
  const selectedNotes = selectedCell ? notes[selectedCell.row][selectedCell.col] : []
  const invalidCellKeys = useMemo(
    () => (room ? getInvalidPositions(localBoard, room.solution, fixedCells) : new Set<string>()),
    [fixedCells, localBoard, room],
  )
  const standings = useMemo(
    () => [...players].sort((left, right) => {
      const leftFailed = isRacePlayerFailed(left)
      const rightFailed = isRacePlayerFailed(right)

      if (left.completed !== right.completed) {
        return Number(right.completed) - Number(left.completed)
      }

      if (leftFailed !== rightFailed) {
        return Number(leftFailed) - Number(rightFailed)
      }

      if (left.score !== right.score) {
        return right.score - left.score
      }

      if (left.timeSeconds !== right.timeSeconds) {
        return left.timeSeconds - right.timeSeconds
      }

      return left.displayName.localeCompare(right.displayName)
    }),
    [players],
  )
  const winnerPlayer = useMemo(
    () => (room?.winnerUserId ? players.find((player) => player.userId === room.winnerUserId) ?? null : null),
    [players, room?.winnerUserId],
  )
  const canEdit = Boolean(
    isAuthenticated
    && user
    && room
    && currentPlayer
    && room.status === 'active'
    && !isGameOver,
  )
  const formattedTime = useMemo(() => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }, [seconds])

  const fetchRoomByCode = useCallback(async (targetRoomCode: string) => {
    if (!supabase) {
      throw new Error(supabaseConfigError ?? 'Supabase is not configured.')
    }

    const { data, error: roomError } = await withTimeout(
      Promise.resolve(
        supabase
          .from('online_rooms')
          .select('id, host_user_id, room_code, mode, difficulty, puzzle, solution, shared_board, board, status, winner_user_id, created_at')
          .eq('room_code', targetRoomCode)
          .maybeSingle(),
      ),
      12000,
    )

    if (roomError) {
      throw roomError
    }

    return normalizeRoom((data ?? null) as OnlineRoomRow | null)
  }, [])

  const fetchPlayersByRoomId = useCallback(async (roomId: string) => {
    if (!supabase) {
      throw new Error(supabaseConfigError ?? 'Supabase is not configured.')
    }

    const supabaseClient = supabase
    const baseSelect =
      'id, room_id, user_id, display_name, city, personal_board, completed, time_seconds, mistakes, hints_used, score, finished_at'
    const selectPlayers = async (timestampColumn: 'created_at' | 'joined_at') =>
      supabaseClient
        .from('online_room_players')
        .select(`${baseSelect}, ${timestampColumn}`)
        .eq('room_id', roomId)
        .order(timestampColumn, { ascending: true })

    let { data, error: playersError } = await withTimeout(
      selectPlayers('created_at'),
      12000,
    )

    if (playersError && isOnlineRoomPlayerTimestampSchemaError(playersError)) {
      const fallbackResult = await withTimeout(
        selectPlayers('joined_at'),
        12000,
      )
      data = fallbackResult.data
      playersError = fallbackResult.error
    }

    if (playersError) {
      throw playersError
    }

    return ((data ?? []) as OnlineRoomPlayerRow[])
      .map(normalizePlayer)
      .filter((player): player is OnlineRoomPlayer => player !== null)
  }, [])

  const loadRoomState = useCallback(async (targetRoomCode: string) => {
    const loadedRoom = await fetchRoomByCode(targetRoomCode)

    if (!loadedRoom) {
      setRoom(null)
      setPlayers([])
      throw new Error(ROOM_NOT_FOUND_MESSAGE)
    }

    const nextPlayers = await fetchPlayersByRoomId(loadedRoom.id)
    setRoom(loadedRoom)
    setPlayers(nextPlayers)
    setLocalBoard(cloneBoard(loadedRoom.mode === 'collaborative' ? loadedRoom.sharedBoard : loadedRoom.puzzle))
    setError(null)
    return loadedRoom
  }, [fetchPlayersByRoomId, fetchRoomByCode])

  const updateCurrentPlayer = useCallback(async (values: Record<string, unknown>) => {
    if (!supabase || !currentPlayer) {
      return
    }

    const { error: updateError } = await supabase
      .from('online_room_players')
      .update(values)
      .eq('id', currentPlayer.id)

    if (updateError) {
      throw updateError
    }
  }, [currentPlayer])

  const applyCollaborativeBoardLocally = useCallback((
    nextBoard: SudokuBoard,
    nextStatus?: OnlineRoomStatus,
  ) => {
    setLocalBoard(cloneBoard(nextBoard))
    syncedBoardKeyRef.current = JSON.stringify(nextBoard)

    setRoom((currentRoom) => {
      if (!currentRoom || currentRoom.mode !== 'collaborative') {
        return currentRoom
      }

      const nextRoom: OnlineRoom = {
        ...currentRoom,
        sharedBoard: cloneBoard(nextBoard),
        status: nextStatus ?? currentRoom.status,
      }

      roomRef.current = nextRoom
      return nextRoom
    })
  }, [])

  const ensurePlayerMembership = useCallback(async (targetRoom: OnlineRoom) => {
    if (!supabase || !user) {
      throw new Error('Sign in to join this room.')
    }

    setMembershipLoading(true)

    try {
      const displayName = getDisplayName(user.email, profile?.username)
      const city = profile?.city ?? 'Almaty'

      const { error: membershipError } = await supabase
        .from('online_room_players')
        .upsert(
          {
            room_id: targetRoom.id,
            user_id: user.id,
            display_name: displayName,
            city,
            personal_board: targetRoom.puzzle,
            completed: false,
            time_seconds: 0,
            mistakes: 0,
            hints_used: 0,
            score: 0,
          },
          { onConflict: 'room_id,user_id' },
        )

      if (membershipError) {
        throw membershipError
      }

      const nextPlayers = await fetchPlayersByRoomId(targetRoom.id)
      setPlayers(nextPlayers)
      setError(null)
    } finally {
      setMembershipLoading(false)
    }
  }, [fetchPlayersByRoomId, profile?.city, profile?.username, user])

  const initializeRacePersonalBoard = useCallback(async () => {
    if (!room || room.mode !== 'race' || !supabase || !user) {
      return
    }

    if (!currentPlayer) {
      await ensurePlayerMembership(room)
      return
    }

    if (currentPlayer.personalBoard) {
      return
    }

    if (import.meta.env.DEV) {
      console.log('Initializing personal_board for race player')
    }

    const nextBoard = cloneBoard(room.puzzle)
    setPlayers((currentPlayers) =>
      currentPlayers.map((player) =>
        player.id === currentPlayer.id
          ? { ...player, personalBoard: nextBoard }
          : player,
      ),
    )
    setLocalBoard(nextBoard)

    const { error: initializeError } = await supabase
      .from('online_room_players')
      .update({ personal_board: nextBoard })
      .eq('id', currentPlayer.id)

    if (initializeError) {
      throw initializeError
    }
  }, [currentPlayer, ensurePlayerMembership, room, user])

  const refetch = useCallback(async () => {
    if (!normalizedRoomCode || !isEnabled) {
      return
    }

    setLoading(true)

    try {
      await withTimeout(
        loadRoomState(normalizedRoomCode),
        15000,
      )
    } catch (refetchError) {
      setError(getErrorMessage(refetchError, 'Could not connect to Supabase. Please try again.'))
    } finally {
      setLoading(false)
    }
  }, [isEnabled, loadRoomState, normalizedRoomCode])

  const createRoom = useCallback(async ({
    mode,
    difficulty,
  }: CreateOnlineRoomInput): Promise<ActionResult> => {
    if (!user) {
      return { ok: false, message: 'Sign in to create an online room.' }
    }

    if (!supabase) {
      return { ok: false, message: supabaseConfigError ?? 'Supabase is not configured.' }
    }

    setActionLoading(true)

    try {
      return await withTimeout((async (): Promise<ActionResult> => {
        const generatedPuzzle = generatePuzzle(difficulty)
        const displayName = getDisplayName(user.email, profile?.username)
        const city = profile?.city ?? 'Almaty'

        for (let attempt = 0; attempt < 5; attempt += 1) {
          const nextRoomCode = generateRoomCode()
          const roomInsert: Record<string, unknown> = {
            host_user_id: user.id,
            room_code: nextRoomCode,
            mode,
            difficulty,
            puzzle: generatedPuzzle.puzzle,
            solution: generatedPuzzle.solution,
            shared_board: generatedPuzzle.puzzle,
            board: generatedPuzzle.puzzle,
            status: 'active',
          }
          const { data: roomData, error: roomError } = await supabase
            .from('online_rooms')
            .insert(roomInsert)
            .select('id, room_code')
            .single()

          if (roomError) {
            const duplicateCode = typeof roomError === 'object'
              && roomError !== null
              && 'code' in roomError
              && roomError.code === '23505'

            if (duplicateCode) {
              continue
            }

            throw roomError
          }

          const { error: playerError } = await supabase
            .from('online_room_players')
            .upsert(
              {
                room_id: roomData.id,
                user_id: user.id,
                display_name: displayName,
                city,
                personal_board: generatedPuzzle.puzzle,
                completed: false,
                time_seconds: 0,
                mistakes: 0,
                hints_used: 0,
                score: 0,
              },
              { onConflict: 'room_id,user_id' },
            )

          if (playerError) {
            throw playerError
          }

          return { ok: true, roomCode: roomData.room_code }
        }

        return { ok: false, message: 'Could not generate a unique room code. Please try again.' }
      })(), 15000)
    } catch (createRoomError) {
      return {
        ok: false,
        message: getErrorMessage(createRoomError, 'Could not create the room. Please try again.'),
      }
    } finally {
      setActionLoading(false)
    }
  }, [profile?.city, profile?.username, user])

  const joinRoom = useCallback(async (inputRoomCode: string): Promise<ActionResult> => {
    const targetRoomCode = inputRoomCode.trim().toUpperCase()

    if (!targetRoomCode) {
      return { ok: false, message: 'Enter a room code to continue.' }
    }

    setActionLoading(true)

    try {
      return await withTimeout((async (): Promise<ActionResult> => {
        const targetRoom = await fetchRoomByCode(targetRoomCode)

        if (!targetRoom) {
          return { ok: false, message: ROOM_NOT_FOUND_MESSAGE }
        }

        if (user) {
          await ensurePlayerMembership(targetRoom)
        }

        return { ok: true, roomCode: targetRoomCode }
      })(), 15000)
    } catch (joinRoomError) {
      return {
        ok: false,
        message: getErrorMessage(joinRoomError, 'Could not join this room. Please try again.'),
      }
    } finally {
      setActionLoading(false)
    }
  }, [ensurePlayerMembership, fetchRoomByCode, user])

  const persistRaceState = useCallback(async (
    nextBoard: SudokuBoard,
    nextMistakes: number,
    nextHintsUsed: number,
    nextTimeSeconds = seconds,
  ) => {
    if (!room || room.mode !== 'race') {
      return
    }

    await updateCurrentPlayer({
      personal_board: nextBoard,
      mistakes: nextMistakes,
      hints_used: nextHintsUsed,
      time_seconds: nextTimeSeconds,
    })
  }, [room, seconds, updateCurrentPlayer])

  const finishRace = useCallback(async (
    nextBoard: SudokuBoard,
    nextMistakes: number,
    nextHintsUsed: number,
  ) => {
    if (!supabase || !room || room.mode !== 'race' || !user || !currentPlayer) {
      return null
    }

    const score = calculateScore({
      difficulty: room.difficulty,
      timeSeconds: seconds,
      mistakes: nextMistakes,
      hintsUsed: nextHintsUsed,
      status: 'won',
    })

    await updateCurrentPlayer({
      personal_board: nextBoard,
      completed: true,
      time_seconds: seconds,
      mistakes: nextMistakes,
      hints_used: nextHintsUsed,
      score,
      finished_at: new Date().toISOString(),
    })

    if (!room.winnerUserId) {
      const { error: winnerError } = await supabase
        .from('online_rooms')
        .update({ winner_user_id: user.id })
        .eq('id', room.id)
        .is('winner_user_id', null)

      if (winnerError && import.meta.env.DEV) {
        console.error('Online room winner update error:', winnerError)
      }
    }

    setCompleted(true)
    setGameStatus('won')
    setCheckResult({
      status: 'solved',
      message: 'Puzzle solved. Your race result is now live.',
    })
    setIsTimerRunning(false)
    return score
  }, [currentPlayer, room, seconds, updateCurrentPlayer, user])

  const failRace = useCallback(async (
    nextBoard: SudokuBoard,
    nextMistakes: number,
    nextHintsUsed: number,
  ) => {
    if (!room || room.mode !== 'race') {
      return
    }

    await updateCurrentPlayer({
      personal_board: nextBoard,
      completed: false,
      time_seconds: seconds,
      mistakes: nextMistakes,
      hints_used: nextHintsUsed,
      score: 0,
      finished_at: new Date().toISOString(),
    })

    setCompleted(false)
    setGameStatus('lost')
    setCheckResult({
      status: 'incorrect',
      message: 'Game over. You used all 3 mistakes in this race.',
    })
    setIsTimerRunning(false)
  }, [room, seconds, updateCurrentPlayer])

  const updateSharedBoard = useCallback(async (nextBoard: SudokuBoard) => {
    if (!supabase || !room || room.mode !== 'collaborative') {
      return
    }

    const nextStatus = isSolved(nextBoard, room.solution) ? 'completed' : room.status
    const payload: Record<string, unknown> = {
      shared_board: nextBoard,
      board: nextBoard,
      status: nextStatus,
      updated_at: new Date().toISOString(),
    }

    let { error: boardError } = await supabase
      .from('online_rooms')
      .update(payload)
      .eq('id', room.id)

    if (boardError && isOnlineRoomUpdatedAtSchemaError(boardError)) {
      const retryPayload: Record<string, unknown> = {
        shared_board: nextBoard,
        board: nextBoard,
        status: nextStatus,
      }

      const retryResult = await supabase
        .from('online_rooms')
        .update(retryPayload)
        .eq('id', room.id)

      boardError = retryResult.error
    }

    if (boardError) {
      throw boardError
    }
  }, [room])

  function clearCheckResult() {
    setCheckResult(null)
  }

  const startGame = useCallback(() => {
    if (
      !room
      || !isAuthenticated
      || !currentPlayer
      || room.status !== 'active'
      || hasStarted
      || isGameOver
    ) {
      return
    }

    setHasStarted(true)
    setIsTimerRunning(true)
  }, [currentPlayer, hasStarted, isAuthenticated, isGameOver, room])

  const ensureGameStarted = useCallback(() => {
    if (
      !room
      || !isAuthenticated
      || !currentPlayer
      || room.status !== 'active'
      || hasStarted
      || isGameOver
    ) {
      return
    }

    setHasStarted(true)
    setIsTimerRunning(true)
  }, [currentPlayer, hasStarted, isAuthenticated, isGameOver, room])

  function selectCell(row: number, col: number) {
    if (!canEdit) {
      return
    }

    setSelectedCell({ row, col })
  }

  function clearSelection() {
    setSelectedCell(null)
  }

  function toggleNotesMode() {
    if (!canEdit) {
      return
    }

    setNotesMode((current) => !current)
    clearCheckResult()
  }

  const setCellValue = useCallback(async (value: CandidateValue) => {
    if (!room || !selectedCell || !canEdit) {
      return
    }

    const { row, col } = selectedCell

    if (fixedCells[row][col]) {
      return
    }

    if (notesMode) {
      if (localBoard[row][col] !== 0) {
        return
      }

      ensureGameStarted()

      const nextNotes = cloneNotesBoard(notes)
      const hasNote = nextNotes[row][col].includes(value)

      nextNotes[row][col] = hasNote
        ? nextNotes[row][col].filter((note) => note !== value)
        : [...nextNotes[row][col], value].sort((left, right) => left - right) as CandidateValue[]

      setNotes(nextNotes)
      clearCheckResult()
      return
    }

    if (localBoard[row][col] === value) {
      return
    }

    ensureGameStarted()

    const nextBoard = cloneBoard(localBoard)
    const nextNotes = cloneNotesBoard(notes)
    const nextMistakes = value !== room.solution[row][col] ? mistakes + 1 : mistakes
    const nextMove: LastMove = {
      row,
      col,
      value,
      status: value === room.solution[row][col] ? 'correct' : 'wrong',
    }
    nextBoard[row][col] = value
    nextNotes[row][col] = []

    setLocalBoard(nextBoard)
    setNotes(nextNotes)
    setMistakes(nextMistakes)
    setLastMove(nextMove)
    clearCheckResult()

    try {
      if (room.mode === 'collaborative') {
        if (import.meta.env.DEV) {
          console.log('Updating shared board cell:', { row, col, value })
        }

        setSyncStatus('syncing')
        applyCollaborativeBoardLocally(nextBoard, isSolved(nextBoard, room.solution) ? 'completed' : room.status)
        await updateSharedBoard(nextBoard)
        setSyncStatus('connected')
        setError(null)

        if (nextMistakes >= MAX_MISTAKES) {
          setCompleted(false)
          setGameStatus('lost')
          setCheckResult({
            status: 'incorrect',
            message: 'Game over. You used all 3 mistakes in this room.',
          })
          setIsTimerRunning(false)
          return
        }

        if (isSolved(nextBoard, room.solution)) {
          setCompleted(true)
          setGameStatus('won')
          setCheckResult({
            status: 'solved',
            message: 'Room solved! Great teamwork.',
          })
          setIsTimerRunning(false)
        }
      } else {
        if (nextMistakes >= MAX_MISTAKES) {
          await failRace(nextBoard, nextMistakes, hintsUsed)
          return
        }

        await persistRaceState(nextBoard, nextMistakes, hintsUsed)

        if (isSolved(nextBoard, room.solution)) {
          await finishRace(nextBoard, nextMistakes, hintsUsed)
        }
      }
    } catch (setCellValueError) {
      if (import.meta.env.DEV) {
        console.error('Online room sync error:', setCellValueError)
      }

      setSyncStatus('error')
      setError(SHARED_BOARD_SYNC_ERROR_MESSAGE)
      void refetch()
    }
  }, [
    applyCollaborativeBoardLocally,
    canEdit,
    ensureGameStarted,
    failRace,
    finishRace,
    fixedCells,
    hintsUsed,
    localBoard,
    mistakes,
    notes,
    notesMode,
    persistRaceState,
    refetch,
    room,
    selectedCell,
    updateSharedBoard,
  ])

  const clearCell = useCallback(async () => {
    if (!room || !selectedCell || !canEdit) {
      return
    }

    const { row, col } = selectedCell

    if (fixedCells[row][col] || localBoard[row][col] === 0) {
      return
    }

    const nextBoard = cloneBoard(localBoard)
    nextBoard[row][col] = 0

    setLocalBoard(nextBoard)
    setLastMove(null)
    clearCheckResult()

    try {
      if (room.mode === 'collaborative') {
        if (import.meta.env.DEV) {
          console.log('Updating shared board cell:', { row, col, value: 0 })
        }

        setSyncStatus('syncing')
        applyCollaborativeBoardLocally(nextBoard, room.status)
        await updateSharedBoard(nextBoard)
        setSyncStatus('connected')
        setError(null)
      } else {
        await persistRaceState(nextBoard, mistakes, hintsUsed)
      }
    } catch (clearCellError) {
      if (import.meta.env.DEV) {
        console.error('Online room sync error:', clearCellError)
      }

      setSyncStatus('error')
      setError(SHARED_BOARD_SYNC_ERROR_MESSAGE)
      void refetch()
    }
  }, [
    applyCollaborativeBoardLocally,
    canEdit,
    fixedCells,
    hintsUsed,
    localBoard,
    mistakes,
    persistRaceState,
    refetch,
    room,
    selectedCell,
    updateSharedBoard,
  ])

  const revealHint = useCallback(async () => {
    if (!room || !canEdit) {
      return false
    }

    ensureGameStarted()

    for (let row = 0; row < 9; row += 1) {
      for (let col = 0; col < 9; col += 1) {
        if (fixedCells[row][col] || localBoard[row][col] !== 0) {
          continue
        }

        const nextBoard = cloneBoard(localBoard)
        const nextNotes = cloneNotesBoard(notes)
        const nextHintsUsed = hintsUsed + 1
        nextBoard[row][col] = room.solution[row][col]
        nextNotes[row][col] = []

        setLocalBoard(nextBoard)
        setNotes(nextNotes)
        setHintsUsed(nextHintsUsed)
        setSelectedCell({ row, col })
        setLastMove(null)
        clearCheckResult()

        try {
          if (room.mode === 'collaborative') {
            if (import.meta.env.DEV) {
              console.log('Updating shared board cell:', {
                row,
                col,
                value: room.solution[row][col],
              })
            }

            setSyncStatus('syncing')
            applyCollaborativeBoardLocally(nextBoard, isSolved(nextBoard, room.solution) ? 'completed' : room.status)
            await updateSharedBoard(nextBoard)
            setSyncStatus('connected')
            setError(null)

            if (isSolved(nextBoard, room.solution)) {
              setCompleted(true)
              setGameStatus('won')
              setCheckResult({
                status: 'solved',
                message: 'Room solved! Great teamwork.',
              })
              setIsTimerRunning(false)
            }
          } else {
            await persistRaceState(nextBoard, mistakes, nextHintsUsed)

            if (isSolved(nextBoard, room.solution)) {
              await finishRace(nextBoard, mistakes, nextHintsUsed)
            }
          }
        } catch (hintError) {
          if (import.meta.env.DEV) {
            console.error('Online room sync error:', hintError)
          }

          setSyncStatus('error')
          setError(SHARED_BOARD_SYNC_ERROR_MESSAGE)
          void refetch()
        }

        return true
      }
    }

    return false
  }, [
    applyCollaborativeBoardLocally,
    canEdit,
    ensureGameStarted,
    finishRace,
    fixedCells,
    hintsUsed,
    localBoard,
    mistakes,
    notes,
    persistRaceState,
    refetch,
    room,
    updateSharedBoard,
  ])

  const checkSolution = useCallback((): CheckResult => {
    if (!room) {
      const result: CheckResult = {
        status: 'incomplete',
        message: 'Room data is still loading.',
      }

      setCheckResult(result)
      return result
    }

    if (gameStatus === 'lost') {
      const result: CheckResult = {
        status: 'incorrect',
        message: 'Game over. Start again to keep racing.',
      }

      setCheckResult(result)
      return result
    }

    if (gameStatus === 'won') {
      const result: CheckResult = room.mode === 'collaborative'
        ? {
            status: 'solved',
            message: 'Room solved! Great teamwork.',
          }
        : {
            status: 'solved',
            message: 'Puzzle solved. Your race result is now live.',
          }

      setCheckResult(result)
      return result
    }

    if (!isBoardComplete(localBoard)) {
      const result: CheckResult = {
        status: 'incomplete',
        message: 'Puzzle is not complete yet.',
      }

      setCompleted(false)
      setCheckResult(result)
      return result
    }

    if (!isSolved(localBoard, room.solution)) {
      const result: CheckResult = {
        status: 'incorrect',
        message: 'Some cells are incorrect. Keep going.',
      }

      setCompleted(false)
      setCheckResult(result)
      return result
    }

    const result: CheckResult = room.mode === 'collaborative'
      ? {
          status: 'solved',
          message: 'Room solved! Great teamwork.',
        }
      : {
          status: 'solved',
          message: 'Puzzle solved. Your race result is now live.',
        }

    setCompleted(true)
    setGameStatus('won')
    setCheckResult(result)
    setIsTimerRunning(false)

    if (room.mode === 'collaborative') {
      void updateSharedBoard(localBoard).catch((checkSolutionError) => {
        setError(getErrorMessage(checkSolutionError, 'Unable to mark the room as solved right now.'))
      })
    } else {
      void finishRace(localBoard, mistakes, hintsUsed).catch((checkSolutionError) => {
        setError(getErrorMessage(checkSolutionError, 'Unable to submit your race result right now.'))
      })
    }

    return result
  }, [finishRace, gameStatus, hintsUsed, localBoard, mistakes, room, updateSharedBoard])

  const resetBoard = useCallback(async () => {
    if (!room || room.mode !== 'race' || !currentPlayer) {
      return
    }

    const nextBoard = cloneBoard(room.puzzle)
    setLocalBoard(nextBoard)
    setNotes(createEmptyNotesBoard())
    setSelectedCell(null)
    setNotesMode(false)
    setMistakes(0)
    setHintsUsed(0)
    setLastMove(null)
    setGameStatus('playing')
    setCompleted(false)
    setCheckResult(null)
    setHasStarted(false)
    setSeconds(0)
    setIsTimerRunning(false)

    try {
      await updateCurrentPlayer({
        personal_board: nextBoard,
        completed: false,
        time_seconds: 0,
        mistakes: 0,
        hints_used: 0,
        score: 0,
        finished_at: null,
      })
    } catch (resetError) {
      setError(getErrorMessage(resetError, 'Unable to reset your race board right now.'))
    }
  }, [currentPlayer, room, updateCurrentPlayer])

  useEffect(() => {
    if (!normalizedRoomCode || !isEnabled) {
      setLoading(false)
      return
    }

    void refetch()
  }, [isEnabled, normalizedRoomCode, refetch])

  useEffect(() => {
    roomRef.current = room
  }, [room])

  useEffect(() => {
    if (!supabase || !room?.id || !isEnabled) {
      return undefined
    }

    const client = supabase
    const roomChannel = client
      .channel(`online-room-${room.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'online_rooms',
          filter: `id=eq.${room.id}`,
        },
        (payload) => {
          if (import.meta.env.DEV) {
            console.log('Realtime room update received:', payload)
          }

          if (payload.eventType === 'DELETE') {
            void refetch()
            return
          }

          const currentRoom = roomRef.current

          if (!currentRoom) {
            void refetch()
            return
          }

          const nextRoom = mergeRealtimeRoom(
            currentRoom,
            (payload.new ?? {}) as Partial<OnlineRoomRow>,
          )

          if (!nextRoom) {
            void refetch()
            return
          }

          roomRef.current = nextRoom
          setRoom(nextRoom)
          setSyncStatus('connected')
          setError((current) => (current === SHARED_BOARD_SYNC_ERROR_MESSAGE ? null : current))

          if (nextRoom.mode === 'collaborative') {
            syncedBoardKeyRef.current = JSON.stringify(nextRoom.sharedBoard)
            setLocalBoard(cloneBoard(nextRoom.sharedBoard))
          }
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setSyncStatus('connected')
          return
        }

        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setSyncStatus('error')
          setError(SHARED_BOARD_SYNC_ERROR_MESSAGE)
        }
      })

    return () => {
      void client.removeChannel(roomChannel)
    }
  }, [isEnabled, refetch, room?.id])

  useEffect(() => {
    if (!supabase || !room?.id || !isEnabled) {
      return undefined
    }

    const client = supabase
    const playersChannel = client
      .channel(`online-room-players:${room.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'online_room_players',
          filter: `room_id=eq.${room.id}`,
        },
        () => {
          void refetch()
        },
      )
      .subscribe()

    return () => {
      void client.removeChannel(playersChannel)
    }
  }, [isEnabled, refetch, room?.id])

  useEffect(() => {
    if (!isEnabled || !room || !isAuthenticated || !user) {
      joinedMembershipKeyRef.current = null
      return
    }

    const membershipKey = `${room.id}:${user.id}`

    if (joinedMembershipKeyRef.current === membershipKey) {
      return
    }

    joinedMembershipKeyRef.current = membershipKey

    void ensurePlayerMembership(room).catch((membershipError) => {
      joinedMembershipKeyRef.current = null
      setError(getErrorMessage(membershipError, 'Unable to join this room right now.'))
    })
  }, [ensurePlayerMembership, isAuthenticated, isEnabled, room, user])

  useEffect(() => {
    if (room?.mode !== 'race') {
      return
    }

    if (import.meta.env.DEV) {
      console.log('Race mode current player:', currentPlayer)
      console.log('Race mode board source:', boardSource)
    }
  }, [boardSource, currentPlayer, room?.mode])

  useEffect(() => {
    if (!room || room.mode !== 'race' || !isAuthenticated || !user) {
      return
    }

    void initializeRacePersonalBoard().catch((initializeError) => {
      setError(getErrorMessage(initializeError, 'Could not prepare your race board. Please refresh or try again.'))
    })
  }, [initializeRacePersonalBoard, isAuthenticated, room, user])

  useEffect(() => {
    if (remoteBoardKey === syncedBoardKeyRef.current) {
      return
    }

    syncedBoardKeyRef.current = remoteBoardKey
    setLocalBoard(cloneBoard(boardSource))
  }, [boardSource, remoteBoardKey])

  // Reset session-scoped UI only when the active room or player identity changes.
  // Including board/player stat objects here would clear notes and selection on every realtime update.
  useEffect(() => {
    if (!room) {
      roomRef.current = null
      setLocalBoard(cloneBoard(EMPTY_BOARD))
      setNotes(createEmptyNotesBoard())
      setSelectedCell(null)
      setNotesMode(false)
      setMistakes(0)
      setHintsUsed(0)
      setLastMove(null)
      setGameStatus('playing')
      setCompleted(false)
      setCheckResult(null)
      setHasStarted(false)
      setSeconds(0)
      setIsTimerRunning(false)
      return
    }

    setNotes(createEmptyNotesBoard())
    setSelectedCell(null)
    setNotesMode(false)
    setLastMove(null)
    setCheckResult(null)

    if (room.mode === 'race') {
      const playerBoard = currentPlayer?.personalBoard ?? room.puzzle
      const raceHasStarted = Boolean(
        currentPlayer?.completed
        || (currentPlayer && isRacePlayerFailed(currentPlayer))
        || (currentPlayer?.timeSeconds ?? 0) > 0
        || (currentPlayer?.mistakes ?? 0) > 0
        || (currentPlayer?.hintsUsed ?? 0) > 0
        || boardDiffers(playerBoard, room.puzzle)
      )

      setMistakes(currentPlayer?.mistakes ?? 0)
      setHintsUsed(currentPlayer?.hintsUsed ?? 0)
      setCompleted(currentPlayer?.completed ?? false)
      setSeconds(currentPlayer?.timeSeconds ?? 0)
      setHasStarted(raceHasStarted)
      setGameStatus(
        currentPlayer?.completed
          ? 'won'
          : currentPlayer && isRacePlayerFailed(currentPlayer)
            ? 'lost'
            : 'playing',
      )
      return
    }

    const roomSolved = room.status === 'completed' || isSolved(boardSource, room.solution)
    setMistakes(0)
    setHintsUsed(0)
    setCompleted(roomSolved)
    setHasStarted(false)
    setGameStatus(roomSolved ? 'won' : 'playing')
    setSeconds(0)
  }, [currentPlayer?.id, room?.id, room?.mode]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!room) {
      return
    }

    if (room.mode === 'collaborative') {
      const roomSolved = room.status === 'completed' || isSolved(localBoard, room.solution)

      if (roomSolved && gameStatus !== 'lost') {
        setCompleted(true)
        setGameStatus('won')
        setCheckResult((current) => current ?? {
          status: 'solved',
          message: 'Room solved! Great teamwork.',
        })
      }
    }
  }, [gameStatus, localBoard, room])

  useEffect(() => {
    if (room?.mode !== 'race' || !currentPlayer) {
      return
    }

    if (currentPlayer.completed) {
      setCompleted(true)
      setGameStatus('won')
      setSeconds(currentPlayer.timeSeconds)
      setMistakes(currentPlayer.mistakes)
      setHintsUsed(currentPlayer.hintsUsed)
      return
    }

    if (isRacePlayerFailed(currentPlayer)) {
      setCompleted(false)
      setGameStatus('lost')
      setSeconds(currentPlayer.timeSeconds)
      setMistakes(currentPlayer.mistakes)
      setHintsUsed(currentPlayer.hintsUsed)
    }
  }, [
    currentPlayer,
    room?.mode,
  ])

  useEffect(() => {
    const shouldRun = Boolean(
      room
      && room.status === 'active'
      && isAuthenticated
      && currentPlayer
      && hasStarted
      && !isGameOver,
    )

    setIsTimerRunning(shouldRun)
  }, [currentPlayer, hasStarted, isAuthenticated, isGameOver, room])

  useEffect(() => {
    if (!isTimerRunning) {
      return undefined
    }

    const interval = window.setInterval(() => {
      setSeconds((current) => current + 1)
    }, 1000)

    return () => window.clearInterval(interval)
  }, [isTimerRunning])

  useEffect(() => {
    if (
      room?.mode !== 'race'
      || !currentPlayer
      || completed
      || seconds === 0
      || seconds % 5 !== 0
    ) {
      return
    }

    void persistRaceState(localBoard, mistakes, hintsUsed, seconds).catch((persistError) => {
      setError(getErrorMessage(persistError, 'Unable to sync your race timer right now.'))
    })
  }, [completed, currentPlayer, hintsUsed, localBoard, mistakes, persistRaceState, room?.mode, seconds])

  useEffect(() => {
    if (!lastMove) {
      return undefined
    }

    const timeout = window.setTimeout(() => {
      setLastMove(null)
    }, 950)

    return () => window.clearTimeout(timeout)
  }, [lastMove])

  const solution = room?.solution ?? EMPTY_BOARD

  return {
    room,
    players,
    standings,
    winnerPlayer,
    currentPlayer,
    loading,
    actionLoading,
    membershipLoading,
    error,
    syncStatus,
    canEdit,
    board: localBoard,
    solution,
    fixedCells,
    notes,
    notesMode,
    selectedCell,
    selectedValue,
    selectedNotes,
    mistakes,
    mistakesRemaining,
    mistakeLimit,
    hintsUsed,
    lastMove,
    hasStarted,
    status: gameStatus,
    isGameOver,
    completed,
    checkResult,
    invalidCellKeys,
    timerSeconds: seconds,
    isTimerRunning,
    formattedTime,
    createRoom,
    joinRoom,
    refetch,
    selectCell,
    clearSelection,
    setCellValue,
    clearCell,
    toggleNotesMode,
    revealHint,
    checkSolution,
    startGame,
    resetBoard,
  }
}
