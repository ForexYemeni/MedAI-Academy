'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { useAppStore } from '@/store/app-store'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Zap,
  Clock,
  Brain,
  Trophy,
  Target,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Sparkles,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Home,
  Star,
  Coins,
  Timer,
  Shuffle,
  Layers,
  Flame,
  Award,
  RotateCcw as Refresh,
  ThumbsUp,
  ThumbsDown,
  Eye,
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────

type QuizMode = 'quick' | 'topic' | 'timed' | 'comprehensive' | 'flashcards'
type QuizPhase = 'selection' | 'active' | 'results' | 'flashcards' | 'review'

interface QuizResult {
  correct: number
  incorrect: number
  total: number
  xpEarned: number
  coinsEarned: number
  answers: Array<{
    questionIndex: number
    selectedIndex: number
    isCorrect: boolean
  }>
}

// ─── Quiz Mode Config ───────────────────────────────────────

const QUIZ_MODES: Array<{
  id: QuizMode
  title: string
  description: string
  questionCount: number
  icon: React.ReactNode
  gradient: string
  glow: string
  borderColor: string
  xpPerQuestion: number
  coinReward: number
}> = [
  {
    id: 'quick',
    title: 'اختبار سريع',
    description: '5 أسئلة سريعة لمراجعة معلوماتك',
    questionCount: 5,
    icon: <Zap className="h-7 w-7" />,
    gradient: 'from-neon-cyan/20 via-neon-blue/10 to-transparent',
    glow: '0 0 30px rgba(0,245,255,0.2)',
    borderColor: 'border-neon-cyan/30',
    xpPerQuestion: 10,
    coinReward: 5,
  },
  {
    id: 'topic',
    title: 'اختبار موضوعي',
    description: '10 أسئلة في تخصص محدد',
    questionCount: 10,
    icon: <Target className="h-7 w-7" />,
    gradient: 'from-neon-purple/20 via-neon-pink/10 to-transparent',
    glow: '0 0 30px rgba(139,92,246,0.2)',
    borderColor: 'border-neon-purple/30',
    xpPerQuestion: 15,
    coinReward: 10,
  },
  {
    id: 'timed',
    title: 'تحدي الوقت',
    description: '30 ثانية لكل سؤال - سباق مع الزمن!',
    questionCount: 10,
    icon: <Timer className="h-7 w-7" />,
    gradient: 'from-neon-orange/20 via-amber-500/10 to-transparent',
    glow: '0 0 30px rgba(245,158,11,0.2)',
    borderColor: 'border-neon-orange/30',
    xpPerQuestion: 20,
    coinReward: 15,
  },
  {
    id: 'comprehensive',
    title: 'مراجعة شاملة',
    description: '20 سؤال شامل لاختبار معرفتك',
    questionCount: 20,
    icon: <BookOpen className="h-7 w-7" />,
    gradient: 'from-neon-green/20 via-emerald-500/10 to-transparent',
    glow: '0 0 30px rgba(16,185,129,0.2)',
    borderColor: 'border-neon-green/30',
    xpPerQuestion: 12,
    coinReward: 20,
  },
  {
    id: 'flashcards',
    title: 'بطاقات مراجعة',
    description: 'مراجعة بطاقات مع إمكانية القلب والسحب',
    questionCount: 10,
    icon: <Layers className="h-7 w-7" />,
    gradient: 'from-neon-pink/20 via-purple-500/10 to-transparent',
    glow: '0 0 30px rgba(236,72,153,0.2)',
    borderColor: 'border-neon-pink/30',
    xpPerQuestion: 5,
    coinReward: 8,
  },
]

// ─── Category / Difficulty Config ───────────────────────────

const CATEGORY_MAP: Record<string, { label: string; color: string }> = {
  emergency: { label: 'طوارئ', color: 'text-red-400' },
  cardiology: { label: 'قلب', color: 'text-pink-400' },
  neurology: { label: 'أعصاب', color: 'text-neon-purple' },
  icu: { label: 'عناية مركزة', color: 'text-amber-400' },
  general: { label: 'عام', color: 'text-neon-cyan' },
  pharmacology: { label: 'أدوية', color: 'text-neon-green' },
}

const DIFFICULTY_MAP: Record<string, { label: string; color: string; bg: string; border: string }> = {
  easy: { label: 'سهل', color: 'text-neon-green', bg: 'bg-neon-green/10', border: 'border-neon-green/30' },
  medium: { label: 'متوسط', color: 'text-neon-orange', bg: 'bg-neon-orange/10', border: 'border-neon-orange/30' },
  hard: { label: 'صعب', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
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

// ─── Confetti Particle Component ────────────────────────────

function ConfettiEffect() {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 400 - 200,
    delay: Math.random() * 0.3,
    color: ['#00f5ff', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'][i % 5],
    size: Math.random() * 6 + 4,
  }))

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: '50%', y: '50%', opacity: 1, scale: 1 }}
          animate={{
            x: `calc(50% + ${p.x}px)`,
            y: '110%',
            opacity: 0,
            scale: 0,
            rotate: Math.random() * 720 - 360,
          }}
          transition={{
            duration: 1.2 + Math.random() * 0.5,
            delay: p.delay,
            ease: 'easeOut',
          }}
          className="absolute"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
        />
      ))}
    </div>
  )
}

// ─── Score Circle Animation ─────────────────────────────────

function ScoreCircle({ score, total }: { score: number; total: number }) {
  const percentage = Math.round((score / total) * 100)
  const circumference = 2 * Math.PI * 60
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  const getColor = () => {
    if (percentage >= 80) return '#10b981'
    if (percentage >= 60) return '#f59e0b'
    return '#ef4444'
  }

  return (
    <div className="relative flex items-center justify-center">
      <svg width="160" height="160" className="transform -rotate-90">
        <circle
          cx="80"
          cy="80"
          r="60"
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="10"
        />
        <motion.circle
          cx="80"
          cy="80"
          r="60"
          fill="none"
          stroke={getColor()}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          style={{
            filter: `drop-shadow(0 0 8px ${getColor()}50)`,
          }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <motion.span
          className="text-4xl font-black"
          style={{ color: getColor(), textShadow: `0 0 20px ${getColor()}50` }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
        >
          {percentage}%
        </motion.span>
        <span className="text-xs text-muted-foreground mt-1">
          {score}/{total} صحيح
        </span>
      </div>
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  MAIN COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function QuizzesPage() {
  const {
    quizQuestions,
    currentQuizIndex,
    quizScore,
    quizActive,
    setCurrentQuizIndex,
    setQuizScore,
    setQuizActive,
    setQuizQuestions,
    user,
    updateUser,
  } = useAppStore()

  // ─── Local State ───────────────────────────────────────
  const [phase, setPhase] = useState<QuizPhase>('selection')
  const [selectedMode, setSelectedMode] = useState<QuizMode | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [timeLeft, setTimeLeft] = useState(30)
  const [showConfetti, setShowConfetti] = useState(false)
  const [xpAnimation, setXpAnimation] = useState(0)
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null)
  const [flashcardFlipped, setFlashcardFlipped] = useState(false)
  const [flashcardIndex, setFlashcardIndex] = useState(0)
  const [flashcardKnown, setFlashcardKnown] = useState(0)
  const [flashcardUnknown, setFlashcardUnknown] = useState(0)
  const [answerFlash, setAnswerFlash] = useState<'correct' | 'wrong' | null>(null)
  const [activeQuestions, setActiveQuestions] = useState<typeof quizQuestions>([])

  // ─── Fetch quiz questions from API ────────────────────
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('medai-token') : null
        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        if (token) headers['Authorization'] = `Bearer ${token}`
        
        const res = await fetch('/api/quizzes', { headers })
        const data = await res.json()
        if (data.questions && data.questions.length > 0) {
          const mapped = data.questions.map((q: any) => ({
            id: q.id,
            question: q.questionAr || q.question,
            options: q.optionsAr || q.options,
            correctIndex: q.correctIndex,
            explanation: q.explanationAr || q.explanation,
            difficulty: q.difficulty,
            category: q.category,
          }))
          setQuizQuestions(mapped)
        }
      } catch (err) {
        console.log('Using default quiz questions')
      }
    }
    fetchQuestions()
  }, [setQuizQuestions])

  // ─── Generate Questions for Mode ───────────────────────
  const generateQuestions = useCallback(
    (mode: QuizMode) => {
      const modeConfig = QUIZ_MODES.find((m) => m.id === mode)
      if (!modeConfig) return []

      const shuffled = [...quizQuestions].sort(() => Math.random() - 0.5)
      const count = modeConfig.questionCount
      // Use only available questions without repeating/duplicating
      const available = shuffled.slice(0, Math.min(count, shuffled.length))
      return available
    },
    [quizQuestions]
  )

  // ─── Start Quiz ────────────────────────────────────────
  const startQuiz = useCallback(
    (mode: QuizMode) => {
      const questions = generateQuestions(mode)
      if (questions.length === 0) return

      setSelectedMode(mode)
      setActiveQuestions(questions)
      setCurrentQuizIndex(0)
      setQuizScore(0)
      setSelectedAnswer(null)
      setShowExplanation(false)
      setXpAnimation(0)
      setAnswerFlash(null)
      setQuizActive(true)
      setTimeLeft(30)

      if (mode === 'flashcards') {
        setPhase('flashcards')
        setFlashcardFlipped(false)
        setFlashcardIndex(0)
        setFlashcardKnown(0)
        setFlashcardUnknown(0)
      } else {
        setPhase('active')
      }
    },
    [generateQuestions, setCurrentQuizIndex, setQuizScore, setQuizActive, quizQuestions]
  )

  // ─── Timer Effect (Timed Mode) ─────────────────────────
  useEffect(() => {
    if (phase !== 'active' || selectedMode !== 'timed' || selectedAnswer !== null) return

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time's up - auto fail
          setSelectedAnswer(-1)
          setShowExplanation(true)
          setAnswerFlash('wrong')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [phase, selectedMode, selectedAnswer])

  // Reset timer on new question
  useEffect(() => {
    if (phase === 'active' && selectedMode === 'timed' && selectedAnswer === null) {
      // Using requestAnimationFrame to avoid synchronous setState in effect
      requestAnimationFrame(() => setTimeLeft(30))
    }
  }, [currentQuizIndex, phase, selectedMode, selectedAnswer])

  // ─── Answer Handler ────────────────────────────────────
  const handleAnswer = useCallback(
    (index: number) => {
      if (selectedAnswer !== null || !activeQuestions[currentQuizIndex]) return

      const currentQ = activeQuestions[currentQuizIndex]
      const isCorrect = index === currentQ.correctIndex

      setSelectedAnswer(index)
      setShowExplanation(true)

      if (isCorrect) {
        const modeConfig = QUIZ_MODES.find((m) => m.id === selectedMode)
        const xpGain = modeConfig?.xpPerQuestion ?? 10
        setQuizScore(quizScore + 1)
        setXpAnimation((prev) => prev + xpGain)
        setAnswerFlash('correct')
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 1500)
      } else {
        setAnswerFlash('wrong')
      }

      setTimeout(() => setAnswerFlash(null), 600)
    },
    [selectedAnswer, activeQuestions, currentQuizIndex, quizScore, setQuizScore, selectedMode]
  )

  // ─── Next Question ─────────────────────────────────────
  const nextQuestion = useCallback(() => {
    if (currentQuizIndex >= activeQuestions.length - 1) {
      // Quiz finished
      const modeConfig = QUIZ_MODES.find((m) => m.id === selectedMode)
      const finalScore = quizScore
      const xpEarned = xpAnimation
      const coinsEarned = (modeConfig?.coinReward ?? 5) * finalScore

      setQuizResult({
        correct: finalScore,
        incorrect: activeQuestions.length - finalScore,
        total: activeQuestions.length,
        xpEarned,
        coinsEarned,
        answers: activeQuestions.map((q, i) => {
          // We track only answered ones properly, for simplicity track all up to current
          return { questionIndex: i, selectedIndex: -1, isCorrect: false }
        }),
      })

      // Update user XP and coins
      updateUser({
        xp: user.xp + xpEarned,
        coins: user.coins + coinsEarned,
      })

      // Save quiz result to API
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('medai-token') : null
        if (token) {
          fetch('/api/quizzes/results', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              quizMode: selectedMode,
              correct: finalScore,
              total: activeQuestions.length,
              xpEarned,
              coinsEarned,
            }),
          }).catch(() => {})
        }
      } catch {}

      setQuizActive(false)
      setPhase('results')
    } else {
      setCurrentQuizIndex(currentQuizIndex + 1)
      setSelectedAnswer(null)
      setShowExplanation(false)
    }
  }, [currentQuizIndex, activeQuestions, quizScore, xpAnimation, selectedMode, setQuizActive, setCurrentQuizIndex, updateUser, user.xp, user.coins])

  // ─── Flashcard Handlers ────────────────────────────────
  const handleFlashcardSwipe = useCallback(
    (direction: 'known' | 'unknown') => {
      if (direction === 'known') {
        setFlashcardKnown((prev) => prev + 1)
      } else {
        setFlashcardUnknown((prev) => prev + 1)
      }

      if (flashcardIndex >= activeQuestions.length - 1) {
        // Flashcards finished
        const xpEarned = flashcardKnown * 5 + 10
        const coinsEarned = flashcardKnown * 3
        setQuizResult({
          correct: flashcardKnown,
          incorrect: flashcardUnknown,
          total: activeQuestions.length,
          xpEarned,
          coinsEarned,
          answers: [],
        })
        updateUser({
          xp: user.xp + xpEarned,
          coins: user.coins + coinsEarned,
        })
        setPhase('results')
      } else {
        setFlashcardIndex((prev) => prev + 1)
        setFlashcardFlipped(false)
      }
    },
    [flashcardIndex, flashcardKnown, flashcardUnknown, activeQuestions, updateUser, user.xp, user.coins]
  )

  // ─── Reset / Back ──────────────────────────────────────
  const resetQuiz = useCallback(() => {
    setPhase('selection')
    setSelectedMode(null)
    setSelectedAnswer(null)
    setShowExplanation(false)
    setQuizResult(null)
    setAnswerFlash(null)
    setShowConfetti(false)
    setXpAnimation(0)
    setFlashcardFlipped(false)
    setFlashcardIndex(0)
    setFlashcardKnown(0)
    setFlashcardUnknown(0)
    setCurrentQuizIndex(0)
    setQuizScore(0)
    setQuizActive(false)
  }, [setCurrentQuizIndex, setQuizScore, setQuizActive])

  // ─── Review Missed Questions ───────────────────────────
  const startReview = useCallback(() => {
    setPhase('review')
    setCurrentQuizIndex(0)
    setSelectedAnswer(null)
    setShowExplanation(false)
  }, [setCurrentQuizIndex])

  // ─── Current Question ──────────────────────────────────
  const currentQuestion = useMemo(
    () => activeQuestions[currentQuizIndex],
    [activeQuestions, currentQuizIndex]
  )

  const currentCategory = useMemo(
    () => (currentQuestion ? CATEGORY_MAP[currentQuestion.category] ?? CATEGORY_MAP.general : CATEGORY_MAP.general),
    [currentQuestion]
  )

  const currentDifficulty = useMemo(
    () => (currentQuestion ? (DIFFICULTY_MAP[currentQuestion?.difficulty ?? 'easy'] ?? DIFFICULTY_MAP.easy) : DIFFICULTY_MAP.easy),
    [currentQuestion]
  )

  const progressPercent = useMemo(
    () => (activeQuestions.length > 0 ? ((currentQuizIndex + 1) / activeQuestions.length) * 100 : 0),
    [currentQuizIndex, activeQuestions.length]
  )

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  RENDER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  return (
    <motion.div
      dir="rtl"
      className="min-h-screen w-full pb-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="mx-auto max-w-4xl space-y-6 px-4 sm:px-6">

        {/* ═══════════════════════════════════════════════════
            PHASE: QUIZ MODE SELECTION
        ═══════════════════════════════════════════════════ */}
        <AnimatePresence mode="wait">
          {phase === 'selection' && (
            <motion.div
              key="selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Header */}
              <motion.div variants={itemVariants} className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="rounded-xl bg-neon-cyan/15 p-2.5 border border-neon-cyan/20">
                    <Trophy className="h-6 w-6 text-neon-cyan" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold neon-text">الاختبارات</h1>
                    <p className="text-sm text-muted-foreground">اختبر معلوماتك الطبية واكسب نقاط الخبرة</p>
                  </div>
                </div>
              </motion.div>

              {/* Stats Bar */}
              <motion.div variants={itemVariants} className="glass-card p-4 mb-6 flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2 rounded-full bg-neon-cyan/10 px-3 py-1.5 border border-neon-cyan/20">
                  <Zap className="h-4 w-4 text-neon-cyan" />
                  <span className="text-sm font-semibold text-neon-cyan">{user.xp.toLocaleString('ar-EG')} XP</span>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1.5 border border-amber-500/20">
                  <Coins className="h-4 w-4 text-amber-400" />
                  <span className="text-sm font-semibold text-amber-400">{user.coins.toLocaleString('ar-EG')}</span>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-neon-orange/10 px-3 py-1.5 border border-neon-orange/20">
                  <Flame className="h-4 w-4 text-neon-orange" />
                  <span className="text-sm font-semibold text-neon-orange">{user.streak} يوم تتابع</span>
                </div>
              </motion.div>

              {/* Mode Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {QUIZ_MODES.map((mode, i) => (
                  <motion.button
                    key={mode.id}
                    variants={itemVariants}
                    whileHover={{ scale: 1.03, y: -4 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => startQuiz(mode.id)}
                    className={`glass-card gradient-border p-5 text-right group relative overflow-hidden ${mode.borderColor}`}
                    style={{ boxShadow: mode.glow }}
                  >
                    {/* Background gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-bl ${mode.gradient} opacity-50 group-hover:opacity-80 transition-opacity`} />

                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`rounded-xl bg-muted/50 p-2.5 border ${mode.borderColor} group-hover:bg-muted transition-colors`}>
                          <span className="text-neon-cyan">{mode.icon}</span>
                        </div>
                        <Badge variant="outline" className={`text-[10px] ${mode.borderColor} ${mode.gradient.split(' ')[0].replace('/20', '/30').replace('from-', 'bg-').replace('from-', '')}`}>
                          {mode.questionCount} سؤال
                        </Badge>
                      </div>

                      <h3 className="font-bold text-lg mb-1 group-hover:neon-text transition-all">
                        {mode.title}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-5 mb-3">{mode.description}</p>

                      <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1 text-neon-cyan">
                          <Zap className="h-3 w-3" />
                          +{mode.xpPerQuestion} XP/سؤال
                        </span>
                        <span className="flex items-center gap-1 text-amber-400">
                          🪙 +{mode.coinReward}/إجابة
                        </span>
                      </div>
                    </div>

                    {/* Arrow indicator */}
                    <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronLeft className="h-5 w-5 text-neon-cyan" />
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════
              PHASE: ACTIVE QUIZ
          ═══════════════════════════════════════════════════ */}
          {phase === 'active' && currentQuestion && (
            <motion.div
              key="active-quiz"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              {/* Confetti overlay */}
              {showConfetti && <ConfettiEffect />}

              {/* Top Bar: Progress + XP + Timer */}
              <div className="glass-card p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={resetQuiz}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                    خروج
                  </button>

                  <div className="flex items-center gap-3">
                    {/* XP Counter */}
                    <motion.div
                      className="flex items-center gap-1.5 rounded-full bg-neon-cyan/10 px-3 py-1 border border-neon-cyan/20"
                      key={xpAnimation}
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 0.3 }}
                    >
                      <Zap className="h-3.5 w-3.5 text-neon-cyan" />
                      <span className="text-sm font-bold text-neon-cyan">{xpAnimation} XP</span>
                    </motion.div>

                    {/* Timer (timed mode) */}
                    {selectedMode === 'timed' && (
                      <motion.div
                        className={`flex items-center gap-1.5 rounded-full px-3 py-1 border ${
                          timeLeft <= 10
                            ? 'bg-red-500/15 border-red-500/30'
                            : 'bg-neon-orange/10 border-neon-orange/20'
                        }`}
                        animate={timeLeft <= 5 ? { scale: [1, 1.05, 1] } : {}}
                        transition={{ repeat: Infinity, duration: 0.5 }}
                      >
                        <Clock className={`h-3.5 w-3.5 ${timeLeft <= 10 ? 'text-red-400' : 'text-neon-orange'}`} />
                        <span className={`text-sm font-bold ${timeLeft <= 10 ? 'text-red-400' : 'text-neon-orange'}`}>
                          {timeLeft}s
                        </span>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="relative">
                  <div className="h-3 rounded-full bg-muted/50 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-l from-neon-cyan to-neon-blue"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-foreground">
                    {currentQuizIndex + 1} / {activeQuestions.length}
                  </span>
                </div>
              </div>

              {/* Question Card */}
              <motion.div
                key={currentQuizIndex}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                className="glass-card gradient-border p-6 mb-4 relative overflow-hidden"
              >
                {/* Answer flash overlay */}
                <AnimatePresence>
                  {answerFlash && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`absolute inset-0 pointer-events-none z-20 ${
                        answerFlash === 'correct'
                          ? 'bg-neon-green/5'
                          : 'bg-red-500/5'
                      }`}
                    />
                  )}
                </AnimatePresence>

                {/* Content wrapper above pseudo-element */}
                <div className="relative z-10">
                {/* Category + Difficulty badges */}
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="outline" className={`text-xs ${currentDifficulty.bg} ${currentDifficulty.color} ${currentDifficulty.border}`}>
                    {currentDifficulty.label}
                  </Badge>
                  <Badge variant="outline" className="text-xs bg-muted/50 text-muted-foreground border-border">
                    <span className={currentCategory.color}>{currentCategory.label}</span>
                  </Badge>
                </div>

                {/* Question */}
                <h2 className="text-lg font-bold leading-8 mb-6">
                  {currentQuestion.question}
                </h2>

                {/* Answer Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentQuestion.options.map((option, idx) => {
                    const isCorrect = idx === currentQuestion.correctIndex
                    const isSelected = selectedAnswer === idx
                    const isTimeUp = selectedAnswer === -1 && isCorrect

                    let optionClass = 'glass-card border-border hover:border-neon-cyan/30 hover:bg-neon-cyan/5'
                    let glowStyle = {}

                    if (selectedAnswer !== null) {
                      if (isCorrect) {
                        optionClass = 'border-neon-green/50 bg-neon-green/10'
                        glowStyle = { boxShadow: '0 0 20px rgba(16,185,129,0.2)' }
                      } else if (isSelected && !isCorrect) {
                        optionClass = 'border-red-500/50 bg-red-500/10'
                        glowStyle = { boxShadow: '0 0 20px rgba(239,68,68,0.2)' }
                      } else {
                        optionClass = 'border-border opacity-50'
                      }
                    }

                    const optionLabels = ['أ', 'ب', 'ج', 'د']

                    return (
                      <motion.button
                        key={idx}
                        whileHover={selectedAnswer === null ? { scale: 1.02, y: -2 } : {}}
                        whileTap={selectedAnswer === null ? { scale: 0.98 } : {}}
                        onClick={() => handleAnswer(idx)}
                        disabled={selectedAnswer !== null}
                        className={`rounded-xl p-4 border transition-all text-right flex items-center gap-3 ${optionClass}`}
                        style={glowStyle}
                      >
                        <span className={`flex h-8 w-8 items-center justify-center rounded-lg border text-sm font-bold shrink-0 ${
                          selectedAnswer !== null && isCorrect
                            ? 'border-neon-green/50 bg-neon-green/20 text-neon-green'
                            : selectedAnswer !== null && isSelected && !isCorrect
                            ? 'border-red-500/50 bg-red-500/20 text-red-400'
                            : 'border-border bg-muted/50 text-muted-foreground'
                        }`}>
                          {optionLabels[idx]}
                        </span>
                        <span className="flex-1 font-medium text-sm leading-6">{option}</span>
                        {selectedAnswer !== null && isCorrect && (
                          <CheckCircle2 className="h-5 w-5 text-neon-green shrink-0" />
                        )}
                        {selectedAnswer !== null && isSelected && !isCorrect && (
                          <XCircle className="h-5 w-5 text-red-400 shrink-0" />
                        )}
                      </motion.button>
                    )
                  })}
                </div>

                {/* +XP Animation */}
                <AnimatePresence>
                  {selectedAnswer !== null && selectedAnswer === currentQuestion.correctIndex && (
                    <motion.div
                      initial={{ opacity: 0, y: 20, scale: 0.5 }}
                      animate={{ opacity: 1, y: -10, scale: 1 }}
                      exit={{ opacity: 0, y: -30 }}
                      className="absolute top-4 left-4 flex items-center gap-1 rounded-full bg-neon-green/20 px-3 py-1 border border-neon-green/30 z-30"
                    >
                      <Zap className="h-4 w-4 text-neon-green" />
                      <span className="text-sm font-bold text-neon-green">+{QUIZ_MODES.find(m => m.id === selectedMode)?.xpPerQuestion ?? 10} XP</span>
                    </motion.div>
                  )}
                </AnimatePresence>
                </div>{/* end content wrapper z-10 */}
              </motion.div>

              {/* Explanation */}
              <AnimatePresence>
                {showExplanation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4"
                  >
                    <div className={`rounded-xl p-4 border ${
                      selectedAnswer !== null && selectedAnswer === currentQuestion.correctIndex
                        ? 'bg-neon-green/5 border-neon-green/15'
                        : 'bg-red-500/5 border-red-500/15'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        {selectedAnswer !== null && selectedAnswer === currentQuestion.correctIndex ? (
                          <CheckCircle2 className="h-4 w-4 text-neon-green" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-400" />
                        )}
                        <p className="text-sm font-bold">
                          {selectedAnswer !== null && selectedAnswer === currentQuestion.correctIndex ? 'إجابة صحيحة! 🎉' : 'إجابة خاطئة'}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground leading-5">{currentQuestion.explanation}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Next Button */}
              <AnimatePresence>
                {selectedAnswer !== null && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                  >
                    <Button
                      onClick={nextQuestion}
                      className="w-full h-12 bg-gradient-to-l from-neon-cyan to-neon-blue text-white font-bold text-base hover:opacity-90 rounded-xl neon-glow"
                    >
                      {currentQuizIndex >= activeQuestions.length - 1 ? 'عرض النتائج' : 'التالي'}
                      <ChevronLeft className="h-5 w-5 mr-1" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════
              PHASE: FLASHCARDS MODE
          ═══════════════════════════════════════════════════ */}
          {phase === 'flashcards' && activeQuestions[flashcardIndex] && (
            <motion.div
              key="flashcards"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Flashcard Header */}
              <div className="glass-card p-4 mb-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={resetQuiz}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                    خروج
                  </button>
                  <span className="text-sm font-bold">
                    {flashcardIndex + 1} / {activeQuestions.length}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-xs text-neon-green">
                      <ThumbsUp className="h-3 w-3" /> {flashcardKnown}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-red-400">
                      <ThumbsDown className="h-3 w-3" /> {flashcardUnknown}
                    </span>
                  </div>
                </div>
                <div className="mt-3 h-2 rounded-full bg-muted/50 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-l from-neon-pink to-neon-purple"
                    animate={{ width: `${((flashcardIndex + 1) / activeQuestions.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Flashcard */}
              <div className="perspective-1000 mb-6" style={{ perspective: '1000px' }}>
                <motion.div
                  key={flashcardIndex}
                  animate={{ rotateY: flashcardFlipped ? 180 : 0 }}
                  transition={{ duration: 0.6, ease: 'easeInOut' }}
                  className="relative w-full"
                  style={{ transformStyle: 'preserve-3d' }}
                  onPan={(_, info: PanInfo) => {
                    if (Math.abs(info.offset.x) > 100 && info.offset.x > 0) {
                      handleFlashcardSwipe('known')
                    } else if (Math.abs(info.offset.x) > 100 && info.offset.x < 0) {
                      handleFlashcardSwipe('unknown')
                    }
                  }}
                >
                  {/* Front - Question */}
                  <div
                    className="glass-card gradient-border p-8 min-h-[320px] flex flex-col items-center justify-center text-center relative"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    <div className="relative z-10">
                    <Badge variant="outline" className={`text-xs mb-4 ${currentDifficulty.bg} ${currentDifficulty.color} ${currentDifficulty.border}`}>
                      {activeQuestions[flashcardIndex]?.difficulty === 'easy' ? 'سهل' : activeQuestions[flashcardIndex]?.difficulty === 'medium' ? 'متوسط' : 'صعب'}
                    </Badge>
                    <h2 className="text-xl font-bold leading-9 mb-6">
                      {activeQuestions[flashcardIndex]?.question}
                    </h2>
                    <button
                      onClick={() => setFlashcardFlipped(true)}
                      className="flex items-center gap-2 text-sm text-neon-cyan hover:underline"
                    >
                      <Eye className="h-4 w-4" />
                      اضغط لعرض الإجابة
                    </button>
                    </div>
                  </div>

                  {/* Back - Answer */}
                  {flashcardFlipped && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 glass-card gradient-border p-8 min-h-[320px] flex flex-col items-center justify-center text-center relative"
                      style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    >
                      <div className="relative z-10">
                      <div className="mb-4">
                        <CheckCircle2 className="h-8 w-8 text-neon-green mx-auto mb-3" />
                        <p className="text-lg font-bold text-neon-green mb-2">
                          {activeQuestions[flashcardIndex]?.options[activeQuestions[flashcardIndex]?.correctIndex]}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground leading-6 mb-6">
                        {activeQuestions[flashcardIndex]?.explanation}
                      </p>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              </div>

              {/* Swipe Buttons */}
              <div className="flex items-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleFlashcardSwipe('unknown')}
                  className="flex-1 h-14 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 font-bold flex items-center justify-center gap-2 hover:bg-red-500/20 transition-colors"
                >
                  <ThumbsDown className="h-5 w-5" />
                  ما عرفتها
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleFlashcardSwipe('known')}
                  className="flex-1 h-14 rounded-xl border border-neon-green/30 bg-neon-green/10 text-neon-green font-bold flex items-center justify-center gap-2 hover:bg-neon-green/20 transition-colors"
                >
                  <ThumbsUp className="h-5 w-5" />
                  عرفتها
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════
              PHASE: QUIZ RESULTS
          ═══════════════════════════════════════════════════ */}
          {phase === 'results' && quizResult && (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
            >
              <div className="glass-card gradient-border p-8 text-center relative overflow-hidden">
                {/* Background decorations */}
                <div className="absolute top-0 left-0 w-48 h-48 bg-neon-cyan/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-neon-purple/5 rounded-full blur-3xl" />

                {showConfetti && <ConfettiEffect />}

                <div className="relative z-10">
                  {/* Title */}
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-6"
                  >
                    <h2 className="text-2xl font-bold mb-1">
                      {quizResult.correct / quizResult.total >= 0.8
                        ? 'أداء ممتاز! 🎉'
                        : quizResult.correct / quizResult.total >= 0.6
                        ? 'أداء جيد! 👏'
                        : 'حاول مرة أخرى! 💪'}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {selectedMode === 'flashcards' ? 'نتيجة البطاقات' : 'نتيجة الاختبار'}
                    </p>
                  </motion.div>

                  {/* Score Circle */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: 'spring', stiffness: 150 }}
                    className="flex justify-center mb-6"
                  >
                    <ScoreCircle score={quizResult.correct} total={quizResult.total} />
                  </motion.div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="rounded-xl bg-neon-green/10 border border-neon-green/20 p-3"
                    >
                      <CheckCircle2 className="h-5 w-5 text-neon-green mx-auto mb-1" />
                      <p className="text-2xl font-black text-neon-green">{quizResult.correct}</p>
                      <p className="text-[10px] text-muted-foreground">صحيح</p>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="rounded-xl bg-red-500/10 border border-red-500/20 p-3"
                    >
                      <XCircle className="h-5 w-5 text-red-400 mx-auto mb-1" />
                      <p className="text-2xl font-black text-red-400">{quizResult.incorrect}</p>
                      <p className="text-[10px] text-muted-foreground">خاطئ</p>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 }}
                      className="rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 p-3"
                    >
                      <Zap className="h-5 w-5 text-neon-cyan mx-auto mb-1" />
                      <p className="text-2xl font-black text-neon-cyan">+{quizResult.xpEarned}</p>
                      <p className="text-[10px] text-muted-foreground">XP مكتسبة</p>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 }}
                      className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3"
                    >
                      <Coins className="h-5 w-5 text-amber-400 mx-auto mb-1" />
                      <p className="text-2xl font-black text-amber-400">+{quizResult.coinsEarned}</p>
                      <p className="text-[10px] text-muted-foreground">عملات</p>
                    </motion.div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={() => selectedMode && startQuiz(selectedMode)}
                      className="flex-1 h-12 bg-gradient-to-l from-neon-cyan to-neon-blue text-white font-bold hover:opacity-90 rounded-xl neon-glow"
                    >
                      <RotateCcw className="h-4 w-4 ml-2" />
                      حاول مرة أخرى
                    </Button>
                    {quizResult.incorrect > 0 && (
                      <Button
                        onClick={startReview}
                        variant="outline"
                        className="flex-1 h-12 border-neon-purple/30 text-neon-purple hover:bg-neon-purple/10 rounded-xl"
                      >
                        <Eye className="h-4 w-4 ml-2" />
                        راجع الأخطاء
                      </Button>
                    )}
                    <Button
                      onClick={resetQuiz}
                      variant="outline"
                      className="flex-1 h-12 border-border text-muted-foreground hover:bg-muted rounded-xl"
                    >
                      <Home className="h-4 w-4 ml-2" />
                      العودة
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════
              PHASE: REVIEW MISSED QUESTIONS
          ═══════════════════════════════════════════════════ */}
          {phase === 'review' && activeQuestions[currentQuizIndex] && (
            <motion.div
              key="review"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="glass-card p-4 mb-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setPhase('results')}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                    العودة للنتائج
                  </button>
                  <span className="text-sm font-bold text-neon-purple">
                    مراجعة الأسئلة الخاطئة
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {currentQuizIndex + 1} / {activeQuestions.length}
                  </span>
                </div>
              </div>

              <motion.div
                key={`review-${currentQuizIndex}`}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-card p-6 mb-4"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="outline" className={`text-xs ${(DIFFICULTY_MAP[activeQuestions[currentQuizIndex]?.difficulty ?? 'easy'] ?? DIFFICULTY_MAP.easy).bg} ${(DIFFICULTY_MAP[activeQuestions[currentQuizIndex]?.difficulty ?? 'easy'] ?? DIFFICULTY_MAP.easy).color} ${(DIFFICULTY_MAP[activeQuestions[currentQuizIndex]?.difficulty ?? 'easy'] ?? DIFFICULTY_MAP.easy).border}`}>
                    {(DIFFICULTY_MAP[activeQuestions[currentQuizIndex]?.difficulty ?? 'easy'] ?? DIFFICULTY_MAP.easy).label}
                  </Badge>
                  <Badge variant="outline" className="text-xs bg-muted/50 text-muted-foreground border-border">
                    {(CATEGORY_MAP[activeQuestions[currentQuizIndex]?.category ?? 'general'] ?? CATEGORY_MAP.general).label}
                  </Badge>
                </div>

                <h2 className="text-lg font-bold leading-8 mb-6">
                  {activeQuestions[currentQuizIndex]?.question ?? ''}
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  {(activeQuestions[currentQuizIndex]?.options ?? []).map((option, idx) => {
                    const isCorrect = idx === activeQuestions[currentQuizIndex]?.correctIndex
                    return (
                      <div
                        key={idx}
                        className={`rounded-xl p-4 border flex items-center gap-3 ${
                          isCorrect
                            ? 'border-neon-green/50 bg-neon-green/10'
                            : 'border-border bg-muted/30'
                        }`}
                      >
                        <span className={`flex h-7 w-7 items-center justify-center rounded-lg border text-xs font-bold shrink-0 ${
                          isCorrect
                            ? 'border-neon-green/50 bg-neon-green/20 text-neon-green'
                            : 'border-border bg-muted/50 text-muted-foreground'
                        }`}>
                          {['أ', 'ب', 'ج', 'د'][idx]}
                        </span>
                        <span className={`text-sm ${isCorrect ? 'text-neon-green font-bold' : 'text-muted-foreground'}`}>{option}</span>
                        {isCorrect && <CheckCircle2 className="h-4 w-4 text-neon-green mr-auto shrink-0" />}
                      </div>
                    )
                  })}
                </div>

                <div className="rounded-xl bg-neon-cyan/5 border border-neon-cyan/15 p-3">
                  <p className="text-xs font-semibold text-neon-cyan mb-1">الشرح:</p>
                  <p className="text-xs text-muted-foreground leading-5">{activeQuestions[currentQuizIndex]?.explanation ?? ''}</p>
                </div>
              </motion.div>

              <Button
                onClick={() => {
                  if (currentQuizIndex >= activeQuestions.length - 1) {
                    setPhase('results')
                  } else {
                    setCurrentQuizIndex(currentQuizIndex + 1)
                  }
                }}
                className="w-full h-12 bg-gradient-to-l from-neon-purple to-neon-pink text-white font-bold hover:opacity-90 rounded-xl"
              >
                {currentQuizIndex >= activeQuestions.length - 1 ? 'العودة للنتائج' : 'السؤال التالي'}
                <ChevronLeft className="h-5 w-5 mr-1" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
