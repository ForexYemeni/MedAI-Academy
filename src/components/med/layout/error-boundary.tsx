'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo })
    console.error('[ErrorBoundary] Caught error:', error, errorInfo)
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center" dir="rtl">
          <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
            <AlertTriangle className="w-10 h-10 text-red-400" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">حدث خطأ غير متوقع</h3>
          <p className="text-sm text-muted-foreground mb-2 max-w-md">
            {this.state.error?.message || 'حدث خطأ أثناء تحميل الصفحة'}
          </p>
          {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
            <details className="mb-4 text-left max-w-lg w-full">
              <summary className="text-xs text-muted-foreground cursor-pointer mb-2">تفاصيل الخطأ</summary>
              <pre className="text-[10px] text-red-400 bg-red-500/5 p-3 rounded-lg overflow-auto max-h-40 border border-red-500/10" dir="ltr">
                {this.state.error?.stack}
              </pre>
            </details>
          )}
          <div className="flex items-center gap-3">
            <Button
              onClick={this.handleRetry}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              إعادة المحاولة
            </Button>
            <Button
              onClick={this.handleReload}
              className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              تحديث الصفحة
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// HOC wrapper for easy component wrapping
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) {
  return function WithErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}
