'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {},
  setTheme: () => {},
})

const STORAGE_KEY = 'medai-theme'

function getInitialTheme(): Theme {
  // SSR-safe: only access window/localStorage on client
  if (typeof window === 'undefined') return 'dark'
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null
    // IMPORTANT: Only honor an EXPLICIT user choice.
    // Do NOT auto-switch based on prefers-color-scheme, because the UI
    // components use 1000+ hardcoded dark colors (bg-slate-900, etc.)
    // that don't have light-mode equivalents yet. Auto-switching breaks
    // the layout on phones whose OS is set to light mode.
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    // localStorage may be unavailable (incognito / privacy mode) — default to dark
  }
  return 'dark'
}

function applyThemeToDocument(theme: Theme) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  // Use classList so we don't blow away other classes Next.js may add to <html>
  root.classList.remove('dark', 'light')
  root.classList.add(theme)
  // color-scheme lets native form controls, scrollbars, etc. match the theme
  root.style.colorScheme = theme
  // Keep <meta name="theme-color"> in sync for mobile browser chrome
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) {
    meta.setAttribute('content', theme === 'light' ? '#F4F7FB' : '#0a0e1a')
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Lazy initializer runs ONCE on the client, reads localStorage before first paint
  const [theme, setThemeState] = useState<Theme>('dark')

  // Set initial theme on mount (after hydration) — this matches what the
  // inline script in layout.tsx already did, so there's no flash.
  useEffect(() => {
    const initial = getInitialTheme()
    setThemeState(initial)
    applyThemeToDocument(initial)
  }, [])

  useEffect(() => {
    applyThemeToDocument(theme)
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // ignore write failures (private mode / quota)
    }
  }, [theme])

  const setTheme = (next: Theme) => setThemeState(next)
  const toggleTheme = () => setThemeState(prev => prev === 'dark' ? 'light' : 'dark')

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
