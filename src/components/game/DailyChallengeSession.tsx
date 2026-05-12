import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import { NFactorialRewardedAdModal } from '../ads/NFactorialRewardedAdModal'
import { SudokuBoard } from '../board/SudokuBoard'
import { AICoachPanel } from '../coach/AICoachPanel'
import { LeaderboardTable } from '../leaderboard/LeaderboardTable'
import { GameControlPanel } from './GameControlPanel'
import { GameSessionHeader } from './GameSessionHeader'
import { useAICoach } from '../../hooks/useAICoach'
import { useAuth } from '../../hooks/useAuth'
import { useGamePersistence } from '../../hooks/useGamePersistence'
import { useLeaderboard } from '../../hooks/useLeaderboard'
import { useRewardedHint } from '../../hooks/useRewardedHint'
import { useSudokuGame } from '../../hooks/useSudokuGame'
import { buildAuthRedirectPath } from '../../lib/authRedirect'
import { calculateScore } from '../../lib/scoring'
import type { DailyChallenge } from '../../types/sudoku'
import type { SaveGameResult } from '../../types/user'

type DailyChallengeSessionProps = {
  challenge: DailyChallenge
}

function formatChallengeDate(value: string) {
  const date = new Date(`${value}T00:00:00Z`)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

export function DailyChallengeSession({ challenge }: DailyChallengeSessionProps) {
  const game = useSudokuGame({
    initialGame: {
      difficulty: challenge.difficulty,
      puzzle: challenge.puzzle,
      solution: challenge.solution,
    },
    storageKey: `sudoku-focus:daily-challenge:${challenge.challengeDate}:v1`,
  })
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
    toggleNotesMode,
    revealHint,
    checkSolution,
    togglePause,
    resetGame,
  } = game
  const { isAuthenticated } = useAuth()
  const { saveCompletedGame } = useGamePersistence()
  const {
    entries,
    loading: leaderboardLoading,
    error: leaderboardError,
    refetch: refetchLeaderboard,
  } = useLeaderboard({
    scope: 'global',
    difficulty: 'all',
    dailyOnly: true,
    challengeDate: challenge.challengeDate,
  })
  const coach = useAICoach({
    board,
    solution,
    fixedCells,
    selectedCell,
    selectedValue,
  })
  const [saveState, setSaveState] = useState<SaveGameResult | null>(null)
  const [saveLoading, setSaveLoading] = useState(false)
  const [savedSessionId, setSavedSessionId] = useState<number | null>(null)
  const rewardedHint = useRewardedHint({
    hintsUsed,
    revealHint,
  })

  const isSelectedCellFixed = selectedCell
    ? fixedCells[selectedCell.row][selectedCell.col]
    : false
  const scoreEstimate = useMemo(() => calculateScore({
    difficulty,
    timeSeconds: timerSeconds,
    mistakes,
    hintsUsed,
  }), [difficulty, hintsUsed, mistakes, timerSeconds])

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
      isDaily: true,
      challengeDate: challenge.challengeDate,
    })
    setSaveState(result)

    if (result.ok) {
      setSavedSessionId(sessionId)
      refetchLeaderboard()
    }

    setSaveLoading(false)
  }

  return (
    <div className="space-y-3 lg:space-y-4">
      <GameSessionHeader
        difficulty={difficulty}
        difficultyLabel={difficultyConfig.label}
        difficultyDescription={difficultyConfig.description}
        mistakeLimit={difficultyConfig.mistakeLimit}
        formattedTime={formattedTime}
        mistakes={mistakes}
        hintsUsed={hintsUsed}
        notesMode={notesMode}
        isPaused={isPaused}
        eyebrow="Daily"
        title="Shared challenge session"
        description={`One shared puzzle every day. Today’s board for ${formatChallengeDate(challenge.challengeDate)} is locked to a single medium challenge for everyone.`}
      />

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="rounded-[1.9rem] border border-slate-200/90 bg-white/82 p-4 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-sm dark:border-white/10 dark:bg-white/6 dark:shadow-[0_18px_60px_rgba(2,8,24,0.35)] sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-700 dark:text-cyan-200/75">Daily Board</p>
              <p className="mt-1.5 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Everyone sees the same puzzle today. Solve cleanly to climb the daily rankings.
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
              notes={notes}
              fixedCells={fixedCells}
              selectedCell={selectedCell}
              invalidCellKeys={invalidCellKeys}
              isPaused={isPaused}
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
            completed={completed}
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
            onStartNewGame={() => {}}
            onResetGame={resetGame}
            onTogglePause={togglePause}
            onClearSavedProgress={() => {}}
            showDifficultySelector={false}
            showStartNewGame={false}
            showClearSavedProgress={false}
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

      <NFactorialRewardedAdModal
        isOpen={rewardedHint.isAdOpen}
        onConfirm={rewardedHint.confirmAdAndRevealHint}
        onCancel={rewardedHint.cancelAd}
      />

      {completed ? (
        <section className="rounded-[2rem] border border-emerald-300/20 bg-emerald-400/10 p-6 shadow-[0_18px_60px_rgba(2,8,24,0.35)] backdrop-blur-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-emerald-100/80">Challenge complete</p>
              <h2 className="mt-3 font-display text-3xl font-semibold text-white">
                Ready to submit today&apos;s result
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-emerald-50/90">
                Your daily score is based on difficulty, speed, mistakes, and hints. Each player gets one official daily submission.
              </p>
            </div>

            <div className="rounded-[1.6rem] border border-white/10 bg-slate-950/40 px-5 py-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Score estimate</p>
              <p className="mt-2 font-display text-3xl font-semibold text-white">{scoreEstimate}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => void handleSaveProgress()}
                disabled={saveLoading || savedSessionId === sessionId}
                className="rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saveLoading
                  ? 'Submitting daily result...'
                  : savedSessionId === sessionId
                    ? 'Daily result submitted'
                    : 'Submit Daily Result'}
              </button>
            ) : (
              <Link
                to={buildAuthRedirectPath('/daily')}
                className="rounded-2xl border border-cyan-300/25 bg-cyan-400/10 px-4 py-3 text-center text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/16"
              >
                Sign in to save progress
              </Link>
            )}

            <button
              type="button"
              onClick={resetGame}
              className="rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/25 hover:bg-slate-900/80"
            >
              Restart today&apos;s puzzle
            </button>
          </div>

          {saveState ? (
            <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
              saveState.ok
                ? 'border-emerald-300/20 bg-emerald-500/10 text-emerald-50'
                : 'border-amber-300/20 bg-amber-400/10 text-amber-50'
            }`}>
              {saveState.message}
              {saveState.ok ? ` Score saved: ${saveState.score}.` : ''}
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="rounded-[2rem] border border-white/10 bg-white/6 p-6 shadow-[0_18px_60px_rgba(2,8,24,0.35)] backdrop-blur-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Daily leaderboard</p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-white">
              Today&apos;s standings
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
              Live rankings for {formatChallengeDate(challenge.challengeDate)}. Faster, cleaner solves rise to the top.
            </p>
          </div>

          <button
            type="button"
            onClick={refetchLeaderboard}
            disabled={leaderboardLoading}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-400/10 px-5 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/16 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <RefreshCw className={`h-4 w-4 ${leaderboardLoading ? 'animate-spin' : ''}`} />
            Refresh daily standings
          </button>
        </div>

        <div className="mt-6">
          {leaderboardLoading ? (
            <div className="rounded-[1.8rem] border border-white/10 bg-slate-950/35 p-8 text-center">
              <p className="font-display text-2xl font-semibold text-white">Loading daily leaderboard...</p>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Pulling today&apos;s shared results from Supabase.
              </p>
            </div>
          ) : leaderboardError ? (
            <div className="rounded-[1.8rem] border border-rose-300/20 bg-rose-400/10 p-8 text-center">
              <p className="font-display text-2xl font-semibold text-white">Could not load today&apos;s rankings</p>
              <p className="mt-3 text-sm leading-7 text-rose-50">{leaderboardError}</p>
            </div>
          ) : (
            <LeaderboardTable entries={entries} />
          )}
        </div>
      </section>
    </div>
  )
}
