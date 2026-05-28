import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'

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
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const skip = (page - 1) * limit

    // بناء شرط البحث
    let query: any = { role: 'user' }
    if (search) {
      query = {
        role: 'user',
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
        ]
      }
    }

    const users = await db.collection('users')
      .find(query, { projection: { password: 0 } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    const total = await db.collection('users').countDocuments(query)

    // Batch aggregation: get enrollment and payment counts for ALL users in 2 queries instead of N+1
    const userIds = users.map(u => u._id)
    const userIdsStr = users.map(u => u._id.toString())

    const [enrollmentCounts, paymentCounts] = await Promise.all([
      db.collection('enrollments').aggregate([
        { $match: { userId: { $in: userIds } } },
        { $group: { _id: '$userId', count: { $sum: 1 } } }
      ]).toArray(),
      db.collection('payments').aggregate([
        { $match: { userId: { $in: userIdsStr } } },
        { $group: { _id: '$userId', count: { $sum: 1 } } }
      ]).toArray()
    ])

    // Build lookup maps for O(1) access
    const enrollmentMap = new Map(enrollmentCounts.map(e => [e._id.toString(), e.count]))
    const paymentMap = new Map(paymentCounts.map(p => [p._id, p.count]))

    const usersWithEnrollments = users.map(user => ({
      ...user,
      enrollmentCount: enrollmentMap.get(user._id.toString()) || 0,
      paymentCount: paymentMap.get(user._id.toString()) || 0,
    }))

    return NextResponse.json({
      success: true,
      users: usersWithEnrollments,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error: any) {
    console.error('Get users error:', error)
    return NextResponse.json({ error: 'حدث خطأ في جلب المستخدمين' }, { status: 500 })
  }
}

// حذف مستخدم
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

    const { userId } = await req.json()
    if (!userId) {
      return NextResponse.json({ error: 'معرف المستخدم مطلوب' }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const { ObjectId } = await import('mongodb')

    await db.collection('users').deleteOne({ _id: new ObjectId(userId) })
    await db.collection('enrollments').deleteMany({ userId: new ObjectId(userId) })
    await db.collection('payments').deleteMany({ userId: userId })

    return NextResponse.json({ success: true, message: 'تم حذف المستخدم بنجاح' })
  } catch (error: any) {
    console.error('Delete user error:', error)
    return NextResponse.json({ error: 'حدث خطأ في حذف المستخدم' }, { status: 500 })
  }
}
