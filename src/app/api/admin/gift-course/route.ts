import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { ObjectId } from 'mongodb'
import { createNotification } from '@/app/api/notifications/route'

// POST: Gift course(s) from admin to a user
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const authUser = verifyToken(token)
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: 'صلاحيات الإدارة مطلوبة' }, { status: 403 })
    }

    const { userId, courseIds } = await req.json()

    if (!userId || !courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
      return NextResponse.json({ error: 'معرف المستخدم وقائمة الدورات مطلوبان' }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Verify user exists
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) })
    if (!user) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })
    }

    const results: { courseId: string; courseName: string; status: string }[] = []

    for (const courseId of courseIds) {
      // Check if course exists
      const course = await db.collection('courses').findOne({ _id: new ObjectId(courseId) })
      if (!course) {
        results.push({ courseId, courseName: 'غير معروف', status: 'not_found' })
        continue
      }

      // Check if already enrolled (check both ObjectId and string formats for userId)
      const existingEnrollment = await db.collection('enrollments').findOne({
        $or: [
          { userId: userId, courseId: courseId },
          { userId: new ObjectId(userId), courseId: courseId },
          { userId: userId, courseId: new ObjectId(courseId) },
          { userId: new ObjectId(userId), courseId: new ObjectId(courseId) },
        ]
      })

      if (existingEnrollment) {
        results.push({ courseId, courseName: course.titleAr || course.title, status: 'already_enrolled' })
        continue
      }

      // Create enrollment with gift metadata (use string userId consistent with other enrollment flows)
      await db.collection('enrollments').insertOne({
        userId: userId,
        courseId: courseId,
        progress: 0,
        completedLessons: [],
        completed: false,
        giftSource: 'admin',
        giftedAt: new Date(),
        giftedBy: authUser.id,
        enrolledAt: new Date(),
        updatedAt: new Date(),
      })

      results.push({ courseId, courseName: course.titleAr || course.title, status: 'gifted' })
    }

    // Send notification to user for successfully gifted courses
    const giftedCourses = results.filter(r => r.status === 'gifted')
    if (giftedCourses.length > 0) {
      const courseNames = giftedCourses.map(r => r.courseName).join('، ')

      try {
        await createNotification({
          userId: userId,
          title: '🎁 دورة مهدأة إليك!',
          message: giftedCourses.length === 1
            ? `تم إهداء دورة "${courseNames}" لك كهدية من الإدارة. استمتع بالتعلم!`
            : `تم إهداء ${giftedCourses.length} دورات لك كهدية من الإدارة: ${courseNames}. استمتع بالتعلم!`,
          type: 'gift',
          link: 'courses',
          category: 'gift',
          icon: '🎁',
        })
      } catch (e) { /* notification is non-critical */ }
    }

    // Log activity
    await db.collection('activity_logs').insertOne({
      action: 'gift_course',
      adminId: authUser.id,
      details: {
        userId,
        userName: user.name || user.phone,
        courseIds,
        giftedCount: giftedCourses.length,
        alreadyEnrolled: results.filter(r => r.status === 'already_enrolled').length,
      },
      createdAt: new Date(),
    })

    return NextResponse.json({
      success: true,
      message: giftedCourses.length > 0
        ? `تم إهداء ${giftedCourses.length} دورة بنجاح`
        : 'لم يتم إهداء أي دورات جديدة',
      results,
    })
  } catch (error: any) {
    console.error('Gift course error:', error)
    return NextResponse.json({ error: 'حدث خطأ في إهداء الدورة' }, { status: 500 })
  }
}
