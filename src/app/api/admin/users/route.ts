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

    // عدد الدورات المسجل بها كل مستخدم
    const usersWithEnrollments = await Promise.all(
      users.map(async (user) => {
        const enrollmentCount = await db.collection('enrollments').countDocuments({ userId: user._id })
        const paymentCount = await db.collection('payments').countDocuments({ userId: user._id.toString() })
        return {
          ...user,
          enrollmentCount,
          paymentCount,
        }
      })
    )

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
