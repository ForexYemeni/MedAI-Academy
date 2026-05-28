'use client'

import { useEffect } from 'react'
import { Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center" dir="rtl">
      <div className="text-center max-w-md px-6">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30 flex items-center justify-center">
          <Activity className="w-10 h-10 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-3">حدث خطأ غير متوقع</h2>
        <p className="text-sm text-muted-foreground mb-6">
          عذراً، حدث خطأ أثناء تحميل الصفحة. يرجى المحاولة مرة أخرى.
        </p>
        <div className="flex gap-3 justify-center">
          <Button
            onClick={reset}
            className="bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/25"
          >
            إعادة المحاولة
          </Button>
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
            className="border-white/10 text-muted-foreground hover:bg-white/5"
          >
            الصفحة الرئيسية
          </Button>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-left">
            <p className="text-xs text-red-400 font-mono break-all">{error.message}</p>
          </div>
        )}
      </div>
    </div>
  )
}
