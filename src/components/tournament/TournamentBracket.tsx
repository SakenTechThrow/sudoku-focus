import { Crown, Trophy } from 'lucide-react'
import { getTournamentRoundLabel } from '../../lib/tournamentBracket'
import { cn } from '../../lib/utils'
import type {
  TournamentMatch,
  TournamentPlayer,
  TournamentRoundKey,
} from '../../types/tournament'

type TournamentBracketProps = {
  rounds: TournamentRoundKey[]
  matches: TournamentMatch[]
  players: TournamentPlayer[]
  currentRound?: TournamentRoundKey | null
  championPlayer?: TournamentPlayer | null
}

function getPlayerName(players: TournamentPlayer[], playerId: string | null) {
  if (!playerId) {
    return 'Waiting'
  }

  return players.find((player) => player.id === playerId)?.displayName ?? 'Unknown player'
}

export function TournamentBracket({
  rounds,
  matches,
  players,
  currentRound = null,
  championPlayer = null,
}: TournamentBracketProps) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200/90 bg-white/82 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-sm dark:border-white/10 dark:bg-white/6 dark:shadow-[0_18px_60px_rgba(2,8,24,0.35)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-700 dark:text-cyan-200/75">
            Tournament bracket
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold text-slate-950 dark:text-white">
            Survive the bracket
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Win your match to advance.
          </p>
        </div>

        {championPlayer ? (
          <div className="rounded-[1.4rem] border border-amber-200 bg-amber-100/80 px-4 py-3 text-sm text-amber-950 dark:border-amber-300/20 dark:bg-amber-400/10 dark:text-amber-50">
            <div className="flex items-center gap-2 font-semibold">
              <Trophy className="h-4 w-4" />
              Champion crowned
            </div>
            <p className="mt-1">{championPlayer.displayName}</p>
          </div>
        ) : null}
      </div>

      <div className="mt-6 overflow-x-auto pb-2">
        <div className="flex min-w-max gap-4">
          {rounds.map((roundKey) => {
            const roundMatches = matches
              .filter((match) => match.roundKey === roundKey)
              .sort((left, right) => left.matchNumber - right.matchNumber)

            return (
              <div key={roundKey} className="w-72 shrink-0 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-display text-lg font-semibold text-slate-950 dark:text-white">
                      {getTournamentRoundLabel(roundKey)}
                    </p>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      {roundKey === currentRound ? 'Live round' : 'Bracket round'}
                    </p>
                  </div>
                  {roundKey === currentRound ? (
                    <span className="rounded-full border border-cyan-300/30 bg-cyan-100/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-950 dark:border-cyan-300/25 dark:bg-cyan-400/10 dark:text-cyan-100">
                      Active
                    </span>
                  ) : null}
                </div>

                {roundMatches.length > 0 ? roundMatches.map((match) => {
                  const player1Name = getPlayerName(players, match.player1Id)
                  const player2Name = getPlayerName(players, match.player2Id)

                  return (
                    <article
                      key={match.id}
                      className={cn(
                        'rounded-[1.5rem] border p-4 transition',
                        match.status === 'completed'
                          ? 'border-emerald-200 bg-emerald-50/90 dark:border-emerald-300/18 dark:bg-emerald-400/8'
                          : match.status === 'active'
                            ? 'border-cyan-200 bg-cyan-50/85 dark:border-cyan-300/18 dark:bg-cyan-400/8'
                            : 'border-slate-200 bg-slate-50/90 dark:border-white/10 dark:bg-slate-950/45',
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                          Match {match.matchNumber}
                        </p>
                        <span className={cn(
                          'rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]',
                          match.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-400/12 dark:text-emerald-100'
                            : match.status === 'active'
                              ? 'bg-cyan-100 text-cyan-900 dark:bg-cyan-400/12 dark:text-cyan-100'
                              : 'bg-white text-slate-700 dark:bg-white/8 dark:text-slate-200',
                        )}
                        >
                          {match.status}
                        </span>
                      </div>

                      <div className="mt-4 space-y-2.5">
                        {[{
                          id: match.player1Id,
                          name: player1Name,
                        }, {
                          id: match.player2Id,
                          name: player2Name,
                        }].map((entry) => (
                          <div
                            key={`${match.id}-${entry.id ?? 'waiting'}`}
                            className={cn(
                              'flex items-center justify-between gap-3 rounded-2xl border px-3 py-2.5',
                              entry.id && match.winnerPlayerId === entry.id
                                ? 'border-emerald-200 bg-emerald-100/90 text-emerald-950 dark:border-emerald-300/20 dark:bg-emerald-400/10 dark:text-emerald-50'
                                : 'border-slate-200 bg-white/85 text-slate-800 dark:border-white/10 dark:bg-slate-950/55 dark:text-slate-200',
                            )}
                          >
                            <span className="truncate text-sm font-medium">{entry.name}</span>
                            {entry.id && match.winnerPlayerId === entry.id ? (
                              <Crown className="h-4 w-4 shrink-0" />
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </article>
                  )
                }) : (
                  <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50/90 p-4 text-sm text-slate-500 dark:border-white/10 dark:bg-slate-950/45 dark:text-slate-400">
                    Matches appear here once this round unlocks.
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
