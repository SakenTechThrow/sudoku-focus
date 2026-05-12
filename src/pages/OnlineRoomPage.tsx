import { useMemo, useState } from 'react'
import { CheckCircle2, Copy, Crown, Users2 } from 'lucide-react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { NumberPad } from '../components/board/NumberPad'
import { SudokuBoard } from '../components/board/SudokuBoard'
import { AICoachPanel } from '../components/coach/AICoachPanel'
import { GameSessionHeader } from '../components/game/GameSessionHeader'
import { difficultyConfig } from '../constants/difficulty'
import { useAICoach } from '../hooks/useAICoach'
import { useAuth } from '../hooks/useAuth'
import { useOnlineRoom } from '../hooks/useOnlineRoom'
import { buildAuthRedirectPath } from '../lib/authRedirect'
import { cn } from '../lib/utils'

function formatOnlineMode(mode: 'collaborative' | 'race') {
  return mode === 'collaborative' ? 'Collaborative' : 'Race'
}

function formatTime(timeSeconds: number) {
  const minutes = Math.floor(timeSeconds / 60)
  const seconds = timeSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

function formatJoinedTime(timestamp: string | null | undefined) {
  if (!timestamp) {
    return null
  }

  const date = new Date(timestamp)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function OnlineRoomPage() {
  const { roomCode } = useParams<{ roomCode: string }>()
  const location = useLocation()
  const { isAuthenticated, loading: authLoading } = useAuth()
  const returnTo = location.pathname + location.search
  const {
    room,
    players,
    standings,
    winnerPlayer,
    currentPlayer,
    loading,
    membershipLoading,
    error,
    canEdit,
    board,
    solution,
    fixedCells,
    notes,
    notesMode,
    selectedCell,
    selectedValue,
    selectedNotes,
    mistakes,
    hintsUsed,
    completed,
    checkResult,
    invalidCellKeys,
    formattedTime,
    refetch,
    selectCell,
    clearSelection,
    setCellValue,
    clearCell,
    toggleNotesMode,
    revealHint,
    checkSolution,
    resetBoard,
  } = useOnlineRoom(roomCode, { enabled: !authLoading && isAuthenticated })
  const coach = useAICoach({
    board,
    solution,
    fixedCells,
    selectedCell,
    selectedValue,
  })
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null)
  const selectedCellFixed = selectedCell
    ? fixedCells[selectedCell.row][selectedCell.col]
    : false

  const roomDescription = useMemo(() => {
    if (!room) {
      return ''
    }

    return room.mode === 'collaborative'
      ? 'You are solving one shared board together.'
      : 'Everyone solves the same puzzle. Finish fast with fewer mistakes.'
  }, [room])

  async function handleCopyInviteLink() {
    try {
      const inviteLink = `${window.location.origin}/online/${roomCode}`
      await navigator.clipboard.writeText(inviteLink)
      setCopyFeedback('Invite link copied.')
      window.setTimeout(() => setCopyFeedback(null), 2500)
    } catch {
      setCopyFeedback('Could not copy the invite link from this browser.')
    }
  }

  if (!roomCode) {
    return (
      <section className="rounded-[2rem] border border-rose-200 bg-rose-100/85 p-8 text-center dark:border-rose-300/20 dark:bg-rose-400/10">
        <h1 className="font-display text-3xl font-semibold text-slate-950 dark:text-white">
          Room code missing
        </h1>
        <p className="mt-3 text-sm leading-7 text-rose-950 dark:text-rose-100">
          This invite link is incomplete. Return to the Online page and try again.
        </p>
      </section>
    )
  }

  if (authLoading) {
    return (
      <section className="rounded-[2rem] border border-slate-200/90 bg-white/82 p-8 text-center shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-sm dark:border-white/10 dark:bg-white/6 dark:shadow-[0_18px_60px_rgba(2,8,24,0.35)]">
        <h1 className="font-display text-3xl font-semibold text-slate-950 dark:text-white">
          Checking your session...
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
          Making sure your Sudoku Focus account is ready before joining the room.
        </p>
      </section>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={buildAuthRedirectPath(returnTo)} replace />
  }

  if (!room && (loading || !error)) {
    return (
      <section className="rounded-[2rem] border border-slate-200/90 bg-white/82 p-8 text-center shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-sm dark:border-white/10 dark:bg-white/6 dark:shadow-[0_18px_60px_rgba(2,8,24,0.35)]">
        <h1 className="font-display text-3xl font-semibold text-slate-950 dark:text-white">
          Loading online room...
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
          Pulling the latest room board and player list from Supabase Realtime.
        </p>
      </section>
    )
  }

  if (!room) {
    const roomErrorMessage = !error || error === 'Room not found. Check the code and try again.'
      ? 'Room not found or expired.'
      : error

    return (
      <section className="rounded-[2rem] border border-rose-200 bg-rose-100/85 p-8 text-center dark:border-rose-300/20 dark:bg-rose-400/10">
        <h1 className="font-display text-3xl font-semibold text-slate-950 dark:text-white">
          Room not found or expired.
        </h1>
        <p className="mt-3 text-sm leading-7 text-rose-950 dark:text-rose-100">
          {roomErrorMessage}
        </p>
      </section>
    )
  }

  const difficultyMeta = difficultyConfig[room.difficulty]
  const editingLocked = !canEdit
  const numberPadCompleted = editingLocked || completed

  return (
    <div className="space-y-6">
      <GameSessionHeader
        difficulty={room.difficulty}
        difficultyLabel={difficultyMeta.label}
        difficultyDescription={difficultyMeta.description}
        cellsToRemove={difficultyMeta.cellsToRemove}
        mistakeLimit={difficultyMeta.mistakeLimit}
        formattedTime={formattedTime}
        mistakes={mistakes}
        hintsUsed={hintsUsed}
        notesMode={notesMode}
        isPaused={false}
        eyebrow="Online"
        title={room.mode === 'collaborative' ? 'Collaborative room' : 'Race room'}
        description={roomDescription}
      />

      <section className="rounded-[2rem] border border-slate-200/90 bg-white/82 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-sm dark:border-white/10 dark:bg-white/6 dark:shadow-[0_18px_60px_rgba(2,8,24,0.35)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Room details</p>
            <h1 className="mt-3 font-display text-3xl font-semibold text-slate-950 dark:text-white">
              Room {room.roomCode}
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              {room.mode === 'collaborative'
                ? 'You are solving one shared board together.'
                : 'Everyone solves the same puzzle separately. Fastest accurate solve wins.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleCopyInviteLink()}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-cyan-300/35 hover:bg-cyan-50/70 dark:border-white/10 dark:bg-slate-950/55 dark:text-white dark:hover:bg-slate-900/80"
            >
              <Copy className="h-4 w-4" />
              Copy invite link
            </button>
            <button
              type="button"
              onClick={() => void refetch()}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-cyan-300/35 hover:bg-cyan-50/70 dark:border-white/10 dark:bg-slate-950/55 dark:text-white dark:hover:bg-slate-900/80"
            >
              Refresh room
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 dark:border-white/10 dark:bg-white/8 dark:text-slate-200">
            {formatOnlineMode(room.mode)}
          </span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 dark:border-white/10 dark:bg-white/8 dark:text-slate-200">
            {difficultyMeta.label}
          </span>
          <span className={cn(
            'rounded-full border px-3 py-1 text-xs font-medium',
            room.status === 'completed'
              ? 'border-emerald-200 bg-emerald-100/85 text-emerald-950 dark:border-emerald-300/20 dark:bg-emerald-400/10 dark:text-emerald-100'
              : 'border-cyan-200 bg-cyan-100/85 text-cyan-950 dark:border-cyan-300/20 dark:bg-cyan-400/10 dark:text-cyan-100',
          )}
          >
            {room.status === 'completed' ? 'Completed' : 'Active'}
          </span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 dark:border-white/10 dark:bg-white/8 dark:text-slate-200">
            {players.length} players
          </span>
          {winnerPlayer ? (
            <span className="rounded-full border border-amber-200 bg-amber-100/85 px-3 py-1 text-xs font-medium text-amber-950 dark:border-amber-300/20 dark:bg-amber-400/10 dark:text-amber-100">
              Winner: {winnerPlayer.displayName}
            </span>
          ) : null}
        </div>

        {copyFeedback ? (
          <div className="mt-4 rounded-[1.4rem] border border-cyan-200 bg-cyan-100/85 px-4 py-3 text-sm text-cyan-950 dark:border-cyan-300/20 dark:bg-cyan-400/10 dark:text-cyan-100">
            {copyFeedback}
          </div>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-[1.4rem] border border-rose-200 bg-rose-100/85 px-4 py-3 text-sm text-rose-950 dark:border-rose-300/20 dark:bg-rose-400/10 dark:text-rose-100">
            {error}
          </div>
        ) : null}
      </section>

      {!isAuthenticated ? (
        <section className="rounded-[2rem] border border-amber-200 bg-amber-100/85 p-5 dark:border-amber-300/20 dark:bg-amber-400/10">
          <p className="text-sm leading-7 text-amber-950 dark:text-amber-50">
            Sign in to join this room and make live moves.
            <Link to="/auth" className="ml-2 font-semibold underline underline-offset-4">
              Go to login
            </Link>
          </p>
        </section>
      ) : membershipLoading && !currentPlayer ? (
        <section className="rounded-[2rem] border border-cyan-200 bg-cyan-100/85 p-5 dark:border-cyan-300/20 dark:bg-cyan-400/10">
          <p className="text-sm leading-7 text-cyan-950 dark:text-cyan-100">
            Joining the room and syncing your board...
          </p>
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200/90 bg-white/82 p-4 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-sm dark:border-white/10 dark:bg-white/6 dark:shadow-[0_18px_60px_rgba(2,8,24,0.35)] sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-cyan-700 dark:text-cyan-200/75">
                  {room.mode === 'collaborative' ? 'Shared board' : 'Your race board'}
                </p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  {room.mode === 'collaborative'
                    ? 'Every move updates the same room board for everyone.'
                    : 'This board is private to you while standings update live for the room.'}
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
                isPaused={false}
                onSelectCell={selectCell}
              />
            </div>
          </div>

          {room.mode === 'race' ? (
            <section className="rounded-[2rem] border border-slate-200/90 bg-white/82 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-sm dark:border-white/10 dark:bg-white/6 dark:shadow-[0_18px_60px_rgba(2,8,24,0.35)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Standings</p>
                  <h2 className="mt-2 font-display text-3xl font-semibold text-slate-950 dark:text-white">
                    Live race board
                  </h2>
                </div>
                {winnerPlayer ? (
                  <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-100/85 px-4 py-2 text-sm font-semibold text-amber-950 dark:border-amber-300/20 dark:bg-amber-400/10 dark:text-amber-100">
                    <Crown className="h-4 w-4" />
                    {winnerPlayer.displayName} leads
                  </div>
                ) : null}
              </div>

              <div className="mt-5 space-y-3">
                {standings.map((player, index) => (
                  <div
                    key={player.id}
                    className="rounded-[1.5rem] border border-slate-200 bg-slate-50/90 p-4 dark:border-white/10 dark:bg-slate-950/45"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-950 dark:text-white">
                          #{index + 1} {player.displayName}
                        </p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{player.city}</p>
                      </div>
                      <span className={cn(
                        'rounded-full px-3 py-1 text-xs font-medium',
                        player.completed
                          ? 'bg-emerald-100/85 text-emerald-950 dark:bg-emerald-400/10 dark:text-emerald-100'
                          : 'bg-slate-200 text-slate-700 dark:bg-white/8 dark:text-slate-300',
                      )}
                      >
                        {player.completed ? 'Finished' : 'Solving'}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                      <div>
                        <p className="text-slate-500 dark:text-slate-400">Score</p>
                        <p className="mt-1 font-semibold text-slate-950 dark:text-white">{player.score}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 dark:text-slate-400">Time</p>
                        <p className="mt-1 font-semibold text-slate-950 dark:text-white">{formatTime(player.timeSeconds)}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 dark:text-slate-400">Mistakes</p>
                        <p className="mt-1 font-semibold text-slate-950 dark:text-white">{player.mistakes}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 dark:text-slate-400">Hints</p>
                        <p className="mt-1 font-semibold text-slate-950 dark:text-white">{player.hintsUsed}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : room.status === 'completed' ? (
            <section className="rounded-[2rem] border border-emerald-200 bg-emerald-100/85 p-6 text-center dark:border-emerald-300/20 dark:bg-emerald-400/10">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/70 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-100">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h2 className="mt-4 font-display text-3xl font-semibold text-slate-950 dark:text-white">
                Room solved!
              </h2>
              <p className="mt-3 text-sm leading-7 text-emerald-950 dark:text-emerald-50">
                Everyone in this collaborative room is now looking at the completed shared board.
              </p>
            </section>
          ) : null}
        </div>

        <div className="space-y-6">
          <section className="rounded-[2rem] border border-slate-200/90 bg-white/82 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-sm dark:border-white/10 dark:bg-white/6 dark:shadow-[0_18px_60px_rgba(2,8,24,0.35)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-cyan-700 dark:text-cyan-200/75">Room players</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  Live roster for this room.
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-cyan-800 dark:border-white/10 dark:bg-slate-950/55 dark:text-cyan-100">
                <Users2 className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {players.map((player) => {
                const joinedTime = formatJoinedTime(player.createdAt ?? player.joinedAt)

                return (
                  <div
                    key={player.id}
                    className="rounded-[1.4rem] border border-slate-200 bg-slate-50/90 px-4 py-3 dark:border-white/10 dark:bg-slate-950/45"
                  >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950 dark:text-white">
                        {player.displayName}
                        {player.userId === currentPlayer?.userId ? ' (You)' : ''}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{player.city}</p>
                      {joinedTime ? (
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          Joined {joinedTime}
                        </p>
                      ) : null}
                    </div>
                    <span className={cn(
                      'rounded-full px-3 py-1 text-xs font-medium',
                      player.completed
                        ? 'bg-emerald-100/85 text-emerald-950 dark:bg-emerald-400/10 dark:text-emerald-100'
                        : 'bg-slate-200 text-slate-700 dark:bg-white/8 dark:text-slate-300',
                    )}
                    >
                      {player.completed ? 'Done' : 'Live'}
                    </span>
                  </div>
                  </div>
                )
              })}
            </div>
          </section>

          <NumberPad
            selectedCell={selectedCell}
            selectedValue={selectedValue}
            selectedNotes={selectedNotes}
            isSelectedCellFixed={selectedCellFixed}
            completed={numberPadCompleted}
            isPaused={false}
            notesMode={notesMode}
            onValueSelect={setCellValue}
            onClear={clearCell}
          />

          <section className="rounded-[2rem] border border-slate-200/90 bg-white/82 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-sm dark:border-white/10 dark:bg-white/6 dark:shadow-[0_18px_60px_rgba(2,8,24,0.35)]">
            <div className="grid gap-3">
              <button
                type="button"
                onClick={toggleNotesMode}
                disabled={!canEdit}
                className={cn(
                  'rounded-2xl border px-4 py-3 text-sm font-semibold transition',
                  canEdit
                    ? notesMode
                      ? 'border-fuchsia-200 bg-fuchsia-100/85 text-fuchsia-950 dark:border-fuchsia-300/35 dark:bg-fuchsia-400/14 dark:text-fuchsia-100'
                      : 'border-slate-200 bg-white text-slate-900 hover:border-fuchsia-300/30 hover:bg-fuchsia-50/70 dark:border-white/10 dark:bg-slate-950/55 dark:text-white dark:hover:bg-slate-900/80'
                    : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:border-white/8 dark:bg-slate-950/40 dark:text-slate-500',
                )}
              >
                {notesMode ? 'Notes Mode Active' : 'Enable Notes Mode'}
              </button>

              <button
                type="button"
                onClick={() => void revealHint()}
                disabled={!canEdit}
                className={cn(
                  'rounded-2xl border px-4 py-3 text-sm font-semibold transition',
                  canEdit
                    ? 'border-emerald-200 bg-emerald-100/85 text-emerald-950 hover:border-emerald-300 hover:bg-emerald-100 dark:border-emerald-300/25 dark:bg-emerald-400/10 dark:text-emerald-100 dark:hover:bg-emerald-400/16'
                    : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:border-white/8 dark:bg-slate-950/40 dark:text-slate-500',
                )}
              >
                Reveal Hint
              </button>

              <button
                type="button"
                onClick={checkSolution}
                disabled={!canEdit}
                className={cn(
                  'rounded-2xl px-4 py-3 text-sm font-semibold transition',
                  canEdit
                    ? 'bg-slate-950 text-[color:#f8fbff] hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-cyan-50'
                    : 'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400 dark:border-white/8 dark:bg-slate-950/40 dark:text-slate-500',
                )}
              >
                Check Solution
              </button>

              <button
                type="button"
                onClick={clearCell}
                disabled={!canEdit}
                className={cn(
                  'rounded-2xl border px-4 py-3 text-sm font-semibold transition',
                  canEdit
                    ? 'border-rose-200 bg-rose-100/85 text-rose-950 hover:border-rose-300 hover:bg-rose-100 dark:border-rose-400/25 dark:bg-rose-400/10 dark:text-rose-100 dark:hover:bg-rose-400/16'
                    : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:border-white/8 dark:bg-slate-950/40 dark:text-slate-500',
                )}
              >
                Clear Value
              </button>

              {room.mode === 'race' ? (
                <button
                  type="button"
                  onClick={() => void resetBoard()}
                  disabled={!canEdit}
                  className={cn(
                    'rounded-2xl border px-4 py-3 text-sm font-semibold transition',
                    canEdit
                      ? 'border-slate-200 bg-white text-slate-900 hover:border-cyan-300/35 hover:bg-cyan-50/70 dark:border-white/10 dark:bg-slate-950/55 dark:text-white dark:hover:bg-slate-900/80'
                      : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:border-white/8 dark:bg-slate-950/40 dark:text-slate-500',
                  )}
                >
                  Reset My Board
                </button>
              ) : null}
            </div>

            <div className="mt-5">
              {!isAuthenticated ? (
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Sign in to join the room and make live moves.
                </p>
              ) : !currentPlayer ? (
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Joining the room so your board can sync...
                </p>
              ) : (
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {room.mode === 'collaborative'
                    ? 'Every correct shared move helps the whole room finish faster.'
                    : 'Your personal board and standings update live while everyone else races on the same puzzle.'}
                </p>
              )}
            </div>

            {checkResult ? (
              <div className={cn(
                'mt-5 rounded-2xl border px-4 py-3 text-sm font-medium',
                checkResult.status === 'solved'
                  ? 'border-emerald-200 bg-emerald-100/85 text-emerald-950 dark:border-emerald-300/25 dark:bg-emerald-400/10 dark:text-emerald-100'
                  : checkResult.status === 'incorrect'
                    ? 'border-rose-200 bg-rose-100/85 text-rose-950 dark:border-rose-300/25 dark:bg-rose-400/10 dark:text-rose-100'
                    : 'border-amber-200 bg-amber-100/85 text-amber-950 dark:border-amber-300/25 dark:bg-amber-400/10 dark:text-amber-50',
              )}
              >
                {checkResult.message}
              </div>
            ) : null}
          </section>

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
  )
}
