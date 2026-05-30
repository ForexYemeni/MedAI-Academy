import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'

// Default subscription plans (fallback if not set in DB)
const DEFAULT_PLANS = {
  weekly: { name: 'أسبوعي', nameEn: 'Weekly', durationDays: 7, price: 0 },
  monthly: { name: 'شهري', nameEn: 'Monthly', durationDays: 30, price: 0 },
  lifetime: { name: 'مدى الحياة', nameEn: 'Lifetime', durationDays: 36500, price: 0 },
} as const

type PlanKey = keyof typeof DEFAULT_PLANS

// Helper to get plans with prices from DB
async function getPlansWithPricing() {
  try {
    const { db } = await connectToDatabase()
    const pricing = await db.collection('ai_subscription_pricing').findOne({ id: 'main' })
    if (pricing) {
      return {
        weekly: { name: 'أسبوعي', nameEn: 'Weekly', durationDays: 7, price: pricing.weeklyPrice ?? 0 },
        monthly: { name: 'شهري', nameEn: 'Monthly', durationDays: 30, price: pricing.monthlyPrice ?? 0 },
        lifetime: { name: 'مدى الحياة', nameEn: 'Lifetime', durationDays: 36500, price: pricing.lifetimePrice ?? 0 },
      }
    }
  } catch {}
  return DEFAULT_PLANS
}

// POST - Request a new subscription (user)
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const token = authHeader.replace('Bearer ', '')
    const authUser = verifyToken(token)
    if (!authUser) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const body = await req.json()
    const { plan, paymentMethodId, paymentScreenshot, paymentNote } = body

    const plans = await getPlansWithPricing()

    if (!plan || !plans[plan as PlanKey]) {
      return NextResponse.json({ error: 'خطة اشتراك غير صالحة' }, { status: 400 })
    }

    // paymentScreenshot is mandatory
    if (!paymentScreenshot) {
      return NextResponse.json({ error: 'صورة تأكيد الدفع مطلوبة' }, { status: 400 })
    }

    if (!paymentMethodId) {
      return NextResponse.json({ error: 'يرجى اختيار طريقة الدفع' }, { status: 400 })
    }

    const selectedPlan = plans[plan as PlanKey]

    const { db } = await connectToDatabase()

    // Verify payment method exists and is active
    const { ObjectId } = await import('mongodb')
    let paymentMethod: any = null
    try {
      paymentMethod = await db.collection('payment_methods').findOne({
        _id: new ObjectId(paymentMethodId),
        active: true,
      })
    } catch {}
    if (!paymentMethod) {
      return NextResponse.json({ error: 'طريقة الدفع غير صالحة' }, { status: 400 })
    }

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
      price: selectedPlan.price,
      status: 'pending', // pending → active → expired/cancelled/rejected
      paymentMethodId,
      paymentMethodName: paymentMethod.name || '',
      paymentMethodAccount: paymentMethod.accountNumber || '',
      paymentScreenshot, // base64 image - mandatory
      paymentNote: paymentNote || '',
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
    const plans = await getPlansWithPricing()

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
          price: s.price,
          status: s.status,
          paymentMethodId: s.paymentMethodId,
          paymentMethodName: s.paymentMethodName,
          paymentMethodAccount: s.paymentMethodAccount,
          paymentScreenshot: s.paymentScreenshot,
          paymentNote: s.paymentNote,
          createdAt: s.createdAt,
          approvedAt: s.approvedAt,
          approvedBy: s.approvedBy,
          expiresAt: s.expiresAt,
          rejectedAt: s.rejectedAt,
          rejectionReason: s.rejectionReason,
        })),
        total,
        pendingCount,
        activeCount,
        plans, // include pricing info for admin
      })
    }

    // Regular user: fetch own subscriptions + plans + payment methods
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

    // Get active payment methods
    const paymentMethods = await db.collection('payment_methods')
      .find({ active: true })
      .project({ _id: 1, type: 1, name: 1, accountNumber: 1, accountName: 1, instructions: 1 })
      .sort({ createdAt: -1 })
      .toArray()

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
      plans,
      paymentMethods,
    })

  } catch (error) {
    console.error('AI subscription GET error:', error)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}

// PUT - Approve/reject subscription (admin) or update pricing
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
    const { ObjectId } = await import('mongodb')

    // Update pricing
    if (body.action === 'update_pricing') {
      const { weeklyPrice, monthlyPrice, lifetimePrice } = body
      const { db } = await connectToDatabase()

      await db.collection('ai_subscription_pricing').updateOne(
        { id: 'main' },
        {
          $set: {
            id: 'main',
            weeklyPrice: Number(weeklyPrice) || 0,
            monthlyPrice: Number(monthlyPrice) || 0,
            lifetimePrice: Number(lifetimePrice) || 0,
            updatedAt: new Date(),
          }
        },
        { upsert: true }
      )

      return NextResponse.json({
        success: true,
        message: 'تم تحديث أسعار الاشتراكات بنجاح',
      })
    }

    // Gift free subscription to user
    if (body.action === 'gift') {
      const { userId, plan } = body
      if (!userId || !plan) {
        return NextResponse.json({ error: 'بيانات مطلوبة' }, { status: 400 })
      }

      const plans = await getPlansWithPricing()
      if (!plans[plan as PlanKey]) {
        return NextResponse.json({ error: 'خطة غير صالحة' }, { status: 400 })
      }

      const selectedPlan = plans[plan as PlanKey]
      const { db } = await connectToDatabase()

      // Check if user already has active subscription
      const existingSub = await db.collection('ai_subscriptions').findOne({
        userId,
        status: 'active',
        expiresAt: { $gt: new Date() },
      })

      if (existingSub) {
        return NextResponse.json({ error: 'المستخدم لديه اشتراك نشط بالفعل' }, { status: 400 })
      }

      const now = new Date()
      const expiresAt = new Date(now.getTime() + selectedPlan.durationDays * 24 * 60 * 60 * 1000)

      // Get user info
      let userName = 'مستخدم'
      let userPhone = ''
      try {
        const user = await db.collection('users').findOne({ _id: new ObjectId(userId) })
        userName = user?.name || 'مستخدم'
        userPhone = user?.phone || ''
      } catch {}

      const subscription = {
        userId,
        userName,
        userPhone,
        plan: plan as PlanKey,
        planName: selectedPlan.name,
        durationDays: selectedPlan.durationDays,
        price: 0, // gift
        status: 'active',
        paymentMethodId: 'gift',
        paymentMethodName: 'هدية من الإدارة',
        paymentMethodAccount: '',
        paymentScreenshot: '',
        paymentNote: 'اشتراك مجاني - هدية من الإدارة',
        createdAt: now,
        approvedAt: now,
        approvedBy: authUser.id,
        expiresAt,
        rejectedAt: null,
        rejectionReason: '',
        isGift: true,
      }

      await db.collection('ai_subscriptions').insertOne(subscription)

      // Update user subscription
      await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        { $set: { subscription: 'premium', aiSubscription: plan } }
      )

      return NextResponse.json({
        success: true,
        message: `تم إهداء اشتراك ${selectedPlan.name} للمستخدم بنجاح`,
      })
    }

    // Approve/reject subscription
    const { subscriptionId, action, rejectionReason } = body

    if (!subscriptionId || !action) {
      return NextResponse.json({ error: 'البيانات مطلوبة' }, { status: 400 })
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ error: 'إجراء غير صالح' }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const sub = await db.collection('ai_subscriptions').findOne({ _id: new ObjectId(subscriptionId) })
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
      try {
        await db.collection('users').updateOne(
          { _id: new ObjectId(sub.userId) },
          { $set: { subscription: 'premium', aiSubscription: sub.plan } }
        )
      } catch {}

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
    const { ObjectId } = await import('mongodb')

    if (authUser.role === 'admin') {
      await db.collection('ai_subscriptions').updateOne(
        { _id: new ObjectId(subscriptionId) },
        { $set: { status: 'cancelled', cancelledAt: new Date() } }
      )
    } else {
      await db.collection('ai_subscriptions').updateOne(
        { _id: new ObjectId(subscriptionId), userId: authUser.id },
        { $set: { status: 'cancelled', cancelledAt: new Date() } }
      )
    }

    return NextResponse.json({ success: true, message: 'تم إلغاء الاشتراك' })

  } catch (error) {
    console.error('AI subscription DELETE error:', error)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}
