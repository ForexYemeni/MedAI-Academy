import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    
    const authUser = verifyToken(token)
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 })
    }

    const { db } = await connectToDatabase()
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const published = searchParams.get('published')

    let query: any = {}
    if (category) query.category = category
    if (published !== null) query.published = published === 'true'

    const courses = await db.collection('courses')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray()

    // إضافة عدد المسجلين لكل دورة
    const coursesWithStats = await Promise.all(
      courses.map(async (course) => {
        const studentCount = await db.collection('enrollments').countDocuments({ courseId: course._id })
        const revenue = await db.collection('payments').aggregate([
          { $match: { courseId: course._id.toString(), status: 'approved' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]).toArray()
        return {
          ...course,
          studentCount,
          revenue: revenue[0]?.total || 0,
        }
      })
    )

    return NextResponse.json({
      success: true,
      courses: coursesWithStats,
    })
  } catch (error: any) {
    console.error('Get courses error:', error)
    return NextResponse.json({ error: 'حدث خطأ في جلب الدورات' }, { status: 500 })
  }
}

// إضافة دورة جديدة
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

    const body = await req.json()
    const { title, titleAr, description, descriptionAr, category, level, price, isPremium, lessonsData, thumbnail, instructor, instructorName, published } = body

    if (!title || !titleAr || !category) {
      return NextResponse.json({ error: 'العنوان والتصنيف مطلوبان' }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const course = {
      title,
      titleAr,
      description: description || '',
      descriptionAr: descriptionAr || '',
      category,
      level: level || 'beginner',
      price: price || 0,
      isPremium: isPremium || false,
      thumbnail: thumbnail || '',
      instructor: instructor || authUser.id,
      instructorName: instructorName || authUser.name,
      rating: 0,
      totalRatings: 0,
      students: 0,
      duration: '0 ساعة',
      totalHours: 0,
      lessons: (lessonsData || []).length,
      lessonsData: lessonsData || [],
      tags: [],
      published: published || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection('courses').insertOne(course)

    return NextResponse.json({
      success: true,
      courseId: result.insertedId,
      message: 'تم إضافة الدورة بنجاح',
    })
  } catch (error: any) {
    console.error('Create course error:', error)
    return NextResponse.json({ error: 'حدث خطأ في إضافة الدورة' }, { status: 500 })
  }
}

// تعديل دورة
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

    const body = await req.json()
    const { courseId, ...updates } = body

    if (!courseId) {
      return NextResponse.json({ error: 'معرف الدورة مطلوب' }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const { ObjectId } = await import('mongodb')

    // تحديث عدد الدروس
    if (updates.lessonsData) {
      updates.lessons = updates.lessonsData.length
    }
    updates.updatedAt = new Date()

    await db.collection('courses').updateOne(
      { _id: new ObjectId(courseId) },
      { $set: updates }
    )

    return NextResponse.json({
      success: true,
      message: 'تم تعديل الدورة بنجاح',
    })
  } catch (error: any) {
    console.error('Update course error:', error)
    return NextResponse.json({ error: 'حدث خطأ في تعديل الدورة' }, { status: 500 })
  }
}

// حذف دورة
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

    const { courseId } = await req.json()
    if (!courseId) {
      return NextResponse.json({ error: 'معرف الدورة مطلوب' }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const { ObjectId } = await import('mongodb')

    await db.collection('courses').deleteOne({ _id: new ObjectId(courseId) })
    await db.collection('enrollments').deleteMany({ courseId: new ObjectId(courseId) })

    return NextResponse.json({
      success: true,
      message: 'تم حذف الدورة بنجاح',
    })
  } catch (error: any) {
    console.error('Delete course error:', error)
    return NextResponse.json({ error: 'حدث خطأ في حذف الدورة' }, { status: 500 })
  }
}
