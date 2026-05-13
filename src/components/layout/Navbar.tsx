import { Brain, LoaderCircle, LogOut, MoonStar, SunMedium } from 'lucide-react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { navItems } from '../../constants/site'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../hooks/useTheme'
import { buildAuthRedirectPath } from '../../lib/authRedirect'
import { cn } from '../../lib/utils'

export function Navbar() {
  const location = useLocation()
  const { isAuthenticated, loading, profile, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const ThemeIcon = theme === 'dark' ? SunMedium : MoonStar
  const authLink = buildAuthRedirectPath(
    `${location.pathname}${location.search}`,
    '/profile',
  )

  return (
    <header className="sticky top-0 z-30 border-b border-slate-900/10 bg-white/72 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center justify-between gap-4">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-[20px] border border-slate-900/10 bg-white/75 px-4 py-2 text-left transition hover:border-cyan-300/30 hover:bg-white/90 dark:border-white/10 dark:bg-white/5 dark:shadow-[0_12px_40px_rgba(3,7,18,0.28)] dark:hover:bg-white/8"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 via-cyan-300 to-sun-400 text-slate-950 shadow-[0_0_30px_rgba(61,194,255,0.35)]">
              <Brain className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-display text-lg font-semibold tracking-tight text-slate-950 dark:text-white">
                Sudoku Focus
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              className="inline-flex items-center gap-2 rounded-[20px] border border-slate-900/10 bg-white/75 min-h-[58px] px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-cyan-300/40 hover:bg-white/90 hover:text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <ThemeIcon className="h-4 w-4" />
            </button>

            {isAuthenticated ? (
              <Link
                to="/profile"
                className="inline-flex items-center rounded-full border border-slate-900/10 bg-white/75 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-cyan-300/30 hover:bg-white/90 hover:text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white xl:hidden"
              >
                {profile?.username ?? 'Profile'}
              </Link>
            ) : (
              <Link
                to={authLink}
                className="inline-flex items-center rounded-full border border-slate-900/10 bg-white/75 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-cyan-300/30 hover:bg-white/90 hover:text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white xl:hidden"
              >
                Login
              </Link>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <nav className="flex flex-wrap items-center gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'rounded-full px-4 py-2 text-sm font-medium transition',
                    isActive
                      ? 'bg-slate-950 text-[color:#f8fbff] shadow-[0_10px_30px_rgba(15,23,42,0.16)] dark:bg-white dark:text-slate-950 dark:shadow-[0_10px_30px_rgba(255,255,255,0.14)]'
                      : 'text-slate-700 hover:bg-slate-950/6 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/8 dark:hover:text-white',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}

            {isAuthenticated ? (
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  cn(
                    'rounded-full px-4 py-2 text-sm font-medium transition',
                    isActive
                      ? 'bg-slate-950 text-[color:#f8fbff] shadow-[0_10px_30px_rgba(15,23,42,0.16)] dark:bg-white dark:text-slate-950 dark:shadow-[0_10px_30px_rgba(255,255,255,0.14)]'
                      : 'text-slate-700 hover:bg-slate-950/6 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/8 dark:hover:text-white',
                  )
                }
              >
                Profile
              </NavLink>
            ) : null}

          </nav>

          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => void signOut()}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-400/12 px-4 py-2 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-400/18 disabled:cursor-not-allowed disabled:opacity-70 dark:text-cyan-100 dark:hover:bg-cyan-400/20"
            >
              {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
              Logout
            </button>
          ) : (
            <Link
              to={authLink}
              className="hidden rounded-full border border-cyan-300/30 bg-cyan-400/12 px-4 py-2 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-400/18 dark:text-cyan-100 dark:hover:bg-cyan-400/20 xl:inline-flex"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
