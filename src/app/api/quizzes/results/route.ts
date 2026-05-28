import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'

// POST /api/quizzes/results - حفظ نتيجة اختبار
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'رمز غير صالح' }, { status: 401 })

    const body = await req.json()
    const { quizMode, quizSetId, correct, total, xpEarned, coinsEarned, answers } = body

    if ((!quizMode && !quizSetId) || total === undefined) {
      return NextResponse.json({ error: 'بيانات غير مكتملة' }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0

    const result = {
      userId: payload.id,
      userName: payload.name,
      quizMode: quizMode || 'set',
      quizSetId: quizSetId || '',
      correct: correct || 0,
      total: total || 0,
      percentage,
      xpEarned: xpEarned || 0,
      coinsEarned: coinsEarned || 0,
      answers: answers || [],
      createdAt: new Date(),
    }

    await db.collection('quiz_results').insertOne(result)

    // Update user XP and coins
    if (xpEarned > 0 || coinsEarned > 0) {
      await db.collection('users').updateOne(
        { _id: payload.id },
        {
          $inc: {
            xp: xpEarned || 0,
            coins: coinsEarned || 0,
          }
        }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'حدث خطأ'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// GET /api/quizzes/results - جلب لوحة المتصدرين
export async function GET(req: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    const { searchParams } = new URL(req.url)

    const type = searchParams.get('type') || 'leaderboard'
    const limit = parseInt(searchParams.get('limit') || '10')

    if (type === 'leaderboard') {
      // Get top users by quiz performance
      const leaderboard = await db.collection('quiz_results')
        .aggregate([
          {
            $group: {
              _id: '$userId',
              userName: { $first: '$userName' },
              totalCorrect: { $sum: '$correct' },
              totalQuestions: { $sum: '$total' },
              totalQuizzes: { $sum: 1 },
              totalXp: { $sum: '$xpEarned' },
              avgScore: { $avg: { $cond: [{ $gt: ['$total', 0] }, { $divide: ['$correct', '$total'] }, 0] } },
            }
          },
          {
            $addFields: {
              score: { $multiply: ['$avgScore', 100] },
            }
          },
          { $sort: { score: -1, totalCorrect: -1 } },
          { $limit: limit },
        ])
        .toArray()

      // Get user details for each entry
      const leaderboardWithUsers = await Promise.all(
        leaderboard.map(async (entry, index) => {
          const user = await db.collection('users').findOne(
            { _id: entry._id },
            { projection: { name: 1, xp: 1, level: 1, medicalSpecialty: 1, avatar: 1 } }
          )
          return {
            rank: index + 1,
            userId: entry._id?.toString(),
            name: user?.name || entry.userName || 'مستخدم',
            specialty: user?.medicalSpecialty || '',
            xp: user?.xp || 0,
            level: user?.level || 1,
            totalCorrect: entry.totalCorrect,
            totalQuestions: entry.totalQuestions,
            totalQuizzes: entry.totalQuizzes,
            score: Math.round(entry.score),
          }
        })
      )

      return NextResponse.json({ leaderboard: leaderboardWithUsers })
    }

    if (type === 'stats') {
      // Get overall quiz statistics
      const totalResults = await db.collection('quiz_results').countDocuments()
      const avgScore = await db.collection('quiz_results').aggregate([
        {
          $group: {
            _id: null,
            avgCorrect: { $avg: { $cond: [{ $gt: ['$total', 0] }, { $divide: ['$correct', '$total'] }, 0] } },
            totalXp: { $sum: '$xpEarned' },
          }
        }
      ]).toArray()

      const modeStats = await db.collection('quiz_results').aggregate([
        {
          $group: {
            _id: '$quizMode',
            count: { $sum: 1 },
            avgScore: { $avg: { $cond: [{ $gt: ['$total', 0] }, { $divide: ['$correct', '$total'] }, 0] } },
          }
        }
      ]).toArray()

      return NextResponse.json({
        totalResults,
        avgScore: avgScore[0]?.avgCorrect ? Math.round(avgScore[0].avgCorrect * 100) : 0,
        totalXpEarned: avgScore[0]?.totalXp || 0,
        modeStats: modeStats.map(s => ({
          mode: s._id,
          count: s.count,
          avgScore: Math.round((s.avgScore || 0) * 100),
        })),
      })
    }

    return NextResponse.json({ error: 'نوع غير معروف' }, { status: 400 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'حدث خطأ'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
