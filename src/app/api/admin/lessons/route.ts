import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'

// إضافة درس لدورة
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    
    const authUser = verifyToken(token)
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 })
    }

    const { courseId, lesson } = await req.json()
    if (!courseId || !lesson) {
      return NextResponse.json({ error: 'معرف الدورة وبيانات الدرس مطلوبان' }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const { ObjectId } = await import('mongodb')

    const course = await db.collection('courses').findOne({ _id: new ObjectId(courseId) })
    if (!course) {
      return NextResponse.json({ error: 'الدورة غير موجودة' }, { status: 404 })
    }

    // إضافة الدرس للقائمة
    const lessonsData = course.lessonsData || []
    lesson.id = `lesson-${Date.now()}`
    lesson.order = lessonsData.length + 1
    lessonsData.push(lesson)

    await db.collection('courses').updateOne(
      { _id: new ObjectId(courseId) },
      {
        $set: {
          lessonsData,
          lessons: lessonsData.length,
          updatedAt: new Date(),
        }
      }
    )

    return NextResponse.json({
      success: true,
      lessonId: lesson.id,
      message: 'تم إضافة الدرس بنجاح',
    })
  } catch (error: any) {
    console.error('Add lesson error:', error)
    return NextResponse.json({ error: 'حدث خطأ في إضافة الدرس' }, { status: 500 })
  }
}

// تعديل درس
export async function PUT(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    
    const authUser = verifyToken(token)
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 })
    }

    const { courseId, lessonId, updates } = await req.json()
    if (!courseId || !lessonId || !updates) {
      return NextResponse.json({ error: 'بيانات غير كافية' }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const { ObjectId } = await import('mongodb')

    const course = await db.collection('courses').findOne({ _id: new ObjectId(courseId) })
    if (!course) {
      return NextResponse.json({ error: 'الدورة غير موجودة' }, { status: 404 })
    }

    const lessonsData = (course.lessonsData || []).map((l: any) =>
      l.id === lessonId ? { ...l, ...updates } : l
    )

    await db.collection('courses').updateOne(
      { _id: new ObjectId(courseId) },
      {
        $set: {
          lessonsData,
          updatedAt: new Date(),
        }
      }
    )

    return NextResponse.json({
      success: true,
      message: 'تم تعديل الدرس بنجاح',
    })
  } catch (error: any) {
    console.error('Update lesson error:', error)
    return NextResponse.json({ error: 'حدث خطأ في تعديل الدرس' }, { status: 500 })
  }
}

// حذف درس
export async function DELETE(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    
    const authUser = verifyToken(token)
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 })
    }

    const { courseId, lessonId } = await req.json()
    if (!courseId || !lessonId) {
      return NextResponse.json({ error: 'بيانات غير كافية' }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const { ObjectId } = await import('mongodb')

    const course = await db.collection('courses').findOne({ _id: new ObjectId(courseId) })
    if (!course) {
      return NextResponse.json({ error: 'الدورة غير موجودة' }, { status: 404 })
    }

    const lessonsData = (course.lessonsData || []).filter((l: any) => l.id !== lessonId)
    // إعادة ترتيب الدروس
    lessonsData.forEach((l: any, i: number) => { l.order = i + 1 })

    await db.collection('courses').updateOne(
      { _id: new ObjectId(courseId) },
      {
        $set: {
          lessonsData,
          lessons: lessonsData.length,
          updatedAt: new Date(),
        }
      }
    )

    return NextResponse.json({
      success: true,
      message: 'تم حذف الدرس بنجاح',
    })
  } catch (error: any) {
    console.error('Delete lesson error:', error)
    return NextResponse.json({ error: 'حدث خطأ في حذف الدرس' }, { status: 500 })
  }
}
