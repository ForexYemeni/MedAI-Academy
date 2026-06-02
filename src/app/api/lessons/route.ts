import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'

// GET /api/lessons?courseId=xxx
// Returns lessons for a course with proper access control based on enrollment
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const courseId = searchParams.get('courseId')

    if (!courseId) {
      return NextResponse.json({ error: 'courseId is required' }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const { ObjectId } = await import('mongodb')

    // Find the course - try ObjectId first, then string ID fallback
    let course: any = null
    try {
      if (ObjectId.isValid(courseId)) {
        course = await db.collection('courses').findOne({ _id: new ObjectId(courseId) })
      }
    } catch { /* Not a valid ObjectId */ }
    
    // Fallback: try string-based ID match
    if (!course) {
      course = await db.collection('courses').findOne({ _id: courseId as any })
    }
    
    // Last resort: try matching by custom id field
    if (!course) {
      course = await db.collection('courses').findOne({ id: courseId })
    }

    if (!course) {
      return NextResponse.json({ error: 'الدورة غير موجودة' }, { status: 404 })
    }

    const courseStrId = course._id.toString()
    const isCourseFree = course.price === 0
    let isEnrolled = isCourseFree // Free courses = auto enrolled

    // Check enrollment status if user is authenticated
    const authHeader = req.headers.get('Authorization')
    let userId: string | null = null

    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '')
        const authUser = verifyToken(token)
        if (authUser) {
          userId = authUser.id
        }
      } catch { /* ignore auth errors */ }
    }

    if (userId && !isCourseFree) {
      // Check if user has an enrollment record - search with all possible userId/courseId formats
      const ObjectId = (await import('mongodb')).ObjectId
      const userIdQueries: any[] = [userId]
      try { if (ObjectId.isValid(userId)) userIdQueries.push(new ObjectId(userId)) } catch {}
      
      const enrollment = await db.collection('enrollments').findOne({
        userId: { $in: userIdQueries },
        courseId: { $in: [courseId, courseStrId] },
      })
      if (enrollment) {
        isEnrolled = true
      }

      // Also check if there's an approved payment for this course
      if (!isEnrolled) {
        const approvedPayment = await db.collection('payments').findOne({
          userId: { $in: userIdQueries },
          courseId: { $in: [courseId, courseStrId] },
          status: 'approved',
        })
        if (approvedPayment) {
          isEnrolled = true
          // Auto-create enrollment from approved payment
          await db.collection('enrollments').insertOne({
            userId,
            courseId: courseStrId,
            progress: 0,
            completedLessons: [],
            lastAccessedLesson: null,
            completed: false,
            enrolledAt: new Date(),
            updatedAt: new Date(),
          }).catch(() => {})
        }
      }
    }

    // Auto-enroll for free courses when user is authenticated
    if (userId && isCourseFree) {
      const ObjectId2 = (await import('mongodb')).ObjectId
      const userIdQueries2: any[] = [userId]
      try { if (ObjectId2.isValid(userId)) userIdQueries2.push(new ObjectId2(userId)) } catch {}
      
      const existing = await db.collection('enrollments').findOne({
        userId: { $in: userIdQueries2 },
        courseId: { $in: [courseId, courseStrId] },
      })
      if (!existing) {
        await db.collection('enrollments').insertOne({
          userId,
          courseId: courseStrId,
          progress: 0,
          completedLessons: [],
          lastAccessedLesson: null,
          completed: false,
          enrolledAt: new Date(),
          updatedAt: new Date(),
        }).catch(() => {})
      }
    }

    // Get enrollment details for progress info
    let enrollmentProgress: any = null
    if (userId) {
      const ObjectId3 = (await import('mongodb')).ObjectId
      const userIdQueries3: any[] = [userId]
      try { if (ObjectId3.isValid(userId)) userIdQueries3.push(new ObjectId3(userId)) } catch {}
      
      enrollmentProgress = await db.collection('enrollments').findOne({
        userId: { $in: userIdQueries3 },
        courseId: { $in: [courseId, courseStrId] },
      })
    }

    // Get lessons: prefer embedded lessonsData, fallback to lessons collection
    let rawLessons = course.lessonsData || []
    if (rawLessons.length === 0) {
      // Fallback: fetch from lessons collection using courseId
      const { ObjectId: ObjId } = await import('mongodb')
      const courseIdQueries: any[] = [courseStrId]
      try { if (ObjId.isValid(courseStrId)) courseIdQueries.push(new ObjId(courseStrId)) } catch {}
      // Also try matching by custom id field
      if (course.id) courseIdQueries.push(course.id)
      
      rawLessons = await db.collection('lessons').find({
        courseId: { $in: courseIdQueries }
      }).sort({ order: 1 }).toArray()
    }

    // Normalize and filter lessons based on access
    const lessonsData = rawLessons.map((lesson: any) => {
      // Normalize lesson type: 'text' -> 'article' for compatibility
      const normalizedType = lesson.type === 'text' ? 'article' : (lesson.type || 'article')

      // Normalize duration: convert string like '60 دقيقة' to number
      let normalizedDuration = lesson.duration
      if (typeof normalizedDuration === 'string') {
        const numMatch = normalizedDuration.match(/(\d+)/)
        normalizedDuration = numMatch ? parseInt(numMatch[1]) : 15
      }
      if (typeof normalizedDuration !== 'number' || isNaN(normalizedDuration)) {
        normalizedDuration = 15
      }

      // Ensure titleAr fallback
      const normalizedTitleAr = lesson.titleAr || lesson.title || ''

      const normalizedLesson = {
        ...lesson,
        type: normalizedType,
        duration: normalizedDuration,
        titleAr: normalizedTitleAr,
      }

      if (isEnrolled || lesson.isFree || isCourseFree) {
        return { ...normalizedLesson, isLocked: false }
      } else {
        const { content, videoUrl, quizData, flashcardData, simulationData, images, ...metaOnly } = normalizedLesson
        return { ...metaOnly, isLocked: true }
      }
    })

    return NextResponse.json({
      success: true,
      lessons: lessonsData,
      course: {
        id: course._id?.toString(),
        titleAr: course.titleAr,
        title: course.title,
        isPremium: course.isPremium,
        price: course.price,
        isEnrolled,
      },
      enrollment: enrollmentProgress ? {
        progress: enrollmentProgress.progress || 0,
        completedLessons: enrollmentProgress.completedLessons || [],
        lastAccessedLesson: enrollmentProgress.lastAccessedLesson || null,
      } : null,
    })
  } catch (error: any) {
    console.error('Get lessons error:', error)
    return NextResponse.json({ error: 'حدث خطأ في جلب الدروس' }, { status: 500 })
  }
}
