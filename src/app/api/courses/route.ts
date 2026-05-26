import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'

export async function GET(req: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const level = searchParams.get('level')

    let query: any = { published: true }
    if (category) query.category = category
    if (level) query.level = level

    const courses = await db.collection('courses')
      .find(query, { projection: { lessonsData: 0 } })
      .sort({ rating: -1, students: -1 })
      .toArray()

    // إضافة عدد المسجلين لكل دورة
    const coursesWithStats = await Promise.all(
      courses.map(async (course) => {
        const studentCount = await db.collection('enrollments').countDocuments({ courseId: course._id })
        return {
          ...course,
          id: course._id.toString(),
          students: studentCount || course.students || 0,
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
