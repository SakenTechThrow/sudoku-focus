import type { CandidateValue, SudokuBoard } from '../types/sudoku'

const candidateValues: CandidateValue[] = [1, 2, 3, 4, 5, 6, 7, 8, 9]

export type CoachStatus = 'learning' | 'strong' | 'conflict' | 'fixed'

export type CoachConfidence = 'Learning tip' | 'Strong move' | 'Conflict' | 'Fixed clue'

export type CoachInsight = {
  strategyName: string
  explanation: string
  deeperExplanation: string
  suggestedNextStep: string
  possibleValues: CandidateValue[]
  status: CoachStatus
  confidence: CoachConfidence
}

type HiddenSingleMatch = {
  row: number
  col: number
  value: CandidateValue
}

function buildInsight({
  strategyName,
  explanation,
  deeperExplanation,
  suggestedNextStep,
  possibleValues,
  status,
  confidence,
}: CoachInsight): CoachInsight {
  return {
    strategyName,
    explanation,
    deeperExplanation,
    suggestedNextStep,
    possibleValues,
    status,
    confidence,
  }
}

function formatValueList(values: CandidateValue[]) {
  if (values.length === 0) {
    return ''
  }

  if (values.length === 1) {
    return `${values[0]}`
  }

  if (values.length === 2) {
    return `${values[0]} and ${values[1]}`
  }

  return `${values.slice(0, -1).join(', ')}, and ${values.at(-1)}`
}

function formatCellPosition(row: number, col: number) {
  return `row ${row + 1}, column ${col + 1}`
}

function getBoxStartIndex(index: number) {
  return Math.floor(index / 3) * 3
}

function describeBox(row: number, col: number) {
  const boxRowStart = getBoxStartIndex(row)
  const boxColStart = getBoxStartIndex(col)

  return `the 3x3 box covering rows ${boxRowStart + 1}-${boxRowStart + 3} and columns ${boxColStart + 1}-${boxColStart + 3}`
}

function hasRowConflict(board: SudokuBoard, row: number, col: number, value: CandidateValue) {
  return board[row].some((cell, columnIndex) => columnIndex !== col && cell === value)
}

function hasColumnConflict(board: SudokuBoard, row: number, col: number, value: CandidateValue) {
  return board.some((boardRow, rowIndex) => rowIndex !== row && boardRow[col] === value)
}

function hasBoxConflict(board: SudokuBoard, row: number, col: number, value: CandidateValue) {
  const boxRowStart = getBoxStartIndex(row)
  const boxColStart = getBoxStartIndex(col)

  for (let rowIndex = boxRowStart; rowIndex < boxRowStart + 3; rowIndex += 1) {
    for (let colIndex = boxColStart; colIndex < boxColStart + 3; colIndex += 1) {
      const isCurrentCell = rowIndex === row && colIndex === col

      if (!isCurrentCell && board[rowIndex][colIndex] === value) {
        return true
      }
    }
  }

  return false
}

export function getCandidatesForCell(board: SudokuBoard, row: number, col: number) {
  if (board[row][col] !== 0) {
    return []
  }

  return candidateValues.filter((value) => {
    return !hasRowConflict(board, row, col, value)
      && !hasColumnConflict(board, row, col, value)
      && !hasBoxConflict(board, row, col, value)
  })
}

export function getPossibleValues(board: SudokuBoard, row: number, col: number) {
  return getCandidatesForCell(board, row, col)
}

export function findNakedSingle(board: SudokuBoard, row: number, col: number): HiddenSingleMatch | null {
  const candidates = getCandidatesForCell(board, row, col)

  if (candidates.length !== 1) {
    return null
  }

  return {
    row,
    col,
    value: candidates[0],
  }
}

export function findHiddenSingleInRow(board: SudokuBoard, row: number): HiddenSingleMatch | null {
  const candidateMap = new Map<CandidateValue, number[]>()

  for (const value of candidateValues) {
    candidateMap.set(value, [])
  }

  for (let col = 0; col < 9; col += 1) {
    if (board[row][col] !== 0) {
      continue
    }

    const candidates = getCandidatesForCell(board, row, col)

    for (const candidate of candidates) {
      candidateMap.get(candidate)?.push(col)
    }
  }

  for (const value of candidateValues) {
    const matchingColumns = candidateMap.get(value) ?? []

    if (matchingColumns.length === 1) {
      return {
        row,
        col: matchingColumns[0],
        value,
      }
    }
  }

  return null
}

export function findHiddenSingleInColumn(board: SudokuBoard, col: number): HiddenSingleMatch | null {
  const candidateMap = new Map<CandidateValue, number[]>()

  for (const value of candidateValues) {
    candidateMap.set(value, [])
  }

  for (let row = 0; row < 9; row += 1) {
    if (board[row][col] !== 0) {
      continue
    }

    const candidates = getCandidatesForCell(board, row, col)

    for (const candidate of candidates) {
      candidateMap.get(candidate)?.push(row)
    }
  }

  for (const value of candidateValues) {
    const matchingRows = candidateMap.get(value) ?? []

    if (matchingRows.length === 1) {
      return {
        row: matchingRows[0],
        col,
        value,
      }
    }
  }

  return null
}

export function findHiddenSingleInBox(board: SudokuBoard, row: number, col: number): HiddenSingleMatch | null {
  const boxRowStart = getBoxStartIndex(row)
  const boxColStart = getBoxStartIndex(col)
  const candidateMap = new Map<CandidateValue, Array<{ row: number; col: number }>>()

  for (const value of candidateValues) {
    candidateMap.set(value, [])
  }

  for (let rowIndex = boxRowStart; rowIndex < boxRowStart + 3; rowIndex += 1) {
    for (let colIndex = boxColStart; colIndex < boxColStart + 3; colIndex += 1) {
      if (board[rowIndex][colIndex] !== 0) {
        continue
      }

      const candidates = getCandidatesForCell(board, rowIndex, colIndex)

      for (const candidate of candidates) {
        candidateMap.get(candidate)?.push({ row: rowIndex, col: colIndex })
      }
    }
  }

  for (const value of candidateValues) {
    const matchingCells = candidateMap.get(value) ?? []

    if (matchingCells.length === 1) {
      return {
        row: matchingCells[0].row,
        col: matchingCells[0].col,
        value,
      }
    }
  }

  return null
}

function getCandidateScanInsight(_board: SudokuBoard, row: number, col: number, possibleValues: CandidateValue[]) {
  return buildInsight({
    strategyName: 'Candidate Scan',
    explanation: `This cell can currently hold ${formatValueList(possibleValues)}. There is no immediate single here yet, so the next step is elimination.`,
    deeperExplanation: `Candidate scanning means listing every legal value for ${formatCellPosition(row, col)} and then comparing those candidates against the rest of the row, column, and ${describeBox(row, col)}. If one candidate only appears once in any of those houses, it becomes a hidden single.`,
    suggestedNextStep: `Compare ${formatValueList(possibleValues)} against the rest of the row, column, and box to look for a hidden single.`,
    possibleValues,
    status: 'learning',
    confidence: 'Learning tip',
  })
}

function getNakedSingleInsight(_board: SudokuBoard, row: number, col: number, value: CandidateValue) {
  return buildInsight({
    strategyName: 'Naked Single',
    explanation: `${formatCellPosition(row, col)} has only one legal candidate left: ${value}. Every other number is blocked by the row, column, or box.`,
    deeperExplanation: `A naked single appears when candidate elimination leaves exactly one value in a cell. Once you check the row, column, and ${describeBox(row, col)}, only ${value} survives, so this is one of the safest moves you can make.`,
    suggestedNextStep: `Place ${value} in ${formatCellPosition(row, col)} and use it to reduce nearby candidates.`,
    possibleValues: [value],
    status: 'strong',
    confidence: 'Strong move',
  })
}

function getHiddenSingleRowInsight(
  _board: SudokuBoard,
  row: number,
  _col: number,
  value: CandidateValue,
  possibleValues: CandidateValue[],
) {
  return buildInsight({
    strategyName: 'Hidden Single in Row',
    explanation: `In row ${row + 1}, only this cell can take ${value}. Even if the cell still shows ${formatValueList(possibleValues)} as candidates, ${value} is unique across the row.`,
    deeperExplanation: `A hidden single is easy to miss because the cell itself can still look ambiguous. The key is that when you scan every empty cell in row ${row + 1}, no other spot can legally accept ${value}, so the row forces this placement.`,
    suggestedNextStep: `Place ${value} here, then rescan row ${row + 1} for easier follow-up eliminations.`,
    possibleValues,
    status: 'strong',
    confidence: 'Strong move',
  })
}

function getHiddenSingleColumnInsight(
  _board: SudokuBoard,
  row: number,
  col: number,
  value: CandidateValue,
  possibleValues: CandidateValue[],
) {
  return buildInsight({
    strategyName: 'Hidden Single in Column',
    explanation: `In column ${col + 1}, only this cell can take ${value}. The column rules force ${value} into ${formatCellPosition(row, col)}.`,
    deeperExplanation: `This is a hidden single in the column: other candidates may still fit this cell, but if you scan every empty square in column ${col + 1}, only this one can legally hold ${value}.`,
    suggestedNextStep: `Place ${value} here and then check column ${col + 1} for the next forced move.`,
    possibleValues,
    status: 'strong',
    confidence: 'Strong move',
  })
}

function getHiddenSingleBoxInsight(
  _board: SudokuBoard,
  row: number,
  col: number,
  value: CandidateValue,
  possibleValues: CandidateValue[],
) {
  return buildInsight({
    strategyName: 'Hidden Single in Box',
    explanation: `Inside ${describeBox(row, col)}, only this cell can take ${value}. The 3x3 box forces the move even though other candidates remain visible here.`,
    deeperExplanation: `Boxes often hide singles because the cell can still show multiple candidates. When you scan every empty cell in ${describeBox(row, col)}, ${value} appears in only one candidate list, so this cell must take it.`,
    suggestedNextStep: `Place ${value} here, then use that confirmed number to tighten the rest of the box.`,
    possibleValues,
    status: 'strong',
    confidence: 'Strong move',
  })
}

function getConflictInsight(
  _board: SudokuBoard,
  row: number,
  col: number,
  possibleValues: CandidateValue[],
) {
  return buildInsight({
    strategyName: 'Conflict Scan',
    explanation: 'This cell currently has no legal candidates, which usually means a nearby value needs to be corrected before this spot can be solved.',
    deeperExplanation: `When a cell has no legal candidate, one of the neighboring values is blocking every number from 1 to 9. Recheck the surrounding row, column, and ${describeBox(row, col)} for an earlier mistake or an overcommitted guess.`,
    suggestedNextStep: `Review nearby filled cells first, then come back once this spot has legal candidates again.`,
    possibleValues,
    status: 'conflict',
    confidence: 'Conflict',
  })
}

export function explainSelectedCell(
  board: SudokuBoard,
  _solution: SudokuBoard,
  row: number,
  col: number,
) {
  const possibleValues = getCandidatesForCell(board, row, col)

  if (possibleValues.length === 0) {
    return getConflictInsight(board, row, col, possibleValues)
  }

  const nakedSingle = findNakedSingle(board, row, col)

  if (nakedSingle) {
    return getNakedSingleInsight(board, row, col, nakedSingle.value)
  }

  const hiddenSingleInRow = findHiddenSingleInRow(board, row)

  if (hiddenSingleInRow && hiddenSingleInRow.col === col) {
    return getHiddenSingleRowInsight(
      board,
      row,
      col,
      hiddenSingleInRow.value,
      possibleValues,
    )
  }

  const hiddenSingleInColumn = findHiddenSingleInColumn(board, col)

  if (hiddenSingleInColumn && hiddenSingleInColumn.row === row) {
    return getHiddenSingleColumnInsight(
      board,
      row,
      col,
      hiddenSingleInColumn.value,
      possibleValues,
    )
  }

  const hiddenSingleInBox = findHiddenSingleInBox(board, row, col)

  if (hiddenSingleInBox && hiddenSingleInBox.row === row && hiddenSingleInBox.col === col) {
    return getHiddenSingleBoxInsight(
      board,
      row,
      col,
      hiddenSingleInBox.value,
      possibleValues,
    )
  }

  return getCandidateScanInsight(board, row, col, possibleValues)
}

export function explainMove(
  board: SudokuBoard,
  solution: SudokuBoard,
  row: number,
  col: number,
  value: CandidateValue,
) {
  const reasons: string[] = []

  if (hasRowConflict(board, row, col, value)) {
    reasons.push(`Number ${value} already appears in this row.`)
  }

  if (hasColumnConflict(board, row, col, value)) {
    reasons.push(`Number ${value} already appears in this column.`)
  }

  if (hasBoxConflict(board, row, col, value)) {
    reasons.push(`Number ${value} already appears in ${describeBox(row, col)}.`)
  }

  const candidateBoard = board.map((boardRow) => [...boardRow]) as SudokuBoard
  candidateBoard[row][col] = 0
  const clearedCandidates = getCandidatesForCell(candidateBoard, row, col)

  if (reasons.length > 0) {
    return buildInsight({
      strategyName: 'Conflict Detected',
      explanation: `${reasons.join(' ')} This move breaks Sudoku constraints immediately.`,
      deeperExplanation: `Conflicts are the clearest signal to stop and reset the cell. Once ${value} is removed, the legal candidates for ${formatCellPosition(row, col)} become ${clearedCandidates.length > 0 ? formatValueList(clearedCandidates) : 'none yet'}, which helps you re-enter the puzzle from logic instead of guesswork.`,
      suggestedNextStep: `Clear the cell, then compare ${clearedCandidates.length > 0 ? formatValueList(clearedCandidates) : 'the surrounding houses'} before trying again.`,
      possibleValues: clearedCandidates,
      status: 'conflict',
      confidence: 'Conflict',
    })
  }

  if (value !== solution[row][col]) {
    return buildInsight({
      strategyName: 'Candidate Mismatch',
      explanation: `Number ${value} does not create a direct row, column, or box conflict, but it still does not match the correct solution for this puzzle.`,
      deeperExplanation: `This is the kind of move that looks legal in isolation but is not logically forced yet. When that happens, step back to the candidate list for ${formatCellPosition(row, col)} and search for a stronger strategy such as a naked single or hidden single before committing.`,
      suggestedNextStep: `Keep the cell empty for now and narrow it with candidates instead of guessing.`,
      possibleValues: clearedCandidates,
      status: 'conflict',
      confidence: 'Conflict',
    })
  }

  const nakedSingle = findNakedSingle(candidateBoard, row, col)
  const hiddenSingleInRow = findHiddenSingleInRow(candidateBoard, row)
  const hiddenSingleInColumn = findHiddenSingleInColumn(candidateBoard, col)
  const hiddenSingleInBox = findHiddenSingleInBox(candidateBoard, row, col)

  if (nakedSingle && nakedSingle.value === value) {
    return buildInsight({
      strategyName: 'Naked Single Confirmed',
      explanation: `Number ${value} is correct here, and this was a naked single before you placed it.`,
      deeperExplanation: `Before the move, ${formatCellPosition(row, col)} had only one legal candidate left. That is why this placement is especially strong: the board itself forced the number without any guesswork.`,
      suggestedNextStep: `Use this confirmed value to reduce candidates in the same row, column, and box.`,
      possibleValues: [value],
      status: 'strong',
      confidence: 'Strong move',
    })
  }

  if (hiddenSingleInRow && hiddenSingleInRow.col === col && hiddenSingleInRow.value === value) {
    return buildInsight({
      strategyName: 'Hidden Single in Row Confirmed',
      explanation: `Number ${value} is correct here because row ${row + 1} had only one valid place for it.`,
      deeperExplanation: `Even if the cell looked like it had several candidates, the row-level scan forced ${value} into this position. Hidden singles often come from checking where a specific number can still appear in a house.`,
      suggestedNextStep: `Now rescan row ${row + 1} and nearby boxes to see what this placement unlocks.`,
      possibleValues: [],
      status: 'strong',
      confidence: 'Strong move',
    })
  }

  if (hiddenSingleInColumn && hiddenSingleInColumn.row === row && hiddenSingleInColumn.value === value) {
    return buildInsight({
      strategyName: 'Hidden Single in Column Confirmed',
      explanation: `Number ${value} is correct here because column ${col + 1} had only one legal home for it.`,
      deeperExplanation: `This was not obvious from the cell alone. The real clue came from scanning the entire column and noticing that ${value} disappeared from every other empty spot.`,
      suggestedNextStep: `Use the completed column placement to tighten the rest of the grid.`,
      possibleValues: [],
      status: 'strong',
      confidence: 'Strong move',
    })
  }

  if (hiddenSingleInBox && hiddenSingleInBox.row === row && hiddenSingleInBox.col === col && hiddenSingleInBox.value === value) {
    return buildInsight({
      strategyName: 'Hidden Single in Box Confirmed',
      explanation: `Number ${value} is correct here because ${describeBox(row, col)} left only one place for it.`,
      deeperExplanation: `This is a classic box-based hidden single. The cell can still look ambiguous, but the surrounding 3x3 structure removes every other location for ${value}.`,
      suggestedNextStep: `Use this box placement to reduce candidates in the crossing row and column.`,
      possibleValues: [],
      status: 'strong',
      confidence: 'Strong move',
    })
  }

  return buildInsight({
    strategyName: 'Confirmed Move',
    explanation: `Number ${value} is a correct move here. It fits the row, column, and box cleanly.`,
    deeperExplanation: `This move is correct even if the exact forcing pattern was subtler than a single. Confirmed placements matter because each solved cell reduces uncertainty across three houses at once.`,
    suggestedNextStep: `Use this value to cut candidates from the surrounding row, column, and 3x3 box.`,
    possibleValues: [],
    status: 'strong',
    confidence: 'Strong move',
  })
}

function getGenericLearningInsight(board: SudokuBoard) {
  const emptyCells = board.flat().filter((cell) => cell === 0).length

  if (emptyCells > 50) {
    return buildInsight({
      strategyName: 'Opening Scan',
      explanation: 'Early in the puzzle, the easiest wins usually come from rows, columns, or boxes that already contain many given numbers.',
      deeperExplanation: 'When the board is still open, resist guessing. Start where there are the fewest missing values, because each existing clue removes candidates and increases the chance of finding a naked or hidden single.',
      suggestedNextStep: 'Scan the fullest row or box first and look for a cell with just one or two candidates.',
      possibleValues: [],
      status: 'learning',
      confidence: 'Learning tip',
    })
  }

  if (emptyCells > 30) {
    return buildInsight({
      strategyName: 'Midgame Box Scan',
      explanation: 'You are in the midgame, where hidden singles inside 3x3 boxes often create the next clean breakthrough.',
      deeperExplanation: 'At this stage, candidate lists matter more. Instead of checking one cell at a time, scan a whole box and ask whether a specific number has only one legal home inside it.',
      suggestedNextStep: 'Pick one 3x3 box and test each missing number across the empty cells.',
      possibleValues: [],
      status: 'learning',
      confidence: 'Learning tip',
    })
  }

  return buildInsight({
    strategyName: 'Refinement Phase',
    explanation: 'Late in the puzzle, the cleanest progress comes from comparing short candidate lists across nearby houses.',
    deeperExplanation: 'When only a few cells remain, the board rewards patience. Revisit cells with one or two candidates and verify whether one candidate becomes unique in its row, column, or box.',
    suggestedNextStep: 'Focus on the tightest candidate groups and finish with clean elimination rather than speed.',
    possibleValues: [],
    status: 'learning',
    confidence: 'Learning tip',
  })
}

export function getBestStrategyTip(board: SudokuBoard) {
  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      const nakedSingle = findNakedSingle(board, row, col)

      if (nakedSingle) {
        return buildInsight({
          strategyName: 'Naked Single',
          explanation: `${formatCellPosition(row, col)} has only one legal candidate: ${nakedSingle.value}.`,
          deeperExplanation: `This is the cleanest kind of logical move. Once a cell is reduced to one candidate, the puzzle is forcing the placement for you with no guesswork required.`,
          suggestedNextStep: `Select ${formatCellPosition(row, col)} and place ${nakedSingle.value}.`,
          possibleValues: [nakedSingle.value],
          status: 'strong',
          confidence: 'Strong move',
        })
      }
    }
  }

  for (let row = 0; row < 9; row += 1) {
    const hiddenSingle = findHiddenSingleInRow(board, row)

    if (hiddenSingle) {
      return buildInsight({
        strategyName: 'Hidden Single in Row',
        explanation: `Row ${row + 1} has only one legal place for ${hiddenSingle.value}: ${formatCellPosition(hiddenSingle.row, hiddenSingle.col)}.`,
        deeperExplanation: 'Hidden singles are not obvious from the cell itself. The clue comes from checking where one number can still fit across the whole row.',
        suggestedNextStep: `Place ${hiddenSingle.value} in ${formatCellPosition(hiddenSingle.row, hiddenSingle.col)}.`,
        possibleValues: getCandidatesForCell(board, hiddenSingle.row, hiddenSingle.col),
        status: 'strong',
        confidence: 'Strong move',
      })
    }
  }

  for (let col = 0; col < 9; col += 1) {
    const hiddenSingle = findHiddenSingleInColumn(board, col)

    if (hiddenSingle) {
      return buildInsight({
        strategyName: 'Hidden Single in Column',
        explanation: `Column ${col + 1} has only one legal place for ${hiddenSingle.value}: ${formatCellPosition(hiddenSingle.row, hiddenSingle.col)}.`,
        deeperExplanation: 'A column-based hidden single appears when a number can still fit in only one empty cell of that column, even if the target cell shows multiple candidates.',
        suggestedNextStep: `Place ${hiddenSingle.value} in ${formatCellPosition(hiddenSingle.row, hiddenSingle.col)}.`,
        possibleValues: getCandidatesForCell(board, hiddenSingle.row, hiddenSingle.col),
        status: 'strong',
        confidence: 'Strong move',
      })
    }
  }

  for (let boxRowStart = 0; boxRowStart < 9; boxRowStart += 3) {
    for (let boxColStart = 0; boxColStart < 9; boxColStart += 3) {
      const hiddenSingle = findHiddenSingleInBox(board, boxRowStart, boxColStart)

      if (hiddenSingle) {
        return buildInsight({
          strategyName: 'Hidden Single in Box',
          explanation: `${describeBox(hiddenSingle.row, hiddenSingle.col)} has only one legal place for ${hiddenSingle.value}: ${formatCellPosition(hiddenSingle.row, hiddenSingle.col)}.`,
          deeperExplanation: 'Scanning box-by-box often reveals placements that look invisible at the cell level. This is one of the strongest midgame tools for unlocking fresh progress.',
          suggestedNextStep: `Place ${hiddenSingle.value} in ${formatCellPosition(hiddenSingle.row, hiddenSingle.col)}.`,
          possibleValues: getCandidatesForCell(board, hiddenSingle.row, hiddenSingle.col),
          status: 'strong',
          confidence: 'Strong move',
        })
      }
    }
  }

  return getGenericLearningInsight(board)
}

export function getGeneralStrategyTip(board: SudokuBoard) {
  return getBestStrategyTip(board).explanation
}
