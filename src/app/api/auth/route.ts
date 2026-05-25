import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json()

    // Simulated auth - in production, use NextAuth.js with proper JWT
    if (!email || !password) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني وكلمة المرور مطلوبان' },
        { status: 400 }
      )
    }

    // Simulate successful login
    return NextResponse.json({
      user: {
        id: '1',
        name: name || 'د. أحمد الخالدي',
        email,
        subscription: 'premium',
      },
      token: 'simulated-jwt-token',
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'حدث خطأ في تسجيل الدخول' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Auth API is running',
  })
}
