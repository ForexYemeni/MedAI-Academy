import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'

// GET /api/quizzes/sets - جلب مجموعات الاختبارات
export async function GET(req: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    const { searchParams } = new URL(req.url)

    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const payload = token ? verifyToken(token) : null
    const isAdmin = payload?.role === 'admin'

    const activeOnly = searchParams.get('active') === 'true'
    const category = searchParams.get('category')

    const filter: Record<string, unknown> = {}
    if (activeOnly) filter.active = { $ne: false }
    // Note: We return ALL sets (including inactive) to users so they can see locked state
    if (category) filter.category = category

    const sets = await db.collection('quiz_sets')
      .find(filter)
      .sort({ order: 1, createdAt: -1 })
      .toArray()

    // For each set, count questions
    const setsWithCount = await Promise.all(
      sets.map(async (set) => {
        let questionCount = 0
        if (set.questionIds && set.questionIds.length > 0) {
          const { ObjectId } = await import('mongodb')
          const objectIds = set.questionIds.map((id: string) => {
            try { return new ObjectId(id) } catch { return id }
          })
          questionCount = await db.collection('quizzes').countDocuments({
            _id: { $in: objectIds },
            active: { $ne: false }
          })
        } else if (set.category) {
          // If no specific questions, count all active questions in that category
          questionCount = await db.collection('quizzes').countDocuments({
            category: set.category,
            active: { $ne: false }
          })
        }

        // Get user's best result for this quiz if logged in
        let bestResult = null
        if (payload?.id && !isAdmin) {
          bestResult = await db.collection('quiz_results').findOne(
            { userId: payload.id, quizSetId: set._id.toString() },
            { sort: { percentage: -1 }, projection: { correct: 1, total: 1, percentage: 1, createdAt: 1 } }
          )
        }

        // Count how many users attempted this quiz
        let attemptCount = 0
        if (isAdmin) {
          attemptCount = await db.collection('quiz_results').countDocuments({
            quizSetId: set._id.toString()
          })
        }

        return {
          id: set._id.toString(),
          titleAr: set.titleAr || set.title,
          title: set.title || set.titleAr,
          descriptionAr: set.descriptionAr || set.description,
          description: set.description || set.descriptionAr,
          category: set.category,
          difficulty: set.difficulty,
          questionCount: set.questionCount || questionCount,
          timeLimit: set.timeLimit,
          xpReward: set.xpReward,
          coinReward: set.coinReward,
          icon: set.icon,
          gradient: set.gradient,
          active: set.active !== false,
          order: set.order || 0,
          questionIds: set.questionIds || [],
          attemptCount,
          bestResult: bestResult ? {
            correct: bestResult.correct,
            total: bestResult.total,
            percentage: bestResult.percentage,
          } : null,
          createdAt: set.createdAt,
          updatedAt: set.updatedAt,
        }
      })
    )

    return NextResponse.json({ sets: setsWithCount, total: setsWithCount.length })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'حدث خطأ'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST /api/quizzes/sets - إضافة مجموعة اختبار جديدة (أدمن فقط)
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
    const {
      titleAr, title, descriptionAr, description,
      category, difficulty, questionCount, timeLimit,
      xpReward, coinReward, icon, gradient,
      questionIds, active, order,
    } = body

    if (!titleAr && !title) {
      return NextResponse.json({ error: 'عنوان الاختبار مطلوب' }, { status: 400 })
    }
    if (!category) {
      return NextResponse.json({ error: 'التصنيف مطلوب' }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Get the max order value
    const lastSet = await db.collection('quiz_sets')
      .find({})
      .sort({ order: -1 })
      .limit(1)
      .toArray()
    const nextOrder = order || (lastSet[0]?.order || 0) + 1

    const newSet = {
      titleAr: titleAr || title,
      title: title || titleAr,
      descriptionAr: descriptionAr || description || '',
      description: description || descriptionAr || '',
      category,
      difficulty: difficulty || 'medium',
      questionCount: questionCount || 5,
      timeLimit: timeLimit || 0,
      xpReward: xpReward || 10,
      coinReward: coinReward || 5,
      icon: icon || '📋',
      gradient: gradient || '',
      questionIds: questionIds || [],
      active: active !== false,
      order: nextOrder,
      createdBy: payload.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection('quiz_sets').insertOne(newSet)

    return NextResponse.json({
      success: true,
      set: { ...newSet, id: result.insertedId.toString() }
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'حدث خطأ'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// PUT /api/quizzes/sets - تحديث مجموعة اختبار (أدمن فقط)
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
    const {
      id, titleAr, title, descriptionAr, description,
      category, difficulty, questionCount, timeLimit,
      xpReward, coinReward, icon, gradient,
      questionIds, active, order,
    } = body

    if (!id) {
      return NextResponse.json({ error: 'معرف الاختبار مطلوب' }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const { ObjectId } = await import('mongodb')

    const updateData: Record<string, unknown> = { updatedAt: new Date() }
    if (titleAr !== undefined) updateData.titleAr = titleAr
    if (title !== undefined) updateData.title = title
    if (descriptionAr !== undefined) updateData.descriptionAr = descriptionAr
    if (description !== undefined) updateData.description = description
    if (category !== undefined) updateData.category = category
    if (difficulty !== undefined) updateData.difficulty = difficulty
    if (questionCount !== undefined) updateData.questionCount = questionCount
    if (timeLimit !== undefined) updateData.timeLimit = timeLimit
    if (xpReward !== undefined) updateData.xpReward = xpReward
    if (coinReward !== undefined) updateData.coinReward = coinReward
    if (icon !== undefined) updateData.icon = icon
    if (gradient !== undefined) updateData.gradient = gradient
    if (questionIds !== undefined) updateData.questionIds = questionIds
    if (active !== undefined) updateData.active = active
    if (order !== undefined) updateData.order = order

    const result = await db.collection('quiz_sets').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'الاختبار غير موجود' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'حدث خطأ'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE /api/quizzes/sets - حذف مجموعة اختبار (أدمن فقط)
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
      return NextResponse.json({ error: 'معرف الاختبار مطلوب' }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const { ObjectId } = await import('mongodb')

    const result = await db.collection('quiz_sets').deleteOne({
      _id: new ObjectId(id)
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'الاختبار غير موجود' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'حدث خطأ'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
