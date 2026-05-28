import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'

// GET /api/quizzes/sets - جلب مجموعات الاختبارات
export async function GET(req: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    const { ObjectId } = await import('mongodb')
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

    const setIds = sets.map(s => s._id.toString())

    // Batch: Get user's best results for ALL sets in one query
    let bestResultMap = new Map<string, any>()
    if (payload?.id && !isAdmin) {
      const bestResults = await db.collection('quiz_results')
        .find({ userId: payload.id, quizSetId: { $in: setIds } })
        .sort({ percentage: -1 })
        .toArray()
      // Keep only the best result per quizSetId
      for (const r of bestResults) {
        if (!bestResultMap.has(r.quizSetId)) {
          bestResultMap.set(r.quizSetId, r)
        }
      }
    }

    // Batch: Get attempt counts for ALL sets in one aggregation
    let attemptCountMap = new Map<string, number>()
    if (isAdmin) {
      const attemptAgg = await db.collection('quiz_results').aggregate([
        { $match: { quizSetId: { $in: setIds } } },
        { $group: { _id: '$quizSetId', count: { $sum: 1 } } }
      ]).toArray()
      for (const a of attemptAgg) {
        attemptCountMap.set(a._id, a.count)
      }
    }

    // Batch: Get question counts for sets with questionIds
    const setsWithIds = sets.filter(s => s.questionIds && s.questionIds.length > 0)
    const allQuestionObjectIds = setsWithIds.flatMap(s =>
      (s.questionIds as string[]).map((id: string) => {
        try { return new ObjectId(id) } catch { return id }
      })
    )

    let questionActiveCountMap = new Map<string, number>()
    if (allQuestionObjectIds.length > 0) {
      const qCounts = await db.collection('quizzes').aggregate([
        { $match: { _id: { $in: allQuestionObjectIds }, active: { $ne: false } } },
        { $group: { _id: '$_id' } }
      ]).toArray()
      // We just need total active questions, build a set of active IDs
      const activeQIds = new Set(qCounts.map(q => q._id.toString()))
      // Now count per set
      for (const set of setsWithIds) {
        let count = 0
        for (const qid of (set.questionIds as string[])) {
          if (activeQIds.has(qid)) count++
        }
        questionActiveCountMap.set(set._id.toString(), count)
      }
    }

    // Batch: Get question counts for sets by category (no questionIds)
    const setsByCategory = sets.filter(s => (!s.questionIds || s.questionIds.length === 0) && s.category)
    const categories = [...new Set(setsByCategory.map(s => s.category))]
    let categoryCountMap = new Map<string, number>()
    if (categories.length > 0) {
      const catCounts = await db.collection('quizzes').aggregate([
        { $match: { category: { $in: categories }, active: { $ne: false } } },
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]).toArray()
      for (const c of catCounts) {
        categoryCountMap.set(c._id, c.count)
      }
    }

    const setsWithCount = sets.map((set) => {
      const setId = set._id.toString()
      let questionCount = 0

      if (set.questionIds && set.questionIds.length > 0) {
        questionCount = questionActiveCountMap.get(setId) || 0
      } else if (set.category) {
        questionCount = categoryCountMap.get(set.category) || 0
      }

      const bestResult = bestResultMap.get(setId)
      const attemptCount = attemptCountMap.get(setId) || 0

      return {
        id: setId,
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
