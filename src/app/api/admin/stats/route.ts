import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    // التحقق من صلاحيات المدير
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    
    const authUser = verifyToken(token)
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 })
    }

    const { db } = await connectToDatabase()

    // إحصائيات عامة
    const totalUsers = await db.collection('users').countDocuments({ role: 'user' })
    const totalCourses = await db.collection('courses').countDocuments({})
    const totalPayments = await db.collection('payments').countDocuments({})
    const pendingPayments = await db.collection('payments').countDocuments({ status: 'pending' })
    const approvedPayments = await db.collection('payments').countDocuments({ status: 'approved' })
    
    // إجمالي الإيرادات (بالريال اليمني)
    const revenueResult = await db.collection('payments').aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]).toArray()
    const totalRevenue = revenueResult[0]?.total || 0

    // المستخدمين الجدد اليوم
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const newUsersToday = await db.collection('users').countDocuments({
      role: 'user',
      createdAt: { $gte: today }
    })

    // المدفوعات المعلقة اليوم
    const pendingPaymentsToday = await db.collection('payments').countDocuments({
      status: 'pending',
      createdAt: { $gte: today }
    })

    // إحصائيات شهرية للإيرادات (آخر 6 أشهر)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    const monthlyRevenue = await db.collection('payments').aggregate([
      { $match: { status: 'approved', createdAt: { $gte: sixMonthsAgo } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        revenue: { $sum: '$amount' },
        count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]).toArray()

    // إحصائيات التسجيل الشهرية
    const monthlyUsers = await db.collection('users').aggregate([
      { $match: { role: 'user', createdAt: { $gte: sixMonthsAgo } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]).toArray()

    // الدورات مع عدد المسجلين
    const courseStats = await db.collection('enrollments').aggregate([
      { $group: { _id: '$courseId', students: { $sum: 1 } } },
      { $sort: { students: -1 } },
      { $limit: 10 }
    ]).toArray()

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        totalCourses,
        totalPayments,
        pendingPayments,
        approvedPayments,
        totalRevenue,
        newUsersToday,
        pendingPaymentsToday,
        monthlyRevenue,
        monthlyUsers,
        courseStats,
      }
    })
  } catch (error: any) {
    console.error('Admin stats error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في جلب الإحصائيات' },
      { status: 500 }
    )
  }
}
