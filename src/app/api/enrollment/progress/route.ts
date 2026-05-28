import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { ObjectId } from 'mongodb'

// GET /api/enrollment/progress?all=true - Get all user enrollments
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول أولاً' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const authUser = verifyToken(token)
    if (!authUser) {
      return NextResponse.json({ error: 'رمز المصادقة غير صالح' }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const url = new URL(req.url)
    const all = url.searchParams.get('all')

    if (all === 'true') {
      // Get all enrollments for the user
      const enrollments = await db.collection('enrollments')
        .find({ userId: authUser.id })
        .toArray()

      // Enrich each enrollment with course details and payment info
      const enrichedEnrollments = await Promise.all(enrollments.map(async (e) => {
        const courseId = e.courseId?.toString() || ''

        // Fetch course details
        let course: any = null
        try {
          if (ObjectId.isValid(courseId)) {
            course = await db.collection('courses').findOne({ _id: new ObjectId(courseId) })
          }
        } catch { /* ignore */ }
        if (!course) {
          course = await db.collection('courses').findOne({ id: courseId })
        }

        // Check if this was a gift
        const isGifted = e.giftSource === 'admin'

        // Check if there's an approved payment for this enrollment
        let paymentInfo: any = null
        if (!isGifted) {
          paymentInfo = await db.collection('payments').findOne({
            userId: authUser.id,
            courseId: { $in: [courseId, course?._id?.toString()] },
            status: 'approved',
          })
        }

        // Determine subscription type
        let subscriptionType = 'free' // free course
        if (isGifted) {
          subscriptionType = 'gift'
        } else if (paymentInfo) {
          subscriptionType = 'paid'
        } else if (course && course.price > 0) {
          subscriptionType = 'paid'
        }

        return {
          _id: e._id?.toString() || '',
          courseId,
          courseName: course?.titleAr || course?.title || courseId,
          courseNameAr: course?.titleAr || course?.title || '',
          category: course?.category || '',
          level: course?.level || '',
          price: course?.price || 0,
          isGifted,
          giftedAt: isGifted ? (e.giftedAt?.toISOString?.() || e.giftedAt) : null,
          subscriptionType,
          status: e.completed ? 'completed' : 'active',
          enrolledAt: e.enrolledAt || e.createdAt || new Date().toISOString(),
          progress: e.progress || 0,
          completedLessons: e.completedLessons || [],
          totalLessons: course?.lessonsData?.length || 0,
          updatedAt: e.updatedAt || null,
        }
      }))

      return NextResponse.json({
        success: true,
        enrollments: enrichedEnrollments,
      })
    }

    return NextResponse.json({ success: true, enrollments: [] })
  } catch (error: any) {
    console.error('Fetch enrollments error:', error)
    return NextResponse.json({ error: 'حدث خطأ في جلب التقدم' }, { status: 500 })
  }
}

// POST /api/enrollment/progress - Mark lesson as complete
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول أولاً' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const authUser = verifyToken(token)
    if (!authUser) {
      return NextResponse.json({ error: 'رمز المصادقة غير صالح' }, { status: 401 })
    }

    const body = await req.json()
    const { courseId, lessonId } = body

    if (!courseId || !lessonId) {
      return NextResponse.json({ error: 'courseId و lessonId مطلوبان' }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const { ObjectId } = await import('mongodb')

    // Find the course to check if the lesson is free or course is free
    let course: any = null
    try {
      if (ObjectId.isValid(courseId)) {
        course = await db.collection('courses').findOne({ _id: new ObjectId(courseId) })
      }
    } catch { /* ignore */ }
    if (!course) {
      course = await db.collection('courses').findOne({ id: courseId })
    }

    if (!course) {
      return NextResponse.json({ error: 'الدورة غير موجودة' }, { status: 404 })
    }

    // Find the lesson
    const lesson = (course.lessonsData || []).find((l: any) => l.id === lessonId)
    const isCourseFree = course.price === 0
    const isLessonFree = lesson?.isFree ?? false

    // Check enrollment for paid courses
    if (!isCourseFree && !isLessonFree) {
      const enrollment = await db.collection('enrollments').findOne({
        userId: authUser.id,
        courseId: { $in: [courseId, course._id.toString()] },
      })
      
      if (!enrollment) {
        // Also check approved payments
        const approvedPayment = await db.collection('payments').findOne({
          userId: authUser.id,
          courseId: { $in: [courseId, course._id.toString()] },
          status: 'approved',
        })
        
        if (!approvedPayment) {
          return NextResponse.json({ error: 'غير مسجل في هذه الدورة' }, { status: 403 })
        }
      }
    }

    // Auto-enroll for free courses if not enrolled
    if (isCourseFree) {
      const existing = await db.collection('enrollments').findOne({
        userId: authUser.id,
        courseId: { $in: [courseId, course._id.toString()] },
      })
      if (!existing) {
        await db.collection('enrollments').insertOne({
          userId: authUser.id,
          courseId: course._id.toString(),
          progress: 0,
          completedLessons: [],
          lastAccessedLesson: null,
          completed: false,
          enrolledAt: new Date(),
          updatedAt: new Date(),
        }).catch(() => {})
      }
    }

    // Update enrollment with completed lesson
    const courseStrId = course._id.toString()
    const totalLessons = (course.lessonsData || []).length

    await db.collection('enrollments').updateOne(
      {
        userId: authUser.id,
        courseId: { $in: [courseId, courseStrId] },
      },
      {
        $addToSet: { completedLessons: lessonId },
        $set: {
          lastAccessedLesson: lessonId,
          updatedAt: new Date(),
        },
      }
    )

    // Calculate new progress
    const enrollment = await db.collection('enrollments').findOne({
      userId: authUser.id,
      courseId: { $in: [courseId, courseStrId] },
    })

    const completedCount = (enrollment?.completedLessons || []).length
    const progress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0
    const isCompleted = progress >= 100

    await db.collection('enrollments').updateOne(
      {
        userId: authUser.id,
        courseId: { $in: [courseId, courseStrId] },
      },
      {
        $set: {
          progress,
          completed: isCompleted,
          updatedAt: new Date(),
        },
      }
    )

    return NextResponse.json({
      success: true,
      progress,
      completedLessons: enrollment?.completedLessons || [],
      completed: isCompleted,
    })
  } catch (error: any) {
    console.error('Update enrollment progress error:', error)
    return NextResponse.json({ error: 'حدث خطأ في تحديث التقدم' }, { status: 500 })
  }
}
