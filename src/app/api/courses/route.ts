import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function GET(req: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const level = searchParams.get('level')
    const departmentId = searchParams.get('departmentId')
    const recommended = searchParams.get('recommended')
    const recent = searchParams.get('recent')

    let query: any = { published: true }
    if (category) query.category = category
    if (level) query.level = level
    if (departmentId) {
      try { query.departmentId = new ObjectId(departmentId) } catch { query.departmentId = departmentId }
    }
    if (recommended === 'true') query.recommended = true
    if (recent === 'true') {
      const threeDaysAgo = new Date()
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
      query.createdAt = { $gte: threeDaysAgo }
    }

    const courses = await db.collection('courses')
      .find(query)
      .sort({ rating: -1, students: -1 })
      .toArray()

    // Get user enrollment status if token is provided
    const authHeader = req.headers.get('Authorization')
    let enrolledCourseIds: Set<string> = new Set()
    let enrollmentMap: Map<string, any> = new Map()
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '')
        const { verifyToken } = await import('@/lib/auth')
        const authUser = verifyToken(token)
        if (authUser) {
          // Query enrollments matching both string and ObjectId userId formats
          const ObjectId = (await import('mongodb')).ObjectId
          const userIdQueries = [authUser.id]
          try { if (ObjectId.isValid(authUser.id)) userIdQueries.push(new ObjectId(authUser.id)) } catch {}
          const enrollments = await db.collection('enrollments').find({
            userId: { $in: userIdQueries }
          }).toArray()
          enrolledCourseIds = new Set(enrollments.map((e: any) => e.courseId.toString()))
          // Build enrollment map for gift info
          for (const e of enrollments) {
            enrollmentMap.set(e.courseId.toString(), e)
          }
        }
      } catch { /* ignore auth errors */ }
    }

    // Process courses: add stats and filter lesson content
    const coursesWithStats = await Promise.all(
      courses.map(async (course) => {
        const studentCount = await db.collection('enrollments').countDocuments({ courseId: course._id })
        let isEnrolled = enrolledCourseIds.has(course._id.toString())
        const isCourseFree = course.price === 0
        
        // Also check approved payments for enrollment
        if (!isEnrolled && !isCourseFree && authHeader) {
          try {
            const token = authHeader.replace('Bearer ', '')
            const { verifyToken } = await import('@/lib/auth')
            const authUser = verifyToken(token)
            if (authUser) {
              const approvedPayment = await db.collection('payments').findOne({
                userId: authUser.id,
                courseId: { $in: [course._id.toString()] },
                status: 'approved',
              })
              if (approvedPayment) {
                isEnrolled = true
                // Auto-create enrollment from approved payment
                const existingEnrollment = await db.collection('enrollments').findOne({
                  userId: authUser.id,
                  courseId: course._id.toString(),
                })
                if (!existingEnrollment) {
                  await db.collection('enrollments').insertOne({
                    userId: authUser.id,
                    courseId: course._id.toString(),
                    progress: 0,
                    completedLessons: [],
                    completed: false,
                    enrolledAt: new Date(),
                    updatedAt: new Date(),
                  }).catch(() => {})
                }
              }
            }
          } catch { /* ignore */ }
        }
        
        // Filter lessonsData: include all content for free courses or enrolled courses
        const filteredLessonsData = (course.lessonsData || []).map((lesson: any) => {
          if (isCourseFree || isEnrolled || lesson.isFree) {
            return lesson
          }
          // For non-free lessons in paid courses (not enrolled), exclude content/videoUrl
          const { content, videoUrl, ...metaOnly } = lesson
          return metaOnly
        })

        // Check if this course was gifted by admin
        const enrollment = enrollmentMap.get(course._id.toString())
        const isGifted = enrollment?.giftSource === 'admin'

        // Include lessons from separate collection if lessonsData is empty
        let finalLessonsData = filteredLessonsData
        if ((!finalLessonsData || finalLessonsData.length === 0) && course.id) {
          const separateLessons = await db.collection('lessons').find({
            courseId: { $in: [course.id, course._id.toString()] }
          }).sort({ order: 1 }).toArray()
          finalLessonsData = separateLessons.map((lesson: any) => {
            if (isCourseFree || isEnrolled || lesson.isFree) {
              return lesson
            }
            const { content, videoUrl, quizData, flashcardData, simulationData, images, ...metaOnly } = lesson
            return metaOnly
          })
        }

        return {
          ...course,
          id: course._id.toString(),
          customId: course.id || null,
          departmentId: course.departmentId?.toString() || null,
          recommended: course.recommended || false,
          students: studentCount || course.students || 0,
          lessonsData: finalLessonsData,
          isEnrolled: isEnrolled || isCourseFree,
          isGifted,
          giftedAt: isGifted ? (enrollment.giftedAt?.toISOString?.() || enrollment.giftedAt) : null,
        }
      })
    )

    return NextResponse.json({ courses: coursesWithStats, total: coursesWithStats.length })
  } catch (error: any) {
    console.error('Get public courses error:', error)
    return NextResponse.json({ error: 'حدث خطأ في جلب الدورات' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    // Simulate course enrollment
    return NextResponse.json({
      message: 'تم التسجيل في الدورة بنجاح',
      courseId: body.courseId,
      enrollmentDate: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to enroll' }, { status: 500 })
  }
}
