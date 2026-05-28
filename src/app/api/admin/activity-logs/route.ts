import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'

// POST: Create an activity log entry (admin only)
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

    const { action, adminName, details } = await req.json()

    if (!action) {
      return NextResponse.json({ error: 'الإجراء مطلوب' }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    await db.collection('activity_logs').insertOne({
      action,
      adminId: authUser.id,
      adminName: adminName || authUser.name || 'المدير',
      details: details || {},
      createdAt: new Date(),
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Create activity log error:', error)
    return NextResponse.json({ error: 'حدث خطأ في إنشاء سجل العملية' }, { status: 500 })
  }
}
