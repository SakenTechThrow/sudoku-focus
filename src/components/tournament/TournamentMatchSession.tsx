import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { NFactorialRewardedAdModal } from '../ads/NFactorialRewardedAdModal'
import { SudokuBoard } from '../board/SudokuBoard'
import { GameControlPanel } from '../game/GameControlPanel'
import { GameResultModal } from '../game/GameResultModal'
import { GameSessionHeader } from '../game/GameSessionHeader'
import { PreGameReadyCard } from '../game/PreGameReadyCard'
import { Spinner } from '../ui/Spinner'
import { FREE_HINT_LIMIT } from '../../constants/ads'
import { difficultyConfig } from '../../constants/difficulty'
import { useRewardedHint } from '../../hooks/useRewardedHint'
import { useSudokuGame } from '../../hooks/useSudokuGame'
import { calculateScore } from '../../lib/scoring'
import type { Tournament, TournamentMatch, TournamentMatchResult } from '../../types/tournament'

type TournamentMatchSessionProps = {
  tournament: Tournament
  match: TournamentMatch
  roundLabel: string
  opponentName: string
  existingResult: TournamentMatchResult | null
  submittingResult: boolean
  onSubmitResult: (input: {
    matchId: string
    board: TournamentMatch['puzzle']
    timeSeconds: number
    mistakes: number
    hintsUsed: number
    status: 'won' | 'lost'
  }) => Promise<{ ok: boolean; message: string }>
}

export function TournamentMatchSession({
  tournament,
  match,
  roundLabel,
  opponentName,
  existingResult,
  submittingResult,
  onSubmitResult,
}: TournamentMatchSessionProps) {
  const game = useSudokuGame({
    initialGame: {
      difficulty: tournament.difficulty,
      puzzle: match.puzzle,
      solution: match.solution,
    },
    storageKey: `sudoku-focus:tournament:${match.id}:v1`,
  })
  const {
    difficulty,
    board,
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
    toggleNotesMode,
    revealHint,
    checkSolution,
    togglePause,
    startGame,
  } = game
  const rewardedHint = useRewardedHint({
    hintsUsed,
    revealHint,
    disabled: Boolean(existingResult) || isGameOver,
  })
  const [submitFeedback, setSubmitFeedback] = useState<string | null>(existingResult ? 'Result submitted. Waiting for opponent...' : null)
  const autoSubmittedLossRef = useRef(false)
  const difficultyMeta = difficultyConfig[difficulty]
  const isSelectedCellFixed = selectedCell
    ? fixedCells[selectedCell.row][selectedCell.col]
    : false
  const isWon = status === 'won'
  const showReadyScreen = !hasStarted && !isGameOver && !existingResult
  const score = calculateScore({
    difficulty,
    timeSeconds: timerSeconds,
    mistakes,
    hintsUsed,
    status,
  })

  useEffect(() => {
    autoSubmittedLossRef.current = false
    setSubmitFeedback(existingResult ? 'Result submitted. Waiting for opponent...' : null)
  }, [existingResult, match.id])

  async function handleSubmitResult() {
    if (existingResult || status === 'playing' || submittingResult) {
      return
    }

    const result = await onSubmitResult({
      matchId: match.id,
      board,
      timeSeconds: timerSeconds,
      mistakes,
      hintsUsed,
      status,
    })

    setSubmitFeedback(result.message)
  }

  useEffect(() => {
    if (status !== 'lost' || existingResult || autoSubmittedLossRef.current) {
      return
    }

    autoSubmittedLossRef.current = true
    void handleSubmitResult()
  }, [existingResult, status])

  if (existingResult) {
    return (
      <section className="rounded-[1.9rem] border border-slate-200/90 bg-white/82 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-sm dark:border-white/10 dark:bg-white/6 dark:shadow-[0_18px_60px_rgba(2,8,24,0.35)] sm:p-6">
        <p className="text-xs uppercase tracking-[0.28em] text-cyan-700 dark:text-cyan-200/75">
          Your match
        </p>
        <h2 className="mt-3 font-display text-3xl font-semibold text-slate-950 dark:text-white">
          Result submitted
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {submitFeedback ?? 'Waiting for your opponent to finish this round.'}
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4 dark:border-white/10 dark:bg-slate-950/45">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Round</p>
            <p className="mt-2 font-semibold text-slate-950 dark:text-white">{roundLabel}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4 dark:border-white/10 dark:bg-slate-950/45">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Opponent</p>
            <p className="mt-2 font-semibold text-slate-950 dark:text-white">{opponentName}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4 dark:border-white/10 dark:bg-slate-950/45">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Time</p>
            <p className="mt-2 font-semibold text-slate-950 dark:text-white">{formattedTime}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4 dark:border-white/10 dark:bg-slate-950/45">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Score</p>
            <p className="mt-2 font-semibold text-slate-950 dark:text-white">{existingResult.score}</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <>
      <div className="space-y-3 lg:space-y-4">
        <GameSessionHeader
          difficulty={difficulty}
          difficultyLabel={difficultyMeta.label}
          difficultyDescription={difficultyMeta.description}
          cellsToRemove={difficultyMeta.cellsToRemove}
          mistakeLimit={mistakeLimit}
          formattedTime={formattedTime}
          mistakes={mistakes}
          hintsUsed={hintsUsed}
          notesMode={notesMode}
          hasStarted={hasStarted}
          isPaused={isPaused}
          status={status}
          eyebrow={roundLabel}
          title="Your match"
          description={`Same puzzle. Separate boards. ${opponentName} is on the other side of this round.`}
        />

        {showReadyScreen ? (
          <PreGameReadyCard
            eyebrow="Tournament"
            title="Ready to play your match?"
            description="Fast focus wins. Clean solves advance."
            actionLabel="Start Playing"
            onStart={startGame}
            stats={[
              { label: 'Round', value: roundLabel },
              { label: 'Opponent', value: opponentName },
              { label: 'Mistakes', value: `${mistakeLimit}` },
              { label: 'Free hints', value: `${FREE_HINT_LIMIT}` },
            ]}
            footnote="Your timer starts on Start Playing."
          />
        ) : (
          <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="rounded-[1.9rem] border border-slate-200/90 bg-white/82 p-4 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-sm dark:border-white/10 dark:bg-white/6 dark:shadow-[0_18px_60px_rgba(2,8,24,0.35)] sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-cyan-700 dark:text-cyan-200/75">
                    Match board
                  </p>
                  <p className="mt-1.5 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Solve clean. Three mistakes ends the run.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition hover:border-cyan-300/35 hover:bg-cyan-50/70 dark:border-white/10 dark:bg-slate-950/45 dark:text-slate-200 dark:hover:bg-slate-900/80"
                >
                  Clear selection
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
                onDifficultySelect={() => {}}
                onValueSelect={setCellValue}
                onClear={clearCell}
                onToggleNotesMode={toggleNotesMode}
                onRevealHint={rewardedHint.requestHint}
                onCheckSolution={checkSolution}
                onStartGame={startGame}
                onStartNewGame={() => {}}
                onResetGame={() => {}}
                onTogglePause={togglePause}
                onClearSavedProgress={() => {}}
                showDifficultySelector={false}
                showStartNewGame={false}
                showResetGame={false}
                showClearSavedProgress={false}
                startActionLabel="Start Playing"
              />

              {submitFeedback ? (
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/90 px-4 py-3 text-sm text-slate-600 dark:border-white/10 dark:bg-slate-950/45 dark:text-slate-300">
                  {submitFeedback}
                </div>
              ) : null}
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
        isOpen={isGameOver}
        status={isWon ? 'won' : 'lost'}
        badgeLabel={isWon ? 'Match point' : 'Round ended'}
        title={isWon ? 'You finished!' : 'Match over'}
        subtitle={isWon
          ? 'Nice solve. Submit your result to lock in this round.'
          : 'You hit the 3-mistake limit. Your result is being submitted.'}
        difficultyLabel={difficultyMeta.label}
        formattedTime={formattedTime}
        mistakes={mistakes}
        hintsUsed={hintsUsed}
        score={isWon ? score : 0}
        actions={isWon ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => void handleSubmitResult()}
              disabled={submittingResult}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-300/25 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/16 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submittingResult ? <Spinner className="text-current" /> : null}
              {submittingResult ? 'Submitting...' : 'Submit Result'}
            </button>
            <Link
              to="/tournaments"
              className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/12"
            >
              Back to tournaments
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            {submittingResult ? 'Submitting your loss result...' : (submitFeedback ?? 'Waiting for the bracket to update.')}
          </div>
        )}
      />
    </>
  )
}
