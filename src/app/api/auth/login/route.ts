import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { comparePassword, generateToken, hashPassword, type AuthUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { phone, password } = await req.json()

    if (!phone || !password) {
      return NextResponse.json(
        { error: 'رقم الهاتف وكلمة المرور مطلوبان' },
        { status: 400 }
      )
    }

    let dbResult
    try {
      dbResult = await connectToDatabase()
    } catch (dbConnError) {
      console.error('MongoDB connection failed:', dbConnError instanceof Error ? dbConnError.message : 'Unknown error')

      // Fallback: allow default admin login if MongoDB is unreachable
      if (phone === '770000000' && password === 'admin123') {
        const token = generateToken({
          id: 'admin-fallback',
          name: 'المدير',
          phone: '770000000',
          role: 'admin',
          mustChangePassword: true,
        })

        return NextResponse.json({
          success: true,
          user: {
            id: 'admin-fallback',
            name: 'المدير',
            phone: '770000000',
            role: 'admin',
            mustChangePassword: true,
          },
          token,
        })
      }

      return NextResponse.json(
        { error: 'تعذر الاتصال بقاعدة البيانات. يرجى التأكد من إضافة IP الخادم في MongoDB Atlas (0.0.0.0/0)' },
        { status: 500 }
      )
    }

    const { db } = dbResult

    // Ensure default admin exists
    try {
      const adminExists = await db.collection('users').findOne({ role: 'admin' })
      if (!adminExists) {
        const hashedPassword = hashPassword('admin123')
        await db.collection('users').insertOne({
          name: 'المدير',
          phone: '770000000',
          password: hashedPassword,
          role: 'admin',
          mustChangePassword: true,
          xp: 0,
          coins: 0,
          level: 1,
          rankTitle: 'مدير النظام',
          rankIcon: '👑',
          streak: 0,
          maxStreak: 0,
          completedCourses: 0,
          totalHours: 0,
          badges: [],
          joinDate: new Date().toISOString().split('T')[0],
          subscription: 'premium',
          medicalSpecialty: 'إدارة',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        console.log('✅ Default admin auto-created')
      }
    } catch (adminErr) {
      console.log('Admin check/creation warning:', adminErr instanceof Error ? adminErr.message : 'Unknown')
    }

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
