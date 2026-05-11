import { useEffect, useEffectEvent, useMemo, useState } from 'react'
import {
  explainMove,
  explainSelectedCell,
  getGeneralStrategyTip,
  getPossibleValues,
} from '../lib/aiCoach'
import type { CandidateValue, CellPosition, SudokuBoard } from '../types/sudoku'

export type AICoachStatus = 'idle' | 'fixed' | 'empty' | 'filled' | 'incorrect'

type UseAICoachOptions = {
  board: SudokuBoard
  solution: SudokuBoard
  fixedCells: boolean[][]
  selectedCell: CellPosition | null
  selectedValue: CandidateValue | 0
}

function cloneBoard(board: SudokuBoard) {
  return board.map((row) => [...row]) as SudokuBoard
}

export function useAICoach({
  board,
  solution,
  fixedCells,
  selectedCell,
  selectedValue,
}: UseAICoachOptions) {
  const [focusSignal, setFocusSignal] = useState(0)

  function refreshExplanation() {
    setFocusSignal((current) => current + 1)
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

    if (event.key.toLowerCase() === 'c') {
      event.preventDefault()
      refreshExplanation()
    }
  })

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const coachState = useMemo(() => {
    if (!selectedCell) {
      return {
        title: 'AI Coach',
        message: getGeneralStrategyTip(board),
        possibleValues: [] as CandidateValue[],
        status: 'idle' as AICoachStatus,
        confidence: 'Strategy tip',
      }
    }

    const { row, col } = selectedCell
    const isFixed = fixedCells[row][col]

    if (isFixed) {
      return {
        title: 'AI Coach',
        message:
          'This fixed cell is part of the original puzzle, so it cannot be edited. Use it as an anchor while you eliminate candidates around it.',
        possibleValues: [] as CandidateValue[],
        status: 'fixed' as AICoachStatus,
        confidence: 'Locked clue',
      }
    }

    if (selectedValue === 0) {
      return {
        title: 'AI Coach',
        message: explainSelectedCell(board, solution, row, col),
        possibleValues: getPossibleValues(board, row, col),
        status: 'empty' as AICoachStatus,
        confidence: 'Candidate scan',
      }
    }

    const isCorrect = selectedValue === solution[row][col]

    if (!isCorrect) {
      const clearedBoard = cloneBoard(board)
      clearedBoard[row][col] = 0

      return {
        title: 'AI Coach',
        message: explainMove(board, solution, row, col, selectedValue),
        possibleValues: getPossibleValues(clearedBoard, row, col),
        status: 'incorrect' as AICoachStatus,
        confidence: 'Needs review',
      }
    }

    return {
      title: 'AI Coach',
      message: explainMove(board, solution, row, col, selectedValue),
      possibleValues: [] as CandidateValue[],
      status: 'filled' as AICoachStatus,
      confidence: 'Good move',
    }
  }, [board, fixedCells, selectedCell, selectedValue, solution])

  return {
    ...coachState,
    focusSignal,
    refreshExplanation,
  }
}
