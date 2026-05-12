import { Link } from 'react-router-dom'
import { TELEGRAM_COMMUNITY_URL } from '../../constants/community'

export function Footer() {
  return (
    <footer className="border-t border-slate-200/90 bg-white/72 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/60">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="font-display text-lg font-semibold tracking-tight text-slate-950 dark:text-white">
            Sudoku Focus
          </p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Focus training, coaching, and friendly competition in one place.
          </p>
        </div>

        <nav className="flex flex-wrap items-center gap-3 text-sm font-medium">
          <Link
            to="/game"
            className="rounded-full px-3 py-2 text-slate-700 transition hover:bg-slate-950/6 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/8 dark:hover:text-white"
          >
            Live demo
          </Link>
          <a
            href={TELEGRAM_COMMUNITY_URL}
            target="_blank"
            rel="noreferrer"
            className="rounded-full px-3 py-2 text-slate-700 transition hover:bg-slate-950/6 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/8 dark:hover:text-white"
          >
            Community
          </a>
          <Link
            to="/pro"
            className="rounded-full px-3 py-2 text-slate-700 transition hover:bg-slate-950/6 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/8 dark:hover:text-white"
          >
            Pro
          </Link>
          <Link
            to="/leaderboard"
            className="rounded-full px-3 py-2 text-slate-700 transition hover:bg-slate-950/6 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/8 dark:hover:text-white"
          >
            Leaderboard
          </Link>
        </nav>
      </div>
    </footer>
  )
}
