'use client'

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Filter, Star, Clock, Users, BookOpen, Crown,
  ChevronLeft, ChevronRight, TrendingUp, Sparkles, Play,
  SlidersHorizontal, GraduationCap, Zap, ArrowRight,
  Lock, CreditCard, CheckCircle2, Loader2, X, Image as ImageIcon
} from 'lucide-react'
import { useAppStore, type Course, type CourseProgress } from '@/store/app-store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'

// Category gradient map
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
  emergency: '🚑',
  cardiology: '❤️',
  neurology: '🧠',
  pediatrics: '👶',
  surgery: '🔪',
  internal: '🩺',
  radiology: '🔬',
  pharmacology: '💊',
}

const categoryLabels: Record<string, string> = {
  emergency: 'طب الطوارئ',
  cardiology: 'أمراض القلب',
  neurology: 'الأعصاب',
  pediatrics: 'طب الأطفال',
  surgery: 'الجراحة',
  internal: 'الطب الباطني',
  radiology: 'الأشعة',
  pharmacology: 'الأدوية',
}

const levelConfig = {
  beginner: { label: 'مبتدئ', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  intermediate: { label: 'متوسط', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  advanced: { label: 'متقدم', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
}

const categories = [
  { id: 'all', label: 'الكل', icon: '📚' },
  // Dynamic categories will be loaded from departments
]

const sortOptions = [
  { id: 'popular', label: 'الأكثر شعبية' },
  { id: 'newest', label: 'الأحدث' },
  { id: 'rating', label: 'الأعلى تقييماً' },
  { id: 'price-low', label: 'السعر: الأقل' },
  { id: 'price-high', label: 'السعر: الأعلى' },
]

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" dir="ltr">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-3 h-3 ${
            star <= Math.floor(rating)
              ? 'fill-yellow-400 text-yellow-400'
              : star <= rating
              ? 'fill-yellow-400/50 text-yellow-400'
              : 'text-gray-600'
          }`}
        />
      ))}
      <span className="text-xs text-yellow-400 mr-1 font-semibold">{rating}</span>
    </div>
  )
}

function CourseCard({ course, index, onPaymentClick }: { course: Course; index: number; onPaymentClick?: (course: Course) => void }) {
  const { openCourse, courseProgress } = useAppStore()
  const gradient = categoryGradients[course.category] || 'from-cyan-600/80 via-blue-500/60 to-indigo-400/40'
  const icon = categoryIcons[course.category] || '📚'
  const level = levelConfig[course.level]
  const progress = courseProgress.find(p => p.courseId === course.id)
  const isEnrolled = !!progress
  const hasProgress = isEnrolled && progress.progress > 0
  const isLockedPremium = !course.isGifted && course.isPremium && course.price > 0 && !isEnrolled

  const handleClick = useCallback(() => {
    if (course.isGifted && onPaymentClick) {
      onPaymentClick(course)
    } else if (isLockedPremium && onPaymentClick) {
      onPaymentClick(course)
    } else {
      openCourse(course.id)
    }
  }, [course.isGifted, isLockedPremium, onPaymentClick, course, openCourse])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      whileHover={{ scale: 1.03, y: -4 }}
      onClick={handleClick}
      className="group relative flex-shrink-0 w-[260px] sm:w-[280px] cursor-pointer"
    >
      {/* Neon glow on hover */}
      <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-neon-cyan/0 via-neon-purple/0 to-neon-pink/0 group-hover:from-neon-cyan/40 group-hover:via-neon-purple/30 group-hover:to-neon-pink/20 rounded-2xl blur-sm transition-all duration-500" />

      <div className="relative glass-card overflow-hidden rounded-2xl">
        {/* Thumbnail area with gradient */}
        <div className={`relative h-36 bg-gradient-to-br ${gradient} overflow-hidden`}>
          {/* Animated mesh pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-2 right-4 text-4xl animate-float">{icon}</div>
            <div className="absolute bottom-2 left-4 w-16 h-16 rounded-full border border-border" />
            <div className="absolute top-8 left-12 w-8 h-8 rounded-full border border-border" />
          </div>

          {/* Level badge */}
          <div className="absolute top-3 right-3">
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${level.color}`}>
              {level.label}
            </span>
          </div>

          {/* Premium badge */}
          {course.isPremium && !course.isGifted && (
            <div className="absolute top-3 left-3">
              <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 font-medium">
                <Crown className="w-3 h-3" />
                مميز
              </span>
            </div>
          )}

          {/* Gift badge */}
          {course.isGifted && (
            <div className="absolute top-3 left-3">
              <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 font-medium">
                🎁 هدية من الإدارة
              </span>
            </div>
          )}

          {/* Lock overlay for paid courses */}
          {isLockedPremium && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-10">
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-muted/50 border border-border flex items-center justify-center">
                  <Lock className="w-6 h-6 text-muted-foreground" />
                </div>
                <span className="text-xs font-bold text-muted-foreground">{course.price.toLocaleString()} ر.ي</span>
              </div>
            </div>
          )}

          {/* Play overlay on hover - only for non-locked courses */}
          {!isLockedPremium && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/30">
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="w-12 h-12 rounded-full bg-neon-cyan/20 border border-neon-cyan/50 flex items-center justify-center backdrop-blur-sm"
              >
                <Play className="w-5 h-5 text-neon-cyan fill-neon-cyan mr-[-2px]" />
              </motion.div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-2.5">
          <h3 className="text-sm font-bold text-foreground leading-relaxed line-clamp-2 min-h-[2.5rem]">
            {course.titleAr}
          </h3>

          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-neon-cyan/30 to-neon-purple/30 flex items-center justify-center">
              <GraduationCap className="w-3 h-3 text-neon-cyan" />
            </div>
            <span className="text-xs text-muted-foreground">{course.instructor}</span>
          </div>

          <div className="flex items-center justify-between">
            <StarRating rating={course.rating} />
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="w-3 h-3" />
              <span>{(course.students / 1000).toFixed(1)}ك</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{course.duration}</span>
            </div>
            <div className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              <span>{course.lessons} درس</span>
            </div>
          </div>

          {/* Progress bar only if started */}
          {hasProgress && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neon-cyan">التقدم</span>
                <span className="text-muted-foreground">{progress.progress}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress.progress}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className="h-full rounded-full bg-gradient-to-l from-neon-cyan to-neon-purple"
                />
              </div>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center justify-between pt-1">
            {course.isGifted ? (
              <span className="text-sm font-bold text-purple-400">🎁 هدية مجانية</span>
            ) : course.price === 0 ? (
              <span className="text-sm font-bold text-emerald-400">مجاني</span>
            ) : (
              <span className="text-sm font-bold text-neon-cyan">{course.price.toLocaleString()} ر.ي</span>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                if (course.isGifted && onPaymentClick) {
                  onPaymentClick(course)
                } else if (isLockedPremium && onPaymentClick) {
                  onPaymentClick(course)
                } else {
                  openCourse(course.id)
                }
              }}
              className="h-7 text-xs text-neon-cyan hover:text-neon-cyan hover:bg-neon-cyan/10"
            >
              {course.isGifted ? '🎁 هدية' : isLockedPremium ? `${course.price.toLocaleString()} ر.ي` : hasProgress ? 'متابعة' : isEnrolled ? 'ابدأ الدورة' : (course.price === 0 ? 'ابدأ مجاناً' : `${course.price.toLocaleString()} ر.ي`)}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function HorizontalCourseRow({
  title,
  courses,
  icon,
  showProgress = false,
  onPaymentClick,
}: {
  title: string
  courses: Course[]
  icon?: React.ReactNode
  showProgress?: boolean
  onPaymentClick?: (course: Course) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 320
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  if (courses.length === 0) return null

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          {icon}
          <h2 className="text-lg font-bold text-foreground">{title}</h2>
          <Badge variant="secondary" className="text-[10px] bg-muted/30 text-muted-foreground border-0">
            {courses.length} دورة
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll('right')}
            className="w-8 h-8 rounded-full glass flex items-center justify-center hover:bg-neon-cyan/10 transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-neon-cyan" />
          </button>
          <button
            onClick={() => scroll('left')}
            className="w-8 h-8 rounded-full glass flex items-center justify-center hover:bg-neon-cyan/10 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-neon-cyan" />
          </button>
        </div>
      </div>

      {/* Horizontal Scroll Row */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto no-scrollbar pb-2"
        dir="rtl"
      >
        {courses.map((course, i) => (
          <CourseCard key={course.id} course={course} index={i} onPaymentClick={onPaymentClick} />
        ))}
      </div>
    </div>
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

// ─── Payment Modal ──────────────────────────────────────────
function PaymentModal({ course, onClose }: { course: Course; onClose: () => void }) {
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

  // Fetch payment methods on mount
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
    } catch (err) {
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
              شراء الدورة
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
          /* Success state */
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

// ─── Gift Celebration Modal ────────────────────────────────
function GiftCelebrationModal({ course, onClose }: { course: Course; onClose: () => void }) {
  const [phase, setPhase] = useState<'fireworks' | 'reveal' | 'ready'>('fireworks')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('reveal'), 1200)
    const t2 = setTimeout(() => setPhase('ready'), 2800)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  const particles = useMemo(() => {
    return Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: 50 + (Math.random() - 0.5) * 80,
      y: 50 + (Math.random() - 0.5) * 80,
      size: Math.random() * 6 + 2,
      color: ['#a855f7', '#ec4899', '#f59e0b', '#06b6d4', '#10b981', '#f43f5e'][i % 6],
      delay: Math.random() * 0.8,
      duration: Math.random() * 1 + 1.2,
    }))
  }, [])

  const giftDate = course.giftedAt ? new Date(course.giftedAt) : null
  const dateStr = giftDate ? giftDate.toLocaleDateString('ar-YE', { year: 'numeric', month: 'long', day: 'numeric' }) : ''

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      dir="rtl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="absolute inset-0 bg-black/80"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />

      {phase === 'fireworks' && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute rounded-full"
              style={{
                left: '50%', top: '50%',
                width: p.size, height: p.size,
                backgroundColor: p.color,
                boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
              }}
              initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
              animate={{
                x: (p.x - 50) * 4, y: (p.y - 50) * 4,
                scale: [0, 1.5, 0], opacity: [1, 1, 0],
              }}
              transition={{ duration: p.duration, delay: p.delay, ease: 'easeOut' }}
            />
          ))}
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.6) 0%, transparent 70%)' }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: [0, 3, 5], opacity: [1, 0.5, 0] }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2"
              style={{ borderColor: ['#a855f7', '#ec4899', '#06b6d4'][i] }}
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: [0, 30, 50], opacity: [1, 0.4, 0] }}
              transition={{ duration: 1.8, delay: i * 0.15, ease: 'easeOut' }}
            />
          ))}
        </div>
      )}

      <motion.div
        className="relative z-10 w-full max-w-md mx-4"
        initial={{ scale: 0.3, opacity: 0, y: 40 }}
        animate={{
          scale: phase === 'fireworks' ? 0.3 : 1,
          opacity: phase === 'fireworks' ? 0 : 1,
          y: phase === 'fireworks' ? 40 : 0,
        }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      >
        <div className="relative overflow-hidden rounded-3xl border border-purple-500/30" style={{
          background: 'linear-gradient(135deg, rgba(88,28,135,0.4) 0%, rgba(30,20,60,0.95) 30%, rgba(20,15,40,0.98) 100%)',
        }}>
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {phase !== 'fireworks' && Array.from({ length: 20 }, (_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-purple-300/50"
                style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
                animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
                transition={{ duration: Math.random() * 2 + 1, repeat: Infinity, delay: Math.random() * 2 }}
              />
            ))}
          </div>

          <div className="h-1 w-full bg-gradient-to-l from-purple-500 via-pink-500 to-cyan-500" />

          <div className="p-8 text-center space-y-6">
            <motion.div
              className="relative inline-block"
              initial={{ scale: 0, rotate: -30 }}
              animate={{
                scale: phase === 'ready' ? [1, 1.15, 1] : 1,
                rotate: phase === 'ready' ? [0, 5, -5, 0] : 0,
              }}
              transition={{ duration: 0.6 }}
            >
              <div className="text-7xl">🎁</div>
              <motion.div
                className="absolute inset-0 -m-4 rounded-full border-2 border-purple-400/30"
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <motion.div
                className="absolute inset-0 -m-8 rounded-full border border-pink-400/20"
                animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: phase === 'fireworks' ? 0 : 1, y: phase === 'fireworks' ? 10 : 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-2xl font-black bg-gradient-to-r from-purple-300 via-pink-300 to-cyan-300 bg-clip-text text-transparent mb-2">
                🎊 هدية خاصة من الإدارة! 🎊
              </h2>
              <p className="text-purple-200/70 text-sm">لقد حصلت على هذه الدورة كهدية مجانية</p>
            </motion.div>

            <motion.div
              className="relative rounded-2xl p-4 text-right"
              style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(236,72,153,0.1) 100%)' }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: phase === 'fireworks' ? 0 : 1, scale: phase === 'fireworks' ? 0.9 : 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-l from-purple-500/50 via-pink-500/50 to-cyan-500/50" />
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-2xl shrink-0">🎁</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground text-base leading-relaxed">{course.titleAr}</h3>
                  {dateStr && (
                    <p className="text-xs text-purple-300/60 mt-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      أُهديت في {dateStr}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium">🎁 هدية من الإدارة</span>
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-neon-green/20 text-neon-green border border-neon-green/30 font-medium">✅ مفتوحة بالكامل</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: phase === 'ready' ? 1 : 0, y: phase === 'ready' ? 0 : 10 }}
              transition={{ delay: 0.2 }}
            >
              <button
                onClick={onClose}
                className="w-full h-12 rounded-xl bg-gradient-to-l from-purple-500 via-pink-500 to-cyan-500 text-white font-bold text-base hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all active:scale-[0.98]"
              >
                🚀 ابدأ الدورة الآن
              </button>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {phase !== 'fireworks' && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 12 }, (_, i) => (
            <motion.div
              key={`side-${i}`}
              className="absolute rounded-full"
              style={{
                left: `${10 + Math.random() * 80}%`,
                top: `${10 + Math.random() * 80}%`,
                width: Math.random() * 4 + 2,
                height: Math.random() * 4 + 2,
                backgroundColor: ['#a855f7', '#ec4899', '#06b6d4'][i % 3],
              }}
              animate={{ y: [0, -30, -60], opacity: [0, 1, 0], scale: [0, 1, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.3, ease: 'easeOut' }}
            />
          ))}
        </div>
      )}
    </motion.div>
  )
}

export function CoursesPage() {
  const { courses, searchQuery, setSearchQuery, openCourse, courseProgress } = useAppStore()
  const [activeCategory, setActiveCategory] = useState('all')
  const [activeLevel, setActiveLevel] = useState<string>('all')
  const [sortBy, setSortBy] = useState('popular')
  const [showFilters, setShowFilters] = useState(false)
  const [paymentCourse, setPaymentCourse] = useState<Course | null>(null)
  const [giftCelebrationCourse, setGiftCelebrationCourse] = useState<Course | null>(null)
  const [departments, setDepartments] = useState<any[]>([])

  const handlePaymentClick = useCallback((course: Course) => {
    if (course.isGifted) {
      setGiftCelebrationCourse(course)
    } else {
      setPaymentCourse(course)
    }
  }, [])

  // Fetch departments
  useEffect(() => {
    fetch('/api/departments')
      .then(r => r.json())
      .then(data => { if (data.success) setDepartments(data.departments || []) })
      .catch(() => {})
  }, [])

  // Load courses INSTANTLY from localStorage cache (synchronous - zero delay)
  useEffect(() => {
    import('@/lib/fetch-cache').then(({ loadCoursesFromCache, fetchCoursesWithCache }) => {
      // Load from cache first (instant)
      loadCoursesFromCache()
      // Then refresh from API in background
      fetchCoursesWithCache()
    })
  }, [])

  // Filter and sort courses
  const filteredCourses = useMemo(() => {
    let result = [...courses]

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (c) =>
          c.titleAr.toLowerCase().includes(q) ||
          c.instructor.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q))
      )
    }

    // Category/Department filter
    if (activeCategory !== 'all') {
      result = result.filter((c) => c.departmentId === activeCategory)
    }

    // Level filter
    if (activeLevel !== 'all') {
      result = result.filter((c) => c.level === activeLevel)
    }

    // Sort
    switch (sortBy) {
      case 'popular':
        result.sort((a, b) => b.students - a.students)
        break
      case 'rating':
        result.sort((a, b) => b.rating - a.rating)
        break
      case 'price-low':
        result.sort((a, b) => a.price - b.price)
        break
      case 'price-high':
        result.sort((a, b) => b.price - a.price)
        break
    }

    return result
  }, [courses, searchQuery, activeCategory, activeLevel, sortBy])

  // Categorized courses
  const recommendedCourses = useMemo(
    () => courses.filter((c) => c.recommended === true),
    [courses]
  )
  const continueLearning = useMemo(
    () => {
      const enrolledIds = courseProgress.map(p => p.courseId)
      return courses.filter((c) => enrolledIds.includes(c.id) && (courseProgress.find(p => p.courseId === c.id)?.progress ?? 0) > 0)
    },
    [courses, courseProgress]
  )
  const recentCourses = useMemo(
    () => {
      const threeDaysAgo = new Date()
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
      return courses.filter((c) => {
        if (!c.createdAt) return false
        const created = new Date(c.createdAt)
        return created >= threeDaysAgo
      })
    },
    [courses]
  )
  const coursesWithoutDepartment = useMemo(
    () => courses.filter((c) => !c.departmentId),
    [courses]
  )
  const trendingCourses = useMemo(
    () => [...courses].sort((a, b) => b.students - a.students),
    [courses]
  )
  const featuredCourse = useMemo(
    () => recommendedCourses[0] || courses[0] || null,
    [courses, recommendedCourses]
  )

  // Show skeleton only on first-ever visit (no cache)
  if (courses.length === 0) {
    return (
      <div className="min-h-screen pb-8" dir="rtl">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Search skeleton */}
          <div className="space-y-4">
            <div className="h-12 rounded-xl bg-muted/20 animate-pulse" />
          </div>
          {/* Category skeleton */}
          <div className="flex gap-2 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-8 w-20 rounded-full bg-muted/20 animate-pulse flex-shrink-0" />
            ))}
          </div>
          {/* Course cards skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="glass-card overflow-hidden rounded-2xl">
                <div className="h-36 bg-muted/20 animate-pulse" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-muted/20 rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-muted/20 rounded animate-pulse w-1/2" />
                  <div className="h-3 bg-muted/20 rounded animate-pulse w-1/3" />
                  <div className="flex justify-between items-center pt-2">
                    <div className="h-5 w-16 bg-muted/20 rounded animate-pulse" />
                    <div className="h-7 w-16 bg-muted/20 rounded-lg animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-8" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Search & Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-neon-cyan/20 via-neon-purple/20 to-neon-pink/20 blur-xl opacity-30" />
            <div className="relative flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neon-cyan/60" />
                <input
                  type="text"
                  placeholder="ابحث عن دورة، مدرب، أو موضوع..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-12 pr-12 pl-4 rounded-xl bg-med-card/80 border border-neon-cyan/20 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/20 transition-all backdrop-blur-md"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`h-12 px-4 rounded-xl flex items-center gap-2 transition-all ${
                  showFilters
                    ? 'bg-neon-cyan/20 border border-neon-cyan/40 text-neon-cyan'
                    : 'glass text-muted-foreground hover:text-neon-cyan hover:border-neon-cyan/20'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="text-sm">تصفية</span>
              </button>
            </div>
          </div>

          {/* Category Filter Pills - Dynamic from departments */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveCategory('all')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeCategory === 'all'
                  ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40 shadow-[0_0_15px_rgba(0,245,255,0.15)]'
                  : 'glass text-muted-foreground hover:text-foreground hover:border-neon-cyan/20'
              }`}
            >
              <span>📚</span>
              <span>الكل</span>
            </motion.button>
            {departments.map((dept) => (
              <motion.button
                key={dept._id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveCategory(dept._id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeCategory === dept._id
                    ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40 shadow-[0_0_15px_rgba(0,245,255,0.15)]'
                    : 'glass text-muted-foreground hover:text-foreground hover:border-neon-cyan/20'
                }`}
              >
                <span>{dept.icon}</span>
                <span>{dept.nameAr}</span>
              </motion.button>
            ))}
          </div>

          {/* Extended Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="glass rounded-xl p-4 space-y-4">
                  <div className="flex flex-wrap items-center gap-4">
                    {/* Level Filter */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">المستوى:</span>
                      {(['all', 'beginner', 'intermediate', 'advanced'] as const).map((level) => (
                        <button
                          key={level}
                          onClick={() => setActiveLevel(level)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                            activeLevel === level
                              ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30'
                              : 'text-muted-foreground hover:text-foreground border border-transparent hover:border-border'
                          }`}
                        >
                          {level === 'all' ? 'الكل' : levelConfig[level].label}
                        </button>
                      ))}
                    </div>

                    {/* Sort Dropdown */}
                    <div className="flex items-center gap-2 mr-auto">
                      <span className="text-xs text-muted-foreground">ترتيب:</span>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="bg-med-card/80 border border-neon-cyan/15 rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-neon-cyan/40 appearance-none cursor-pointer"
                      >
                        {sortOptions.map((opt) => (
                          <option key={opt.id} value={opt.id} className="bg-med-dark">
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Featured Course Banner */}
        {featuredCourse && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative overflow-hidden rounded-2xl"
        >
          <div className="absolute inset-0">
            <div className={`absolute inset-0 bg-gradient-to-br ${categoryGradients[featuredCourse?.category || 'general'] || 'from-cyan-600/80 via-blue-500/60 to-indigo-400/40'}`} />
            <div className="absolute inset-0 bg-gradient-to-t from-med-dark via-med-dark/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-l from-transparent to-med-dark/80" />
            {/* Animated background elements */}
            <div className="absolute top-6 left-10 w-24 h-24 rounded-full border border-border animate-float" />
            <div className="absolute bottom-10 right-20 w-16 h-16 rounded-full border border-border animate-float" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 left-1/3 text-6xl opacity-10 animate-float" style={{ animationDelay: '2s' }}>
              {categoryIcons[featuredCourse?.category || 'general'] || '📚'}
            </div>
          </div>

          <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row items-start gap-6">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2">
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
                  <Sparkles className="w-3 h-3 ml-1" />
                  موصى بها
                </Badge>
                {featuredCourse.isPremium && !featuredCourse.isGifted && (
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                    <TrendingUp className="w-3 h-3 ml-1" />
                    مميز
                  </Badge>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-foreground neon-text">
                {featuredCourse.titleAr}
              </h1>

              <p className="text-sm text-gray-300 max-w-lg leading-relaxed">
                {featuredCourse.description}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-neon-cyan" />
                  <span>{featuredCourse.instructor}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-yellow-400 font-semibold">{featuredCourse.rating}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  <span>{(featuredCourse.students / 1000).toFixed(1)}ك طالب</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>{featuredCourse.duration}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  <span>{featuredCourse.lessons} درس</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  onClick={() => {
                    const isPremiumLocked = !featuredCourse.isGifted && featuredCourse.isPremium && featuredCourse.price > 0 && !courseProgress.find(p => p.courseId === featuredCourse.id)
                    if (featuredCourse.isGifted) {
                      setGiftCelebrationCourse(featuredCourse)
                    } else if (isPremiumLocked) { setPaymentCourse(featuredCourse) } else { openCourse(featuredCourse.id) }
                  }}
                  className="bg-gradient-to-l from-neon-cyan to-cyan-400 text-med-dark font-bold hover:shadow-[0_0_30px_rgba(0,245,255,0.3)] transition-all"
                >
                  <Play className="w-4 h-4 ml-2 fill-med-dark" />
                  ابدأ الآن
                </Button>
                <Button
                  onClick={() => {
                    if (featuredCourse.isGifted) {
                      setGiftCelebrationCourse(featuredCourse)
                    } else {
                      openCourse(featuredCourse.id)
                    }
                  }}
                  variant="ghost"
                  className="text-foreground border border-border hover:bg-muted/30"
                >
                  <Zap className="w-4 h-4 ml-2" />
                  نظرة سريعة
                </Button>
              </div>
            </div>

            {/* Featured card visual */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="hidden sm:flex flex-col items-center justify-center w-48 h-36 glass rounded-2xl p-4"
            >
              <div className="text-5xl mb-2">{categoryIcons[featuredCourse?.category || 'general'] || '📚'}</div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-emerald-400">متاح الآن</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
        )}

        {/* Continue Learning Section */}
        {continueLearning.length > 0 && (
          <HorizontalCourseRow
            title="واصل التعلم 📖"
            courses={continueLearning}
            icon={
              <div className="w-8 h-8 rounded-lg bg-neon-cyan/10 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-neon-cyan" />
              </div>
            }
            showProgress
            onPaymentClick={handlePaymentClick}
          />
        )}

        {/* Category Rows (Netflix style) */}
        {searchQuery || activeCategory !== 'all' || activeLevel !== 'all' ? (
          /* Show filtered results */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">
                نتائج البحث
                <span className="text-sm text-muted-foreground font-normal mr-2">
                  ({filteredCourses.length} دورة)
                </span>
              </h2>
            </div>
            {filteredCourses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredCourses.map((course, i) => (
                  <CourseCard key={course.id} course={course} index={i} onPaymentClick={handlePaymentClick} />
                ))}
              </div>
            ) : (
              <div className="glass rounded-2xl p-12 text-center">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-bold text-foreground mb-2">لا توجد نتائج</h3>
                <p className="text-sm text-muted-foreground">
                  جرّب البحث بكلمات مختلفة أو غيّر التصفية
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Netflix-style category rows with departments */
          <div className="space-y-10">
            {/* Recommended Section */}
            {recommendedCourses.length > 0 && (
              <HorizontalCourseRow
                title="موصى بها ✨"
                courses={recommendedCourses}
                icon={
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                  </div>
                }
                onPaymentClick={handlePaymentClick}
              />
            )}

            {/* Per-department sections */}
            {departments.map((dept) => {
              const deptCourses = courses.filter((c) => c.departmentId === dept._id)
              const freeDeptCourses = deptCourses.filter((c) => c.price === 0)
              const paidDeptCourses = deptCourses.filter((c) => c.price > 0)

              if (deptCourses.length === 0) return null

              return (
                <div key={dept._id} className="space-y-4">
                  {freeDeptCourses.length > 0 && (
                    <HorizontalCourseRow
                      title={`${dept.icon} ${dept.nameAr} - مجاني`}
                      courses={freeDeptCourses}
                      icon={
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: dept.color + '20' }}>
                          <span className="text-base">{dept.icon}</span>
                        </div>
                      }
                      onPaymentClick={handlePaymentClick}
                    />
                  )}
                  {paidDeptCourses.length > 0 && (
                    <HorizontalCourseRow
                      title={`${dept.icon} ${dept.nameAr} - مدفوع`}
                      courses={paidDeptCourses}
                      icon={
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: dept.color + '20' }}>
                          <span className="text-base">{dept.icon}</span>
                        </div>
                      }
                      onPaymentClick={handlePaymentClick}
                    />
                  )}
                </div>
              )
            })}

            {/* Recent courses */}
            {recentCourses.length > 0 && (
              <HorizontalCourseRow
                title="حديثاً ✨"
                courses={recentCourses}
                icon={
                  <div className="w-8 h-8 rounded-lg bg-neon-purple/10 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-neon-purple" />
                  </div>
                }
                onPaymentClick={handlePaymentClick}
              />
            )}

            {/* Courses without department */}
            {coursesWithoutDepartment.length > 0 && (
              <HorizontalCourseRow
                title="أخرى 📚"
                courses={coursesWithoutDepartment}
                icon={
                  <div className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                  </div>
                }
                onPaymentClick={handlePaymentClick}
              />
            )}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {paymentCourse && (
          <PaymentModal
            course={paymentCourse}
            onClose={() => setPaymentCourse(null)}
          />
        )}
      </AnimatePresence>

      {/* Gift Celebration Modal */}
      <AnimatePresence>
        {giftCelebrationCourse && (
          <GiftCelebrationModal
            course={giftCelebrationCourse}
            onClose={() => {
              const gift = giftCelebrationCourse
              setGiftCelebrationCourse(null)
              openCourse(gift.id)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
