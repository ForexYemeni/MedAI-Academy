'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore, type Badge as BadgeType } from '@/store/app-store'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Zap, Coins, Flame, BookOpen, Clock, Trophy, Pencil,
  Lock, CheckCircle2, Circle, ChevronLeft, Settings,
  Bell, Shield, Globe, Info, Star, Award, Target,
  TrendingUp, Heart, Activity, Crown, Sparkles,
  Languages, Volume2, Eye, ChevronDown
} from 'lucide-react'

// ─── Helpers ────────────────────────────────────────────────

function getLevelForXP(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1
}

function xpToNextLevel(xp: number): { current: number; needed: number; percent: number } {
  const level = getLevelForXP(xp)
  const currentLevelXP = (level - 1) * (level - 1) * 100
  const nextLevelXP = level * level * 100
  const inLevel = xp - currentLevelXP
  const needed = nextLevelXP - currentLevelXP
  return { current: inLevel, needed, percent: Math.min(100, (inLevel / needed) * 100) }
}

// ─── Medical Ranks Data ─────────────────────────────────────

const MEDICAL_RANKS = [
  { title: 'طالب طب', titleEn: 'Intern', minXP: 0, icon: '🩺' },
  { title: 'ممرض', titleEn: 'Nurse', minXP: 500, icon: '💊' },
  { title: 'طبيب مقيم', titleEn: 'Resident', minXP: 2000, icon: '🏥' },
  { title: 'أخصائي', titleEn: 'Specialist', minXP: 5000, icon: '⚕️' },
  { title: 'جراح', titleEn: 'Surgeon', minXP: 10000, icon: '🔪' },
  { title: 'خبير طوارئ', titleEn: 'Trauma Master', minXP: 20000, icon: '🚑' },
  { title: 'قائد العناية المركزة', titleEn: 'ICU Commander', minXP: 50000, icon: '👑' },
]

function getRankForXP(xp: number) {
  let rank = MEDICAL_RANKS[0]
  for (const r of MEDICAL_RANKS) {
    if (xp >= r.minXP) rank = r
  }
  return rank
}

function getNextRank(xp: number) {
  for (const r of MEDICAL_RANKS) {
    if (xp < r.minXP) return r
  }
  return null
}

// ─── Activity Heatmap Data ──────────────────────────────────

function generateHeatmapData(): number[][] {
  const data: number[][] = []
  for (let week = 0; week < 4; week++) {
    const row: number[] = []
    for (let day = 0; day < 7; day++) {
      if (week === 3 && day > 2) {
        row.push(Math.random() > 0.3 ? Math.floor(Math.random() * 4) + 1 : 0)
      } else {
        const val = Math.random()
        if (val < 0.15) row.push(0)
        else if (val < 0.35) row.push(1)
        else if (val < 0.6) row.push(2)
        else if (val < 0.85) row.push(3)
        else row.push(4)
      }
    }
    data.push(row)
  }
  return data
}

const HEATMAP_COLORS = [
  'bg-white/5',
  'bg-neon-cyan/20',
  'bg-neon-cyan/40',
  'bg-neon-cyan/60',
  'bg-neon-cyan/80',
]

const DAY_LABELS = ['سبت', 'أحد', 'اثن', 'ثلا', 'أرب', 'خمي', 'جمع']

// ─── Rarity Config ──────────────────────────────────────────

const RARITY_CONFIG: Record<string, { label: string; borderColor: string; glowColor: string; textColor: string; bgColor: string }> = {
  common: { label: 'شائع', borderColor: 'border-gray-500/40', glowColor: '', textColor: 'text-gray-400', bgColor: 'bg-gray-500/10' },
  rare: { label: 'نادر', borderColor: 'border-neon-blue/50', glowColor: 'shadow-[0_0_12px_rgba(0,136,255,0.3)]', textColor: 'text-neon-blue', bgColor: 'bg-neon-blue/10' },
  epic: { label: 'أسطوري', borderColor: 'border-neon-purple/50', glowColor: 'shadow-[0_0_12px_rgba(139,92,246,0.3)]', textColor: 'text-neon-purple', bgColor: 'bg-neon-purple/10' },
  legendary: { label: 'خرافي', borderColor: 'border-amber-400/50', glowColor: 'shadow-[0_0_15px_rgba(245,158,11,0.3)]', textColor: 'text-amber-400', bgColor: 'bg-amber-400/10' },
}

// ─── Animation Variants ─────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

const cardHover = {
  scale: 1.02,
  transition: { duration: 0.25, ease: 'easeOut' },
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  MAIN COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function ProfilePage() {
  const { user, courses, updateUser, openCourse } = useAppStore()
  const [selectedBadge, setSelectedBadge] = useState<BadgeType | null>(null)
  const [heatmapData] = useState(() => generateHeatmapData())
  const [editingProfile, setEditingProfile] = useState(false)

  const xpInfo = useMemo(() => xpToNextLevel(user.xp), [user.xp])
  const currentRankIndex = useMemo(() => {
    let idx = 0
    for (let i = 0; i < MEDICAL_RANKS.length; i++) {
      if (user.xp >= MEDICAL_RANKS[i].minXP) idx = i
    }
    return idx
  }, [user.xp])

  const nextRank = useMemo(() => getNextRank(user.xp), [user.xp])

  const enrolledCourses = useMemo(
    () => courses.filter((c) => c.progress !== undefined && c.progress > 0),
    [courses]
  )

  const stats = useMemo(() => [
    { label: 'نقاط الخبرة', value: user.xp.toLocaleString('ar-EG'), icon: <Zap className="w-5 h-5" />, color: 'text-neon-cyan', bg: 'bg-neon-cyan/10', border: 'border-neon-cyan/20' },
    { label: 'العملات', value: user.coins.toLocaleString('ar-EG'), icon: <Coins className="w-5 h-5" />, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' },
    { label: 'التتابع', value: `${user.streak} يوم`, icon: <Flame className="w-5 h-5" />, color: 'text-neon-orange', bg: 'bg-neon-orange/10', border: 'border-neon-orange/20' },
    { label: 'دورات مكتملة', value: user.completedCourses.toString(), icon: <BookOpen className="w-5 h-5" />, color: 'text-neon-green', bg: 'bg-neon-green/10', border: 'border-neon-green/20' },
    { label: 'ساعات الدراسة', value: `${user.totalHours} ساعة`, icon: <Clock className="w-5 h-5" />, color: 'text-neon-purple', bg: 'bg-neon-purple/10', border: 'border-neon-purple/20' },
    { label: 'الترتيب', value: '#5', icon: <Trophy className="w-5 h-5" />, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' },
  ], [user])

  const allBadges: BadgeType[] = useMemo(() => [
    ...user.badges,
    { id: '7', name: 'Speed Runner', nameAr: 'عدّاء السرعة', description: 'أكمل محاكاة في أقل من 5 دقائق', icon: '⚡', earned: false, rarity: 'epic' },
    { id: '8', name: 'Team Player', nameAr: 'لاعب فريق', description: 'شارك في 10 نقاشات جماعية', icon: '🤝', earned: false, rarity: 'rare' },
    { id: '9', name: 'Scholar', nameAr: 'عالم', description: 'أكمل 50 درساً', icon: '📚', earned: false, rarity: 'common' },
    { id: '10', name: 'Perfect Score', nameAr: 'درجة كاملة', description: 'احصل على 100% في 5 اختبارات', icon: '💯', earned: false, rarity: 'legendary' },
  ], [user.badges])

  const settingsItems = useMemo(() => [
    { label: 'اللغة', labelEn: 'العربية / English', icon: <Languages className="w-5 h-5" />, color: 'text-neon-cyan', bg: 'bg-neon-cyan/10' },
    { label: 'الإشعارات', labelEn: '', icon: <Bell className="w-5 h-5" />, color: 'text-neon-purple', bg: 'bg-neon-purple/10' },
    { label: 'الخصوصية', labelEn: '', icon: <Shield className="w-5 h-5" />, color: 'text-neon-green', bg: 'bg-neon-green/10' },
    { label: 'حول التطبيق', labelEn: '', icon: <Info className="w-5 h-5" />, color: 'text-muted-foreground', bg: 'bg-white/5' },
  ], [])

  // ─── Render ────────────────────────────────────────────

  return (
    <motion.div
      dir="rtl"
      className="min-h-screen w-full pb-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-6">

        {/* ═══════════════════════════════════════════════════
            1. PROFILE HEADER
        ═══════════════════════════════════════════════════ */}
        <motion.section variants={itemVariants} className="relative overflow-hidden rounded-2xl">
          {/* Banner gradient */}
          <div className="absolute inset-0 bg-gradient-to-bl from-neon-cyan/20 via-neon-purple/15 to-neon-blue/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-med-dark via-transparent to-transparent" />
          {/* Animated orbs */}
          <div className="absolute top-4 left-10 w-32 h-32 rounded-full bg-neon-cyan/10 blur-3xl animate-float" />
          <div className="absolute bottom-4 right-10 w-24 h-24 rounded-full bg-neon-purple/10 blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
          {/* ECG line decoration */}
          <svg className="absolute bottom-0 left-0 w-full h-16 opacity-20" viewBox="0 0 600 40" preserveAspectRatio="none">
            <path d="M0,20 L100,20 L120,5 L140,35 L160,10 L180,30 L200,20 L300,20 L320,5 L340,35 L360,10 L380,30 L400,20 L500,20 L520,5 L540,35 L560,10 L580,30 L600,20" stroke="#00f5ff" strokeWidth="2" fill="none" className="ecg-animate" />
          </svg>

          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              {/* Avatar with neon ring */}
              <div className="relative shrink-0">
                <div className="absolute -inset-1.5 rounded-full bg-gradient-to-bl from-neon-cyan via-neon-purple to-neon-pink opacity-60 animate-neon-pulse" />
                <Avatar className="h-24 w-24 border-4 border-med-dark relative z-10">
                  <AvatarFallback className="bg-gradient-to-br from-neon-cyan/30 to-neon-purple/30 text-3xl font-bold text-white">
                    أ.خ
                  </AvatarFallback>
                </Avatar>
                {/* Level badge */}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 z-20">
                  <div className="flex items-center gap-1 rounded-full bg-gradient-to-l from-neon-cyan to-neon-blue px-3 py-0.5 shadow-[0_0_15px_rgba(0,245,255,0.4)]">
                    <Star className="w-3 h-3 text-med-dark fill-med-dark" />
                    <span className="text-xs font-black text-med-dark">المستوى {user.level}</span>
                  </div>
                </div>
              </div>

              {/* User info */}
              <div className="flex-1 text-center sm:text-right">
                <h1 className="text-2xl sm:text-3xl font-black neon-text">{user.name}</h1>
                <div className="flex items-center gap-2 justify-center sm:justify-start mt-2">
                  <span className="text-xl">{user.rankIcon}</span>
                  <span className="text-base font-bold text-neon-cyan">{user.rankTitle}</span>
                  <Badge className="text-[10px] bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30">
                    {user.medicalSpecialty}
                  </Badge>
                </div>

                {/* XP progress */}
                <div className="mt-4 max-w-md mx-auto sm:mx-0">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">التقدم للمستوى التالي</span>
                    <span className="font-bold text-neon-cyan">{xpInfo.current.toLocaleString('ar-EG')} / {xpInfo.needed.toLocaleString('ar-EG')} XP</span>
                  </div>
                  <div className="h-3 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${xpInfo.percent}%` }}
                      transition={{ duration: 1.2, ease: 'easeOut' }}
                      className="h-full rounded-full bg-gradient-to-l from-neon-cyan via-neon-blue to-neon-purple relative overflow-hidden"
                    >
                      <div className="absolute inset-0 animate-shimmer" />
                    </motion.div>
                  </div>
                  {nextRank && (
                    <p className="text-xs text-muted-foreground mt-1.5">
                      متبقي {(nextRank.minXP - user.xp).toLocaleString('ar-EG')} XP لرتبة &quot;{nextRank.title}&quot; {nextRank.icon}
                    </p>
                  )}
                </div>
              </div>

              {/* Edit button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setEditingProfile(true)}
                className="shrink-0 flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm font-medium text-white hover:bg-neon-cyan/10 hover:border-neon-cyan/30 transition-all"
              >
                <Pencil className="w-4 h-4" />
                تعديل الملف
              </motion.button>
            </div>
          </div>
        </motion.section>

        {/* ═══════════════════════════════════════════════════
            2. STATS GRID
        ═══════════════════════════════════════════════════ */}
        <motion.section variants={itemVariants}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06 }}
                whileHover={cardHover}
                className={`glass-card p-4 sm:p-5 relative overflow-hidden border ${stat.border}`}
              >
                <div className="absolute top-2 left-2 opacity-10">
                  <div className="w-12 h-12">{stat.icon}</div>
                </div>
                <div className="relative z-10">
                  <div className={`rounded-xl ${stat.bg} w-10 h-10 flex items-center justify-center mb-3`}>
                    <span className={stat.color}>{stat.icon}</span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-white">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ═══════════════════════════════════════════════════
            3. MEDICAL RANKS PROGRESS
        ═══════════════════════════════════════════════════ */}
        <motion.section variants={itemVariants}>
          <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
            <Award className="h-5 w-5 text-amber-400" />
            مسار الرتب الطبية
          </h2>
          <div className="glass-card p-5 sm:p-6 neon-glow relative overflow-hidden">
            <div className="absolute top-0 left-0 w-40 h-40 bg-neon-purple/5 rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="space-y-1">
                {MEDICAL_RANKS.map((rank, i) => {
                  const isCompleted = i < currentRankIndex
                  const isCurrent = i === currentRankIndex
                  const isLocked = i > currentRankIndex
                  const xpNeeded = isLocked ? rank.minXP - user.xp : 0

                  return (
                    <motion.div
                      key={rank.title}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className={`flex items-center gap-4 p-3 rounded-xl transition-all ${
                        isCurrent
                          ? 'bg-neon-cyan/10 border border-neon-cyan/25 shadow-[0_0_20px_rgba(0,245,255,0.08)]'
                          : isCompleted
                          ? 'bg-white/3 hover:bg-white/5'
                          : 'opacity-50'
                      }`}
                    >
                      {/* Timeline connector */}
                      <div className="flex flex-col items-center shrink-0">
                        <div className={`
                          w-10 h-10 rounded-full flex items-center justify-center text-lg
                          ${isCompleted ? 'bg-neon-green/20 border-2 border-neon-green/40' : ''}
                          ${isCurrent ? 'bg-neon-cyan/20 border-2 border-neon-cyan/50 shadow-[0_0_15px_rgba(0,245,255,0.3)]' : ''}
                          ${isLocked ? 'bg-white/5 border-2 border-white/10' : ''}
                        `}>
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 text-neon-green" />
                          ) : isCurrent ? (
                            <motion.span
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ repeat: Infinity, duration: 1.5 }}
                            >
                              {rank.icon}
                            </motion.span>
                          ) : (
                            <Lock className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                        {i < MEDICAL_RANKS.length - 1 && (
                          <div className={`w-0.5 h-4 mt-1 rounded-full ${
                            isCompleted ? 'bg-neon-green/30' : 'bg-white/10'
                          }`} />
                        )}
                      </div>

                      {/* Rank info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{rank.icon} {rank.title}</span>
                          {isCurrent && (
                            <Badge className="text-[10px] bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30 animate-neon-pulse">
                              الرتبة الحالية
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {rank.minXP.toLocaleString('ar-EG')} XP
                          </span>
                          {isLocked && xpNeeded > 0 && (
                            <span className="text-xs text-neon-cyan/60">
                              متبقي {xpNeeded.toLocaleString('ar-EG')} XP
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status */}
                      <div className="shrink-0">
                        {isCompleted && (
                          <span className="text-xs font-semibold text-neon-green">مكتملة ✓</span>
                        )}
                        {isCurrent && (
                          <span className="text-xs font-semibold text-neon-cyan">الحالية</span>
                        )}
                        {isLocked && (
                          <span className="text-xs text-muted-foreground">مقفل 🔒</span>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </div>
        </motion.section>

        {/* ═══════════════════════════════════════════════════
            4. BADGES COLLECTION
        ═══════════════════════════════════════════════════ */}
        <motion.section variants={itemVariants}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-neon-purple" />
              مجموعة الشارات
            </h2>
            <span className="text-xs text-muted-foreground">
              {user.badges.filter(b => b.earned).length}/{allBadges.length} مكتسبة
            </span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {allBadges.map((badge, i) => {
              const rarity = RARITY_CONFIG[badge.rarity]
              return (
                <motion.button
                  key={badge.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ scale: 1.08, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedBadge(badge)}
                  className={`
                    relative glass-card p-3 sm:p-4 flex flex-col items-center gap-2 border ${rarity.borderColor}
                    ${badge.earned ? rarity.glowColor : 'opacity-50 grayscale'}
                    transition-all
                  `}
                >
                  {/* Badge icon */}
                  <div className={`text-3xl sm:text-4xl relative ${badge.earned ? '' : 'grayscale'}`}>
                    {badge.icon}
                    {!badge.earned && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Lock className="w-4 h-4 text-white/60" />
                      </div>
                    )}
                  </div>
                  {/* Badge name */}
                  <span className={`text-[10px] sm:text-xs font-semibold text-center leading-4 ${badge.earned ? 'text-white' : 'text-muted-foreground'}`}>
                    {badge.nameAr}
                  </span>
                  {/* Rarity indicator */}
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${rarity.bgColor} ${rarity.textColor}`}>
                    {rarity.label}
                  </span>
                </motion.button>
              )
            })}
          </div>
        </motion.section>

        {/* ═══════════════════════════════════════════════════
            5. STUDY ACTIVITY HEATMAP
        ═══════════════════════════════════════════════════ */}
        <motion.section variants={itemVariants}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Activity className="h-5 w-5 text-neon-green" />
              نشاط الدراسة
            </h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>أقل</span>
              <div className="flex gap-1">
                {HEATMAP_COLORS.map((color, i) => (
                  <div key={i} className={`w-3 h-3 rounded-sm ${color}`} />
                ))}
              </div>
              <span>أكثر</span>
            </div>
          </div>
          <div className="glass-card p-5 overflow-x-auto">
            <div className="min-w-[400px]">
              {/* Day labels */}
              <div className="flex items-center gap-1 mb-2">
                <div className="w-8" /> {/* spacer */}
                {DAY_LABELS.map((day) => (
                  <div key={day} className="flex-1 text-center text-[10px] text-muted-foreground">{day}</div>
                ))}
              </div>
              {/* Heatmap grid */}
              <div className="space-y-1.5">
                {heatmapData.map((week, weekIdx) => (
                  <div key={weekIdx} className="flex items-center gap-1">
                    <div className="w-8 text-[10px] text-muted-foreground text-left">
                      أسبوع {weekIdx + 1}
                    </div>
                    {week.map((val, dayIdx) => {
                      const isCurrentStreak = weekIdx === 3 && dayIdx <= 2
                      return (
                        <motion.div
                          key={dayIdx}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: (weekIdx * 7 + dayIdx) * 0.02 }}
                          className={`
                            flex-1 aspect-square rounded-md ${HEATMAP_COLORS[val]}
                            ${isCurrentStreak ? 'ring-1 ring-neon-cyan/50' : ''}
                            hover:ring-1 hover:ring-white/30 transition-all cursor-pointer
                          `}
                          title={`${DAY_LABELS[dayIdx]} - أسبوع ${weekIdx + 1}`}
                        />
                      )
                    })}
                  </div>
                ))}
              </div>
              {/* Streak info */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-neon-orange animate-heartbeat" />
                  <span className="text-sm font-semibold text-neon-orange">{user.streak} يوم متتالي</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  أعلى تتابع: {user.maxStreak} يوم 🔥
                </span>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ═══════════════════════════════════════════════════
            6. LEARNING PATH - CURRENT COURSES
        ═══════════════════════════════════════════════════ */}
        <motion.section variants={itemVariants}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Target className="h-5 w-5 text-neon-cyan" />
              مسار التعلم
            </h2>
            <span className="text-xs text-muted-foreground">
              {enrolledCourses.length} دورة نشطة
            </span>
          </div>
          <div className="space-y-3">
            {enrolledCourses.length > 0 ? (
              enrolledCourses.map((course, i) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  whileHover={cardHover}
                  className="glass-card p-4 flex items-center gap-4"
                >
                  {/* Course icon */}
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 border border-neon-cyan/15 flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5 text-neon-cyan" />
                  </div>
                  {/* Course info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-white truncate">{course.titleAr}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{course.instructor} · {course.duration}</p>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${course.progress}%` }}
                          transition={{ duration: 1, delay: i * 0.15 }}
                          className="h-full rounded-full bg-gradient-to-l from-neon-cyan to-neon-blue"
                        />
                      </div>
                      <span className="text-xs font-bold text-neon-cyan shrink-0">{course.progress}%</span>
                    </div>
                  </div>
                  {/* Continue button */}
                  <Button
                    size="sm"
                    onClick={() => openCourse(course.id)}
                    className="bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/20 h-8 text-xs px-3 shrink-0"
                  >
                    متابعة
                  </Button>
                </motion.div>
              ))
            ) : (
              <div className="glass-card p-8 text-center">
                <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">لم تسجل في أي دورة بعد</p>
              </div>
            )}
          </div>
        </motion.section>

        {/* ═══════════════════════════════════════════════════
            7. SETTINGS QUICK LINKS
        ═══════════════════════════════════════════════════ */}
        <motion.section variants={itemVariants}>
          <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
            <Settings className="h-5 w-5 text-muted-foreground" />
            الإعدادات
          </h2>
          <div className="glass-card divide-y divide-white/5">
            {settingsItems.map((item, i) => (
              <motion.button
                key={item.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ backgroundColor: 'rgba(0,245,255,0.03)' }}
                className="w-full flex items-center gap-4 p-4 text-right transition-colors"
              >
                <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center ${item.color}`}>
                  {item.icon}
                </div>
                <div className="flex-1">
                  <span className="text-sm font-semibold text-white">{item.label}</span>
                  {item.labelEn && (
                    <p className="text-xs text-muted-foreground">{item.labelEn}</p>
                  )}
                </div>
                <ChevronLeft className="w-4 h-4 text-muted-foreground rtl-flip" />
              </motion.button>
            ))}
          </div>
        </motion.section>

      </div>

      {/* ═══════════════════════════════════════════════════
          BADGE DETAIL DIALOG
      ═══════════════════════════════════════════════════ */}
      <Dialog open={!!selectedBadge} onOpenChange={() => setSelectedBadge(null)}>
        <DialogContent className="glass-strong border-neon-cyan/20 max-w-sm" dir="rtl">
          {selectedBadge && (() => {
            const rarity = RARITY_CONFIG[selectedBadge.rarity]
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="text-center">تفاصيل الشارة</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center gap-4 py-4">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className={`w-24 h-24 rounded-2xl flex items-center justify-center text-5xl border-2 ${rarity.borderColor} ${selectedBadge.earned ? rarity.glowColor : 'grayscale opacity-50'}`}
                  >
                    {selectedBadge.icon}
                  </motion.div>
                  <div className="text-center">
                    <h3 className="text-lg font-bold text-white">{selectedBadge.nameAr}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{selectedBadge.description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-3 py-1 rounded-full ${rarity.bgColor} ${rarity.textColor} font-semibold`}>
                      {rarity.label}
                    </span>
                    {selectedBadge.earned ? (
                      <span className="text-xs px-3 py-1 rounded-full bg-neon-green/10 text-neon-green font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        مكتسبة
                      </span>
                    ) : (
                      <span className="text-xs px-3 py-1 rounded-full bg-white/5 text-muted-foreground font-semibold flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        مقفلة
                      </span>
                    )}
                  </div>
                  {selectedBadge.earnedAt && (
                    <p className="text-xs text-muted-foreground">
                      اكتُسبت في {new Date(selectedBadge.earnedAt).toLocaleDateString('ar-EG')}
                    </p>
                  )}
                </div>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
