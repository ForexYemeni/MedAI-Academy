import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { verifyToken } from '@/lib/auth'
import type { DBCourse, DBLesson } from '@/lib/mongodb-schema'

// GET /api/courses/manage - جلب جميع الدورات (للأدمن والمدرب)
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'رمز غير صالح' }, { status: 401 })

    const { db } = await connectToDatabase()
    const { searchParams } = new URL(req.url)
    
    const published = searchParams.get('published')
    const category = searchParams.get('category')

    const filter: Record<string, unknown> = {}
    if (published !== null) filter.published = published === 'true'
    if (category) filter.category = category

    // If not admin, only show own courses
    if (payload.role !== 'admin') {
      filter.instructorId = new ObjectId(payload.userId)
    }

    const courses = await db.collection('courses')
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({ courses })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'حدث خطأ'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST /api/courses/manage - إنشاء دورة جديدة
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'رمز غير صالح' }, { status: 401 })

    if (payload.role !== 'admin' && payload.role !== 'instructor') {
      return NextResponse.json({ error: 'ليس لديك صلاحية لإنشاء دورات' }, { status: 403 })
    }

    const body = await req.json()
    const { title, titleAr, description, descriptionAr, category, level, price, isPremium, tags, type } = body

    if (!titleAr || !descriptionAr || !category) {
      return NextResponse.json({ error: 'العنوان والوصف والتصنيف مطلوبون' }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Get instructor name
    const instructor = await db.collection('users').findOne({ _id: new ObjectId(payload.userId) })

    const newCourse: DBCourse = {
      title: title || titleAr,
      titleAr,
      description: description || descriptionAr,
      descriptionAr,
      category,
      instructorId: new ObjectId(payload.userId),
      instructorName: instructor?.name || 'مدرب',
      thumbnail: '',
      rating: 0,
      totalRatings: 0,
      students: 0,
      duration: '0 ساعة',
      totalHours: 0,
      level: level || 'beginner',
      price: price || 0,
      isPremium: isPremium || false,
      lessonsCount: 0,
      tags: tags || [],
      published: false,
      type: type || 'mixed',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection('courses').insertOne(newCourse)

    return NextResponse.json({
      message: 'تم إنشاء الدورة بنجاح! أضف الدروس الآن',
      courseId: result.insertedId,
      course: { _id: result.insertedId, ...newCourse },
    }, { status: 201 })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'حدث خطأ'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// PUT /api/courses/manage - تحديث دورة
export async function PUT(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'رمز غير صالح' }, { status: 401 })

    const body = await req.json()
    const { courseId, ...updates } = body

    if (!courseId) {
      return NextResponse.json({ error: 'معرف الدورة مطلوب' }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    updates.updatedAt = new Date()

    await db.collection('courses').updateOne(
      { _id: new ObjectId(courseId) },
      { $set: updates }
    )

    return NextResponse.json({ message: 'تم تحديث الدورة بنجاح' })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'حدث خطأ'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE /api/courses/manage - حذف دورة
export async function DELETE(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'رمز غير صالح' }, { status: 401 })

    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'فقط المسؤول يمكنه حذف الدورات' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const courseId = searchParams.get('courseId')

    if (!courseId) {
      return NextResponse.json({ error: 'معرف الدورة مطلوب' }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Delete course and its lessons
    await db.collection('courses').deleteOne({ _id: new ObjectId(courseId) })
    await db.collection('lessons').deleteMany({ courseId: new ObjectId(courseId) })
    await db.collection('enrollments').deleteMany({ courseId: new ObjectId(courseId) })

    return NextResponse.json({ message: 'تم حذف الدورة وجميع دروسها بنجاح' })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'حدث خطأ'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
