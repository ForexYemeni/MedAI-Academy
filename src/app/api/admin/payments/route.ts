import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { createNotification } from '@/app/api/notifications/route'

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
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    let query: any = {}
    if (status) query.status = status

    const payments = await db.collection('payments')
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    // إضافة اسم الدورة للمدفوعات التي لا تحتوي عليه
    const { ObjectId } = await import('mongodb')
    const paymentsWithCourse = await Promise.all(
      payments.map(async (payment) => {
        if (payment.courseName) return payment
        try {
          const course = await db.collection('courses').findOne(
            { _id: new ObjectId(payment.courseId) },
            { projection: { titleAr: 1, title: 1 } }
          )
          return { ...payment, courseName: course?.titleAr || course?.title || '' }
        } catch {
          return payment
        }
      })
    )

    const total = await db.collection('payments').countDocuments(query)

    return NextResponse.json({
      success: true,
      payments: paymentsWithCourse,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error: any) {
    console.error('Get payments error:', error)
    return NextResponse.json({ error: 'حدث خطأ في جلب المدفوعات' }, { status: 500 })
  }
}

// تحديث حالة الدفع (موافقة/رفض)
export async function PUT(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    
    const authUser = verifyToken(token)
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 })
    }

    const { paymentId, status, adminNote } = await req.json()
    
    if (!paymentId || !status) {
      return NextResponse.json({ error: 'معرف الدفع والحالة مطلوبان' }, { status: 400 })
    }

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'حالة غير صالحة' }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const { ObjectId } = await import('mongodb')

    const payment = await db.collection('payments').findOne({ _id: new ObjectId(paymentId) })
    if (!payment) {
      return NextResponse.json({ error: 'الدفع غير موجود' }, { status: 404 })
    }

    // تحديث حالة الدفع
    await db.collection('payments').updateOne(
      { _id: new ObjectId(paymentId) },
      {
        $set: {
          status,
          adminNote: adminNote || '',
          reviewedBy: authUser.id,
          reviewedAt: new Date(),
          updatedAt: new Date(),
        }
      }
    )

    // إذا تمت الموافقة، أضف تسجيل الدورة للمستخدم
    if (status === 'approved' && payment.courseId) {
      const existingEnrollment = await db.collection('enrollments').findOne({
        userId: payment.userId,
        courseId: payment.courseId,
      })

      if (!existingEnrollment) {
        await db.collection('enrollments').insertOne({
          userId: payment.userId,
          courseId: payment.courseId,
          progress: 0,
          completedLessons: [],
          completed: false,
          enrolledAt: new Date(),
          updatedAt: new Date(),
        })
      }
    }

    // Send notification to the user about payment status
    try {
      const courseName = payment.courseName || ''
      if (status === 'approved') {
        await createNotification({
          userId: payment.userId,
          title: 'تمت الموافقة على الدفع',
          message: `تمت الموافقة على طلب الدفع${courseName ? ` لدورة "${courseName}"` : ''}. يمكنك الآن الوصول لجميع الدروس`,
          type: 'payment',
          link: 'courses',
          category: 'payment',
          icon: '✅',
        })
      } else {
        await createNotification({
          userId: payment.userId,
          title: 'تم رفض طلب الدفع',
          message: `تم رفض طلب الدفع${courseName ? ` لدورة "${courseName}"` : ''}${adminNote ? `. السبب: ${adminNote}` : ''}`,
          type: 'warning',
          link: 'subscriptions',
          category: 'payment',
          icon: '❌',
        })
      }
    } catch (e) { /* notification is non-critical */ }

    return NextResponse.json({
      success: true,
      message: status === 'approved' ? 'تمت الموافقة على الدفع' : 'تم رفض الدفع',
    })
  } catch (error: any) {
    console.error('Update payment error:', error)
    return NextResponse.json({ error: 'حدث خطأ في تحديث الدفع' }, { status: 500 })
  }
}
