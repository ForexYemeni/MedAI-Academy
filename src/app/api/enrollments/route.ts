import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { verifyToken } from '@/lib/auth'

// GET /api/enrollments - جلب تسجيلات المستخدم
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'رمز غير صالح' }, { status: 401 })

    const { db } = await connectToDatabase()
    const userId = payload.id

    // Search for enrollments with both string and ObjectId userId (backward compatibility)
    const userIdQueries: (string | ObjectId)[] = [userId]
    try { if (ObjectId.isValid(userId)) userIdQueries.push(new ObjectId(userId)) } catch {}

    // Get user's confirmed enrollments
    const enrollments = await db.collection('enrollments')
      .find({ userId: { $in: userIdQueries } })
      .toArray()

    const enrolledCourseIds = enrollments.map(e => e.courseId?.toString()).filter(Boolean)

    // Also check for pending payments for specific courses
    const pendingPayments = await db.collection('payments')
      .find({
        userId: { $in: userIdQueries },
        status: 'pending',
        plan: 'course',
        courseId: { $exists: true, $ne: null },
      })
      .toArray()

    const pendingCourseIds = pendingPayments.map(p => p.courseId?.toString()).filter(Boolean)

    return NextResponse.json({
      enrolledCourseIds,
      pendingCourseIds,
      enrollments,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'حدث خطأ'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST /api/enrollments - التحقق من تسجيل المستخدم في دورة محددة
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'رمز غير صالح' }, { status: 401 })

    const body = await req.json()
    const { courseId } = body

    if (!courseId) {
      return NextResponse.json({ error: 'معرف الدورة مطلوب' }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const userId = payload.id

    // Search with both string and ObjectId for backward compatibility
    const userIdQueries: (string | ObjectId)[] = [userId]
    try { if (ObjectId.isValid(userId)) userIdQueries.push(new ObjectId(userId)) } catch {}

    const courseIdQueries: (string | ObjectId)[] = [courseId]
    try { if (ObjectId.isValid(courseId)) courseIdQueries.push(new ObjectId(courseId)) } catch {}

    // Check enrollment
    const enrollment = await db.collection('enrollments').findOne({
      userId: { $in: userIdQueries },
      courseId: { $in: courseIdQueries },
    })

    // Check pending payment
    const pendingPayment = await db.collection('payments').findOne({
      userId: { $in: userIdQueries },
      status: 'pending',
      plan: 'course',
      courseId: { $in: courseIdQueries },
    })

    return NextResponse.json({
      isEnrolled: !!enrollment,
      isPending: !!pendingPayment,
      enrollment: enrollment || null,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'حدث خطأ'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// PUT /api/enrollments - تسجيل مجاني في دورة
export async function PUT(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'رمز غير صالح' }, { status: 401 })

    const body = await req.json()
    const { courseId } = body

    if (!courseId) {
      return NextResponse.json({ error: 'معرف الدورة مطلوب' }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const userId = payload.id

    // Search with both types for backward compatibility
    const userIdQueries: (string | ObjectId)[] = [userId]
    try { if (ObjectId.isValid(userId)) userIdQueries.push(new ObjectId(userId)) } catch {}

    const courseIdQueries: (string | ObjectId)[] = [courseId]
    try { if (ObjectId.isValid(courseId)) courseIdQueries.push(new ObjectId(courseId)) } catch {}

    // Check if already enrolled
    const existing = await db.collection('enrollments').findOne({
      userId: { $in: userIdQueries },
      courseId: { $in: courseIdQueries },
    })
    if (existing) {
      return NextResponse.json({ message: 'مسجل بالفعل', enrollment: existing })
    }

    // Check if the course exists
    let courseObjId: ObjectId | null = null
    try { if (ObjectId.isValid(courseId)) courseObjId = new ObjectId(courseId) } catch {}
    const course = courseObjId
      ? await db.collection('courses').findOne({ _id: courseObjId })
      : await db.collection('courses').findOne({ id: courseId })
    if (!course) {
      return NextResponse.json({ error: 'الدورة غير موجودة' }, { status: 404 })
    }

    // Create enrollment with string userId/courseId for consistency
    const enrollment = {
      userId,
      courseId,
      progress: 0,
      completedLessons: [],
      completed: false,
      enrolledAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection('enrollments').insertOne(enrollment)

    // Increment student count
    if (courseObjId) {
      await db.collection('courses').updateOne(
        { _id: courseObjId },
        { $inc: { students: 1 } }
      )
    }

    return NextResponse.json({
      message: 'تم التسجيل بنجاح',
      enrollmentId: result.insertedId,
    }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'حدث خطأ'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
