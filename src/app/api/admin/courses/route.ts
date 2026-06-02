import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { cache, buildAdminCoursesCacheKey, getPrivateCacheHeaders } from '@/lib/cache'

// Strip heavy fields from lesson data for list view (saves ~95% bandwidth)
function stripLessonMetadata(lesson: any) {
  const { content, images, videoUrl, quizData, flashcardData, simulationData, ...meta } = lesson
  return meta
}

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

    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const published = searchParams.get('published')
    const full = searchParams.get('full') === 'true'

    // ─── Check server-side cache FIRST ──────────────────────
    const cacheKey = buildAdminCoursesCacheKey({ category, published, full })
    const cached = cache.get<{ success: boolean; courses: any[] }>(cacheKey)
    if (cached) {
      return NextResponse.json(cached, {
        headers: getPrivateCacheHeaders(10, 20),
      })
    }

    // ─── Cache miss: fetch from MongoDB ─────────────────────
    const { db } = await connectToDatabase()

    let query: any = {}
    if (category) query.category = category
    if (published !== null) query.published = published === 'true'

    // Always use projection unless full=true is explicitly requested
    const projection = full ? {} : {
      'lessonsData.content': 0,
      'lessonsData.images': 0,
      'lessonsData.videoUrl': 0,
      'lessonsData.quizData': 0,
      'lessonsData.flashcardData': 0,
      'lessonsData.simulationData': 0,
    }

    const courses = await db.collection('courses')
      .find(query, { projection })
      .sort({ createdAt: -1 })
      .toArray()

    // Batch aggregation: get student counts and revenues for ALL courses
    const courseIds = courses.map(c => c._id)
    const courseIdsStr = courseIds.map(id => id.toString())

    const [enrollmentCounts, revenueResults] = await Promise.all([
      db.collection('enrollments').aggregate([
        { $match: { courseId: { $in: courseIds } } },
        { $group: { _id: '$courseId', count: { $sum: 1 } } }
      ]).toArray(),
      db.collection('payments').aggregate([
        { $match: { courseId: { $in: courseIdsStr }, status: 'approved' } },
        { $group: { _id: '$courseId', total: { $sum: '$amount' } } }
      ]).toArray()
    ])

    const enrollmentMap = new Map(enrollmentCounts.map(e => [e._id.toString(), e.count]))
    const revenueMap = new Map(revenueResults.map(r => [r._id, r.total]))

    // For courses with empty lessonsData, get lesson count from separate collection
    const coursesWithEmptyLessons = courses.filter(c => !c.lessonsData || c.lessonsData.length === 0)
    let separateLessonCounts: Map<string, number> = new Map()
    let separateLessonMetadata: Map<string, any[]> = new Map()

    if (coursesWithEmptyLessons.length > 0) {
      const allCourseIdQueries: string[] = []
      for (const course of coursesWithEmptyLessons) {
        allCourseIdQueries.push(course._id.toString())
        if (course.id) allCourseIdQueries.push(course.id)
      }

      const separateLessons = await db.collection('lessons')
        .find({ courseId: { $in: allCourseIdQueries } })
        .sort({ order: 1 })
        .toArray()

      for (const course of coursesWithEmptyLessons) {
        const courseIdStr = course._id.toString()
        const courseIdQueries = [courseIdStr]
        if (course.id) courseIdQueries.push(course.id)

        const courseLessons = separateLessons.filter((l: any) =>
          courseIdQueries.includes(l.courseId)
        )
        separateLessonCounts.set(courseIdStr, courseLessons.length)
        separateLessonMetadata.set(courseIdStr, courseLessons.map(stripLessonMetadata))
      }
    }

    const coursesWithStats = courses.map(course => {
      const courseIdStr = course._id.toString()
      const hasEmptyLessons = !course.lessonsData || course.lessonsData.length === 0

      let finalLessonsData = course.lessonsData || []
      let lessonsCount = course.lessons || (course.lessonsData?.length || 0)

      if (hasEmptyLessons) {
        const metadata = separateLessonMetadata.get(courseIdStr)
        if (metadata && metadata.length > 0) {
          finalLessonsData = metadata
          lessonsCount = separateLessonCounts.get(courseIdStr) || metadata.length
        }
      } else if (!full) {
        finalLessonsData = (course.lessonsData || []).map(stripLessonMetadata)
      }

      return {
        ...course,
        lessonsData: finalLessonsData,
        lessons: lessonsCount,
        studentCount: enrollmentMap.get(courseIdStr) || 0,
        revenue: revenueMap.get(courseIdStr) || 0,
      }
    })

    const result = { success: true, courses: coursesWithStats }

    // ─── Store in server cache for 20 seconds ──────────────
    cache.set(cacheKey, result, 20000)

    return NextResponse.json(result, {
      headers: getPrivateCacheHeaders(10, 20),
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
    const { title, titleAr, description, descriptionAr, category, level, price, isPremium, lessonsData, thumbnail, instructor, instructorName, published, departmentId, recommended } = body

    if (!title || !titleAr || !category) {
      return NextResponse.json({ error: 'العنوان والتصنيف مطلوبان' }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const { ObjectId } = await import('mongodb')

    const course: any = {
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
      recommended: recommended || false,
      published: published || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    if (departmentId) {
      course.departmentId = new ObjectId(departmentId)
    }

    const result = await db.collection('courses').insertOne(course)

    // Invalidate all course caches
    cache.invalidateCourses()

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

    if ('departmentId' in updates) {
      if (updates.departmentId) {
        updates.departmentId = new ObjectId(updates.departmentId)
      } else {
        delete updates.departmentId
        await db.collection('courses').updateOne(
          { _id: new ObjectId(courseId) },
          { $unset: { departmentId: '' } }
        )
      }
    }

    if (updates.lessonsData) {
      updates.lessons = updates.lessonsData.length
    }
    
    if (updates.price === 0) {
      const existingCourse = await db.collection('courses').findOne({ _id: new ObjectId(courseId) })
      if (existingCourse && existingCourse.price > 0) {
        const lessonsData = updates.lessonsData || existingCourse.lessonsData || []
        updates.lessonsData = lessonsData.map((lesson: any) => ({
          ...lesson,
          isFree: true,
        }))
        updates.isPremium = false
        updates.lessons = updates.lessonsData.length
      }
    }
    
    updates.updatedAt = new Date()

    await db.collection('courses').updateOne(
      { _id: new ObjectId(courseId) },
      { $set: updates }
    )

    // Invalidate all course caches
    cache.invalidateCourses()

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

    // Invalidate all course caches
    cache.invalidateCourses()

    return NextResponse.json({
      success: true,
      message: 'تم حذف الدورة بنجاح',
    })
  } catch (error: any) {
    console.error('Delete course error:', error)
    return NextResponse.json({ error: 'حدث خطأ في حذف الدورة' }, { status: 500 })
  }
}
