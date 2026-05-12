import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const HEADER_SCROLL_OFFSET = 96

export function ScrollToTop() {
  const location = useLocation()

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    if (location.hash) {
      const targetId = decodeURIComponent(location.hash.replace('#', ''))
      const target = document.getElementById(targetId)

      if (target) {
        window.requestAnimationFrame(() => {
          const top = target.getBoundingClientRect().top + window.scrollY - HEADER_SCROLL_OFFSET
          window.scrollTo({
            top: Math.max(0, top),
            left: 0,
            behavior: 'auto',
          })
        })
        return
      }
    }

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'auto',
    })
  }, [location.hash, location.pathname, location.search])

  return null
}
