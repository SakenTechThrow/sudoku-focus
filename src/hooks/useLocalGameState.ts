import { useCallback, useState } from 'react'
import { MAX_MISTAKES } from '../constants/game'
import { isDifficulty } from '../constants/difficulty'
import type {
  CandidateValue,
  CellValue,
  GameStatus,
  NotesBoard,
  PersistedSudokuGameState,
  SudokuBoard,
} from '../types/sudoku'

const DEFAULT_STORAGE_KEY = 'sudoku-focus:game-state:v1'

function isCellValue(value: unknown): value is CellValue {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 9
}

function isCandidateValue(value: unknown): value is CandidateValue {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 9
}

function isValidSudokuBoard(board: unknown): board is SudokuBoard {
  return Array.isArray(board)
    && board.length === 9
    && board.every(
      (row) =>
        Array.isArray(row) && row.length === 9 && row.every((cell) => isCellValue(cell)),
    )
}

function isValidNotesBoard(notes: unknown): notes is NotesBoard {
  return Array.isArray(notes)
    && notes.length === 9
    && notes.every(
      (row) =>
        Array.isArray(row)
        && row.length === 9
        && row.every((cell) => {
          if (!Array.isArray(cell)) {
            return false
          }

          const uniqueValues = new Set(cell)
          return cell.every((value) => isCandidateValue(value)) && uniqueValues.size === cell.length
        }),
    )
}

function isValidPersistedState(state: unknown): state is PersistedSudokuGameState {
  if (!state || typeof state !== 'object') {
    return false
  }

  const candidate = state as Partial<PersistedSudokuGameState>

  return isDifficulty(candidate.difficulty)
    && isValidSudokuBoard(candidate.puzzle)
    && isValidSudokuBoard(candidate.solution)
    && isValidSudokuBoard(candidate.board)
    && isValidNotesBoard(candidate.notes)
    && typeof candidate.mistakes === 'number'
    && candidate.mistakes >= 0
    && typeof candidate.hintsUsed === 'number'
    && candidate.hintsUsed >= 0
    && typeof candidate.seconds === 'number'
    && candidate.seconds >= 0
    && typeof candidate.completed === 'boolean'
    && (
      candidate.status === undefined
      || candidate.status === 'playing'
      || candidate.status === 'won'
      || candidate.status === 'lost'
    )
    && typeof candidate.notesMode === 'boolean'
    && (candidate.hasStarted === undefined || typeof candidate.hasStarted === 'boolean')
    && (candidate.isPaused === undefined || typeof candidate.isPaused === 'boolean')
}

function normalizeStatus(state: Pick<PersistedSudokuGameState, 'completed' | 'mistakes'> & { status?: GameStatus }) {
  if (state.status === 'playing' || state.status === 'won' || state.status === 'lost') {
    return state.status
  }

  if (state.completed) {
    return 'won'
  }

  if (state.mistakes >= MAX_MISTAKES) {
    return 'lost'
  }

  return 'playing'
}

function normalizePersistedState(state: PersistedSudokuGameState): PersistedSudokuGameState {
  const status = normalizeStatus(state)
  const hasStarted = state.hasStarted ?? (
    state.completed
    || status === 'won'
    || status === 'lost'
    || state.seconds > 0
  )
  const isPaused = status === 'playing'
    ? Boolean(state.isPaused ?? false)
    : false

  return {
    ...state,
    status,
    hasStarted,
    isPaused,
  }
}

function loadSavedGameState(storageKey: string) {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const rawState = window.localStorage.getItem(storageKey)

    if (!rawState) {
      return null
    }

    const parsedState = JSON.parse(rawState) as unknown

    if (!isValidPersistedState(parsedState)) {
      window.localStorage.removeItem(storageKey)
      return null
    }

    return normalizePersistedState(parsedState)
  } catch {
    window.localStorage.removeItem(storageKey)
    return null
  }
}

export function useLocalGameState(storageKey = DEFAULT_STORAGE_KEY) {
  const [restoredState] = useState<PersistedSudokuGameState | null>(() => loadSavedGameState(storageKey))

  const saveGameState = useCallback((state: PersistedSudokuGameState) => {
    if (typeof window === 'undefined') {
      return
    }

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(state))
    } catch {
      // Ignore write failures so gameplay still works in restricted environments.
    }
  }, [storageKey])

  const clearSavedGame = useCallback(() => {
    if (typeof window === 'undefined') {
      return
    }

    try {
      window.localStorage.removeItem(storageKey)
    } catch {
      // Ignore cleanup failures for the same reason as writes.
    }
  }, [storageKey])

  return {
    restoredState,
    saveGameState,
    clearSavedGame,
  }
}
