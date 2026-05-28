import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase, ObjectId } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'

// POST /api/admin/notifications - إرسال إشعار لمجموعة مستخدمين
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const payload = verifyToken(token)
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'فقط المسؤول يمكنه إرسال الإشعارات' }, { status: 403 })
    }

    const body = await req.json()
    const { title, message, audience } = body

    if (!title || !message) {
      return NextResponse.json({ error: 'العنوان والرسالة مطلوبان' }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Build filter based on audience
    const filter: Record<string, unknown> = {}
    if (audience === 'premium') {
      filter.subscription = 'premium'
    } else if (audience === 'free') {
      filter.subscription = 'free'
    }
    // 'all' or undefined means no filter = all users

    const users = await db.collection('users')
      .find(filter, { projection: { _id: 1 } })
      .toArray()

    if (users.length === 0) {
      return NextResponse.json({ message: 'لا يوجد مستخدمين مطابقين', count: 0 })
    }

    // Create a notification for each matching user
    const notifications = users.map(user => ({
      userId: user._id,
      title,
      message,
      type: 'info' as const,
      read: false,
      createdAt: new Date(),
    }))

    const result = await db.collection('notifications').insertMany(notifications)

    return NextResponse.json({
      message: `تم إرسال الإشعار إلى ${result.insertedCount} مستخدم`,
      count: result.insertedCount,
    })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'حدث خطأ'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// GET /api/admin/notifications - جلب سجل الإشعارات المرسلة (اختياري)
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const payload = verifyToken(token)
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'فقط المسؤول يمكنه الوصول' }, { status: 403 })
    }

    const { db } = await connectToDatabase()
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const notifications = await db.collection('notifications')
      .find({})
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray()

    const total = await db.collection('notifications').countDocuments()

    return NextResponse.json({
      notifications,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'حدث خطأ'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
