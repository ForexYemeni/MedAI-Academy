import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { comparePassword, generateToken, ensureDefaultAdmin, type AuthUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { phone, password } = await req.json()

    if (!phone || !password) {
      return NextResponse.json(
        { error: 'رقم الهاتف وكلمة المرور مطلوبان' },
        { status: 400 }
      )
    }

    const { db } = await connectToDatabase()

    // Ensure default admin exists
    await ensureDefaultAdmin(db)

    // Find user by phone
    const user = await db.collection('users').findOne({ phone: phone.toString() })

    if (!user) {
      return NextResponse.json(
        { error: 'رقم الهاتف أو كلمة المرور غير صحيحة' },
        { status: 401 }
      )
    }

    // Compare password
    const isValid = comparePassword(password, user.password)

    if (!isValid) {
      return NextResponse.json(
        { error: 'رقم الهاتف أو كلمة المرور غير صحيحة' },
        { status: 401 }
      )
    }

    // Generate JWT token
    const authUser: AuthUser = {
      id: user._id.toString(),
      name: user.name,
      phone: user.phone,
      role: user.role || 'user',
      mustChangePassword: user.mustChangePassword || false,
    }

    const token = generateToken(authUser)

    return NextResponse.json({
      success: true,
      user: {
        id: authUser.id,
        name: authUser.name,
        phone: authUser.phone,
        role: authUser.role,
        mustChangePassword: authUser.mustChangePassword,
      },
      token,
    })
  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في تسجيل الدخول' },
      { status: 500 }
    )
  }
}
