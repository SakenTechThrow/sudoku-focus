import { useCallback, useEffect, useMemo, useState } from 'react'

type UseTimerOptions = {
  initialSeconds?: number
  autoStart?: boolean
}

function formatTimeUnit(value: number) {
  return value.toString().padStart(2, '0')
}

export function useTimer({
  initialSeconds = 0,
  autoStart = false,
}: UseTimerOptions = {}) {
  const [seconds, setSeconds] = useState(initialSeconds)
  const [isRunning, setIsRunning] = useState(autoStart)

  useEffect(() => {
    if (!isRunning) {
      return undefined
    }

    const interval = window.setInterval(() => {
      setSeconds((current) => current + 1)
    }, 1000)

    return () => window.clearInterval(interval)
  }, [isRunning])

  const start = useCallback(() => {
    setSeconds(0)
    setIsRunning(true)
  }, [])

  const pause = useCallback(() => {
    setIsRunning(false)
  }, [])

  const resume = useCallback(() => {
    setIsRunning(true)
  }, [])

  const reset = useCallback(() => {
    setSeconds(0)
    setIsRunning(false)
  }, [])

  const formattedTime = useMemo(() => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${formatTimeUnit(minutes)}:${formatTimeUnit(remainingSeconds)}`
  }, [seconds])

  return {
    seconds,
    isRunning,
    start,
    pause,
    resume,
    reset,
    formattedTime,
  }
}
