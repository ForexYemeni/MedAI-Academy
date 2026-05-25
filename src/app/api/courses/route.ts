import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const level = searchParams.get('level')

  // Simulated courses data
  const courses = [
    { id: '1', title: 'دورة طب الطوارئ الشاملة', category: 'emergency', level: 'advanced', rating: 4.9, students: 15200 },
    { id: '2', title: 'أساسيات أمراض القلب', category: 'cardiology', level: 'intermediate', rating: 4.8, students: 8900 },
    { id: '3', title: 'الغوص في علم الأعصاب', category: 'neurology', level: 'advanced', rating: 4.7, students: 6300 },
    { id: '4', title: 'أساسيات طب الأطفال', category: 'pediatrics', level: 'beginner', rating: 4.9, students: 11200 },
    { id: '5', title: 'تقنيات الجراحة', category: 'surgery', level: 'advanced', rating: 4.6, students: 4500 },
  ]

  let filtered = courses
  if (category) filtered = filtered.filter(c => c.category === category)
  if (level) filtered = filtered.filter(c => c.level === level)

  return NextResponse.json({ courses: filtered, total: filtered.length })
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
