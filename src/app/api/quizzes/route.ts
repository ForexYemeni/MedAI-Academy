import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'

// GET /api/quizzes - جلب الأسئلة (للمستخدمين والأدمن)
export async function GET(req: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    const { searchParams } = new URL(req.url)
    
    const category = searchParams.get('category')
    const difficulty = searchParams.get('difficulty')
    const limit = parseInt(searchParams.get('limit') || '0')
    const random = searchParams.get('random') === 'true'
    
    // Check if admin request (with auth)
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const payload = token ? verifyToken(token) : null
    const isAdmin = payload?.role === 'admin'

    const filter: Record<string, unknown> = { active: { $ne: false } }
    if (category) filter.category = category
    if (difficulty) filter.difficulty = difficulty

    let questions
    if (random && limit > 0) {
      // Random questions for quiz (user-facing)
      questions = await db.collection('quizzes')
        .aggregate([
          { $match: filter },
          { $sample: { size: limit } }
        ])
        .toArray()
    } else if (isAdmin) {
      // Admin sees all questions with full details
      questions = await db.collection('quizzes')
        .find(filter)
        .sort({ createdAt: -1 })
        .toArray()
    } else {
      // Regular user gets active questions
      questions = await db.collection('quizzes')
        .find(filter, { projection: { correctIndex: 0 } })
        .sort({ order: 1 })
        .toArray()
    }

    // For regular users, add correctIndex back (needed for quiz functionality)
    if (!isAdmin) {
      const fullQuestions = await db.collection('quizzes')
        .find(filter)
        .sort({ order: 1 })
        .toArray()
      questions = fullQuestions
    }

    if (limit > 0 && !random) {
      questions = questions.slice(0, limit)
    }

    const formatted = questions.map(q => ({
      id: q._id.toString(),
      question: q.question,
      questionAr: q.questionAr || q.question,
      options: q.options,
      optionsAr: q.optionsAr || q.options,
      correctIndex: q.correctIndex,
      explanation: q.explanation,
      explanationAr: q.explanationAr || q.explanation,
      difficulty: q.difficulty,
      category: q.category,
      active: q.active !== false,
      createdAt: q.createdAt,
    }))

    return NextResponse.json({ questions: formatted, total: formatted.length })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'حدث خطأ'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST /api/quizzes - إضافة سؤال جديد (أدمن فقط)
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'رمز غير صالح' }, { status: 401 })

    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'ليس لديك صلاحية' }, { status: 403 })
    }

    const body = await req.json()
    const { question, questionAr, options, optionsAr, correctIndex, explanation, explanationAr, difficulty, category, active } = body

    if (!question && !questionAr) {
      return NextResponse.json({ error: 'نص السؤال مطلوب' }, { status: 400 })
    }
    if (!options || options.length < 2) {
      return NextResponse.json({ error: 'يجب إضافة خيارين على الأقل' }, { status: 400 })
    }
    if (correctIndex === undefined || correctIndex < 0 || correctIndex >= options.length) {
      return NextResponse.json({ error: 'يجب تحديد الإجابة الصحيحة' }, { status: 400 })
    }
    if (!category) {
      return NextResponse.json({ error: 'التصنيف مطلوب' }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Get the max order value
    const lastQuestion = await db.collection('quizzes')
      .find({})
      .sort({ order: -1 })
      .limit(1)
      .toArray()
    const nextOrder = (lastQuestion[0]?.order || 0) + 1

    const newQuestion = {
      question: question || questionAr,
      questionAr: questionAr || question,
      options: options,
      optionsAr: optionsAr || options,
      correctIndex,
      explanation: explanation || '',
      explanationAr: explanationAr || explanation || '',
      difficulty: difficulty || 'medium',
      category,
      active: active !== false,
      order: nextOrder,
      createdBy: payload.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection('quizzes').insertOne(newQuestion)

    return NextResponse.json({
      success: true,
      question: { ...newQuestion, id: result.insertedId.toString() }
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'حدث خطأ'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// PUT /api/quizzes - تحديث سؤال (أدمن فقط)
export async function PUT(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'رمز غير صالح' }, { status: 401 })

    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'ليس لديك صلاحية' }, { status: 403 })
    }

    const body = await req.json()
    const { id, question, questionAr, options, optionsAr, correctIndex, explanation, explanationAr, difficulty, category, active } = body

    if (!id) {
      return NextResponse.json({ error: 'معرف السؤال مطلوب' }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const { ObjectId } = await import('mongodb')

    const updateData: Record<string, unknown> = { updatedAt: new Date() }
    if (question !== undefined) updateData.question = question
    if (questionAr !== undefined) updateData.questionAr = questionAr
    if (options !== undefined) updateData.options = options
    if (optionsAr !== undefined) updateData.optionsAr = optionsAr
    if (correctIndex !== undefined) updateData.correctIndex = correctIndex
    if (explanation !== undefined) updateData.explanation = explanation
    if (explanationAr !== undefined) updateData.explanationAr = explanationAr
    if (difficulty !== undefined) updateData.difficulty = difficulty
    if (category !== undefined) updateData.category = category
    if (active !== undefined) updateData.active = active

    const result = await db.collection('quizzes').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'السؤال غير موجود' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'حدث خطأ'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE /api/quizzes - حذف سؤال (أدمن فقط)
export async function DELETE(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'رمز غير صالح' }, { status: 401 })

    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'ليس لديك صلاحية' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'معرف السؤال مطلوب' }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const { ObjectId } = await import('mongodb')

    const result = await db.collection('quizzes').deleteOne({
      _id: new ObjectId(id)
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'السؤال غير موجود' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'حدث خطأ'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
