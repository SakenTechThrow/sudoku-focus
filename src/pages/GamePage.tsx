import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { NFactorialAdCard } from '../components/ads/NFactorialAdCard'
import { SudokuBoard } from '../components/board/SudokuBoard'
import { AICoachPanel } from '../components/coach/AICoachPanel'
import { GameControlPanel } from '../components/game/GameControlPanel'
import { GameSessionHeader } from '../components/game/GameSessionHeader'
import { useAICoach } from '../hooks/useAICoach'
import { useAuth } from '../hooks/useAuth'
import { useGamePersistence } from '../hooks/useGamePersistence'
import { useSessionAdDismissal } from '../hooks/useSessionAdDismissal'
import { useSudokuGame } from '../hooks/useSudokuGame'
import { calculateScore } from '../lib/scoring'
import type { SaveGameResult } from '../types/user'

export function GamePage() {
  const {
    difficulty,
    difficultyConfig,
    board,
    puzzle,
    solution,
    notes,
    fixedCells,
    selectedCell,
    selectedValue,
    selectedNotes,
    mistakes,
    hintsUsed,
    timerSeconds,
    sessionId,
    completed,
    checkResult,
    notesMode,
    isPaused,
    invalidCellKeys,
    isComplete,
    formattedTime,
    selectCell,
    clearSelection,
    setCellValue,
    clearCell,
    startNewGame,
    toggleNotesMode,
    revealHint,
    checkSolution,
    togglePause,
    resetGame,
    clearSavedProgress,
  } = useSudokuGame()
  const { isAuthenticated } = useAuth()
  const { saveCompletedGame } = useGamePersistence()

  const isSelectedCellFixed = selectedCell
    ? fixedCells[selectedCell.row][selectedCell.col]
    : false
  const coach = useAICoach({
    board,
    solution,
    fixedCells,
    selectedCell,
    selectedValue,
  })
  const [isSuccessVisible, setIsSuccessVisible] = useState(false)
  const [saveState, setSaveState] = useState<SaveGameResult | null>(null)
  const [saveLoading, setSaveLoading] = useState(false)
  const [savedSessionId, setSavedSessionId] = useState<number | null>(null)
  const puzzleSignature = useMemo(
    () => puzzle.flat().join(''),
    [puzzle],
  )
  const adStorageKey = `nfactorial-ad-dismissed-game-${sessionId}-${puzzleSignature}`
  const { isVisible: isNFactorialAdVisible, dismiss: dismissNFactorialAd } =
    useSessionAdDismissal(adStorageKey, hintsUsed > 3)
  const scoreEstimate = calculateScore({
    difficulty,
    timeSeconds: timerSeconds,
    mistakes,
    hintsUsed,
  })

  useEffect(() => {
    if (completed) {
      setIsSuccessVisible(true)
      return
    }

    setIsSuccessVisible(false)
  }, [completed])

  useEffect(() => {
    setSaveState(null)
    setSaveLoading(false)
    setSavedSessionId(null)
  }, [sessionId])

  async function handleSaveProgress() {
    if (saveLoading || savedSessionId === sessionId) {
      return
    }

    setSaveLoading(true)
    const result = await saveCompletedGame({
      difficulty,
      puzzle,
      solution,
      timeSeconds: timerSeconds,
      mistakes,
      hintsUsed,
    })
    setSaveState(result)

    if (result.ok) {
      setSavedSessionId(sessionId)
    }

    setSaveLoading(false)
  }

  return (
    <>
      <div className="space-y-6">
        <GameSessionHeader
          difficulty={difficulty}
          difficultyLabel={difficultyConfig.label}
          difficultyDescription={difficultyConfig.description}
          cellsToRemove={difficultyConfig.cellsToRemove}
          mistakeLimit={difficultyConfig.mistakeLimit}
          formattedTime={formattedTime}
          mistakes={mistakes}
          hintsUsed={hintsUsed}
          notesMode={notesMode}
          isPaused={isPaused}
        />

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="rounded-[2rem] border border-slate-200/90 bg-white/82 p-4 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-sm dark:border-white/10 dark:bg-white/6 dark:shadow-[0_18px_60px_rgba(2,8,24,0.35)] sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-cyan-700 dark:text-cyan-200/75">Sudoku Board</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  Select any cell to begin. Fixed clues stay locked.
                </p>
              </div>
              <button
                type="button"
                onClick={clearSelection}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition hover:border-cyan-300/35 hover:bg-cyan-50/70 dark:border-white/10 dark:bg-slate-950/45 dark:text-slate-200 dark:hover:bg-slate-900/80"
              >
                Clear Selection
              </button>
            </div>

            <div className="mt-5 flex justify-center">
              <SudokuBoard
                board={board}
                notes={notes}
                fixedCells={fixedCells}
                selectedCell={selectedCell}
                invalidCellKeys={invalidCellKeys}
                isPaused={isPaused}
                onSelectCell={selectCell}
              />
            </div>
          </div>

          <div className="space-y-6">
            <GameControlPanel
              difficulty={difficulty}
              selectedCell={selectedCell}
              selectedValue={selectedValue}
              selectedNotes={selectedNotes}
              isSelectedCellFixed={isSelectedCellFixed}
              completed={completed}
              isPaused={isPaused}
              isComplete={isComplete}
              checkResult={checkResult}
              notesMode={notesMode}
              hintsUsed={hintsUsed}
              onDifficultySelect={startNewGame}
              onValueSelect={setCellValue}
              onClear={clearCell}
              onToggleNotesMode={toggleNotesMode}
              onRevealHint={revealHint}
              onCheckSolution={checkSolution}
              onStartNewGame={() => startNewGame(difficulty)}
              onResetGame={resetGame}
              onTogglePause={togglePause}
              onClearSavedProgress={clearSavedProgress}
            />

            {isNFactorialAdVisible ? (
              <NFactorialAdCard onDismiss={dismissNFactorialAd} />
            ) : null}

            <AICoachPanel
              title={coach.title}
              message={coach.message}
              possibleValues={coach.possibleValues}
              status={coach.status}
              confidence={coach.confidence}
              focusSignal={coach.focusSignal}
              onRefresh={coach.refreshExplanation}
            />
          </div>
        </section>
      </div>

      {completed && isSuccessVisible ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-[2rem] border border-emerald-300/20 bg-slate-950/95 p-6 text-center shadow-[0_24px_100px_rgba(2,8,24,0.55)]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-200">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h2 className="mt-5 font-display text-3xl font-semibold text-white">
              Puzzle complete
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Nice work. You solved this {difficultyConfig.label.toLowerCase()} puzzle and completed this focus session with
              <span className="font-semibold text-white"> {mistakes} </span>
              mistakes.
            </p>
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-left">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Score estimate</p>
              <p className="mt-2 font-display text-3xl font-semibold text-white">{scoreEstimate}</p>
              <p className="mt-2 text-sm text-slate-300">
                Based on difficulty, mistakes, and hints used. Saved games also update your XP.
              </p>

              <div className="mt-4 grid gap-3">
                {isAuthenticated ? (
                  <button
                    type="button"
                    onClick={() => void handleSaveProgress()}
                    disabled={saveLoading || savedSessionId === sessionId}
                    className="rounded-2xl border border-cyan-300/25 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/16 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {saveLoading
                      ? 'Saving progress...'
                      : savedSessionId === sessionId
                        ? 'Progress saved'
                        : 'Save Progress'}
                  </button>
                ) : (
                  <Link
                    to="/auth"
                    className="rounded-2xl border border-cyan-300/25 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/16"
                  >
                    Sign in to save progress
                  </Link>
                )}

                {saveState ? (
                  <div className={`rounded-2xl border px-4 py-3 text-sm ${
                    saveState.ok
                      ? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-100'
                      : 'border-amber-300/20 bg-amber-400/10 text-amber-50'
                  }`}>
                    {saveState.message}
                    {saveState.ok ? ` Score saved: ${saveState.score}.` : ''}
                  </div>
                ) : null}
              </div>
            </div>
            <div className="mt-6 grid gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsSuccessVisible(false)
                  resetGame()
                }}
                className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-50"
              >
                Play Again
              </button>
              <button
                type="button"
                onClick={() => setIsSuccessVisible(false)}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
