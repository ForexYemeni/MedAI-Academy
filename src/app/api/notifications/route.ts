import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { ObjectId } from 'mongodb'
import webpush from 'web-push'

// Configure web-push with VAPID keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@nabd-academy.com'

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
}

// Valid notification types
const VALID_TYPES = ['info', 'success', 'warning', 'achievement', 'payment', 'gift', 'community', 'simulation', 'enrollment', 'system']

// ─── Fast Push Sender (non-blocking, fire-and-forget) ──────
// Sends push in parallel with concurrency limit for speed
async function sendPushFast(subscriptions: any[], payload: string) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return
  if (subscriptions.length === 0) return

  const { db } = await connectToDatabase()
  const expiredEndpoints: string[] = []

  // Send all push notifications in parallel (no waiting)
  // Use batched concurrency for large lists
  const BATCH_SIZE = 50
  for (let i = 0; i < subscriptions.length; i += BATCH_SIZE) {
    const batch = subscriptions.slice(i, i + BATCH_SIZE)
    
    Promise.allSettled(
      batch.map(async (sub: any) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: sub.keys },
            payload,
            { 
              TTL: 300,           // 5 minutes only (not 24h) - for instant delivery
              urgency: 'high',    // Highest priority
              topic: 'nabd-instant', // Collapse duplicate pending notifications
            }
          )
        } catch (error: any) {
          if (error.statusCode === 404 || error.statusCode === 410) {
            expiredEndpoints.push(sub.endpoint)
          }
        }
      })
    ).catch(() => {})
  }

  // Clean up expired subscriptions in background
  if (expiredEndpoints.length > 0) {
    db.collection('push_subscriptions').deleteMany({
      endpoint: { $in: expiredEndpoints }
    }).catch(() => {})
  }
}

// Send push notification to a specific user (fast, non-blocking)
async function sendPushToUser(userId: ObjectId | string, title: string, body: string, type: string, url: string = '') {
  try {
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return

    const { db } = await connectToDatabase()
    const uid = typeof userId === 'string' ? new ObjectId(userId) : userId

    const subscriptions = await db.collection('push_subscriptions').find({ userId: uid }).toArray()
    if (subscriptions.length === 0) return

    const payload = JSON.stringify({
      title,
      body,
      type: type || 'info',
      url: url || '/',
      tag: `nabd-${Date.now()}`,
      icon: '/icons/icon-192x192.png',
      sound: true,
    })

    await sendPushFast(subscriptions, payload)
  } catch (error) {
    console.error('[Push] sendPushToUser error:', error)
  }
}

// Send push notification to all admin users (fast, non-blocking)
async function sendPushToAdmins(title: string, body: string, type: string, url: string = '') {
  try {
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return

    const { db } = await connectToDatabase()
    const admins = await db.collection('users').find({ role: 'admin' }, { projection: { _id: 1 } }).toArray()
    if (admins.length === 0) return

    const adminIds = admins.map((a: any) => a._id)
    const subscriptions = await db.collection('push_subscriptions').find({
      userId: { $in: adminIds },
    }).toArray()
    if (subscriptions.length === 0) return

    const payload = JSON.stringify({
      title,
      body,
      type: type || 'system',
      url: url || '/',
      tag: `nabd-admin-${Date.now()}`,
      icon: '/icons/icon-192x192.png',
      sound: true,
    })

    await sendPushFast(subscriptions, payload)
  } catch (error) {
    console.error('[Push] sendPushToAdmins error:', error)
  }
}

// Helper: Create a notification for a specific user (with instant push)
export async function createNotification({
  userId,
  title,
  message,
  type = 'info',
  link = '',
  category = '',
  icon = '',
}: {
  userId: string | ObjectId
  title: string
  message: string
  type?: string
  link?: string
  category?: string
  icon?: string
}) {
  const { db } = await connectToDatabase()
  const notifType = VALID_TYPES.includes(type) ? type : 'info'
  
  const result = await db.collection('notifications').insertOne({
    userId: typeof userId === 'string' ? new ObjectId(userId) : userId,
    title,
    message,
    type: notifType,
    category: category || notifType,
    icon: icon || '',
    read: false,
    link: link || '',
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  // Send push notification immediately (fire-and-forget, non-blocking)
  sendPushToUser(userId, title, message, notifType, link).catch(() => {})
  
  return result.insertedId
}

// Helper: Create notification for admin users (with instant push)
export async function createAdminNotification({
  title,
  message,
  type = 'system',
  link = '',
  category = '',
  icon = '',
}: {
  title: string
  message: string
  type?: string
  link?: string
  category?: string
  icon?: string
}) {
  const { db } = await connectToDatabase()
  const admins = await db.collection('users').find({ role: 'admin' }, { projection: { _id: 1 } }).toArray()
  
  if (admins.length === 0) return
  
  const notifications = admins.map(admin => ({
    userId: admin._id,
    title,
    message,
    type: VALID_TYPES.includes(type) ? type : 'system',
    category: category || type || 'system',
    icon: icon || '',
    read: false,
    link: link || '',
    createdAt: new Date(),
    updatedAt: new Date(),
  }))
  
  await db.collection('notifications').insertMany(notifications)

  // Send push notification to admins immediately (fire-and-forget)
  sendPushToAdmins(title, message, type, link).catch(() => {})
}

// GET: Fetch user's notifications (optimized with single query)
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
    const limit = parseInt(searchParams.get('limit') || '50')
    const unreadOnly = searchParams.get('unread') === 'true'
    const category = searchParams.get('category')
    const since = searchParams.get('since') // Timestamp for incremental fetch

    let query: any = { userId: new ObjectId(authUser.id) }
    if (unreadOnly) query.read = false
    if (category) query.type = category
    if (since) {
      query.createdAt = { $gt: new Date(parseInt(since)) }
    }

    // Use Promise.all for parallel queries
    const [notifications, unreadCount, categoryCounts] = await Promise.all([
      db.collection('notifications')
        .find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray(),
      db.collection('notifications').countDocuments({
        userId: new ObjectId(authUser.id),
        read: false,
      }),
      db.collection('notifications').aggregate([
        { $match: { userId: new ObjectId(authUser.id), read: false } },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]).toArray(),
    ])

    const unreadByCategory: Record<string, number> = {}
    categoryCounts.forEach((c: any) => {
      unreadByCategory[c._id || 'info'] = c.count
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
      unreadByCategory,
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
// OPTIMIZED: Send push FIRST, then do DB operations in background
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    
    let isAdmin = false
    if (token) {
      const authUser = verifyToken(token)
      if (authUser?.role === 'admin') {
        isAdmin = true
      }
    }

    const body = await req.json()
    const { userId, title, message, type, link, broadcast: shouldBroadcast, category, icon } = body

    if (!title || !message) {
      return NextResponse.json({ error: 'العنوان والرسالة مطلوبان' }, { status: 400 })
    }

    const notifType = VALID_TYPES.includes(type) ? type : 'info'
    const { db } = await connectToDatabase()

    if (shouldBroadcast && isAdmin) {
      // ─── OPTIMIZED BROADCAST ───
      // Step 1: Get push subscriptions FIRST and send push immediately
      const pushPayload = JSON.stringify({
        title, body: message, type: notifType, url: link || '/',
        tag: `nabd-broadcast-${Date.now()}`, icon: '/icons/icon-192x192.png', sound: true,
      })

      // Fetch subs and send push in parallel with user fetch
      const [allSubs, users] = await Promise.all([
        db.collection('push_subscriptions').find({}).toArray(),
        db.collection('users').find({ role: 'user' }, { projection: { _id: 1 } }).toArray(),
      ])

      // Send push IMMEDIATELY (don't wait for DB insert)
      sendPushFast(allSubs, pushPayload).catch(() => {})

      // Step 2: Insert notifications in DB (in background)
      const notifications = users.map(u => ({
        userId: u._id,
        title,
        message,
        type: notifType,
        category: category || notifType,
        icon: icon || '',
        read: false,
        link: link || '',
        createdAt: new Date(),
        updatedAt: new Date(),
      }))
      
      // Don't await - let DB insert happen in background
      if (notifications.length > 0) {
        db.collection('notifications').insertMany(notifications).catch(() => {})
      }

      // Step 3: Log activity (in background)
      db.collection('activity_logs').insertOne({
        action: 'broadcast_notification',
        adminId: 'system',
        details: { title, message, userCount: notifications.length, type: notifType },
        createdAt: new Date(),
      }).catch(() => {})

      // Return response IMMEDIATELY - push is already sent
      return NextResponse.json({ success: true, message: `تم إرسال الإشعار لـ ${notifications.length} مستخدم`, count: notifications.length })
    }

    // ─── Create notification for a specific user ───
    if (!userId) {
      return NextResponse.json({ error: 'معرف المستخدم مطلوب أو استخدم البث العام' }, { status: 400 })
    }

    // Insert notification
    const insertResult = await db.collection('notifications').insertOne({
      userId: new ObjectId(userId),
      title,
      message,
      type: notifType,
      category: category || notifType,
      icon: icon || '',
      read: false,
      link: link || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Send push notification immediately (non-blocking)
    sendPushToUser(userId, title, message, notifType, link).catch(() => {})

    return NextResponse.json({ success: true, message: 'تم إنشاء الإشعار بنجاح' })
  } catch (error: any) {
    console.error('Create notification error:', error)
    return NextResponse.json({ error: 'حدث خطأ في إنشاء الإشعار' }, { status: 500 })
  }
}

// DELETE: Delete a specific notification
export async function DELETE(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const authUser = verifyToken(token)
    if (!authUser) {
      return NextResponse.json({ error: 'رمز غير صالح' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const notificationId = searchParams.get('id')
    const clearAll = searchParams.get('clearAll') === 'true'

    const { db } = await connectToDatabase()

    if (clearAll) {
      await db.collection('notifications').deleteMany({
        userId: new ObjectId(authUser.id),
      })
      return NextResponse.json({ success: true, message: 'تم حذف جميع الإشعارات' })
    }

    if (!notificationId) {
      return NextResponse.json({ error: 'معرف الإشعار مطلوب' }, { status: 400 })
    }

    await db.collection('notifications').deleteOne({
      _id: new ObjectId(notificationId),
      userId: new ObjectId(authUser.id),
    })

    return NextResponse.json({ success: true, message: 'تم حذف الإشعار' })
  } catch (error: any) {
    console.error('Delete notification error:', error)
    return NextResponse.json({ error: 'حدث خطأ في حذف الإشعار' }, { status: 500 })
  }
}
