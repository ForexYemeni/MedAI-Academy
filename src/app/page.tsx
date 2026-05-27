'use client'

import dynamic from 'next/dynamic'

const AppShell = dynamic(() => import('@/components/med/layout/app-shell'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
      <div className="text-center">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 animate-pulse" />
          <div className="absolute inset-1 rounded-xl bg-background flex items-center justify-center">
            <svg className="w-8 h-8 text-primary animate-heartbeat" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
        </div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
          MedAI Academy
        </h1>
        <p className="text-sm text-muted-foreground">جاري التحميل...</p>
        <div className="mt-6 w-48 h-1 rounded-full bg-muted mx-auto overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-primary to-purple-500 animate-shimmer" style={{ width: '60%' }} />
        </div>
      </div>
    </div>
  )
})

export default function Home() {
  return <AppShell />
}
