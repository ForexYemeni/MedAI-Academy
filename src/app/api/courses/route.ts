import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { cache, buildCoursesCacheKey, getPrivateCacheHeaders } from '@/lib/cache'

// Strip heavy fields from lesson data for list view (saves ~95% bandwidth)
function stripLessonMetadata(lesson: any) {
  const { content, videoUrl, images, quizData, flashcardData, simulationData, ...meta } = lesson
  return meta
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const level = searchParams.get('level')
    const departmentId = searchParams.get('departmentId')
    const recommended = searchParams.get('recommended')
    const recent = searchParams.get('recent')

    // Determine user ID for cache key (but don't block on auth)
    const authHeader = req.headers.get('Authorization')
    let authUserId: string | null = null
    let enrolledCourseIds: Set<string> = new Set()
    let enrollmentMap: Map<string, any> = new Map()

    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '')
        const { verifyToken } = await import('@/lib/auth')
        const authUser = verifyToken(token)
        if (authUser) {
          authUserId = authUser.id
        }
      } catch { /* ignore auth errors */ }
    }

    // ─── Check server-side cache FIRST (before hitting DB) ───
    const cacheKey = buildCoursesCacheKey({
      category, level, departmentId, recommended, recent,
      userId: authUserId,
    })
    
    const cached = cache.get<{ courses: any[], total: number }>(cacheKey)
    if (cached) {
      return NextResponse.json(cached, {
        headers: getPrivateCacheHeaders(15, 30),
      })
    }

    // ─── Cache miss: fetch from MongoDB ─────────────────────
    const { db } = await connectToDatabase()

    let query: any = { published: true }
    if (category) query.category = category
    if (level) query.level = level
    if (departmentId) {
      try { query.departmentId = new ObjectId(departmentId) } catch { query.departmentId = departmentId }
    }
    if (recommended === 'true') query.recommended = true
    if (recent === 'true') {
      const threeDaysAgo = new Date()
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
      query.createdAt = { $gte: threeDaysAgo }
    }

    // Use MongoDB projection to exclude heavy lesson content fields at query level
    const courses = await db.collection('courses')
      .find(query, {
        projection: {
          'lessonsData.content': 0,
          'lessonsData.images': 0,
          'lessonsData.videoUrl': 0,
          'lessonsData.quizData': 0,
          'lessonsData.flashcardData': 0,
          'lessonsData.simulationData': 0,
        }
      })
      .sort({ rating: -1, students: -1 })
      .toArray()

    // Batch aggregation: get student counts for ALL courses in 1 query
    const courseIds = courses.map(c => c._id)
    const courseIdsStr = courseIds.map(id => id.toString())

    // Get user enrollment status
    if (authUserId) {
      try {
        const ObjectIdLib = (await import('mongodb')).ObjectId
        const userIdQueries: any[] = [authUserId]
        try { if (ObjectIdLib.isValid(authUserId)) userIdQueries.push(new ObjectIdLib(authUserId)) } catch {}
        const enrollments = await db.collection('enrollments').find({
          userId: { $in: userIdQueries }
        }).toArray()
        enrolledCourseIds = new Set(enrollments.map((e: any) => e.courseId.toString()))
        for (const e of enrollments) {
          enrollmentMap.set(e.courseId.toString(), e)
        }
      } catch { /* ignore */ }
    }

    // Batch queries: enrollment counts + approved payments in parallel
    const [enrollmentCounts, approvedPayments] = await Promise.all([
      db.collection('enrollments').aggregate([
        { $match: { courseId: { $in: courseIds } } },
        { $group: { _id: '$courseId', count: { $sum: 1 } } }
      ]).toArray(),
      authUserId ? db.collection('payments').find({
        userId: authUserId,
        courseId: { $in: courseIdsStr },
        status: 'approved',
      }).toArray() : Promise.resolve([])
    ])

    // Build lookup maps for O(1) access
    const studentCountMap = new Map(enrollmentCounts.map(e => [e._id.toString(), e.count]))
    const approvedPaymentCourseIds = new Set(approvedPayments.map((p: any) => p.courseId?.toString()))

    // Process courses with pre-computed data
    const coursesWithStats = courses.map((course) => {
      const courseIdStr = course._id.toString()
      const studentCount = studentCountMap.get(courseIdStr) || course.students || 0
      let isEnrolled = enrolledCourseIds.has(courseIdStr)
      const isCourseFree = course.price === 0

      if (!isEnrolled && !isCourseFree && approvedPaymentCourseIds.has(courseIdStr)) {
        isEnrolled = true
      }

      const lessonsMetadata = (course.lessonsData || []).map((lesson: any) => ({
        ...stripLessonMetadata(lesson),
        isLocked: !(isCourseFree || isEnrolled || lesson.isFree),
      }))

      const enrollment = enrollmentMap.get(courseIdStr)
      const isGifted = enrollment?.giftSource === 'admin'

      return {
        ...course,
        id: courseIdStr,
        customId: course.id || null,
        departmentId: course.departmentId?.toString() || null,
        recommended: course.recommended || false,
        students: studentCount,
        lessonsData: lessonsMetadata,
        isEnrolled: isEnrolled || isCourseFree,
        isGifted,
        giftedAt: isGifted ? (enrollment.giftedAt?.toISOString?.() || enrollment.giftedAt) : null,
      }
    })

    // Auto-create enrollments for approved payments (fire-and-forget)
    if (authUserId && approvedPaymentCourseIds.size > 0) {
      for (const courseIdStr of approvedPaymentCourseIds) {
        if (!enrolledCourseIds.has(courseIdStr)) {
          db.collection('enrollments').updateOne(
            { userId: authUserId, courseId: courseIdStr },
            { $setOnInsert: { progress: 0, completedLessons: [], completed: false, enrolledAt: new Date(), updatedAt: new Date() } },
            { upsert: true }
          ).catch(() => {})
        }
      }
    }

    const result = { courses: coursesWithStats, total: coursesWithStats.length }

    // ─── Store in server cache for 30 seconds ─────────────
    cache.set(cacheKey, result, 30000)

    return NextResponse.json(result, {
      headers: getPrivateCacheHeaders(15, 30),
    })
  } catch (error: any) {
    console.error('Get public courses error:', error)
    return NextResponse.json({ error: 'حدث خطأ في جلب الدورات' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    return NextResponse.json({
      message: 'تم التسجيل في الدورة بنجاح',
      courseId: body.courseId,
      enrollmentDate: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to enroll' }, { status: 500 })
  }
}
