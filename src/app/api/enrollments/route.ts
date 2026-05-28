import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase, ObjectId } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'

// GET /api/enrollments - جلب تسجيلات المستخدم
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'رمز غير صالح' }, { status: 401 })

    const { db } = await connectToDatabase()
    const userId = new ObjectId(payload.userId)

    // Get user's confirmed enrollments
    const enrollments = await db.collection('enrollments')
      .find({ userId })
      .toArray()

    const enrolledCourseIds = enrollments.map(e => e.courseId?.toString()).filter(Boolean)

    // Also check for pending payments for specific courses
    const pendingPayments = await db.collection('payments')
      .find({
        userId,
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
    const userId = new ObjectId(payload.userId)

    // Check enrollment
    const enrollment = await db.collection('enrollments').findOne({
      userId,
      courseId: new ObjectId(courseId),
    })

    // Check pending payment
    const pendingPayment = await db.collection('payments').findOne({
      userId,
      status: 'pending',
      plan: 'course',
      courseId: new ObjectId(courseId),
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
    const userId = new ObjectId(payload.userId)
    const courseObjId = new ObjectId(courseId)

    // Check if already enrolled
    const existing = await db.collection('enrollments').findOne({ userId, courseId: courseObjId })
    if (existing) {
      return NextResponse.json({ message: 'مسجل بالفعل', enrollment: existing })
    }

    // Check if the course is free
    const course = await db.collection('courses').findOne({ _id: courseObjId })
    if (!course) {
      return NextResponse.json({ error: 'الدورة غير موجودة' }, { status: 404 })
    }

    // Create enrollment (for free courses or auto-enroll)
    const enrollment = {
      userId,
      courseId: courseObjId,
      progress: 0,
      completedLessons: [],
      completed: false,
      enrolledAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection('enrollments').insertOne(enrollment)

    // Increment student count
    await db.collection('courses').updateOne(
      { _id: courseObjId },
      { $inc: { students: 1 } }
    )

    return NextResponse.json({
      message: 'تم التسجيل بنجاح',
      enrollmentId: result.insertedId,
    }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'حدث خطأ'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
