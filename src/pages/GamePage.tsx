import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { NFactorialRewardedAdModal } from '../components/ads/NFactorialRewardedAdModal'
import { SudokuBoard } from '../components/board/SudokuBoard'
import { AICoachPanel } from '../components/coach/AICoachPanel'
import { GameControlPanel } from '../components/game/GameControlPanel'
import { GameResultModal } from '../components/game/GameResultModal'
import { PreGameReadyCard } from '../components/game/PreGameReadyCard'
import { GameSessionHeader } from '../components/game/GameSessionHeader'
import { ShareResultCard } from '../components/share/ShareResultCard'
import { DifficultySelector } from '../components/game/DifficultySelector'
import { FREE_HINT_LIMIT } from '../constants/ads'
import { useAICoach } from '../hooks/useAICoach'
import { useAuth } from '../hooks/useAuth'
import { useGamePersistence } from '../hooks/useGamePersistence'
import { useRewardedHint } from '../hooks/useRewardedHint'
import { useSudokuGame } from '../hooks/useSudokuGame'
import { buildAuthRedirectPath } from '../lib/authRedirect'
import { calculateScore, calculateXpFromScore } from '../lib/scoring'
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
    mistakeLimit,
    hintsUsed,
    timerSeconds,
    sessionId,
    status,
    isGameOver,
    lastMove,
    hasStarted,
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
    startGame,
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
  const rewardedHint = useRewardedHint({
    hintsUsed,
    revealHint,
    disabled: isGameOver,
  })
  const isWon = status === 'won'
  const scoreEstimate = calculateScore({
    difficulty,
    timeSeconds: timerSeconds,
    mistakes,
    hintsUsed,
    status,
  })
  const xpEstimate = calculateXpFromScore(scoreEstimate)
  const shareUrl = typeof window === 'undefined'
    ? '/game'
    : `${window.location.origin}/game`
  const showReadyScreen = !hasStarted && !isGameOver

  useEffect(() => {
    if (isGameOver) {
      setIsSuccessVisible(true)
      return
    }

    setIsSuccessVisible(false)
  }, [isGameOver])

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
      status,
    })
    setSaveState(result)

    if (result.ok) {
      setSavedSessionId(sessionId)
    }

    setSaveLoading(false)
  }

  return (
    <>
      <div className="space-y-3 lg:space-y-4">
        <GameSessionHeader
          difficulty={difficulty}
          difficultyLabel={difficultyConfig.label}
          difficultyDescription={difficultyConfig.description}
          cellsToRemove={difficultyConfig.cellsToRemove}
          mistakeLimit={mistakeLimit}
          formattedTime={formattedTime}
          mistakes={mistakes}
          hintsUsed={hintsUsed}
          notesMode={notesMode}
          hasStarted={hasStarted}
          isPaused={isPaused}
          status={status}
        />

        {showReadyScreen ? (
          <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_22rem]">
            <PreGameReadyCard
              eyebrow="Solo practice"
              title="Ready for your focus session?"
              description="Pick a level. Start focused. Solve clean."
              actionLabel="Start Game"
              onStart={startGame}
              stats={[
                { label: 'Difficulty', value: difficultyConfig.label },
                { label: 'Mistakes', value: `${mistakeLimit}` },
                { label: 'Free hints', value: `${FREE_HINT_LIMIT}` },
                { label: 'Mode', value: 'Solo Practice' },
              ]}
              footnote="Board, coach, and controls unlock on start."
            />

            <div className="space-y-4 lg:sticky lg:top-24">
              <DifficultySelector currentDifficulty={difficulty} onSelect={startNewGame} />
              <div className="rounded-[1.8rem] border border-slate-200/90 bg-white/82 p-4 text-sm leading-6 text-slate-600 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-sm dark:border-white/10 dark:bg-white/6 dark:text-slate-300 dark:shadow-[0_18px_60px_rgba(2,8,24,0.35)] sm:p-5">
                Your timer stays at <span className="font-semibold text-slate-950 dark:text-white">00:00</span> until you press Start Game.
              </div>
            </div>
          </section>
        ) : (
          <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="rounded-[1.9rem] border border-slate-200/90 bg-white/82 p-4 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-sm dark:border-white/10 dark:bg-white/6 dark:shadow-[0_18px_60px_rgba(2,8,24,0.35)] sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-cyan-700 dark:text-cyan-200/75">Sudoku Board</p>
                  <p className="mt-1.5 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Stay focused and work through the puzzle one confident move at a time.
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

              <div className="mt-4 flex justify-center">
                <SudokuBoard
                  board={board}
                  solution={solution}
                  notes={notes}
                  fixedCells={fixedCells}
                  selectedCell={selectedCell}
                  lastMove={lastMove}
                  invalidCellKeys={invalidCellKeys}
                  isPaused={isPaused}
                  isInteractionLocked={isGameOver}
                  celebrate={isWon}
                  onSelectCell={selectCell}
                />
              </div>
            </div>

            <div className="space-y-4 lg:sticky lg:top-24">
              <GameControlPanel
                difficulty={difficulty}
                selectedCell={selectedCell}
                selectedValue={selectedValue}
                selectedNotes={selectedNotes}
                isSelectedCellFixed={isSelectedCellFixed}
                status={status}
                isGameOver={isGameOver}
                hasStarted={hasStarted}
                isPaused={isPaused}
                isComplete={isComplete}
                checkResult={checkResult}
                notesMode={notesMode}
                hintsUsed={hintsUsed}
                hintActionLabel={rewardedHint.hintActionLabel}
                onDifficultySelect={startNewGame}
                onValueSelect={setCellValue}
                onClear={clearCell}
                onToggleNotesMode={toggleNotesMode}
                onRevealHint={rewardedHint.requestHint}
                onCheckSolution={checkSolution}
                onStartGame={startGame}
                onStartNewGame={() => startNewGame(difficulty)}
                onResetGame={resetGame}
                onTogglePause={togglePause}
                onClearSavedProgress={clearSavedProgress}
                startActionLabel="Start Game"
              />

              <AICoachPanel
                title={coach.title}
                message={coach.message}
                deeperExplanation={coach.deeperExplanation}
                suggestedNextStep={coach.suggestedNextStep}
                possibleValues={coach.possibleValues}
                status={coach.status}
                confidence={coach.confidence}
                focusSignal={coach.focusSignal}
                onRefresh={coach.refreshExplanation}
              />
            </div>
          </section>
        )}
      </div>

      <NFactorialRewardedAdModal
        isOpen={rewardedHint.isAdOpen}
        onConfirm={rewardedHint.confirmAdAndRevealHint}
        onCancel={rewardedHint.cancelAd}
      />

      <GameResultModal
        isOpen={isGameOver && isSuccessVisible}
        status={isWon ? 'won' : 'lost'}
        badgeLabel={isWon ? 'Victory unlocked' : 'Session ended'}
        title={isWon ? 'Congratulations — you won!' : 'Game Over'}
        subtitle={isWon
          ? 'Great focus. You solved this puzzle and locked in a real score.'
          : 'You made 3 mistakes. Start a new puzzle or reset this one to try again.'}
        difficultyLabel={difficultyConfig.label}
        formattedTime={formattedTime}
        mistakes={mistakes}
        hintsUsed={hintsUsed}
        score={isWon ? scoreEstimate : undefined}
        xpGained={isWon ? xpEstimate : undefined}
        extraContent={isWon ? (
          <>
            <div className="grid gap-3">
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
                  to={buildAuthRedirectPath('/game')}
                  className="rounded-2xl border border-cyan-300/25 bg-cyan-400/10 px-4 py-3 text-center text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/16"
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

            <ShareResultCard
              mode="game"
              difficulty={difficulty}
              timeSeconds={timerSeconds}
              mistakes={mistakes}
              hintsUsed={hintsUsed}
              score={scoreEstimate}
              url={shareUrl}
              className="mt-5 text-left"
            />
          </>
        ) : (
          <div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-50">
            Start a new game to earn points and leaderboard progress.
          </div>
        )}
        actions={(
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                setIsSuccessVisible(false)
                resetGame()
              }}
              className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-50"
            >
              Try Again
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSuccessVisible(false)
                startNewGame(difficulty)
              }}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              New Game
            </button>
          </div>
        )}
      />
    </>
  )
}
