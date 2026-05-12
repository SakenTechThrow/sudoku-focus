import { useEffect, useEffectEvent, useMemo, useState } from 'react'
import {
  type CoachInsight,
  type CoachStatus,
  explainMove,
  explainSelectedCell,
  getBestStrategyTip,
} from '../lib/aiCoach'
import { markAICoachUsed } from '../lib/achievements'
import type { CandidateValue, CellPosition, SudokuBoard } from '../types/sudoku'

export type AICoachStatus = CoachStatus

type UseAICoachOptions = {
  board: SudokuBoard
  solution: SudokuBoard
  fixedCells: boolean[][]
  selectedCell: CellPosition | null
  selectedValue: CandidateValue | 0
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
    markAICoachUsed()
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
    if (!selectedCell) {
      return
    }

    // Selecting a cell is a meaningful coach interaction because the panel updates immediately.
    markAICoachUsed()
  }, [selectedCell])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const coachState = useMemo(() => {
    if (!selectedCell) {
      const insight = getBestStrategyTip(board)

      return {
        title: insight.strategyName,
        message: insight.explanation,
        deeperExplanation: insight.deeperExplanation,
        suggestedNextStep: insight.suggestedNextStep,
        possibleValues: insight.possibleValues,
        status: insight.status as AICoachStatus,
        confidence: insight.confidence,
      }
    }

    const { row, col } = selectedCell
    const isFixed = fixedCells[row][col]

    if (isFixed) {
      return {
        title: 'Fixed Clue',
        message:
          'This fixed cell is part of the original puzzle, so it cannot be edited. Treat it as a trusted anchor while you eliminate nearby candidates.',
        deeperExplanation:
          'Given clues are the stable information in Sudoku. They never change, so they are the best place to start when you scan a row, column, or 3x3 box for missing numbers.',
        suggestedNextStep:
          'Use this clue to narrow one nearby empty cell instead of trying to change the clue itself.',
        possibleValues: [],
        status: 'fixed' as AICoachStatus,
        confidence: 'Fixed clue',
      }
    }

    if (selectedValue === 0) {
      const insight = explainSelectedCell(board, solution, row, col)

      return {
        title: insight.strategyName,
        message: insight.explanation,
        deeperExplanation: insight.deeperExplanation,
        suggestedNextStep: insight.suggestedNextStep,
        possibleValues: insight.possibleValues,
        status: insight.status as AICoachStatus,
        confidence: insight.confidence,
      }
    }

    const insight: CoachInsight = explainMove(board, solution, row, col, selectedValue)

    return {
      title: insight.strategyName,
      message: insight.explanation,
      deeperExplanation: insight.deeperExplanation,
      suggestedNextStep: insight.suggestedNextStep,
      possibleValues: insight.possibleValues,
      status: insight.status as AICoachStatus,
      confidence: insight.confidence,
    }
  }, [board, fixedCells, selectedCell, selectedValue, solution])

  return {
    ...coachState,
    focusSignal,
    refreshExplanation,
  }
}
