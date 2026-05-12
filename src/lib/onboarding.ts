export const ONBOARDING_STORAGE_KEY = 'sudoku-focus-onboarding'

export type OnboardingGoal =
  | 'improve-focus'
  | 'build-daily-habit'
  | 'compete-with-friends'
  | 'learn-sudoku-strategies'
  | 'prepare-my-brain-in-the-morning'

export type OnboardingExperienceLevel = 'beginner' | 'intermediate' | 'advanced'

export type OnboardingPreferredMode =
  | 'solo-practice'
  | 'daily-challenge'
  | 'online-race'
  | 'learn-with-ai-coach'

export type OnboardingState = {
  completed: boolean
  goals: OnboardingGoal[]
  experienceLevel: OnboardingExperienceLevel | null
  preferredMode: OnboardingPreferredMode | null
  completedAt: string | null
}

const validGoals = new Set<OnboardingGoal>([
  'improve-focus',
  'build-daily-habit',
  'compete-with-friends',
  'learn-sudoku-strategies',
  'prepare-my-brain-in-the-morning',
])

const validExperienceLevels = new Set<OnboardingExperienceLevel>([
  'beginner',
  'intermediate',
  'advanced',
])

const validPreferredModes = new Set<OnboardingPreferredMode>([
  'solo-practice',
  'daily-challenge',
  'online-race',
  'learn-with-ai-coach',
])

function createDefaultOnboardingState(): OnboardingState {
  return {
    completed: false,
    goals: [],
    experienceLevel: null,
    preferredMode: null,
    completedAt: null,
  }
}

function isValidOnboardingState(value: unknown): value is OnboardingState {
  if (!value || typeof value !== 'object') {
    return false
  }

  const state = value as Partial<OnboardingState>

  return (
    typeof state.completed === 'boolean'
    && Array.isArray(state.goals)
    && state.goals.every((goal) => typeof goal === 'string' && validGoals.has(goal as OnboardingGoal))
    && (state.experienceLevel === null
      || (typeof state.experienceLevel === 'string'
        && validExperienceLevels.has(state.experienceLevel as OnboardingExperienceLevel)))
    && (state.preferredMode === null
      || (typeof state.preferredMode === 'string'
        && validPreferredModes.has(state.preferredMode as OnboardingPreferredMode)))
    && (state.completedAt === null || typeof state.completedAt === 'string')
  )
}

export function getOnboardingState(): OnboardingState | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const stored = window.localStorage.getItem(ONBOARDING_STORAGE_KEY)

    if (!stored) {
      return null
    }

    const parsed = JSON.parse(stored) as unknown

    if (!isValidOnboardingState(parsed)) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

export function saveOnboardingState(state: Partial<OnboardingState>) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    const current = getOnboardingState() ?? createDefaultOnboardingState()
    const nextState: OnboardingState = {
      ...current,
      ...state,
      goals: Array.isArray(state.goals) ? state.goals : current.goals,
      experienceLevel: state.experienceLevel ?? current.experienceLevel,
      preferredMode: state.preferredMode ?? current.preferredMode,
      completedAt: state.completed ? new Date().toISOString() : (state.completedAt ?? current.completedAt),
    }

    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(nextState))
  } catch {
    // Ignore localStorage failures to avoid blocking the UI.
  }
}

export function isOnboardingCompleted() {
  return Boolean(getOnboardingState()?.completed)
}

export function getOnboardingDestination(preferredMode: OnboardingPreferredMode | null | undefined) {
  switch (preferredMode) {
    case 'daily-challenge':
      return '/daily'
    case 'online-race':
      return '/online'
    case 'learn-with-ai-coach':
    case 'solo-practice':
    default:
      return '/game'
  }
}
