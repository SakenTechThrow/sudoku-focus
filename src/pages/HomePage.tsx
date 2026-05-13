import { type ReactNode, useEffect } from 'react'
import {
  ArrowRight,
  BrainCircuit,
  CalendarDays,
  type LucideIcon,
  PlayCircle,
  Sparkles,
  Trophy,
  Users2,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { BoardPreview } from '../components/board/BoardPreview'
import { FeatureCard } from '../components/coach/FeatureCard'
import { CommunityCard } from '../components/community/CommunityCard'
import { LeaderboardPreview } from '../components/leaderboard/LeaderboardPreview'
import { ProgressSnapshot } from '../components/profile/ProgressSnapshot'
import { homeFeatures } from '../constants/site'
import { isOnboardingCompleted } from '../lib/onboarding'

const demoBoard = [
  [5, 3, 0, 0, 7, 0, 0, 0, 0],
  [6, 0, 0, 1, 9, 5, 0, 0, 0],
  [0, 9, 8, 0, 0, 0, 0, 6, 0],
  [8, 0, 0, 0, 6, 0, 0, 0, 3],
  [4, 0, 0, 8, 0, 3, 0, 0, 1],
  [7, 0, 0, 0, 2, 0, 0, 0, 6],
  [0, 6, 0, 0, 0, 0, 2, 8, 0],
  [0, 0, 0, 4, 1, 9, 0, 0, 5],
  [0, 0, 0, 0, 8, 0, 0, 7, 9],
] as const

type DemoPreviewCardProps = {
  icon: LucideIcon
  label: string
  title: string
  description: string
  ctaLabel: string
  to: string
  children: ReactNode
}

function DemoPreviewCard({
  icon: Icon,
  label,
  title,
  description,
  ctaLabel,
  to,
  children,
}: DemoPreviewCardProps) {
  return (
    <article className="rounded-[1.8rem] border border-slate-200/90 bg-white/86 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-sm dark:border-white/10 dark:bg-white/6 dark:shadow-[0_18px_60px_rgba(2,8,24,0.35)]">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-cyan-700 dark:border-white/10 dark:bg-slate-950/55 dark:text-cyan-100">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-700 dark:text-cyan-200/75">{label}</p>
          <h3 className="mt-1 font-display text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
            {title}
          </h3>
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
        {description}
      </p>

      <div className="mt-4 rounded-[1.5rem] border border-slate-200 bg-slate-50/90 p-4 dark:border-white/10 dark:bg-slate-950/45">
        {children}
      </div>

      <Link
        to={to}
        className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-cyan-300/35 hover:bg-cyan-50/70 dark:border-white/10 dark:bg-slate-950/55 dark:text-white dark:hover:bg-slate-900/80"
      >
        {ctaLabel}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </article>
  )
}

function MiniSudokuMock() {
  return (
    <div className="mx-auto grid w-full max-w-[260px] grid-cols-9 overflow-hidden rounded-[1.1rem] border-2 border-slate-300 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)] dark:border-white/20 dark:bg-slate-950/70">
      {demoBoard.flatMap((row, rowIndex) =>
        row.map((value, colIndex) => (
          <div
            key={`${rowIndex}-${colIndex}`}
            className={[
              'flex aspect-square items-center justify-center border border-slate-200 text-[11px] font-semibold text-slate-800 dark:border-white/10 dark:text-slate-100',
              value === 0 ? 'bg-cyan-50/70 text-cyan-700 dark:bg-cyan-400/8 dark:text-cyan-100' : 'bg-white dark:bg-slate-950/80',
              colIndex === 2 || colIndex === 5 ? 'border-r-2 border-r-slate-300 dark:border-r-white/25' : '',
              rowIndex === 2 || rowIndex === 5 ? 'border-b-2 border-b-slate-300 dark:border-b-white/25' : '',
            ].join(' ')}
          >
            {value === 0 ? '' : value}
          </div>
        )),
      )}
    </div>
  )
}

function MiniCoachMock() {
  return (
    <div className="space-y-3">
      <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-100/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-950 dark:border-emerald-300/20 dark:bg-emerald-400/10 dark:text-emerald-100">
        Strong move
      </div>
      <div>
        <p className="font-display text-lg font-semibold text-slate-950 dark:text-white">Naked Single</p>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          This cell has only one legal candidate left, so the board is forcing the move.
        </p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 dark:border-white/10 dark:bg-slate-950/55">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Suggested next step</p>
        <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">Place 7, then rescan the box for easier follow-ups.</p>
      </div>
      <div className="flex gap-2">
        {[2, 5, 7].map((value) => (
          <span
            key={value}
            className={`inline-flex h-9 min-w-9 items-center justify-center rounded-full border px-3 text-sm font-semibold ${
              value === 7
                ? 'border-cyan-300 bg-cyan-100 text-cyan-950 dark:border-cyan-300/30 dark:bg-cyan-400/10 dark:text-cyan-100'
                : 'border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-slate-950/55 dark:text-slate-300'
            }`}
          >
            {value}
          </span>
        ))}
      </div>
    </div>
  )
}

function MiniDailyMock() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Today&apos;s puzzle</p>
          <p className="mt-1 font-display text-lg font-semibold text-slate-950 dark:text-white">May 12 Challenge</p>
        </div>
        <div className="rounded-full border border-amber-200 bg-amber-100/85 px-3 py-1 text-xs font-semibold text-amber-950 dark:border-amber-300/20 dark:bg-amber-400/10 dark:text-amber-100">
          Shared board
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          ['Timer', '04:26'],
          ['Mistakes', '1'],
          ['Rank', '#12'],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-200 bg-white/90 p-3 dark:border-white/10 dark:bg-slate-950/55"
          >
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{label}</p>
            <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-white">{value}</p>
          </div>
        ))}
      </div>
      <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
        One shared puzzle every day, ranked by score, speed, and accuracy.
      </p>
    </div>
  )
}

function MiniRaceRoomMock() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Room UDLRF6</p>
          <p className="mt-1 font-display text-lg font-semibold text-slate-950 dark:text-white">Online Race</p>
        </div>
        <div className="rounded-full border border-fuchsia-200 bg-fuchsia-100/85 px-3 py-1 text-xs font-semibold text-fuchsia-950 dark:border-fuchsia-300/20 dark:bg-fuchsia-400/10 dark:text-fuchsia-100">
          4 players live
        </div>
      </div>
      <div className="space-y-2">
        {[
          ['#1 Aigerim', '05:12', '9400'],
          ['#2 Nursultan', '05:48', '9020'],
          ['#3 Maya', 'Solving', '7420'],
        ].map(([name, time, score]) => (
          <div
            key={name}
            className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/90 px-3 py-3 dark:border-white/10 dark:bg-slate-950/55"
          >
            <div>
              <p className="text-sm font-semibold text-slate-950 dark:text-white">{name}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{time}</p>
            </div>
            <p className="text-sm font-semibold text-cyan-700 dark:text-cyan-100">{score}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export function HomePage() {
  const navigate = useNavigate()

  useEffect(() => {
    if (isOnboardingCompleted()) {
      return
    }

    navigate('/onboarding', { replace: true })
  }, [navigate])

  return (
    <div className="space-y-8 lg:space-y-9">
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
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">
              Focus training, coaching, and friendly competition in one place.
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
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Built for busy days.</p>
              </div>
              <div className="rounded-2xl border border-slate-900/10 bg-slate-950/6 p-4 dark:border-white/10 dark:bg-slate-950/45">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Retention loop</p>
                <p className="mt-2 font-display text-3xl font-semibold text-slate-950 dark:text-white">Daily</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Fresh puzzle. Daily loop.</p>
              </div>
              <div className="rounded-2xl border border-slate-900/10 bg-slate-950/6 p-4 dark:border-white/10 dark:bg-slate-950/45">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Prototype angle</p>
                <p className="mt-2 font-display text-3xl font-semibold text-slate-950 dark:text-white">Startup-ready</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Built like a startup prototype.</p>
              </div>
            </div>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-100/70 px-4 py-2 text-sm font-medium text-amber-900 dark:border-amber-300/20 dark:bg-amber-400/10 dark:text-amber-100">
              Unlock badges as you train daily.
            </div>
          </div>

          <BoardPreview />
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200/90 bg-white/78 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.10)] backdrop-blur-sm dark:border-white/10 dark:bg-white/5 dark:shadow-[0_18px_60px_rgba(2,8,24,0.3)] sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-700 dark:text-cyan-200/75">Product demo</p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
              See Sudoku Focus in action
            </h2>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            Sudoku Focus combines focus training, coaching, and friendly competition in one platform.
          </p>
        </div>

        <div className="mt-8 grid gap-4 xl:grid-cols-2">
          <DemoPreviewCard
            icon={PlayCircle}
            label="Core gameplay"
            title="Smart Sudoku Board"
            description="Quick moves, notes, and clean session feedback."
            ctaLabel="Try Play Mode"
            to="/game"
          >
            <MiniSudokuMock />
          </DemoPreviewCard>

          <DemoPreviewCard
            icon={BrainCircuit}
            label="Learning layer"
            title="AI Coach Explanation"
            description="Fast strategy tips without breaking flow."
            ctaLabel="Open AI Coach"
            to="/game"
          >
            <MiniCoachMock />
          </DemoPreviewCard>

          <DemoPreviewCard
            icon={CalendarDays}
            label="Habit loop"
            title="Daily Challenge"
            description="One puzzle. One day. One board for everyone."
            ctaLabel="Join Daily Challenge"
            to="/daily"
          >
            <MiniDailyMock />
          </DemoPreviewCard>

          <DemoPreviewCard
            icon={Users2}
            label="Social play"
            title="Online Race Room"
            description="Create a room. Share the link. Race live."
            ctaLabel="Create Online Room"
            to="/online"
          >
            <MiniRaceRoomMock />
          </DemoPreviewCard>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/game"
            className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-[color:#f8fbff] transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-cyan-50"
          >
            Try Play Mode
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/daily"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-cyan-300/35 hover:bg-cyan-50/70 dark:border-white/10 dark:bg-slate-950/55 dark:text-white dark:hover:bg-slate-900/80"
          >
            Join Daily Challenge
          </Link>
          <Link
            to="/online"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-cyan-300/35 hover:bg-cyan-50/70 dark:border-white/10 dark:bg-slate-950/55 dark:text-white dark:hover:bg-slate-900/80"
          >
            Create Online Room
          </Link>
          <Link
            to="/leaderboard"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-cyan-300/35 hover:bg-cyan-50/70 dark:border-white/10 dark:bg-slate-950/55 dark:text-white dark:hover:bg-slate-900/80"
          >
            View Leaderboard
            <Trophy className="h-4 w-4" />
          </Link>
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
          <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            Core systems are live. More layers can grow on top.
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

      <CommunityCard />
    </div>
  )
}
