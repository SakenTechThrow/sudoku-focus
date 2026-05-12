import { useEffect } from 'react'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { BoardPreview } from '../components/board/BoardPreview'
import { FeatureCard } from '../components/coach/FeatureCard'
import { LeaderboardPreview } from '../components/leaderboard/LeaderboardPreview'
import { ProgressSnapshot } from '../components/profile/ProgressSnapshot'
import { homeFeatures } from '../constants/site'
import { isOnboardingCompleted } from '../lib/onboarding'

export function HomePage() {
  const navigate = useNavigate()

  useEffect(() => {
    if (isOnboardingCompleted()) {
      return
    }

    navigate('/onboarding', { replace: true })
  }, [navigate])

  return (
    <div className="space-y-8 lg:space-y-10">
      <section className="relative overflow-hidden rounded-[2rem] border border-slate-900/10 bg-white/82 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-sm dark:border-white/10 dark:bg-white/6 dark:shadow-[0_24px_80px_rgba(2,8,24,0.45)] sm:p-8 lg:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(61,194,255,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,191,71,0.12),transparent_24%)]" />
        <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/12 px-4 py-2 text-sm font-medium text-cyan-800 dark:border-cyan-300/20 dark:bg-cyan-400/8 dark:text-cyan-100">
              <Sparkles className="h-4 w-4" />
              Built for students, makers, and overloaded calendars
            </div>
            <h1 className="mt-6 max-w-3xl font-display text-5xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-6xl">
              Sudoku Focus
            </h1>
            <p className="mt-4 text-2xl font-medium text-slate-700 dark:text-slate-100">
              Train your brain in 5 minutes a day
            </p>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">
              A modern daily brain-training platform that turns Sudoku into a reliable focus
              ritual, complete with coaching, progress insight, and social motivation.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/game"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-[color:#f8fbff] shadow-[0_12px_30px_rgba(15,23,42,0.18)] transition hover:scale-[1.01] hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 dark:bg-white dark:text-slate-950 dark:shadow-[0_12px_30px_rgba(255,255,255,0.10)] dark:hover:bg-cyan-50"
              >
                Start Playing
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/daily"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/90 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-cyan-300/35 hover:bg-cyan-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 dark:border-white/12 dark:bg-white/6 dark:text-white dark:hover:bg-white/10"
              >
                Daily Challenge
              </Link>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-900/10 bg-slate-950/6 p-4 dark:border-white/10 dark:bg-slate-950/45">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Average session</p>
                <p className="mt-2 font-display text-3xl font-semibold text-slate-950 dark:text-white">5 min</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Designed to fit between classes and meetings.</p>
              </div>
              <div className="rounded-2xl border border-slate-900/10 bg-slate-950/6 p-4 dark:border-white/10 dark:bg-slate-950/45">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Retention loop</p>
                <p className="mt-2 font-display text-3xl font-semibold text-slate-950 dark:text-white">Daily</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Fresh challenges encourage momentum, not burnout.</p>
              </div>
              <div className="rounded-2xl border border-slate-900/10 bg-slate-950/6 p-4 dark:border-white/10 dark:bg-slate-950/45">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Prototype angle</p>
                <p className="mt-2 font-display text-3xl font-semibold text-slate-950 dark:text-white">Startup-ready</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Structured to grow into auth, analytics, and Supabase.</p>
              </div>
            </div>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-100/70 px-4 py-2 text-sm font-medium text-amber-900 dark:border-amber-300/20 dark:bg-amber-400/10 dark:text-amber-100">
              Unlock badges as you train daily.
            </div>
          </div>

          <BoardPreview />
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-900/10 bg-white/72 p-6 dark:border-white/10 dark:bg-white/4 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-700 dark:text-cyan-200/75">Platform pillars</p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
              Product foundation with room to grow
            </h2>
          </div>
          <p className="max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
            The first release already frames Sudoku Focus as a habit-building wellness product,
            not a one-screen puzzle app.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {homeFeatures.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <LeaderboardPreview />
        <ProgressSnapshot />
      </section>
    </div>
  )
}
