'use client'

import React from 'react'

export function OfflineIndicator() {
  return null
}

export function OfflineFloatingIndicator() {
  return null
}

export function OfflineBadge({ isCached }: { isCached?: boolean }) {
  if (!isCached) return null
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-neon-green bg-neon-green/10 px-1.5 py-0.5 rounded-full">
      📱
    </span>
  )
}
