import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'

// GET - Fetch AI settings
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const authUser = verifyToken(token)
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 })
    }

    const { db } = await connectToDatabase()
    const settings = await db.collection('ai_settings').findOne({ id: 'main' })

    if (!settings) {
      // Return defaults
      return NextResponse.json({
        success: true,
        settings: {
          enabled: true,
          systemPrompt: '',
          modelName: 'gemini-2.0-flash',
          temperature: 0.7,
          maxTokens: 2000,
          customResponses: [],
          chatHistory: [],
        }
      })
    }

    return NextResponse.json({
      success: true,
      settings: {
        enabled: settings.enabled ?? true,
        systemPrompt: settings.systemPrompt || '',
        modelName: settings.modelName || 'gemini-2.0-flash',
        temperature: settings.temperature ?? 0.7,
        maxTokens: settings.maxTokens ?? 2000,
        customResponses: settings.customResponses || [],
        chatHistory: settings.chatHistory || [],
      }
    })
  } catch (error) {
    console.error('AI settings GET error:', error)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}

// PUT - Update AI settings
export async function PUT(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const authUser = verifyToken(token)
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 })
    }

    const body = await req.json()
    const { enabled, systemPrompt, modelName, temperature, maxTokens, customResponses } = body

    const { db } = await connectToDatabase()

    await db.collection('ai_settings').updateOne(
      { id: 'main' },
      {
        $set: {
          id: 'main',
          enabled: enabled ?? true,
          systemPrompt: systemPrompt || '',
          modelName: modelName || 'gemini-2.0-flash',
          temperature: temperature ?? 0.7,
          maxTokens: maxTokens ?? 2000,
          customResponses: customResponses || [],
          updatedAt: new Date(),
        }
      },
      { upsert: true }
    )

    return NextResponse.json({ success: true, message: 'تم حفظ إعدادات الذكاء الاصطناعي' })
  } catch (error) {
    console.error('AI settings PUT error:', error)
    return NextResponse.json({ error: 'حدث خطأ في الحفظ' }, { status: 500 })
  }
}
