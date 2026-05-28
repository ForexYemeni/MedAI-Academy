import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'

// جلب طرق الدفع النشطة (للمستخدمين)
export async function GET() {
  try {
    const { db } = await connectToDatabase()
    const methods = await db.collection('payment_methods')
      .find({ active: true })
      .project({ _id: 1, type: 1, name: 1, accountNumber: 1, accountName: 1, instructions: 1 })
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({ success: true, methods })
  } catch (error: any) {
    console.error('Get active payment methods error:', error)
    return NextResponse.json({ error: 'حدث خطأ في جلب طرق الدفع' }, { status: 500 })
  }
}
