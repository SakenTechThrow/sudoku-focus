import { useMemo, useState } from 'react'
import {
  ArrowRight,
  BrainCircuit,
  CalendarCheck2,
  CircleDot,
  Clock3,
  Swords,
  Target,
  Zap,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  getOnboardingDestination,
  getOnboardingState,
  saveOnboardingState,
  type OnboardingExperienceLevel,
  type OnboardingGoal,
  type OnboardingPreferredMode,
} from '../lib/onboarding'
import { cn } from '../lib/utils'

const goalOptions: Array<{
  value: OnboardingGoal
  label: string
  description: string
  icon: typeof Target
}> = [
  {
    value: 'improve-focus',
    label: 'Improve focus',
    description: 'Short sessions for sharper attention.',
    icon: Target,
  },
  {
    value: 'build-daily-habit',
    label: 'Build a daily habit',
    description: 'Keep a simple daily streak.',
    icon: CalendarCheck2,
  },
  {
    value: 'compete-with-friends',
    label: 'Compete with friends',
    description: 'Race, rank, and share rooms.',
    icon: Swords,
  },
  {
    value: 'learn-sudoku-strategies',
    label: 'Learn Sudoku strategies',
    description: 'Learn patterns, not just answers.',
    icon: BrainCircuit,
  },
  {
    value: 'prepare-my-brain-in-the-morning',
    label: 'Prepare my brain in the morning',
    description: 'Use Sudoku as a morning reset.',
    icon: Zap,
  },
]

const experienceOptions: Array<{
  value: OnboardingExperienceLevel
  label: string
  description: string
}> = [
  {
    value: 'beginner',
    label: 'Beginner',
    description: 'More guidance.',
  },
  {
    value: 'intermediate',
    label: 'Intermediate',
    description: 'Balanced challenge.',
  },
  {
    value: 'advanced',
    label: 'Advanced',
    description: 'Sharper pressure.',
  },
]

const preferredModeOptions: Array<{
  value: OnboardingPreferredMode
  label: string
  description: string
}> = [
  {
    value: 'solo-practice',
    label: 'Solo Practice',
    description: 'Quick personal sessions.',
  },
  {
    value: 'daily-challenge',
    label: 'Daily Challenge',
    description: 'One shared puzzle each day.',
  },
  {
    value: 'online-race',
    label: 'Online Race',
    description: 'Fastest accurate solve wins.',
  },
  {
    value: 'learn-with-ai-coach',
    label: 'Learn with AI Coach',
    description: 'Guided learning with tips.',
  },
]

export function OnboardingPage() {
  const navigate = useNavigate()
  const storedState = useMemo(() => getOnboardingState(), [])
  const [selectedGoals, setSelectedGoals] = useState<OnboardingGoal[]>(storedState?.goals ?? [])
  const [experienceLevel, setExperienceLevel] = useState<OnboardingExperienceLevel | null>(
    storedState?.experienceLevel ?? null,
  )
  const [preferredMode, setPreferredMode] = useState<OnboardingPreferredMode | null>(
    storedState?.preferredMode ?? null,
  )
  const [error, setError] = useState<string | null>(null)

  function toggleGoal(goal: OnboardingGoal) {
    setSelectedGoals((current) => (
      current.includes(goal)
        ? current.filter((item) => item !== goal)
        : [...current, goal]
    ))

    if (error) {
      setError(null)
    }
  }

  function handleSkip() {
    saveOnboardingState({
      completed: true,
      goals: selectedGoals,
      experienceLevel,
      preferredMode,
    })
    navigate('/game', { replace: true })
  }

  function handleComplete() {
    if (selectedGoals.length === 0) {
      setError('Pick at least one goal so Sudoku Focus can shape the experience around you.')
      return
    }

    if (!experienceLevel) {
      setError('Choose your experience level to personalize the challenge tone.')
      return
    }

    if (!preferredMode) {
      setError('Choose a preferred mode so we can send you to the right starting point.')
      return
    }

    saveOnboardingState({
      completed: true,
      goals: selectedGoals,
      experienceLevel,
      preferredMode,
    })
    navigate(getOnboardingDestination(preferredMode), { replace: true })
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_22rem]">
      <div className="rounded-[2rem] border border-slate-200/90 bg-white/82 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-sm dark:border-white/10 dark:bg-white/6 dark:shadow-[0_24px_80px_rgba(2,8,24,0.45)] sm:p-8">
        <p className="text-xs uppercase tracking-[0.28em] text-cyan-700 dark:text-cyan-200/75">Onboarding</p>
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-5xl">
          Welcome to Sudoku Focus
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-300">
          Choose how you want to train your brain.
        </p>

        <div className="mt-8 space-y-8">
          <div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-cyan-700 dark:text-cyan-200" />
              <h2 className="font-display text-2xl font-semibold text-slate-950 dark:text-white">
                Your goal
              </h2>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {goalOptions.map((goal) => {
                const GoalIcon = goal.icon
                const isSelected = selectedGoals.includes(goal.value)

                return (
                  <button
                    key={goal.value}
                    type="button"
                    onClick={() => toggleGoal(goal.value)}
                    className={cn(
                      'rounded-[1.6rem] border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60',
                      isSelected
                        ? 'border-cyan-300/45 bg-cyan-100/85 shadow-[0_12px_30px_rgba(14,116,144,0.12)] dark:border-cyan-300/25 dark:bg-cyan-400/12 dark:shadow-none'
                        : 'border-slate-200 bg-white/88 hover:border-cyan-300/35 hover:bg-cyan-50/80 dark:border-white/10 dark:bg-slate-950/45 dark:hover:bg-slate-900/80',
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-cyan-800 dark:border-white/10 dark:bg-slate-950/55 dark:text-cyan-100">
                        <GoalIcon className="h-5 w-5" />
                      </div>
                      <span
                        className={cn(
                          'rounded-full px-2.5 py-1 text-[11px] font-semibold',
                          isSelected
                            ? 'bg-white/85 text-cyan-900 dark:bg-white/10 dark:text-cyan-100'
                            : 'bg-slate-100 text-slate-600 dark:bg-white/8 dark:text-slate-300',
                        )}
                      >
                        {isSelected ? 'Selected' : 'Choose'}
                      </span>
                    </div>
                    <p className="mt-4 font-semibold text-slate-950 dark:text-white">{goal.label}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {goal.description}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <CircleDot className="h-4 w-4 text-cyan-700 dark:text-cyan-200" />
              <h2 className="font-display text-2xl font-semibold text-slate-950 dark:text-white">
                Your level
              </h2>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {experienceOptions.map((option) => {
                const isSelected = option.value === experienceLevel

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setExperienceLevel(option.value)
                      if (error) {
                        setError(null)
                      }
                    }}
                    className={cn(
                      'rounded-[1.5rem] border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60',
                      isSelected
                        ? 'border-cyan-300/45 bg-cyan-100/85 shadow-[0_12px_30px_rgba(14,116,144,0.12)] dark:border-cyan-300/25 dark:bg-cyan-400/12 dark:shadow-none'
                        : 'border-slate-200 bg-white/88 hover:border-cyan-300/35 hover:bg-cyan-50/80 dark:border-white/10 dark:bg-slate-950/45 dark:hover:bg-slate-900/80',
                    )}
                  >
                    <p className="font-semibold text-slate-950 dark:text-white">{option.label}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {option.description}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-cyan-700 dark:text-cyan-200" />
              <h2 className="font-display text-2xl font-semibold text-slate-950 dark:text-white">
                Start mode
              </h2>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {preferredModeOptions.map((option) => {
                const isSelected = option.value === preferredMode

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setPreferredMode(option.value)
                      if (error) {
                        setError(null)
                      }
                    }}
                    className={cn(
                      'rounded-[1.5rem] border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60',
                      isSelected
                        ? 'border-cyan-300/45 bg-cyan-100/85 shadow-[0_12px_30px_rgba(14,116,144,0.12)] dark:border-cyan-300/25 dark:bg-cyan-400/12 dark:shadow-none'
                        : 'border-slate-200 bg-white/88 hover:border-cyan-300/35 hover:bg-cyan-50/80 dark:border-white/10 dark:bg-slate-950/45 dark:hover:bg-slate-900/80',
                    )}
                  >
                    <p className="font-semibold text-slate-950 dark:text-white">{option.label}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {option.description}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <aside className="space-y-4">
        <section className="rounded-[2rem] border border-slate-200/90 bg-white/82 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-sm dark:border-white/10 dark:bg-white/6 dark:shadow-[0_18px_60px_rgba(2,8,24,0.35)]">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Why this matters</p>
          <h2 className="mt-3 font-display text-2xl font-semibold text-slate-950 dark:text-white">
            Personalize the first session
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
            These choices help position Sudoku Focus around your habits now, while leaving room for profile sync and richer recommendations later.
          </p>

          {error ? (
            <div className="mt-4 rounded-[1.4rem] border border-rose-200 bg-rose-100/85 px-4 py-3 text-sm text-rose-950 dark:border-rose-300/20 dark:bg-rose-400/10 dark:text-rose-100">
              {error}
            </div>
          ) : null}

          <div className="mt-5 space-y-3">
            <button
              type="button"
              onClick={handleComplete}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-[color:#f8fbff] transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-cyan-50"
            >
              Start training
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleSkip}
              className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:border-cyan-300/35 hover:bg-cyan-50/70 dark:border-white/10 dark:bg-slate-950/55 dark:text-white dark:hover:bg-slate-900/80"
            >
              Skip for now
            </button>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200/90 bg-white/72 p-5 dark:border-white/10 dark:bg-white/4">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Saved locally</p>
          <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
            Your onboarding preferences are stored on this device first, so you can start immediately without waiting on any database migration.
          </p>
        </section>
      </aside>
    </section>
  )
}
