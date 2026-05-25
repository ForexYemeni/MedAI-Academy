import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { caseId, decisions, timeTaken } = await req.json()

    // Simulate AI evaluation of simulation decisions
    const score = Math.floor(Math.random() * 30) + 70 // 70-100
    
    const evaluation = {
      score,
      correctActions: ['فحص المجرى الهوائي', 'بدء CPR', 'إعطاء أدرينالين'],
      missedActions: ['طلب فحوصات إضافية'],
      timeTaken: timeTaken || 120,
      xpEarned: score > 80 ? 200 : 100,
      coinsEarned: score > 80 ? 40 : 20,
      feedback: score > 80 
        ? 'أداء ممتاز! لقد تعاملت مع الحالة باحترافية عالية.' 
        : 'أداء جيد، لكن هناك بعض النقاط التي يمكن تحسينها.',
    }

    return NextResponse.json(evaluation)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to evaluate simulation' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    cases: [
      { id: '1', title: 'توقف القلب', difficulty: 'hard', specialty: 'emergency' },
      { id: '2', title: 'تقييم السكتة الدماغية', difficulty: 'medium', specialty: 'neurology' },
      { id: '3', title: 'صدمة تحسسية', difficulty: 'medium', specialty: 'emergency' },
    ],
  })
}
