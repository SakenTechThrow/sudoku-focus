import { Crown, Medal, Trophy } from 'lucide-react'
import { difficultyConfig } from '../../constants/difficulty'
import type { LeaderboardEntry } from '../../types/leaderboard'

type LeaderboardTableProps = {
  entries: LeaderboardEntry[]
}

function formatTime(timeSeconds: number) {
  const minutes = Math.floor(timeSeconds / 60)
  const seconds = timeSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

function formatDate(value: string | null) {
  if (!value) {
    return 'Today'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Unknown date'
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date)
}

function getRankStyles(rank: number) {
  if (rank === 1) {
    return {
      badge: 'border-amber-300/25 bg-amber-300/15 text-amber-100',
      row: 'border-amber-300/15 bg-amber-300/6',
      icon: <Crown className="h-4 w-4" />,
    }
  }

  if (rank === 2) {
    return {
      badge: 'border-slate-300/20 bg-slate-200/10 text-slate-100',
      row: 'border-slate-300/10 bg-slate-200/5',
      icon: <Trophy className="h-4 w-4" />,
    }
  }

  if (rank === 3) {
    return {
      badge: 'border-orange-300/25 bg-orange-300/12 text-orange-100',
      row: 'border-orange-300/10 bg-orange-300/5',
      icon: <Medal className="h-4 w-4" />,
    }
  }

  return {
    badge: 'border-white/10 bg-white/6 text-slate-100',
    row: 'border-white/10 bg-slate-950/35',
    icon: null,
  }
}

export function LeaderboardTable({ entries }: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <div className="rounded-[2rem] border border-dashed border-white/12 bg-slate-950/35 p-8 text-center">
        <p className="font-display text-2xl font-semibold text-white">No results yet</p>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          No leaderboard entries yet. Complete a puzzle and save your result.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3 md:hidden">
        {entries.map((entry, index) => {
          const rank = index + 1
          const rankStyles = getRankStyles(rank)

          return (
            <article
              key={entry.id}
              className={`rounded-[1.6rem] border p-4 shadow-[0_18px_40px_rgba(2,8,24,0.24)] ${rankStyles.row}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border text-sm font-semibold ${rankStyles.badge}`}>
                    {rankStyles.icon ? rankStyles.icon : `#${rank}`}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{entry.username}</p>
                    <p className="text-sm text-slate-400">{entry.city}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Score</p>
                  <p className="text-lg font-semibold text-cyan-100">{entry.score}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl border border-white/10 bg-slate-950/45 px-3 py-3">
                  <p className="text-slate-400">Difficulty</p>
                  <p className="mt-1 font-medium text-white">{difficultyConfig[entry.difficulty].label}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/45 px-3 py-3">
                  <p className="text-slate-400">Time</p>
                  <p className="mt-1 font-medium text-white">{formatTime(entry.timeSeconds)}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/45 px-3 py-3">
                  <p className="text-slate-400">Mistakes</p>
                  <p className="mt-1 font-medium text-white">{entry.mistakes}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/45 px-3 py-3">
                  <p className="text-slate-400">Hints</p>
                  <p className="mt-1 font-medium text-white">{entry.hintsUsed}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
                <span>{formatDate(entry.challengeDate ?? entry.createdAt)}</span>
                <span>Rank #{rank}</span>
              </div>
            </article>
          )
        })}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full border-separate border-spacing-y-3">
          <thead>
            <tr className="text-left text-xs uppercase tracking-[0.24em] text-slate-400">
              <th className="px-4 py-2 font-medium">Rank</th>
              <th className="px-4 py-2 font-medium">Player</th>
              <th className="px-4 py-2 font-medium">City</th>
              <th className="px-4 py-2 font-medium">Difficulty</th>
              <th className="px-4 py-2 font-medium">Score</th>
              <th className="px-4 py-2 font-medium">Time</th>
              <th className="px-4 py-2 font-medium">Mistakes</th>
              <th className="px-4 py-2 font-medium">Hints</th>
              <th className="px-4 py-2 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, index) => {
              const rank = index + 1
              const rankStyles = getRankStyles(rank)

              return (
                <tr
                  key={entry.id}
                  className={`rounded-[1.6rem] border ${rankStyles.row}`}
                >
                  <td className="rounded-l-[1.6rem] border-y border-l px-4 py-4 align-middle text-white">
                    <div className={`inline-flex h-11 min-w-11 items-center justify-center rounded-2xl border px-3 text-sm font-semibold ${rankStyles.badge}`}>
                      {rankStyles.icon ? rankStyles.icon : `#${rank}`}
                    </div>
                  </td>
                  <td className="border-y px-4 py-4 align-middle">
                    <p className="font-semibold text-white">{entry.username}</p>
                  </td>
                  <td className="border-y px-4 py-4 align-middle text-slate-300">{entry.city}</td>
                  <td className="border-y px-4 py-4 align-middle text-slate-300">
                    {difficultyConfig[entry.difficulty].label}
                  </td>
                  <td className="border-y px-4 py-4 align-middle font-semibold text-cyan-100">{entry.score}</td>
                  <td className="border-y px-4 py-4 align-middle text-slate-300">{formatTime(entry.timeSeconds)}</td>
                  <td className="border-y px-4 py-4 align-middle text-slate-300">{entry.mistakes}</td>
                  <td className="border-y px-4 py-4 align-middle text-slate-300">{entry.hintsUsed}</td>
                  <td className="rounded-r-[1.6rem] border-y border-r px-4 py-4 align-middle text-slate-300">
                    {formatDate(entry.challengeDate ?? entry.createdAt)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
