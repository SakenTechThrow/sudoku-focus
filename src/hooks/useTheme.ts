import { useCallback, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'sudoku-focus:theme'

type ThemeState = {
  source: 'system' | 'user'
  theme: Theme
}

function getSystemTheme(): Theme {
  if (typeof window === 'undefined') {
    return 'dark'
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getStoredTheme(): Theme | null {
  if (typeof window === 'undefined') {
    return null
  }

  const storedTheme = window.localStorage.getItem(STORAGE_KEY)
  return storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : null
}

function applyThemeClass(theme: Theme) {
  if (typeof document === 'undefined') {
    return
  }

  document.documentElement.classList.toggle('dark', theme === 'dark')
}

function getInitialThemeState(): ThemeState {
  const storedTheme = getStoredTheme()
  const initialTheme = storedTheme ?? getSystemTheme()
  applyThemeClass(initialTheme)

  return {
    source: storedTheme ? 'user' : 'system',
    theme: initialTheme,
  }
}

export function useTheme() {
  const [{ source, theme }, setThemeState] = useState<ThemeState>(() => getInitialThemeState())

  useEffect(() => {
    applyThemeClass(theme)

    if (typeof window === 'undefined') {
      return
    }

    if (source === 'user') {
      window.localStorage.setItem(STORAGE_KEY, theme)
      return
    }

    window.localStorage.removeItem(STORAGE_KEY)
  }, [source, theme])

  useEffect(() => {
    if (source !== 'system' || typeof window === 'undefined') {
      return
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      setThemeState((current) =>
        current.source === 'system'
          ? { ...current, theme: mediaQuery.matches ? 'dark' : 'light' }
          : current,
      )
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [source])

  const setTheme = useCallback((nextTheme: Theme) => {
    setThemeState({
      source: 'user',
      theme: nextTheme,
    })
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((current) => ({
      source: 'user',
      theme: current.theme === 'dark' ? 'light' : 'dark',
    }))
  }, [])

  return {
    theme,
    toggleTheme,
    setTheme,
  }
}
