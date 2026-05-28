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

// POST: Send push notification to specific user(s)
// Body: { userId?: string, userIds?: string[], title, body, type, url, tag }
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

    // Also allow internal server calls (no auth but has secret header)
    const serverSecret = req.headers.get('X-Server-Secret')
    const isServerCall = serverSecret === process.env.VAPID_PRIVATE_KEY

    if (!isAdmin && !isServerCall) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    const body = await req.json()
    const { userId, userIds, title, body: notifBody, type, url, tag } = body

    if (!title) {
      return NextResponse.json({ error: 'العنوان مطلوب' }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Determine target users
    let targetUserIds: ObjectId[] = []
    if (userId) {
      targetUserIds = [new ObjectId(userId)]
    } else if (userIds && userIds.length > 0) {
      targetUserIds = userIds.map((id: string) => new ObjectId(id))
    } else if (isAdmin) {
      // Broadcast to all users with push subscriptions
      const allSubs = await db.collection('push_subscriptions').find({}, { projection: { userId: 1 } }).toArray()
      targetUserIds = [...new Set(allSubs.map((s: any) => s.userId))]
    }

    if (targetUserIds.length === 0) {
      return NextResponse.json({ success: true, message: 'لا يوجد مستخدمين مستهدفين', sent: 0 })
    }

    // Get push subscriptions for target users
    const subscriptions = await db.collection('push_subscriptions').find({
      userId: { $in: targetUserIds },
    }).toArray()

    if (subscriptions.length === 0) {
      return NextResponse.json({ success: true, message: 'لا يوجد اشتراكات إشعارات', sent: 0 })
    }

    // Build push payload
    const payload = JSON.stringify({
      title,
      body: notifBody || '',
      type: type || 'info',
      url: url || '/',
      tag: tag || `nabd-${Date.now()}`,
      icon: '/icons/icon-192x192.png',
      sound: true,
    })

    // Send push to all subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(async (sub: any) => {
        try {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: sub.keys,
          }
          await webpush.sendNotification(pushSubscription, payload, {
            TTL: 86400, // 24 hours
            urgency: 'high',
            topic: type || 'general',
          })
          return { success: true, endpoint: sub.endpoint }
        } catch (error: any) {
          // If subscription is expired/invalid, remove it
          if (error.statusCode === 404 || error.statusCode === 410) {
            await db.collection('push_subscriptions').deleteOne({ endpoint: sub.endpoint })
            console.log('[Push] Removed expired subscription:', sub.endpoint)
          }
          return { success: false, endpoint: sub.endpoint, error: error.message }
        }
      })
    )

    const sent = results.filter(r => r.status === 'fulfilled' && r.value.success).length
    const failed = results.filter(r => r.status === 'fulfilled' && !r.value.success).length

    return NextResponse.json({
      success: true,
      message: `تم إرسال ${sent} إشعار`,
      sent,
      failed,
    })
  } catch (error: any) {
    console.error('Send push notification error:', error)
    return NextResponse.json({ error: 'حدث خطأ في إرسال الإشعار' }, { status: 500 })
  }
}
