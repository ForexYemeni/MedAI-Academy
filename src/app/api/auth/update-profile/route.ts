import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase, ObjectId } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'

// PATCH /api/auth/update-profile - تحديث بيانات المستخدم
export async function PATCH(req: NextRequest) {
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

    const body = await req.json()
    const { name, specialty } = body

    // Build update object - only allow specific fields
    const updateFields: Record<string, unknown> = {}
    if (name && typeof name === 'string' && name.trim().length > 0) {
      updateFields.name = name.trim()
    }
    if (specialty && typeof specialty === 'string') {
      updateFields.specialty = specialty.trim()
    }

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json({ error: 'لا توجد بيانات للتحديث' }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const result = await db.collection('users').findOneAndUpdate(
      { _id: new ObjectId(payload.userId) },
      { $set: updateFields },
      { returnDocument: 'after', projection: { password: 0 } }
    )

    if (!result) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })
    }

    const userResponse = { ...result, _id: result._id.toString() }

    return NextResponse.json({
      message: 'تم تحديث البيانات بنجاح',
      user: userResponse,
    })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'حدث خطأ في الخادم'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
