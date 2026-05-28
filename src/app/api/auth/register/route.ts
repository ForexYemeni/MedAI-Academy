import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { hashPassword, generateToken, type AuthUser } from '@/lib/auth'
import { createAdminNotification } from '@/app/api/notifications/route'

export async function POST(req: NextRequest) {
  try {
    const { name, phone, password } = await req.json()

    if (!name || !phone || !password) {
      return NextResponse.json(
        { error: 'الاسم ورقم الهاتف وكلمة المرور مطلوبون' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' },
        { status: 400 }
      )
    }

    // Validate phone format
    if (!/^7\d{8}$/.test(phone.toString())) {
      return NextResponse.json(
        { error: 'رقم الهاتف يجب أن يبدأ بـ 7 ويتكون من 9 أرقام' },
        { status: 400 }
      )
    }

    let dbResult
    try {
      dbResult = await connectToDatabase()
    } catch (dbConnError) {
      console.error('MongoDB connection failed for register:', dbConnError instanceof Error ? dbConnError.message : 'Unknown error')
      return NextResponse.json(
        { error: 'تعذر الاتصال بقاعدة البيانات. يرجى المحاولة لاحقاً.' },
        { status: 500 }
      )
    }

    const { db } = dbResult

    // Check if phone already exists
    const existingUser = await db.collection('users').findOne({ phone: phone.toString() })

    if (existingUser) {
      return NextResponse.json(
        { error: 'رقم الهاتف مسجل مسبقاً' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = hashPassword(password)

    // Create user
    const result = await db.collection('users').insertOne({
      name,
      phone: phone.toString(),
      password: hashedPassword,
      role: 'user',
      mustChangePassword: false,
      xp: 0,
      coins: 0,
      level: 1,
      rankTitle: 'طالب طب',
      rankIcon: '🩺',
      streak: 0,
      maxStreak: 0,
      completedCourses: 0,
      totalHours: 0,
      badges: [],
      joinDate: new Date().toISOString().split('T')[0],
      subscription: 'free',
      medicalSpecialty: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Generate JWT token
    const authUser: AuthUser = {
      id: result.insertedId.toString(),
      name,
      phone: phone.toString(),
      role: 'user',
      mustChangePassword: false,
    }

    const token = generateToken(authUser)

    // Notify admin about new user registration
    try {
      await createAdminNotification({
        title: 'مستخدم جديد',
        message: `سجّل ${name} حساباً جديداً في الأكاديمية`,
        type: 'system',
        link: 'admin',
        category: 'system',
        icon: '👤',
      })
    } catch (e) { /* notification is non-critical */ }

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
    console.error('Register error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء الحساب' },
      { status: 500 }
    )
  }
}
