import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase, ObjectId } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import type { DBLesson } from '@/lib/mongodb-schema'

// GET - جلب دروس دورة معينة
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    
    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'رمز غير صالح' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const courseId = searchParams.get('courseId')

    if (!courseId) return NextResponse.json({ error: 'معرف الدورة مطلوب' }, { status: 400 })

    const { db } = await connectToDatabase()
    const lessons = await db.collection('lessons')
      .find({ courseId: new ObjectId(courseId) })
      .sort({ order: 1 })
      .toArray()

    return NextResponse.json({ lessons })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'حدث خطأ'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST - إضافة درس جديد
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'رمز غير صالح' }, { status: 401 })

    const body = await req.json()
    const { courseId, titleAr, type, content, videoUrl, videoType, pdfUrl, pdfName, duration, isFree, order } = body

    if (!courseId || !titleAr || !type) {
      return NextResponse.json({ error: 'معرف الدورة وعنوان الدرس ونوعه مطلوبون' }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const course = await db.collection('courses').findOne({ _id: new ObjectId(courseId) })
    if (!course) return NextResponse.json({ error: 'الدورة غير موجودة' }, { status: 404 })

    let lessonOrder = order
    if (!lessonOrder && lessonOrder !== 0) {
      const lastLesson = await db.collection('lessons')
        .find({ courseId: new ObjectId(courseId) })
        .sort({ order: -1 })
        .limit(1)
        .toArray()
      lessonOrder = lastLesson.length > 0 ? lastLesson[0].order + 1 : 1
    }

    const newLesson: DBLesson = {
      courseId: new ObjectId(courseId),
      title: titleAr,
      titleAr,
      type,
      order: lessonOrder,
      content: content || '',
      videoUrl: videoUrl || '',
      videoType: videoType || 'youtube',
      pdfUrl: pdfUrl || '',
      pdfName: pdfName || '',
      duration: duration || 0,
      isFree: isFree || false,
      published: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection('lessons').insertOne(newLesson)

    await db.collection('courses').updateOne(
      { _id: new ObjectId(courseId) },
      { $inc: { lessonsCount: 1 }, $set: { updatedAt: new Date() } }
    )

    return NextResponse.json({
      message: 'تم إضافة الدرس بنجاح',
      lessonId: result.insertedId,
      lesson: { _id: result.insertedId, ...newLesson },
    }, { status: 201 })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'حدث خطأ'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// PUT - تحديث درس
export async function PUT(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'رمز غير صالح' }, { status: 401 })

    const body = await req.json()
    const { lessonId, ...updates } = body

    if (!lessonId) return NextResponse.json({ error: 'معرف الدرس مطلوب' }, { status: 400 })

    const { db } = await connectToDatabase()
    updates.updatedAt = new Date()

    // Ensure courseId is converted to ObjectId if present
    if (updates.courseId) {
      updates.courseId = new ObjectId(updates.courseId)
    }

    await db.collection('lessons').updateOne(
      { _id: new ObjectId(lessonId) },
      { $set: updates }
    )

    return NextResponse.json({ message: 'تم تحديث الدرس بنجاح' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'حدث خطأ'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE - حذف درس
export async function DELETE(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'رمز غير صالح' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const lessonId = searchParams.get('lessonId')
    const courseId = searchParams.get('courseId')

    if (!lessonId) return NextResponse.json({ error: 'معرف الدرس مطلوب' }, { status: 400 })

    const { db } = await connectToDatabase()

    await db.collection('lessons').deleteOne({ _id: new ObjectId(lessonId) })

    if (courseId) {
      await db.collection('courses').updateOne(
        { _id: new ObjectId(courseId) },
        { $inc: { lessonsCount: -1 }, $set: { updatedAt: new Date() } }
      )
    }

    return NextResponse.json({ message: 'تم حذف الدرس بنجاح' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'حدث خطأ'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
