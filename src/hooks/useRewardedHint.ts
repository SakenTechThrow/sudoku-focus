import { useCallback, useMemo, useState } from 'react'
import { FREE_HINT_LIMIT } from '../constants/ads'

type RevealHintHandler = () => void | boolean | Promise<void | boolean>

type UseRewardedHintOptions = {
  hintsUsed: number
  revealHint: RevealHintHandler
  disabled?: boolean
}

export function useRewardedHint({
  hintsUsed,
  revealHint,
  disabled = false,
}: UseRewardedHintOptions) {
  const [isAdOpen, setIsAdOpen] = useState(false)
  const requiresAd = !disabled && hintsUsed >= FREE_HINT_LIMIT

  const requestHint = useCallback(() => {
    if (disabled) {
      setIsAdOpen(false)
      return
    }

    if (requiresAd) {
      setIsAdOpen(true)
      return
    }

    void Promise.resolve(revealHint())
  }, [disabled, requiresAd, revealHint])

  const confirmAdAndRevealHint = useCallback(() => {
    if (disabled) {
      setIsAdOpen(false)
      return
    }

    setIsAdOpen(false)
    void Promise.resolve(revealHint())
  }, [disabled, revealHint])

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
