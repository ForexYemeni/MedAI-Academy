'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/store/app-store'

export function useOffline() {
  const isOnline = useAppStore(s => s.isOnline)
  const setIsOnline = useAppStore(s => s.setIsOnline)
  const wasOffline = useAppStore(s => s.wasOffline)
  const setWasOffline = useAppStore(s => s.setWasOffline)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setWasOffline(true)
    }
    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [setIsOnline, setWasOffline])

  return { isOnline, wasOffline }
}
