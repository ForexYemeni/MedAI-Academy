'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight, BookOpen, Clock, CheckCircle2, Circle, Lock,
  Play, FileText, HelpCircle, Activity, Zap, ChevronLeft,
  Star, Users, Crown, GraduationCap, Sparkles, Award,
  Menu, X, Brain, Target, Lightbulb, ChevronDown
} from 'lucide-react'
import { useAppStore, type Lesson, type Course } from '@/store/app-store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'

// ─── Category Config ────────────────────────────────────────

const categoryGradients: Record<string, string> = {
  emergency: 'from-red-600/80 via-orange-500/60 to-yellow-500/40',
  cardiology: 'from-pink-600/80 via-rose-500/60 to-red-400/40',
  neurology: 'from-purple-600/80 via-violet-500/60 to-indigo-400/40',
  pediatrics: 'from-cyan-600/80 via-teal-500/60 to-emerald-400/40',
  surgery: 'from-blue-600/80 via-indigo-500/60 to-purple-400/40',
  internal: 'from-emerald-600/80 via-green-500/60 to-lime-400/40',
  radiology: 'from-amber-600/80 via-yellow-500/60 to-orange-400/40',
  pharmacology: 'from-fuchsia-600/80 via-pink-500/60 to-rose-400/40',
}

const categoryIcons: Record<string, string> = {
  emergency: '🚑', cardiology: '❤️', neurology: '🧠', pediatrics: '👶',
  surgery: '🔪', internal: '🩺', radiology: '🔬', pharmacology: '💊',
}

const levelConfig = {
  beginner: { label: 'مبتدئ', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  intermediate: { label: 'متوسط', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  advanced: { label: 'متقدم', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
}

const lessonTypeIcons = {
  article: FileText,
  video: Play,
  quiz: HelpCircle,
  simulation: Activity,
  flashcard: Brain,
}

const lessonTypeLabels = {
  article: 'مقال',
  video: 'فيديو',
  quiz: 'اختبار',
  simulation: 'محاكاة',
  flashcard: 'بطاقات',
}

const lessonTypeColors = {
  article: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  video: 'bg-red-500/15 text-red-400 border-red-500/25',
  quiz: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  simulation: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
  flashcard: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
}

// ─── Professional Markdown Content Renderer ──────────────────

function formatInline(text: string): React.ReactNode {
  // Process bold text with medical-style highlight
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <span key={i} className="text-white font-bold bg-neon-cyan/8 px-1 rounded">
          {part.slice(2, -2)}
        </span>
      )
    }
    return part
  })
}

let _globalKey = 0
function getKey() { return `c-${++_globalKey}` }

function renderContent(content: string) {
  _globalKey = 0
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let inTable = false
  let tableRows: string[][] = []
  let tableHeaders: string[] = []
  let inWarningBox = false
  let warningContent: string[] = []
  let inInfoBox = false
  let infoContent: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Skip empty lines
    if (!line) {
      if (inTable) {
        elements.push(renderTable(tableHeaders, tableRows))
        inTable = false
        tableHeaders = []
        tableRows = []
      }
      continue
    }

    // Warning/alert box detection (lines starting with > )
    if (line.startsWith('> ')) {
      const text = line.slice(2)
      // Check if it's a warning prefix
      if (text.startsWith('⚠️') || text.startsWith('تحذير') || text.startsWith('مهم') || text.startsWith('تنبيه')) {
        if (inInfoBox) { elements.push(renderInfoBox(infoContent)); inInfoBox = false; infoContent = [] }
        inWarningBox = true
        warningContent.push(text)
        continue
      }
      // Regular info box
      if (inWarningBox) { elements.push(renderWarningBox(warningContent)); inWarningBox = false; warningContent = [] }
      inInfoBox = true
      infoContent.push(text)
      continue
    } else {
      if (inWarningBox) { elements.push(renderWarningBox(warningContent)); inWarningBox = false; warningContent = [] }
      if (inInfoBox) { elements.push(renderInfoBox(infoContent)); inInfoBox = false; infoContent = [] }
    }

    // Table detection
    if (line.startsWith('|') && line.endsWith('|')) {
      const cells = line.split('|').filter(c => c.trim()).map(c => c.trim())
      if (cells.every(c => /^[-:]+$/.test(c))) continue
      if (!inTable) { inTable = true; tableHeaders = cells }
      else { tableRows.push(cells) }
      continue
    } else if (inTable) {
      elements.push(renderTable(tableHeaders, tableRows))
      inTable = false; tableHeaders = []; tableRows = []
    }

    // H3 - Sub-section header with medical accent
    if (line.startsWith('### ')) {
      elements.push(
        <div key={getKey()} className="mt-8 mb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-8 rounded-full bg-gradient-to-b from-neon-cyan to-neon-purple shadow-[0_0_8px_rgba(0,245,255,0.3)]" />
            <h3 className="text-lg font-bold text-white">{formatInline(line.slice(4))}</h3>
          </div>
          <div className="h-px bg-gradient-to-l from-neon-cyan/20 via-neon-purple/10 to-transparent mr-4" />
        </div>
      )
      continue
    }

    // H2 - Section header with icon and glow
    if (line.startsWith('## ')) {
      elements.push(
        <div key={getKey()} className="mt-10 mb-5 relative">
          <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-16 h-16 bg-neon-cyan/5 rounded-full blur-2xl" />
          <div className="relative flex items-center gap-3">
            <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 border border-neon-cyan/20 flex items-center justify-center shadow-[0_0_15px_rgba(0,245,255,0.1)]">
              <Sparkles className="w-4 h-4 text-neon-cyan" />
            </div>
            <h2 className="text-xl font-bold text-white">{formatInline(line.slice(3))}</h2>
          </div>
          <div className="mt-3 h-0.5 rounded-full bg-gradient-to-l from-neon-cyan/30 via-neon-purple/15 to-transparent" />
        </div>
      )
      continue
    }

    // H1 - Main title with neon glow
    if (line.startsWith('# ')) {
      elements.push(
        <div key={getKey()} className="mt-6 mb-6 relative">
          <div className="absolute -right-4 top-0 w-24 h-24 bg-neon-cyan/8 rounded-full blur-3xl" />
          <h1 className="relative text-2xl font-black neon-text leading-relaxed">
            {formatInline(line.slice(2))}
          </h1>
          <div className="mt-3 h-1 rounded-full bg-gradient-to-l from-neon-cyan/40 via-neon-purple/20 to-transparent w-1/2" />
        </div>
      )
      continue
    }

    // Numbered list - Professional step display
    if (/^\d+\.\s/.test(line)) {
      const num = line.match(/^(\d+)\.\s/)?.[1] || ''
      const text = line.replace(/^\d+\.\s/, '')
      elements.push(
        <motion.div
          key={getKey()}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: parseInt(num) * 0.05 }}
          className="flex gap-4 my-3 items-start group"
        >
          <div className="flex-shrink-0 relative">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-neon-cyan/20 to-neon-blue/10 border border-neon-cyan/25 flex items-center justify-center shadow-[0_0_10px_rgba(0,245,255,0.1)] group-hover:shadow-[0_0_15px_rgba(0,245,255,0.2)] transition-shadow">
              <span className="text-neon-cyan text-xs font-black">{num}</span>
            </div>
            {parseInt(num) > 1 && (
              <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-full h-2 w-0.5 bg-neon-cyan/15" />
            )}
          </div>
          <span className="text-gray-300 leading-8 flex-1 text-[15px]">{formatInline(text)}</span>
        </motion.div>
      )
      continue
    }

    // Bullet list - Professional with subtle cards
    if (line.startsWith('- ')) {
      const text = line.slice(2)
      elements.push(
        <motion.div
          key={getKey()}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex gap-3 my-2.5 items-start mr-2 group"
        >
          <div className="flex-shrink-0 mt-2.5">
            <div className="w-2 h-2 rounded-full bg-gradient-to-br from-neon-cyan to-neon-blue shadow-[0_0_6px_rgba(0,245,255,0.4)]" />
          </div>
          <div className="flex-1 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04] group-hover:border-neon-cyan/15 group-hover:bg-white/[0.04] transition-all">
            <span className="text-gray-300 leading-7 text-[15px]">{formatInline(text)}</span>
          </div>
        </motion.div>
      )
      continue
    }

    // Regular paragraph with improved typography
    elements.push(
      <p key={getKey()} className="text-gray-300 leading-[2] my-3 text-[15px]">
        {formatInline(line)}
      </p>
    )
  }

  // Close any remaining boxes
  if (inWarningBox) { elements.push(renderWarningBox(warningContent)) }
  if (inInfoBox) { elements.push(renderInfoBox(infoContent)) }
  if (inTable) { elements.push(renderTable(tableHeaders, tableRows)) }

  return elements
}

function renderWarningBox(content: string[]) {
  return (
    <motion.div
      key={getKey()}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="my-5 rounded-xl overflow-hidden border border-amber-500/25"
    >
      <div className="bg-gradient-to-l from-amber-500/10 to-amber-600/5 px-4 py-2.5 flex items-center gap-2 border-b border-amber-500/15">
        <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <span className="text-amber-400 font-bold text-sm">تنبيه طبي</span>
      </div>
      <div className="bg-amber-500/[0.03] px-5 py-3 space-y-2">
        {content.map((line, i) => (
          <p key={i} className="text-amber-200/80 text-sm leading-7">{formatInline(line.replace(/^[⚠️🩺💊❗]\s*/, ''))}</p>
        ))}
      </div>
    </motion.div>
  )
}

function renderInfoBox(content: string[]) {
  return (
    <motion.div
      key={getKey()}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="my-5 rounded-xl overflow-hidden border border-neon-cyan/20"
    >
      <div className="bg-gradient-to-l from-neon-cyan/10 to-neon-blue/5 px-4 py-2.5 flex items-center gap-2 border-b border-neon-cyan/15">
        <div className="w-6 h-6 rounded-lg bg-neon-cyan/20 flex items-center justify-center">
          <Lightbulb className="w-3.5 h-3.5 text-neon-cyan" />
        </div>
        <span className="text-neon-cyan font-bold text-sm">معلومة مهمة</span>
      </div>
      <div className="bg-neon-cyan/[0.02] px-5 py-3 space-y-2">
        {content.map((line, i) => (
          <p key={i} className="text-gray-300 text-sm leading-7">{formatInline(line)}</p>
        ))}
      </div>
    </motion.div>
  )
}

function renderTable(headers: string[], rows: string[][]) {
  return (
    <motion.div
      key={getKey()}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="my-6 overflow-x-auto rounded-xl border border-white/10 shadow-[0_0_20px_rgba(0,245,255,0.05)]"
    >
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gradient-to-l from-neon-cyan/10 to-neon-blue/5">
            {headers.map((h, i) => (
              <th key={i} className="px-5 py-3.5 text-right font-bold text-neon-cyan border-b border-neon-cyan/15 text-[13px]">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className={`border-b border-white/5 ${ri % 2 === 0 ? 'bg-white/[0.01]' : ''} hover:bg-white/[0.04] transition-colors`}>
              {row.map((cell, ci) => (
                <td key={ci} className="px-5 py-3 text-gray-300 text-[13px] leading-6">
                  {formatInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  )
}

// ─── Lesson Sidebar Item ─────────────────────────────────────

function LessonItem({
  lesson,
  isActive,
  isCompleted,
  isLocked,
  isNext,
  onClick,
}: {
  lesson: Lesson
  isActive: boolean
  isCompleted: boolean
  isLocked: boolean
  isNext: boolean
  onClick: () => void
}) {
  const TypeIcon = lessonTypeIcons[lesson.type]
  const typeColor = lessonTypeColors[lesson.type]

  return (
    <motion.button
      onClick={onClick}
      disabled={isLocked}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-right transition-all relative group ${
        isActive
          ? 'bg-neon-cyan/10 border border-neon-cyan/30 shadow-[0_0_15px_rgba(0,245,255,0.1)]'
          : isLocked
          ? 'opacity-40 cursor-not-allowed border border-transparent'
          : 'hover:bg-white/5 border border-transparent'
      }`}
      whileHover={!isLocked ? { x: -3 } : {}}
      whileTap={!isLocked ? { scale: 0.98 } : {}}
    >
      {/* Status indicator */}
      <div className="flex-shrink-0">
        {isCompleted ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-7 h-7 rounded-full bg-neon-green/20 border border-neon-green/40 flex items-center justify-center"
          >
            <CheckCircle2 className="w-4 h-4 text-neon-green" />
          </motion.div>
        ) : isLocked ? (
          <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <Lock className="w-3.5 h-3.5 text-gray-500" />
          </div>
        ) : isActive ? (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-7 h-7 rounded-full bg-neon-cyan/20 border border-neon-cyan/40 flex items-center justify-center"
          >
            <Play className="w-3.5 h-3.5 text-neon-cyan fill-neon-cyan" />
          </motion.div>
        ) : isNext ? (
          <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
            <Circle className="w-3.5 h-3.5 text-amber-400" />
          </div>
        ) : (
          <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <Circle className="w-3.5 h-3.5 text-gray-500" />
          </div>
        )}
      </div>

      {/* Lesson info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] text-gray-500 font-mono">الدرس {lesson.order}</span>
          <Badge className={`text-[9px] px-1.5 py-0 ${typeColor} border`}>
            <TypeIcon className="w-2.5 h-2.5 ml-0.5" />
            {lessonTypeLabels[lesson.type]}
          </Badge>
        </div>
        <p className={`text-sm font-medium truncate ${
          isActive ? 'text-neon-cyan' : isCompleted ? 'text-white' : 'text-gray-300'
        }`}>
          {lesson.titleAr}
        </p>
      </div>

      {/* Duration */}
      <div className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
        <Clock className="w-3 h-3" />
        <span>{lesson.duration}د</span>
      </div>
    </motion.button>
  )
}

// ─── Main Course Viewer Component ────────────────────────────

export function CourseViewerPage() {
  const {
    activeCourseId, activeLessonId, setActiveLessonId,
    courses, lessons, courseProgress, completeLesson, openCourse,
    setActivePage, showEnrollModal, setShowEnrollModal, enrollInCourse
  } = useAppStore()

  const [showSidebar, setShowSidebar] = useState(true)
  const [lessonCompleted, setLessonCompleted] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)

  // Get course data
  const course = useMemo(
    () => courses.find(c => c.id === activeCourseId),
    [courses, activeCourseId]
  )

  const courseLessons = useMemo(
    () => {
      // First try to get lessons from the store's lessons array
      const storeLessons = lessons.filter(l => l.courseId === activeCourseId).sort((a, b) => a.order - b.order)
      if (storeLessons.length > 0) return storeLessons
      // Fallback: use lessonsData from the course object
      if (course?.lessonsData && course.lessonsData.length > 0) {
        return course.lessonsData.sort((a, b) => a.order - b.order)
      }
      return []
    },
    [lessons, activeCourseId, course?.lessonsData]
  )

  const progress = useMemo(
    () => courseProgress.find(p => p.courseId === activeCourseId),
    [courseProgress, activeCourseId]
  )

  const currentLesson = useMemo(
    () => courseLessons.find(l => l.id === activeLessonId) || courseLessons[0],
    [courseLessons, activeLessonId]
  )

  const completedLessons = useMemo(
    () => progress?.completedLessons || [],
    [progress]
  )

  const isLessonCompleted = useCallback(
    (lessonId: string) => completedLessons.includes(lessonId),
    [completedLessons]
  )

  const isLessonLocked = useCallback(
    (lesson: Lesson) => {
      if (lesson.isFree) return false
      // If course is free (price === 0), all lessons are unlocked
      if (course?.price === 0) return false
      // If enrolled, all lessons unlocked
      if (progress) return false
      // If no enrollment and lesson is not free, it's locked
      return !lesson.isFree
    },
    [course, progress]
  )

  // Find next incomplete lesson
  const nextLesson = useMemo(() => {
    const nextIncomplete = courseLessons.find(
      l => !completedLessons.includes(l.id) && l.id !== currentLesson?.id
    )
    return nextIncomplete || null
  }, [courseLessons, completedLessons, currentLesson])

  const handleLessonClick = (lesson: Lesson) => {
    if (isLessonLocked(lesson)) return
    setActiveLessonId(lesson.id)
    setLessonCompleted(false)
    setShowCelebration(false)
    // Update last accessed lesson in localStorage
    if (progress && activeCourseId && typeof window !== 'undefined') {
      const updatedProgress = { ...progress, lastAccessedLessonId: lesson.id, lastAccessedAt: Date.now() }
      const state = useAppStore.getState()
      const newProgressArr = state.courseProgress.map(p =>
        p.courseId === activeCourseId ? updatedProgress : p
      )
      useAppStore.setState({ courseProgress: newProgressArr })
      localStorage.setItem('medai-progress', JSON.stringify(newProgressArr))
    }
  }

  const handleCompleteLesson = () => {
    if (!currentLesson || !activeCourseId) return
    completeLesson(activeCourseId, currentLesson.id)
    setLessonCompleted(true)
    setShowCelebration(true)
    setTimeout(() => setShowCelebration(false), 3000)
  }

  const handleNextLesson = () => {
    if (nextLesson) {
      setActiveLessonId(nextLesson.id)
      setLessonCompleted(false)
      setShowCelebration(false)
    }
  }

  const handleBackToCourses = () => {
    setActivePage('courses')
  }

  // If no course selected, show message
  if (!course || !currentLesson) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-center glass-card p-8">
          <BookOpen className="w-12 h-12 text-neon-cyan mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">لم يتم اختيار دورة</h2>
          <p className="text-muted-foreground mb-4">اختر دورة من قائمة الدورات للبدء</p>
          <Button onClick={handleBackToCourses} className="bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30">
            العودة للدورات
          </Button>
        </div>
      </div>
    )
  }

  const gradient = categoryGradients[course.category] || 'from-cyan-600/80 via-blue-500/60 to-indigo-400/40'
  const icon = categoryIcons[course.category] || '📚'
  const level = levelConfig[course.level]
  const progressPercent = progress?.progress || 0

  return (
    <div className="min-h-screen" dir="rtl">
      <div className="flex flex-col lg:flex-row gap-0 lg:gap-0">
        
        {/* ═══════════════════════════════════════════════════
            SIDEBAR - Lesson List
        ═══════════════════════════════════════════════════ */}
        
        {/* Mobile: Collapsible sidebar */}
        <div className="lg:hidden">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="w-full flex items-center justify-between p-4 glass-card border-b border-white/10"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-neon-cyan" />
              <span className="text-sm font-bold">قائمة الدروس</span>
              <Badge className="text-[10px] bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/25">
                {completedLessons.length}/{courseLessons.length}
              </Badge>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${showSidebar ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {showSidebar && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <ScrollArea className="max-h-[50vh]">
                  <div className="p-3 space-y-1.5">
                    {courseLessons.map((lesson) => (
                      <LessonItem
                        key={lesson.id}
                        lesson={lesson}
                        isActive={lesson.id === currentLesson.id}
                        isCompleted={isLessonCompleted(lesson.id)}
                        isLocked={isLessonLocked(lesson)}
                        isNext={lesson.id === nextLesson?.id}
                        onClick={() => handleLessonClick(lesson)}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Desktop: Fixed sidebar */}
        <div className="hidden lg:block w-[340px] flex-shrink-0 border-l border-white/5 bg-[#060810]/50">
          <ScrollArea className="h-screen">
            <div className="p-4">
              {/* Course header in sidebar */}
              <div className="mb-4">
                <button
                  onClick={handleBackToCourses}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-neon-cyan transition-colors mb-3"
                >
                  <ArrowRight className="w-4 h-4" />
                  العودة للدورات
                </button>
                <h2 className="text-sm font-bold text-white leading-6">{course.titleAr}</h2>
                <p className="text-xs text-muted-foreground mt-1">{course.instructor}</p>
              </div>

              {/* Progress */}
              <div className="glass-card p-3 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">تقدم الدورة</span>
                  <span className="text-xs font-bold text-neon-cyan">{progressPercent}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full rounded-full bg-gradient-to-l from-neon-cyan to-neon-purple"
                  />
                </div>
                <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
                  <span>{completedLessons.length} من {courseLessons.length} درس مكتمل</span>
                  <span>{courseLessons.length - completedLessons.length} متبقي</span>
                </div>
              </div>

              {/* Lessons list */}
              <div className="space-y-1.5">
                {courseLessons.map((lesson) => (
                  <LessonItem
                    key={lesson.id}
                    lesson={lesson}
                    isActive={lesson.id === currentLesson.id}
                    isCompleted={isLessonCompleted(lesson.id)}
                    isLocked={isLessonLocked(lesson)}
                    isNext={lesson.id === nextLesson?.id}
                    onClick={() => handleLessonClick(lesson)}
                  />
                ))}
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* ═══════════════════════════════════════════════════
            MAIN CONTENT - Lesson Display
        ═══════════════════════════════════════════════════ */}
        <div className="flex-1 min-w-0">
          <ScrollArea className="h-screen">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
              
              {/* Course banner */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`relative overflow-hidden rounded-2xl mb-8 bg-gradient-to-br ${gradient} p-6 sm:p-8`}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <div className="absolute top-4 left-8 text-6xl opacity-10 animate-float">{icon}</div>
                
                <div className="relative z-10">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <Badge className={`${level.color} border text-xs`}>{level.label}</Badge>
                    {course.isPremium && (
                      <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-xs">
                        <Crown className="w-3 h-3 ml-1" />
                        مميز
                      </Badge>
                    )}
                    {course.price === 0 && (
                      <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs">
                        مجاني
                      </Badge>
                    )}
                    <Badge className="bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/25 text-xs">
                      {completedLessons.length}/{courseLessons.length} درس
                    </Badge>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white leading-relaxed">{course.titleAr}</h1>
                  <p className="text-sm text-white/70 mt-2">{course.description}</p>
                  
                  <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-white/60">
                    <div className="flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4" />
                      <span>{course.instructor}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-yellow-400 font-semibold">{course.rating}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      <span>{(course.students / 1000).toFixed(1)}ك</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      <span>{course.duration}</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Current Lesson Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentLesson.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Lesson Header */}
                  <div className="glass-card gradient-border p-5 mb-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs text-gray-500 font-mono">الدرس {currentLesson.order} من {courseLessons.length}</span>
                          <Badge className={`text-[10px] px-1.5 py-0 ${lessonTypeColors[currentLesson.type]} border`}>
                            {React.createElement(lessonTypeIcons[currentLesson.type], { className: 'w-2.5 h-2.5 ml-0.5 inline' })}
                            {lessonTypeLabels[currentLesson.type]}
                          </Badge>
                          {isLessonCompleted(currentLesson.id) && (
                            <Badge className="text-[10px] px-1.5 py-0 bg-neon-green/15 text-neon-green border border-neon-green/25">
                              <CheckCircle2 className="w-2.5 h-2.5 ml-0.5 inline" />
                              مكتمل
                            </Badge>
                          )}
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white leading-relaxed">
                          {currentLesson.titleAr}
                        </h2>
                        <div className="flex items-center gap-3 mt-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            <span>{currentLesson.duration} دقيقة</span>
                          </div>
                          {currentLesson.isFree && (
                            <Badge className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                              مجاني
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lesson Summary Box (if exists) */}
                  {currentLesson.summary && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="glass-card p-5 mb-6 border border-neon-purple/20 bg-gradient-to-br from-neon-purple/5 to-transparent"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-neon-purple/15 flex items-center justify-center">
                          <Lightbulb className="w-4 h-4 text-neon-purple" />
                        </div>
                        <h3 className="font-bold text-neon-purple">ملخص الدرس</h3>
                      </div>
                      <p className="text-gray-300 leading-7 text-sm">{currentLesson.summary}</p>
                    </motion.div>
                  )}

                  {/* Key Points (if exists) */}
                  {currentLesson.keyPoints && currentLesson.keyPoints.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="glass-card p-5 mb-6 border border-neon-cyan/20 bg-gradient-to-br from-neon-cyan/5 to-transparent"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-neon-cyan/15 flex items-center justify-center">
                          <Target className="w-4 h-4 text-neon-cyan" />
                        </div>
                        <h3 className="font-bold text-neon-cyan">النقاط الأساسية</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {currentLesson.keyPoints.map((point, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 + i * 0.05 }}
                            className="flex items-start gap-2 p-2.5 rounded-lg bg-white/5"
                          >
                            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-neon-cyan/15 border border-neon-cyan/30 flex items-center justify-center mt-0.5">
                              <span className="text-[9px] font-bold text-neon-cyan">{i + 1}</span>
                            </div>
                            <span className="text-sm text-gray-300 leading-6">{point}</span>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Lesson Content */}
                  {currentLesson.content && currentLesson.type === 'article' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="relative mb-6"
                    >
                      {/* Decorative background glow */}
                      <div className="absolute -right-6 top-20 w-32 h-32 bg-neon-cyan/5 rounded-full blur-3xl pointer-events-none" />
                      <div className="absolute -left-6 bottom-20 w-24 h-24 bg-neon-purple/5 rounded-full blur-3xl pointer-events-none" />
                      
                      <div className="relative glass-card p-6 sm:p-8 lg:p-10">
                        {/* Reading progress indicator */}
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-neon-cyan/60" />
                            <span className="text-xs text-muted-foreground">محتوى تعليمي</span>
                          </div>
                          <div className="flex-1" />
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" />
                            <span>وقت القراءة: ~{currentLesson.duration} دقيقة</span>
                          </div>
                        </div>
                        
                        <div className="prose-content">
                          {renderContent(currentLesson.content)}
                        </div>
                        
                        {/* End of lesson decoration */}
                        <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-center gap-2">
                          <div className="w-8 h-0.5 rounded-full bg-gradient-to-l from-transparent to-neon-cyan/30" />
                          <Activity className="w-4 h-4 text-neon-cyan/30" />
                          <div className="w-8 h-0.5 rounded-full bg-gradient-to-r from-transparent to-neon-cyan/30" />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Quiz type lesson */}
                  {currentLesson.type === 'quiz' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass-card p-8 mb-6 text-center"
                    >
                      <div className="w-20 h-20 rounded-2xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center mx-auto mb-4">
                        <HelpCircle className="w-10 h-10 text-amber-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">اختبار الدورة</h3>
                      <p className="text-gray-400 mb-6">اختبر معلوماتك في ما تعلمته من هذه الدورة</p>
                      <Button
                        onClick={() => setActivePage('quizzes')}
                        className="bg-gradient-to-l from-amber-500 to-orange-500 text-white font-bold hover:shadow-[0_0_30px_rgba(245,158,11,0.3)]"
                      >
                        <HelpCircle className="w-4 h-4 ml-2" />
                        ابدأ الاختبار
                      </Button>
                    </motion.div>
                  )}

                  {/* Celebration overlay */}
                  <AnimatePresence>
                    {showCelebration && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="glass-card p-6 mb-6 border border-neon-green/30 bg-gradient-to-br from-neon-green/5 to-transparent text-center"
                      >
                        <motion.div
                          animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
                          transition={{ duration: 0.5 }}
                          className="text-4xl mb-3"
                        >
                          🎉
                        </motion.div>
                        <h3 className="text-lg font-bold text-neon-green mb-1">أحسنت! تم إكمال الدرس</h3>
                        <p className="text-sm text-gray-400">+50 XP +10 عملة</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-8">
                    {/* Complete lesson button */}
                    {!isLessonCompleted(currentLesson.id) && (
                      <Button
                        onClick={handleCompleteLesson}
                        disabled={lessonCompleted}
                        className="flex-1 bg-gradient-to-l from-neon-cyan to-cyan-400 text-med-dark font-bold h-12 hover:shadow-[0_0_30px_rgba(0,245,255,0.3)] transition-all text-base"
                      >
                        {lessonCompleted ? (
                          <>
                            <CheckCircle2 className="w-5 h-5 ml-2" />
                            تم الإكمال!
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-5 h-5 ml-2" />
                            إكمال الدرس
                          </>
                        )}
                      </Button>
                    )}

                    {/* Next lesson button */}
                    {nextLesson && (
                      <Button
                        onClick={handleNextLesson}
                        className="flex-1 bg-white/5 border border-white/10 text-white hover:bg-white/10 h-12 text-base"
                      >
                        الدرس التالي
                        <ChevronLeft className="w-5 h-5 mr-1" />
                      </Button>
                    )}

                    {/* Back to courses */}
                    <Button
                      onClick={handleBackToCourses}
                      variant="ghost"
                      className="text-muted-foreground hover:text-white h-12"
                    >
                      <ArrowRight className="w-4 h-4 ml-1" />
                      العودة للدورات
                    </Button>
                  </div>

                  {/* Quick Navigation - Previous/Next lesson pills */}
                  <div className="flex items-center justify-between gap-3 pb-8">
                    {(() => {
                      const currentIndex = courseLessons.findIndex(l => l.id === currentLesson.id)
                      const prevLesson = currentIndex > 0 ? courseLessons[currentIndex - 1] : null
                      return prevLesson ? (
                        <button
                          onClick={() => handleLessonClick(prevLesson)}
                          className="flex items-center gap-2 glass-card px-4 py-2.5 hover:bg-white/5 transition-colors"
                        >
                          <ArrowRight className="w-4 h-4 text-muted-foreground" />
                          <div className="text-right">
                            <p className="text-[10px] text-muted-foreground">الدرس السابق</p>
                            <p className="text-xs font-medium text-white">{prevLesson.titleAr}</p>
                          </div>
                        </button>
                      ) : <div />
                    })()}
                    {nextLesson && (
                      <button
                        onClick={() => handleLessonClick(nextLesson)}
                        className="flex items-center gap-2 glass-card px-4 py-2.5 hover:bg-white/5 transition-colors"
                      >
                        <div className="text-right">
                          <p className="text-[10px] text-muted-foreground">الدرس التالي</p>
                          <p className="text-xs font-medium text-white">{nextLesson.titleAr}</p>
                        </div>
                        <ChevronLeft className="w-4 h-4 text-neon-cyan" />
                      </button>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Enrollment Modal for Paid Courses */}
      <AnimatePresence>
        {showEnrollModal && course && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card p-8 max-w-md mx-4 text-center border border-yellow-500/20"
            >
              <Crown className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">هذه الدورة مميزة</h2>
              <p className="text-gray-400 mb-4">يجب الدفع للوصول لهذه الدورة</p>
              <div className="text-2xl font-bold text-neon-cyan mb-6">{course.price.toLocaleString()} ر.ي</div>
              <Button onClick={() => enrollInCourse(course.id)} className="w-full bg-gradient-to-l from-neon-cyan to-cyan-400 text-med-dark font-bold h-12">
                تسجيل والدفع
              </Button>
              <Button onClick={() => setShowEnrollModal(false)} variant="ghost" className="mt-3 text-muted-foreground">
                إلغاء
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
