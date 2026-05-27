import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { ObjectId } from 'mongodb'

// GET: Fetch user's notifications
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const authUser = verifyToken(token)
    if (!authUser) {
      return NextResponse.json({ error: 'رمز غير صالح' }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '30')
    const unreadOnly = searchParams.get('unread') === 'true'

    let query: any = { userId: new ObjectId(authUser.id) }
    if (unreadOnly) query.read = false

    const notifications = await db.collection('notifications')
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray()

    const unreadCount = await db.collection('notifications').countDocuments({
      userId: new ObjectId(authUser.id),
      read: false,
    })

    // Serialize ObjectId
    const serialized = notifications.map(n => ({
      ...n,
      _id: n._id.toString(),
      userId: n.userId.toString(),
    }))

    return NextResponse.json({
      success: true,
      notifications: serialized,
      unreadCount,
    })
  } catch (error: any) {
    console.error('Get notifications error:', error)
    return NextResponse.json({ error: 'حدث خطأ في جلب الإشعارات' }, { status: 500 })
  }
}

// PUT: Mark notification(s) as read
export async function PUT(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const authUser = verifyToken(token)
    if (!authUser) {
      return NextResponse.json({ error: 'رمز غير صالح' }, { status: 401 })
    }

    const { notificationId, markAllRead } = await req.json()

    const { db } = await connectToDatabase()

    if (markAllRead) {
      // Mark all notifications as read for this user
      await db.collection('notifications').updateMany(
        { userId: new ObjectId(authUser.id), read: false },
        { $set: { read: true, updatedAt: new Date() } }
      )
      return NextResponse.json({ success: true, message: 'تم تحديد جميع الإشعارات كمقروءة' })
    }

    if (!notificationId) {
      return NextResponse.json({ error: 'معرف الإشعار مطلوب' }, { status: 400 })
    }

    await db.collection('notifications').updateOne(
      { _id: new ObjectId(notificationId), userId: new ObjectId(authUser.id) },
      { $set: { read: true, updatedAt: new Date() } }
    )

    return NextResponse.json({ success: true, message: 'تم تحديد الإشعار كمقروء' })
  } catch (error: any) {
    console.error('Mark notification error:', error)
    return NextResponse.json({ error: 'حدث خطأ في تحديث الإشعار' }, { status: 500 })
  }
}

// POST: Create notification (admin only, or system-triggered)
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    
    let isAdmin = false
    let targetUserId: string | null = null
    let broadcast = false

    if (token) {
      const authUser = verifyToken(token)
      if (authUser?.role === 'admin') {
        isAdmin = true
      }
    }

    const body = await req.json()
    const { userId, title, message, type, link, broadcast: shouldBroadcast } = body

    if (!title || !message) {
      return NextResponse.json({ error: 'العنوان والرسالة مطلوبان' }, { status: 400 })
    }

    if (!['info', 'success', 'warning'].includes(type || 'info')) {
      return NextResponse.json({ error: 'نوع الإشعار غير صالح' }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    if (shouldBroadcast && isAdmin) {
      // Broadcast to all users
      const users = await db.collection('users').find({ role: 'user' }, { projection: { _id: 1 } }).toArray()
      const notifications = users.map(u => ({
        userId: u._id,
        title,
        message,
        type: type || 'info',
        read: false,
        link: link || '',
        createdAt: new Date(),
        updatedAt: new Date(),
      }))
      
      if (notifications.length > 0) {
        await db.collection('notifications').insertMany(notifications)
      }

      // Log activity
      await db.collection('activity_logs').insertOne({
        action: 'broadcast_notification',
        adminId: 'system',
        details: { title, message, userCount: notifications.length },
        createdAt: new Date(),
      })

      return NextResponse.json({ success: true, message: `تم إرسال الإشعار لـ ${notifications.length} مستخدم`, count: notifications.length })
    }

    // Create notification for a specific user
    if (!userId) {
      return NextResponse.json({ error: 'معرف المستخدم مطلوب أو استخدم البث العام' }, { status: 400 })
    }

    await db.collection('notifications').insertOne({
      userId: new ObjectId(userId),
      title,
      message,
      type: type || 'info',
      read: false,
      link: link || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({ success: true, message: 'تم إنشاء الإشعار بنجاح' })
  } catch (error: any) {
    console.error('Create notification error:', error)
    return NextResponse.json({ error: 'حدث خطأ في إنشاء الإشعار' }, { status: 500 })
  }
}
