import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { ObjectId } from 'mongodb'

// GET /api/enrollment/progress?all=true - Get all user enrollments (OPTIMIZED: batch queries)
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
      // 1. Get all enrollments for the user (single query)
      const enrollments = await db.collection('enrollments')
        .find({ userId: authUser.id })
        .toArray()

      if (enrollments.length === 0) {
        return NextResponse.json({ success: true, enrollments: [] })
      }

      // 2. Collect all course IDs for batch lookup
      const courseIds: string[] = []
      const objectIds: ObjectId[] = []
      for (const e of enrollments) {
        const cid = e.courseId?.toString() || ''
        courseIds.push(cid)
        try { if (ObjectId.isValid(cid)) objectIds.push(new ObjectId(cid)) } catch {}
      }

      // 3. Batch fetch courses (single query instead of N queries)
      const courseQuery = objectIds.length > 0
        ? { $or: [{ _id: { $in: objectIds } }, { id: { $in: courseIds } }] }
        : { id: { $in: courseIds } }
      const coursesArray = await db.collection('courses')
        .find(courseQuery, {
          projection: {
            titleAr: 1, title: 1, category: 1, level: 1, price: 1,
            'lessonsData.id': 1, // only count lessons, skip heavy content
          }
        })
        .toArray()

      // Build course lookup map (O(1) access)
      const courseMap = new Map<string, any>()
      for (const c of coursesArray) {
        courseMap.set(c._id.toString(), c)
        if (c.id) courseMap.set(c.id, c)
      }

      // 4. Batch fetch approved payments (single query instead of N queries)
      const paymentCourseIds = [...courseIds, ...objectIds.map(oid => oid.toString())]
      const approvedPayments = await db.collection('payments')
        .find({
          userId: authUser.id,
          courseId: { $in: paymentCourseIds },
          status: 'approved',
        })
        .toArray()

      // Build approved payment lookup set
      const approvedPaymentSet = new Set<string>()
      for (const p of approvedPayments) {
        approvedPaymentSet.add(p.courseId?.toString() || '')
      }

      // 5. Enrich enrollments using pre-fetched data (no additional DB queries)
      const enrichedEnrollments = enrollments.map((e) => {
        const courseId = e.courseId?.toString() || ''
        const course = courseMap.get(courseId)
        const isGifted = e.giftSource === 'admin'
        const hasApprovedPayment = approvedPaymentSet.has(courseId) || approvedPaymentSet.has(course?._id?.toString() || '')

        // Determine subscription type
        let subscriptionType = 'free'
        if (isGifted) {
          subscriptionType = 'gift'
        } else if (hasApprovedPayment) {
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
      })

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
