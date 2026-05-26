import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { action } = await req.json()

    if (action === 'reset-admin-password-flag') {
      const { db } = await connectToDatabase()
      await db.collection('users').updateOne(
        { phone: '770000000' },
        { $set: { mustChangePassword: true, updatedAt: new Date() } }
      )
      return NextResponse.json({ success: true, message: 'تم إعادة تعيين علامة تغيير كلمة المرور' })
    }

    return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Auth API is running',
  })
}
