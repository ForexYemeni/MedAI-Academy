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

    // Run all count queries in parallel for speed
    const [
      totalUsers,
      totalCourses,
      totalPayments,
      pendingPayments,
      approvedPayments,
      revenueResult,
      newUsersToday,
      pendingPaymentsToday,
    ] = await Promise.all([
      db.collection('users').countDocuments({ role: 'user' }),
      db.collection('courses').countDocuments({}),
      db.collection('payments').countDocuments({}),
      db.collection('payments').countDocuments({ status: 'pending' }),
      db.collection('payments').countDocuments({ status: 'approved' }),
      db.collection('payments').aggregate([
        { $match: { status: 'approved' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]).toArray(),
      db.collection('users').countDocuments({
        role: 'user',
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }),
      db.collection('payments').countDocuments({
        status: 'pending',
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }),
    ])

    const totalRevenue = revenueResult[0]?.total || 0

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
