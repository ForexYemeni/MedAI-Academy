'use client'

import dynamic from 'next/dynamic'
import { ErrorBoundary } from '@/components/med/layout/error-boundary'

const AppShell = dynamic(() => import('@/components/med/layout/app-shell'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
      <div className="text-center">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <img
            src="/icons/icon-192x192.png"
            alt="أكاديمية نبض"
            className="w-full h-full rounded-2xl animate-pulse"
          />
        </div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
          أكاديمية نبض
        </h1>
        <p className="text-sm text-muted-foreground">جاري التحميل...</p>
        <div className="mt-6 w-48 h-1 rounded-full bg-muted mx-auto overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-primary to-purple-500 animate-shimmer" style={{ width: '60%' }} />
        </div>
      </div>
    </div>
  ),
})

export default function Home() {
  return (
    <ErrorBoundary>
      <AppShell />
    </ErrorBoundary>
  )
}
