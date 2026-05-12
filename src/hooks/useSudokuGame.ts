import { useEffect, useEffectEvent, useMemo, useState } from 'react'
import { MAX_MISTAKES } from '../constants/game'
import { difficultyConfig } from '../constants/difficulty'
import { samplePuzzle } from '../constants/samplePuzzle'
import { useLocalGameState } from '../hooks/useLocalGameState'
import { useTimer } from '../hooks/useTimer'
import { generatePuzzle } from '../lib/sudokuGenerator'
import {
  findConflictingCells,
  isBoardComplete,
  isSolved,
} from '../lib/sudokuValidator'
import type {
  CandidateValue,
  CellPosition,
  CheckResult,
  Difficulty,
  GameStatus,
  GeneratedPuzzle,
  LastMove,
  NotesBoard,
  PersistedSudokuGameState,
  SudokuBoard,
} from '../types/sudoku'

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

function getFallbackPuzzle(): GeneratedPuzzle {
  return {
    difficulty: samplePuzzle.difficulty,
    puzzle: cloneBoard(samplePuzzle.puzzle),
    solution: cloneBoard(samplePuzzle.solution),
  }
}

function getGeneratedPuzzle(difficulty: Difficulty) {
  try {
    return generatePuzzle(difficulty)
  } catch {
    return {
      ...getFallbackPuzzle(),
      difficulty,
    }
  }
}

type UseSudokuGameOptions = {
  initialGame?: GeneratedPuzzle
  storageKey?: string
}

export function useSudokuGame(options: UseSudokuGameOptions = {}) {
  const { initialGame: providedInitialGame, storageKey } = options
  const { restoredState, saveGameState, clearSavedGame } = useLocalGameState(storageKey)
  const initialGame = restoredState
    ? {
        difficulty: restoredState.difficulty,
        puzzle: cloneBoard(restoredState.puzzle),
        solution: cloneBoard(restoredState.solution),
      }
    : providedInitialGame
      ? {
          difficulty: providedInitialGame.difficulty,
          puzzle: cloneBoard(providedInitialGame.puzzle),
          solution: cloneBoard(providedInitialGame.solution),
        }
      : getGeneratedPuzzle('medium')
  const initialFixedCells = createFixedCells(initialGame.puzzle)
  const initialBoard = restoredState
    ? cloneBoard(restoredState.board)
    : cloneBoard(initialGame.puzzle)
  const initialNotes = restoredState
    ? cloneNotesBoard(restoredState.notes)
    : createEmptyNotesBoard()

  const [difficulty, setDifficulty] = useState<Difficulty>(initialGame.difficulty)
  const [puzzle, setPuzzle] = useState(initialGame.puzzle)
  const [solution, setSolution] = useState(initialGame.solution)
  const [board, setBoard] = useState(initialBoard)
  const [notes, setNotes] = useState(initialNotes)
  const [selectedCell, setSelectedCell] = useState<CellPosition | null>(null)
  const [mistakes, setMistakes] = useState(restoredState?.mistakes ?? 0)
  const [hintsUsed, setHintsUsed] = useState(restoredState?.hintsUsed ?? 0)
  const [status, setStatus] = useState<GameStatus>(
    restoredState?.status
    ?? (restoredState?.completed
      ? 'won'
      : (restoredState?.mistakes ?? 0) >= MAX_MISTAKES
        ? 'lost'
        : 'playing'),
  )
  const [notesMode, setNotesMode] = useState(restoredState?.notesMode ?? false)
  const [hasStarted, setHasStarted] = useState(restoredState?.hasStarted ?? false)
  const [isPaused, setIsPaused] = useState(restoredState?.isPaused ?? false)
  const [sessionId, setSessionId] = useState(1)
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null)
  const [lastMove, setLastMove] = useState<LastMove | null>(null)
  const [invalidCellKeys, setInvalidCellKeys] = useState(() =>
    getInvalidPositions(initialBoard, initialGame.solution, initialFixedCells),
  )
  const timer = useTimer({
    initialSeconds: restoredState?.seconds ?? 0,
    autoStart: Boolean(
      restoredState?.hasStarted
      && !restoredState?.isPaused
      && (
        restoredState?.status
        ?? (restoredState?.completed ? 'won' : 'playing')
      ) === 'playing',
    ),
  })
  const fixedCells = useMemo(() => createFixedCells(puzzle), [puzzle])
  const currentDifficultyConfig = difficultyConfig[difficulty]
  const completed = status === 'won'
  const isGameOver = status !== 'playing'
  const mistakeLimit = MAX_MISTAKES
  const mistakesRemaining = Math.max(0, mistakeLimit - mistakes)

  const selectedValue = selectedCell ? board[selectedCell.row][selectedCell.col] : 0
  const selectedNotes = selectedCell ? notes[selectedCell.row][selectedCell.col] : []
  const isComplete = useMemo(() => isBoardComplete(board), [board])

  function selectCell(row: number, col: number) {
    if (isPaused || isGameOver) {
      return
    }

    setSelectedCell({ row, col })
  }

  function clearSelection() {
    setSelectedCell(null)
  }

  function clearCheckResult() {
    setCheckResult(null)
  }

  function startGame() {
    if (isGameOver || hasStarted) {
      return
    }

    setHasStarted(true)
    setIsPaused(false)
    timer.start()
  }

  function ensureGameStarted() {
    if (isGameOver || hasStarted) {
      return
    }

    setHasStarted(true)
    setIsPaused(false)
    timer.start()
  }

  function applyFreshGame(nextGame: GeneratedPuzzle) {
    const nextPuzzle = cloneBoard(nextGame.puzzle)
    const nextSolution = cloneBoard(nextGame.solution)
    const nextNotes = createEmptyNotesBoard()
    const nextFixedCells = createFixedCells(nextPuzzle)

    clearSavedGame()
    setDifficulty(nextGame.difficulty)
    setPuzzle(nextPuzzle)
    setSolution(nextSolution)
    setBoard(cloneBoard(nextPuzzle))
    setNotes(nextNotes)
    setSelectedCell(null)
    setMistakes(0)
    setHintsUsed(0)
    setStatus('playing')
    setNotesMode(false)
    setHasStarted(false)
    setIsPaused(false)
    setSessionId((current) => current + 1)
    clearCheckResult()
    setLastMove(null)
    setInvalidCellKeys(getInvalidPositions(nextPuzzle, nextSolution, nextFixedCells))
    timer.reset()
  }

  function setCellValue(value: CandidateValue) {
    if (!selectedCell || isGameOver || isPaused) {
      return
    }

    const { row, col } = selectedCell

    if (fixedCells[row][col]) {
      return
    }

    if (notesMode) {
      if (board[row][col] !== 0) {
        return
      }

      ensureGameStarted()

      const nextNotes = cloneNotesBoard(notes)
      const hasNote = nextNotes[row][col].includes(value)

      nextNotes[row][col] = hasNote
        ? nextNotes[row][col].filter((note) => note !== value)
        : [...nextNotes[row][col], value].sort((a, b) => a - b) as CandidateValue[]

      setNotes(nextNotes)
      clearCheckResult()
      return
    }

    if (board[row][col] === value) {
      return
    }

    ensureGameStarted()

    const nextBoard = cloneBoard(board)
    const nextNotes = cloneNotesBoard(notes)
    const nextMistakes = value !== solution[row][col] ? mistakes + 1 : mistakes
    const nextMove: LastMove = {
      row,
      col,
      value,
      status: value === solution[row][col] ? 'correct' : 'wrong',
    }
    nextBoard[row][col] = value
    nextNotes[row][col] = []

    const nextCompleted = isSolved(nextBoard, solution)
    setBoard(nextBoard)
    setNotes(nextNotes)
    setMistakes(nextMistakes)
    setLastMove(nextMove)
    setInvalidCellKeys(getInvalidPositions(nextBoard, solution, fixedCells))

    if (nextCompleted) {
      setStatus('won')
      setIsPaused(false)
      setCheckResult({
        status: 'solved',
        message: 'Puzzle solved. Great work.',
      })
      timer.pause()
      return
    }

    if (nextMistakes >= MAX_MISTAKES) {
      setStatus('lost')
      setIsPaused(false)
      setCheckResult({
        status: 'incorrect',
        message: 'Game over. You used all 3 mistakes.',
      })
      timer.pause()
      return
    }

    setStatus('playing')
    setCheckResult(null)
  }

  function clearCell() {
    if (!selectedCell || isGameOver || isPaused) {
      return
    }

    const { row, col } = selectedCell

    if (fixedCells[row][col] || board[row][col] === 0) {
      return
    }

    const nextBoard = cloneBoard(board)
    nextBoard[row][col] = 0

    setBoard(nextBoard)
    setInvalidCellKeys(getInvalidPositions(nextBoard, solution, fixedCells))
    setStatus('playing')
    setLastMove(null)
    clearCheckResult()
  }

  function toggleNotesMode() {
    if (isGameOver || isPaused) {
      return
    }

    setNotesMode((current) => !current)
    clearCheckResult()
  }

  function revealHint() {
    if (isGameOver || isPaused) {
      return false
    }

    ensureGameStarted()

    for (let row = 0; row < 9; row += 1) {
      for (let col = 0; col < 9; col += 1) {
        if (fixedCells[row][col] || board[row][col] !== 0) {
          continue
        }

        const nextBoard = cloneBoard(board)
        const nextNotes = cloneNotesBoard(notes)
        nextBoard[row][col] = solution[row][col]
        nextNotes[row][col] = []

        const nextCompleted = isSolved(nextBoard, solution)
        setBoard(nextBoard)
        setNotes(nextNotes)
        setSelectedCell({ row, col })
        setHintsUsed((current) => current + 1)
        setLastMove(null)
        setInvalidCellKeys(getInvalidPositions(nextBoard, solution, fixedCells))
        setStatus(nextCompleted ? 'won' : 'playing')
        setCheckResult(nextCompleted
          ? {
              status: 'solved',
              message: 'Puzzle solved. Great work.',
            }
          : null)

        if (nextCompleted) {
          setIsPaused(false)
          timer.pause()
        }

        return true
      }
    }

    return false
  }

  function checkSolution(): CheckResult {
    if (status === 'lost') {
      const result: CheckResult = {
        status: 'incorrect',
        message: 'Game over. Start a new puzzle to continue.',
      }

      setCheckResult(result)
      return result
    }

    if (status === 'won') {
      const result: CheckResult = {
        status: 'solved',
        message: 'Puzzle solved. Great work.',
      }

      setCheckResult(result)
      return result
    }

    if (!isBoardComplete(board)) {
      const result: CheckResult = {
        status: 'incomplete',
        message: 'Puzzle is not complete yet.',
      }

      setStatus('playing')
      setCheckResult(result)
      return result
    }

    const solved = isSolved(board, solution)

    if (!solved) {
      const result: CheckResult = {
        status: 'incorrect',
        message: 'Some cells are incorrect. Keep going.',
      }

      setStatus('playing')
      setInvalidCellKeys(getInvalidPositions(board, solution, fixedCells))
      setCheckResult(result)
      return result
    }

    const result: CheckResult = {
      status: 'solved',
      message: 'Puzzle solved. Great work.',
    }

    setStatus('won')
    setIsPaused(false)
    setCheckResult(result)
    timer.pause()
    return result
  }

  function pauseGame() {
    if (isGameOver || !hasStarted) {
      return
    }

    setIsPaused(true)
    timer.pause()
  }

  function resumeGame() {
    if (isGameOver || !hasStarted) {
      return
    }

    setIsPaused(false)
    timer.resume()
  }

  function togglePause() {
    if (!hasStarted || isGameOver) {
      return
    }

    if (isPaused) {
      resumeGame()
      return
    }

    pauseGame()
  }

  function startNewGame(nextDifficulty: Difficulty) {
    const nextGame = getGeneratedPuzzle(nextDifficulty)
    applyFreshGame(nextGame)
  }

  function resetGame() {
    const nextPuzzle = cloneBoard(puzzle)
    const nextNotes = createEmptyNotesBoard()
    const nextFixedCells = createFixedCells(nextPuzzle)
    setBoard(nextPuzzle)
    setNotes(nextNotes)
    setSelectedCell(null)
    setMistakes(0)
    setHintsUsed(0)
    setStatus('playing')
    setNotesMode(false)
    setHasStarted(false)
    setIsPaused(false)
    setSessionId((current) => current + 1)
    clearCheckResult()
    setLastMove(null)
    setInvalidCellKeys(getInvalidPositions(nextPuzzle, solution, nextFixedCells))
    timer.reset()
  }

  function clearSavedProgress() {
    clearSavedGame()
    startNewGame(difficulty)
  }

  const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.metaKey || event.ctrlKey || event.altKey) {
      return
    }

    const target = event.target

    if (
      target instanceof HTMLInputElement
      || target instanceof HTMLTextAreaElement
      || target instanceof HTMLSelectElement
      || (target instanceof HTMLElement && target.isContentEditable)
    ) {
      return
    }

    if (event.key >= '1' && event.key <= '9') {
      event.preventDefault()
      setCellValue(Number(event.key) as CandidateValue)
    }

    if (event.key === 'Backspace' || event.key === 'Delete') {
      event.preventDefault()
      clearCell()
    }

    if (event.key.toLowerCase() === 'n') {
      event.preventDefault()
      toggleNotesMode()
    }

    if (event.key.toLowerCase() === 'h') {
      event.preventDefault()
      revealHint()
    }

    if (event.key === ' ') {
      event.preventDefault()
      togglePause()
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      clearSelection()
    }
  })

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    const gameState: PersistedSudokuGameState = {
      difficulty,
      puzzle,
      solution,
      board,
      notes,
      mistakes,
      hintsUsed,
      seconds: timer.seconds,
      completed,
      status,
      notesMode,
      hasStarted,
      isPaused,
    }

    saveGameState(gameState)
  }, [
    difficulty,
    puzzle,
    solution,
    board,
    notes,
    mistakes,
    hintsUsed,
    timer.seconds,
    completed,
    status,
    notesMode,
    hasStarted,
    isPaused,
    saveGameState,
  ])

  useEffect(() => {
    if (!lastMove) {
      return undefined
    }

    const timeout = window.setTimeout(() => {
      setLastMove(null)
    }, 950)

    return () => window.clearTimeout(timeout)
  }, [lastMove])

  return {
    difficulty,
    difficultyConfig: currentDifficultyConfig,
    puzzle,
    solution,
    board,
    notes,
    fixedCells,
    selectedCell,
    selectedValue,
    selectedNotes,
    mistakes,
    mistakesRemaining,
    mistakeLimit,
    hintsUsed,
    sessionId,
    status,
    isGameOver,
    completed,
    checkResult,
    lastMove,
    notesMode,
    hasStarted,
    isPaused,
    invalidCellKeys,
    isComplete,
    timerSeconds: timer.seconds,
    isTimerRunning: timer.isRunning,
    formattedTime: timer.formattedTime,
    selectCell,
    clearSelection,
    setCellValue,
    clearCell,
    toggleNotesMode,
    revealHint,
    checkSolution,
    pauseGame,
    resumeGame,
    togglePause,
    startGame,
    startNewGame,
    resetGame,
    clearSavedProgress,
  }
}
