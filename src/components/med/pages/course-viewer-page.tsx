'use client'

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight, BookOpen, Clock, CheckCircle2, Circle, Lock,
  Play, FileText, HelpCircle, Activity, Zap, ChevronLeft,
  Star, Users, Crown, GraduationCap, Sparkles, Award,
  Menu, X, Brain, Target, Lightbulb, ChevronDown,
  CreditCard, Loader2, Image as ImageIcon, Wallet,
  Shield, ArrowLeft, Gift
} from 'lucide-react'
import { useAppStore, type Lesson, type Course, type LessonQuizQuestion, type LessonFlashcard, type LessonSimulationCase } from '@/store/app-store'
import { useOffline } from '@/hooks/use-offline'
import { OfflineBadge } from '@/components/med/layout/offline-indicator'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'

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

// Helper: Extract YouTube video ID from URL
function getYouTubeId(url: string): string | null {
  if (!url) return null
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

// ─── Professional Markdown Content Renderer ──────────────────

function formatInline(text: string): React.ReactNode {
  // Process bold text with medical-style highlight
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <span key={i} className="text-foreground font-bold bg-neon-cyan/8 px-1 rounded">
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
            <h3 className="text-lg font-bold text-foreground">{formatInline(line.slice(4))}</h3>
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
            <h2 className="text-xl font-bold text-foreground">{formatInline(line.slice(3))}</h2>
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
          <span className="text-foreground/80 leading-8 flex-1 text-[15px]">{formatInline(text)}</span>
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
          <div className="flex-1 px-3 py-2 rounded-lg bg-muted/20 border border-border group-hover:border-neon-cyan/15 group-hover:bg-muted/30 transition-all">
            <span className="text-foreground/80 leading-7 text-[15px]">{formatInline(text)}</span>
          </div>
        </motion.div>
      )
      continue
    }

    // Regular paragraph with improved typography
    elements.push(
      <p key={getKey()} className="text-foreground/80 leading-[2] my-3 text-[15px]">
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
          <p key={i} className="text-foreground/80 text-sm leading-7">{formatInline(line)}</p>
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
      className="my-6 overflow-x-auto rounded-xl border border-border shadow-[0_0_20px_rgba(0,245,255,0.05)]"
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
            <tr key={ri} className={`border-b border-border ${ri % 2 === 0 ? 'bg-muted/10' : ''} hover:bg-muted/20 transition-colors`}>
              {row.map((cell, ci) => (
                <td key={ci} className="px-5 py-3 text-foreground/80 text-[13px] leading-6">
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

// ─── Lesson Sidebar Item (Professional Redesign) ─────────────

function LessonItem({
  lesson,
  isActive,
  isCompleted,
  isLocked,
  isNext,
  isCached,
  totalLessons,
  onClick,
}: {
  lesson: Lesson
  isActive: boolean
  isCompleted: boolean
  isLocked: boolean
  isNext: boolean
  isCached: boolean
  totalLessons: number
  onClick: () => void
}) {
  const TypeIcon = lessonTypeIcons[lesson.type]
  const typeColor = lessonTypeColors[lesson.type]

  return (
    <motion.button
      onClick={onClick}
      className={`w-full relative text-right transition-all group ${
        isActive
          ? 'z-10'
          : ''
      }`}
      whileTap={{ scale: 0.98 }}
    >
      {/* Active background glow */}
      {isActive && (
        <motion.div
          layoutId="activeLessonGlow"
          className="absolute inset-0 rounded-xl bg-neon-cyan/8 border border-neon-cyan/25"
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      )}

      <div className="relative flex items-start gap-3 px-3 py-3">
        {/* Left: Step indicator with connecting line */}
        <div className="flex flex-col items-center flex-shrink-0 pt-0.5">
          {/* Step circle */}
          <div className="relative">
            {isCompleted ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-8 h-8 rounded-full bg-neon-green/20 border-2 border-neon-green/50 flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.2)]"
              >
                <CheckCircle2 className="w-4 h-4 text-neon-green" />
              </motion.div>
            ) : isLocked ? (
              <div className="w-8 h-8 rounded-full bg-red-500/10 border-2 border-red-500/25 flex items-center justify-center">
                <Lock className="w-3.5 h-3.5 text-red-400/70" />
              </div>
            ) : isActive ? (
              <motion.div
                animate={{ boxShadow: ['0 0 0 0 rgba(0,245,255,0.3)', '0 0 0 8px rgba(0,245,255,0)', '0 0 0 0 rgba(0,245,255,0.3)'] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-8 h-8 rounded-full bg-neon-cyan/20 border-2 border-neon-cyan/60 flex items-center justify-center"
              >
                <Play className="w-3.5 h-3.5 text-neon-cyan fill-neon-cyan mr-[-1px]" />
              </motion.div>
            ) : isNext ? (
              <div className="w-8 h-8 rounded-full bg-amber-500/15 border-2 border-amber-500/40 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-muted/30 border-2 border-border/60 flex items-center justify-center">
                <span className="text-[10px] font-bold text-muted-foreground">{lesson.order}</span>
              </div>
            )}
          </div>

          {/* Connecting line to next lesson */}
          {lesson.order < totalLessons && (
            <div className={`w-0.5 h-4 mt-1 ${
              isCompleted ? 'bg-neon-green/30' : isActive ? 'bg-neon-cyan/20' : 'bg-border/40'
            }`} />
          )}
        </div>

        {/* Right: Lesson details */}
        <div className="flex-1 min-w-0">
          {/* Top row: order + type badge */}
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-bold ${
              isActive ? 'text-neon-cyan' : isCompleted ? 'text-neon-green' : 'text-muted-foreground'
            }`}>
              الدرس {lesson.order}
            </span>
            <Badge className={`text-[9px] px-1.5 py-0 ${typeColor} border`}>
              <TypeIcon className="w-2.5 h-2.5 ml-0.5" />
              {lessonTypeLabels[lesson.type]}
            </Badge>
            {lesson.isFree && !isCompleted && (
              <Badge className="text-[9px] px-1.5 py-0 bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                مجاني
              </Badge>
            )}
            {isLocked && (
              <Badge className="text-[9px] px-1.5 py-0 bg-red-500/10 text-red-400 border border-red-500/20">
                <Lock className="w-2.5 h-2.5 ml-0.5" />
                مدفوع
              </Badge>
            )}
          </div>

          {/* Lesson title */}
          <p className={`text-[13px] font-semibold leading-relaxed line-clamp-2 ${
            isActive ? 'text-neon-cyan' : isCompleted ? 'text-foreground' : isLocked ? 'text-foreground/50' : 'text-foreground/80'
          }`}>
            {lesson.titleAr}
          </p>

          {/* Bottom row: duration + offline */}
          <div className="flex items-center gap-2 mt-1">
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Clock className="w-2.5 h-2.5" />
              {lesson.duration} دقيقة
            </span>
            {isCached && !isLocked && (
              <OfflineBadge isCached={true} />
            )}
          </div>
        </div>
      </div>
    </motion.button>
  )
}

// ─── Payment Method Type ────────────────────────────────────
interface PaymentMethod {
  _id: string
  type: string
  name: string
  accountNumber: string
  accountName: string
  instructions?: string
  active?: boolean
}

// ─── Payment Wall Overlay (Professional Paywall) ────────────
function PaymentWallOverlay({ 
  course, 
  lockedLessonCount, 
  completedFreeCount, 
  totalFreeCount,
  onSubscribe 
}: { 
  course: Course
  lockedLessonCount: number
  completedFreeCount: number
  totalFreeCount: number
  onSubscribe: () => void 
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-[60vh] flex items-center justify-center p-4"
      dir="rtl"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        className="w-full max-w-2xl"
      >
        {/* Main Card */}
        <div className="glass-card overflow-hidden border border-neon-cyan/20">
          {/* Top Gradient Banner */}
          <div className="relative bg-gradient-to-l from-neon-cyan/20 via-neon-purple/15 to-neon-cyan/10 p-8 pb-6 overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute -top-12 -left-12 w-40 h-40 bg-neon-cyan/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-neon-purple/10 rounded-full blur-3xl" />
            
            <div className="relative text-center">
              {/* Lock Icon with Pulse */}
              <motion.div
                animate={{ 
                  boxShadow: [
                    '0 0 0 0 rgba(0,245,255,0.3)', 
                    '0 0 0 20px rgba(0,245,255,0)',
                    '0 0 0 0 rgba(0,245,255,0.3)'
                  ] 
                }}
                transition={{ repeat: Infinity, duration: 2.5 }}
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 border border-neon-cyan/30 flex items-center justify-center mx-auto mb-5"
              >
                <Lock className="w-9 h-9 text-neon-cyan" />
              </motion.div>
              
              <h2 className="text-2xl font-black text-foreground mb-2">
                أكملت الدروس المجانية!
              </h2>
              <p className="text-foreground/70 text-sm leading-7">
                أحسنت! لقد أكملت جميع الدروس المجانية المتاحة. لمتابعة التعلم والوصول إلى بقية الدروس، يرجى الاشتراك في الدورة.
              </p>
            </div>
          </div>
          
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3 p-5">
            <div className="text-center p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1.5" />
              <p className="text-lg font-black text-emerald-400">{completedFreeCount}</p>
              <p className="text-[10px] text-emerald-400/70">درس مجاني مكتمل</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Lock className="w-5 h-5 text-amber-400 mx-auto mb-1.5" />
              <p className="text-lg font-black text-amber-400">{lockedLessonCount}</p>
              <p className="text-[10px] text-amber-400/70">درس مدفوع مقفل</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20">
              <BookOpen className="w-5 h-5 text-neon-cyan mx-auto mb-1.5" />
              <p className="text-lg font-black text-neon-cyan">{course.lessons || (completedFreeCount + lockedLessonCount)}</p>
              <p className="text-[10px] text-neon-cyan/70">إجمالي الدروس</p>
            </div>
          </div>
          
          {/* Course Info */}
          <div className="px-5 pb-4">
            <div className="p-4 rounded-xl bg-muted/30 border border-border">
              <div className="flex items-center gap-3 mb-3">
                {course.isPremium && (
                  <div className="w-8 h-8 rounded-lg bg-yellow-500/15 flex items-center justify-center">
                    <Crown className="w-4 h-4 text-yellow-400" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-bold text-foreground text-sm">{course.titleAr}</h3>
                  <p className="text-xs text-muted-foreground">{course.instructor}</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-neon-cyan/60" />
                  <span className="text-xs text-muted-foreground">وصول مدى الحياة</span>
                </div>
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-neon-cyan/60" />
                  <span className="text-2xl font-black text-neon-cyan">{course.price.toLocaleString()} <span className="text-sm font-bold">ر.ي</span></span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Benefits */}
          <div className="px-5 pb-4">
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: Play, text: 'جميع الفيديوهات التعليمية', color: 'text-blue-400' },
                { icon: FileText, text: 'المحتوى الكامل لكل درس', color: 'text-emerald-400' },
                { icon: HelpCircle, text: 'الاختبارات والتمارين', color: 'text-amber-400' },
                { icon: Award, text: 'شهادة إتمام الدورة', color: 'text-purple-400' },
              ].map((benefit, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/20"
                >
                  <benefit.icon className={`w-4 h-4 ${benefit.color} flex-shrink-0`} />
                  <span className="text-xs text-foreground/70">{benefit.text}</span>
                </motion.div>
              ))}
            </div>
          </div>
          
          {/* CTA Button */}
          <div className="p-5 pt-2">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={onSubscribe}
                className="w-full h-14 bg-gradient-to-l from-neon-cyan to-cyan-400 text-med-dark font-black text-lg hover:shadow-[0_0_40px_rgba(0,245,255,0.4)] transition-all"
              >
                <CreditCard className="w-5 h-5 ml-2" />
                اشترك الآن - {course.price.toLocaleString()} ر.ي
              </Button>
            </motion.div>
            <p className="text-center text-[11px] text-muted-foreground/60 mt-3">
              سيتم مراجعة الدفع وتفعيل الدورة خلال 24 ساعة
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Pending Payment Overlay ───────────────────────────────
function PendingPaymentOverlay({ course }: { course: Course }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-[60vh] flex items-center justify-center p-4"
      dir="rtl"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        className="w-full max-w-lg"
      >
        <div className="glass-card overflow-hidden border border-amber-500/20">
          {/* Top Gradient Banner */}
          <div className="relative bg-gradient-to-l from-amber-500/15 via-orange-500/10 to-amber-500/5 p-8 pb-6 overflow-hidden">
            <div className="absolute -top-12 -left-12 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl" />
            <div className="relative text-center">
              {/* Clock Icon with Pulse */}
              <motion.div
                animate={{ 
                  boxShadow: [
                    '0 0 0 0 rgba(245,158,11,0.3)', 
                    '0 0 0 20px rgba(245,158,11,0)',
                    '0 0 0 0 rgba(245,158,11,0.3)'
                  ] 
                }}
                transition={{ repeat: Infinity, duration: 2.5 }}
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center mx-auto mb-5"
              >
                <Clock className="w-9 h-9 text-amber-400" />
              </motion.div>
              
              <h2 className="text-2xl font-black text-foreground mb-2">
                طلب الدفع قيد المراجعة
              </h2>
              <p className="text-foreground/70 text-sm leading-7">
                تم استلام طلب الدفع الخاص بك وهو حالياً قيد المراجعة من قبل الإدارة. سيتم تفعيل الدورة بعد الموافقة على الدفع.
              </p>
            </div>
          </div>
          
          {/* Course Info */}
          <div className="p-5">
            <div className="p-4 rounded-xl bg-muted/30 border border-border">
              <div className="flex items-center gap-3">
                {course.isPremium && (
                  <div className="w-8 h-8 rounded-lg bg-yellow-500/15 flex items-center justify-center">
                    <Crown className="w-4 h-4 text-yellow-400" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-bold text-foreground text-sm">{course.titleAr}</h3>
                  <p className="text-xs text-muted-foreground">{course.instructor}</p>
                </div>
                <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/25 text-[10px]">
                  <Clock className="w-2.5 h-2.5 ml-1" />
                  قيد المراجعة
                </Badge>
              </div>
            </div>
            
            {/* Timeline */}
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-neon-green/20 border border-neon-green/30 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-neon-green" />
                </div>
                <span className="text-sm text-foreground/80">تم إرسال طلب الدفع</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                  <motion.div
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="w-2.5 h-2.5 rounded-full bg-amber-400"
                  />
                </div>
                <span className="text-sm text-amber-400 font-medium">في انتظار مراجعة الإدارة</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-muted/30 border border-border flex items-center justify-center flex-shrink-0">
                  <Lock className="w-3 h-3 text-muted-foreground" />
                </div>
                <span className="text-sm text-muted-foreground">تفعيل الدورة بعد الموافقة</span>
              </div>
            </div>
            
            <p className="text-center text-[11px] text-muted-foreground/60 mt-5">
              عادةً ما تتم المراجعة خلال 24 ساعة. ستصل إليك إشعار بعد تفعيل الدورة.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── In-Course Payment Modal ────────────────────────────────
function InCoursePaymentModal({ course, onClose }: { course: Course; onClose: () => void }) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const copyToClipboard = async (text: string, fieldId: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
      } else {
        throw new Error('clipboard not available')
      }
    } catch {
      try {
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.setAttribute('readonly', '')
        textArea.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        const success = document.execCommand('copy')
        document.body.removeChild(textArea)
        if (!success) throw new Error('execCommand failed')
      } catch {
        prompt('انسخ الرقم:', text)
        setCopiedField(fieldId)
        setTimeout(() => setCopiedField(null), 2000)
        return
      }
    }
    setCopiedField(fieldId)
    setTimeout(() => setCopiedField(null), 2000)
  }

  useEffect(() => {
    fetch('/api/payment-methods')
      .then(r => r.json())
      .then(data => {
        if (data.methods) setPaymentMethods(data.methods)
      })
      .catch(() => {})
  }, [])

  const compressImage = (file: File, maxWidth = 1200, quality = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const reader = new FileReader()
      reader.onload = (e) => {
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          }
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')!
          ctx.drawImage(img, 0, 0, width, height)
          resolve(canvas.toDataURL('image/jpeg', quality))
        }
        img.onerror = () => reject(new Error('فشل تحميل الصورة'))
        img.src = e.target?.result as string
      }
      reader.onerror = () => reject(new Error('فشل قراءة الملف'))
      reader.readAsDataURL(file)
    })
  }

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      setError('حجم الملف يتجاوز 10MB')
      return
    }
    try {
      const compressed = await compressImage(file)
      setScreenshot(compressed)
      setError('')
    } catch {
      setError('فشل معالجة الصورة')
    }
  }

  const handleSubmit = async () => {
    if (!selectedMethod || !screenshot) return
    setSubmitting(true)
    setError('')
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('medai-token') : null
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          courseId: course.id,
          amount: course.price,
          paymentMethodId: selectedMethod._id,
          screenshotUrl: screenshot,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setSuccess(true)
      } else {
        setError(data.error || 'حدث خطأ في إرسال الطلب')
      }
    } catch {
      setError('حدث خطأ في الاتصال بالخادم')
    }
    setSubmitting(false)
  }

  return (
    <motion.div
      className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      dir="rtl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Lock className="h-5 w-5 text-neon-cyan" />
              هذا الدرس مدفوع
            </h2>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-lg hover:bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 p-3 rounded-xl bg-muted/30">
            <p className="font-bold text-foreground">{course.titleAr}</p>
            <p className="text-sm text-muted-foreground mt-1">{course.instructor}</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-neon-cyan font-bold text-lg">{course.price.toLocaleString()} ر.ي</span>
              <Badge className="bg-yellow-500/15 text-yellow-400 border-yellow-500/25 text-[10px]">مدفوع</Badge>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-3">للوصول إلى هذا الدرس وباقي دروس الدورة، يرجى إتمام عملية الدفع</p>
        </div>

        {!success ? (
          <div className="p-5 space-y-5">
            {/* Payment method selection */}
            <div>
              <label className="text-sm font-medium mb-2 block text-foreground">اختر طريقة الدفع</label>
              {paymentMethods.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">لا توجد طرق دفع متاحة حالياً</p>
              ) : (
                <div className="space-y-2">
                  {paymentMethods.filter(m => m.active !== false).map(method => (
                    <button
                      key={method._id}
                      onClick={() => setSelectedMethod(method)}
                      className={`w-full p-3 rounded-xl text-right transition-all ${
                        selectedMethod?._id === method._id
                          ? 'bg-neon-cyan/10 border border-neon-cyan/30'
                          : 'bg-muted/30 border border-border hover:bg-muted/50'
                      }`}
                    >
                      <p className="font-medium text-sm text-foreground">{method.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{method.type}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected method details - Professional copyable fields */}
            {selectedMethod && (
              <div className="p-4 rounded-xl bg-neon-cyan/5 border border-neon-cyan/15 space-y-3">
                <p className="text-xs text-neon-cyan font-bold flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5" />
                  تفاصيل التحويل
                </p>
                {/* Account Number - Copyable */}
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-muted-foreground mb-0.5">رقم الحساب</p>
                    <p className="text-sm font-mono text-foreground font-bold tracking-wide select-all" dir="ltr">{selectedMethod.accountNumber}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(selectedMethod.accountNumber, 'accountNumber')}
                    className={`shrink-0 mr-2 h-8 px-3 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                      copiedField === 'accountNumber'
                        ? 'bg-neon-green/20 text-neon-green border border-neon-green/30'
                        : 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 hover:bg-neon-cyan/20'
                    }`}
                  >
                    {copiedField === 'accountNumber' ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        تم النسخ
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        نسخ
                      </>
                    )}
                  </button>
                </div>
                {/* Account Name - Copyable */}
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-muted-foreground mb-0.5">اسم الحساب</p>
                    <p className="text-sm text-foreground font-bold select-all">{selectedMethod.accountName}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(selectedMethod.accountName, 'accountName')}
                    className={`shrink-0 mr-2 h-8 px-3 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                      copiedField === 'accountName'
                        ? 'bg-neon-green/20 text-neon-green border border-neon-green/30'
                        : 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 hover:bg-neon-cyan/20'
                    }`}
                  >
                    {copiedField === 'accountName' ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        تم النسخ
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        نسخ
                      </>
                    )}
                  </button>
                </div>
                {selectedMethod.instructions && (
                  <div className="p-2.5 rounded-lg bg-muted/30 border border-border">
                    <p className="text-[10px] text-muted-foreground mb-1">التعليمات</p>
                    <p className="text-xs text-muted-foreground select-all">{selectedMethod.instructions}</p>
                  </div>
                )}
                {/* Amount to pay */}
                <div className="p-3 rounded-lg bg-gradient-to-l from-neon-cyan/10 to-neon-purple/10 border border-neon-cyan/20">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">المبلغ المطلوب تحويله</span>
                    <span className="text-lg font-black text-neon-cyan">{course.price.toLocaleString()} ر.ي</span>
                  </div>
                </div>
              </div>
            )}

            {/* Screenshot upload */}
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">لقطة شاشة التحويل *</label>
              <div className="relative">
                {screenshot ? (
                  <div className="relative rounded-xl overflow-hidden border border-neon-cyan/20">
                    <img src={screenshot} alt="screenshot" className="w-full h-48 object-cover" />
                    <button
                      onClick={() => setScreenshot(null)}
                      className="absolute top-2 left-2 h-7 w-7 rounded-full bg-red-500/80 flex items-center justify-center hover:bg-red-500 transition-colors"
                    >
                      <X className="h-3.5 w-3.5 text-white" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-36 rounded-xl border-2 border-dashed border-border hover:border-neon-cyan/30 cursor-pointer transition-colors bg-muted/10">
                    <ImageIcon className="h-8 w-8 text-muted-foreground/40 mb-2" />
                    <span className="text-xs text-muted-foreground">اضغط لرفع لقطة الشاشة</span>
                    <span className="text-[10px] text-muted-foreground/50 mt-1">PNG, JPG حتى 5MB</span>
                    <input type="file" accept="image/*" onChange={handleScreenshotUpload} className="hidden" />
                  </label>
                )}
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            {/* Submit */}
            <Button
              onClick={handleSubmit}
              disabled={!selectedMethod || !screenshot || submitting}
              className="w-full h-12 bg-gradient-to-l from-neon-cyan to-cyan-400 text-med-dark font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <CreditCard className="h-5 w-5 ml-2" />
                  إرسال طلب الدفع
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring' }}
              className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4"
            >
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </motion.div>
            <h3 className="text-lg font-bold text-foreground mb-2">تم إرسال الطلب بنجاح!</h3>
            <p className="text-sm text-muted-foreground mb-6">سيتم مراجعة الدفع وتفعيل الدورة خلال 24 ساعة</p>
            <Button
              onClick={onClose}
              className="bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/25"
            >
              حسناً
            </Button>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

// ─── Inline Quiz Lesson Component ──────────────────────────

function InlineQuizLesson({ lesson }: { lesson: Lesson }) {
  const [currentQ, setCurrentQ] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [answers, setAnswers] = useState<(number | null)[]>([])
  const [quizFinished, setQuizFinished] = useState(false)
  const questions = lesson.quizData || []

  if (questions.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative mb-6">
        <div className="glass-card overflow-hidden">
          <div className="flex items-center gap-3 p-4 pb-3 border-b border-border">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
              <HelpCircle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">اختبار الدرس</p>
              <p className="text-[10px] text-muted-foreground">اختبر فهمك لهذا الدرس</p>
            </div>
          </div>
          <div className="p-8 text-center">
            <HelpCircle className="w-12 h-12 text-amber-400/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">لم تتم إضافة أسئلة لهذا الاختبار بعد</p>
          </div>
        </div>
      </motion.div>
    )
  }

  const question = questions[currentQ]
  const correctCount = answers.filter((a, i) => a === questions[i]?.correctIndex).length
  const isAnswered = selectedAnswer !== null

  const handleSelectAnswer = (idx: number) => {
    if (isAnswered) return
    setSelectedAnswer(idx)
    const newAnswers = [...answers]
    newAnswers[currentQ] = idx
    setAnswers(newAnswers)
    setShowResult(true)
  }

  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1)
      setSelectedAnswer(null)
      setShowResult(false)
    } else {
      setQuizFinished(true)
    }
  }

  const handleRestart = () => {
    setCurrentQ(0)
    setSelectedAnswer(null)
    setShowResult(false)
    setAnswers([])
    setQuizFinished(false)
  }

  if (quizFinished) {
    const percentage = Math.round((correctCount / questions.length) * 100)
    const isPassed = percentage >= 60
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative mb-6">
        <div className="glass-card overflow-hidden">
          <div className="flex items-center gap-3 p-4 pb-3 border-b border-border">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
              <HelpCircle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">نتيجة الاختبار</p>
            </div>
          </div>
          <div className="p-6 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className={`w-24 h-24 rounded-2xl mx-auto mb-4 flex items-center justify-center ${
                isPassed ? 'bg-neon-green/15 border border-neon-green/30' : 'bg-red-500/15 border border-red-500/30'
              }`}
            >
              {isPassed ? (
                <CheckCircle2 className="w-10 h-10 text-neon-green" />
              ) : (
                <X className="w-10 h-10 text-red-400" />
              )}
            </motion.div>
            <h3 className="text-xl font-bold text-foreground mb-2">{isPassed ? 'أحسنت! نجحت في الاختبار' : 'حاول مرة أخرى'}</h3>
            <p className="text-3xl font-black mb-1" style={{ color: isPassed ? '#10b981' : '#ef4444' }}>{percentage}%</p>
            <p className="text-sm text-muted-foreground mb-4">{correctCount} من {questions.length} إجابات صحيحة</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={handleRestart} variant="outline" className="border-border text-foreground">
                إعادة الاختبار
              </Button>
            </div>
            {/* Show correct answers review */}
            <div className="mt-6 space-y-2 text-right">
              {questions.map((q, i) => {
                const isCorrect = answers[i] === q.correctIndex
                return (
                  <div key={i} className={`p-3 rounded-lg border text-sm ${isCorrect ? 'bg-neon-green/5 border-neon-green/20' : 'bg-red-500/5 border-red-500/20'}`}>
                    <div className="flex items-start gap-2">
                      {isCorrect ? <CheckCircle2 className="w-4 h-4 text-neon-green mt-0.5 flex-shrink-0" /> : <X className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />}
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{q.question}</p>
                        {!isCorrect && (
                          <p className="text-neon-green text-xs mt-1">الإجابة الصحيحة: {q.options[q.correctIndex]}</p>
                        )}
                        {q.explanation && <p className="text-muted-foreground text-xs mt-1">{q.explanation}</p>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative mb-6">
      <div className="glass-card overflow-hidden">
        {/* Quiz header */}
        <div className="flex items-center gap-3 p-4 pb-3 border-b border-border">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
            <HelpCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground">اختبار الدرس</p>
            <p className="text-[10px] text-muted-foreground">السؤال {currentQ + 1} من {questions.length}</p>
          </div>
          {/* Progress bar */}
          <div className="w-24 h-1.5 rounded-full bg-muted/30 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-l from-amber-400 to-orange-400"
              initial={{ width: 0 }}
              animate={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="p-5">
          <h3 className="text-base font-bold text-foreground mb-4 leading-relaxed">{question.question}</h3>
          <div className="space-y-2.5">
            {question.options.map((opt, idx) => {
              let optStyle = 'bg-muted/20 border-border hover:border-muted-foreground/30 hover:bg-muted/30'
              if (showResult) {
                if (idx === question.correctIndex) {
                  optStyle = 'bg-neon-green/10 border-neon-green/30'
                } else if (idx === selectedAnswer && idx !== question.correctIndex) {
                  optStyle = 'bg-red-500/10 border-red-500/30'
                } else {
                  optStyle = 'bg-muted/10 border-border/50 opacity-50'
                }
              } else if (selectedAnswer === idx) {
                optStyle = 'bg-amber-500/10 border-amber-500/30'
              }

              return (
                <motion.button
                  key={idx}
                  onClick={() => handleSelectAnswer(idx)}
                  disabled={isAnswered}
                  className={`w-full text-right p-3.5 rounded-xl border transition-all flex items-center gap-3 ${optStyle}`}
                  whileTap={!isAnswered ? { scale: 0.98 } : {}}
                >
                  <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                    showResult && idx === question.correctIndex
                      ? 'border-neon-green bg-neon-green/20 text-neon-green'
                      : showResult && idx === selectedAnswer && idx !== question.correctIndex
                        ? 'border-red-400 bg-red-400/20 text-red-400'
                        : 'border-border text-muted-foreground'
                  }`}>
                    {showResult && idx === question.correctIndex ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : showResult && idx === selectedAnswer && idx !== question.correctIndex ? (
                      <X className="w-3.5 h-3.5" />
                    ) : (
                      String.fromCharCode(1571 + idx)
                    )}
                  </div>
                  <span className="text-sm text-foreground/90 flex-1">{opt}</span>
                </motion.button>
              )
            })}
          </div>

          {/* Explanation */}
          {showResult && question.explanation && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 rounded-lg bg-neon-cyan/5 border border-neon-cyan/15"
            >
              <p className="text-xs text-neon-cyan font-bold mb-1">الشرح:</p>
              <p className="text-sm text-foreground/80">{question.explanation}</p>
            </motion.div>
          )}

          {/* Next button */}
          {showResult && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 flex justify-end">
              <Button onClick={handleNext} className="bg-gradient-to-l from-amber-500 to-orange-500 text-white font-bold">
                {currentQ < questions.length - 1 ? (
                  <>{'السؤال التالي'} <ArrowRight className="w-4 h-4 mr-1" /></>
                ) : (
                  <>{'عرض النتيجة'} <CheckCircle2 className="w-4 h-4 mr-1" /></>
                )}
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Inline Flashcard Lesson Component ─────────────────────

function InlineFlashcardLesson({ lesson }: { lesson: Lesson }) {
  const [currentCard, setCurrentCard] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [knownCards, setKnownCards] = useState<Set<number>>(new Set())
  const [unknownCards, setUnknownCards] = useState<Set<number>>(new Set())
  const [reviewDone, setReviewDone] = useState(false)
  const cards = lesson.flashcardData || []

  if (cards.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative mb-6">
        <div className="glass-card overflow-hidden">
          <div className="flex items-center gap-3 p-4 pb-3 border-b border-border">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center">
              <Brain className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">بطاقات تعليمية</p>
              <p className="text-[10px] text-muted-foreground">مراجعة سريعة للمعلومات الرئيسية</p>
            </div>
          </div>
          <div className="p-8 text-center">
            <Brain className="w-12 h-12 text-cyan-400/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">لم تتم إضافة بطاقات لهذا الدرس بعد</p>
          </div>
        </div>
      </motion.div>
    )
  }

  const card = cards[currentCard]

  const handleKnown = () => {
    setKnownCards(new Set([...knownCards, currentCard]))
    goNext()
  }

  const handleUnknown = () => {
    setUnknownCards(new Set([...unknownCards, currentCard]))
    goNext()
  }

  const goNext = () => {
    if (currentCard < cards.length - 1) {
      setCurrentCard(currentCard + 1)
      setIsFlipped(false)
    } else {
      setReviewDone(true)
    }
  }

  const handleRestart = () => {
    setCurrentCard(0)
    setIsFlipped(false)
    setKnownCards(new Set())
    setUnknownCards(new Set())
    setReviewDone(false)
  }

  if (reviewDone) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative mb-6">
        <div className="glass-card overflow-hidden">
          <div className="flex items-center gap-3 p-4 pb-3 border-b border-border">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center">
              <Brain className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-sm font-bold text-foreground">نتيجة المراجعة</p>
          </div>
          <div className="p-6 text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}
              className="w-20 h-20 rounded-2xl bg-neon-green/15 border border-neon-green/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-neon-green" />
            </motion.div>
            <h3 className="text-lg font-bold text-foreground mb-2">أحسنت! أكملت المراجعة</h3>
            <div className="flex justify-center gap-6 mb-4">
              <div className="text-center">
                <p className="text-2xl font-black text-neon-green">{knownCards.size}</p>
                <p className="text-xs text-muted-foreground">أعرفها</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-amber-400">{unknownCards.size}</p>
                <p className="text-xs text-muted-foreground">تحتاج مراجعة</p>
              </div>
            </div>
            <Button onClick={handleRestart} variant="outline" className="border-border text-foreground">
              إعادة المراجعة
            </Button>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative mb-6">
      <div className="glass-card overflow-hidden">
        {/* Flashcard header */}
        <div className="flex items-center gap-3 p-4 pb-3 border-b border-border">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center">
            <Brain className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground">بطاقات تعليمية</p>
            <p className="text-[10px] text-muted-foreground">البطاقة {currentCard + 1} من {cards.length}</p>
          </div>
          <div className="w-24 h-1.5 rounded-full bg-muted/30 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-l from-cyan-400 to-teal-400"
              initial={{ width: 0 }}
              animate={{ width: `${((currentCard + 1) / cards.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Flashcard */}
        <div className="p-5">
          <motion.div
            onClick={() => setIsFlipped(!isFlipped)}
            className="relative cursor-pointer min-h-[200px] perspective-1000"
            whileTap={{ scale: 0.98 }}
          >
            <motion.div
              className="w-full min-h-[200px] relative preserve-3d"
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.5, type: 'spring', stiffness: 150 }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Front */}
              <div className="absolute inset-0 backface-hidden rounded-2xl bg-gradient-to-br from-cyan-500/10 to-teal-500/5 border border-cyan-500/20 p-6 flex flex-col items-center justify-center" style={{ backfaceVisibility: 'hidden' }}>
                <Brain className="w-8 h-8 text-cyan-400/40 mb-3" />
                <p className="text-center text-lg font-bold text-foreground leading-relaxed">{card.front}</p>
                <p className="text-xs text-muted-foreground mt-3">اضغط لقلب البطاقة</p>
              </div>
              {/* Back */}
              <div className="absolute inset-0 backface-hidden rounded-2xl bg-gradient-to-br from-neon-green/10 to-emerald-500/5 border border-neon-green/20 p-6 flex flex-col items-center justify-center" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                <CheckCircle2 className="w-8 h-8 text-neon-green/40 mb-3" />
                <p className="text-center text-base text-foreground/90 leading-relaxed">{card.back}</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Action buttons */}
          <div className="flex gap-3 mt-4 justify-center">
            <Button onClick={handleUnknown}
              className="flex-1 max-w-[160px] bg-amber-500/10 text-amber-400 border border-amber-500/25 hover:bg-amber-500/20 font-bold">
              أريد مراجعتها
            </Button>
            <Button onClick={handleKnown}
              className="flex-1 max-w-[160px] bg-neon-green/10 text-neon-green border border-neon-green/25 hover:bg-neon-green/20 font-bold">
              أعرفها
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Inline Simulation Lesson Component ────────────────────

function InlineSimulationLesson({ lesson }: { lesson: Lesson }) {
  const [phase, setPhase] = useState<'intro' | 'vitals' | 'actions' | 'reveal'>('intro')
  const [selectedActions, setSelectedActions] = useState<string[]>([])
  const simData = lesson.simulationData

  if (!simData) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative mb-6">
        <div className="glass-card overflow-hidden">
          <div className="flex items-center gap-3 p-4 pb-3 border-b border-border">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center">
              <Activity className="w-4 h-4 text-purple-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">محاكاة تفاعلية</p>
              <p className="text-[10px] text-muted-foreground">تطبيق عملي للحالات الطبية</p>
            </div>
          </div>
          <div className="p-8 text-center">
            <Activity className="w-12 h-12 text-purple-400/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">لم تتم إضافة بيانات المحاكاة لهذا الدرس بعد</p>
          </div>
        </div>
      </motion.div>
    )
  }

  const toggleAction = (action: string) => {
    setSelectedActions(prev =>
      prev.includes(action) ? prev.filter(a => a !== action) : [...prev, action]
    )
  }

  const getVitalColor = (type: string, value: number | string) => {
    if (type === 'hr') {
      const v = value as number
      return v > 100 || v < 60 ? 'text-red-400' : 'text-neon-green'
    }
    if (type === 'spo2') {
      const v = value as number
      return v < 94 ? 'text-red-400' : 'text-neon-green'
    }
    if (type === 'temp') {
      const v = value as number
      return v > 38 || v < 36 ? 'text-amber-400' : 'text-neon-green'
    }
    if (type === 'rr') {
      const v = value as number
      return v > 20 || v < 12 ? 'text-amber-400' : 'text-neon-green'
    }
    return 'text-neon-green'
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative mb-6">
      <div className="glass-card overflow-hidden">
        {/* Simulation header */}
        <div className="flex items-center gap-3 p-4 pb-3 border-b border-border">
          <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center">
            <Activity className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground">محاكاة تفاعلية</p>
            <p className="text-[10px] text-muted-foreground">
              {phase === 'intro' && 'قراءة الحالة المرضية'}
              {phase === 'vitals' && 'فحص العلامات الحيوية'}
              {phase === 'actions' && 'اتخاذ الإجراءات الطبية'}
              {phase === 'reveal' && 'التشخيص والعلاج'}
            </p>
          </div>
          {/* Phase indicators */}
          <div className="flex gap-1">
            {['intro', 'vitals', 'actions', 'reveal'].map((p, i) => (
              <div key={p} className={`w-2 h-2 rounded-full transition-all ${
                ['intro', 'vitals', 'actions', 'reveal'].indexOf(phase) >= i
                  ? 'bg-purple-400' : 'bg-muted/30'
              }`} />
            ))}
          </div>
        </div>

        {/* Intro phase */}
        {phase === 'intro' && (
          <div className="p-5">
            <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/15 mb-4">
              <h3 className="text-sm font-bold text-purple-400 mb-2">الحالة المرضية</h3>
              <p className="text-foreground/80 leading-7 text-sm">{simData.patientInfo}</p>
            </div>
            {simData.symptoms.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-2">الأعراض المبلغ عنها:</p>
                <div className="flex flex-wrap gap-2">
                  {simData.symptoms.map((s, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-medium">{s}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-end">
              <Button onClick={() => setPhase('vitals')} className="bg-gradient-to-l from-purple-500 to-violet-500 text-white font-bold">
                فحص العلامات الحيوية <ArrowRight className="w-4 h-4 mr-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Vitals phase */}
        {phase === 'vitals' && (
          <div className="p-5">
            <div className="grid grid-cols-5 gap-3 mb-4">
              {[
                { label: 'النبض', value: simData.vitals.hr, unit: 'bpm', type: 'hr', icon: '❤️' },
                { label: 'الضغط', value: simData.vitals.bp, unit: 'mmHg', type: 'bp', icon: '🩸' },
                { label: 'SpO2', value: simData.vitals.spo2, unit: '%', type: 'spo2', icon: '🫁' },
                { label: 'الحرارة', value: simData.vitals.temp, unit: '°C', type: 'temp', icon: '🌡️' },
                { label: 'التنفس', value: simData.vitals.rr, unit: '/min', type: 'rr', icon: '💨' },
              ].map((v, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-3 rounded-xl bg-muted/20 border border-border text-center"
                >
                  <span className="text-lg">{v.icon}</span>
                  <p className={`text-lg font-black mt-1 ${getVitalColor(v.type, v.value)}`}>{v.value}</p>
                  <p className="text-[10px] text-muted-foreground">{v.label}</p>
                  <p className="text-[9px] text-muted-foreground/50">{v.unit}</p>
                </motion.div>
              ))}
            </div>
            <div className="flex justify-between">
              <Button onClick={() => setPhase('intro')} variant="ghost" className="text-muted-foreground">رجوع</Button>
              <Button onClick={() => setPhase('actions')} className="bg-gradient-to-l from-purple-500 to-violet-500 text-white font-bold">
                اتخاذ الإجراءات <ArrowRight className="w-4 h-4 mr-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Actions phase */}
        {phase === 'actions' && (
          <div className="p-5">
            <p className="text-sm text-muted-foreground mb-3">اختر الإجراءات المناسبة للحالة:</p>
            <div className="space-y-2 mb-4">
              {simData.actions.map((action, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => toggleAction(action)}
                  className={`w-full text-right p-3 rounded-xl border transition-all flex items-center gap-3 ${
                    selectedActions.includes(action)
                      ? 'bg-purple-500/10 border-purple-500/30'
                      : 'bg-muted/20 border-border hover:border-muted-foreground/30'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                    selectedActions.includes(action) ? 'border-purple-400 bg-purple-400/20' : 'border-border'
                  }`}>
                    {selectedActions.includes(action) && <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />}
                  </div>
                  <span className="text-sm text-foreground/90">{action}</span>
                </motion.button>
              ))}
            </div>
            <div className="flex justify-between">
              <Button onClick={() => setPhase('vitals')} variant="ghost" className="text-muted-foreground">رجوع</Button>
              <Button onClick={() => setPhase('reveal')} disabled={selectedActions.length === 0}
                className="bg-gradient-to-l from-purple-500 to-violet-500 text-white font-bold disabled:opacity-50">
                عرض التشخيص <ArrowRight className="w-4 h-4 mr-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Reveal phase */}
        {phase === 'reveal' && (
          <div className="p-5">
            <div className="p-4 rounded-xl bg-neon-green/5 border border-neon-green/20 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-neon-green" />
                <h3 className="text-sm font-bold text-neon-green">التشخيص</h3>
              </div>
              <p className="text-foreground/90 text-sm leading-7">{simData.diagnosis}</p>
            </div>
            <div className="p-4 rounded-xl bg-neon-cyan/5 border border-neon-cyan/15 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-5 h-5 text-neon-cyan" />
                <h3 className="text-sm font-bold text-neon-cyan">خطة العلاج</h3>
              </div>
              <p className="text-foreground/80 text-sm leading-7">{simData.treatment}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/20 border border-border mb-4">
              <p className="text-xs text-muted-foreground mb-1">الإجراءات التي اخترتها:</p>
              <div className="flex flex-wrap gap-1.5">
                {selectedActions.map((a, i) => (
                  <span key={i} className="px-2 py-1 rounded bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px]">{a}</span>
                ))}
              </div>
            </div>
            <div className="flex justify-between">
              <Button onClick={() => { setPhase('intro'); setSelectedActions([]) }} variant="outline" className="border-border text-foreground">
                إعادة المحاكاة
              </Button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ─── Main Course Viewer Component ────────────────────────────

export function CourseViewerPage() {
  const {
    activeCourseId, activeLessonId, setActiveLessonId,
    courses, lessons, courseProgress, completeLesson, openCourse,
    setActivePage, showEnrollModal, setShowEnrollModal, enrollInCourse,
    authToken
  } = useAppStore()

  const [showSidebar, setShowSidebar] = useState(true)
  const [lessonCompleted, setLessonCompleted] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentWallVisible, setPaymentWallVisible] = useState(false)

  // Ref for scrolling content area to top when navigating between lessons
  const contentScrollRef = useRef<HTMLDivElement>(null)

  // Smooth scroll content area to top
  const scrollToTop = useCallback(() => {
    if (contentScrollRef.current) {
      const viewport = contentScrollRef.current.querySelector('[data-slot="scroll-area-viewport"]')
      if (viewport) {
        viewport.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }
  }, [])
  
  // Offline support - disabled for now to fix crash
  // const offline = useOffline()
  const [isCurrentLessonCached, setIsCurrentLessonCached] = useState(false)
  
  // Server-side enrollment state
  const [serverEnrolled, setServerEnrolled] = useState<boolean | null>(null)
  const [serverCompletedLessons, setServerCompletedLessons] = useState<string[]>([])
  const [serverProgress, setServerProgress] = useState(0)
  const [apiLessons, setApiLessons] = useState<any[]>([])
  const [apiLoading, setApiLoading] = useState(false)
  const [hasPendingPayment, setHasPendingPayment] = useState(false)

  // Fetch enrollment data from API when course changes
  useEffect(() => {
    if (!activeCourseId) return
    
    const fetchEnrollment = async () => {
      setApiLoading(true)
      try {
        const token = authToken || (typeof window !== 'undefined' ? localStorage.getItem('medai-token') : null)
        const res = await fetch(`/api/lessons?courseId=${activeCourseId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        const data = await res.json()
        if (data.success) {
          setServerEnrolled(data.course?.isEnrolled ?? false)
          setServerCompletedLessons(data.enrollment?.completedLessons || [])
          setServerProgress(data.enrollment?.progress || 0)
          setApiLessons(data.lessons || [])
          
          // Sync local courseProgress with server data
          if (data.course?.isEnrolled && data.enrollment) {
            const currentProgress = useAppStore.getState().courseProgress
            const existingProgress = currentProgress.find(p => p.courseId === activeCourseId)
            if (!existingProgress) {
              // Create local progress entry from server data
              const newProgress = {
                courseId: activeCourseId,
                completedLessons: data.enrollment.completedLessons || [],
                lastAccessedLessonId: data.enrollment.lastAccessedLesson || null,
                progress: data.enrollment.progress || 0,
                lastAccessedAt: Date.now(),
              }
              const updatedProgress = [...currentProgress, newProgress]
              useAppStore.setState({ courseProgress: updatedProgress })
              if (typeof window !== 'undefined') {
                localStorage.setItem('medai-progress', JSON.stringify(updatedProgress))
              }
            } else if (data.enrollment.completedLessons?.length > existingProgress.completedLessons.length) {
              // Update local progress with more recent server data
              const updatedProgress = currentProgress.map(p =>
                p.courseId === activeCourseId
                  ? { ...p, completedLessons: data.enrollment.completedLessons, progress: data.enrollment.progress }
                  : p
              )
              useAppStore.setState({ courseProgress: updatedProgress })
              if (typeof window !== 'undefined') {
                localStorage.setItem('medai-progress', JSON.stringify(updatedProgress))
              }
            }
          }
          
          // Always update store lessons with API data to ensure we have the full list
          // This ensures newly added lessons by admin appear immediately
          if (data.lessons?.length > 0) {
            const currentLessons = useAppStore.getState().lessons
            const mappedLessons = data.lessons.map((l: any) => ({
              id: l.id,
              courseId: activeCourseId,
              title: l.title || '',
              titleAr: l.titleAr || '',
              type: l.type || 'article',
              duration: l.duration || 15,
              order: l.order || 1,
              isFree: l.isFree || false,
              content: l.content,
              videoUrl: l.videoUrl,
              summary: l.summary,
              keyPoints: l.keyPoints,
              quizData: l.quizData || undefined,
              flashcardData: l.flashcardData || undefined,
              simulationData: l.simulationData || undefined,
            }))
            // Always replace lessons for this course with API data (handles additions, deletions, and reordering)
            const otherLessons = currentLessons.filter(l => l.courseId !== activeCourseId)
            useAppStore.setState({ lessons: [...otherLessons, ...mappedLessons] })
          }
        }
      } catch (err) {
        console.log('Failed to fetch enrollment data, using local data')
      }
      setApiLoading(false)
    }
    
    // Also check for pending payment for this course
    const checkPendingPayment = async () => {
      try {
        const token = authToken || (typeof window !== 'undefined' ? localStorage.getItem('medai-token') : null)
        if (!token) { setHasPendingPayment(false); return }
        const res = await fetch('/api/payments', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (data.success && data.payments) {
          const hasPending = data.payments.some((p: any) => {
            const pCourseId = p.courseId?.toString() || ''
            return pCourseId === activeCourseId && p.status === 'pending'
          })
          setHasPendingPayment(hasPending)
        } else {
          setHasPendingPayment(false)
        }
      } catch {
        setHasPendingPayment(false)
      }
    }
    
    fetchEnrollment()
    checkPendingPayment()
  }, [activeCourseId, authToken])

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
    () => {
      // If user selected a specific lesson, use it
      const selected = courseLessons.find(l => l.id === activeLessonId)
      if (selected) return selected
      // Default: pick the first FREE lesson (not the first lesson overall)
      // This ensures users always land on accessible content first
      const firstFreeLesson = courseLessons.find(l => l.isFree)
      return firstFreeLesson || courseLessons[0]
    },
    [courseLessons, activeLessonId]
  )

  // Get cached lessons from store for rendering (not getState() in JSX)
  const cachedLessons = useAppStore((state) => state.cachedLessons)

  // Merge server and local completed lessons
  const completedLessons = useMemo(
    () => {
      const local = progress?.completedLessons || []
      const server = serverCompletedLessons
      // Use whichever has more data
      return server.length > local.length ? server : local
    },
    [progress, serverCompletedLessons]
  )

  const isLessonCompleted = useCallback(
    (lessonId: string) => completedLessons.includes(lessonId),
    [completedLessons]
  )

  // Check if this course is gifted (from store)
  const isCourseGifted = course?.isGifted === true

  // Use server-side enrollment for access control
  const isLessonLocked = useCallback(
    (lesson: Lesson) => {
      if (lesson.isFree) return false
      // If course is free (price === 0), all lessons are unlocked
      if (course?.price === 0) return false
      // Gifted courses have all lessons unlocked
      if (isCourseGifted) return false
      // Check server enrollment status first
      if (serverEnrolled === true) return false
      if (serverEnrolled === false) return !lesson.isFree
      // If no server data yet, check if user has local progress
      // Only unlock if the course is actually free or user is enrolled
      // Do NOT unlock paid courses just because a progress entry exists
      return !lesson.isFree
    },
    [course, serverEnrolled, isCourseGifted]
  )

  // Find the next lesson (sequential order, right after current)
  const nextLesson = useMemo(() => {
    if (!currentLesson) return null
    const currentIndex = courseLessons.findIndex(l => l.id === currentLesson.id)
    if (currentIndex === -1 || currentIndex >= courseLessons.length - 1) return null
    return courseLessons[currentIndex + 1]
  }, [courseLessons, currentLesson])

  // Check if next lesson is locked (paid)
  const isNextLessonLocked = useMemo(() => {
    if (!nextLesson) return false
    return isLessonLocked(nextLesson)
  }, [nextLesson, isLessonLocked])

  // Count free and locked lessons for payment wall
  const freeLessonCount = useMemo(() => {
    return courseLessons.filter(l => l.isFree).length
  }, [courseLessons])

  const lockedLessonCount = useMemo(() => {
    return courseLessons.filter(l => isLessonLocked(l)).length
  }, [courseLessons, isLessonLocked])

  const completedFreeCount = useMemo(() => {
    return courseLessons.filter(l => l.isFree && isLessonCompleted(l.id)).length
  }, [courseLessons, isLessonCompleted])

  const allFreeCompleted = useMemo(() => {
    const freeLessons = courseLessons.filter(l => l.isFree)
    return freeLessons.length > 0 && freeLessons.every(l => isLessonCompleted(l.id))
  }, [courseLessons, isLessonCompleted])

  // Check if current lesson is locked (should show payment wall in content area)
  const isCurrentLessonLocked = useMemo(() => {
    if (!currentLesson) return false
    return isLessonLocked(currentLesson)
  }, [currentLesson, isLessonLocked])

  // Determine if payment wall should be shown in the content area
  const shouldShowPaymentWall = useMemo(() => {
    // Show payment wall if:
    // 1. The paymentWallVisible flag is set (after completing last free lesson)
    // 2. OR the current lesson itself is locked
    // But NOT if the user is enrolled or the course is free/gifted
    if (serverEnrolled === true || course?.price === 0 || isCourseGifted) return false
    return paymentWallVisible || isCurrentLessonLocked
  }, [paymentWallVisible, isCurrentLessonLocked, serverEnrolled, course, isCourseGifted])

  // When payment wall is showing and user has a pending payment, show pending state
  const showPendingState = shouldShowPaymentWall && hasPendingPayment

  const handleLessonClick = (lesson: Lesson) => {
    if (isLessonLocked(lesson)) {
      // Show payment wall in content area instead of just the modal
      setPaymentWallVisible(true)
      setActiveLessonId(lesson.id)
      scrollToTop()
      return
    }
    // Hide payment wall when navigating to a free/unlocked lesson
    setPaymentWallVisible(false)
    setActiveLessonId(lesson.id)
    setLessonCompleted(false)
    setShowCelebration(false)
    // Scroll to top of the new lesson content
    scrollToTop()
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
    
    // Check if this was the last free lesson and next lesson is paid
    // If so, show payment wall after celebration
    if (nextLesson && isLessonLocked(nextLesson)) {
      setTimeout(() => {
        setShowCelebration(false)
        setPaymentWallVisible(true)
      }, 2000)
    } else {
      setTimeout(() => setShowCelebration(false), 3000)
    }
  }

  const handleNextLesson = () => {
    if (nextLesson) {
      if (isLessonLocked(nextLesson)) {
        // Show payment wall in content area instead of just the modal
        setPaymentWallVisible(true)
        scrollToTop()
        return
      }
      setPaymentWallVisible(false)
      setActiveLessonId(nextLesson.id)
      setLessonCompleted(false)
      setShowCelebration(false)
      // Scroll to top of the new lesson content smoothly
      scrollToTop()
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
          <h2 className="text-xl font-bold text-foreground mb-2">لم يتم اختيار دورة</h2>
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
            className="w-full flex items-center justify-between p-4 glass-card border-b border-border"
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
                <div className="p-3 space-y-0 max-h-[70vh] overflow-y-auto">
                  {courseLessons.map((lesson, index) => (
                    <LessonItem
                      key={lesson.id}
                      lesson={lesson}
                      isActive={lesson.id === currentLesson.id}
                      isCompleted={isLessonCompleted(lesson.id)}
                      isLocked={isLessonLocked(lesson)}
                      isNext={lesson.id === nextLesson?.id}
                      isCached={cachedLessons.includes(lesson.id)}
                      totalLessons={courseLessons.length}
                      onClick={() => handleLessonClick(lesson)}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Desktop: Fixed sidebar */}
        <div className="hidden lg:block w-[360px] flex-shrink-0 border-l border-border bg-sidebar/50">
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
                <h2 className="text-sm font-bold text-foreground leading-6">{course.titleAr}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">{course.instructor}</span>
                  {isCourseGifted && (
                    <Badge className="text-[9px] px-1.5 py-0 bg-purple-500/15 text-purple-400 border border-purple-500/25">🎁 هدية</Badge>
                  )}
                </div>
              </div>

              {/* Progress card - Enhanced */}
              <div className="glass-card p-3 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">تقدم الدورة</span>
                  <span className="text-xs font-bold text-neon-cyan">{progressPercent}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className={`h-full rounded-full ${
                      isCourseGifted
                        ? 'bg-gradient-to-l from-purple-500 to-pink-500'
                        : 'bg-gradient-to-l from-neon-cyan to-neon-purple'
                    }`}
                  />
                </div>
                <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
                  <span>✅ {completedLessons.length} مكتمل</span>
                  <span>📝 {courseLessons.length - completedLessons.length} متبقي</span>
                </div>
              </div>

              {/* Course Stats - Professional summary */}
              <div className="glass-card p-3 mb-4">
                <div className="grid grid-cols-3 gap-2">
                  {/* Total lessons */}
                  <div className="text-center p-2 rounded-lg bg-neon-cyan/5 border border-neon-cyan/10">
                    <div className="text-lg font-black text-neon-cyan">{courseLessons.length}</div>
                    <div className="text-[9px] text-muted-foreground">درس</div>
                  </div>
                  {/* Total duration */}
                  <div className="text-center p-2 rounded-lg bg-neon-purple/5 border border-neon-purple/10">
                    <div className="text-lg font-black text-neon-purple">
                      {courseLessons.reduce((sum, l) => sum + (l.duration || 0), 0)}
                    </div>
                    <div className="text-[9px] text-muted-foreground">دقيقة</div>
                  </div>
                  {/* Free lessons */}
                  <div className="text-center p-2 rounded-lg bg-neon-green/5 border border-neon-green/10">
                    <div className="text-lg font-black text-neon-green">
                      {courseLessons.filter(l => l.isFree).length}
                    </div>
                    <div className="text-[9px] text-muted-foreground">مجاني</div>
                  </div>
                </div>
                {/* Lesson type breakdown */}
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border flex-wrap">
                  {(() => {
                    const typeCounts: Record<string, number> = {}
                    courseLessons.forEach(l => { typeCounts[l.type] = (typeCounts[l.type] || 0) + 1 })
                    return Object.entries(typeCounts).map(([type, count]) => {
                      const TypeIcon = lessonTypeIcons[type as keyof typeof lessonTypeIcons]
                      const color = lessonTypeColors[type as keyof typeof lessonTypeColors]
                      return (
                        <span key={type} className={`text-[9px] px-1.5 py-0.5 rounded-full border ${color} flex items-center gap-0.5`}>
                          {TypeIcon && <TypeIcon className="w-2.5 h-2.5" />}
                          {count} {lessonTypeLabels[type as keyof typeof lessonTypeLabels]}
                        </span>
                      )
                    })
                  })()}
                </div>
              </div>

              {/* Section header */}
              <div className="flex items-center gap-2 mb-3 px-1">
                <div className="w-1 h-4 rounded-full bg-gradient-to-b from-neon-cyan to-neon-purple" />
                <span className="text-xs font-bold text-foreground">محتويات الدورة</span>
                <span className="text-[10px] text-muted-foreground mr-auto">{courseLessons.length} درس</span>
              </div>

              {/* Lessons list */}
              <div className="space-y-0">
                {courseLessons.map((lesson, index) => (
                  <LessonItem
                    key={lesson.id}
                    lesson={lesson}
                    isActive={lesson.id === currentLesson.id}
                    isCompleted={isLessonCompleted(lesson.id)}
                    isLocked={isLessonLocked(lesson)}
                    isNext={lesson.id === nextLesson?.id}
                    isCached={cachedLessons.includes(lesson.id)}
                    totalLessons={courseLessons.length}
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
          <ScrollArea className="h-screen" ref={contentScrollRef}>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
              
              {/* Course banner */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`relative overflow-hidden rounded-2xl mb-8 bg-gradient-to-br ${gradient} p-6 sm:p-8`}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-background/20 to-transparent" />
                <div className="absolute top-4 left-8 text-6xl opacity-10 animate-float">{icon}</div>
                
                <div className="relative z-10">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <Badge className={`${level.color} border text-xs`}>{level.label}</Badge>
                    {isCourseGifted && (
                      <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs animate-pulse">
                        🎁 هدية من الإدارة
                      </Badge>
                    )}
                    {course.isPremium && !isCourseGifted && (
                      <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-xs">
                        <Crown className="w-3 h-3 ml-1" />
                        مميز
                      </Badge>
                    )}
                    {course.price === 0 && !isCourseGifted && (
                      <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs">
                        مجاني
                      </Badge>
                    )}
                    <Badge className="bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/25 text-xs">
                      {completedLessons.length}/{courseLessons.length} درس
                    </Badge>
                  </div>
                  {/* Gift banner for gifted courses */}
                  {isCourseGifted && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className="mb-3 p-3 rounded-xl border border-purple-500/20"
                      style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.12) 0%, rgba(236,72,153,0.08) 100%)' }}
                    >
                      <div className="flex items-center gap-2">
                        <motion.span
                          className="text-xl"
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                        >🎁</motion.span>
                        <div>
                          <p className="text-sm font-bold text-purple-300">هذه الدورة مُهداة لك من الإدارة</p>
                          <p className="text-[10px] text-purple-300/60">جميع الدروس مفتوحة ومتاحة لك مجاناً</p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-neon-green/20 text-neon-green border border-neon-green/30 mr-auto">✅ مفتوحة</span>
                      </div>
                    </motion.div>
                  )}
                  <h1 className="text-2xl sm:text-3xl font-black text-foreground leading-relaxed">{course.titleAr}</h1>
                  <p className="text-sm text-foreground/70 mt-2">{course.description}</p>
                  
                  <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-foreground/60">
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

              {/* Payment Wall or Current Lesson Content */}
              <AnimatePresence mode="wait">
                {shouldShowPaymentWall ? (
                  <motion.div
                    key={showPendingState ? "pending-wall" : "payment-wall"}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                  >
                    {showPendingState ? (
                      <PendingPaymentOverlay course={course} />
                    ) : (
                      <PaymentWallOverlay
                        course={course}
                        lockedLessonCount={lockedLessonCount}
                        completedFreeCount={completedFreeCount}
                        totalFreeCount={freeLessonCount}
                        onSubscribe={() => setShowPaymentModal(true)}
                      />
                    )}
                  </motion.div>
                ) : (
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
                          <span className="text-xs text-muted-foreground font-mono">الدرس {currentLesson.order} من {courseLessons.length}</span>
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
                          {isCurrentLessonCached && (
                            <OfflineBadge isCached={true} />
                          )}
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold text-foreground leading-relaxed">
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
                            className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/50"
                          >
                            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-neon-cyan/15 border border-neon-cyan/30 flex items-center justify-center mt-0.5">
                              <span className="text-[9px] font-bold text-neon-cyan">{i + 1}</span>
                            </div>
                            <span className="text-sm text-foreground/80 leading-6">{point}</span>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Lesson Content - Article */}
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
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
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
                        <div className="mt-8 pt-4 border-t border-border flex items-center justify-center gap-2">
                          <div className="w-8 h-0.5 rounded-full bg-gradient-to-l from-transparent to-neon-cyan/30" />
                          <Activity className="w-4 h-4 text-neon-cyan/30" />
                          <div className="w-8 h-0.5 rounded-full bg-gradient-to-r from-transparent to-neon-cyan/30" />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Video type lesson */}
                  {currentLesson.type === 'video' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="relative mb-6"
                    >
                      <div className="relative glass-card overflow-hidden">
                        {/* Video header */}
                        <div className="flex items-center gap-3 p-4 pb-3 border-b border-border">
                          <div className="w-9 h-9 rounded-xl bg-red-500/15 border border-red-500/25 flex items-center justify-center">
                            <Play className="w-4 h-4 text-red-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-foreground">فيديو تعليمي</p>
                            <p className="text-[10px] text-muted-foreground">المدة: ~{currentLesson.duration} دقيقة</p>
                          </div>
                        </div>

                        {/* Video player */}
                        {currentLesson.videoUrl ? (
                          (() => {
                            const ytId = getYouTubeId(currentLesson.videoUrl)
                            return ytId ? (
                              <div className="relative w-full pt-[56.25%] bg-black/50 group/video overflow-hidden">
                                <iframe
                                  src={`https://www.youtube-nocookie.com/embed/${ytId}?rel=0&modestbranding=1&iv_load_policy=3&playsinline=1&fs=1&disablekb=1&cc_load_policy=0&annotations=0`}
                                  className="absolute inset-0 w-full h-full"
                                  allowFullScreen
                                  allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                                  style={{ border: 'none' }}
                                  title="Video player"
                                />
                                {/* Overlay to hide YouTube top bar (channel name, title) */}
                                <div className="absolute top-0 left-0 right-0 h-[55px] pointer-events-none z-10" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)' }} />
                                {/* Overlay to hide YouTube bottom-right logo */}
                                <div className="absolute bottom-[40px] right-0 w-[70px] h-[30px] pointer-events-none z-10" style={{ background: 'rgba(0,0,0,0.85)' }} />
                              </div>
                            ) : (
                              <div className="p-8 text-center">
                                <Play className="w-12 h-12 text-red-400/30 mx-auto mb-3" />
                                <a
                                  href={currentLesson.videoUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-colors text-sm font-medium"
                                >
                                  <Play className="w-4 h-4" />
                                  مشاهدة الفيديو (رابط خارجي) ↗
                                </a>
                              </div>
                            )
                          })()
                        ) : (
                          <div className="p-8 text-center">
                            <Play className="w-12 h-12 text-red-400/30 mx-auto mb-3" />
                            <p className="text-sm text-muted-foreground">لم يتم إضافة رابط الفيديو بعد</p>
                          </div>
                        )}

                        {/* Video description/content if exists */}
                        {currentLesson.content && (
                          <div className="p-4 border-t border-border">
                            <div className="prose-content">
                              {renderContent(currentLesson.content)}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Simulation type lesson */}
                  {currentLesson.type === 'simulation' && (
                    <InlineSimulationLesson lesson={currentLesson} />
                  )}

                  {/* Flashcard type lesson */}
                  {currentLesson.type === 'flashcard' && (
                    <InlineFlashcardLesson lesson={currentLesson} />
                  )}

                  {/* Quiz type lesson */}
                  {currentLesson.type === 'quiz' && (
                    <InlineQuizLesson lesson={currentLesson} />
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
                        <p className="text-sm text-muted-foreground">استمر في التقدم 💪</p>
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
                        className={`flex-1 h-12 text-base font-bold transition-all ${
                          isNextLessonLocked
                            ? 'bg-gradient-to-l from-amber-500 to-orange-500 text-white hover:shadow-[0_0_30px_rgba(245,158,11,0.3)]'
                            : 'bg-muted/50 border border-border text-foreground hover:bg-muted'
                        }`}
                      >
                        {isNextLessonLocked ? (
                          <>
                            <Lock className="w-4 h-4 ml-2" />
                            فتح الدروس المدفوعة
                          </>
                        ) : (
                          <>
                            الدرس التالي
                            <ChevronLeft className="w-5 h-5 mr-1" />
                          </>
                        )}
                      </Button>
                    )}

                    {/* Back to courses */}
                    <Button
                      onClick={handleBackToCourses}
                      variant="ghost"
                      className="text-muted-foreground hover:text-foreground h-12"
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
                          className="flex items-center gap-2 glass-card px-4 py-2.5 hover:bg-muted/50 transition-colors"
                        >
                          <ArrowRight className="w-4 h-4 text-muted-foreground" />
                          <div className="text-right">
                            <p className="text-[10px] text-muted-foreground">الدرس السابق</p>
                            <p className="text-xs font-medium text-foreground">{prevLesson.titleAr}</p>
                          </div>
                        </button>
                      ) : <div />
                    })()}
                    {nextLesson && (
                      <button
                        onClick={() => handleLessonClick(nextLesson)}
                        className={`flex items-center gap-2 px-4 py-2.5 hover:bg-muted/50 transition-colors ${
                          isNextLessonLocked
                            ? 'bg-amber-500/10 border border-amber-500/25 hover:bg-amber-500/20'
                            : 'glass-card'
                        }`}
                      >
                        <div className="text-right">
                          <p className="text-[10px] text-muted-foreground">{isNextLessonLocked ? 'درس مدفوع' : 'الدرس التالي'}</p>
                          <p className={`text-xs font-medium ${isNextLessonLocked ? 'text-amber-400' : 'text-foreground'}`}>{nextLesson.titleAr}</p>
                        </div>
                        {isNextLessonLocked ? (
                          <Lock className="w-4 h-4 text-amber-400" />
                        ) : (
                          <ChevronLeft className="w-4 h-4 text-neon-cyan" />
                        )}
                      </button>
                    )}
                  </div>
                </motion.div>
                )}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Payment Modal for Locked/Paid Lessons */}
      <AnimatePresence>
        {showPaymentModal && course && (
          <InCoursePaymentModal
            course={course}
            onClose={() => setShowPaymentModal(false)}
          />
        )}
      </AnimatePresence>

      {/* Enrollment Modal for Paid Courses (legacy - redirects to payment) */}
      <AnimatePresence>
        {showEnrollModal && course && (
          <InCoursePaymentModal
            course={course}
            onClose={() => setShowEnrollModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
