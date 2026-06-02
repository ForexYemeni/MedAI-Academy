// ─── Server-Side In-Memory Cache ─────────────────────────────
// Caches API responses in memory with TTL (Time-To-Live)
// This avoids hitting MongoDB on every request for frequently-accessed data

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // Time-to-live in milliseconds
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Clean up expired entries every 60 seconds
    if (typeof globalThis !== 'undefined') {
      this.cleanupInterval = setInterval(() => this.cleanup(), 60000)
    }
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    
    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data as T
  }

  set<T>(key: string, data: T, ttlMs: number = 30000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    })
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  // Delete all cache entries matching a prefix
  deleteByPrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key)
      }
    }
  }

  // Invalidate all course-related caches (call after course/lesson mutations)
  invalidateCourses(): void {
    this.deleteByPrefix('courses:')
    this.deleteByPrefix('admin-courses:')
    this.deleteByPrefix('public-courses:')
    this.deleteByPrefix('lessons:')
  }

  // Invalidate enrollment-related caches
  invalidateEnrollments(): void {
    this.deleteByPrefix('enrollments:')
    this.deleteByPrefix('enrollment-progress:')
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }
  }

  // Get cache stats for debugging
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }
}

// Singleton - persists across serverless function invocations in the same cold start
const globalForCache = globalThis as unknown as { __cache: MemoryCache }
export const cache = globalForCache.__cache || (globalForCache.__cache = new MemoryCache())

// ─── Cache Key Builders ─────────────────────────────────────

export function buildCoursesCacheKey(params: {
  category?: string | null
  level?: string | null
  departmentId?: string | null
  recommended?: string | null
  recent?: string | null
  userId?: string | null
}): string {
  const parts = [
    'public-courses',
    params.category || 'all',
    params.level || 'all',
    params.departmentId || 'all',
    params.recommended || 'all',
    params.recent || 'all',
    params.userId || 'anon',
  ]
  return parts.join(':')
}

export function buildAdminCoursesCacheKey(params: {
  category?: string | null
  published?: string | null
  full?: boolean
}): string {
  const parts = [
    'admin-courses',
    params.category || 'all',
    params.published || 'all',
    params.full ? 'full' : 'meta',
  ]
  return parts.join(':')
}

// ─── Cache-Control Header Helpers ────────────────────────────

export function getCacheHeaders(maxAge: number = 30, staleWhileRevalidate: number = 60): HeadersInit {
  return {
    'Cache-Control': `public, s-maxage=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`,
  }
}

// For authenticated/user-specific data - shorter cache, private
export function getPrivateCacheHeaders(maxAge: number = 10, staleWhileRevalidate: number = 30): HeadersInit {
  return {
    'Cache-Control': `private, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`,
  }
}

export default cache
