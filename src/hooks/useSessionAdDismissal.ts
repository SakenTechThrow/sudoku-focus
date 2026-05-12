import { useCallback, useEffect, useState } from 'react'

export function useSessionAdDismissal(storageKey: string, eligible: boolean) {
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      setDismissed(false)
      return
    }

    try {
      setDismissed(window.localStorage.getItem(storageKey) === '1')
    } catch {
      setDismissed(false)
    }
  }, [storageKey])

  const dismiss = useCallback(() => {
    setDismissed(true)

    if (typeof window === 'undefined') {
      return
    }

    try {
      window.localStorage.setItem(storageKey, '1')
    } catch {
      // Ignore localStorage failures and keep the UI responsive.
    }
  }, [storageKey])

  return {
    isVisible: eligible && !dismissed,
    dismiss,
  }
}
