import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { db } = await connectToDatabase()
    const { ObjectId } = await import('mongodb')

    const course = await db.collection('courses').findOne({ _id: new ObjectId(id) })
    if (!course) {
      return NextResponse.json({ error: 'الدورة غير موجودة' }, { status: 404 })
    }

    return NextResponse.json({
      course: {
        ...course,
        id: course._id.toString(),
      }
    })
  } catch (error: any) {
    console.error('Get course error:', error)
    return NextResponse.json({ error: 'حدث خطأ في جلب الدورة' }, { status: 500 })
  }
}
