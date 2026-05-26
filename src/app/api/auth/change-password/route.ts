import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { verifyToken, hashPassword, comparePassword } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { token, currentPassword, newPassword } = await req.json()

    if (!token || !currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'جميع الحقول مطلوبة' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' },
        { status: 400 }
      )
    }

    // Verify token
    const authUser = verifyToken(token)
    if (!authUser) {
      return NextResponse.json(
        { error: 'جلسة غير صالحة' },
        { status: 401 }
      )
    }

    const { db } = await connectToDatabase()

    // Find user
    const { ObjectId } = await import('mongodb')
    const user = await db.collection('users').findOne({ _id: new ObjectId(authUser.id) })

    if (!user) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      )
    }

    // Verify current password
    const isValid = comparePassword(currentPassword, user.password)
    if (!isValid) {
      return NextResponse.json(
        { error: 'كلمة المرور الحالية غير صحيحة' },
        { status: 401 }
      )
    }

    // Hash new password and update
    const hashedNewPassword = hashPassword(newPassword)

    await db.collection('users').updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedNewPassword,
          mustChangePassword: false,
          updatedAt: new Date(),
        },
      }
    )

    return NextResponse.json({
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح',
    })
  } catch (error: any) {
    console.error('Change password error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في تغيير كلمة المرور' },
      { status: 500 }
    )
  }
}
