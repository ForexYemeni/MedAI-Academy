import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'

// GET /api/mongodb/init - Initialize MongoDB connection and test
export async function GET() {
  try {
    const { db } = await connectToDatabase()

    // Test connection
    const collections = await db.listCollections().toArray()

    // Ensure admin user exists
    const adminExists = await db.collection('users').findOne({ phone: '770000000' })
    let adminSeeded = false
    if (!adminExists) {
      const { hashPassword } = await import('@/lib/auth')
      const hashedPassword = hashPassword('admin123')
      await db.collection('users').insertOne({
        name: 'المدير',
        phone: '770000000',
        password: hashedPassword,
        specialty: 'إدارة',
        role: 'admin',
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
        mustChangePassword: true,
        subscription: 'premium',
        medicalSpecialty: 'إدارة',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      adminSeeded = true
      console.log('✅ Admin user seeded')
    }

    return NextResponse.json({
      status: 'connected',
      message: 'تم الاتصال بـ MongoDB بنجاح!',
      database: db.databaseName,
      collectionsCount: collections.length,
      collections: collections.map(c => c.name),
      adminSeeded,
      timestamp: new Date().toISOString(),
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      {
        status: 'error',
        message: 'فشل الاتصال بـ MongoDB',
        error: message
      },
      { status: 500 }
    )
  }
}

// POST /api/mongodb/init - Initialize with seed data
export async function POST() {
  try {
    const { db } = await connectToDatabase()

    // Seed admin user
    const adminExists = await db.collection('users').findOne({ phone: '770000000' })
    if (!adminExists) {
      const { hashPassword } = await import('@/lib/auth')
      const hashedPassword = hashPassword('admin123')
      await db.collection('users').insertOne({
        name: 'المدير',
        phone: '770000000',
        password: hashedPassword,
        specialty: 'إدارة',
        role: 'admin',
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
        mustChangePassword: true,
        subscription: 'premium',
        medicalSpecialty: 'إدارة',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      console.log('✅ Admin user seeded')
    }

    // Seed medical categories if empty
    const categoriesCount = await db.collection('categories').countDocuments()
    if (categoriesCount === 0) {
      const categories = [
        { id: 'emergency', nameAr: 'طب الطوارئ', icon: '🚑', color: '#ef4444' },
        { id: 'cardiology', nameAr: 'أمراض القلب', icon: '❤️', color: '#ec4899' },
        { id: 'neurology', nameAr: 'الأعصاب', icon: '🧠', color: '#8b5cf6' },
        { id: 'pediatrics', nameAr: 'طب الأطفال', icon: '👶', color: '#10b981' },
        { id: 'surgery', nameAr: 'الجراحة', icon: '🔪', color: '#f59e0b' },
        { id: 'internal', nameAr: 'الطب الباطني', icon: '🩺', color: '#06b6d4' },
        { id: 'radiology', nameAr: 'الأشعة', icon: '📸', color: '#6366f1' },
        { id: 'pharmacology', nameAr: 'الأدوية', icon: '💊', color: '#14b8a6' },
      ]
      await db.collection('categories').insertMany(categories)
    }

    return NextResponse.json({
      status: 'initialized',
      message: 'تم تهيئة قاعدة البيانات بالبيانات الأولية بنجاح!',
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      {
        status: 'error',
        message: 'فشل تهيئة قاعدة البيانات',
        error: message
      },
      { status: 500 }
    )
  }
}
