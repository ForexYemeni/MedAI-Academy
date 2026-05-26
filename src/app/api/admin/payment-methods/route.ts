import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'

// جلب طرق الدفع
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
    const methods = await db.collection('payment_methods')
      .find({})
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({ success: true, methods })
  } catch (error: any) {
    console.error('Get payment methods error:', error)
    return NextResponse.json({ error: 'حدث خطأ في جلب طرق الدفع' }, { status: 500 })
  }
}

// إضافة طريقة دفع جديدة
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    
    const authUser = verifyToken(token)
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 })
    }

    const { type, name, accountNumber, accountName, instructions, active } = await req.json()

    if (!name || !accountNumber || !accountName) {
      return NextResponse.json({ error: 'اسم المحفظة ورقمها واسم صاحبها مطلوبون' }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const method = {
      type: type || 'محفظة إلكترونية',
      name,
      accountNumber,
      accountName,
      instructions: instructions || '',
      active: active !== false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection('payment_methods').insertOne(method)

    return NextResponse.json({
      success: true,
      methodId: result.insertedId,
      message: 'تم إضافة طريقة الدفع بنجاح',
    })
  } catch (error: any) {
    console.error('Create payment method error:', error)
    return NextResponse.json({ error: 'حدث خطأ في إضافة طريقة الدفع' }, { status: 500 })
  }
}

// تعديل طريقة دفع
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

    const { methodId, ...updates } = await req.json()

    if (!methodId) {
      return NextResponse.json({ error: 'معرف طريقة الدفع مطلوب' }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const { ObjectId } = await import('mongodb')

    updates.updatedAt = new Date()

    await db.collection('payment_methods').updateOne(
      { _id: new ObjectId(methodId) },
      { $set: updates }
    )

    return NextResponse.json({
      success: true,
      message: 'تم تعديل طريقة الدفع بنجاح',
    })
  } catch (error: any) {
    console.error('Update payment method error:', error)
    return NextResponse.json({ error: 'حدث خطأ في تعديل طريقة الدفع' }, { status: 500 })
  }
}

// حذف طريقة دفع
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

    const { methodId } = await req.json()
    if (!methodId) {
      return NextResponse.json({ error: 'معرف طريقة الدفع مطلوب' }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const { ObjectId } = await import('mongodb')

    await db.collection('payment_methods').deleteOne({ _id: new ObjectId(methodId) })

    return NextResponse.json({
      success: true,
      message: 'تم حذف طريقة الدفع بنجاح',
    })
  } catch (error: any) {
    console.error('Delete payment method error:', error)
    return NextResponse.json({ error: 'حدث خطأ في حذف طريقة الدفع' }, { status: 500 })
  }
}
