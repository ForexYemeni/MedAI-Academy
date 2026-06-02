import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'

// POST /api/courses/bulk-add - Add a complete course with lessons (admin only)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { course } = body

    if (!course || !course.titleAr || !course.lessonsData) {
      return NextResponse.json({ error: 'بيانات الدورة غير مكتملة' }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Insert the course directly
    const result = await db.collection('courses').insertOne(course)

    // Verify
    const verify = await db.collection('courses').findOne({ _id: result.insertedId })

    return NextResponse.json({
      success: true,
      message: 'تم إنشاء الدورة بنجاح',
      courseId: result.insertedId.toString(),
      courseTitle: verify?.titleAr,
      lessonsCount: verify?.lessonsData?.length || 0,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'حدث خطأ'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
