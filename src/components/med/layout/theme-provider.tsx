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

/**
 * THEME IS LOCKED TO DARK.
 *
 * The app's UI components use 1000+ hardcoded dark colors (bg-slate-900,
 * text-cyan-400, bg-[#0a0e1a], etc.) that have no light-mode equivalents.
 * Switching to light mode breaks the UI (e.g. "تسجيل الدخول" text
 * disappears because text-muted-foreground becomes dark gray on a
 * hardcoded #0a0e1a black background).
 *
 * Until a full light-mode migration is done, the theme is permanently
 * locked to dark. The toggle button still exists in the UI but is a no-op.
 * The `.light` CSS class is also aliased to the dark palette as a safety
 * net, so even if anything ever sets `.light` on <html>, colors stay correct.
 */

function applyDarkTheme() {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.classList.remove('light')
  if (!root.classList.contains('dark')) {
    root.classList.add('dark')
  }
  root.style.colorScheme = 'dark'
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) {
    meta.setAttribute('content', '#0a0e1a')
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Theme is always 'dark'. We keep the state for API compatibility with
  // components that call useTheme(), but it never actually changes.
  const [theme, setThemeState] = useState<Theme>('dark')

  // On mount, force dark on the document and overwrite any stale localStorage.
  useEffect(() => {
    applyDarkTheme()
    try {
      localStorage.setItem(STORAGE_KEY, 'dark')
    } catch {
      // ignore write failures (private mode / quota)
    }
  }, [])

  // toggleTheme and setTheme are NO-OPS — they keep the API stable for
  // existing call sites but don't actually change the theme.
  const setTheme = (_next: Theme) => {
    // forced dark — ignore
    setThemeState('dark')
    applyDarkTheme()
  }
  const toggleTheme = () => {
    // forced dark — ignore
    setThemeState('dark')
    applyDarkTheme()
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
