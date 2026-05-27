import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'

// GET: Database stats
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const authUser = verifyToken(token)
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 })
    }

    const { db } = await connectToDatabase()

    const [
      usersCount,
      coursesCount,
      paymentsCount,
      enrollmentsCount,
      notificationsCount,
      activityLogsCount,
      paymentMethodsCount,
    ] = await Promise.all([
      db.collection('users').countDocuments({}),
      db.collection('courses').countDocuments({}),
      db.collection('payments').countDocuments({}),
      db.collection('enrollments').countDocuments({}),
      db.collection('notifications').countDocuments({}),
      db.collection('activity_logs').countDocuments({}),
      db.collection('payment_methods').countDocuments({}),
    ])

    const collections = [
      { name: 'users', label: 'المستخدمين', count: usersCount, icon: '👥' },
      { name: 'courses', label: 'الدورات', count: coursesCount, icon: '📚' },
      { name: 'payments', label: 'المدفوعات', count: paymentsCount, icon: '💳' },
      { name: 'enrollments', label: 'التسجيلات', count: enrollmentsCount, icon: '📝' },
      { name: 'notifications', label: 'الإشعارات', count: notificationsCount, icon: '🔔' },
      { name: 'activity_logs', label: 'سجل العمليات', count: activityLogsCount, icon: '📋' },
      { name: 'payment_methods', label: 'طرق الدفع', count: paymentMethodsCount, icon: '💰' },
    ]

    return NextResponse.json({
      success: true,
      stats: { collections, totalDocuments: collections.reduce((sum, c) => sum + c.count, 0) },
    })
  } catch (error: any) {
    console.error('Get database stats error:', error)
    return NextResponse.json({ error: 'حدث خطأ في جلب إحصائيات قاعدة البيانات' }, { status: 500 })
  }
}

// DELETE: Destructive operations (requires password confirmation)
export async function DELETE(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const authUser = verifyToken(token)
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 })
    }

    const { operation, confirmed } = await req.json()

    if (!confirmed) {
      return NextResponse.json({ error: 'يجب تأكيد العملية' }, { status: 400 })
    }

    if (!operation) {
      return NextResponse.json({ error: 'العملية مطلوبة' }, { status: 400 })
    }

    const allowedOperations = [
      'delete_all_users',
      'delete_all_courses',
      'delete_all_payments',
      'reset_enrollments',
      'delete_all_notifications',
    ]

    if (!allowedOperations.includes(operation)) {
      return NextResponse.json({ error: 'عملية غير صالحة' }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    let result

    switch (operation) {
      case 'delete_all_users':
        result = await db.collection('users').deleteMany({ role: { $ne: 'admin' } })
        break
      case 'delete_all_courses':
        result = await db.collection('courses').deleteMany({})
        break
      case 'delete_all_payments':
        result = await db.collection('payments').deleteMany({})
        break
      case 'reset_enrollments':
        result = await db.collection('enrollments').deleteMany({})
        break
      case 'delete_all_notifications':
        result = await db.collection('notifications').deleteMany({})
        break
    }

    // Log the destructive operation
    await db.collection('activity_logs').insertOne({
      action: 'destructive_operation',
      adminId: authUser.id,
      adminName: authUser.name,
      operation,
      deletedCount: result?.deletedCount || 0,
      createdAt: new Date(),
    })

    return NextResponse.json({
      success: true,
      message: `تم تنفيذ العملية بنجاح. تم حذف ${result?.deletedCount || 0} سجل.`,
      deletedCount: result?.deletedCount || 0,
    })
  } catch (error: any) {
    console.error('Database operation error:', error)
    return NextResponse.json({ error: 'حدث خطأ في تنفيذ العملية' }, { status: 500 })
  }
}
