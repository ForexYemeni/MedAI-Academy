import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { ObjectId } from 'mongodb'

// POST: Save/update push subscription for a user
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const authUser = verifyToken(token)
    if (!authUser) {
      return NextResponse.json({ error: 'رمز غير صالح' }, { status: 401 })
    }

    const subscription = await req.json()
    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: 'اشتراك غير صالح' }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Upsert: update if exists, insert if not
    await db.collection('push_subscriptions').updateOne(
      { userId: new ObjectId(authUser.id), endpoint: subscription.endpoint },
      {
        $set: {
          userId: new ObjectId(authUser.id),
          endpoint: subscription.endpoint,
          keys: subscription.keys,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    )

    return NextResponse.json({ success: true, message: 'تم حفظ اشتراك الإشعارات بنجاح' })
  } catch (error: any) {
    console.error('Save push subscription error:', error)
    return NextResponse.json({ error: 'حدث خطأ في حفظ الاشتراك' }, { status: 500 })
  }
}

// DELETE: Remove push subscription
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
    const endpoint = searchParams.get('endpoint')

    if (!endpoint) {
      return NextResponse.json({ error: 'نقطة النهاية مطلوبة' }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    await db.collection('push_subscriptions').deleteOne({
      userId: new ObjectId(authUser.id),
      endpoint: endpoint,
    })

    return NextResponse.json({ success: true, message: 'تم إلغاء اشتراك الإشعارات' })
  } catch (error: any) {
    console.error('Delete push subscription error:', error)
    return NextResponse.json({ error: 'حدث خطأ في إلغاء الاشتراك' }, { status: 500 })
  }
}

// GET: Check subscription status
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
    const subscription = await db.collection('push_subscriptions').findOne({
      userId: new ObjectId(authUser.id),
    })

    return NextResponse.json({
      success: true,
      isSubscribed: !!subscription,
      endpoint: subscription?.endpoint || null,
    })
  } catch (error: any) {
    console.error('Check push subscription error:', error)
    return NextResponse.json({ error: 'حدث خطأ في التحقق من الاشتراك' }, { status: 500 })
  }
}
