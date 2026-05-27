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

    // Find the course
    let course: any = null
    try {
      course = await db.collection('courses').findOne({ _id: new ObjectId(courseId) })
    } catch {
      // Not a valid ObjectId
    }

    if (!course) {
      return NextResponse.json({ error: 'الدورة غير موجودة' }, { status: 404 })
    }

    const isCourseFree = course.price === 0 || !course.isPremium
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
      // Check if user has an enrollment record
      const courseStrId = course._id.toString()
      const enrollment = await db.collection('enrollments').findOne({
        $or: [
          { userId, courseId: courseStrId },
          { userId: new ObjectId(userId), courseId: course._id },
          { userId, courseId: course._id },
        ]
      })
      if (enrollment) {
        isEnrolled = true
      }

      // Also check if there's an approved payment for this course
      if (!isEnrolled) {
        const approvedPayment = await db.collection('payments').findOne({
          userId,
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
      const courseStrId = course._id.toString()
      const existing = await db.collection('enrollments').findOne({
        $or: [
          { userId, courseId: courseStrId },
          { userId: new ObjectId(userId), courseId: course._id },
        ]
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
      const courseStrId = course._id.toString()
      enrollmentProgress = await db.collection('enrollments').findOne({
        $or: [
          { userId, courseId: { $in: [courseId, courseStrId] } },
          { userId: new ObjectId(userId), courseId: course._id },
        ]
      })
    }

    // Filter lessons based on access
    const lessonsData = (course.lessonsData || []).map((lesson: any) => {
      if (isEnrolled || lesson.isFree || isCourseFree) {
        return { ...lesson, isLocked: false }
      } else {
        const { content, videoUrl, ...metaOnly } = lesson
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
