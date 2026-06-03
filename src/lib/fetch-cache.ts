// ─── Client-side Data Fetching with Cache ────────────────────
// Prevents redundant API calls and provides instant data display
// using cached data while refreshing in the background

import { useAppStore, type Course, type CourseProgress } from '@/store/app-store'

const COURSES_LS_KEY = 'medai-courses-cache'
const PROGRESS_LS_KEY = 'medai-progress'

/**
 * Load courses from localStorage (synchronous, instant).
 * Call this FIRST on page load to avoid any loading delay.
 */
export function loadCoursesFromCache(): boolean {
  try {
    const cached = localStorage.getItem(COURSES_LS_KEY)
    if (cached) {
      const parsed = JSON.parse(cached)
      if (Array.isArray(parsed) && parsed.length > 0) {
        const cachedProgress = localStorage.getItem(PROGRESS_LS_KEY)
        const progress = cachedProgress ? JSON.parse(cachedProgress) : useAppStore.getState().courseProgress
        useAppStore.setState({
          courses: parsed,
          courseProgress: progress,
          _lastCoursesFetch: Date.now(),
        })
        return true
      }
    }
  } catch (e) {
    // Ignore cache errors
  }
  return false
}

/**
 * Fetch public courses with client-side caching.
 * Returns cached data instantly if available, then refreshes in background.
 * Deduplicates concurrent fetches.
 */
export async function fetchCoursesWithCache(options?: { forceRefresh?: boolean }): Promise<{
  courses: Course[]
  allLessons: any[]
  fromCache: boolean
}> {
  const state = useAppStore.getState()
  const now = Date.now()
  const CACHE_TTL = state.COURSES_CACHE_TTL

  // If we have recent data and it's not forced refresh, return cached
  if (!options?.forceRefresh && state.courses.length > 0 && (now - state._lastCoursesFetch) < CACHE_TTL) {
    return {
      courses: state.courses,
      allLessons: state.lessons,
      fromCache: true,
    }
  }

  // Deduplicate concurrent fetches
  if (state._coursesFetchPromise) {
    const result = await state._coursesFetchPromise
    return {
      courses: state.courses,
      allLessons: state.lessons,
      fromCache: false,
    }
  }

  // Start a new fetch
  const fetchPromise = (async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('medai-token') : null
      const res = await fetch('/api/courses', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json()
      if (data.courses && data.courses.length > 0) {
        const apiCourses: Course[] = data.courses.map((c: any) => ({
          id: c._id?.toString() || c.id,
          title: c.title || '',
          titleAr: c.titleAr || '',
          description: c.descriptionAr || c.description || '',
          category: c.category || 'general',
          thumbnail: c.thumbnail || '',
          instructor: c.instructorName || c.instructor || '',
          rating: c.rating || 0,
          students: c.students || 0,
          duration: c.duration || '0 ساعة',
          level: c.level || 'beginner',
          price: c.price ?? 0,
          isPremium: c.isPremium || false,
          isGifted: c.isGifted || false,
          giftedAt: c.giftedAt || null,
          lessons: c.lessons || (c.lessonsData?.length || 0),
          tags: c.tags || [],
          lessonsData: c.lessonsData?.map((l: any) => ({
            id: l.id,
            courseId: c._id?.toString() || c.id,
            title: l.title || '',
            titleAr: l.titleAr || '',
            type: l.type || 'article',
            duration: l.duration || 15,
            order: l.order || 1,
            isFree: l.isFree || false,
            content: l.content,
            videoUrl: l.videoUrl,
            summary: l.summary,
            keyPoints: l.keyPoints,
          })) || [],
          isEnrolled: c.isEnrolled,
          departmentId: c.departmentId?.toString() || null,
          recommended: c.recommended || false,
          createdAt: c.createdAt,
        }))

        const allLessons = apiCourses.flatMap(c => c.lessonsData || [])

        // Sync enrollment progress
        const currentProgress = useAppStore.getState().courseProgress
        const existingCourseIds = new Set(currentProgress.map(p => p.courseId))
        const newProgressEntries: CourseProgress[] = []
        for (const apiCourse of data.courses) {
          const courseId = apiCourse._id?.toString() || apiCourse.id
          const isEnrolled = apiCourse.isEnrolled === true
          if (isEnrolled && !existingCourseIds.has(courseId)) {
            const courseLessons = allLessons.filter(l => l.courseId === courseId)
            const firstLesson = courseLessons.sort((a, b) => a.order - b.order)[0]
            newProgressEntries.push({
              courseId,
              completedLessons: [],
              lastAccessedLessonId: firstLesson?.id || null,
              progress: 0,
              lastAccessedAt: Date.now(),
            })
          }
        }
        const updatedProgress = [...currentProgress, ...newProgressEntries]

        useAppStore.setState({
          courses: apiCourses,
          lessons: allLessons,
          courseProgress: updatedProgress,
          _lastCoursesFetch: Date.now(),
          _coursesFetchPromise: null,
        })

        // Persist courses to localStorage for instant loading on next visit
        try {
          localStorage.setItem(COURSES_LS_KEY, JSON.stringify(apiCourses))
        } catch (e) {
          // Ignore storage quota errors
        }

        if (typeof window !== 'undefined' && newProgressEntries.length > 0) {
          localStorage.setItem(PROGRESS_LS_KEY, JSON.stringify(updatedProgress))
        }
      }
    } catch (err) {
      console.error('Fetch courses error:', err)
      useAppStore.setState({ _coursesFetchPromise: null })
    }
  })()

  // Store the promise to deduplicate
  useAppStore.setState({ _coursesFetchPromise: fetchPromise })

  await fetchPromise

  const newState = useAppStore.getState()
  return {
    courses: newState.courses,
    allLessons: newState.lessons,
    fromCache: false,
  }
}

/**
 * Fetch admin courses with client-side caching.
 * Separate from public courses because it requires auth and different data.
 */
export async function fetchAdminCoursesWithCache(options?: { forceRefresh?: boolean }): Promise<{
  courses: any[]
  fromCache: boolean
}> {
  const state = useAppStore.getState()
  const now = Date.now()

  // If we have recent data and it's not forced refresh, return cached
  if (!options?.forceRefresh && state._cachedAdminCourses.length > 0 && (now - state._lastAdminCoursesFetch) < state.COURSES_CACHE_TTL) {
    return {
      courses: state._cachedAdminCourses,
      fromCache: true,
    }
  }

  // Deduplicate concurrent fetches
  if (state._adminCoursesFetchPromise) {
    await state._adminCoursesFetchPromise
    return {
      courses: useAppStore.getState()._cachedAdminCourses,
      fromCache: false,
    }
  }

  const fetchPromise = (async () => {
    try {
      const token = state.authToken || (typeof window !== 'undefined' ? localStorage.getItem('medai-token') : null)
      const res = await fetch('/api/admin/courses', {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) {
        useAppStore.setState({
          _cachedAdminCourses: data.courses || [],
          _lastAdminCoursesFetch: Date.now(),
          _adminCoursesFetchPromise: null,
        })
      }
    } catch (err) {
      console.error('Fetch admin courses error:', err)
      useAppStore.setState({ _adminCoursesFetchPromise: null })
    }
  })()

  useAppStore.setState({ _adminCoursesFetchPromise: fetchPromise })

  await fetchPromise

  return {
    courses: useAppStore.getState()._cachedAdminCourses,
    fromCache: false,
  }
}
