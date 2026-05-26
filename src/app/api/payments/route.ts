import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'

// إنشاء طلب دفع جديد (للمستخدمين)
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    
    const authUser = verifyToken(token)
    if (!authUser) {
      return NextResponse.json({ error: 'جلسة غير صالحة' }, { status: 401 })
    }

    const { courseId, amount, screenshotUrl } = await req.json()

    if (!courseId || !amount) {
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // التحقق من عدم وجود دفع معلق لنفس الدورة
    const existingPayment = await db.collection('payments').findOne({
      userId: authUser.id,
      courseId,
      status: { $in: ['pending', 'approved'] },
    })

    if (existingPayment) {
      if (existingPayment.status === 'approved') {
        return NextResponse.json({ error: 'أنت مسجل بالفعل في هذه الدورة' }, { status: 400 })
      }
      if (existingPayment.status === 'pending') {
        return NextResponse.json({ error: 'لديك طلب دفع معلق لهذه الدورة' }, { status: 400 })
      }
    }

    const payment = {
      userId: authUser.id,
      userName: authUser.name,
      userPhone: authUser.phone,
      courseId,
      amount,
      walletName: '',
      walletPhone: '',
      screenshotUrl: screenshotUrl || '',
      status: 'pending',
      adminNote: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection('payments').insertOne(payment)

    return NextResponse.json({
      success: true,
      paymentId: result.insertedId,
      message: 'تم إرسال طلب الدفع بنجاح، سيتم مراجعته قريباً',
    })
  } catch (error: any) {
    console.error('Create payment error:', error)
    return NextResponse.json({ error: 'حدث خطأ في إرسال طلب الدفع' }, { status: 500 })
  }
}

// جلب مدفوعات المستخدم
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    
    const authUser = verifyToken(token)
    if (!authUser) {
      return NextResponse.json({ error: 'جلسة غير صالحة' }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    const payments = await db.collection('payments')
      .find({ userId: authUser.id })
      .sort({ createdAt: -1 })
      .toArray()

    // إضافة بيانات الدورة لكل دفع
    const { ObjectId } = await import('mongodb')
    const paymentsWithCourse = await Promise.all(
      payments.map(async (payment) => {
        try {
          const course = await db.collection('courses').findOne(
            { _id: new ObjectId(payment.courseId) },
            { projection: { titleAr: 1, title: 1, thumbnail: 1 } }
          )
          return { ...payment, course }
        } catch {
          return { ...payment, course: null }
        }
      })
    )

    return NextResponse.json({
      success: true,
      payments: paymentsWithCourse,
    })
  } catch (error: any) {
    console.error('Get payments error:', error)
    return NextResponse.json({ error: 'حدث خطأ في جلب المدفوعات' }, { status: 500 })
  }
}
