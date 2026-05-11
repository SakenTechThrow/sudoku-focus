import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { isDifficulty } from '../constants/difficulty'
import { useAuth } from './useAuth'
import { createEmptyBoard, generatePuzzle } from '../lib/sudokuGenerator'
import { calculateScore } from '../lib/scoring'
import { supabase, supabaseConfigError } from '../lib/supabaseClient'
import {
  findConflictingCells,
  isBoardComplete,
  isSolved,
} from '../lib/sudokuValidator'
import type {
  CandidateValue,
  CellPosition,
  CheckResult,
  NotesBoard,
  SudokuBoard,
} from '../types/sudoku'
import type {
  CreateOnlineRoomInput,
  OnlineMode,
  OnlineRoom,
  OnlineRoomPlayer,
  OnlineRoomStatus,
} from '../types/online'

const EMPTY_BOARD = createEmptyBoard()
const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const ONLINE_ROOM_SCHEMA_MIGRATION_MESSAGE =
  'Online room database schema needs migration. Please run the latest SQL migration.'
const ONLINE_ROOM_PLAYER_SCHEMA_MIGRATION_MESSAGE =
  'Online room player schema needs migration. Please add created_at or use joined_at.'

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

export function useOnlineRoom(roomCode?: string) {
  const { isAuthenticated, profile, user } = useAuth()
  const [room, setRoom] = useState<OnlineRoom | null>(null)
  const [players, setPlayers] = useState<OnlineRoomPlayer[]>([])
  const [loading, setLoading] = useState(Boolean(roomCode))
  const [actionLoading, setActionLoading] = useState(false)
  const [membershipLoading, setMembershipLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localBoard, setLocalBoard] = useState<SudokuBoard>(() => cloneBoard(EMPTY_BOARD))
  const [notes, setNotes] = useState<NotesBoard>(() => createEmptyNotesBoard())
  const [selectedCell, setSelectedCell] = useState<CellPosition | null>(null)
  const [notesMode, setNotesMode] = useState(false)
  const [mistakes, setMistakes] = useState(0)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null)
  const [seconds, setSeconds] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const joinedMembershipKeyRef = useRef<string | null>(null)
  const syncedBoardKeyRef = useRef('')
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
  const selectedValue = selectedCell ? localBoard[selectedCell.row][selectedCell.col] : 0
  const selectedNotes = selectedCell ? notes[selectedCell.row][selectedCell.col] : []
  const invalidCellKeys = useMemo(
    () => (room ? getInvalidPositions(localBoard, room.solution, fixedCells) : new Set<string>()),
    [fixedCells, localBoard, room],
  )
  const standings = useMemo(
    () => [...players].sort((left, right) => {
      if (left.completed !== right.completed) {
        return Number(right.completed) - Number(left.completed)
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
    && !completed,
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

    const { data, error: roomError } = await supabase
      .from('online_rooms')
      .select('id, host_user_id, room_code, mode, difficulty, puzzle, solution, shared_board, board, status, winner_user_id, created_at')
      .eq('room_code', targetRoomCode)
      .maybeSingle()

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

    let { data, error: playersError } = await selectPlayers('created_at')

    if (playersError && isOnlineRoomPlayerTimestampSchemaError(playersError)) {
      const fallbackResult = await selectPlayers('joined_at')
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
      throw new Error('Room not found. Check the code and try again.')
    }

    const nextPlayers = await fetchPlayersByRoomId(loadedRoom.id)
    setRoom(loadedRoom)
    setPlayers(nextPlayers)
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

  const refetch = useCallback(async () => {
    if (!normalizedRoomCode) {
      return
    }

    setLoading(true)

    try {
      await loadRoomState(normalizedRoomCode)
    } catch (refetchError) {
      setError(getErrorMessage(refetchError, 'Unable to load this room right now.'))
    } finally {
      setLoading(false)
    }
  }, [loadRoomState, normalizedRoomCode])

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
    } catch (createRoomError) {
      return {
        ok: false,
        message: getErrorMessage(createRoomError, 'Unable to create an online room right now.'),
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
      const targetRoom = await fetchRoomByCode(targetRoomCode)

      if (!targetRoom) {
        return { ok: false, message: 'Room not found. Check the code and try again.' }
      }

      if (user) {
        await ensurePlayerMembership(targetRoom)
      }

      return { ok: true, roomCode: targetRoomCode }
    } catch (joinRoomError) {
      return {
        ok: false,
        message: getErrorMessage(joinRoomError, 'Unable to join this room right now.'),
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
    setCheckResult({
      status: 'solved',
      message: 'Puzzle solved. Your race result is now live.',
    })
    setIsTimerRunning(false)
    return score
  }, [currentPlayer, room, seconds, updateCurrentPlayer, user])

  const updateSharedBoard = useCallback(async (nextBoard: SudokuBoard) => {
    if (!supabase || !room || room.mode !== 'collaborative') {
      return
    }

    const nextStatus = isSolved(nextBoard, room.solution) ? 'completed' : room.status
    const { error: boardError } = await supabase
      .from('online_rooms')
      .update({
        shared_board: nextBoard,
        status: nextStatus,
      })
      .eq('id', room.id)

    if (boardError) {
      throw boardError
    }
  }, [room])

  function clearCheckResult() {
    setCheckResult(null)
  }

  function selectCell(row: number, col: number) {
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

    const nextBoard = cloneBoard(localBoard)
    const nextNotes = cloneNotesBoard(notes)
    const nextMistakes = value !== room.solution[row][col] ? mistakes + 1 : mistakes
    nextBoard[row][col] = value
    nextNotes[row][col] = []

    setLocalBoard(nextBoard)
    setNotes(nextNotes)
    setMistakes(nextMistakes)
    clearCheckResult()

    try {
      if (room.mode === 'collaborative') {
        await updateSharedBoard(nextBoard)

        if (isSolved(nextBoard, room.solution)) {
          setCompleted(true)
          setCheckResult({
            status: 'solved',
            message: 'Room solved! Great teamwork.',
          })
          setIsTimerRunning(false)
        }
      } else {
        await persistRaceState(nextBoard, nextMistakes, hintsUsed)

        if (isSolved(nextBoard, room.solution)) {
          await finishRace(nextBoard, nextMistakes, hintsUsed)
        }
      }
    } catch (setCellValueError) {
      setError(getErrorMessage(setCellValueError, 'Unable to sync the latest move right now.'))
    }
  }, [
    canEdit,
    finishRace,
    fixedCells,
    hintsUsed,
    localBoard,
    mistakes,
    notes,
    notesMode,
    persistRaceState,
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
    clearCheckResult()

    try {
      if (room.mode === 'collaborative') {
        await updateSharedBoard(nextBoard)
      } else {
        await persistRaceState(nextBoard, mistakes, hintsUsed)
      }
    } catch (clearCellError) {
      setError(getErrorMessage(clearCellError, 'Unable to clear this value right now.'))
    }
  }, [
    canEdit,
    fixedCells,
    hintsUsed,
    localBoard,
    mistakes,
    persistRaceState,
    room,
    selectedCell,
    updateSharedBoard,
  ])

  const revealHint = useCallback(async () => {
    if (!room || !canEdit) {
      return false
    }

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
        clearCheckResult()

        try {
          if (room.mode === 'collaborative') {
            await updateSharedBoard(nextBoard)

            if (isSolved(nextBoard, room.solution)) {
              setCompleted(true)
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
          setError(getErrorMessage(hintError, 'Unable to reveal a synced hint right now.'))
        }

        return true
      }
    }

    return false
  }, [
    canEdit,
    finishRace,
    fixedCells,
    hintsUsed,
    localBoard,
    mistakes,
    notes,
    persistRaceState,
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
  }, [finishRace, hintsUsed, localBoard, mistakes, room, updateSharedBoard])

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
    setCompleted(false)
    setCheckResult(null)
    setSeconds(0)
    setIsTimerRunning(true)

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
    if (!normalizedRoomCode) {
      setLoading(false)
      return
    }

    void refetch()
  }, [normalizedRoomCode, refetch])

  useEffect(() => {
    if (!supabase || !normalizedRoomCode) {
      return undefined
    }

    const client = supabase
    const roomChannel = client
      .channel(`online-room:${normalizedRoomCode}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'online_rooms',
          filter: `room_code=eq.${normalizedRoomCode}`,
        },
        () => {
          void refetch()
        },
      )
      .subscribe()

    return () => {
      void client.removeChannel(roomChannel)
    }
  }, [normalizedRoomCode, refetch])

  useEffect(() => {
    if (!supabase || !room?.id) {
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
  }, [refetch, room?.id])

  useEffect(() => {
    if (!room || !isAuthenticated || !user) {
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
  }, [ensurePlayerMembership, isAuthenticated, room, user])

  useEffect(() => {
    if (remoteBoardKey === syncedBoardKeyRef.current) {
      return
    }

    syncedBoardKeyRef.current = remoteBoardKey
    setLocalBoard(cloneBoard(boardSource))
  }, [boardSource, remoteBoardKey])

  useEffect(() => {
    if (!room) {
      setLocalBoard(cloneBoard(EMPTY_BOARD))
      setNotes(createEmptyNotesBoard())
      setSelectedCell(null)
      setNotesMode(false)
      setMistakes(0)
      setHintsUsed(0)
      setCompleted(false)
      setCheckResult(null)
      setSeconds(0)
      setIsTimerRunning(false)
      return
    }

    setNotes(createEmptyNotesBoard())
    setSelectedCell(null)
    setNotesMode(false)
    setCheckResult(null)

    if (room.mode === 'race') {
      setMistakes(currentPlayer?.mistakes ?? 0)
      setHintsUsed(currentPlayer?.hintsUsed ?? 0)
      setCompleted(currentPlayer?.completed ?? false)
      setSeconds(currentPlayer?.timeSeconds ?? 0)
      return
    }

    const roomSolved = room.status === 'completed' || isSolved(boardSource, room.solution)
    setMistakes(0)
    setHintsUsed(0)
    setCompleted(roomSolved)
    setSeconds(0)
  }, [currentPlayer?.id, room?.id, room?.mode])

  useEffect(() => {
    if (!room) {
      return
    }

    if (room.mode === 'collaborative') {
      const roomSolved = room.status === 'completed' || isSolved(localBoard, room.solution)

      if (roomSolved) {
        setCompleted(true)
        setCheckResult((current) => current ?? {
          status: 'solved',
          message: 'Room solved! Great teamwork.',
        })
      }
    }
  }, [localBoard, room])

  useEffect(() => {
    if (room?.mode !== 'race' || !currentPlayer) {
      return
    }

    if (currentPlayer.completed) {
      setCompleted(true)
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
      && !completed,
    )

    setIsTimerRunning(shouldRun)
  }, [completed, currentPlayer, isAuthenticated, room])

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
    hintsUsed,
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
    resetBoard,
  }
}
