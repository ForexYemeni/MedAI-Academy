import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { cache } from '@/lib/cache'

// Helper: determine if a course uses the separate 'lessons' collection
async function usesSeparateLessonsCollection(db: any, courseId: string): Promise<boolean> {
  const { ObjectId } = await import('mongodb')
  const course = await db.collection('courses').findOne({ _id: new ObjectId(courseId) })
  if (!course) return false
  // If lessonsData is empty or doesn't exist, check if there are lessons in the separate collection
  if (!course.lessonsData || course.lessonsData.length === 0) {
    const courseIdQueries: string[] = [courseId]
    if (course.id) courseIdQueries.push(course.id)
    const count = await db.collection('lessons').countDocuments({
      courseId: { $in: courseIdQueries }
    })
    return count > 0
  }
  return false
}

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

    // Determine which storage to use
    const useSeparate = await usesSeparateLessonsCollection(db, courseId)

    if (useSeparate) {
      // Add to separate 'lessons' collection
      const existingCount = await db.collection('lessons').countDocuments({
        courseId: { $in: [courseId, ...(course.id ? [course.id] : [])] }
      })
      lesson.id = `lesson-${Date.now()}`
      lesson.order = existingCount + 1
      lesson.courseId = courseId
      lesson.createdAt = new Date()

      await db.collection('lessons').insertOne(lesson)

      // Update course lesson count
      await db.collection('courses').updateOne(
        { _id: new ObjectId(courseId) },
        {
          $set: {
            lessons: existingCount + 1,
            updatedAt: new Date(),
          }
        }
      )
    } else {
      // Add to embedded lessonsData
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
    }

    // Invalidate all course caches after lesson mutation
    cache.invalidateCourses()

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

    const useSeparate = await usesSeparateLessonsCollection(db, courseId)

    if (useSeparate) {
      // Update in separate 'lessons' collection
      const courseIdQueries: string[] = [courseId]
      if (course.id) courseIdQueries.push(course.id)
      
      await db.collection('lessons').updateOne(
        { courseId: { $in: courseIdQueries }, id: lessonId },
        { $set: { ...updates, updatedAt: new Date() } }
      )
    } else {
      // Update in embedded lessonsData
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
    }

    // Invalidate all course caches after lesson mutation
    cache.invalidateCourses()

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

    const useSeparate = await usesSeparateLessonsCollection(db, courseId)

    if (useSeparate) {
      // Delete from separate 'lessons' collection
      const courseIdQueries: string[] = [courseId]
      if (course.id) courseIdQueries.push(course.id)

      await db.collection('lessons').deleteOne({
        courseId: { $in: courseIdQueries },
        id: lessonId,
      })

      // Re-order remaining lessons
      const remainingLessons = await db.collection('lessons')
        .find({ courseId: { $in: courseIdQueries } })
        .sort({ order: 1 })
        .toArray()

      for (let i = 0; i < remainingLessons.length; i++) {
        await db.collection('lessons').updateOne(
          { _id: remainingLessons[i]._id },
          { $set: { order: i + 1 } }
        )
      }

      // Update course lesson count
      await db.collection('courses').updateOne(
        { _id: new ObjectId(courseId) },
        {
          $set: {
            lessons: remainingLessons.length,
            updatedAt: new Date(),
          }
        }
      )
    } else {
      // Delete from embedded lessonsData
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
    }

    // Invalidate all course caches after lesson mutation
    cache.invalidateCourses()

    return NextResponse.json({
      success: true,
      message: 'تم حذف الدرس بنجاح',
    })
  } catch (error: any) {
    console.error('Delete lesson error:', error)
    return NextResponse.json({ error: 'حدث خطأ في حذف الدرس' }, { status: 500 })
  }
}
