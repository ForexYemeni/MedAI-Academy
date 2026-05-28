import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { verifyToken } from '@/lib/auth'

// GET /api/auth/me - الحصول على بيانات المستخدم الحالي
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'غير مصرح - لا يوجد رمز' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'رمز غير صالح أو منتهي الصلاحية' }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(payload.userId) },
      { projection: { password: 0 } }
    )

    if (!user) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })
    }

    // تحويل _id إلى string
    const userResponse = { ...user, _id: user._id.toString() }

    return NextResponse.json({ user: userResponse })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'حدث خطأ في الخادم'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
