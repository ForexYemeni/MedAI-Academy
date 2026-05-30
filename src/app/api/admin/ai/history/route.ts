import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'

// GET - Fetch recent AI chat logs
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const authUser = verifyToken(token)
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 })
    }

    const { db } = await connectToDatabase()

    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50')

    const logs = await db.collection('ai_chat_logs')
      .find({})
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray()

    const total = await db.collection('ai_chat_logs').countDocuments()

    return NextResponse.json({
      success: true,
      logs: logs.map(l => ({
        _id: l._id,
        userId: l.userId,
        userName: l.userName,
        userMessage: l.userMessage,
        aiResponse: l.aiResponse,
        source: l.source,
        timestamp: l.timestamp,
      })),
      total,
    })
  } catch (error) {
    console.error('AI history GET error:', error)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}

// DELETE - Clear AI chat logs
export async function DELETE(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const authUser = verifyToken(token)
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 })
    }

    const { db } = await connectToDatabase()
    await db.collection('ai_chat_logs').deleteMany({})

    return NextResponse.json({ success: true, message: 'تم حذف سجل المحادثات' })
  } catch (error) {
    console.error('AI history DELETE error:', error)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}
