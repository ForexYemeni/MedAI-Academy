'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/app-store'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  BookOpen,
  Brain,
  Clock,
  Star,
  Users,
  TrendingUp,
  Play,
  ChevronLeft,
  Heart,
  AlertTriangle,
  Stethoscope,
  Baby,
  Scissors,
  Pill,
  ScanLine,
  Radio,
  Timer,
  Target,
  Sparkles,
  CheckCircle2,
  Lock,
  HeartPulse,
  Siren,
} from 'lucide-react'

// ─── Helpers ────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'صباح الخير'
  if (hour < 18) return 'مساء الخير'
  return 'مساء الخير'
}

function formatCount(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  return n.toString()
}

// ─── Animation Variants ─────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
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

// ─── Category Config ────────────────────────────────────────

const CATEGORIES = [
  { id: 'emergency', label: 'طوارئ', icon: Siren, color: '#ef4444', glow: 'rgba(239,68,68,0.3)' },
  { id: 'cardiology', label: 'قلب', icon: Heart, color: '#ec4899', glow: 'rgba(236,72,153,0.3)' },
  { id: 'neurology', label: 'أعصاب', icon: Brain, color: '#8b5cf6', glow: 'rgba(139,92,246,0.3)' },
  { id: 'pediatrics', label: 'أطفال', icon: Baby, color: '#10b981', glow: 'rgba(16,185,129,0.3)' },
  { id: 'surgery', label: 'جراحة', icon: Scissors, color: '#0088ff', glow: 'rgba(0,136,255,0.3)' },
  { id: 'internal', label: 'باطني', icon: Stethoscope, color: '#f59e0b', glow: 'rgba(245,158,11,0.3)' },
  { id: 'radiology', label: 'أشعة', icon: ScanLine, color: '#00f5ff', glow: 'rgba(0,245,255,0.3)' },
  { id: 'pharmacology', label: 'أدوية', icon: Pill, color: '#8b5cf6', glow: 'rgba(139,92,246,0.3)' },
]

// ─── Live Events Data ───────────────────────────────────────

const LIVE_EVENTS = [
  {
    id: '1',
    title: 'ورشة تخطيط القلب المتقدم',
    instructor: 'د. سارة الأحمد',
    startsAt: Date.now() + 45 * 60 * 1000,
    attendees: 234,
    category: 'cardiology',
  },
  {
    id: '2',
    title: 'محاكاة طوارئ حية - حادث مروري',
    instructor: 'د. محمد العلي',
    startsAt: Date.now() + 120 * 60 * 1000,
    attendees: 156,
    category: 'emergency',
  },
  {
    id: '3',
    title: 'مراجعة الأدوية للامتحان',
    instructor: 'د. ريم الدوسري',
    startsAt: Date.now() + 3 * 3600 * 1000,
    attendees: 412,
    category: 'pharmacology',
  },
]

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  MAIN COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function HomePage() {
  const { user, courses, quizQuestions, simulationCases, openCourse, courseProgress } = useAppStore()

  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [now, setNow] = useState(Date.now())
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  // Tick for countdown timers
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Derived data - professional stats instead of XP/Coins
  const greeting = useMemo(() => getGreeting(), [])
  const enrolledCourses = courseProgress.length
  const completedLessons = courseProgress.reduce((sum, p) => sum + p.completedLessons.length, 0)
  const inProgressCourses = useMemo(
    () => {
      const enrolledIds = courseProgress.map(p => p.courseId)
      return courses.filter((c) => enrolledIds.includes(c.id) && (courseProgress.find(p => p.courseId === c.id)?.progress ?? 0) > 0)
        .sort((a, b) => (courseProgress.find(p => p.courseId === b.id)?.progress ?? 0) - (courseProgress.find(p => p.courseId === a.id)?.progress ?? 0))
    },
    [courses, courseProgress]
  )
  const trendingCourses = useMemo(
    () => [...courses].sort((a, b) => b.students - a.students).slice(0, 4),
    [courses]
  )
  const recommendedCourses = useMemo(
    () => courses.filter((c) => c.category === user.medicalSpecialty || c.category === 'emergency').slice(0, 3),
    [courses, user.medicalSpecialty]
  )
  const currentQuiz = useMemo(() => quizQuestions[0], [quizQuestions])

  // Quick Challenge handler
  const handleAnswer = (idx: number) => {
    if (selectedAnswer !== null) return
    setSelectedAnswer(idx)
    setShowExplanation(true)
  }

  // Countdown helper
  function getCountdown(target: number) {
    const diff = Math.max(0, target - now)
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    const s = Math.floor((diff % 60000) / 1000)
    return { h, m, s }
  }

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
            1. SMART GREETING
        ═══════════════════════════════════════════════════ */}
        <motion.section variants={itemVariants} className="glass-card neon-glow p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-14 w-14 border-2 border-primary/40">
                  <AvatarFallback className="bg-primary/20 text-primary text-lg font-bold">
                    {user.name ? user.name.replace(/^(د\.|دكتور|Dr\.?)\s*/i, '').charAt(0) : '?'}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                  {greeting}، {user.name}! 👋
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {user.medicalSpecialty || user.rankTitle}
                </p>
              </div>
            </div>

            {/* Professional Stats Pills */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 border border-primary/20">
                <BookOpen className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-primary">{enrolledCourses} دورة</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-neon-green/10 px-3 py-1.5 border border-neon-green/20">
                <CheckCircle2 className="h-4 w-4 text-neon-green" />
                <span className="text-sm font-semibold text-neon-green">{completedLessons} درس</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-neon-purple/10 px-3 py-1.5 border border-neon-purple/20">
                <Clock className="h-4 w-4 text-neon-purple" />
                <span className="text-sm font-semibold text-neon-purple">{user.totalHours} ساعة</span>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ═══════════════════════════════════════════════════
            2. PROFESSIONAL STATS
        ═══════════════════════════════════════════════════ */}
        <motion.section variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'دورات مسجلة', value: enrolledCourses, icon: BookOpen, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
            { label: 'دروس مكتملة', value: completedLessons, icon: CheckCircle2, color: 'text-neon-green', bg: 'bg-neon-green/10', border: 'border-neon-green/20' },
            { label: 'ساعات الدراسة', value: user.totalHours, icon: Clock, color: 'text-neon-purple', bg: 'bg-neon-purple/10', border: 'border-neon-purple/20' },
            { label: 'شهادات', value: user.completedCourses, icon: Award, color: 'text-neon-orange', bg: 'bg-neon-orange/10', border: 'border-neon-orange/20' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileHover={cardHover}
              className="glass-card p-4 relative overflow-hidden"
            >
              <div className={`rounded-xl ${stat.bg} ${stat.border} border w-10 h-10 flex items-center justify-center mb-3`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-black text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </motion.section>

        {/* ═══════════════════════════════════════════════════
            3. CONTINUE LEARNING
        ═══════════════════════════════════════════════════ */}
        {inProgressCourses.length > 0 && (
          <motion.section variants={itemVariants}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-neon-cyan" />
                متابعة التعلم
              </h2>
              <button className="text-sm text-neon-cyan hover:underline flex items-center gap-1">
                الكل <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-4 pb-4">
                {inProgressCourses.map((course, i) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={cardHover}
                    className="glass-card w-72 shrink-0 overflow-hidden group cursor-pointer"
                    onClick={() => openCourse(course.id)}
                  >
                    {/* Thumbnail placeholder */}
                    <div className="relative h-36 bg-gradient-to-bl from-neon-purple/20 via-neon-blue/10 to-neon-cyan/20 overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <BookOpen className="h-12 w-12 text-neon-cyan/30" />
                      </div>
                      {/* Progress overlay at bottom */}
                      <div className="absolute bottom-0 inset-x-0 h-1.5 bg-white/10">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${courseProgress.find(p => p.courseId === course.id)?.progress || 0}%` }}
                          transition={{ duration: 1, delay: i * 0.15 }}
                          className="h-full bg-gradient-to-l from-neon-cyan to-neon-blue"
                        />
                      </div>
                      {/* Progress badge */}
                      <div className="absolute top-3 right-3 rounded-full bg-black/60 px-2.5 py-0.5 backdrop-blur-sm border border-white/10">
                        <span className="text-xs font-bold text-neon-cyan">{courseProgress.find(p => p.courseId === course.id)?.progress || 0}%</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-sm leading-6 line-clamp-2 group-hover:text-neon-cyan transition-colors">
                        {course.titleAr}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">{course.instructor}</p>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{course.duration}</span>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => openCourse(course.id)}
                          className="bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/20 h-7 text-xs px-3"
                        >
                          متابعة
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </motion.section>
        )}

        {/* ═══════════════════════════════════════════════════
            4. STUDY PROGRESS
        ═══════════════════════════════════════════════════ */}
        <motion.section variants={itemVariants}>
          <h2 className="text-lg font-bold flex items-center gap-2 mb-3">
            <Target className="h-5 w-5 text-neon-green" />
            تقدم الدراسة
          </h2>
          <div className="glass-card p-5">
            <div className="space-y-4">
              {inProgressCourses.length > 0 ? (
                inProgressCourses.slice(0, 3).map((course, i) => {
                  const courseProgress_val = courseProgress.find(p => p.courseId === course.id)
                  return (
                    <div key={course.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{course.titleAr}</span>
                        <span className="text-xs font-bold text-primary">{courseProgress_val?.progress || 0}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${courseProgress_val?.progress || 0}%` }}
                          transition={{ duration: 1, delay: i * 0.15 }}
                          className="h-full rounded-full bg-gradient-to-l from-primary to-neon-purple"
                        />
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">ابدأ بتصفح الدورات للتتبع تقدمك</p>
                </div>
              )}
            </div>
          </div>
        </motion.section>

        {/* ═══════════════════════════════════════════════════
            5. AI RECOMMENDATIONS
        ═══════════════════════════════════════════════════ */}
        <motion.section variants={itemVariants}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-neon-purple" />
              مقترح لك بالذكاء الاصطناعي
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {recommendedCourses.map((course, i) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={cardHover}
                onClick={() => openCourse(course.id)}
                className="glass-card gradient-border p-4 group cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="rounded-lg bg-neon-purple/15 p-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-neon-purple" />
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[10px] border-neon-purple/30 text-neon-purple bg-neon-purple/10"
                  >
                    {course.level === 'beginner' ? 'مبتدئ' : course.level === 'intermediate' ? 'متوسط' : 'متقدم'}
                  </Badge>
                </div>
                <h3 className="font-bold text-sm leading-6 group-hover:text-neon-cyan transition-colors line-clamp-2">
                  {course.titleAr}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">{course.instructor}</p>
                <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                    {course.rating}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {formatCount(course.students)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {course.duration}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ═══════════════════════════════════════════════════
            6. MEDICAL CATEGORIES
        ═══════════════════════════════════════════════════ */}
        <motion.section variants={itemVariants}>
          <h2 className="text-lg font-bold flex items-center gap-2 mb-3">
            <Stethoscope className="h-5 w-5 text-neon-green" />
            التخصصات الطبية
          </h2>
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-3 pb-2">
              {CATEGORIES.map((cat, i) => {
                const Icon = cat.icon
                const isActive = activeCategory === cat.id
                return (
                  <motion.button
                    key={cat.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveCategory(isActive ? null : cat.id)}
                    className={`
                      flex items-center gap-2 rounded-2xl px-4 py-2.5 border transition-all shrink-0
                      ${isActive
                        ? 'bg-white/10 border-white/20'
                        : 'glass-card border-transparent'
                      }
                    `}
                    style={{
                      boxShadow: isActive ? `0 0 20px ${cat.glow}` : 'none',
                      borderColor: isActive ? `${cat.color}40` : undefined,
                    }}
                  >
                    <Icon className="h-4 w-4" style={{ color: cat.color }} />
                    <span className="text-sm font-semibold whitespace-nowrap" style={{ color: isActive ? cat.color : undefined }}>
                      {cat.label}
                    </span>
                  </motion.button>
                )
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </motion.section>

        {/* ═══════════════════════════════════════════════════
            7. TRENDING COURSES
        ═══════════════════════════════════════════════════ */}
        <motion.section variants={itemVariants}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-neon-pink" />
              الأكثر شعبية
            </h2>
            <button className="text-sm text-neon-cyan hover:underline flex items-center gap-1">
              الكل <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {trendingCourses.map((course, i) => {
              const levelMap = { beginner: { label: 'مبتدئ', color: 'text-neon-green border-neon-green/30 bg-neon-green/10' }, intermediate: { label: 'متوسط', color: 'text-neon-orange border-neon-orange/30 bg-neon-orange/10' }, advanced: { label: 'متقدم', color: 'text-red-400 border-red-400/30 bg-red-400/10' } }
              const levelInfo = levelMap[course.level]
              const gradients = [
                'from-neon-cyan/20 via-neon-blue/10 to-transparent',
                'from-neon-purple/20 via-neon-pink/10 to-transparent',
                'from-neon-green/20 via-emerald-500/10 to-transparent',
                'from-neon-orange/20 via-amber-500/10 to-transparent',
              ]

              return (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  whileHover={cardHover}
                  onClick={() => openCourse(course.id)}
                  className="glass-card overflow-hidden group cursor-pointer"
                >
                  <div className={`relative h-32 bg-gradient-to-bl ${gradients[i % gradients.length]}`}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BookOpen className="h-10 w-10 text-white/10" />
                    </div>
                    <div className="absolute top-3 right-3 flex items-center gap-2">
                      <Badge className={`text-[10px] ${levelInfo.color} border`}>
                        {levelInfo.label}
                      </Badge>
                      {course.isPremium && (
                        <Badge className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          ⭐ مميز
                        </Badge>
                      )}
                    </div>
                    <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 backdrop-blur-sm">
                      <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                      <span className="text-xs font-bold">{course.rating}</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-sm group-hover:text-neon-cyan transition-colors line-clamp-1">
                      {course.titleAr}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">{course.instructor}</p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {formatCount(course.students)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {course.duration}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => openCourse(course.id)}
                        className="bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/20 h-7 text-xs px-3"
                      >
                        {course.price === 0 ? 'مجاني' : `${course.price.toLocaleString()} ر.ي`}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.section>

        {/* ═══════════════════════════════════════════════════
            8. QUICK CHALLENGE
        ═══════════════════════════════════════════════════ */}
        <motion.section variants={itemVariants}>
          <div className="glass-card gradient-border p-5 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-48 h-48 bg-neon-cyan/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-neon-purple/5 rounded-full blur-3xl" />

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <Brain className="h-5 w-5 text-neon-purple" />
                </motion.div>
                <h2 className="text-lg font-bold">تحدي سريع!</h2>
                <Badge className="text-[10px] bg-neon-purple/15 text-neon-purple border border-neon-purple/30 mr-auto">
                  {currentQuiz.difficulty === 'easy' ? 'سهل' : currentQuiz.difficulty === 'medium' ? 'متوسط' : 'صعب'}
                </Badge>
              </div>

              <p className="text-sm font-semibold mb-4 leading-7">{currentQuiz.question}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {currentQuiz.options.map((option, idx) => {
                  const isCorrect = idx === currentQuiz.correctIndex
                  const isSelected = selectedAnswer === idx
                  let btnClass = 'glass-card border-white/5 text-right'

                  if (selectedAnswer !== null) {
                    if (isCorrect) btnClass = 'border-neon-green/50 bg-neon-green/10 text-neon-green'
                    else if (isSelected) btnClass = 'border-red-500/50 bg-red-500/10 text-red-400'
                  }

                  return (
                    <motion.button
                      key={idx}
                      whileHover={selectedAnswer === null ? { scale: 1.02 } : {}}
                      whileTap={selectedAnswer === null ? { scale: 0.98 } : {}}
                      onClick={() => handleAnswer(idx)}
                      disabled={selectedAnswer !== null}
                      className={`rounded-xl p-3 border transition-all text-sm font-medium ${btnClass}`}
                    >
                      <span className="inline-flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current/30 text-xs">
                          {String.fromCharCode(1571 + idx)}
                        </span>
                        {option}
                        {selectedAnswer !== null && isCorrect && (
                          <CheckCircle2 className="h-4 w-4 text-neon-green mr-auto" />
                        )}
                        {selectedAnswer !== null && isSelected && !isCorrect && (
                          <AlertTriangle className="h-4 w-4 text-red-400 mr-auto" />
                        )}
                      </span>
                    </motion.button>
                  )
                })}
              </div>

              <AnimatePresence>
                {showExplanation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4"
                  >
                    <div className="rounded-xl bg-neon-cyan/5 border border-neon-cyan/15 p-3">
                      <p className="text-xs font-semibold text-neon-cyan mb-1">الشرح:</p>
                      <p className="text-xs text-muted-foreground leading-5">{currentQuiz.explanation}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.section>

        {/* ═══════════════════════════════════════════════════
            9. RECENT COURSES
        ═══════════════════════════════════════════════════ */}
        <motion.section variants={itemVariants}>
          <h2 className="text-lg font-bold flex items-center gap-2 mb-3">
            <BookOpen className="h-5 w-5 text-primary" />
            دورات قد تعجبك
          </h2>
          <div className="glass-card p-4">
            <div className="space-y-2">
              {courses.slice(0, 3).map((course) => (
                <button
                  key={course.id}
                  onClick={() => openCourse(course.id)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-colors text-right"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{course.titleAr}</p>
                    <p className="text-xs text-muted-foreground">{course.instructor} · {course.duration}</p>
                  </div>
                  <Badge className={`text-[10px] ${course.price === 0 ? 'bg-neon-green/10 text-neon-green border-neon-green/20' : 'bg-primary/10 text-primary border-primary/20'} border`}>
                    {course.price === 0 ? 'مجاني' : `${course.price.toLocaleString()} ر.ي`}
                  </Badge>
                </button>
              ))}
            </div>
          </div>
        </motion.section>

        {/* ═══════════════════════════════════════════════════
            10. LIVE EVENTS
        ═══════════════════════════════════════════════════ */}
        <motion.section variants={itemVariants}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Radio className="h-5 w-5 text-red-400" />
              فعاليات مباشرة
              <span className="relative flex h-2.5 w-2.5 mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              </span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {LIVE_EVENTS.map((event, i) => {
              const cd = getCountdown(event.startsAt)
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.08 }}
                  whileHover={cardHover}
                  className="glass-card p-4 relative overflow-hidden"
                >
                  {/* Live badge */}
                  <div className="absolute top-3 left-3">
                    <div className="flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 border border-red-500/30">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
                      </span>
                      <span className="text-[10px] font-bold text-red-400">LIVE</span>
                    </div>
                  </div>

                  <h3 className="font-bold text-sm leading-6 mt-5">{event.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{event.instructor}</p>

                  {/* Countdown */}
                  <div className="flex items-center gap-2 mt-3">
                    <Timer className="h-3.5 w-3.5 text-neon-cyan" />
                    <div className="flex items-center gap-1 text-xs font-mono">
                      <span className="rounded bg-neon-cyan/10 px-1.5 py-0.5 text-neon-cyan border border-neon-cyan/20">
                        {String(cd.h).padStart(2, '0')}
                      </span>
                      <span className="text-neon-cyan">:</span>
                      <span className="rounded bg-neon-cyan/10 px-1.5 py-0.5 text-neon-cyan border border-neon-cyan/20">
                        {String(cd.m).padStart(2, '0')}
                      </span>
                      <span className="text-neon-cyan">:</span>
                      <span className="rounded bg-neon-cyan/10 px-1.5 py-0.5 text-neon-cyan border border-neon-cyan/20">
                        {String(cd.s).padStart(2, '0')}
                      </span>
                    </div>
                  </div>

                  {/* Attendees & Join */}
                  <div className="flex items-center justify-between mt-3">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      {event.attendees} مشارك
                    </span>
                    <Button
                      size="sm"
                      className="bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 h-7 text-xs px-3"
                    >
                      <Play className="h-3 w-3 ml-1" />
                      انضم
                    </Button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.section>

        {/* ═══════════════════════════════════════════════════
            11. EMERGENCY CASES FEED
        ═══════════════════════════════════════════════════ */}
        <motion.section variants={itemVariants}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Siren className="h-5 w-5 text-red-400" />
              حالات طوارئ
              <span className="animate-heartbeat text-red-400">❤️‍🔥</span>
            </h2>
            <button className="text-sm text-neon-cyan hover:underline flex items-center gap-1">
              الكل <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {simulationCases.map((caseItem, i) => {
              const diffMap = {
                easy: { label: 'سهل', color: 'text-neon-green border-neon-green/30 bg-neon-green/10' },
                medium: { label: 'متوسط', color: 'text-neon-orange border-neon-orange/30 bg-neon-orange/10' },
                hard: { label: 'صعب', color: 'text-red-400 border-red-400/30 bg-red-400/10' },
                expert: { label: 'خبير', color: 'text-neon-purple border-neon-purple/30 bg-neon-purple/10' },
              }
              const diff = diffMap[caseItem.difficulty]

              return (
                <motion.div
                  key={caseItem.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={cardHover}
                  className="glass-card p-4 relative overflow-hidden border-red-500/10"
                >
                  {/* Urgent pulse border */}
                  <div className="absolute inset-0 rounded-2xl border-2 border-red-500/10 animate-neon-pulse" />

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <Badge className={`text-[10px] ${diff.color} border`}>
                        {diff.label}
                      </Badge>
                      {caseItem.isLocked ? (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <HeartPulse className="h-4 w-4 text-red-400 animate-heartbeat" />
                      )}
                    </div>

                    <h3 className="font-bold text-sm">{caseItem.titleAr}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{caseItem.scenario}</p>

                    {/* Vitals */}
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <div className="rounded-lg bg-red-500/10 p-1.5 text-center border border-red-500/10">
                        <p className="text-[10px] text-muted-foreground">HR</p>
                        <p className={`text-xs font-bold ${caseItem.vitals.hr === 0 ? 'text-red-500' : 'text-foreground'}`}>
                          {caseItem.vitals.hr === 0 ? '—' : caseItem.vitals.hr}
                        </p>
                      </div>
                      <div className="rounded-lg bg-neon-cyan/10 p-1.5 text-center border border-neon-cyan/10">
                        <p className="text-[10px] text-muted-foreground">SpO₂</p>
                        <p className={`text-xs font-bold ${caseItem.vitals.spo2 < 90 ? 'text-red-400' : 'text-foreground'}`}>
                          {caseItem.vitals.spo2}%
                        </p>
                      </div>
                      <div className="rounded-lg bg-neon-purple/10 p-1.5 text-center border border-neon-purple/10">
                        <p className="text-[10px] text-muted-foreground">BP</p>
                        <p className="text-xs font-bold text-foreground">{caseItem.vitals.bp}</p>
                      </div>
                    </div>

                    {/* Symptoms */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {caseItem.symptoms.slice(0, 2).map((sym, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] rounded-full bg-red-500/10 text-red-300 px-2 py-0.5 border border-red-500/15"
                        >
                          {sym}
                        </span>
                      ))}
                      {caseItem.symptoms.length > 2 && (
                        <span className="text-[10px] text-muted-foreground">
                          +{caseItem.symptoms.length - 2}
                        </span>
                      )}
                    </div>

                    <Button
                      size="sm"
                      className={`w-full mt-3 h-8 text-xs ${
                        caseItem.isLocked
                          ? 'bg-white/5 text-muted-foreground border border-white/10'
                          : 'bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25'
                      }`}
                      disabled={caseItem.isLocked}
                    >
                      {caseItem.isLocked ? (
                        <>
                          <Lock className="h-3 w-3 ml-1" /> مقفل
                        </>
                      ) : (
                        <>
                          <Siren className="h-3 w-3 ml-1" /> ابدأ المحاكاة
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.section>

      </div>
    </motion.div>
  )
}
