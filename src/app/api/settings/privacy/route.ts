import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'

// GET /api/settings/privacy - Get privacy policy text
export async function GET() {
  try {
    const { db } = await connectToDatabase()
    const setting = await db.collection('settings').findOne({ key: 'privacy' })
    return NextResponse.json({
      success: true,
      text: setting?.text || setting?.content || '',
    })
  } catch (error) {
    console.error('Fetch privacy error:', error)
    return NextResponse.json({ success: true, text: '' })
  }
}

// PUT /api/settings/privacy - Update privacy policy text (admin only)
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
      return NextResponse.json({ error: 'نص الخصوصية مطلوب' }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    await db.collection('settings').updateOne(
      { key: 'privacy' },
      { $set: { key: 'privacy', text: text.trim(), updatedAt: new Date() } },
      { upsert: true }
    )

    return NextResponse.json({ success: true, text: text.trim() })
  } catch (error) {
    console.error('Update privacy error:', error)
    return NextResponse.json({ error: 'حدث خطأ في تحديث الخصوصية' }, { status: 500 })
  }
}
