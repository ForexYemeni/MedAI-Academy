import { NextResponse } from 'next/server'
import { connectToDatabase, createIndexes } from '@/lib/mongodb'
import { hashPassword } from '@/lib/auth'

// POST /api/setup - تهيئة قاعدة البيانات وإنشاء حساب الأدمن
// هذا الرابط يُستخدم مرة واحدة فقط
export async function POST() {
  try {
    const { db } = await connectToDatabase()

    // إنشاء الفهارس
    await createIndexes(db)

    // التحقق من وجود أدمن بالفعل
    const existingAdmin = await db.collection('users').findOne({ role: 'admin' })
    if (existingAdmin) {
      return NextResponse.json(
        { error: 'يوجد حساب أدمن بالفعل. لا يمكن إنشاء حساب آخر.' },
        { status: 400 }
      )
    }

    // إنشاء حساب الأدمن
    const hashedPassword = await hashPassword('admin123')

    const admin = {
      phone: '770000000',
      name: 'مدير النظام',
      password: hashedPassword,
      specialty: 'إدارة النظام',
      xp: 0,
      coins: 0,
      level: 1,
      rankTitle: 'مدير النظام',
      rankIcon: '🛡️',
      streak: 0,
      maxStreak: 0,
      subscription: 'premium',
      totalHours: 0,
      completedCourses: 0,
      badges: [],
      weakAreas: [],
      isActive: true,
      role: 'admin',
      mustChangePassword: true, // إجباري تغيير كلمة السر
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection('users').insertOne(admin)

    // إنشاء تصنيفات طبية
    const categories = [
      { id: 'emergency', nameAr: 'طب الطوارئ', icon: '🚑', color: '#ef4444', order: 1 },
      { id: 'cardiology', nameAr: 'أمراض القلب', icon: '❤️', color: '#ec4899', order: 2 },
      { id: 'neurology', nameAr: 'الأعصاب', icon: '🧠', color: '#8b5cf6', order: 3 },
      { id: 'pediatrics', nameAr: 'طب الأطفال', icon: '👶', color: '#10b981', order: 4 },
      { id: 'surgery', nameAr: 'الجراحة', icon: '🔪', color: '#f59e0b', order: 5 },
      { id: 'internal', nameAr: 'الطب الباطني', icon: '🩺', color: '#06b6d4', order: 6 },
      { id: 'radiology', nameAr: 'الأشعة', icon: '📸', color: '#6366f1', order: 7 },
      { id: 'pharmacology', nameAr: 'الأدوية', icon: '💊', color: '#14b8a6', order: 8 },
    ]
    await db.collection('categories').insertMany(categories)

    // إنشاء رتب طبية
    const ranks = [
      { title: 'طالب طب', titleEn: 'Intern', minXP: 0, icon: '🩺', order: 1 },
      { title: 'ممرض', titleEn: 'Nurse', minXP: 500, icon: '💊', order: 2 },
      { title: 'طبيب مقيم', titleEn: 'Resident', minXP: 2000, icon: '🏥', order: 3 },
      { title: 'أخصائي', titleEn: 'Specialist', minXP: 5000, icon: '⚕️', order: 4 },
      { title: 'جراح', titleEn: 'Surgeon', minXP: 10000, icon: '🔪', order: 5 },
      { title: 'خبير طوارئ', titleEn: 'Trauma Master', minXP: 20000, icon: '🚑', order: 6 },
      { title: 'قائد العناية المركزة', titleEn: 'ICU Commander', minXP: 50000, icon: '👑', order: 7 },
    ]
    await db.collection('ranks').insertMany(ranks)

    // إنشاء دورات تجريبية
    const sampleCourses = [
      {
        title: 'Emergency Medicine Masterclass',
        titleAr: 'دورة طب الطوارئ الشاملة',
        description: 'أكبر دورة طب طوارئ عربية - تعلم التعامل مع جميع حالات الطوارئ',
        descriptionAr: 'أكبر دورة طب طوارئ عربية - تعلم التعامل مع جميع حالات الطوارئ',
        category: 'emergency',
        instructorId: result.insertedId,
        instructorName: 'مدير النظام',
        thumbnail: '',
        rating: 4.9,
        totalRatings: 150,
        students: 0,
        duration: '42 ساعة',
        totalHours: 42,
        level: 'advanced',
        price: 0,
        isPremium: false,
        lessonsCount: 0,
        tags: ['طوارئ', 'ACLS', 'trauma'],
        published: true,
        type: 'mixed',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'Cardiology Essentials',
        titleAr: 'أساسيات أمراض القلب',
        description: 'تعلم أمراض القلب من الصفر حتى الاحتراف',
        descriptionAr: 'تعلم أمراض القلب من الصفر حتى الاحتراف',
        category: 'cardiology',
        instructorId: result.insertedId,
        instructorName: 'مدير النظام',
        thumbnail: '',
        rating: 4.8,
        totalRatings: 89,
        students: 0,
        duration: '28 ساعة',
        totalHours: 28,
        level: 'intermediate',
        price: 9.99,
        isPremium: true,
        lessonsCount: 0,
        tags: ['قلب', 'ECG', 'أمراض قلبية'],
        published: true,
        type: 'mixed',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'Pharmacology Made Easy',
        titleAr: 'علم الأدوية مبسط',
        description: 'أدوية بشكل سهل وممتع - كل ما تحتاجه عن الأدوية',
        descriptionAr: 'أدوية بشكل سهل وممتع - كل ما تحتاجه عن الأدوية',
        category: 'pharmacology',
        instructorId: result.insertedId,
        instructorName: 'مدير النظام',
        thumbnail: '',
        rating: 4.9,
        totalRatings: 135,
        students: 0,
        duration: '32 ساعة',
        totalHours: 32,
        level: 'beginner',
        price: 0,
        isPremium: false,
        lessonsCount: 0,
        tags: ['أدوية', 'جرعات', 'تداخلات'],
        published: true,
        type: 'mixed',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'Surgery Techniques',
        titleAr: 'تقنيات الجراحة',
        description: 'تعلم الجراحة خطوة بخطوة من أفضل المدربين',
        descriptionAr: 'تعلم الجراحة خطوة بخطوة من أفضل المدربين',
        category: 'surgery',
        instructorId: result.insertedId,
        instructorName: 'مدير النظام',
        thumbnail: '',
        rating: 4.6,
        totalRatings: 45,
        students: 0,
        duration: '50 ساعة',
        totalHours: 50,
        level: 'advanced',
        price: 19.99,
        isPremium: true,
        lessonsCount: 0,
        tags: ['جراحة', 'خياطة', 'تنظير'],
        published: true,
        type: 'mixed',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]
    await db.collection('courses').insertMany(sampleCourses)

    return NextResponse.json({
      success: true,
      message: 'تم تهيئة قاعدة البيانات بنجاح! ✅\n- تم إنشاء حساب الأدمن\n- تم إنشاء التصنيفات والرتب\n- تم إنشاء 4 دورات تجريبية',
      adminId: result.insertedId,
    })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'حدث خطأ'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// GET - فحص حالة قاعدة البيانات
export async function GET() {
  try {
    const { db } = await connectToDatabase()
    
    const usersCount = await db.collection('users').countDocuments()
    const coursesCount = await db.collection('courses').countDocuments()
    const adminExists = await db.collection('users').findOne({ role: 'admin' })

    return NextResponse.json({
      connected: true,
      database: db.databaseName,
      users: usersCount,
      courses: coursesCount,
      adminExists: !!adminExists,
      setupRequired: !adminExists,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'حدث خطأ'
    return NextResponse.json({ connected: false, error: message }, { status: 500 })
  }
}
