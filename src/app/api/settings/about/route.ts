import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'

// GET /api/settings/about - Get about app text
export async function GET() {
  try {
    const { db } = await connectToDatabase()
    const setting = await db.collection('settings').findOne({ key: 'about' })
    return NextResponse.json({
      success: true,
      text: setting?.text || setting?.content || '',
    })
  } catch (error) {
    console.error('Fetch about error:', error)
    return NextResponse.json({ success: true, text: '' })
  }
}

// PUT /api/settings/about - Update about app text (admin only)
export async function PUT(req: Request) {
  try {
    const { verifyToken } = await import('@/lib/auth')
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')
    const authUser = verifyToken(token)
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: 'صلاحيات المدير مطلوبة' }, { status: 403 })
    }

    const body = await req.json()
    const { text } = body
    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'نص حول التطبيق مطلوب' }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    await db.collection('settings').updateOne(
      { key: 'about' },
      { $set: { key: 'about', text: text.trim(), updatedAt: new Date() } },
      { upsert: true }
    )

    return NextResponse.json({ success: true, text: text.trim() })
  } catch (error) {
    console.error('Update about error:', error)
    return NextResponse.json({ error: 'حدث خطأ في تحديث حول التطبيق' }, { status: 500 })
  }
}
