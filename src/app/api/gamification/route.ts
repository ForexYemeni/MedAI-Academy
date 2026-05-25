import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { action, xp, coins } = await req.json()

    // Simulate gamification updates
    const rewards = {
      xpEarned: xp || 0,
      coinsEarned: coins || 0,
      newLevel: false,
      newRank: false,
    }

    if (xp) {
      const newLevel = Math.floor(Math.sqrt(xp / 100)) + 1
      rewards.newLevel = true
    }

    return NextResponse.json(rewards)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update gamification' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    leaderboard: [
      { rank: 1, name: 'د. ليلى القحطاني', xp: 28500 },
      { rank: 2, name: 'د. محمد العلي', xp: 24200 },
      { rank: 3, name: 'د. سارة الأحمد', xp: 19800 },
    ],
    dailyMissions: [
      { id: '1', title: 'الدرس اليومي', completed: false, xpReward: 50 },
      { id: '2', title: 'بطل الاختبارات', completed: false, xpReward: 100 },
    ],
  })
}
