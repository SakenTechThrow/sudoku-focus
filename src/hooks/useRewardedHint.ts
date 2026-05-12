import { useCallback, useMemo, useState } from 'react'
import { FREE_HINT_LIMIT } from '../constants/ads'

type RevealHintHandler = () => void | boolean | Promise<void | boolean>

type UseRewardedHintOptions = {
  hintsUsed: number
  revealHint: RevealHintHandler
}

export function useRewardedHint({
  hintsUsed,
  revealHint,
}: UseRewardedHintOptions) {
  const [isAdOpen, setIsAdOpen] = useState(false)
  const requiresAd = hintsUsed >= FREE_HINT_LIMIT

  const requestHint = useCallback(() => {
    if (requiresAd) {
      setIsAdOpen(true)
      return
    }

    void Promise.resolve(revealHint())
  }, [requiresAd, revealHint])

  const confirmAdAndRevealHint = useCallback(() => {
    setIsAdOpen(false)
    void Promise.resolve(revealHint())
  }, [revealHint])

  const cancelAd = useCallback(() => {
    setIsAdOpen(false)
  }, [])

  const hintActionLabel = useMemo(
    () => (requiresAd ? 'Unlock hint' : 'Hint'),
    [requiresAd],
  )

  return {
    requestHint,
    isAdOpen,
    confirmAdAndRevealHint,
    cancelAd,
    hintActionLabel,
    requiresAd,
  }
}
