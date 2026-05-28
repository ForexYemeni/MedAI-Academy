'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore, type Badge as BadgeType } from '@/store/app-store'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Zap, BookOpen, Clock, Trophy, Pencil,
  Lock, CheckCircle2, ChevronLeft, Settings,
  Bell, Shield, Info, Star, Award, Target,
  Sparkles, LogOut, Loader2,
  Languages, Flame
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

// ─── Default fallback texts ────────────────────────────────

const DEFAULT_PRIVACY_TEXT = 'أكاديمية نبض تحترم خصوصيتك. نلتزم بحماية بياناتك الشخصية وعدم مشاركتها مع أطراف ثالثة. يتم استخدام بياناتك فقط لتقديم خدمات التعليم الطبي وتحسين تجربتك. يحق لك حذف حسابك وبياناتك في أي وقت بالتواصل مع إدارة المنصة.'

const DEFAULT_ABOUT_TEXT = 'أكاديمية نبض - المنصة الطبية الذكية. منصة تعليم طبي عربية متكاملة مدعومة بالذكاء الاصطناعي. نوفر دورات طبية تفاعلية، محاكاة سريرية، اختبارات ذكية، ومساعد AI شخصي. هدفنا تمكين الطلاب والأطباء العرب من التعلم الطبي بأعلى جودة.'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  MAIN COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function ProfilePage() {
  const { user, courses, updateUser, openCourse, courseProgress, logout, authToken, notifications } = useAppStore()

  // ─── State ────────────────────────────────────────────
  const [selectedBadge, setSelectedBadge] = useState<BadgeType | null>(null)
  const [editingProfile, setEditingProfile] = useState(false)
  const [editName, setEditName] = useState('')
  const [editSpecialty, setEditSpecialty] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  // Dialog states
  const [showNotifications, setShowNotifications] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)
  const [showAbout, setShowAbout] = useState(false)

  // Privacy / About fetched content
  const [privacyText, setPrivacyText] = useState<string | null>(null)
  const [privacyLoading, setPrivacyLoading] = useState(false)
  const [aboutText, setAboutText] = useState<string | null>(null)
  const [aboutLoading, setAboutLoading] = useState(false)

  // ─── Auth token helper ────────────────────────────────
  const getToken = useCallback(() => {
    return authToken || (typeof window !== 'undefined' ? localStorage.getItem('medai-token') : null)
  }, [authToken])

  // ─── Profile edit handlers ────────────────────────────
  const handleOpenEditProfile = useCallback(() => {
    setEditName(user.name)
    setEditSpecialty(user.medicalSpecialty)
    setEditingProfile(true)
  }, [user.name, user.medicalSpecialty])

  const handleSaveProfile = useCallback(async () => {
    setEditSaving(true)
    try {
      const token = getToken()
      if (token) {
        await fetch('/api/auth', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: editName, medicalSpecialty: editSpecialty }),
        })
      }
      updateUser({ name: editName, medicalSpecialty: editSpecialty })
      setEditingProfile(false)
    } catch {
      // Still update locally even if API fails
      updateUser({ name: editName, medicalSpecialty: editSpecialty })
      setEditingProfile(false)
    } finally {
      setEditSaving(false)
    }
  }, [editName, editSpecialty, getToken, updateUser])

  // ─── Fetch privacy text ───────────────────────────────
  const handleOpenPrivacy = useCallback(() => {
    setShowPrivacy(true)
    if (privacyText === null) {
      setPrivacyLoading(true)
      fetch('/api/settings/privacy')
        .then(r => r.json())
        .then(data => {
          setPrivacyText(data.text || data.content || DEFAULT_PRIVACY_TEXT)
        })
        .catch(() => {
          setPrivacyText(DEFAULT_PRIVACY_TEXT)
        })
        .finally(() => setPrivacyLoading(false))
    }
  }, [privacyText])

  // ─── Fetch about text ─────────────────────────────────
  const handleOpenAbout = useCallback(() => {
    setShowAbout(true)
    if (aboutText === null) {
      setAboutLoading(true)
      fetch('/api/settings/about')
        .then(r => r.json())
        .then(data => {
          setAboutText(data.text || data.content || DEFAULT_ABOUT_TEXT)
        })
        .catch(() => {
          setAboutText(DEFAULT_ABOUT_TEXT)
        })
        .finally(() => setAboutLoading(false))
    }
  }, [aboutText])

  // ─── Computed values ──────────────────────────────────
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
    () => {
      const enrolledIds = courseProgress.map(p => p.courseId)
      return courses.filter((c) => enrolledIds.includes(c.id))
    },
    [courses, courseProgress]
  )

  const totalCompletedLessons = useMemo(
    () => courseProgress.reduce((sum, p) => sum + p.completedLessons.length, 0),
    [courseProgress]
  )

  const stats = useMemo(() => [
    { label: 'دورات مسجلة', value: String(enrolledCourses.length), icon: <BookOpen className="w-5 h-5" />, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
    { label: 'دروس مكتملة', value: totalCompletedLessons.toString(), icon: <CheckCircle2 className="w-5 h-5" />, color: 'text-neon-green', bg: 'bg-neon-green/10', border: 'border-neon-green/20' },
    { label: 'ساعات الدراسة', value: `${user.totalHours} ساعة`, icon: <Clock className="w-5 h-5" />, color: 'text-neon-purple', bg: 'bg-neon-purple/10', border: 'border-neon-purple/20' },
    { label: 'شهادات', value: user.completedCourses.toString(), icon: <Award className="w-5 h-5" />, color: 'text-neon-orange', bg: 'bg-neon-orange/10', border: 'border-neon-orange/20' },
  ], [user, enrolledCourses, totalCompletedLessons])

  // Dynamic badges based on real user stats
  const allBadges: BadgeType[] = useMemo(() => {
    const extraBadges: BadgeType[] = [
      { id: '7', name: 'Speed Runner', nameAr: 'عدّاء السرعة', description: 'أكمل محاكاة في أقل من 5 دقائق', icon: '⚡', earned: false, rarity: 'epic' },
      { id: '8', name: 'Team Player', nameAr: 'لاعب فريق', description: 'شارك في 10 نقاشات جماعية', icon: '🤝', earned: false, rarity: 'rare' },
      { id: '9', name: 'Scholar', nameAr: 'عالم', description: 'أكمل 10 دروس', icon: '📚', earned: totalCompletedLessons >= 10, rarity: 'common', earnedAt: totalCompletedLessons >= 10 ? Date.now() : undefined },
      { id: '10', name: 'Perfect Score', nameAr: 'درجة كاملة', description: 'احصل على 100% في 5 اختبارات', icon: '💯', earned: false, rarity: 'legendary' },
    ]
    // Check "أول خطوة" badge - earned when user has at least 1 completed lesson
    const firstStepBadge: BadgeType = {
      id: '11',
      name: 'First Step',
      nameAr: 'أول خطوة',
      description: 'أكمل أول درس',
      icon: '👣',
      earned: totalCompletedLessons >= 1,
      rarity: 'common',
      earnedAt: totalCompletedLessons >= 1 ? Date.now() : undefined,
    }
    // Check if user already has "أول خطوة" badge in their badges
    const hasFirstStep = user.badges.some(b => b.nameAr === 'أول خطوة')
    if (!hasFirstStep) {
      extraBadges.unshift(firstStepBadge)
    }
    return [...user.badges, ...extraBadges]
  }, [user.badges, totalCompletedLessons])

  const settingsItems = useMemo(() => [
    { label: 'اللغة', labelEn: 'العربية / English', icon: <Languages className="w-5 h-5" />, color: 'text-neon-cyan', bg: 'bg-neon-cyan/10', action: () => {} },
    { label: 'الإشعارات', labelEn: '', icon: <Bell className="w-5 h-5" />, color: 'text-neon-purple', bg: 'bg-neon-purple/10', action: () => setShowNotifications(true) },
    { label: 'الخصوصية', labelEn: '', icon: <Shield className="w-5 h-5" />, color: 'text-neon-green', bg: 'bg-neon-green/10', action: () => handleOpenPrivacy() },
    { label: 'حول التطبيق', labelEn: '', icon: <Info className="w-5 h-5" />, color: 'text-muted-foreground', bg: 'bg-muted/30', action: () => handleOpenAbout() },
  ], [handleOpenPrivacy, handleOpenAbout])

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
                  <AvatarFallback className="bg-gradient-to-br from-neon-cyan/30 to-neon-purple/30 text-3xl font-bold text-foreground">
                    {user.name ? user.name.substring(0, 2) : '??'}
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
                  <div className="h-3 rounded-full bg-muted/30 overflow-hidden">
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
                onClick={handleOpenEditProfile}
                className="shrink-0 flex items-center gap-2 rounded-xl bg-muted/30 border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-neon-cyan/10 hover:border-neon-cyan/30 transition-all"
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
                  <p className="text-2xl sm:text-3xl font-black text-foreground">{stat.value}</p>
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
          <h2 className="text-lg font-bold flex items-center gap-2 mb-2">
            <Award className="h-5 w-5 text-amber-400" />
            مسار الرتب الطبية
          </h2>
          {/* XP info box */}
          <div className="mb-4 p-3 rounded-xl bg-neon-cyan/5 border border-neon-cyan/15">
            <div className="flex items-start gap-2">
              <Zap className="w-4 h-4 text-neon-cyan shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-5">
                اكسب نقاط الخبرة (XP) من خلال: إكمال الدروس (25 XP)، إكمال الاختبارات (50 XP)، المشاركة في المجتمع (10 XP)، الإنجازات اليومية (15-30 XP)
              </p>
            </div>
          </div>
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
                          ? 'bg-muted/30 hover:bg-muted/50'
                          : 'opacity-50'
                      }`}
                    >
                      {/* Timeline connector */}
                      <div className="flex flex-col items-center shrink-0">
                        <div className={`
                          w-10 h-10 rounded-full flex items-center justify-center text-lg
                          ${isCompleted ? 'bg-neon-green/20 border-2 border-neon-green/40' : ''}
                          ${isCurrent ? 'bg-neon-cyan/20 border-2 border-neon-cyan/50 shadow-[0_0_15px_rgba(0,245,255,0.3)]' : ''}
                          ${isLocked ? 'bg-muted/30 border-2 border-border' : ''}
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
                            isCompleted ? 'bg-neon-green/30' : 'bg-border'
                          }`} />
                        )}
                      </div>

                      {/* Rank info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-foreground">{rank.icon} {rank.title}</span>
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
              {allBadges.filter(b => b.earned).length}/{allBadges.length} مكتسبة
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
                        <Lock className="w-4 h-4 text-muted-foreground/60" />
                      </div>
                    )}
                  </div>
                  {/* Badge name */}
                  <span className={`text-[10px] sm:text-xs font-semibold text-center leading-4 ${badge.earned ? 'text-foreground' : 'text-muted-foreground'}`}>
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
            5. LEARNING PATH - CURRENT COURSES
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
                    <h3 className="text-sm font-bold text-foreground truncate">{course.titleAr}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{course.instructor} · {course.duration}</p>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full bg-muted/30 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${courseProgress.find(p => p.courseId === course.id)?.progress || 0}%` }}
                          transition={{ duration: 1, delay: i * 0.15 }}
                          className="h-full rounded-full bg-gradient-to-l from-neon-cyan to-neon-blue"
                        />
                      </div>
                      <span className="text-xs font-bold text-neon-cyan shrink-0">{courseProgress.find(p => p.courseId === course.id)?.progress || 0}%</span>
                    </div>
                  </div>
                  {/* Continue button */}
                  <Button
                    size="sm"
                    onClick={() => openCourse(course.id)}
                    className="bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/20 h-8 text-xs px-3 shrink-0"
                  >
                    {(courseProgress.find(p => p.courseId === course.id)?.progress ?? 0) > 0 ? 'متابعة' : 'ابدأ'}
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
          <div className="glass-card divide-y divide-border">
            {settingsItems.map((item, i) => (
              <motion.button
                key={item.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ backgroundColor: 'rgba(0,245,255,0.03)' }}
                onClick={item.action}
                className="w-full flex items-center gap-4 p-4 text-right transition-colors"
              >
                <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center ${item.color}`}>
                  {item.icon}
                </div>
                <div className="flex-1">
                  <span className="text-sm font-semibold text-foreground">{item.label}</span>
                  {item.labelEn && (
                    <p className="text-xs text-muted-foreground">{item.labelEn}</p>
                  )}
                </div>
                <ChevronLeft className="w-4 h-4 text-muted-foreground rtl-flip" />
              </motion.button>
            ))}
            {/* Logout button */}
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: settingsItems.length * 0.05 }}
              whileHover={{ backgroundColor: 'rgba(239,68,68,0.05)' }}
              onClick={() => logout()}
              className="w-full flex items-center gap-4 p-4 text-right transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
                <LogOut className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <span className="text-sm font-semibold text-red-400">تسجيل الخروج</span>
                <p className="text-xs text-muted-foreground">خروج من حسابك</p>
              </div>
              <ChevronLeft className="w-4 h-4 text-muted-foreground rtl-flip" />
            </motion.button>
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
                    <h3 className="text-lg font-bold text-foreground">{selectedBadge.nameAr}</h3>
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
                      <span className="text-xs px-3 py-1 rounded-full bg-muted/30 text-muted-foreground font-semibold flex items-center gap-1">
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

      {/* ═══════════════════════════════════════════════════
          PROFILE EDIT DIALOG
      ═══════════════════════════════════════════════════ */}
      <Dialog open={editingProfile} onOpenChange={setEditingProfile}>
        <DialogContent className="glass-strong border-neon-cyan/20 max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-center flex items-center justify-center gap-2">
              <Pencil className="w-5 h-5 text-neon-cyan" />
              تعديل الملف الشخصي
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            {/* Name field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">الاسم</label>
              <div className="relative">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="bg-muted/20 border-border focus:border-neon-cyan/50 focus:ring-neon-cyan/20 text-foreground placeholder:text-muted-foreground/50"
                  placeholder="أدخل اسمك"
                />
              </div>
            </div>

            {/* Specialty field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">التخصص الطبي</label>
              <div className="relative">
                <Input
                  value={editSpecialty}
                  onChange={(e) => setEditSpecialty(e.target.value)}
                  className="bg-muted/20 border-border focus:border-neon-cyan/50 focus:ring-neon-cyan/20 text-foreground placeholder:text-muted-foreground/50"
                  placeholder="مثال: طب عام، جراحة، أطفال..."
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                onClick={handleSaveProfile}
                disabled={editSaving}
                className="flex-1 bg-gradient-to-l from-neon-cyan to-neon-blue text-med-dark font-bold hover:opacity-90 transition-opacity"
              >
                {editSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    جارٍ الحفظ...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 ml-2" />
                    حفظ التغييرات
                  </>
                )}
              </Button>
              <Button
                onClick={() => setEditingProfile(false)}
                variant="outline"
                className="border-border text-muted-foreground hover:bg-muted/30"
              >
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════
          NOTIFICATIONS DIALOG
      ═══════════════════════════════════════════════════ */}
      <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
        <DialogContent className="glass-strong border-neon-purple/20 max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-center flex items-center justify-center gap-2">
              <Bell className="w-5 h-5 text-neon-purple" />
              الإشعارات
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-96">
            <div className="space-y-2 py-2">
              {notifications.length > 0 ? (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3 rounded-xl border transition-all ${
                      notif.read
                        ? 'bg-muted/20 border-border opacity-60'
                        : 'bg-neon-purple/5 border-neon-purple/15'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                        notif.type === 'success' ? 'bg-neon-green' :
                        notif.type === 'warning' ? 'bg-neon-orange' :
                        'bg-neon-cyan'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-foreground">{notif.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1 leading-5">{notif.message}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={`text-[9px] ${
                            notif.type === 'success' ? 'bg-neon-green/10 text-neon-green border-neon-green/20' :
                            notif.type === 'warning' ? 'bg-neon-orange/10 text-neon-orange border-neon-orange/20' :
                            'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/20'
                          }`}>
                            {notif.type === 'success' ? 'نجاح' : notif.type === 'warning' ? 'تحذير' : 'معلومات'}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(notif.timestamp).toLocaleDateString('ar-EG')}
                          </span>
                          {!notif.read && (
                            <Badge className="text-[9px] bg-neon-purple/10 text-neon-purple border-neon-purple/20">
                              جديد
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center">
                  <Bell className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                  <p className="text-sm text-muted-foreground">لا توجد إشعارات</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════
          PRIVACY DIALOG
      ═══════════════════════════════════════════════════ */}
      <Dialog open={showPrivacy} onOpenChange={setShowPrivacy}>
        <DialogContent className="glass-strong border-neon-green/20 max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-center flex items-center justify-center gap-2">
              <Shield className="w-5 h-5 text-neon-green" />
              سياسة الخصوصية
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {privacyLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-neon-green animate-spin" />
                <span className="mr-3 text-sm text-muted-foreground">جارٍ التحميل...</span>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-neon-green/5 border border-neon-green/10">
                <p className="text-sm text-muted-foreground leading-7">{privacyText}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════
          ABOUT APP DIALOG
      ═══════════════════════════════════════════════════ */}
      <Dialog open={showAbout} onOpenChange={setShowAbout}>
        <DialogContent className="glass-strong border-neon-cyan/20 max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-center flex items-center justify-center gap-2">
              <Info className="w-5 h-5 text-neon-cyan" />
              حول التطبيق
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {aboutLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-neon-cyan animate-spin" />
                <span className="mr-3 text-sm text-muted-foreground">جارٍ التحميل...</span>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-neon-cyan/5 border border-neon-cyan/10">
                <p className="text-sm text-muted-foreground leading-7">{aboutText}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

    </motion.div>
  )
}
