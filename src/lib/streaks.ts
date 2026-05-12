export type DailyStreakSummary = {
  currentDailyStreak: number
  bestDailyStreak: number
  lastDailyDate: string | null
}

function toDateKey(value: string | null | undefined) {
  if (!value) {
    return null
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date.toISOString().slice(0, 10)
}

function diffInDays(previousDateKey: string, nextDateKey: string) {
  const previous = new Date(`${previousDateKey}T00:00:00Z`)
  const next = new Date(`${nextDateKey}T00:00:00Z`)

  return Math.round((next.getTime() - previous.getTime()) / 86_400_000)
}

export function computeDailyStreaks(dateValues: Array<string | null | undefined>): DailyStreakSummary {
  const normalizedDates = Array.from(
    new Set(
      dateValues
        .map((value) => toDateKey(value))
        .filter((value): value is string => value !== null),
    ),
  ).sort()

  if (normalizedDates.length === 0) {
    return {
      currentDailyStreak: 0,
      bestDailyStreak: 0,
      lastDailyDate: null,
    }
  }

  let bestDailyStreak = 1
  let activeRun = 1

  for (let index = 1; index < normalizedDates.length; index += 1) {
    const previousDate = normalizedDates[index - 1]
    const nextDate = normalizedDates[index]

    if (diffInDays(previousDate, nextDate) === 1) {
      activeRun += 1
      bestDailyStreak = Math.max(bestDailyStreak, activeRun)
    } else {
      activeRun = 1
    }
  }

  const lastDailyDate = normalizedDates[normalizedDates.length - 1]
  const todayKey = new Date().toISOString().slice(0, 10)
  const daysSinceLastDaily = diffInDays(lastDailyDate, todayKey)
  let currentDailyStreak = 0

  if (daysSinceLastDaily === 0 || daysSinceLastDaily === 1) {
    currentDailyStreak = 1

    for (let index = normalizedDates.length - 1; index > 0; index -= 1) {
      const currentDate = normalizedDates[index]
      const previousDate = normalizedDates[index - 1]

      if (diffInDays(previousDate, currentDate) === 1) {
        currentDailyStreak += 1
      } else {
        break
      }
    }
  }

  return {
    currentDailyStreak,
    bestDailyStreak,
    lastDailyDate,
  }
}
