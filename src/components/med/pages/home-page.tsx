'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore, type Course, type CourseProgress } from '@/store/app-store'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
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
  Target,
  Sparkles,
  CheckCircle2,
  Lock,
  HeartPulse,
  Siren,
  Award,
  X,
  CreditCard,
  Loader2,
  Crown,
  ImageIcon,
  Download,
  Smartphone,
  Share,
  Bell,
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

// ─── Payment Method Type ──────────────────────────────────────

interface PaymentMethod {
  _id: string
  name: string
  type: string
  accountNumber: string
  accountName: string
  instructions?: string
  active?: boolean
}

// ─── Payment Modal ────────────────────────────────────────────

function PaymentModal({ course, onClose }: { course: { id: string; titleAr: string; instructor: string; price: number }; onClose: () => void }) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const copyToClipboard = async (text: string, fieldId: string) => {
    // Robust copy: try Clipboard API first, then execCommand fallback, then prompt fallback
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
        // Last resort: use prompt
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

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('حجم الملف يتجاوز 5MB')
      return
    }
    setError('')
    const reader = new FileReader()
    reader.onload = () => setScreenshot(reader.result as string)
    reader.readAsDataURL(file)
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
                    <p className="text-sm font-mono text-foreground font-bold tracking-wide" dir="ltr">{selectedMethod.accountNumber}</p>
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
                    <p className="text-sm text-foreground font-bold">{selectedMethod.accountName}</p>
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
                    <p className="text-xs text-muted-foreground">{selectedMethod.instructions}</p>
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

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                {error}
              </div>
            )}

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

// ─── Gift Celebration Modal ────────────────────────────────
function GiftCelebrationModal({ course, onClose }: { course: { id: string; titleAr: string; giftedAt: string | null }; onClose: () => void }) {
  const [phase, setPhase] = useState<'fireworks' | 'reveal' | 'ready'>('fireworks')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('reveal'), 1200)
    const t2 = setTimeout(() => setPhase('ready'), 2800)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  // Firework particles
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
      {/* Dark backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/80"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />

      {/* Firework particles */}
      {phase === 'fireworks' && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute rounded-full"
              style={{
                left: '50%',
                top: '50%',
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
              }}
              initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
              animate={{
                x: (p.x - 50) * 4,
                y: (p.y - 50) * 4,
                scale: [0, 1.5, 0],
                opacity: [1, 1, 0],
              }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                ease: 'easeOut',
              }}
            />
          ))}
          {/* Center burst glow */}
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.6) 0%, transparent 70%)' }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: [0, 3, 5], opacity: [1, 0.5, 0] }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
          {/* Ring burst */}
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

      {/* Main content card */}
      <motion.div
        className="relative z-10 w-full max-w-md mx-4"
        initial={{ scale: 0.3, opacity: 0, y: 40 }}
        animate={{
          scale: phase === 'fireworks' ? 0.3 : 1,
          opacity: phase === 'fireworks' ? 0 : 1,
          y: phase === 'fireworks' ? 40 : 0,
        }}
        transition={{ type: 'spring', stiffness: 200, damping: 20, delay: phase === 'fireworks' ? 0 : 0 }}
      >
        <div className="relative overflow-hidden rounded-3xl border border-purple-500/30" style={{
          background: 'linear-gradient(135deg, rgba(88,28,135,0.4) 0%, rgba(30,20,60,0.95) 30%, rgba(20,15,40,0.98) 100%)',
        }}>
          {/* Animated background sparkles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {phase !== 'fireworks' && Array.from({ length: 20 }, (_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-purple-300/50"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: Math.random() * 2 + 1,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>

          {/* Top glow line */}
          <div className="h-1 w-full bg-gradient-to-l from-purple-500 via-pink-500 to-cyan-500" />

          <div className="p-8 text-center space-y-6">
            {/* Gift icon with animation */}
            <motion.div
              className="relative inline-block"
              initial={{ scale: 0, rotate: -30 }}
              animate={{
                scale: phase === 'ready' ? [1, 1.15, 1] : 1,
                rotate: phase === 'ready' ? [0, 5, -5, 0] : 0,
              }}
              transition={{
                duration: 0.6,
                repeat: phase === 'ready' ? 0 : 0,
              }}
            >
              <div className="text-7xl">🎁</div>
              {/* Glow rings around gift */}
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

            {/* Title */}
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

            {/* Course card */}
            <motion.div
              className="relative rounded-2xl p-4 text-right"
              style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(236,72,153,0.1) 100%)' }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: phase === 'fireworks' ? 0 : 1, scale: phase === 'fireworks' ? 0.9 : 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-l from-purple-500/50 via-pink-500/50 to-cyan-500/50" />
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-2xl shrink-0">
                  🎁
                </div>
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
              {/* Gift tag */}
              <div className="mt-3 flex items-center gap-2">
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium">
                  🎁 هدية من الإدارة
                </span>
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-neon-green/20 text-neon-green border border-neon-green/30 font-medium">
                  ✅ مفتوحة بالكامل
                </span>
              </div>
            </motion.div>

            {/* CTA button */}
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

      {/* Side fireworks (continuous subtle) */}
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
              animate={{
                y: [0, -30, -60],
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3,
                ease: 'easeOut',
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  MAIN COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function HomePage() {
  const { user, courses, quizQuestions, simulationCases, openCourse, courseProgress, setActivePage, setActiveSimulation } = useAppStore()

  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [paymentCourse, setPaymentCourse] = useState<{ id: string; titleAr: string; instructor: string; price: number } | null>(null)
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  // PWA Install prompt detection
  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
      setIsInstalled(true)
      return
    }

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(iOS)

    // Check if banner was dismissed recently (only for 24 hours)
    const dismissed = localStorage.getItem('nabd-install-dismissed')
    if (dismissed) {
      const dismissedTime = parseInt(dismissed)
      const hoursSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60)
      if (hoursSinceDismissed < 24) return
      // If more than 24 hours, show again
      localStorage.removeItem('nabd-install-dismissed')
    }

    // Android/Chrome - listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      // Show banner after a short delay for better UX
      setTimeout(() => setShowInstallBanner(true), 2000)
    }
    window.addEventListener('beforeinstallprompt', handler)

    // For iOS - show banner with instructions after delay
    if (iOS) {
      setTimeout(() => {
        if (!window.matchMedia('(display-mode: standalone)').matches && !(window.navigator as any).standalone) {
          setShowInstallBanner(true)
        }
      }, 4000)
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setIsInstalled(true)
        setShowInstallBanner(false)
      }
      setDeferredPrompt(null)
    }
  }

  const handleDismissInstall = () => {
    setShowInstallBanner(false)
    localStorage.setItem('nabd-install-dismissed', String(Date.now()))
  }

  // Fetch courses from API on mount - ensures real DB data with correct prices
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('medai-token') : null
        const res = await fetch('/api/courses', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        const data = await res.json()
        if (data.courses && data.courses.length > 0) {
          const apiCourses: Course[] = data.courses.map((c: any) => ({
            id: c._id?.toString() || c.id,
            title: c.title || '',
            titleAr: c.titleAr || '',
            description: c.descriptionAr || c.description || '',
            category: c.category || 'general',
            thumbnail: c.thumbnail || '',
            instructor: c.instructorName || c.instructor || '',
            rating: c.rating || 0,
            students: c.students || 0,
            duration: c.duration || '0 ساعة',
            level: c.level || 'beginner',
            price: c.price ?? 0,
            isPremium: c.isPremium || false,
            isGifted: c.isGifted || false,
            giftedAt: c.giftedAt || null,
            lessons: c.lessons || (c.lessonsData?.length || 0),
            tags: c.tags || [],
            lessonsData: c.lessonsData?.map((l: any) => ({
              id: l.id,
              courseId: c._id?.toString() || c.id,
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
            })) || [],
          }))
          const allLessons = apiCourses.flatMap(c => c.lessonsData || [])

          // Sync enrollment progress
          const currentProgress = useAppStore.getState().courseProgress
          const existingCourseIds = new Set(currentProgress.map(p => p.courseId))
          const newProgressEntries: CourseProgress[] = []
          for (const apiCourse of data.courses) {
            const courseId = apiCourse._id?.toString() || apiCourse.id
            const isEnrolled = apiCourse.isEnrolled === true
            if (isEnrolled && !existingCourseIds.has(courseId)) {
              const courseLessons = allLessons.filter(l => l.courseId === courseId)
              const firstLesson = courseLessons.sort((a, b) => a.order - b.order)[0]
              newProgressEntries.push({
                courseId,
                completedLessons: [],
                lastAccessedLessonId: firstLesson?.id || null,
                progress: 0,
                lastAccessedAt: Date.now(),
              })
            }
          }
          const updatedProgress = [...currentProgress, ...newProgressEntries]
          useAppStore.setState({
            courses: apiCourses,
            lessons: allLessons,
            courseProgress: updatedProgress,
          })
          if (typeof window !== 'undefined' && newProgressEntries.length > 0) {
            localStorage.setItem('medai-progress', JSON.stringify(updatedProgress))
          }
        }
      } catch {
        // Keep using Zustand store data as fallback
      }
    }
    fetchCourses()
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
  const currentQuiz = useMemo(() => quizQuestions?.[0] ?? null, [quizQuestions])

  // Quick Challenge handler
  const handleAnswer = (idx: number) => {
    if (selectedAnswer !== null) return
    setSelectedAnswer(idx)
    setShowExplanation(true)
  }

  // Gift celebration state
  const [giftCelebration, setGiftCelebration] = useState<{ id: string; titleAr: string; giftedAt: string | null } | null>(null)

  // Course click handler - show gift celebration for gifted courses, payment for locked paid courses, open course for free/enrolled
  const handleCourseClick = (course: { id: string; titleAr: string; instructor: string; price: number; isPremium?: boolean; isGifted?: boolean; giftedAt?: string | null }) => {
    const isEnrolled = !!courseProgress.find(p => p.courseId === course.id)
    // Gifted courses bypass payment lock completely
    if (course.isGifted) {
      if (!isEnrolled) {
        // Show gift celebration first, then auto-enroll and open
        setGiftCelebration({ id: course.id, titleAr: course.titleAr, giftedAt: course.giftedAt ?? null })
      } else {
        // Already enrolled gifted course - still show brief gift celebration
        setGiftCelebration({ id: course.id, titleAr: course.titleAr, giftedAt: course.giftedAt ?? null })
      }
      return
    }
    const isLocked = course.price > 0 && !isEnrolled
    if (isLocked) {
      setPaymentCourse(course)
    } else {
      openCourse(course.id)
    }
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
            1.5 PWA INSTALL BANNER
        ═══════════════════════════════════════════════════ */}
        <AnimatePresence>
          {showInstallBanner && !isInstalled && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="relative overflow-hidden rounded-2xl"
            >
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-bl from-cyan-500/15 via-purple-500/10 to-pink-500/15" />
              <div className="absolute inset-0 opacity-[0.03]" style={{
                backgroundImage: 'linear-gradient(rgba(0,245,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,245,255,0.5) 1px, transparent 1px)',
                backgroundSize: '30px 30px'
              }} />

              {/* Animated glow border */}
              <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-cyan-500/30 via-purple-500/30 to-pink-500/30 blur-[1px]" />
              <div className="relative glass-card p-5 border border-cyan-500/20">
                {/* Close button */}
                <button
                  onClick={handleDismissInstall}
                  className="absolute top-3 left-3 w-7 h-7 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors z-10"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-center gap-4">
                  {/* App Icon */}
                  <div className="shrink-0">
                    <div className="relative">
                      <img
                        src="/icons/icon-192x192.png"
                        alt="أكاديمية نبض"
                        className="w-16 h-16 rounded-2xl shadow-lg shadow-cyan-500/20"
                      />
                      {/* Pulse ring */}
                      <motion.div
                        className="absolute -inset-1 rounded-2xl border-2 border-cyan-400/30"
                        animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.8, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-black bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-1">
                      ثبّت أكاديمية نبض على جهازك!
                    </h3>
                    <p className="text-xs text-muted-foreground leading-5 mb-3">
                      استمتع بتجربة أسرع بدون متصفح، ودراسة بدون إنترنت، وإشعارات فورية بالدروس الجديدة
                    </p>

                    {/* Feature pills */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20">
                        <Download className="w-2.5 h-2.5" />
                        عمل أوفلاين
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-neon-purple/10 text-neon-purple border border-neon-purple/20">
                        <Sparkles className="w-2.5 h-2.5" />
                        أسرع 3x
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-neon-green/10 text-neon-green border border-neon-green/20">
                        <Bell className="w-2.5 h-2.5" />
                        إشعارات فورية
                      </span>
                    </div>

                    {/* Install button or iOS instructions */}
                    {isIOS ? (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-xl p-3">
                        <span>اضغط</span>
                        <Share className="w-4 h-4 text-neon-cyan" />
                        <span>ثم</span>
                        <span className="text-neon-cyan font-bold">إضافة إلى الشاشة الرئيسية</span>
                        <Smartphone className="w-4 h-4 text-neon-cyan mr-1" />
                      </div>
                    ) : deferredPrompt ? (
                      <Button
                        onClick={handleInstallClick}
                        className="bg-gradient-to-l from-neon-cyan to-cyan-400 text-med-dark font-bold text-sm h-10 px-6 hover:shadow-[0_0_25px_rgba(0,245,255,0.3)] transition-all"
                      >
                        <Download className="w-4 h-4 ml-2" />
                        تثبيت التطبيق
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-xl p-3">
                        <span>اضغط على</span>
                        <span className="text-neon-cyan font-bold">⋮</span>
                        <span>من المتصفح ثم اختر</span>
                        <span className="text-neon-cyan font-bold">إضافة إلى الشاشة الرئيسية</span>
                        <Smartphone className="w-4 h-4 text-neon-cyan mr-1" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
                    onClick={() => handleCourseClick(course)}
                  >
                    {/* Thumbnail placeholder */}
                    <div className="relative h-36 bg-gradient-to-bl from-neon-purple/20 via-neon-blue/10 to-neon-cyan/20 overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <BookOpen className="h-12 w-12 text-neon-cyan/30" />
                      </div>
                      {/* Progress overlay at bottom */}
                      <div className="absolute bottom-0 inset-x-0 h-1.5 bg-muted">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${courseProgress.find(p => p.courseId === course.id)?.progress || 0}%` }}
                          transition={{ duration: 1, delay: i * 0.15 }}
                          className="h-full bg-gradient-to-l from-neon-cyan to-neon-blue"
                        />
                      </div>
                      {/* Progress badge */}
                      <div className="absolute top-3 right-3 rounded-full bg-background/60 px-2.5 py-0.5 backdrop-blur-sm border border-border">
                        <span className="text-xs font-bold text-neon-cyan">{courseProgress.find(p => p.courseId === course.id)?.progress || 0}%</span>
                      </div>
                      {/* Paid badge for enrolled paid courses */}
                      {course.price > 0 && courseProgress.find(p => p.courseId === course.id) && (
                        <div className="absolute top-3 left-3">
                          <Badge className="text-[9px] bg-neon-green/20 text-neon-green border border-neon-green/30 flex items-center gap-1">
                            <Crown className="h-2.5 w-2.5" />
                            مشترك
                          </Badge>
                        </div>
                      )}
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
                        <div className="flex items-center gap-2">
                          {course.price > 0 && courseProgress.find(p => p.courseId === course.id) ? (
                            <Badge className="text-[10px] bg-neon-green/15 text-neon-green border border-neon-green/25 flex items-center gap-1">
                              <Crown className="h-2.5 w-2.5" />
                              مشترك
                            </Badge>
                          ) : course.price > 0 ? (
                            <Badge className="text-[10px] bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/25">
                              مدفوع
                            </Badge>
                          ) : (
                            <Badge className="text-[10px] bg-neon-green/15 text-neon-green border border-neon-green/25">
                              مجاني
                            </Badge>
                          )}
                          <Button
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); handleCourseClick(course) }}
                            className="bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/20 h-7 text-xs px-3"
                          >
                            متابعة
                          </Button>
                        </div>
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
            {recommendedCourses.map((course, i) => {
              const isEnrolled = !!courseProgress.find(p => p.courseId === course.id)
              const isLocked = course.price > 0 && !isEnrolled
              return (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={cardHover}
                onClick={() => handleCourseClick(course)}
                className="glass-card gradient-border p-4 group cursor-pointer relative overflow-hidden"
              >
                {/* Lock overlay for paid unenrolled courses */}
                {isLocked && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-10 rounded-2xl">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center">
                        <Lock className="w-6 h-6 text-neon-cyan" />
                      </div>
                      <span className="text-xs font-bold text-neon-cyan">{course.price.toLocaleString()} ر.ي</span>
                    </div>
                  </div>
                )}
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
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                      {course.rating}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {formatCount(course.students)}
                    </span>
                  </div>
                  {course.price === 0 ? (
                    <Badge className="text-[9px] bg-neon-green/15 text-neon-green border border-neon-green/25">مجاني</Badge>
                  ) : isEnrolled ? (
                    <Badge className="text-[9px] bg-neon-green/15 text-neon-green border border-neon-green/25 flex items-center gap-0.5"><Crown className="h-2.5 w-2.5" />مشترك</Badge>
                  ) : (
                    <Badge className="text-[9px] bg-yellow-500/15 text-yellow-400 border border-yellow-500/25">{course.price.toLocaleString()} ر.ي</Badge>
                  )}
                </div>
              </motion.div>
              )
            })}
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
                        ? 'bg-card border-border'
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
              const isEnrolled = !!courseProgress.find(p => p.courseId === course.id)
              const isLocked = !course.isGifted && course.price > 0 && !isEnrolled

              return (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  whileHover={cardHover}
                  onClick={() => handleCourseClick(course)}
                  className="glass-card overflow-hidden group cursor-pointer"
                >
                  <div className={`relative h-32 bg-gradient-to-bl ${gradients[i % gradients.length]}`}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BookOpen className="h-10 w-10 text-muted-foreground/10" />
                    </div>
                    <div className="absolute top-3 right-3 flex items-center gap-2">
                      <Badge className={`text-[10px] ${levelInfo.color} border`}>
                        {levelInfo.label}
                      </Badge>
                      {course.isPremium && (
                        <Badge className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          <Crown className="h-3 w-3 ml-0.5 inline" />
                          مميز
                        </Badge>
                      )}
                      {course.isGifted && (
                        <Badge className="text-[10px] bg-purple-500/20 text-purple-400 border border-purple-500/30">
                          🎁 هدية
                        </Badge>
                      )}
                    </div>
                    <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-background/50 px-2 py-0.5 backdrop-blur-sm">
                      <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                      <span className="text-xs font-bold">{course.rating}</span>
                    </div>
                    {/* Gift sparkle overlay for gifted courses */}
                    {course.isGifted && (
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-cyan-500/10 flex items-center justify-center z-10">
                        <div className="flex flex-col items-center gap-1">
                          <motion.div
                            animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                            className="text-3xl"
                          >
                            🎁
                          </motion.div>
                          <span className="text-[10px] font-bold text-purple-300">هدية من الإدارة</span>
                        </div>
                      </div>
                    )}
                    {/* Lock overlay for paid unenrolled courses */}
                    {isLocked && (
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-10">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-14 h-14 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center">
                            <Lock className="w-7 h-7 text-neon-cyan" />
                          </div>
                          <span className="text-sm font-bold text-neon-cyan">{course.price.toLocaleString()} ر.ي</span>
                        </div>
                      </div>
                    )}
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
                      {course.isGifted ? (
                        <Badge className="text-[10px] bg-purple-500/15 text-purple-400 border border-purple-500/25 flex items-center gap-0.5">🎁 هدية من الإدارة</Badge>
                      ) : course.price === 0 ? (
                        <Badge className="text-[10px] bg-neon-green/15 text-neon-green border border-neon-green/25">مجاني</Badge>
                      ) : isEnrolled ? (
                        <Badge className="text-[10px] bg-neon-green/15 text-neon-green border border-neon-green/25 flex items-center gap-0.5"><Crown className="h-2.5 w-2.5" />مشترك</Badge>
                      ) : (
                        <Badge className="text-[10px] bg-yellow-500/15 text-yellow-400 border border-yellow-500/25">{course.price.toLocaleString()} ر.ي</Badge>
                      )}
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
        {currentQuiz ? (
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
                  {currentQuiz?.difficulty === 'easy' ? 'سهل' : currentQuiz?.difficulty === 'medium' ? 'متوسط' : 'صعب'}
                </Badge>
              </div>

              <p className="text-sm font-semibold mb-4 leading-7">{currentQuiz?.question ?? ''}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(currentQuiz?.options ?? []).map((option, idx) => {
                  const isCorrect = idx === currentQuiz?.correctIndex
                  const isSelected = selectedAnswer === idx
                  let btnClass = 'glass-card border-border text-right'

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
                      <p className="text-xs text-muted-foreground leading-5">{currentQuiz?.explanation ?? ''}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.section>
        ) : null}

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
              {courses.slice(0, 3).map((course) => {
                const isEnrolled = !!courseProgress.find(p => p.courseId === course.id)
                const isLocked = !course.isGifted && course.price > 0 && !isEnrolled
                return (
                <button
                  key={course.id}
                  onClick={() => handleCourseClick(course)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors text-right"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isLocked ? 'bg-yellow-500/10' : 'bg-primary/10'}`}>
                    {isLocked ? (
                      <Lock className="w-4 h-4 text-yellow-400" />
                    ) : (
                      <BookOpen className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{course.titleAr}</p>
                    <p className="text-xs text-muted-foreground">{course.instructor} · {course.duration}</p>
                  </div>
                  {course.isGifted ? (
                    <Badge className="text-[10px] bg-purple-500/10 text-purple-400 border-purple-500/20 border flex items-center gap-0.5">🎁 هدية</Badge>
                  ) : course.price === 0 ? (
                    <Badge className="text-[10px] bg-neon-green/10 text-neon-green border-neon-green/20 border">مجاني</Badge>
                  ) : isEnrolled ? (
                    <Badge className="text-[10px] bg-neon-green/10 text-neon-green border-neon-green/20 border flex items-center gap-0.5"><Crown className="h-2.5 w-2.5" />مشترك</Badge>
                  ) : (
                    <Badge className="text-[10px] bg-yellow-500/10 text-yellow-400 border-yellow-500/20 border">{course.price.toLocaleString()} ر.ي</Badge>
                  )}
                </button>
                )
              })}
            </div>
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
            <button
              onClick={() => setActivePage('simulation')}
              className="text-sm text-neon-cyan hover:underline flex items-center gap-1"
            >
              الكل <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {simulationCases.map((caseItem, i) => {
              const diffMap: Record<string, { label: string; color: string }> = {
                easy: { label: 'سهل', color: 'text-neon-green border-neon-green/30 bg-neon-green/10' },
                medium: { label: 'متوسط', color: 'text-neon-orange border-neon-orange/30 bg-neon-orange/10' },
                hard: { label: 'صعب', color: 'text-red-400 border-red-400/30 bg-red-400/10' },
                expert: { label: 'خبير', color: 'text-neon-purple border-neon-purple/30 bg-neon-purple/10' },
              }
              const diff = diffMap[caseItem?.difficulty ?? 'medium'] ?? diffMap.medium

              const handleCaseClick = () => {
                if (caseItem.isLocked) return
                setActiveSimulation(caseItem)
                setActivePage('simulation')
              }

              return (
                <motion.div
                  key={caseItem.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={caseItem.isLocked ? {} : cardHover}
                  onClick={handleCaseClick}
                  className={`glass-card p-4 relative overflow-hidden border-red-500/10 ${caseItem.isLocked ? 'opacity-60' : 'cursor-pointer'}`}
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
                          ? 'bg-muted/30 text-muted-foreground border border-border'
                          : 'bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25'
                      }`}
                      disabled={caseItem.isLocked}
                      onClick={(e) => { e.stopPropagation(); handleCaseClick() }}
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
        {giftCelebration && (
          <GiftCelebrationModal
            course={giftCelebration}
            onClose={() => {
              const gift = giftCelebration
              setGiftCelebration(null)
              openCourse(gift.id)
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
