'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, BookOpen, Clock, CheckCircle, ArrowRight, Loader2, Gift, Crown, Sparkles } from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface Enrollment {
  _id: string
  courseId: string
  courseName: string
  courseNameAr?: string
  category?: string
  level?: string
  price: number
  isGifted: boolean
  giftedAt?: string | null
  subscriptionType: 'free' | 'paid' | 'gift'
  status: 'active' | 'completed' | 'expired' | 'pending'
  enrolledAt: string
  progress: number
  completedLessons: string[]
  totalLessons: number
}

// Category labels for display
const categoryLabels: Record<string, string> = {
  emergency: 'طب الطوارئ',
  cardiology: 'أمراض القلب',
  neurology: 'الأعصاب',
  pediatrics: 'طب الأطفال',
  surgery: 'الجراحة',
  internal: 'الطب الباطني',
  radiology: 'الأشعة',
  pharmacology: 'الأدوية',
  general: 'عام',
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
  general: '📚',
}

const levelLabels: Record<string, string> = {
  beginner: 'مبتدئ',
  intermediate: 'متوسط',
  advanced: 'متقدم',
}

export function MySubscriptionsPage() {
  const { user, authToken, setActivePage, setActiveCourseId } = useAppStore()
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEnrollments = async () => {
      const token = authToken || localStorage.getItem('medai-token')
      if (!token) {
        setLoading(false)
        return
      }
      try {
        const res = await fetch('/api/enrollment/progress?all=true', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (data.success && data.enrollments) {
          const mapped = data.enrollments.map((e: any) => ({
            _id: e._id || '',
            courseId: e.courseId || '',
            courseName: e.courseName || e.courseId || 'دورة',
            courseNameAr: e.courseNameAr || e.courseName || '',
            category: e.category || 'general',
            level: e.level || '',
            price: e.price || 0,
            isGifted: e.isGifted || false,
            giftedAt: e.giftedAt || null,
            subscriptionType: e.subscriptionType || 'free',
            status: e.status || 'active',
            enrolledAt: e.enrolledAt || new Date().toISOString(),
            progress: e.progress || 0,
            completedLessons: e.completedLessons || [],
            totalLessons: e.totalLessons || 0,
          }))
          setEnrollments(mapped)
        }
      } catch (err) {
        console.error('Failed to fetch enrollments:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchEnrollments()
  }, [authToken])

  const activeCount = enrollments.filter(e => e.status === 'active').length
  const completedCount = enrollments.filter(e => e.status === 'completed').length
  const giftCount = enrollments.filter(e => e.subscriptionType === 'gift').length
  const totalSpent = enrollments.filter(e => e.subscriptionType === 'paid').reduce((sum, e) => sum + e.price, 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6" dir="rtl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-green to-emerald-600 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">اشتراكاتي</h1>
            <p className="text-sm text-muted-foreground">إدارة دوراتك المشترك فيها</p>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="glass-card p-3 text-center">
          <p className="text-lg font-bold text-primary">{activeCount}</p>
          <p className="text-[10px] text-muted-foreground">نشطة</p>
        </div>
        <div className="glass-card p-3 text-center">
          <p className="text-lg font-bold text-neon-green">{completedCount}</p>
          <p className="text-[10px] text-muted-foreground">مكتملة</p>
        </div>
        <div className="glass-card p-3 text-center">
          <p className="text-lg font-bold text-purple-400">{giftCount}</p>
          <p className="text-[10px] text-muted-foreground">هدية</p>
        </div>
        <div className="glass-card p-3 text-center">
          <p className="text-lg font-bold text-neon-cyan">{totalSpent.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">ر.ي</p>
        </div>
      </div>

      {/* Enrollments List */}
      {enrollments.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-8 text-center"
        >
          <BookOpen className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground mb-2">لا توجد اشتراكات بعد</p>
          <Button
            onClick={() => setActivePage('courses')}
            variant="outline"
            className="mt-2"
          >
            تصفح الدورات
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {enrollments.map((enrollment, index) => {
            const icon = categoryIcons[enrollment.category || 'general'] || '📚'
            const catLabel = categoryLabels[enrollment.category || 'general'] || enrollment.category
            const levelLabel = levelLabels[enrollment.level || ''] || ''

            return (
              <motion.div
                key={enrollment._id || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`glass-card overflow-hidden ${
                  enrollment.isGifted
                    ? 'border border-purple-500/20'
                    : ''
                }`}
              >
                {/* Gift top glow line */}
                {enrollment.isGifted && (
                  <div className="h-1 w-full bg-gradient-to-l from-purple-500 via-pink-500 to-cyan-500" />
                )}

                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Course icon */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${
                      enrollment.isGifted
                        ? 'bg-purple-500/20 border border-purple-500/30'
                        : 'bg-neon-cyan/10 border border-neon-cyan/20'
                    }`}>
                      {enrollment.isGifted ? '🎁' : icon}
                    </div>

                    {/* Course info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-bold text-foreground text-sm leading-relaxed">
                          {enrollment.courseNameAr || enrollment.courseName}
                        </h3>
                        {/* Subscription type badge */}
                        {enrollment.subscriptionType === 'gift' ? (
                          <Badge className="bg-purple-500/15 text-purple-400 border-purple-500/30 text-[10px] shrink-0">
                            <Gift className="w-3 h-3 ml-1" />
                            هدية
                          </Badge>
                        ) : enrollment.subscriptionType === 'paid' ? (
                          <Badge className="bg-yellow-500/15 text-yellow-400 border-yellow-500/30 text-[10px] shrink-0">
                            <Crown className="w-3 h-3 ml-1" />
                            مدفوع
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] shrink-0">
                            مجاني
                          </Badge>
                        )}
                        {/* Status badge */}
                        <Badge className={
                          enrollment.status === 'active'
                            ? 'bg-neon-green/15 text-neon-green text-[10px] shrink-0'
                            : enrollment.status === 'completed'
                            ? 'bg-blue-500/15 text-blue-400 text-[10px] shrink-0'
                            : 'bg-muted text-muted-foreground text-[10px] shrink-0'
                        }>
                          {enrollment.status === 'active' ? 'نشط' : enrollment.status === 'completed' ? 'مكتمل' : 'معلق'}
                        </Badge>
                      </div>

                      {/* Category and level */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <span>{icon} {catLabel}</span>
                        {levelLabel && (
                          <>
                            <span className="text-muted-foreground/30">•</span>
                            <span>{levelLabel}</span>
                          </>
                        )}
                      </div>

                      {/* Subscription details */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(enrollment.enrolledAt).toLocaleDateString('ar-YE', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          {enrollment.completedLessons.length}/{enrollment.totalLessons} درس
                        </span>
                      </div>

                      {/* Price or gift info */}
                      {enrollment.isGifted ? (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="flex items-center gap-1 text-purple-400">
                            <Sparkles className="w-3 h-3" />
                            هدية من الإدارة
                          </span>
                          {enrollment.giftedAt && (
                            <span className="text-purple-300/50">
                              • {new Date(enrollment.giftedAt).toLocaleDateString('ar-YE', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </div>
                      ) : enrollment.price > 0 ? (
                        <div className="flex items-center gap-1 text-xs text-neon-cyan">
                          <CreditCard className="w-3 h-3" />
                          <span className="font-semibold">{enrollment.price.toLocaleString()} ر.ي</span>
                        </div>
                      ) : (
                        <div className="text-xs text-emerald-400">مجاني</div>
                      )}

                      {/* Progress bar */}
                      <div className="mt-2 w-full h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            enrollment.isGifted
                              ? 'bg-gradient-to-l from-purple-500 to-pink-500'
                              : 'bg-gradient-to-l from-primary to-neon-cyan'
                          }`}
                          style={{ width: `${enrollment.progress}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">{enrollment.progress}% مكتمل</p>
                    </div>

                    {/* Open course button */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setActiveCourseId(enrollment.courseId)
                        setActivePage('course-viewer')
                      }}
                      className="shrink-0 text-neon-cyan hover:text-neon-cyan hover:bg-neon-cyan/10"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
