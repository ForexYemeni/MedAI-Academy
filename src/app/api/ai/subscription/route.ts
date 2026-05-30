import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'

// Subscription plans
export const AI_PLANS = {
  weekly: { name: 'أسبوعي', nameEn: 'Weekly', durationDays: 7, price: 0 },
  monthly: { name: 'شهري', nameEn: 'Monthly', durationDays: 30, price: 0 },
  lifetime: { name: 'مدى الحياة', nameEn: 'Lifetime', durationDays: 36500, price: 0 },
} as const

type PlanKey = keyof typeof AI_PLANS

// POST - Request a new subscription (user)
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const token = authHeader.replace('Bearer ', '')
    const authUser = verifyToken(token)
    if (!authUser) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const body = await req.json()
    const { plan, paymentMethod, paymentPhone, paymentNote, transactionId } = body

    if (!plan || !AI_PLANS[plan as PlanKey]) {
      return NextResponse.json({ error: 'خطة اشتراك غير صالحة' }, { status: 400 })
    }

    if (!paymentMethod || !paymentPhone) {
      return NextResponse.json({ error: 'بيانات الدفع مطلوبة' }, { status: 400 })
    }

    const selectedPlan = AI_PLANS[plan as PlanKey]

    const { db } = await connectToDatabase()

    // Check if user already has an active subscription
    const existingSub = await db.collection('ai_subscriptions').findOne({
      userId: authUser.id,
      status: 'active',
      expiresAt: { $gt: new Date() },
    })

    if (existingSub) {
      return NextResponse.json({ error: 'لديك اشتراك نشط بالفعل' }, { status: 400 })
    }

    // Check if user already has a pending request
    const pendingRequest = await db.collection('ai_subscriptions').findOne({
      userId: authUser.id,
      status: 'pending',
    })

    if (pendingRequest) {
      return NextResponse.json({ error: 'لديك طلب اشتراك قيد المراجعة بالفعل' }, { status: 400 })
    }

    // Create subscription request
    const subscription = {
      userId: authUser.id,
      userName: authUser.name || authUser.phone,
      userPhone: authUser.phone,
      plan: plan as PlanKey,
      planName: selectedPlan.name,
      durationDays: selectedPlan.durationDays,
      status: 'pending', // pending → active → expired/cancelled
      paymentMethod,
      paymentPhone,
      paymentNote: paymentNote || '',
      transactionId: transactionId || '',
      createdAt: new Date(),
      approvedAt: null,
      approvedBy: null,
      expiresAt: null,
      rejectedAt: null,
      rejectionReason: '',
    }

    const result = await db.collection('ai_subscriptions').insertOne(subscription)

    return NextResponse.json({
      success: true,
      message: 'تم إرسال طلب الاشتراك بنجاح. سيتم مراجعته من قبل الإدارة قريباً.',
      subscriptionId: result.insertedId,
    })

  } catch (error) {
    console.error('AI subscription POST error:', error)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}

// GET - Fetch user's subscription status or admin fetches all subscriptions
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const token = authHeader.replace('Bearer ', '')
    const authUser = verifyToken(token)
    if (!authUser) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const { db } = await connectToDatabase()

    // Admin: fetch all subscriptions
    if (authUser.role === 'admin') {
      const status = req.nextUrl.searchParams.get('status') // pending, active, all
      const filter: any = {}
      if (status && status !== 'all') {
        filter.status = status
      }

      const subscriptions = await db.collection('ai_subscriptions')
        .find(filter)
        .sort({ createdAt: -1 })
        .limit(100)
        .toArray()

      const total = await db.collection('ai_subscriptions').countDocuments(filter)
      const pendingCount = await db.collection('ai_subscriptions').countDocuments({ status: 'pending' })
      const activeCount = await db.collection('ai_subscriptions').countDocuments({ status: 'active', expiresAt: { $gt: new Date() } })

      return NextResponse.json({
        success: true,
        subscriptions: subscriptions.map(s => ({
          _id: s._id,
          userId: s.userId,
          userName: s.userName,
          userPhone: s.userPhone,
          plan: s.plan,
          planName: s.planName,
          durationDays: s.durationDays,
          status: s.status,
          paymentMethod: s.paymentMethod,
          paymentPhone: s.paymentPhone,
          paymentNote: s.paymentNote,
          transactionId: s.transactionId,
          createdAt: s.createdAt,
          approvedAt: s.approvedAt,
          expiresAt: s.expiresAt,
          rejectedAt: s.rejectedAt,
          rejectionReason: s.rejectionReason,
        })),
        total,
        pendingCount,
        activeCount,
      })
    }

    // Regular user: fetch own subscriptions
    const userSubs = await db.collection('ai_subscriptions')
      .find({ userId: authUser.id })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray()

    // Find active subscription
    const activeSub = userSubs.find(s =>
      s.status === 'active' && s.expiresAt && new Date(s.expiresAt) > new Date()
    )

    // Find pending subscription
    const pendingSub = userSubs.find(s => s.status === 'pending')

    return NextResponse.json({
      success: true,
      activeSubscription: activeSub ? {
        plan: activeSub.plan,
        planName: activeSub.planName,
        expiresAt: activeSub.expiresAt,
        status: activeSub.status,
      } : null,
      pendingSubscription: pendingSub ? {
        plan: pendingSub.plan,
        planName: pendingSub.planName,
        createdAt: pendingSub.createdAt,
      } : null,
      subscriptionHistory: userSubs.map(s => ({
        plan: s.plan,
        planName: s.planName,
        status: s.status,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
      })),
    })

  } catch (error) {
    console.error('AI subscription GET error:', error)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}

// PUT - Approve/reject subscription (admin)
export async function PUT(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const token = authHeader.replace('Bearer ', '')
    const authUser = verifyToken(token)
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 })
    }

    const body = await req.json()
    const { subscriptionId, action, rejectionReason } = body

    if (!subscriptionId || !action) {
      return NextResponse.json({ error: 'البيانات مطلوبة' }, { status: 400 })
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ error: 'إجراء غير صالح' }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const sub = await db.collection('ai_subscriptions').findOne({ _id: new (require('mongodb')).ObjectId(subscriptionId) })
    if (!sub) {
      return NextResponse.json({ error: 'الاشتراك غير موجود' }, { status: 404 })
    }

    if (sub.status !== 'pending') {
      return NextResponse.json({ error: 'تم معالجة هذا الطلب بالفعل' }, { status: 400 })
    }

    if (action === 'approve') {
      const now = new Date()
      const expiresAt = new Date(now.getTime() + sub.durationDays * 24 * 60 * 60 * 1000)

      await db.collection('ai_subscriptions').updateOne(
        { _id: sub._id },
        {
          $set: {
            status: 'active',
            approvedAt: now,
            approvedBy: authUser.id,
            expiresAt,
          }
        }
      )

      // Update user subscription in users collection
      await db.collection('users').updateOne(
        { _id: new (require('mongodb')).ObjectId(sub.userId) },
        { $set: { subscription: 'premium', aiSubscription: sub.plan } }
      )

      return NextResponse.json({
        success: true,
        message: `تم تفعيل اشتراك ${sub.planName} بنجاح`,
        expiresAt: expiresAt.toISOString(),
      })
    }

    if (action === 'reject') {
      await db.collection('ai_subscriptions').updateOne(
        { _id: sub._id },
        {
          $set: {
            status: 'rejected',
            rejectedAt: new Date(),
            rejectionReason: rejectionReason || '',
          }
        }
      )

      return NextResponse.json({
        success: true,
        message: 'تم رفض طلب الاشتراك',
      })
    }

    return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 })

  } catch (error) {
    console.error('AI subscription PUT error:', error)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}

// DELETE - Cancel subscription (admin or user)
export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const token = authHeader.replace('Bearer ', '')
    const authUser = verifyToken(token)
    if (!authUser) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const subscriptionId = req.nextUrl.searchParams.get('id')
    if (!subscriptionId) return NextResponse.json({ error: 'معرف الاشتراك مطلوب' }, { status: 400 })

    const { db } = await connectToDatabase()

    if (authUser.role === 'admin') {
      await db.collection('ai_subscriptions').updateOne(
        { _id: new (require('mongodb')).ObjectId(subscriptionId) },
        { $set: { status: 'cancelled', cancelledAt: new Date() } }
      )
    } else {
      await db.collection('ai_subscriptions').updateOne(
        { _id: new (require('mongodb')).ObjectId(subscriptionId), userId: authUser.id },
        { $set: { status: 'cancelled', cancelledAt: new Date() } }
      )
    }

    return NextResponse.json({ success: true, message: 'تم إلغاء الاشتراك' })

  } catch (error) {
    console.error('AI subscription DELETE error:', error)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}
