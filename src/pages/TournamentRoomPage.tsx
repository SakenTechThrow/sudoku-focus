import { useMemo, useState } from 'react'
import { Copy, Crown, RefreshCw, Swords, Trophy, Users } from 'lucide-react'
import { Navigate, useLocation, useParams } from 'react-router-dom'
import { CommunityCard } from '../components/community/CommunityCard'
import { TournamentBracket } from '../components/tournament/TournamentBracket'
import { TournamentMatchSession } from '../components/tournament/TournamentMatchSession'
import { Spinner } from '../components/ui/Spinner'
import { getTournamentRoundLabel } from '../lib/tournamentBracket'
import { useAuth } from '../hooks/useAuth'
import { useTournament } from '../hooks/useTournament'
import { buildAuthRedirectPath } from '../lib/authRedirect'
import { cn } from '../lib/utils'

export function TournamentRoomPage() {
  const { tournamentCode } = useParams<{ tournamentCode: string }>()
  const location = useLocation()
  const { isAuthenticated, loading: authLoading } = useAuth()
  const returnTo = location.pathname + location.search
  const {
    tournament,
    players,
    matches,
    currentPlayer,
    currentMatch,
    currentMatchResult,
    opponentPlayer,
    championPlayer,
    bracketRounds,
    loading,
    startingTournament,
    submittingResult,
    membershipLoading,
    error,
    isHost,
    canStartTournament,
    isWaitingForOpponent,
    isWaitingForNextRound,
    isEliminated,
    isChampion,
    startTournament,
    submitMatchResult,
    refetch,
  } = useTournament(tournamentCode, { enabled: !authLoading && isAuthenticated })
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null)
  const [startFeedback, setStartFeedback] = useState<string | null>(null)

  const roundLabel = tournament ? getTournamentRoundLabel(tournament.currentRound) : ''
  const activeMatchRoundLabel = currentMatch ? getTournamentRoundLabel(currentMatch.roundKey) : roundLabel
  const roomStateLabel = useMemo(() => {
    if (!tournament) {
      return 'Loading'
    }

    if (tournament.status === 'waiting') {
      return 'Waiting lobby'
    }

    if (isChampion) {
      return 'Champion'
    }

    if (isEliminated) {
      return 'Eliminated'
    }

    if (currentMatch) {
      return 'Your match'
    }

    return 'Bracket live'
  }, [currentMatch, isChampion, isEliminated, tournament])

  async function handleCopyInviteLink() {
    try {
      const inviteLink = `${window.location.origin}/tournaments/${tournamentCode}`
      await navigator.clipboard.writeText(inviteLink)
      setCopyFeedback('Invite link copied.')
      window.setTimeout(() => setCopyFeedback(null), 2500)
    } catch {
      setCopyFeedback('Could not copy the invite link from this browser.')
    }
  }

  async function handleStartTournament() {
    setStartFeedback(null)
    const result = await startTournament()

    if (!result.ok) {
      setStartFeedback(result.message)
    }
  }

  if (!tournamentCode) {
    return (
      <section className="rounded-[2rem] border border-rose-200 bg-rose-100/85 p-8 text-center dark:border-rose-300/20 dark:bg-rose-400/10">
        <h1 className="font-display text-3xl font-semibold text-slate-950 dark:text-white">
          Tournament code missing
        </h1>
        <p className="mt-3 text-sm leading-7 text-rose-950 dark:text-rose-100">
          This invite link is incomplete. Return to Tournaments and try again.
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
          Getting your tournament access ready.
        </p>
      </section>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={buildAuthRedirectPath(returnTo, '/tournaments')} replace />
  }

  if (!tournament && (loading || membershipLoading || !error)) {
    return (
      <section className="rounded-[2rem] border border-slate-200/90 bg-white/82 p-8 text-center shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-sm dark:border-white/10 dark:bg-white/6 dark:shadow-[0_18px_60px_rgba(2,8,24,0.35)]">
        <h1 className="font-display text-3xl font-semibold text-slate-950 dark:text-white">
          Loading tournament...
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
          Pulling the bracket, players, and current matches from Supabase.
        </p>
      </section>
    )
  }

  if (!tournament) {
    return (
      <section className="rounded-[2rem] border border-rose-200 bg-rose-100/85 p-8 text-center dark:border-rose-300/20 dark:bg-rose-400/10">
        <h1 className="font-display text-3xl font-semibold text-slate-950 dark:text-white">
          Tournament not found
        </h1>
        <p className="mt-3 text-sm leading-7 text-rose-950 dark:text-rose-100">
          {error ?? 'This bracket could not be loaded.'}
        </p>
      </section>
    )
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200/90 bg-white/82 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-sm dark:border-white/10 dark:bg-white/6 dark:shadow-[0_18px_60px_rgba(2,8,24,0.35)] sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-700 dark:text-cyan-200/75">
              Tournament room
            </p>
            <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-5xl">
              {tournament.title}
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
              {tournament.status === 'waiting'
                ? 'Invite players. Start when ready.'
                : 'Fast focus wins. Advance round by round.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-white/10 dark:bg-white/8 dark:text-slate-200">
              Code {tournament.tournamentCode}
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-white/10 dark:bg-white/8 dark:text-slate-200">
              {tournament.difficulty}
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-white/10 dark:bg-white/8 dark:text-slate-200">
              {players.length}/{tournament.maxPlayers} players
            </span>
            <span className="rounded-full border border-cyan-300/30 bg-cyan-100/85 px-3 py-1.5 text-xs font-medium text-cyan-950 dark:border-cyan-300/20 dark:bg-cyan-400/10 dark:text-cyan-100">
              {roomStateLabel}
            </span>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/90 p-4 dark:border-white/10 dark:bg-slate-950/45">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Round</p>
              <p className="mt-2 font-display text-2xl font-semibold text-slate-950 dark:text-white">
                {roundLabel}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/90 p-4 dark:border-white/10 dark:bg-slate-950/45">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Status</p>
              <p className="mt-2 font-display text-2xl font-semibold capitalize text-slate-950 dark:text-white">
                {tournament.status}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/90 p-4 dark:border-white/10 dark:bg-slate-950/45">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Players</p>
              <p className="mt-2 font-display text-2xl font-semibold text-slate-950 dark:text-white">
                {players.length}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/90 p-4 dark:border-white/10 dark:bg-slate-950/45">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Champion</p>
              <p className="mt-2 font-display text-lg font-semibold text-slate-950 dark:text-white">
                {championPlayer?.displayName ?? 'Open'}
              </p>
            </div>
          </div>

          <div className="rounded-[1.7rem] border border-slate-200 bg-slate-50/90 p-5 dark:border-white/10 dark:bg-slate-950/45">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                  Invite
                </p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Share the bracket link.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleCopyInviteLink()}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition hover:border-cyan-300/35 hover:bg-cyan-50/70 dark:border-white/10 dark:bg-slate-950/55 dark:text-slate-200 dark:hover:bg-slate-900/80"
              >
                <Copy className="h-4 w-4" />
                Copy link
              </button>
            </div>

            {copyFeedback ? (
              <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-200">{copyFeedback}</p>
            ) : null}

            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition hover:border-cyan-300/35 hover:bg-cyan-50/70 dark:border-white/10 dark:bg-slate-950/55 dark:text-slate-200 dark:hover:bg-slate-900/80"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>
      </section>

      {tournament.status === 'waiting' ? (
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="rounded-[2rem] border border-slate-200/90 bg-white/82 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-sm dark:border-white/10 dark:bg-white/6 dark:shadow-[0_18px_60px_rgba(2,8,24,0.35)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                  Waiting lobby
                </p>
                <h2 className="mt-3 font-display text-3xl font-semibold text-slate-950 dark:text-white">
                  Players
                </h2>
              </div>
              {canStartTournament ? (
                <button
                  type="button"
                  onClick={() => void handleStartTournament()}
                  disabled={startingTournament}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-[color:#f8fbff] transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-white dark:text-slate-950 dark:hover:bg-cyan-50"
                >
                  {startingTournament ? <Spinner className="text-current" /> : <Swords className="h-4 w-4" />}
                  {startingTournament ? 'Starting...' : 'Start Tournament'}
                </button>
              ) : null}
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {players.map((player) => (
                <div
                  key={player.id}
                  className={cn(
                    'rounded-[1.5rem] border p-4',
                    currentPlayer?.id === player.id
                      ? 'border-cyan-300/40 bg-cyan-100/85 dark:border-cyan-300/20 dark:bg-cyan-400/10'
                      : 'border-slate-200 bg-slate-50/90 dark:border-white/10 dark:bg-slate-950/45',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950 dark:text-white">{player.displayName}</p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{player.city}</p>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-700 dark:border-white/10 dark:bg-white/8 dark:text-slate-200">
                      Seed {player.seed}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {startFeedback ? (
              <div className="mt-5 rounded-[1.4rem] border border-rose-200 bg-rose-100/85 px-4 py-3 text-sm text-rose-950 dark:border-rose-300/20 dark:bg-rose-400/10 dark:text-rose-100">
                {startFeedback}
              </div>
            ) : null}
          </div>

          <CommunityCard compact />
        </section>
      ) : null}

      {tournament.status !== 'waiting' ? (
        <section className="space-y-6">
          {currentMatch ? (
            <TournamentMatchSession
              key={currentMatch.id}
              tournament={tournament}
              match={currentMatch}
              roundLabel={activeMatchRoundLabel}
              opponentName={opponentPlayer?.displayName ?? 'Waiting for opponent'}
              existingResult={currentMatchResult}
              submittingResult={submittingResult}
              onSubmitResult={submitMatchResult}
            />
          ) : null}

          {!currentMatch && currentMatchResult ? (
            <section className="rounded-[1.9rem] border border-slate-200/90 bg-white/82 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-sm dark:border-white/10 dark:bg-white/6 dark:shadow-[0_18px_60px_rgba(2,8,24,0.35)]">
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-700 dark:text-cyan-200/75">
                Match submitted
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold text-slate-950 dark:text-white">
                Waiting on the bracket
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Your result is locked. We&apos;ll advance the bracket when the other match finishes.
              </p>
            </section>
          ) : null}

          {!currentMatch && isWaitingForNextRound ? (
            <section className="rounded-[1.9rem] border border-cyan-200 bg-cyan-100/85 p-6 dark:border-cyan-300/20 dark:bg-cyan-400/10">
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-900 dark:text-cyan-100">
                Advanced
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold text-slate-950 dark:text-white">
                You made it through
              </h2>
              <p className="mt-2 text-sm text-cyan-950 dark:text-cyan-50">
                Waiting for the next round to unlock.
              </p>
            </section>
          ) : null}

          {!currentMatch && isEliminated ? (
            <section className="rounded-[1.9rem] border border-rose-200 bg-rose-100/85 p-6 dark:border-rose-300/20 dark:bg-rose-400/10">
              <p className="text-xs uppercase tracking-[0.24em] text-rose-900 dark:text-rose-100">
                Eliminated
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold text-slate-950 dark:text-white">
                You were eliminated
              </h2>
              <p className="mt-2 text-sm text-rose-950 dark:text-rose-50">
                Watch the bracket continue and jump back into the next tournament.
              </p>
            </section>
          ) : null}

          {isChampion ? (
            <section className="overflow-hidden rounded-[2rem] border border-amber-200 bg-gradient-to-br from-amber-100/90 via-white to-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.12)] dark:border-amber-300/20 dark:from-amber-400/14 dark:via-white/6 dark:to-white/6 dark:shadow-[0_18px_60px_rgba(2,8,24,0.35)] sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-amber-900 dark:text-amber-100">
                    Champion crowned
                  </p>
                  <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight text-slate-950 dark:text-white">
                    You won the bracket
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                    Clean rounds. Strong finish. The trophy is yours.
                  </p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-200/90 text-amber-950 dark:bg-amber-400/16 dark:text-amber-100">
                  <Crown className="h-7 w-7" />
                </div>
              </div>
            </section>
          ) : null}

          {!currentPlayer && tournament.status === 'active' ? (
            <section className="rounded-[1.9rem] border border-slate-200/90 bg-white/82 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-sm dark:border-white/10 dark:bg-white/6 dark:shadow-[0_18px_60px_rgba(2,8,24,0.35)]">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                Spectator mode
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold text-slate-950 dark:text-white">
                Bracket is already live
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Tournament already started. You can still watch the bracket unfold.
              </p>
            </section>
          ) : null}

          <TournamentBracket
            rounds={bracketRounds}
            matches={matches}
            players={players}
            currentRound={tournament.currentRound}
            championPlayer={championPlayer}
          />

          <CommunityCard compact />
        </section>
      ) : null}
    </div>
  )
}
