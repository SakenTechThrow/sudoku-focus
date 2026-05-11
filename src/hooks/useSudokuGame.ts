import { useEffect, useEffectEvent, useMemo, useState } from 'react'
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
  GeneratedPuzzle,
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
  const [completed, setCompleted] = useState(restoredState?.completed ?? false)
  const [notesMode, setNotesMode] = useState(restoredState?.notesMode ?? false)
  const [isPaused, setIsPaused] = useState(false)
  const [sessionId, setSessionId] = useState(1)
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null)
  const [invalidCellKeys, setInvalidCellKeys] = useState(() =>
    getInvalidPositions(initialBoard, initialGame.solution, initialFixedCells),
  )
  const timer = useTimer({
    initialSeconds: restoredState?.seconds ?? 0,
    autoStart: !restoredState?.completed,
  })
  const fixedCells = useMemo(() => createFixedCells(puzzle), [puzzle])
  const currentDifficultyConfig = difficultyConfig[difficulty]

  const selectedValue = selectedCell ? board[selectedCell.row][selectedCell.col] : 0
  const selectedNotes = selectedCell ? notes[selectedCell.row][selectedCell.col] : []
  const isComplete = useMemo(() => isBoardComplete(board), [board])

  function selectCell(row: number, col: number) {
    if (isPaused) {
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
    setCompleted(false)
    setNotesMode(false)
    setIsPaused(false)
    setSessionId((current) => current + 1)
    clearCheckResult()
    setInvalidCellKeys(getInvalidPositions(nextPuzzle, nextSolution, nextFixedCells))
    timer.start()
  }

  function setCellValue(value: CandidateValue) {
    if (!selectedCell || completed || isPaused) {
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

    const nextBoard = cloneBoard(board)
    const nextNotes = cloneNotesBoard(notes)
    nextBoard[row][col] = value
    nextNotes[row][col] = []

    if (value !== solution[row][col]) {
      setMistakes((current) => current + 1)
    }

    const nextCompleted = isSolved(nextBoard, solution)
    setBoard(nextBoard)
    setNotes(nextNotes)
    setInvalidCellKeys(getInvalidPositions(nextBoard, solution, fixedCells))
    setCompleted(nextCompleted)
    setCheckResult(
      nextCompleted
        ? {
            status: 'solved',
            message: 'Puzzle solved. Great work.',
          }
        : null,
    )

    if (nextCompleted) {
      timer.pause()
    }
  }

  function clearCell() {
    if (!selectedCell || completed || isPaused) {
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
    setCompleted(false)
    clearCheckResult()
  }

  function toggleNotesMode() {
    if (completed || isPaused) {
      return
    }

    setNotesMode((current) => !current)
    clearCheckResult()
  }

  function revealHint() {
    if (completed || isPaused) {
      return false
    }

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
        setInvalidCellKeys(getInvalidPositions(nextBoard, solution, fixedCells))
        setCompleted(nextCompleted)
        setCheckResult(
          nextCompleted
            ? {
                status: 'solved',
                message: 'Puzzle solved. Great work.',
              }
            : null,
        )

        if (nextCompleted) {
          timer.pause()
        }

        return true
      }
    }

    return false
  }

  function checkSolution(): CheckResult {
    if (!isBoardComplete(board)) {
      const result: CheckResult = {
        status: 'incomplete',
        message: 'Puzzle is not complete yet.',
      }

      setCompleted(false)
      setCheckResult(result)
      return result
    }

    const solved = isSolved(board, solution)

    if (!solved) {
      const result: CheckResult = {
        status: 'incorrect',
        message: 'Some cells are incorrect. Keep going.',
      }

      setCompleted(false)
      setInvalidCellKeys(getInvalidPositions(board, solution, fixedCells))
      setCheckResult(result)
      return result
    }

    const result: CheckResult = {
      status: 'solved',
      message: 'Puzzle solved. Great work.',
    }

    setCompleted(true)
    setCheckResult(result)
    timer.pause()
    return result
  }

  function pauseGame() {
    if (completed) {
      return
    }

    setIsPaused(true)
    timer.pause()
  }

  function resumeGame() {
    if (completed) {
      return
    }

    setIsPaused(false)
    timer.resume()
  }

  function togglePause() {
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
    setCompleted(false)
    setNotesMode(false)
    setIsPaused(false)
    setSessionId((current) => current + 1)
    clearCheckResult()
    setInvalidCellKeys(getInvalidPositions(nextPuzzle, solution, nextFixedCells))
    timer.start()
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
  }, [handleKeyDown])

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
      notesMode,
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
    notesMode,
    saveGameState,
  ])

  useEffect(() => {
    if (completed) {
      setIsPaused(false)
    }
  }, [completed])

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
    hintsUsed,
    sessionId,
    completed,
    checkResult,
    notesMode,
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
    startNewGame,
    resetGame,
    clearSavedProgress,
  }
}
