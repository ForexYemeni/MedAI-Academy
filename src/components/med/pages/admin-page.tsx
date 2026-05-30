'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, DollarSign, BookOpen, TrendingUp, TrendingDown,
  Activity, Clock, Star, Send, Bell,
  AlertCircle, CheckCircle2, Circle, Shield,
  CreditCard, UserPlus, Zap, BarChart3,
  Settings, ChevronDown, Edit3, Save, X, FileText, Video, HelpCircle, FlaskConical, Layers, Plus, Trash2, RefreshCw, Loader2, Wallet, ToggleLeft, ToggleRight, Image as ImageIcon,
  Menu, LogOut, Gift, MessageSquare, Sun, Moon, Lock, Info, Copy, EyeOff, Crown,
  Trophy, Target, Timer, Shuffle, Sparkles, RotateCcw,
} from 'lucide-react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Sheet, SheetContent, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'
import { useAppStore } from '@/store/app-store'
import { useTheme } from '@/components/med/layout/theme-provider'
import { NotificationBell, AdminNotificationBadge } from '@/components/med/layout/notification-center'
import { usePushNotifications } from '@/components/med/layout/push-notification-provider'

// ─── Types ──────────────────────────────────────────────────

interface ApiLessonQuizQuestion {
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

interface ApiLessonFlashcard {
  front: string
  back: string
}

interface ApiLessonSimulationCase {
  patientInfo: string
  vitals: { hr: number; bp: string; spo2: number; temp: number; rr: number }
  symptoms: string[]
  diagnosis: string
  treatment: string
  actions: string[]
}

interface ApiLesson {
  id: string
  title: string
  titleAr: string
  type: 'video' | 'article' | 'quiz' | 'simulation' | 'flashcard'
  duration: number
  order: number
  isFree: boolean
  content?: string
  videoUrl?: string
  keyPoints?: string[]
  quizData?: ApiLessonQuizQuestion[]
  flashcardData?: ApiLessonFlashcard[]
  simulationData?: ApiLessonSimulationCase
}

interface ApiCourse {
  _id: string
  title: string
  titleAr: string
  description: string
  descriptionAr: string
  category: string
  level: 'beginner' | 'intermediate' | 'advanced'
  price: number
  isPremium: boolean
  rating: number
  students: number
  duration: string
  instructorName: string
  lessons: number
  lessonsData: ApiLesson[]
  published: boolean
  tags: string[]
  thumbnail?: string
  studentCount?: number
  revenue?: number
  createdAt: string
  updatedAt: string
}

interface ApiUser {
  _id: string
  name: string
  phone: string
  role: string
  subscription: string
  xp: number
  coins: number
  level: number
  enrollmentCount: number
  paymentCount: number
  createdAt: string
}

interface ApiPayment {
  _id: string
  userId: string
  userName?: string
  userPhone?: string
  courseId: string
  courseName?: string
  amount: number
  walletName: string
  walletPhone: string
  screenshotUrl?: string
  status: 'pending' | 'approved' | 'rejected'
  adminNote?: string
  createdAt: string
}

interface ApiPaymentMethod {
  _id: string
  type: string
  name: string
  accountNumber: string
  accountName: string
  instructions: string
  active: boolean
  createdAt: string
}

// ─── Animation Variants ─────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
}
const cardHover = { scale: 1.02, transition: { duration: 0.25, ease: 'easeOut' as const } }

// ─── Helper Functions ───────────────────────────────────────

function getAuthHeaders() {
  // First try Zustand store (faster, always in sync), then fallback to localStorage
  const storeToken = useAppStore.getState().authToken
  const token = storeToken || (typeof window !== 'undefined' ? localStorage.getItem('medai-token') : null)
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
}

function getLessonTypeIcon(type: string) {
  switch (type) {
    case 'video': return <Video className="h-4 w-4 text-neon-cyan" />
    case 'article': return <FileText className="h-4 w-4 text-neon-purple" />
    case 'quiz': return <HelpCircle className="h-4 w-4 text-neon-orange" />
    case 'simulation': return <FlaskConical className="h-4 w-4 text-neon-green" />
    case 'flashcard': return <Layers className="h-4 w-4 text-neon-pink" />
    default: return <FileText className="h-4 w-4 text-muted-foreground" />
  }
}

function getLessonTypeLabel(type: string) {
  switch (type) {
    case 'video': return 'فيديو'
    case 'article': return 'مقال'
    case 'quiz': return 'اختبار'
    case 'simulation': return 'محاكاة'
    case 'flashcard': return 'بطاقات'
    default: return type
  }
}

function getCategoryColor(category: string) {
  const colors: Record<string, string> = {
    emergency: 'from-red-500/20 to-orange-500/20 border-red-500/30',
    cardiology: 'from-pink-500/20 to-red-500/20 border-pink-500/30',
    neurology: 'from-purple-500/20 to-indigo-500/20 border-purple-500/30',
    pediatrics: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
    surgery: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
    internal: 'from-amber-500/20 to-yellow-500/20 border-amber-500/30',
    radiology: 'from-cyan-500/20 to-teal-500/20 border-cyan-500/30',
    pharmacology: 'from-violet-500/20 to-purple-500/20 border-violet-500/30',
  }
  return colors[category] || 'from-gray-500/20 to-slate-500/20 border-gray-500/30'
}

function getCategoryLabel(category: string) {
  const labels: Record<string, string> = {
    emergency: 'طوارئ', cardiology: 'قلب', neurology: 'أعصاب', pediatrics: 'أطفال',
    surgery: 'جراحة', internal: 'باطني', radiology: 'أشعة', pharmacology: 'أدوية',
  }
  return labels[category] || category
}

function getLevelLabel(level: string) {
  const labels: Record<string, string> = { beginner: 'مبتدئ', intermediate: 'متوسط', advanced: 'متقدم' }
  return labels[level] || level
}

function getLevelColor(level: string) {
  const colors: Record<string, string> = { beginner: 'text-neon-green', intermediate: 'text-neon-orange', advanced: 'text-red-400' }
  return colors[level] || 'text-muted-foreground'
}

// ─── Sidebar Config ─────────────────────────────────────────

type AdminSection = 'overview' | 'courses' | 'users' | 'payments' | 'payment-methods' | 'notifications' | 'activity-logs' | 'database' | 'simulation' | 'community' | 'quizzes' | 'ai-assistant' | 'settings'

const sidebarItems: { id: AdminSection; label: string; icon: typeof Activity }[] = [
  { id: 'overview', label: 'نظرة عامة', icon: Activity },
  { id: 'courses', label: 'الدورات والدروس', icon: BookOpen },
  { id: 'users', label: 'المستخدمين', icon: Users },
  { id: 'payments', label: 'المدفوعات', icon: CreditCard },
  { id: 'payment-methods', label: 'طرق الدفع', icon: Wallet },
  { id: 'simulation', label: 'المحاكاة', icon: FlaskConical },
  { id: 'community', label: 'المجتمع', icon: MessageSquare },
  { id: 'quizzes', label: 'الاختبارات', icon: HelpCircle },
  { id: 'notifications', label: 'الإشعارات', icon: Bell },
  { id: 'ai-assistant', label: 'المساعد الذكي', icon: Sparkles },
  { id: 'activity-logs', label: 'سجل العمليات', icon: FileText },
  { id: 'database', label: 'قاعدة البيانات', icon: Shield },
  { id: 'settings', label: 'إعدادات التطبيق', icon: Settings },
]

// ─── Course Form Component ──────────────────────────────────

function CourseForm({ course, onSave, onCancel }: {
  course?: ApiCourse | null
  onSave: (data: any) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState({
    title: course?.title || '',
    titleAr: course?.titleAr || '',
    description: course?.description || '',
    descriptionAr: course?.descriptionAr || '',
    category: course?.category || 'emergency',
    level: course?.level || 'beginner',
    price: course?.price || 0,
    isPremium: course?.isPremium || false,
    published: course?.published || false,
    instructorName: course?.instructorName || '',
    duration: course?.duration || '0 ساعة',
  })

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
      className="glass-card overflow-hidden border border-neon-cyan/20">
      {/* Header */}
      <div className="px-5 py-4 bg-gradient-to-l from-neon-cyan/10 to-neon-purple/5 border-b border-border flex items-center justify-between">
        <h4 className="text-sm font-bold flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-neon-cyan/15 flex items-center justify-center">
            <BookOpen className="h-4 w-4 text-neon-cyan" />
          </div>
          {course ? 'تعديل الدورة' : 'إضافة دورة جديدة'}
        </h4>
        <Button variant="ghost" size="icon" onClick={onCancel} className="h-8 w-8 hover:bg-red-500/10 rounded-lg">
          <X className="h-4 w-4 text-red-400" />
        </Button>
      </div>

      <div className="p-5 space-y-5">
        {/* Section 1: Title */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 rounded-full bg-neon-cyan" />
            <span className="text-xs font-bold text-neon-cyan">عنوان الدورة</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block font-medium">العنوان بالعربي *</label>
              <Input value={form.titleAr} onChange={(e) => setForm({ ...form, titleAr: e.target.value })}
                placeholder="مثال: أساسيات طب الطوارئ"
                className="bg-muted/30 border-border focus:border-neon-cyan/50 text-sm h-10" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block font-medium">العنوان بالإنجليزي *</label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Emergency Medicine Basics"
                className="bg-muted/30 border-border focus:border-neon-cyan/50 text-sm h-10" dir="ltr" />
            </div>
          </div>
        </div>

        {/* Section 2: Description */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 rounded-full bg-neon-purple" />
            <span className="text-xs font-bold text-neon-purple">وصف الدورة</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block font-medium">الوصف بالعربي</label>
              <Textarea value={form.descriptionAr} onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })}
                rows={3} className="bg-muted/30 border-border focus:border-neon-cyan/50 text-sm resize-none" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block font-medium">الوصف بالإنجليزي</label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3} className="bg-muted/30 border-border focus:border-neon-cyan/50 text-sm resize-none" dir="ltr" />
            </div>
          </div>
        </div>

        {/* Section 3: Details */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 rounded-full bg-amber-400" />
            <span className="text-xs font-bold text-amber-400">تفاصيل الدورة</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block font-medium">التصنيف *</label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger className="bg-muted/30 border-border h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-med-card">
                  <SelectItem value="emergency">🚑 طوارئ</SelectItem>
                  <SelectItem value="cardiology">❤️ قلب</SelectItem>
                  <SelectItem value="neurology">🧠 أعصاب</SelectItem>
                  <SelectItem value="pediatrics">👶 أطفال</SelectItem>
                  <SelectItem value="surgery">🔪 جراحة</SelectItem>
                  <SelectItem value="internal">🩺 باطني</SelectItem>
                  <SelectItem value="radiology">🔬 أشعة</SelectItem>
                  <SelectItem value="pharmacology">💊 أدوية</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block font-medium">المستوى</label>
              <Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v as any })}>
                <SelectTrigger className="bg-muted/30 border-border h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-med-card">
                  <SelectItem value="beginner">🟢 مبتدئ</SelectItem>
                  <SelectItem value="intermediate">🟡 متوسط</SelectItem>
                  <SelectItem value="advanced">🔴 متقدم</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block font-medium">السعر (ر.ي)</label>
              <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) || 0 })}
                className="bg-muted/30 border-border focus:border-neon-cyan/50 text-sm h-10" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block font-medium">المدة</label>
              <Input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })}
                placeholder="42 ساعة" className="bg-muted/30 border-border focus:border-neon-cyan/50 text-sm h-10" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block font-medium">اسم المدرب</label>
              <Input value={form.instructorName} onChange={(e) => setForm({ ...form, instructorName: e.target.value })}
                placeholder="د. أحمد محمد"
                className="bg-muted/30 border-border focus:border-neon-cyan/50 text-sm h-10" />
            </div>
            <div className="flex items-end gap-3 pb-0.5">
              <button
                type="button"
                onClick={() => setForm({ ...form, isPremium: !form.isPremium })}
                className={`flex-1 h-10 rounded-md border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  form.isPremium
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                    : 'bg-muted/30 border-border text-muted-foreground'
                }`}
              >
                <Crown className="h-4 w-4" />
                {form.isPremium ? 'دورة مميزة (مدفوعة)' : 'دورة عادية'}
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, published: !form.published })}
                className={`flex-1 h-10 rounded-md border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  form.published
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                    : 'bg-muted/30 border-border text-muted-foreground'
                }`}
              >
                {form.published ? <><CheckCircle2 className="h-4 w-4" /> منشورة</> : <><EyeOff className="h-4 w-4" /> مسودة</>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-5 py-4 border-t border-border flex gap-3 bg-muted/10">
        <Button onClick={() => onSave(form)} disabled={!form.titleAr || !form.title || !form.category}
          className="bg-gradient-to-l from-neon-cyan to-neon-purple text-white font-bold hover:shadow-[0_0_20px_rgba(0,245,255,0.3)] transition-all h-10 px-6">
          <Save className="h-4 w-4 ml-1.5" />
          {course ? 'حفظ التعديلات' : 'إضافة الدورة'}
        </Button>
        <Button variant="ghost" onClick={onCancel} className="text-muted-foreground hover:text-foreground h-10">إلغاء</Button>
      </div>
    </motion.div>
  )
}

// ─── Lesson Form Component ──────────────────────────────────

function LessonForm({ lesson, courseId, onSave, onCancel, nextOrder }: {
  lesson?: ApiLesson | null
  courseId: string
  onSave: (data: any) => void
  onCancel: () => void
  nextOrder?: number
}) {
  const [form, setForm] = useState<ApiLesson>({
    id: lesson?.id || `lesson-${Date.now()}`,
    title: lesson?.title || '',
    titleAr: lesson?.titleAr || '',
    type: lesson?.type || 'article',
    duration: lesson?.duration || 15,
    order: lesson?.order || nextOrder || 1,
    isFree: lesson?.isFree || false,
    content: lesson?.content || '',
    videoUrl: lesson?.videoUrl || '',
    keyPoints: lesson?.keyPoints || [],
    quizData: lesson?.quizData || [],
    flashcardData: lesson?.flashcardData || [],
    simulationData: lesson?.simulationData || undefined,
  })

  const addQuizQuestion = () => {
    const newQ: ApiLessonQuizQuestion = { question: '', options: ['', '', '', ''], correctIndex: 0, explanation: '' }
    setForm({ ...form, quizData: [...(form.quizData || []), newQ] })
  }
  const updateQuizQuestion = (idx: number, field: string, value: any) => {
    const updated = [...(form.quizData || [])]
    updated[idx] = { ...updated[idx], [field]: value }
    setForm({ ...form, quizData: updated })
  }
  const updateQuizOption = (qIdx: number, oIdx: number, value: string) => {
    const updated = [...(form.quizData || [])]
    const opts = [...updated[qIdx].options]
    opts[oIdx] = value
    updated[qIdx] = { ...updated[qIdx], options: opts }
    setForm({ ...form, quizData: updated })
  }
  const removeQuizQuestion = (idx: number) => {
    setForm({ ...form, quizData: (form.quizData || []).filter((_, i) => i !== idx) })
  }
  const addFlashcard = () => {
    const newCard: ApiLessonFlashcard = { front: '', back: '' }
    setForm({ ...form, flashcardData: [...(form.flashcardData || []), newCard] })
  }
  const updateFlashcard = (idx: number, field: 'front' | 'back', value: string) => {
    const updated = [...(form.flashcardData || [])]
    updated[idx] = { ...updated[idx], [field]: value }
    setForm({ ...form, flashcardData: updated })
  }
  const removeFlashcard = (idx: number) => {
    setForm({ ...form, flashcardData: (form.flashcardData || []).filter((_, i) => i !== idx) })
  }
  const updateSimulationData = (field: string, value: any) => {
    setForm({ ...form, simulationData: { ...form.simulationData, [field]: value } as ApiLessonSimulationCase })
  }
  const updateVital = (vitalField: string, vitalValue: any) => {
    const currentVitals = form.simulationData?.vitals || { hr: 0, bp: '', spo2: 0, temp: 0, rr: 0 }
    const newVitals = { ...currentVitals, [vitalField]: vitalValue }
    updateSimulationData('vitals', newVitals)
  }

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
      className="glass-card overflow-hidden border border-neon-purple/20">
      {/* Header */}
      <div className="px-5 py-4 bg-gradient-to-l from-neon-purple/10 to-neon-cyan/5 border-b border-border flex items-center justify-between">
        <h4 className="text-sm font-bold flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-neon-purple/15 flex items-center justify-center">
            <Edit3 className="h-4 w-4 text-neon-purple" />
          </div>
          {lesson ? 'تعديل الدرس' : 'إضافة درس جديد'}
        </h4>
        <Button variant="ghost" size="icon" onClick={onCancel} className="h-8 w-8 hover:bg-red-500/10 rounded-lg">
          <X className="h-4 w-4 text-red-400" />
        </Button>
      </div>

      <div className="p-5 space-y-5">
        {/* Section 1: Basic Info */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 rounded-full bg-neon-cyan" />
            <span className="text-xs font-bold text-neon-cyan">معلومات الدرس الأساسية</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block font-medium">العنوان بالعربي *</label>
              <Input value={form.titleAr} onChange={(e) => setForm({ ...form, titleAr: e.target.value })}
                placeholder="مثال: مقدمة في تشخيص أمراض القلب"
                className="bg-muted/30 border-border focus:border-neon-cyan/50 text-sm h-10" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block font-medium">العنوان بالإنجليزي *</label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Introduction to Cardiac Diagnosis"
                className="bg-muted/30 border-border focus:border-neon-cyan/50 text-sm h-10" dir="ltr" />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block font-medium">نوع الدرس</label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as ApiLesson['type'] })}>
                <SelectTrigger className="bg-muted/30 border-border h-10 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-med-card">
                  <SelectItem value="article">📝 مقال</SelectItem>
                  <SelectItem value="quiz">❓ اختبار</SelectItem>
                  <SelectItem value="simulation">🧪 محاكاة</SelectItem>
                  <SelectItem value="flashcard">🃏 بطاقات</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block font-medium">المدة (دقيقة)</label>
              <Input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || 0 })}
                className="bg-muted/30 border-border focus:border-neon-cyan/50 text-sm h-10" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block font-medium">الترتيب</label>
              <Input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                className="bg-muted/30 border-border focus:border-neon-cyan/50 text-sm h-10" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block font-medium">الوصول</label>
              <button
                type="button"
                onClick={() => setForm({ ...form, isFree: !form.isFree })}
                className={`w-full h-10 rounded-md border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  form.isFree
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                    : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                }`}
              >
                {form.isFree ? (
                  <><CheckCircle2 className="h-4 w-4" /> مجاني</>
                ) : (
                  <><Lock className="h-4 w-4" /> مدفوع</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: Content */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 rounded-full bg-neon-purple" />
            <span className="text-xs font-bold text-neon-purple">محتوى الدرس</span>
          </div>

          {form.type === 'article' && (
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block font-medium">محتوى المقال (Markdown)</label>
              <Textarea value={form.content || ''} onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={10} className="bg-muted/30 border-border focus:border-neon-cyan/50 text-sm resize-none font-mono leading-relaxed" dir="rtl"
                placeholder="اكتب محتوى الدرس هنا...&#10;&#10;## العنوان الفرعي&#10;المحتوى...&#10;&#10;- نقطة أولى&#10;- نقطة ثانية" />
              <p className="text-[10px] text-muted-foreground/50 mt-1">يدعم تنسيق Markdown: ## عناوين، **عريض**، - قوائم، &gt; اقتباسات</p>
            </div>
          )}

          {form.type === 'quiz' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs text-muted-foreground font-medium">أسئلة الاختبار</label>
                <Button type="button" variant="outline" size="sm" onClick={addQuizQuestion}
                  className="h-7 text-xs gap-1 border-amber-500/30 text-amber-400 hover:bg-amber-500/10">
                  <Plus className="h-3 w-3" />
                  إضافة سؤال
                </Button>
              </div>
              {(!form.quizData || form.quizData.length === 0) && (
                <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/15 text-center">
                  <HelpCircle className="h-8 w-8 text-amber-400/40 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">لا توجد أسئلة بعد. اضغط &quot;إضافة سؤال&quot; للبدء</p>
                </div>
              )}
              {(form.quizData || []).map((q, qIdx) => (
                <div key={qIdx} className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/15 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400">{'سؤال ' + (qIdx + 1)}</span>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeQuizQuestion(qIdx)}
                      className="h-6 w-6 hover:bg-red-500/10">
                      <Trash2 className="h-3 w-3 text-red-400" />
                    </Button>
                  </div>
                  <Input value={q.question} onChange={(e) => updateQuizQuestion(qIdx, 'question', e.target.value)}
                    placeholder="نص السؤال" className="bg-muted/30 border-border focus:border-amber-500/50 text-sm h-9" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} className="flex items-center gap-2">
                        <button type="button" onClick={() => updateQuizQuestion(qIdx, 'correctIndex', oIdx)}
                          className={"shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all " + (q.correctIndex === oIdx ? 'border-emerald-400 bg-emerald-400/20' : 'border-muted-foreground/30 hover:border-muted-foreground/50')}>
                          {q.correctIndex === oIdx && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
                        </button>
                        <Input value={opt} onChange={(e) => updateQuizOption(qIdx, oIdx, e.target.value)}
                          placeholder={'الخيار ' + (oIdx + 1)}
                          className={"bg-muted/30 border-border text-sm h-8 " + (q.correctIndex === oIdx ? 'border-emerald-500/40' : 'focus:border-amber-500/50')} />
                      </div>
                    ))}
                  </div>
                  <Input value={q.explanation} onChange={(e) => updateQuizQuestion(qIdx, 'explanation', e.target.value)}
                    placeholder="شرح الإجابة الصحيحة (اختياري)" className="bg-muted/30 border-border focus:border-amber-500/50 text-sm h-9" />
                </div>
              ))}
            </div>
          )}

          {form.type === 'simulation' && (
            <div className="space-y-3">
              <label className="text-xs text-muted-foreground font-medium">بيانات حالة المحاكاة</label>
              <div>
                <label className="text-[10px] text-muted-foreground/60 mb-1 block">معلومات المريض</label>
                <Textarea value={form.simulationData?.patientInfo || ''}
                  onChange={(e) => updateSimulationData('patientInfo', e.target.value)}
                  rows={3} className="bg-muted/30 border-border focus:border-purple-500/50 text-sm resize-none"
                  placeholder="معلومات المريض الأساسية..." />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground/60 mb-1 block">العلامات الحيوية</label>
                <div className="grid grid-cols-5 gap-2">
                  <div>
                    <label className="text-[9px] text-muted-foreground/50 block">HR (نبض)</label>
                    <Input type="number" value={form.simulationData?.vitals?.hr || ''}
                      onChange={(e) => updateVital('hr', e.target.value ? parseInt(e.target.value) : 0)}
                      placeholder="80"
                      className="bg-muted/30 border-border text-xs h-8 text-center" />
                  </div>
                  <div>
                    <label className="text-[9px] text-muted-foreground/50 block">BP (ضغط)</label>
                    <Input value={form.simulationData?.vitals?.bp || ''}
                      onChange={(e) => updateVital('bp', e.target.value)}
                      placeholder="120/80"
                      className="bg-muted/30 border-border text-xs h-8 text-center" />
                  </div>
                  <div>
                    <label className="text-[9px] text-muted-foreground/50 block">SpO2 (%)</label>
                    <Input type="number" value={form.simulationData?.vitals?.spo2 || ''}
                      onChange={(e) => updateVital('spo2', e.target.value ? parseInt(e.target.value) : 0)}
                      placeholder="98"
                      className="bg-muted/30 border-border text-xs h-8 text-center" />
                  </div>
                  <div>
                    <label className="text-[9px] text-muted-foreground/50 block">Temp (°C)</label>
                    <Input type="number" step="0.1" value={form.simulationData?.vitals?.temp || ''}
                      onChange={(e) => updateVital('temp', e.target.value ? parseFloat(e.target.value) : 0)}
                      placeholder="37.0"
                      className="bg-muted/30 border-border text-xs h-8 text-center" />
                  </div>
                  <div>
                    <label className="text-[9px] text-muted-foreground/50 block">RR (تنفس)</label>
                    <Input type="number" value={form.simulationData?.vitals?.rr || ''}
                      onChange={(e) => updateVital('rr', e.target.value ? parseInt(e.target.value) : 0)}
                      placeholder="16"
                      className="bg-muted/30 border-border text-xs h-8 text-center" />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground/60 mb-1 block">الأعراض (سطر لكل عرض)</label>
                <Textarea value={(form.simulationData?.symptoms || []).join('\n')}
                  onChange={(e) => updateSimulationData('symptoms', e.target.value.split('\n').filter(Boolean))}
                  rows={3} className="bg-muted/30 border-border focus:border-purple-500/50 text-sm resize-none"
                  placeholder="ألم صدري&#10;ضيق تنفس&#10;تعريق" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground/60 mb-1 block">التشخيص</label>
                <Input value={form.simulationData?.diagnosis || ''}
                  onChange={(e) => updateSimulationData('diagnosis', e.target.value)}
                  placeholder="التشخيص المقترح" className="bg-muted/30 border-border focus:border-purple-500/50 text-sm h-9" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground/60 mb-1 block">العلاج</label>
                <Textarea value={form.simulationData?.treatment || ''}
                  onChange={(e) => updateSimulationData('treatment', e.target.value)}
                  rows={2} className="bg-muted/30 border-border focus:border-purple-500/50 text-sm resize-none"
                  placeholder="خطة العلاج المقترحة..." />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground/60 mb-1 block">الإجراءات (سطر لكل إجراء)</label>
                <Textarea value={(form.simulationData?.actions || []).join('\n')}
                  onChange={(e) => updateSimulationData('actions', e.target.value.split('\n').filter(Boolean))}
                  rows={3} className="bg-muted/30 border-border focus:border-purple-500/50 text-sm resize-none"
                  placeholder="فحص أولي&#10;طلب تحاليل&#10;إعطاء أدوية" />
              </div>
            </div>
          )}

          {form.type === 'flashcard' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs text-muted-foreground font-medium">البطاقات التعليمية</label>
                <Button type="button" variant="outline" size="sm" onClick={addFlashcard}
                  className="h-7 text-xs gap-1 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
                  <Plus className="h-3 w-3" />
                  إضافة بطاقة
                </Button>
              </div>
              {(!form.flashcardData || form.flashcardData.length === 0) && (
                <div className="p-4 rounded-lg bg-cyan-500/5 border border-cyan-500/15 text-center">
                  <Layers className="h-8 w-8 text-cyan-400/40 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">لا توجد بطاقات بعد. اضغط &quot;إضافة بطاقة&quot; للبدء</p>
                </div>
              )}
              {(form.flashcardData || []).map((card, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/15 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-400">{'بطاقة ' + (idx + 1)}</span>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeFlashcard(idx)}
                      className="h-6 w-6 hover:bg-red-500/10">
                      <Trash2 className="h-3 w-3 text-red-400" />
                    </Button>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground/60 mb-1 block">الوجه الأمامي</label>
                    <Textarea value={card.front} onChange={(e) => updateFlashcard(idx, 'front', e.target.value)}
                      rows={2} className="bg-muted/30 border-border focus:border-cyan-500/50 text-sm resize-none"
                      placeholder="السؤال أو المصطلح..." />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground/60 mb-1 block">الوجه الخلفي</label>
                    <Textarea value={card.back} onChange={(e) => updateFlashcard(idx, 'back', e.target.value)}
                      rows={2} className="bg-muted/30 border-border focus:border-cyan-500/50 text-sm resize-none"
                      placeholder="الإجابة أو الشرح..." />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 3: Key Points */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 rounded-full bg-amber-400" />
            <span className="text-xs font-bold text-amber-400">النقاط الرئيسية</span>
            <span className="text-[10px] text-muted-foreground/50">(اختياري)</span>
          </div>
          <Textarea value={(form.keyPoints || []).join('\n')} onChange={(e) => setForm({ ...form, keyPoints: e.target.value.split('\n').filter(Boolean) })}
            rows={4} className="bg-muted/30 border-border focus:border-neon-cyan/50 text-sm resize-none"
            placeholder="اكتب كل نقطة في سطر مستقل&#10;مثال:&#10;أهمية التشخيص المبكر&#10;أعراض الأمراض القلبية&#10;طرق الفحص السريري" />
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-5 py-4 border-t border-border flex gap-3 bg-muted/10">
        <Button onClick={() => onSave(form)} disabled={!form.titleAr}
          className="bg-gradient-to-l from-neon-purple to-neon-cyan text-white font-bold hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all h-10 px-6 disabled:opacity-50">
          <Save className="h-4 w-4 ml-1.5" />
          {lesson ? 'حفظ التعديلات' : 'إضافة الدرس'}
        </Button>
        <Button variant="ghost" onClick={onCancel} className="text-muted-foreground hover:text-foreground h-10">إلغاء</Button>
      </div>
    </motion.div>
  )
}

// ─── Theme Toggle Button Component ────────────────────────

function ThemeToggleBtn() {
  const { theme, toggleTheme } = useTheme()
  return (
    <button
      onClick={toggleTheme}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
    >
      {theme === 'dark' ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
      <span className="font-medium">{theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}</span>
    </button>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  MAIN COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function AdminPage() {
  const { user, logout } = useAppStore()
  const unreadCount = useAppStore(s => s.unreadNotificationCount)
  const unreadByCategory = useAppStore(s => s.unreadByCategory)
  const adminNotifications = useAppStore(s => s.notifications)
  const markNotificationRead = useAppStore(s => s.markNotificationRead)
  const markAllNotificationsRead = useAppStore(s => s.markAllNotificationsRead)
  const deleteNotification = useAppStore(s => s.deleteNotification)
  const clearAllNotifications = useAppStore(s => s.clearAllNotifications)
  const authToken = useAppStore(s => s.authToken)
  const { permission, isSubscribed, isSettingUp, requestPermissionAndSubscribe } = usePushNotifications()
  const [adminNotifFilter, setAdminNotifFilter] = useState<string>('all')

  // ─── API Data State ─────────────────────────────────────
  const [courses, setCourses] = useState<ApiCourse[]>([])
  const [dbUsers, setDbUsers] = useState<ApiUser[]>([])
  const [payments, setPayments] = useState<ApiPayment[]>([])
  const [paymentMethods, setPaymentMethods] = useState<ApiPaymentMethod[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // ─── UI State ───────────────────────────────────────────
  const [activeSection, setActiveSection] = useState<AdminSection>('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null)
  const [showAddCourse, setShowAddCourse] = useState(false)
  const [editingCourse, setEditingCourse] = useState<ApiCourse | null>(null)
  const [addingLessonToCourse, setAddingLessonToCourse] = useState<string | null>(null)
  const [editingLesson, setEditingLesson] = useState<{ course: ApiCourse; lesson: ApiLesson } | null>(null)

  const [usersSearch, setUsersSearch] = useState('')
  const [usersPage, setUsersPage] = useState(1)
  const [usersTotal, setUsersTotal] = useState(0)
  const [notifTitle, setNotifTitle] = useState('')
  const [notifMessage, setNotifMessage] = useState('')
  const [sendingNotif, setSendingNotif] = useState(false)
  const [screenshotView, setScreenshotView] = useState<string | null>(null)
  const [activityLogs, setActivityLogs] = useState<any[]>([])
  const [dbStats, setDbStats] = useState<any>(null)
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [dbConfirmOpen, setDbConfirmOpen] = useState(false)
  const [dbOperation, setDbOperation] = useState('')
  const [dbConfirmPassword, setDbConfirmPassword] = useState('')
  const [dbProcessing, setDbProcessing] = useState(false)
  const [adminConfirmAction, setAdminConfirmAction] = useState<ConfirmAction | null>(null)
  const [adminConfirmLoading, setAdminConfirmLoading] = useState(false)

  // Settings state
  const [privacyText, setPrivacyText] = useState('')
  const [aboutText, setAboutText] = useState('')
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [settingsSaving, setSettingsSaving] = useState(false)

  // AI Assistant State
  const [aiEnabled, setAiEnabled] = useState(true)
  const [aiSystemPrompt, setAiSystemPrompt] = useState('')
  const [aiTemperature, setAiTemperature] = useState(0.7)
  const [aiMaxTokens, setAiMaxTokens] = useState(2000)
  const [aiCustomResponses, setAiCustomResponses] = useState<Array<{ keyword: string; response: string }>>([])
  const [aiChatLogs, setAiChatLogs] = useState<any[]>([])
  const [aiChatLogsTotal, setAiChatLogsTotal] = useState(0)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSaving, setAiSaving] = useState(false)
  const [aiTestResult, setAiTestResult] = useState<any>(null)
  const [aiTesting, setAiTesting] = useState(false)
  const [aiFreeLimit, setAiFreeLimit] = useState(5)
  const [aiSubscriptions, setAiSubscriptions] = useState<any[]>([])
  const [aiSubsLoading, setAiSubsLoading] = useState(false)

  // Gift Course State
  const [giftModalOpen, setGiftModalOpen] = useState(false)
  const [giftTargetUser, setGiftTargetUser] = useState<ApiUser | null>(null)
  const [giftSelectedCourses, setGiftSelectedCourses] = useState<Set<string>>(new Set())
  const [giftSending, setGiftSending] = useState(false)
  const [giftResult, setGiftResult] = useState<string | null>(null)

  // ─── API Fetch Functions ────────────────────────────────

  const fetchCourses = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/courses', { headers: getAuthHeaders() })
      const data = await res.json()
      if (data.success) setCourses(data.courses || [])
    } catch (err) { console.error('Fetch courses error:', err) }
  }, [])

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/users?page=${usersPage}&limit=20&search=${usersSearch}`, { headers: getAuthHeaders() })
      const data = await res.json()
      if (data.success) {
        setDbUsers(data.users || [])
        setUsersTotal(data.total || 0)
      }
    } catch (err) { console.error('Fetch users error:', err) }
  }, [usersPage, usersSearch])

  const fetchPayments = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/payments', { headers: getAuthHeaders() })
      const data = await res.json()
      if (data.success) setPayments(data.payments || [])
    } catch (err) { console.error('Fetch payments error:', err) }
  }, [])

  const fetchPaymentMethods = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/payment-methods', { headers: getAuthHeaders() })
      const data = await res.json()
      if (data.success) setPaymentMethods(data.methods || [])
    } catch (err) { console.error('Fetch payment methods error:', err) }
  }, [])

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/stats', { headers: getAuthHeaders() })
      const data = await res.json()
      if (data.success) setStats(data.stats)
    } catch (err) { console.error('Fetch stats error:', err) }
  }, [])

  const fetchActivityLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/activity-logs', { headers: getAuthHeaders() })
      const data = await res.json()
      if (data.success) setActivityLogs(data.logs || [])
    } catch (err) { console.error('Fetch activity logs error:', err) }
  }, [])

  const fetchDbStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/database', { headers: getAuthHeaders() })
      const data = await res.json()
      if (data.success) setDbStats(data.stats)
    } catch (err) { console.error('Fetch db stats error:', err) }
  }, [])

  const fetchSettings = useCallback(async () => {
    setSettingsLoading(true)
    try {
      const [privacyRes, aboutRes] = await Promise.all([
        fetch('/api/settings/privacy'),
        fetch('/api/settings/about'),
      ])
      const privacyData = await privacyRes.json()
      const aboutData = await aboutRes.json()
      setPrivacyText(privacyData.text || '')
      setAboutText(aboutData.text || '')
    } catch (err) { console.error('Fetch settings error:', err) }
    setSettingsLoading(false)
  }, [])

  // Fetch AI settings
  const fetchAiSettings = useCallback(async () => {
    setAiLoading(true)
    try {
      const res = await fetch('/api/admin/ai', { headers: getAuthHeaders() })
      const data = await res.json()
      if (data.success && data.settings) {
        setAiEnabled(data.settings.enabled ?? true)
        setAiSystemPrompt(data.settings.systemPrompt || '')
        setAiTemperature(data.settings.temperature ?? 0.7)
        setAiMaxTokens(data.settings.maxTokens ?? 2000)
        setAiFreeLimit(data.settings.freeMessageLimit ?? 5)
        setAiCustomResponses(data.settings.customResponses || [])
      }
    } catch (err) { console.error('Fetch AI settings error:', err) }
    setAiLoading(false)
  }, [])

  // Fetch AI subscriptions
  const fetchAiSubscriptions = useCallback(async () => {
    setAiSubsLoading(true)
    try {
      const res = await fetch('/api/ai/subscription?status=all', { headers: getAuthHeaders() })
      const data = await res.json()
      if (data.success) {
        setAiSubscriptions(data.subscriptions || [])
      }
    } catch (err) { console.error('Fetch AI subs error:', err) }
    setAiSubsLoading(false)
  }, [])

  // Fetch AI chat logs
  const fetchAiChatLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/ai/history?limit=50', { headers: getAuthHeaders() })
      const data = await res.json()
      if (data.success) {
        setAiChatLogs(data.logs || [])
        setAiChatLogsTotal(data.total || 0)
      }
    } catch (err) { console.error('Fetch AI logs error:', err) }
  }, [])

  // Save AI settings
  const handleSaveAiSettings = async () => {
    setAiSaving(true)
    try {
      const res = await fetch('/api/admin/ai', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          enabled: aiEnabled,
          systemPrompt: aiSystemPrompt,
          provider: 'groq',
          temperature: aiTemperature,
          maxTokens: aiMaxTokens,
          freeMessageLimit: aiFreeLimit,
          customResponses: aiCustomResponses,
        }),
      })
      const data = await res.json()
      if (!data.success) setError(data.error || 'فشل حفظ إعدادات الذكاء الاصطناعي')
    } catch { setError('خطأ في الاتصال') }
    setAiSaving(false)
  }

  // Test AI connection
  const handleTestAiConnection = async () => {
    setAiTesting(true)
    setAiTestResult(null)
    try {
      const res = await fetch('/api/admin/ai/test', {
        method: 'POST',
        headers: getAuthHeaders(),
      })
      const data = await res.json()
      setAiTestResult(data)
    } catch { setAiTestResult({ overallStatus: 'error', message: 'فشل الاتصال بالخادم' }) }
    setAiTesting(false)
  }

  // Clear AI chat logs
  const handleClearAiLogs = async () => {
    try {
      const res = await fetch('/api/admin/ai/history', {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      const data = await res.json()
      if (data.success) { setAiChatLogs([]); setAiChatLogsTotal(0) }
    } catch { setError('خطأ في حذف السجل') }
  }

  const handleSaveSettings = useCallback(async (key: 'privacy' | 'about', text: string) => {
    setSettingsSaving(true)
    try {
      const res = await fetch(`/api/settings/${key}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      if (data.success) {
        if (key === 'privacy') setPrivacyText(text)
        else setAboutText(text)
      } else {
        setError(data.error || 'فشل حفظ الإعدادات')
      }
    } catch { setError('خطأ في الاتصال') }
    setSettingsSaving(false)
  }, [])

  // ─── Initial Data Load (Pre-load ALL data immediately) ───

  const [loadedSections, setLoadedSections] = useState<Set<AdminSection>>(new Set())
  const [sectionLoading, setSectionLoading] = useState<Set<AdminSection>>(new Set())

  // Helper: fetch with timeout to avoid infinite loading
  const fetchWithTimeout = useCallback(async (url: string, timeoutMs = 8000) => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const res = await fetch(url, { headers: getAuthHeaders(), signal: controller.signal })
      clearTimeout(timeoutId)
      return res
    } catch (err: any) {
      clearTimeout(timeoutId)
      if (err.name === 'AbortError') {
        console.error(`Fetch timeout for ${url}`)
      }
      throw err
    }
  }, [])

  // Load data for a specific section
  const loadSectionData = useCallback(async (section: AdminSection) => {
    if (loadedSections.has(section) || sectionLoading.has(section)) return
    setSectionLoading(prev => new Set(prev).add(section))
    try {
      switch (section) {
        case 'overview':
          await Promise.all([fetchStats(), fetchPayments()])
          break
        case 'courses':
          await fetchCourses()
          break
        case 'users':
          await fetchUsers()
          break
        case 'payments':
          await Promise.all([fetchPayments(), courses.length === 0 ? fetchCourses() : Promise.resolve()])
          break
        case 'payment-methods':
          await fetchPaymentMethods()
          break
        case 'activity-logs':
          await fetchActivityLogs()
          break
        case 'database':
          await fetchDbStats()
          break
        case 'settings':
          await fetchSettings()
          break
        case 'ai-assistant':
          await Promise.all([fetchAiSettings(), fetchAiChatLogs(), fetchAiSubscriptions()])
          break
      }
      setLoadedSections(prev => new Set(prev).add(section))
    } catch (err) { console.error('Load section error:', err) }
    setSectionLoading(prev => { const next = new Set(prev); next.delete(section); return next })
  }, [loadedSections, sectionLoading, fetchStats, fetchPayments, fetchCourses, fetchUsers, fetchPaymentMethods])

  // Initial load: fetch ALL data immediately in parallel - no delay
  useEffect(() => {
    const loadAll = async () => {
      const headers = getAuthHeaders()
      try {
        // Fire all requests in parallel for maximum speed
        await Promise.all([
          fetchStats().catch(e => console.error('Stats fetch failed:', e)),
          fetchCourses().catch(e => console.error('Courses fetch failed:', e)),
          fetchUsers().catch(e => console.error('Users fetch failed:', e)),
          fetchPayments().catch(e => console.error('Payments fetch failed:', e)),
          fetchPaymentMethods().catch(e => console.error('PaymentMethods fetch failed:', e)),
        ])
        setLoadedSections(new Set(['overview', 'courses', 'users', 'payments', 'payment-methods']))
      } catch (err) { console.error('Initial load error:', err) }
    }
    loadAll()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Load data when section changes (for sections not pre-loaded)
  useEffect(() => {
    if (!loadedSections.has(activeSection)) {
      loadSectionData(activeSection)
    }
  }, [activeSection]) // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch users when search/page changes (only if users section was loaded)
  useEffect(() => {
    if (!loadedSections.has('users')) return
    const load = async () => {
      try {
        const res = await fetch(`/api/admin/users?page=${usersPage}&limit=20&search=${usersSearch}`, { headers: getAuthHeaders() })
        const data = await res.json()
        if (data.success) {
          setDbUsers(data.users || [])
          setUsersTotal(data.total || 0)
        }
      } catch (err) { console.error('Fetch users error:', err) }
    }
    load()
  }, [usersPage, usersSearch])

  // ─── CRUD Operations ────────────────────────────────────

  const handleCreateCourse = async (formData: any) => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/courses', {
        method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (data.success) { setShowAddCourse(false); await fetchCourses() }
      else setError(data.error || 'فشل إضافة الدورة')
    } catch { setError('خطأ في الاتصال') }
    setSaving(false)
  }

  const handleUpdateCourse = async (formData: any) => {
    if (!editingCourse) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/courses', {
        method: 'PUT', headers: getAuthHeaders(),
        body: JSON.stringify({ courseId: editingCourse._id, ...formData }),
      })
      const data = await res.json()
      if (data.success) { setEditingCourse(null); await fetchCourses() }
      else setError(data.error || 'فشل تعديل الدورة')
    } catch { setError('خطأ في الاتصال') }
    setSaving(false)
  }

  const handleDeleteCourse = (courseId: string) => {
    setAdminConfirmAction({
      type: 'delete',
      title: 'حذف الدورة',
      message: 'هل أنت متأكد من حذف هذه الدورة؟',
      details: 'سيتم حذف جميع الدروس والتسجيلات المرتبطة بها نهائياً.',
      confirmLabel: 'حذف الدورة',
      onConfirm: async () => {
        setAdminConfirmLoading(true)
        setSaving(true)
        try {
          const res = await fetch('/api/admin/courses', {
            method: 'DELETE', headers: getAuthHeaders(), body: JSON.stringify({ courseId }),
          })
          const data = await res.json()
          if (data.success) { setExpandedCourseId(null); await fetchCourses() }
          else setError(data.error || 'فشل حذف الدورة')
        } catch { setError('خطأ في الاتصال') }
        setSaving(false)
        setAdminConfirmLoading(false)
        setAdminConfirmAction(null)
      },
    })
  }

  const handleAddLesson = async (formData: ApiLesson, courseId: string) => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/lessons', {
        method: 'POST', headers: getAuthHeaders(),
        body: JSON.stringify({ courseId, lesson: formData }),
      })
      const data = await res.json()
      if (data.success) { setAddingLessonToCourse(null); await fetchCourses() }
      else setError(data.error || 'فشل إضافة الدرس')
    } catch { setError('خطأ في الاتصال') }
    setSaving(false)
  }

  const handleUpdateLesson = async (formData: ApiLesson) => {
    if (!editingLesson) return
    setSaving(true)
    setError('')
    try {
      const payload = { courseId: editingLesson.course._id, lessonId: editingLesson.lesson.id, updates: formData }
      console.log('Updating lesson:', payload)
      const res = await fetch('/api/admin/lessons', {
        method: 'PUT', headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      console.log('Update lesson response:', data)
      if (data.success) { setEditingLesson(null); await fetchCourses() }
      else setError(data.error || 'فشل تعديل الدرس')
    } catch (e) { console.error('Update lesson error:', e); setError('خطأ في الاتصال') }
    setSaving(false)
  }

  const handleDeleteLesson = (courseId: string, lessonId: string) => {
    setAdminConfirmAction({
      type: 'delete',
      title: 'حذف الدرس',
      message: 'هل أنت متأكد من حذف هذا الدرس؟',
      details: 'سيتم حذف الدرس نهائياً ولا يمكن التراجع عن هذا الإجراء.',
      confirmLabel: 'حذف الدرس',
      onConfirm: async () => {
        setAdminConfirmLoading(true)
        setSaving(true)
        try {
          const res = await fetch('/api/admin/lessons', {
            method: 'DELETE', headers: getAuthHeaders(),
            body: JSON.stringify({ courseId, lessonId }),
          })
          const data = await res.json()
          if (data.success) { await fetchCourses() }
          else setError(data.error || 'فشل حذف الدرس')
        } catch { setError('خطأ في الاتصال') }
        setSaving(false)
        setAdminConfirmLoading(false)
        setAdminConfirmAction(null)
      },
    })
  }

  const handleApprovePayment = async (paymentId: string, status: 'approved' | 'rejected', note?: string) => {
    setSaving(true)
    try {
      const payment = payments.find(p => p._id === paymentId)

      // Main API call - must succeed first
      const res = await fetch('/api/admin/payments', {
        method: 'PUT', headers: getAuthHeaders(),
        body: JSON.stringify({ paymentId, status, adminNote: note || '' }),
      })
      const data = await res.json()
      if (data.success) {
        // Run all secondary operations in parallel (non-blocking)
        Promise.all([
          fetchPayments(),
          fetchStats(),
          // Log activity (non-critical)
          fetch('/api/admin/activity-logs', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
              action: status === 'approved' ? 'payment_approved' : 'payment_rejected',
              adminName: user?.name || 'المدير',
              details: { paymentId, userName: payment?.userName, amount: payment?.amount, courseName: payment?.courseName },
            }),
          }).catch(() => {}),
          // Send notification to user (API already sends via createNotification, this is a duplicate - keep for safety)
          payment?.userId ? fetch('/api/notifications', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
              userId: payment.userId,
              title: status === 'approved' ? 'تم تفعيل الدورة ✅' : 'تم رفض الدفع ❌',
              message: status === 'approved'
                ? `تمت الموافقة على دفعتك لدورة "${payment.courseName || 'الدورة'}". يمكنك الآن الوصول للمحتوى!`
                : `تم رفض دفعتك لدورة "${payment.courseName || 'الدورة'}". يرجى التواصل مع الإدارة.`,
              type: status === 'approved' ? 'success' : 'warning',
            }),
          }).catch(() => {}) : Promise.resolve(),
        ]).catch(() => {})
      }
      else setError(data.error || 'فشل تحديث الدفع')
    } catch { setError('خطأ في الاتصال') }
    setSaving(false)
  }

  const handleDeleteUser = (userId: string) => {
    setAdminConfirmAction({
      type: 'delete',
      title: 'حذف المستخدم',
      message: 'هل أنت متأكد من حذف هذا المستخدم؟',
      details: 'سيتم حذف حساب المستخدم وجميع بياناته نهائياً.',
      confirmLabel: 'حذف المستخدم',
      onConfirm: async () => {
        setAdminConfirmLoading(true)
        setSaving(true)
        try {
          const res = await fetch('/api/admin/users', {
            method: 'DELETE', headers: getAuthHeaders(), body: JSON.stringify({ userId }),
          })
          const data = await res.json()
          if (data.success) await fetchUsers()
          else setError(data.error || 'فشل حذف المستخدم')
        } catch { setError('خطأ في الاتصال') }
        setSaving(false)
        setAdminConfirmLoading(false)
        setAdminConfirmAction(null)
      },
    })
  }

  // ─── Gift Course Logic ────────────────────────────────────
  const openGiftModal = (user: ApiUser) => {
    setGiftTargetUser(user)
    setGiftSelectedCourses(new Set())
    setGiftResult(null)
    setGiftModalOpen(true)
  }

  const toggleGiftCourse = (courseId: string) => {
    setGiftSelectedCourses(prev => {
      const next = new Set(prev)
      if (next.has(courseId)) next.delete(courseId)
      else next.add(courseId)
      return next
    })
  }

  const handleGiftCourses = async () => {
    if (!giftTargetUser || giftSelectedCourses.size === 0) return
    setGiftSending(true)
    setGiftResult(null)
    try {
      const res = await fetch('/api/admin/gift-course', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          userId: giftTargetUser._id,
          courseIds: Array.from(giftSelectedCourses),
        }),
      })
      const data = await res.json()
      if (data.success) {
        const gifted = data.results?.filter((r: any) => r.status === 'gifted') || []
        const already = data.results?.filter((r: any) => r.status === 'already_enrolled') || []
        let msg = ''
        if (gifted.length > 0) msg += `تم إهداء ${gifted.length} دورة بنجاح`
        if (already.length > 0) msg += `${msg ? '. ' : ''}${already.length} دورة مسجل بها مسبقاً`
        setGiftResult(msg || data.message)
        await fetchUsers()
      } else {
        setGiftResult(data.error || 'فشل في إهداء الدورات')
      }
    } catch {
      setGiftResult('خطأ في الاتصال')
    }
    setGiftSending(false)
  }

  const handleTogglePublish = async (course: ApiCourse) => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/courses', {
        method: 'PUT', headers: getAuthHeaders(),
        body: JSON.stringify({ courseId: course._id, published: !course.published }),
      })
      const data = await res.json()
      if (data.success) await fetchCourses()
      else setError(data.error || 'فشل تحديث الحالة')
    } catch { setError('خطأ في الاتصال') }
    setSaving(false)
  }

  const handleSendNotif = async () => {
    if (!notifTitle.trim() || !notifMessage.trim()) return
    setSendingNotif(true)
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ title: notifTitle, message: notifMessage, type: 'info', broadcast: true }),
      })
      const data = await res.json()
      if (data.success) {
        setNotifTitle('')
        setNotifMessage('')
      } else {
        setError(data.error || 'فشل إرسال الإشعار')
      }
    } catch { setError('خطأ في الاتصال') }
    setSendingNotif(false)
  }

  const handleDbOperation = async () => {
    setDbProcessing(true)
    try {
      const res = await fetch('/api/admin/database', {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({ operation: dbOperation, confirmed: true }),
      })
      const data = await res.json()
      if (data.success) {
        setDbConfirmOpen(false)
        setDbOperation('')
        setDbConfirmPassword('')
        await fetchDbStats()
      } else {
        setError(data.error || 'فشل تنفيذ العملية')
      }
    } catch { setError('خطأ في الاتصال') }
    setDbProcessing(false)
  }

  const handleRefreshAll = () => {
    // Reset loaded sections and reload current section
    setLoadedSections(new Set())
    loadSectionData(activeSection)
  }

  const handleSectionChange = (section: AdminSection) => {
    setActiveSection(section)
    setSidebarOpen(false)
  }

  // ─── Computed ───────────────────────────────────────────

  const totalLessons = courses.reduce((sum, c) => sum + (c.lessonsData?.length || 0), 0)
  const freeLessons = courses.reduce((sum, c) => sum + (c.lessonsData?.filter(l => l.isFree).length || 0), 0)
  const paidLessons = totalLessons - freeLessons

  // Course name lookup map for payments
  const courseNameMap = useMemo(() => {
    const map = new Map<string, string>()
    courses.forEach(c => map.set(c._id, c.titleAr || c.title))
    return map
  }, [courses])

  // Memoized payment filters
  const pendingPayments = useMemo(() => payments.filter(p => p.status === 'pending'), [payments])
  const approvedPayments = useMemo(() => payments.filter(p => p.status === 'approved'), [payments])
  const rejectedPayments = useMemo(() => payments.filter(p => p.status === 'rejected'), [payments])
  const filteredPayments = useMemo(() => payments.filter(p => paymentFilter === 'all' || p.status === paymentFilter), [payments, paymentFilter])

  // ─── Sidebar Content (shared between desktop and mobile) ──

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-400/10 border border-cyan-500/30 flex items-center justify-center">
            <Shield className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-base font-black bg-gradient-to-l from-cyan-300 to-cyan-500 bg-clip-text text-transparent">
              أكاديمية نبض
            </h2>
            <p className="text-[10px] text-muted-foreground">لوحة التحكم الإدارية</p>
          </div>
        </div>
      </div>

      <Separator className="bg-muted/50 mx-3 w-auto" />

      {/* Admin User Card */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-500/30 flex items-center justify-center text-sm font-bold shrink-0">
            {user?.name?.charAt(0) || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{user?.name || 'المدير'}</p>
            <Badge className="bg-cyan-500/15 text-cyan-400 border border-cyan-500/25 text-[9px] h-5">
              <Shield className="h-2.5 w-2.5 ml-0.5" /> مدير النظام
            </Badge>
          </div>
        </div>
      </div>

      {/* System Status + Notification Bell */}
      <div className="px-4 pb-2 flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-neon-green/5 border border-neon-green/10">
          <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
          <span className="text-[11px] text-neon-green font-medium">النظام يعمل</span>
        </div>
        <NotificationBell />
      </div>

      <Separator className="bg-muted/50 mx-3 w-auto" />

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        <p className="text-[10px] text-muted-foreground/50 font-semibold uppercase tracking-wider px-3 mb-2">
          القائمة الرئيسية
        </p>
        {sidebarItems.map((item) => {
          const isActive = activeSection === item.id
          return (
            <button
              key={item.id}
              onClick={() => handleSectionChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 relative group ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {/* Active indicator bar on the right (RTL) */}
              {isActive && (
                <motion.div
                  layoutId="admin-sidebar-indicator"
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-l-full bg-cyan-400"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <item.icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-cyan-400' : 'text-muted-foreground group-hover:text-foreground'}`} />
              <span className="font-medium">{item.label}</span>
              {item.id === 'payments' && pendingPayments.length > 0 && (
                <Badge className="mr-auto bg-neon-orange/15 text-neon-orange border border-neon-orange/25 text-[9px] h-5 min-w-[20px] flex items-center justify-center">
                  {pendingPayments.length}
                </Badge>
              )}
              {item.id === 'notifications' && unreadCount > 0 && (
                <Badge className="mr-auto bg-red-500/15 text-red-400 border border-red-500/25 text-[9px] h-5 min-w-[20px] flex items-center justify-center">
                  {unreadCount}
                </Badge>
              )}
            </button>
          )
        })}
      </nav>

      <Separator className="bg-muted/50 mx-3 w-auto" />

      {/* Bottom Actions */}
      <div className="p-3 space-y-2">
        {/* Theme Toggle */}
        <ThemeToggleBtn />

        {/* Refresh */}
        <button
          onClick={handleRefreshAll}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
        >
          <RefreshCw className="h-4 w-4 shrink-0" />
          <span className="font-medium">تحديث البيانات</span>
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-all"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span className="font-medium">تسجيل الخروج</span>
        </button>
      </div>
    </div>
  )

  // ─── Section Renderers ──────────────────────────────────

  const renderOverview = () => (
    <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }} className="space-y-6">

      {/* Page Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black neon-text flex items-center gap-3">
          <Activity className="h-6 w-6 text-neon-cyan" /> نظرة عامة
        </h1>
        <p className="text-sm text-muted-foreground mt-1">ملخص إحصائيات المنصة والنشاط</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { title: 'إجمالي المستخدمين', value: stats?.totalUsers?.toLocaleString() || '0', icon: Users, color: 'text-neon-cyan', bg: 'bg-neon-cyan/10', border: 'border-neon-cyan/20' },
          { title: 'الدورات', value: String(stats?.totalCourses || 0), icon: BookOpen, color: 'text-neon-purple', bg: 'bg-neon-purple/10', border: 'border-neon-purple/20' },
          { title: 'الإيرادات', value: `${(stats?.totalRevenue || 0).toLocaleString()} ر.ي`, icon: DollarSign, color: 'text-neon-green', bg: 'bg-neon-green/10', border: 'border-neon-green/20' },
          { title: 'مدفوعات معلقة', value: String(stats?.pendingPayments || 0), icon: Clock, color: 'text-neon-orange', bg: 'bg-neon-orange/10', border: 'border-neon-orange/20' },
        ].map((item, idx) => (
          <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}
            whileHover={cardHover} className="glass-card p-4 sm:p-5">
            <div className={`rounded-xl p-2 ${item.bg} ${item.border} border inline-block mb-2`}>
              <item.icon className={`h-4 w-4 ${item.color}`} />
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">{item.title}</p>
            <p className="text-lg sm:text-2xl font-black neon-text mt-1">{item.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Recent Stats + Notification Sender */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants} className="glass-card p-5">
          <h2 className="text-base font-bold flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-neon-cyan" /> إحصائيات اليوم
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
              <span className="text-sm text-muted-foreground">مستخدمين جدد اليوم</span>
              <span className="font-bold text-neon-cyan">{stats?.newUsersToday || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
              <span className="text-sm text-muted-foreground">مدفوعات معلقة اليوم</span>
              <span className="font-bold text-neon-orange">{stats?.pendingPaymentsToday || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
              <span className="text-sm text-muted-foreground">إجمالي المدفوعات المقبولة</span>
              <span className="font-bold text-neon-green">{stats?.approvedPayments || 0}</span>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-card p-5 gradient-border">
          <h2 className="text-base font-bold flex items-center gap-2 mb-4">
            <Bell className="h-5 w-5 text-neon-pink" /> إرسال إشعار
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">العنوان</label>
              <Input value={notifTitle} onChange={(e) => setNotifTitle(e.target.value)} placeholder="عنوان الإشعار..."
                className="bg-muted/50 border-border focus:border-neon-cyan/50 text-sm h-9" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">الرسالة</label>
              <Textarea value={notifMessage} onChange={(e) => setNotifMessage(e.target.value)} placeholder="نص الإشعار..." rows={3}
                className="bg-muted/50 border-border focus:border-neon-cyan/50 text-sm resize-none" />
            </div>
            <Button onClick={handleSendNotif} disabled={sendingNotif || !notifTitle.trim() || !notifMessage.trim()}
              className="w-full bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/25 transition-all h-10">
              {sendingNotif ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (<><Send className="h-4 w-4 ml-2" /> إرسال الإشعار</>)}
            </Button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )

  const renderCourses = () => (
    <motion.div key="courses" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }} className="space-y-6">

      {/* Page Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black neon-text flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-neon-cyan" /> الدورات والدروس
        </h1>
        <p className="text-sm text-muted-foreground mt-1">إدارة الدورات التعليمية ومحتواها</p>
      </div>

      {/* Course Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[
          { title: 'إجمالي الدورات', value: String(courses.length), icon: BookOpen, color: 'text-neon-cyan', bg: 'bg-neon-cyan/10', border: 'border-neon-cyan/20' },
          { title: 'إجمالي الدروس', value: String(totalLessons), icon: FileText, color: 'text-neon-purple', bg: 'bg-neon-purple/10', border: 'border-neon-purple/20' },
          { title: 'الدروس المجانية', value: String(freeLessons), icon: CheckCircle2, color: 'text-neon-green', bg: 'bg-neon-green/10', border: 'border-neon-green/20' },
          { title: 'الدروس المدفوعة', value: String(paidLessons), icon: Star, color: 'text-neon-orange', bg: 'bg-neon-orange/10', border: 'border-neon-orange/20' },
        ].map((item, idx) => (
          <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}
            whileHover={cardHover} className="glass-card p-3 sm:p-5">
            <div className={`rounded-lg sm:rounded-xl p-1.5 sm:p-2 ${item.bg} ${item.border} border inline-block mb-1 sm:mb-2`}>
              <item.icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${item.color}`} />
            </div>
            <p className="text-[11px] sm:text-sm text-muted-foreground">{item.title}</p>
            <p className="text-lg sm:text-2xl font-black neon-text mt-0.5 sm:mt-1">{item.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Add Course Button */}
      <div className="flex items-center gap-3">
        <Button onClick={() => setShowAddCourse(true)} disabled={showAddCourse || !!editingCourse}
          className="bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/25 transition-all h-9">
          <Plus className="h-4 w-4 ml-1" /> إضافة دورة جديدة
        </Button>
        {saving && <Loader2 className="h-4 w-4 animate-spin text-neon-cyan" />}
      </div>

      {/* Add Course Form */}
      <AnimatePresence>
        {showAddCourse && (
          <CourseForm onSave={handleCreateCourse} onCancel={() => setShowAddCourse(false)} />
        )}
      </AnimatePresence>

      {/* Edit Course Form */}
      <AnimatePresence>
        {editingCourse && (
          <CourseForm course={editingCourse} onSave={handleUpdateCourse} onCancel={() => setEditingCourse(null)} />
        )}
      </AnimatePresence>

      {/* Courses List */}
      {courses.length === 0 ? (
        <div className="glass-card p-8 sm:p-12 text-center">
          <BookOpen className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 opacity-30 text-muted-foreground" />
          <p className="text-sm sm:text-base text-muted-foreground mb-4">لا توجد دورات بعد. أضف أول دورة!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {courses.map((course, courseIdx) => {
            const courseLessons = course.lessonsData || []
            const isExpanded = expandedCourseId === course._id

            return (
              <motion.div key={course._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: courseIdx * 0.03 }} className="glass-card overflow-hidden">

                {/* Course Header */}
                <div className="p-3 sm:p-4">
                  <div className="flex items-start gap-2 sm:gap-3">
                    {/* Course number */}
                    <div className={`w-7 h-7 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br ${getCategoryColor(course.category)} border flex items-center justify-center text-xs sm:text-base font-bold shrink-0`}>
                      {courseIdx + 1}
                    </div>
                    {/* Course info - tappable to expand */}
                    <button onClick={() => setExpandedCourseId(isExpanded ? null : course._id)}
                      className="flex-1 min-w-0 text-right hover:bg-muted rounded-lg transition-colors">
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                        <h3 className="font-bold text-xs sm:text-sm truncate max-w-[140px] sm:max-w-none">{course.titleAr}</h3>
                        <Badge className="bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 text-[7px] sm:text-[8px] px-1 shrink-0">
                          {getCategoryLabel(course.category)}
                        </Badge>
                        {!course.published && (
                          <Badge className="bg-neon-orange/10 text-neon-orange border border-neon-orange/20 text-[7px] sm:text-[8px] px-1 shrink-0">مسودة</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 text-[9px] sm:text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-0.5"><FileText className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> {courseLessons.length} درس</span>
                        <span className="flex items-center gap-0.5"><Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-amber-400" /> {course.rating}</span>
                        <span className={`${getLevelColor(course.level)} font-medium`}>{getLevelLabel(course.level)}</span>
                      </div>
                    </button>
                    {/* Price + expand chevron + action buttons - compact on mobile */}
                    <div className="flex items-center gap-0.5 sm:gap-1.5 shrink-0">
                      {course.isPremium ? (
                        <Badge className="bg-neon-orange/15 text-neon-orange border border-neon-orange/25 text-[7px] sm:text-[9px] px-1">
                          {course.price.toLocaleString()} ر.ي
                        </Badge>
                      ) : (
                        <Badge className="bg-neon-green/15 text-neon-green border border-neon-green/25 text-[7px] sm:text-[9px] px-1">مجاني</Badge>
                      )}
                      <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }} className="hidden sm:block">
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </motion.div>
                      <Button variant="ghost" size="icon" onClick={() => handleTogglePublish(course)}
                        className="h-6 w-6 sm:h-7 sm:w-7" title={course.published ? 'إلغاء النشر' : 'نشر'}>
                        {course.published ? (
                          <ToggleRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-neon-green" />
                        ) : (
                          <ToggleLeft className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground" />
                        )}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { setEditingCourse(course); setShowAddCourse(false) }}
                        className="h-6 w-6 sm:h-7 sm:w-7 hover:bg-neon-cyan/10">
                        <Edit3 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-neon-cyan" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteCourse(course._id)}
                        className="h-6 w-6 sm:h-7 sm:w-7 hover:bg-red-500/10">
                        <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-red-400" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Expandable Lessons List */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }} className="overflow-hidden">
                      <div className="px-2 sm:px-5 pb-3 sm:pb-5 space-y-2 border-t border-border pt-3 sm:pt-4 overflow-x-auto">
                        {/* Lessons count + Add Lesson Button */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-2 sm:px-3 py-2 rounded-lg bg-muted/50 text-xs text-muted-foreground gap-2">
                          <span className="text-[10px] sm:text-xs">دروس هذه الدورة ({courseLessons.length})</span>
                          <div className="flex items-center gap-1.5 sm:gap-3 flex-wrap">
                            <span className="flex items-center gap-0.5 text-[9px] sm:text-xs">
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-neon-green" /> مجاني: {courseLessons.filter(l => l.isFree).length}
                            </span>
                            <span className="flex items-center gap-0.5 text-[9px] sm:text-xs">
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-neon-orange" /> مدفوع: {courseLessons.filter(l => !l.isFree).length}
                            </span>
                            <Button onClick={() => setAddingLessonToCourse(course._id)}
                              className="h-6 sm:h-7 text-[9px] sm:text-xs bg-neon-purple/15 text-neon-purple border border-neon-purple/30 hover:bg-neon-purple/25 px-1.5 sm:px-3">
                              <Plus className="h-2.5 w-2.5 sm:h-3 sm:w-3 ml-0.5 sm:ml-1" /> إضافة درس
                            </Button>
                          </div>
                        </div>

                        {/* Add Lesson Form */}
                        <AnimatePresence>
                          {addingLessonToCourse === course._id && (
                            <LessonForm courseId={course._id}
                              nextOrder={courseLessons.length + 1}
                              onSave={(data) => handleAddLesson(data, course._id)}
                              onCancel={() => setAddingLessonToCourse(null)} />
                          )}
                        </AnimatePresence>

                        {courseLessons.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">لا توجد دروس لهذه الدورة بعد</p>
                          </div>
                        ) : (
                          courseLessons.sort((a, b) => a.order - b.order).map((lesson, lessonIdx) => (
                            <div key={lesson.id}>
                              {/* Edit Lesson Form */}
                              {editingLesson?.lesson.id === lesson.id ? (
                                <LessonForm lesson={lesson} courseId={course._id}
                                  nextOrder={courseLessons.length + 1}
                                  onSave={handleUpdateLesson}
                                  onCancel={() => setEditingLesson(null)} />
                              ) : (
                                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: lessonIdx * 0.02 }}
                                  className={`p-2 sm:p-3 rounded-xl hover:bg-muted/50 transition-all group border border-transparent hover:border-border/50 ${
                                    lesson.isFree ? '' : 'border-l-2 border-l-amber-500/30'
                                  }`}>
                                  <div className="flex items-center gap-2 sm:gap-3">
                                    {/* Order + Type */}
                                    <div className="flex flex-col items-center gap-1 shrink-0">
                                      <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-[10px] sm:text-xs font-bold shrink-0 ${
                                        lesson.isFree ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                                      }`}>
                                        {lesson.order}
                                      </div>
                                      <span className="text-[8px] sm:text-[10px] text-muted-foreground">{lesson.duration}د</span>
                                    </div>
                                    {/* Title + meta */}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs sm:text-sm font-semibold truncate">{lesson.titleAr}</p>
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="shrink-0">{getLessonTypeIcon(lesson.type)}</span>
                                        <span className="text-[9px] sm:text-xs text-muted-foreground">{getLessonTypeLabel(lesson.type)}</span>
                                        {lesson.isFree ? (
                                          <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[7px] sm:text-[9px] px-1.5 shrink-0">مجاني</Badge>
                                        ) : (
                                          <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[7px] sm:text-[9px] px-1.5 shrink-0">مدفوع</Badge>
                                        )}
                                      </div>
                                    </div>
                                    {/* Actions */}
                                    <div className="flex items-center gap-0.5 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity">
                                      <Button variant="ghost" size="icon"
                                        onClick={() => setEditingLesson({ course, lesson })}
                                        className="h-7 w-7 sm:h-8 sm:w-8 hover:bg-neon-cyan/10 rounded-lg">
                                        <Edit3 className="h-3.5 w-3.5 text-neon-cyan" />
                                      </Button>
                                      <Button variant="ghost" size="icon"
                                        onClick={() => handleDeleteLesson(course._id, lesson.id)}
                                        className="h-7 w-7 sm:h-8 sm:w-8 hover:bg-red-500/10 rounded-lg">
                                        <Trash2 className="h-3.5 w-3.5 text-red-400" />
                                      </Button>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      )}
    </motion.div>
  )

  const renderUsers = () => (
    <motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }} className="space-y-6">

      {/* Page Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black neon-text flex items-center gap-3">
          <Users className="h-6 w-6 text-neon-cyan" /> المستخدمين
        </h1>
        <p className="text-sm text-muted-foreground mt-1">إدارة المستخدمين المسجلين في المنصة</p>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="flex-1 max-w-sm">
          <Input placeholder="بحث بالاسم أو الرقم..." value={usersSearch}
            onChange={(e) => { setUsersSearch(e.target.value); setUsersPage(1) }}
            className="bg-muted/50 border-border focus:border-neon-cyan/50 text-sm h-9" />
        </div>
        <Badge className="bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 text-[10px]">
          {usersTotal} مستخدم
        </Badge>
      </div>

      {/* Desktop Table - Fixed overflow */}
      <motion.div variants={itemVariants} className="glass-card p-4 sm:p-5 neon-glow overflow-hidden hidden sm:block">
        <div className="max-h-[560px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="text-neon-cyan/70 text-xs font-semibold">المستخدم</TableHead>
                <TableHead className="text-neon-cyan/70 text-xs font-semibold text-center">الرقم</TableHead>
                <TableHead className="text-neon-cyan/70 text-xs font-semibold text-center">الدورات</TableHead>
                <TableHead className="text-neon-cyan/70 text-xs font-semibold text-center">المدفوعات</TableHead>
                <TableHead className="text-neon-cyan/70 text-xs font-semibold text-center">XP</TableHead>
                <TableHead className="text-neon-cyan/70 text-xs font-semibold text-center">إجراء</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dbUsers.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">لا يوجد مستخدمون</TableCell></TableRow>
              ) : dbUsers.map((u) => (
                <TableRow key={u._id} className="border-b border-border hover:bg-muted transition-colors">
                  <TableCell className="font-semibold text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-600/20 flex items-center justify-center text-xs">
                        {u.name?.charAt(0) || '?'}
                      </div>
                      {u.name || 'بدون اسم'}
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-sm text-muted-foreground" dir="ltr">{u.phone}</TableCell>
                  <TableCell className="text-center text-sm">{u.enrollmentCount || 0}</TableCell>
                  <TableCell className="text-center text-sm">{u.paymentCount || 0}</TableCell>
                  <TableCell className="text-center text-sm font-semibold text-neon-cyan">{(u.xp || 0).toLocaleString()}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openGiftModal(u)}
                        className="h-7 w-7 hover:bg-purple-500/10" title="إهداء دورة">
                        <Gift className="h-3.5 w-3.5 text-purple-400" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(u._id)}
                        className="h-7 w-7 hover:bg-red-500/10"><Trash2 className="h-3.5 w-3.5 text-red-400" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {/* Pagination */}
        {usersTotal > 20 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <Button variant="ghost" size="sm" disabled={usersPage <= 1}
              onClick={() => setUsersPage(p => p - 1)} className="text-xs">السابق</Button>
            <span className="text-xs text-muted-foreground">صفحة {usersPage} من {Math.ceil(usersTotal / 20)}</span>
            <Button variant="ghost" size="sm" disabled={usersPage >= Math.ceil(usersTotal / 20)}
              onClick={() => setUsersPage(p => p + 1)} className="text-xs">التالي</Button>
          </div>
        )}
      </motion.div>

      {/* Mobile Cards - Fixed overflow */}
      <div className="sm:hidden max-h-[calc(100vh-260px)] overflow-y-auto space-y-3" style={{ scrollbarWidth: 'thin', WebkitOverflowScrolling: 'touch' }}>
        {dbUsers.length === 0 ? (
          <div className="glass-card p-8 text-center text-muted-foreground">لا يوجد مستخدمون</div>
        ) : dbUsers.map((u) => (
          <div key={u._id} className="glass-card p-3 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-600/20 flex items-center justify-center text-xs shrink-0">
                {u.name?.charAt(0) || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{u.name || 'بدون اسم'}</p>
                <p className="text-xs text-muted-foreground" dir="ltr">{u.phone}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => openGiftModal(u)}
                className="h-7 w-7 hover:bg-purple-500/10 shrink-0" title="إهداء دورة">
                <Gift className="h-3.5 w-3.5 text-purple-400" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(u._id)}
                className="h-7 w-7 hover:bg-red-500/10 shrink-0"><Trash2 className="h-3.5 w-3.5 text-red-400" /></Button>
            </div>
            <div className="flex items-center gap-2 text-xs flex-wrap">
              <Badge className="bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 text-[9px]">
                {u.enrollmentCount || 0} دورات
              </Badge>
              <span className="text-neon-cyan font-semibold">{(u.xp || 0).toLocaleString()} XP</span>
            </div>
          </div>
        ))}
        {/* Mobile Pagination */}
        {usersTotal > 20 && (
          <div className="flex items-center justify-center gap-2 py-3">
            <Button variant="ghost" size="sm" disabled={usersPage <= 1}
              onClick={() => setUsersPage(p => p - 1)} className="text-xs h-8">السابق</Button>
            <span className="text-xs text-muted-foreground">{usersPage}/{Math.ceil(usersTotal / 20)}</span>
            <Button variant="ghost" size="sm" disabled={usersPage >= Math.ceil(usersTotal / 20)}
              onClick={() => setUsersPage(p => p + 1)} className="text-xs h-8">التالي</Button>
          </div>
        )}
      </div>

      {/* Gift Course Modal */}
      <AnimatePresence>
        {giftModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => { if (!giftSending) setGiftModalOpen(false) }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="glass-card border border-purple-500/30 w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-5 border-b border-purple-500/20 bg-gradient-to-l from-purple-500/10 to-cyan-500/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                    <Gift className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">إهداء دورة</h3>
                    <p className="text-xs text-muted-foreground">
                      إهداء دورة للمستخدم: <span className="text-purple-400 font-semibold">{giftTargetUser?.name || giftTargetUser?.phone}</span>
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setGiftModalOpen(false)} disabled={giftSending}
                    className="mr-auto h-8 w-8 hover:bg-white/10">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Course List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2" style={{ scrollbarWidth: 'thin' }}>
                {courses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">لا توجد دورات متاحة</div>
                ) : courses.filter(c => c.published).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">لا توجد دورات منشورة</div>
                ) : (
                  courses.filter(c => c.published).map(course => {
                    const isSelected = giftSelectedCourses.has(course._id)
                    return (
                      <button
                        key={course._id}
                        onClick={() => toggleGiftCourse(course._id)}
                        className={`w-full text-right p-3 rounded-xl border transition-all flex items-center gap-3 ${
                          isSelected
                            ? 'border-purple-500/50 bg-purple-500/10'
                            : 'border-border bg-background/30 hover:bg-background/50'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
                          isSelected
                            ? 'bg-purple-500/30 border-purple-500/50'
                            : 'bg-white/5 border-white/10'
                        }`}>
                          {isSelected ? (
                            <CheckCircle2 className="h-4 w-4 text-purple-400" />
                          ) : (
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{course.titleAr || course.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-muted-foreground">{course.instructorName}</span>
                            <span className="text-[10px] text-muted-foreground">·</span>
                            <span className="text-[10px] text-muted-foreground">{course.price === 0 ? 'مجانية' : `${course.price.toLocaleString()} ر.ي`}</span>
                          </div>
                        </div>
                        {isSelected && (
                          <Gift className="h-4 w-4 text-purple-400 shrink-0" />
                        )}
                      </button>
                    )
                  })
                )}
              </div>

              {/* Result Message */}
              {giftResult && (
                <div className="px-5 py-3 bg-purple-500/10 border-t border-purple-500/20">
                  <p className="text-sm text-purple-300 text-center">{giftResult}</p>
                </div>
              )}

              {/* Footer */}
              <div className="p-4 border-t border-purple-500/20 flex items-center gap-3">
                <div className="flex-1 text-xs text-muted-foreground">
                  {giftSelectedCourses.size > 0 ? (
                    <span className="text-purple-400 font-semibold">تم اختيار {giftSelectedCourses.size} دورة</span>
                  ) : (
                    'اختر دورة واحدة أو أكثر'
                  )}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setGiftModalOpen(false)}
                  disabled={giftSending}
                  className="text-xs"
                >
                  إلغاء
                </Button>
                <Button
                  onClick={handleGiftCourses}
                  disabled={giftSending || giftSelectedCourses.size === 0}
                  className="bg-gradient-to-l from-purple-500 to-cyan-500 text-white text-xs gap-2 hover:opacity-90"
                >
                  {giftSending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Gift className="h-3.5 w-3.5" />
                  )}
                  تأكيد الإهداء
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )

  // Helper: get course name for a payment
  const getPaymentCourseName = useCallback((payment: ApiPayment) => {
    if (payment.courseName) return payment.courseName
    return courseNameMap.get(payment.courseId) || ''
  }, [courseNameMap])

  const renderPayments = () => (
    <motion.div key="payments" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }} className="space-y-6">

      {/* Page Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black neon-text flex items-center gap-3">
          <CreditCard className="h-6 w-6 text-neon-cyan" /> المدفوعات
        </h1>
        <p className="text-sm text-muted-foreground mt-1">مراجعة وإدارة المدفوعات والتحويلات</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={cardHover} className="glass-card p-4 sm:p-5">
          <div className="rounded-xl p-2 bg-neon-orange/10 border border-neon-orange/20 inline-block mb-2">
            <Clock className="h-4 w-4 text-neon-orange" />
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">معلقة</p>
          <p className="text-xl sm:text-2xl font-black text-neon-orange mt-1">
            {pendingPayments.length}
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} whileHover={cardHover} className="glass-card p-4 sm:p-5">
          <div className="rounded-xl p-2 bg-neon-green/10 border border-neon-green/20 inline-block mb-2">
            <CheckCircle2 className="h-4 w-4 text-neon-green" />
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">مقبولة</p>
          <p className="text-xl sm:text-2xl font-black text-neon-green mt-1">
            {approvedPayments.length}
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} whileHover={cardHover} className="glass-card p-4 sm:p-5">
          <div className="rounded-xl p-2 bg-red-500/10 border border-red-500/20 inline-block mb-2">
            <X className="h-4 w-4 text-red-400" />
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">مرفوضة</p>
          <p className="text-xl sm:text-2xl font-black text-red-400 mt-1">
            {rejectedPayments.length}
          </p>
        </motion.div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setPaymentFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              paymentFilter === f
                ? 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30'
                : 'text-muted-foreground hover:bg-muted border border-transparent'
            }`}
          >
            {f === 'all' ? 'الكل' : f === 'pending' ? 'معلقة' : f === 'approved' ? 'مقبولة' : 'مرفوضة'}
          </button>
        ))}
      </div>

      {/* Payments List */}
      {filteredPayments.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-30 text-muted-foreground" />
          <p className="text-muted-foreground">لا توجد مدفوعات {paymentFilter !== 'all' ? 'بهذه الحالة' : 'بعد'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPayments.map((payment) => (
            <motion.div key={payment._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`glass-card p-4 space-y-3 transition-all ${
                payment.status === 'pending' ? 'border-l-4 border-neon-orange' :
                payment.status === 'approved' ? 'border-l-4 border-neon-green' :
                'border-l-4 border-red-500/50'
              }`}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-600/20 flex items-center justify-center text-sm font-bold shrink-0">
                    {(payment.userName || '?').charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{payment.userName || payment.userId}</p>
                    {payment.userPhone && (
                      <button
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(payment.userPhone!)
                          } catch {
                            const ta = document.createElement('textarea')
                            ta.value = payment.userPhone!
                            ta.style.cssText = 'position:fixed;left:-9999px'
                            document.body.appendChild(ta)
                            ta.select()
                            document.execCommand('copy')
                            document.body.removeChild(ta)
                          }
                        }}
                        className="text-xs text-neon-cyan hover:underline cursor-pointer flex items-center gap-1"
                        dir="ltr"
                        title="انقر للنسخ"
                      >
                        {payment.userPhone}
                        <Copy className="h-2.5 w-2.5 opacity-50" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-neon-cyan">{payment.amount?.toLocaleString() || 0} ر.ي</span>
                  {payment.status === 'pending' && (
                    <Badge className="bg-neon-orange/15 text-neon-orange border border-neon-orange/25 text-[9px]">معلق</Badge>
                  )}
                  {payment.status === 'approved' && (
                    <Badge className="bg-neon-green/15 text-neon-green border border-neon-green/25 text-[9px]">مقبول</Badge>
                  )}
                  {payment.status === 'rejected' && (
                    <Badge className="bg-red-500/15 text-red-400 border border-red-500/25 text-[9px]">مرفوض</Badge>
                  )}
                </div>
              </div>
              {/* Course name - prominent display */}
              {(() => {
                const courseName = getPaymentCourseName(payment)
                return courseName ? (
                  <div className="flex items-center gap-2 bg-neon-purple/5 border border-neon-purple/15 p-2.5 rounded-lg">
                    <BookOpen className="h-4 w-4 text-neon-purple shrink-0" />
                    <span className="text-sm font-bold text-neon-purple">{courseName}</span>
                    <span className="text-xs text-muted-foreground mr-auto">الدورة المشترك بها</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-muted/30 border border-border p-2.5 rounded-lg">
                    <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-xs text-muted-foreground">رقم الدورة: <span dir="ltr" className="font-mono">{payment.courseId?.slice(-8) || '—'}</span></span>
                  </div>
                )
              })()}
              <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap bg-muted/50 p-2.5 rounded-lg">
                {payment.walletName && (
                  <span className="flex items-center gap-1"><Wallet className="h-3 w-3" /> {payment.walletName}</span>
                )}
                {payment.walletPhone && (
                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(payment.walletPhone)
                      } catch {
                        const ta = document.createElement('textarea')
                        ta.value = payment.walletPhone
                        ta.style.cssText = 'position:fixed;left:-9999px'
                        document.body.appendChild(ta)
                        ta.select()
                        document.execCommand('copy')
                        document.body.removeChild(ta)
                      }
                    }}
                    className="flex items-center gap-1 text-neon-cyan hover:underline cursor-pointer"
                    dir="ltr"
                    title="انقر للنسخ"
                  >
                    {payment.walletPhone}
                    <Copy className="h-2.5 w-2.5 opacity-50" />
                  </button>
                )}
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(payment.createdAt).toLocaleDateString('ar')}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {payment.screenshotUrl && (
                  <button onClick={() => setScreenshotView(payment.screenshotUrl!)}
                    className="text-xs text-neon-cyan hover:underline flex items-center gap-1 px-2 py-0.5 rounded bg-neon-cyan/5 hover:bg-neon-cyan/10 transition-colors">
                    <ImageIcon className="h-3 w-3" /> عرض لقطة الشاشة
                  </button>
                )}
              </div>
              {payment.status === 'pending' && (
                <motion.div className="flex gap-2 pt-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button onClick={() => setAdminConfirmAction({
                      type: 'approve',
                      title: 'تأكيد قبول الدفع',
                      message: `هل أنت متأكد من قبول دفعة "${payment.userName || 'المستخدم'}" بمبلغ ${payment.amount?.toLocaleString() || 0} ر.ي${payment.courseName ? ` لدورة "${payment.courseName}"` : ''}؟`,
                      details: 'سيتم تفعيل وصول المستخدم للدورة وإرسال إشعار بالموافقة.',
                      confirmLabel: 'تأكيد القبول',
                      showNoteInput: true,
                      notePlaceholder: 'ملاحظة اختيارية للمستخدم...',
                      onConfirm: async (note) => {
                        setAdminConfirmLoading(true)
                        await handleApprovePayment(payment._id, 'approved', note)
                        setAdminConfirmLoading(false)
                        setAdminConfirmAction(null)
                      },
                    })}
                      className="bg-neon-green/15 text-neon-green border border-neon-green/30 hover:bg-neon-green/25 h-9 text-xs gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> قبول
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button onClick={() => setAdminConfirmAction({
                      type: 'reject',
                      title: 'تأكيد رفض الدفع',
                      message: `هل أنت متأكد من رفض دفعة "${payment.userName || 'المستخدم'}" بمبلغ ${payment.amount?.toLocaleString() || 0} ر.ي${payment.courseName ? ` لدورة "${payment.courseName}"` : ''}؟`,
                      details: 'سيتم إرسال إشعار بالرفض للمستخدم.',
                      confirmLabel: 'تأكيد الرفض',
                      showNoteInput: true,
                      notePlaceholder: 'سبب الرفض (اختياري)...',
                      onConfirm: async (note) => {
                        setAdminConfirmLoading(true)
                        await handleApprovePayment(payment._id, 'rejected', note)
                        setAdminConfirmLoading(false)
                        setAdminConfirmAction(null)
                      },
                    })}
                      className="bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 h-9 text-xs gap-1">
                      <X className="h-3.5 w-3.5" /> رفض
                    </Button>
                  </motion.div>
                </motion.div>
              )}
              {payment.adminNote && (
                <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-lg">ملاحظة: {payment.adminNote}</p>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )

  const renderPaymentMethods = () => (
    <motion.div key="payment-methods" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }} className="space-y-6">

      {/* Page Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black neon-text flex items-center gap-3">
          <Wallet className="h-6 w-6 text-neon-cyan" /> طرق الدفع
        </h1>
        <p className="text-sm text-muted-foreground mt-1">إدارة طرق الدفع المتاحة للمستخدمين</p>
      </div>

      <PaymentMethodsManager methods={paymentMethods} onRefresh={fetchPaymentMethods} />
    </motion.div>
  )

  const renderNotifications = () => {
    // Notification type config
    const typeConfig: Record<string, { label: string; color: string; bgColor: string; borderColor: string; icon: typeof Bell }> = {
      payment: { label: 'مدفوعات', color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/20', icon: CreditCard },
      gift: { label: 'هدايا', color: 'text-pink-400', bgColor: 'bg-pink-500/10', borderColor: 'border-pink-500/20', icon: Gift },
      community: { label: 'مجتمع', color: 'text-green-400', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/20', icon: MessageSquare },
      simulation: { label: 'محاكاة', color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/20', icon: Activity },
      enrollment: { label: 'تسجيل', color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/20', icon: BookOpen },
      achievement: { label: 'إنجاز', color: 'text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/20', icon: Star },
      success: { label: 'نجاح', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20', icon: CheckCircle2 },
      warning: { label: 'تحذير', color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/20', icon: AlertCircle },
      info: { label: 'معلومات', color: 'text-cyan-400', bgColor: 'bg-cyan-500/10', borderColor: 'border-cyan-500/20', icon: Info },
      system: { label: 'نظام', color: 'text-slate-400', bgColor: 'bg-slate-500/10', borderColor: 'border-slate-500/20', icon: Settings },
    }

    function getTypeConfig(type: string) {
      return typeConfig[type] || typeConfig.info
    }

    function timeAgo(timestamp: number): string {
      const diff = Date.now() - timestamp
      const seconds = Math.floor(diff / 1000)
      const minutes = Math.floor(seconds / 60)
      const hours = Math.floor(minutes / 60)
      const days = Math.floor(hours / 24)
      if (seconds < 60) return 'الآن'
      if (minutes < 60) return `منذ ${minutes} دقيقة`
      if (hours < 24) return `منذ ${hours} ساعة`
      if (days < 7) return `منذ ${days} يوم`
      return new Date(timestamp).toLocaleDateString('ar', { month: 'short', day: 'numeric' })
    }

    const filteredNotifs = adminNotifFilter === 'all'
      ? adminNotifications
      : adminNotifFilter === 'unread'
        ? adminNotifications.filter(n => !n.read)
        : adminNotifications.filter(n => n.type === adminNotifFilter)

    const handleMarkRead = async (id: string) => {
      markNotificationRead(id)
      if (authToken) {
        try {
          await fetch('/api/notifications', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
            body: JSON.stringify({ notificationId: id }),
          })
        } catch (e) { /* ignore */ }
      }
    }

    const handleMarkAllRead = async () => {
      markAllNotificationsRead()
      if (authToken) {
        try {
          await fetch('/api/notifications', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
            body: JSON.stringify({ markAllRead: true }),
          })
        } catch (e) { /* ignore */ }
      }
    }

    const handleDeleteNotif = async (id: string) => {
      deleteNotification(id)
      if (authToken) {
        try {
          await fetch(`/api/notifications?id=${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${authToken}` },
          })
        } catch (e) { /* ignore */ }
      }
    }

    const handleClearAll = async () => {
      clearAllNotifications()
      if (authToken) {
        try {
          await fetch('/api/notifications?clearAll=true', {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${authToken}` },
          })
        } catch (e) { /* ignore */ }
      }
    }

    return (
      <motion.div key="notifications" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }} className="space-y-6">

        <div>
          <h1 className="text-xl sm:text-2xl font-black neon-text flex items-center gap-3">
            <Bell className="h-6 w-6 text-neon-cyan" /> الإشعارات
          </h1>
          <p className="text-sm text-muted-foreground mt-1">إدارة واستقبال الإشعارات</p>
        </div>

        {/* ─── Push Notification Permission ─── */}
        <motion.div className="glass-card p-4 gradient-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center">
                <Bell className="w-5 h-5 text-neon-cyan" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">الإشعارات الفورية</p>
                {permission === 'granted' && isSubscribed ? (
                  <p className="text-[11px] text-green-400">مفعّلة - ستتلقى إشعارات صوتية حتى عند إغلاق التطبيق</p>
                ) : permission === 'denied' ? (
                  <p className="text-[11px] text-red-400">محظورة - فعّلها من إعدادات المتصفح</p>
                ) : (
                  <p className="text-[11px] text-muted-foreground">غير مفعّلة - اضغط لتفعيل الإشعارات الصوتية</p>
                )}
              </div>
            </div>
            {!(permission === 'granted' && isSubscribed) && permission !== 'denied' && (
              <Button
                onClick={requestPermissionAndSubscribe}
                disabled={isSettingUp}
                className="bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/25 h-9 text-xs"
              >
                {isSettingUp ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'تفعيل'}
              </Button>
            )}
            {permission === 'granted' && isSubscribed && (
              <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
            )}
          </div>
        </motion.div>

        {/* ─── Admin Notification Inbox ─── */}
        <motion.div className="glass-card p-5 gradient-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Bell className="h-5 w-5 text-neon-cyan" /> إشعارات الوارد
              {unreadCount > 0 && (
                <Badge className="bg-red-500/15 text-red-400 border border-red-500/25 text-[9px] h-5 min-w-[20px] flex items-center justify-center">
                  {unreadCount}
                </Badge>
              )}
            </h2>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={handleMarkAllRead}
                  className="text-[10px] text-neon-cyan hover:text-neon-cyan h-7 px-2">
                  <CheckCircle2 className="h-3.5 w-3.5 ml-1" /> تحديد الكل
                </Button>
              )}
              {adminNotifications.length > 0 && (
                <Button variant="ghost" size="sm" onClick={handleClearAll}
                  className="text-[10px] text-red-400 hover:text-red-400 h-7 px-2">
                  <Trash2 className="h-3.5 w-3.5 ml-1" /> حذف الكل
                </Button>
              )}
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-3 mb-3 scrollbar-none">
            {[
              { id: 'all', label: 'الكل', count: adminNotifications.length },
              { id: 'unread', label: 'غير مقروء', count: unreadCount },
              ...Object.entries(unreadByCategory).map(([type, count]) => {
                const config = getTypeConfig(type)
                return { id: type, label: config.label, count: count as number }
              }),
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setAdminNotifFilter(cat.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium whitespace-nowrap transition-all ${
                  adminNotifFilter === cat.id
                    ? 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/25'
                    : 'bg-muted/30 text-muted-foreground border border-transparent hover:bg-muted/50'
                }`}
              >
                {cat.label}
                {cat.count > 0 && (
                  <span className={`min-w-[16px] h-4 rounded-full text-[8px] font-bold flex items-center justify-center px-1 ${
                    adminNotifFilter === cat.id ? 'bg-neon-cyan/20 text-neon-cyan' : 'bg-muted/50 text-muted-foreground'
                  }`}>
                    {cat.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Notifications list */}
          <ScrollArea className="max-h-[400px]">
            {filteredNotifs.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">لا توجد إشعارات</p>
                <p className="text-[10px] text-muted-foreground/50 mt-1">ستظهر هنا الإشعارات الواردة</p>
              </div>
            ) : (
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {filteredNotifs.slice(0, 30).map(n => {
                    const config = getTypeConfig(n.type)
                    const NotifIcon = config.icon
                    return (
                      <motion.div
                        key={n.id}
                        layout
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -30, height: 0 }}
                        className={`relative group rounded-xl transition-all ${
                          !n.read
                            ? `bg-gradient-to-l ${config.bgColor} border ${config.borderColor}`
                            : 'bg-muted/10 border border-transparent'
                        }`}
                      >
                        {!n.read && (
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-l-full bg-gradient-to-b from-neon-cyan to-neon-purple" />
                        )}
                        <div
                          className="flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/10 transition-colors rounded-xl"
                          onClick={() => { if (!n.read) handleMarkRead(n.id) }}
                        >
                          <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${config.bgColor} border ${config.borderColor} flex items-center justify-center`}>
                            <NotifIcon className={`w-3.5 h-3.5 ${config.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className={`text-xs font-bold ${!n.read ? 'text-foreground' : 'text-foreground/50'}`}>
                                {n.title}
                              </p>
                              <Badge className={`text-[8px] px-1.5 py-0 ${config.bgColor} ${config.color} border ${config.borderColor}`}>
                                {config.label}
                              </Badge>
                            </div>
                            <p className={`text-[11px] leading-5 line-clamp-2 ${!n.read ? 'text-foreground/60' : 'text-foreground/30'}`}>
                              {n.message}
                            </p>
                            <p className="text-[9px] text-muted-foreground/40 mt-1">{timeAgo(n.timestamp)}</p>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteNotif(n.id) }}
                            className="flex-shrink-0 w-6 h-6 rounded-lg hover:bg-red-500/20 flex items-center justify-center text-muted-foreground/40 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            )}
          </ScrollArea>
        </motion.div>

        {/* ─── Send Broadcast Notification ─── */}
        <motion.div className="glass-card p-5 gradient-border">
          <h2 className="text-base font-bold flex items-center gap-2 mb-4">
            <Send className="h-5 w-5 text-neon-cyan" /> إرسال إشعار عام
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">العنوان</label>
              <Input value={notifTitle} onChange={(e) => setNotifTitle(e.target.value)} placeholder="عنوان الإشعار..."
                className="bg-muted/50 border-border focus:border-neon-cyan/50 text-sm h-9" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">الرسالة</label>
              <Textarea value={notifMessage} onChange={(e) => setNotifMessage(e.target.value)} placeholder="نص الإشعار..." rows={4}
                className="bg-muted/50 border-border focus:border-neon-cyan/50 text-sm resize-none" />
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-neon-orange/5 border border-neon-orange/20">
              <AlertCircle className="h-4 w-4 text-neon-orange shrink-0" />
              <span className="text-xs text-neon-orange">سيتم إرسال هذا الإشعار لجميع المستخدمين مع إشعار فوري (Push)</span>
            </div>
            <Button onClick={handleSendNotif} disabled={sendingNotif || !notifTitle.trim() || !notifMessage.trim()}
              className="w-full bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/25 transition-all h-10">
              {sendingNotif ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (<><Send className="h-4 w-4 ml-2" /> إرسال الإشعار لجميع المستخدمين</>)}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    )
  }

  const renderActivityLogs = () => (
    <motion.div key="activity-logs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }} className="space-y-6">

      <div>
        <h1 className="text-xl sm:text-2xl font-black neon-text flex items-center gap-3">
          <FileText className="h-6 w-6 text-neon-cyan" /> سجل العمليات
        </h1>
        <p className="text-sm text-muted-foreground mt-1">سجل جميع العمليات الإدارية</p>
      </div>

      {activityLogs.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-30 text-muted-foreground" />
          <p className="text-muted-foreground">لا توجد عمليات مسجلة بعد</p>
          <p className="text-xs text-muted-foreground mt-2">ستظهر هنا عمليات الموافقة والرفض وإنشاء الدورات</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activityLogs.map((log, idx) => {
            const actionLabels: Record<string, { label: string; color: string; icon: typeof Activity }> = {
              'destructive_operation': { label: 'عملية مدمرة', color: 'text-red-400 bg-red-500/10 border-red-500/20', icon: Trash2 },
              'broadcast_notification': { label: 'بث إشعار', color: 'text-neon-cyan bg-neon-cyan/10 border-neon-cyan/20', icon: Bell },
              'payment_approved': { label: 'موافقة دفع', color: 'text-neon-green bg-neon-green/10 border-neon-green/20', icon: CheckCircle2 },
              'payment_rejected': { label: 'رفض دفع', color: 'text-red-400 bg-red-500/10 border-red-500/20', icon: X },
              'course_created': { label: 'إنشاء دورة', color: 'text-neon-purple bg-neon-purple/10 border-neon-purple/20', icon: Plus },
            }
            const actionInfo = actionLabels[log.action] || { label: log.action, color: 'text-slate-400 bg-muted/50 border-border', icon: Activity }

            return (
              <motion.div key={log._id || idx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.03 }}
                className="glass-card p-4 flex items-start gap-3">
                {/* Timeline dot */}
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${actionInfo.color}`}>
                    <actionInfo.icon className="h-4 w-4" />
                  </div>
                  {idx < activityLogs.length - 1 && (
                    <div className="w-[2px] h-6 bg-white/10" />
                  )}
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`${actionInfo.color} text-[9px] border`}>{actionInfo.label}</Badge>
                    {log.adminName && (
                      <span className="text-xs text-muted-foreground">بواسطة {log.adminName}</span>
                    )}
                  </div>
                  <div className="mt-1.5">
                    {log.details && (
                      <p className="text-xs text-slate-300">
                        {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                      </p>
                    )}
                    {log.operation && (
                      <p className="text-xs text-slate-300">
                        العملية: {log.operation}
                        {log.deletedCount > 0 && <span className="text-red-400 mr-1">({log.deletedCount} سجل محذوف)</span>}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span className="text-[10px] text-slate-500">
                      {new Date(log.createdAt).toLocaleString('ar', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </motion.div>
  )

  const renderDatabase = () => (
    <motion.div key="database" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }} className="space-y-6">

      <div>
        <h1 className="text-xl sm:text-2xl font-black neon-text flex items-center gap-3">
          <Shield className="h-6 w-6 text-red-400" /> قاعدة البيانات
        </h1>
        <p className="text-sm text-muted-foreground mt-1">مركز التحكم بقاعدة البيانات - محمي</p>
      </div>

      {/* Security Warning */}
      <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <h3 className="text-sm font-bold text-red-400">تحذير أمني</h3>
        </div>
        <p className="text-xs text-red-300/70">هذا القسم مخصص للمدير الرئيسي فقط. العمليات هنا لا يمكن التراجع عنها. سيتم تسجيل كل عملية في سجل العمليات.</p>
      </div>

      {/* Database Stats */}
      {dbStats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {dbStats.collections.map((col: any) => (
            <div key={col.name} className="glass-card p-4">
              <div className="text-2xl mb-1">{col.icon}</div>
              <p className="text-xs text-muted-foreground">{col.label}</p>
              <p className="text-xl font-black neon-text">{col.count.toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}

      {/* Destructive Operations */}
      <div className="glass-card p-5 border border-red-500/20">
        <h2 className="text-base font-bold text-red-400 flex items-center gap-2 mb-4">
          <Trash2 className="h-5 w-5" /> عمليات خطيرة
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { op: 'delete_all_users', label: 'حذف جميع المستخدمين', desc: 'ما عدا حساب المدير', icon: Users },
            { op: 'delete_all_courses', label: 'حذف جميع الدورات', desc: 'جميع الدورات والدروس', icon: BookOpen },
            { op: 'delete_all_payments', label: 'حذف جميع المدفوعات', desc: 'جميع سجلات الدفع', icon: CreditCard },
            { op: 'reset_enrollments', label: 'إعادة التسجيلات', desc: 'حذف جميع التسجيلات في الدورات', icon: RefreshCw },
          ].map((item) => (
            <button
              key={item.op}
              onClick={() => { setDbOperation(item.op); setDbConfirmOpen(true) }}
              className="w-full p-3 rounded-xl bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 hover:border-red-500/20 transition-all text-right group"
            >
              <div className="flex items-center gap-2">
                <item.icon className="h-4 w-4 text-red-400 shrink-0" />
                <span className="text-sm font-medium text-red-300 group-hover:text-red-200">{item.label}</span>
              </div>
              <p className="text-[10px] text-red-400/50 mt-0.5 mr-6">{item.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {dbConfirmOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card p-6 max-w-md w-full border-2 border-red-500/30"
            >
              <div className="text-center mb-4">
                <div className="w-14 h-14 rounded-2xl bg-red-500/20 flex items-center justify-center mx-auto mb-3">
                  <AlertCircle className="h-7 w-7 text-red-400" />
                </div>
                <h3 className="text-lg font-bold text-red-400">تأكيد العملية الخطيرة</h3>
                <p className="text-sm text-muted-foreground mt-1">هذه العملية لا يمكن التراجع عنها!</p>
              </div>

              <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20 mb-4">
                <p className="text-sm text-red-300">
                  {dbOperation === 'delete_all_users' && 'سيتم حذف جميع المستخدمين نهائياً ما عدا حساب المدير'}
                  {dbOperation === 'delete_all_courses' && 'سيتم حذف جميع الدورات والدروس نهائياً'}
                  {dbOperation === 'delete_all_payments' && 'سيتم حذف جميع سجلات المدفوعات نهائياً'}
                  {dbOperation === 'reset_enrollments' && 'سيتم حذف جميع تسجيلات المستخدمين في الدورات'}
                </p>
              </div>

              <div className="mb-4">
                <label className="text-xs text-muted-foreground mb-1.5 block">اكتب "تأكيد" للمتابعة</label>
                <Input
                  value={dbConfirmPassword}
                  onChange={(e) => setDbConfirmPassword(e.target.value)}
                  placeholder='اكتب "تأكيد" هنا...'
                  className="bg-muted/50 border-red-500/20 focus:border-red-500/40 text-sm h-10"
                  dir="rtl"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleDbOperation}
                  disabled={dbConfirmPassword !== 'تأكيد' || dbProcessing}
                  className="flex-1 bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 h-10"
                >
                  {dbProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'تنفيذ العملية'}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => { setDbConfirmOpen(false); setDbOperation(''); setDbConfirmPassword('') }}
                  className="flex-1 h-10"
                >
                  إلغاء
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )

  // ─── Render ─────────────────────────────────────────────

  // No loading screen - admin dashboard shows immediately

  const renderAiAssistant = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-neon-cyan" />
          </div>
          <div>
            <h3 className="text-lg font-bold">المساعد الذكي (AI)</h3>
            <p className="text-xs text-muted-foreground">إدارة وإعدادات المساعد الطبي الذكي</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium ${aiEnabled ? 'text-emerald-400' : 'text-red-400'}`}>
            {aiEnabled ? '✅ مفعّل' : '⏹ معطّل'}
          </span>
        </div>
      </div>

      {/* Enable/Disable Toggle */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold">تفعيل المساعد الذكي</h4>
            <p className="text-xs text-muted-foreground mt-1">عند التعطيل، سيظهر للمستخدمين رسالة بأن المساعد غير متاح</p>
          </div>
          <button
            onClick={() => setAiEnabled(!aiEnabled)}
            className={`relative w-14 h-7 rounded-full transition-colors ${aiEnabled ? 'bg-emerald-500' : 'bg-muted'}`}
          >
            <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${aiEnabled ? 'left-7' : 'left-0.5'}`} />
          </button>
        </div>
      </div>

      {/* System Prompt */}
      <div className="glass-card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full bg-neon-cyan" />
          <span className="text-sm font-bold">الشخصية والتعليمات (System Prompt)</span>
        </div>
        <p className="text-xs text-muted-foreground">حدد كيف يتصرف المساعد الذكي وما هي تخصصه. اتركه فارغاً لاستخدام التعليمات الافتراضية.</p>
        <textarea
          value={aiSystemPrompt}
          onChange={(e) => setAiSystemPrompt(e.target.value)}
          rows={8}
          className="w-full bg-muted/30 border border-border rounded-lg p-3 text-sm resize-none focus:border-neon-cyan/50 focus:outline-none"
          dir="rtl"
          placeholder="أنت مساعد طبي ذكي متخصص في التعليم الطبي..."
        />
        {!aiSystemPrompt && (
          <p className="text-[10px] text-emerald-400/70">✅ يتم استخدام التعليمات الافتراضية حالياً</p>
        )}
      </div>

      {/* AI Settings */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full bg-neon-purple" />
          <span className="text-sm font-bold">إعدادات النموذج</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block font-medium">النموذج</label>
            <div className="h-10 rounded-md border border-border bg-muted/30 flex items-center px-3 text-sm text-emerald-400">
              Groq (Llama 3.3 70B)
            </div>
            <p className="text-[10px] text-muted-foreground/50 mt-1">سريع جداً ومجاني - يعمل بثبات</p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block font-medium">الحرارة (Temperature): {aiTemperature}</label>
            <input
              type="range" min="0" max="1" step="0.1"
              value={aiTemperature}
              onChange={(e) => setAiTemperature(parseFloat(e.target.value))}
              className="w-full mt-2"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground/50 mt-1">
              <span>دقيق (0)</span>
              <span>إبداعي (1)</span>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block font-medium">أقصى عدد كلمات (Max Tokens)</label>
            <Input type="number" value={aiMaxTokens} onChange={(e) => setAiMaxTokens(parseInt(e.target.value) || 1000)}
              className="bg-muted/30 border-border h-10 text-sm" min={500} max={4000} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block font-medium">حالة الاتصال</label>
            <div className="space-y-2">
              <Button onClick={handleTestAiConnection} disabled={aiTesting}
                className="h-9 text-xs gap-2 bg-gradient-to-l from-neon-purple to-neon-cyan text-white hover:shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                {aiTesting ? '⏳ جاري الاختبار...' : '🔍 اختبار الاتصال'}
              </Button>
              {aiTestResult && (
                <div className={`p-3 rounded-lg border text-xs space-y-1 ${
                  aiTestResult.overallStatus === 'connected' ? 'bg-emerald-500/10 border-emerald-500/20' :
                  aiTestResult.overallStatus === 'error' ? 'bg-red-500/10 border-red-500/20' :
                  'bg-amber-500/10 border-amber-500/20'
                }`}>
                  <p className="font-bold">{aiTestResult.message}</p>
                  {aiTestResult.providers?.map((p: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-[10px] mt-1">
                      <span>{p.status === 'connected' ? '✅' : p.status === 'error' ? '❌' : '⚪'}</span>
                      <span className="font-medium">{p.provider}</span>
                      {p.model && <span className="text-muted-foreground">({p.model})</span>}
                      {p.error && <span className="text-red-400">- {p.error}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Custom Responses */}
      <div className="glass-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-amber-400" />
            <span className="text-sm font-bold">ردود مخصصة</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => setAiCustomResponses([...aiCustomResponses, { keyword: '', response: '' }])}
            className="h-7 text-xs gap-1 border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10">
            <Plus className="h-3 w-3" />
            إضافة رد
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">ردود ثابتة تُعرض عند ذكر كلمات مفتاحية محددة (أفضلوية أعلى من AI)</p>

        {aiCustomResponses.length === 0 && (
          <div className="p-4 rounded-lg bg-muted/20 border border-border/50 text-center">
            <p className="text-xs text-muted-foreground">لا توجد ردود مخصصة بعد</p>
          </div>
        )}

        {aiCustomResponses.map((cr, idx) => (
          <div key={idx} className="p-3 rounded-lg bg-muted/20 border border-border/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400">رد مخصص {idx + 1}</span>
              <Button variant="ghost" size="icon" onClick={() => setAiCustomResponses(aiCustomResponses.filter((_, i) => i !== idx))}
                className="h-6 w-6 hover:bg-red-500/10">
                <Trash2 className="h-3 w-3 text-red-400" />
              </Button>
            </div>
            <Input value={cr.keyword} onChange={(e) => {
              const updated = [...aiCustomResponses]
              updated[idx] = { ...updated[idx], keyword: e.target.value }
              setAiCustomResponses(updated)
            }} placeholder="كلمات مفتاحية (مفصولة بفاصلة): قلب,heart,cardiac" className="bg-muted/30 border-border h-9 text-sm" dir="ltr" />
            <textarea value={cr.response} onChange={(e) => {
              const updated = [...aiCustomResponses]
              updated[idx] = { ...updated[idx], response: e.target.value }
              setAiCustomResponses(updated)
            }} placeholder="الرد الذي سيظهر عند ذكر أي من الكلمات المفتاحية..." rows={3}
              className="w-full bg-muted/30 border border-border rounded-md p-2 text-sm resize-none focus:outline-none focus:border-amber-500/50" dir="rtl" />
          </div>
        ))}
      </div>

      {/* Save Button */}
      <div className="flex gap-3">
        <Button onClick={handleSaveAiSettings} disabled={aiSaving}
          className="bg-gradient-to-l from-neon-purple to-neon-cyan text-white font-bold hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all h-10 px-6 disabled:opacity-50">
          <Save className="h-4 w-4 ml-1.5" />
          {aiSaving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
        </Button>
      </div>

      {/* Free Message Limit */}
      <div className="glass-card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full bg-neon-green" />
          <span className="text-sm font-bold">حد الرسائل المجانية</span>
        </div>
        <p className="text-xs text-muted-foreground">عدد الرسائل المجانية المسموحة يومياً للمستخدمين غير المشتركين</p>
        <div className="flex items-center gap-3">
          <Input type="number" value={aiFreeLimit} onChange={(e) => setAiFreeLimit(parseInt(e.target.value) || 5)}
            className="bg-muted/30 border-border h-10 text-sm w-24" min={1} max={100} />
          <span className="text-xs text-muted-foreground">رسالة / يوم</span>
          <Button variant="outline" size="sm" onClick={() => setAiFreeLimit(5)}
            className="h-8 text-xs border-border text-muted-foreground">إعادة تعيين (5)</Button>
        </div>
        <p className="text-[10px] text-muted-foreground">💡 المستخدمون المشتركون يحصلون على رسائل غير محدودة</p>
      </div>

      {/* AI Subscriptions Management */}
      <div className="glass-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-neon-purple" />
            <span className="text-sm font-bold">إدارة اشتراكات AI</span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchAiSubscriptions}
            className="h-7 text-xs gap-1 border-border text-muted-foreground hover:text-foreground">
            <RotateCcw className="h-3 w-3" />
            تحديث
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-amber-400">{aiSubscriptions.filter(s => s.status === 'pending').length}</div>
            <div className="text-[9px] text-muted-foreground">بانتظار الموافقة</div>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-emerald-400">{aiSubscriptions.filter(s => s.status === 'active').length}</div>
            <div className="text-[9px] text-muted-foreground">نشط</div>
          </div>
          <div className="bg-muted/20 border border-border/50 rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-muted-foreground">{aiSubscriptions.length}</div>
            <div className="text-[9px] text-muted-foreground">الإجمالي</div>
          </div>
        </div>

        {/* Subscription List */}
        {aiSubscriptions.length === 0 ? (
          <div className="p-6 text-center">
            <CreditCard className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">لا توجد اشتراكات بعد</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {aiSubscriptions.map((sub: any, idx: number) => (
              <div key={idx} className={`p-3 rounded-lg border space-y-2 ${
                sub.status === 'pending' ? 'bg-amber-500/5 border-amber-500/20' :
                sub.status === 'active' ? 'bg-emerald-500/5 border-emerald-500/20' :
                'bg-muted/20 border-border/50'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">{sub.userName || 'مجهول'}</span>
                    <Badge className={`text-[8px] px-1 ${
                      sub.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      sub.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      sub.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                      'bg-muted/20 text-muted-foreground border-border'
                    }`}>
                      {sub.status === 'pending' ? '⏳ بانتظار' : sub.status === 'active' ? '✅ نشط' : sub.status === 'rejected' ? '❌ مرفوض' : '🚫 ملغى'}
                    </Badge>
                    <Badge className="bg-neon-purple/10 text-neon-purple border-neon-purple/20 text-[8px] px-1">
                      {sub.planName}
                    </Badge>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {sub.createdAt ? new Date(sub.createdAt).toLocaleDateString('ar') : ''}
                  </span>
                </div>
                <div className="text-[10px] text-muted-foreground space-y-0.5">
                  <p>📱 {sub.userPhone} | 💳 {sub.paymentMethod} ({sub.paymentPhone})</p>
                  {sub.paymentNote && <p>📝 {sub.paymentNote}</p>}
                  {sub.expiresAt && <p>⏰ ينتهي: {new Date(sub.expiresAt).toLocaleDateString('ar')}</p>}
                </div>
                {sub.status === 'pending' && (
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" onClick={async () => {
                      const res = await fetch('/api/ai/subscription', {
                        method: 'PUT',
                        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                        body: JSON.stringify({ subscriptionId: sub._id, action: 'approve' }),
                      })
                      const data = await res.json()
                      if (data.success) { fetchAiSubscriptions() }
                    }} className="h-7 text-xs bg-emerald-500 hover:bg-emerald-600 text-white px-3">
                      <CheckCircle2 className="h-3 w-3 ml-1" /> موافقة
                    </Button>
                    <Button size="sm" variant="outline" onClick={async () => {
                      const reason = prompt('سبب الرفض (اختياري):') || ''
                      const res = await fetch('/api/ai/subscription', {
                        method: 'PUT',
                        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                        body: JSON.stringify({ subscriptionId: sub._id, action: 'reject', rejectionReason: reason }),
                      })
                      const data = await res.json()
                      if (data.success) { fetchAiSubscriptions() }
                    }} className="h-7 text-xs border-red-500/30 text-red-400 hover:bg-red-500/10 px-3">
                      <X className="h-3 w-3 ml-1" /> رفض
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat Logs */}
      <div className="glass-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-emerald-400" />
            <span className="text-sm font-bold">سجل المحادثات</span>
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px] px-1.5">{aiChatLogsTotal} رسالة</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchAiChatLogs}
              className="h-7 text-xs gap-1 border-border text-muted-foreground hover:text-foreground">
              <RotateCcw className="h-3 w-3" />
              تحديث
            </Button>
            {aiChatLogs.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleClearAiLogs}
                className="h-7 text-xs gap-1 border-red-500/30 text-red-400 hover:bg-red-500/10">
                <Trash2 className="h-3 w-3" />
                حذف الكل
              </Button>
            )}
          </div>
        </div>

        {aiChatLogs.length === 0 ? (
          <div className="p-6 text-center">
            <MessageSquare className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">لا توجد محادثات بعد</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {aiChatLogs.map((log: any, idx: number) => (
              <div key={idx} className="p-3 rounded-lg bg-muted/20 border border-border/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">{log.userName || 'مجهول'}</span>
                    <Badge className={`text-[8px] px-1 ${
                      log.source === 'gemini' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      log.source === 'custom' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {log.source === 'gemini' ? 'Gemini' : log.source === 'custom' ? 'مخصص' : 'احتياطي'}
                    </Badge>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {log.timestamp ? new Date(log.timestamp).toLocaleString('ar') : ''}
                  </span>
                </div>
                <div className="text-xs">
                  <p className="text-neon-cyan/80 mb-1">👤 {log.userMessage?.slice(0, 100)}{log.userMessage?.length > 100 ? '...' : ''}</p>
                  <p className="text-muted-foreground">🤖 {log.aiResponse?.slice(0, 100)}{log.aiResponse?.length > 100 ? '...' : ''}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  const renderSettings = () => (
    <SettingsSection
      privacyText={privacyText}
      aboutText={aboutText}
      settingsLoading={settingsLoading}
      settingsSaving={settingsSaving}
      onSaveSettings={handleSaveSettings}
    />
  )

  return (
    <div dir="rtl" className="min-h-screen bg-background flex">

      {/* Error Toast */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] glass-strong px-4 py-3 rounded-xl border border-red-500/30 text-red-400 text-sm flex items-center gap-2 shadow-lg">
            <AlertCircle className="h-4 w-4" />
            {error}
            <Button variant="ghost" size="icon" className="h-6 w-6 ml-2" onClick={() => setError('')}><X className="h-3 w-3" /></Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Confirm Action Modal */}
      <AnimatePresence>
        {adminConfirmAction && (
          <ConfirmActionModal
            action={adminConfirmAction}
            onCancel={() => setAdminConfirmAction(null)}
            loading={adminConfirmLoading}
          />
        )}
      </AnimatePresence>

      {/* Screenshot Viewer Modal */}
      <AnimatePresence>
        {screenshotView && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setScreenshotView(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-3xl max-h-[90vh] overflow-auto rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setScreenshotView(null)}
                className="absolute top-3 left-3 z-10 h-9 w-9 rounded-full bg-black/60 hover:bg-black/80 text-foreground"
              >
                <X className="h-5 w-5" />
              </Button>
              <img
                src={screenshotView}
                alt="لقطة شاشة إثبات الدفع"
                className="w-full h-auto rounded-2xl"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════ DESKTOP SIDEBAR (Right side, RTL) ═══════════ */}
      <aside className="hidden lg:flex w-[260px] shrink-0 flex-col fixed right-0 top-0 bottom-0 bg-sidebar border-l border-sidebar-border z-40">
        {sidebarContent}
      </aside>

      {/* ═══════════ MOBILE SIDEBAR (Sheet from right) ═══════════ */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="right" className="w-[280px] bg-sidebar border-l border-sidebar-border p-0">
          <SheetTitle className="sr-only">القائمة الجانبية</SheetTitle>
          <SheetDescription className="sr-only">قائمة التنقل الإدارية</SheetDescription>
          {sidebarContent}
        </SheetContent>
      </Sheet>

      {/* ═══════════ MOBILE TOP HEADER ═══════════ */}
      <header className="lg:hidden fixed top-0 right-0 left-0 h-14 bg-sidebar/95 backdrop-blur-xl border-b border-med-border z-30 flex items-center justify-between px-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="h-9 w-9 hover:bg-muted">
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-cyan-400" />
            <span className="text-sm font-bold bg-gradient-to-l from-cyan-300 to-cyan-500 bg-clip-text text-transparent">
              أكاديمية نبض
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <NotificationBell />
          <Button variant="ghost" size="icon" onClick={handleRefreshAll} className="h-9 w-9 hover:bg-muted">
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </Button>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-neon-green/5 border border-neon-green/10">
            <div className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
            <span className="text-[10px] text-neon-green font-medium">يعمل</span>
          </div>
        </div>
      </header>

      {/* ═══════════ MAIN CONTENT AREA ═══════════ */}
      <main className="flex-1 lg:mr-[260px] min-h-screen overflow-x-hidden">
        <div className="pt-14 lg:pt-0 px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            {/* Section Header Bar (Desktop) */}
            <div className="hidden lg:flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                {saving && <Loader2 className="h-4 w-4 animate-spin text-neon-cyan" />}
                <Badge className="bg-neon-green/15 text-neon-green border border-neon-green/25 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-neon-green mr-1 animate-pulse" /> النظام يعمل
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                {/* Push Notification Status */}
                {permission === 'granted' && isSubscribed ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[10px] text-green-400 font-medium">الإشعارات الفورية مفعّلة</span>
                  </div>
                ) : permission === 'denied' ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
                    <span className="text-[10px] text-red-400 font-medium">الإشعارات محظورة</span>
                  </div>
                ) : (
                  <Button
                    onClick={requestPermissionAndSubscribe}
                    disabled={isSettingUp}
                    className="bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/25 h-8 text-[11px] gap-1.5"
                  >
                    {isSettingUp ? <Loader2 className="h-3 w-3 animate-spin" /> : <Bell className="h-3.5 w-3.5" />}
                    تفعيل الإشعارات الفورية
                  </Button>
                )}
                <NotificationBell />
              </div>
            </div>

            {/* Section Content */}
            <AnimatePresence mode="wait">
              {activeSection === 'overview' && renderOverview()}
              {activeSection === 'courses' && renderCourses()}
              {activeSection === 'users' && renderUsers()}
              {activeSection === 'payments' && renderPayments()}
              {activeSection === 'payment-methods' && renderPaymentMethods()}
              {activeSection === 'notifications' && renderNotifications()}
              {activeSection === 'activity-logs' && renderActivityLogs()}
              {activeSection === 'database' && renderDatabase()}
              {activeSection === 'simulation' && <SimulationManagementSection />}
              {activeSection === 'community' && <CommunityManagementSection />}
              {activeSection === 'quizzes' && <QuizManagementSection />}
              {activeSection === 'ai-assistant' && renderAiAssistant()}
              {activeSection === 'settings' && renderSettings()}
            </AnimatePresence>
          </motion.div>
        </div>
      </main>
    </div>
  )
}

// ─── Payment Methods Manager ────────────────────────────────

function PaymentMethodsManager({ methods, onRefresh }: { methods: ApiPaymentMethod[]; onRefresh: () => void }) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<ApiPaymentMethod | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ type: 'محفظة إلكترونية', name: '', accountNumber: '', accountName: '', instructions: '', active: true })
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
  const [confirmLoading, setConfirmLoading] = useState(false)

  const resetForm = () => {
    setForm({ type: 'محفظة إلكترونية', name: '', accountNumber: '', accountName: '', instructions: '', active: true })
    setShowForm(false)
    setEditing(null)
  }

  const startEdit = (m: ApiPaymentMethod) => {
    setForm({ type: m.type, name: m.name, accountNumber: m.accountNumber, accountName: m.accountName, instructions: m.instructions, active: m.active })
    setEditing(m)
    setShowForm(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (editing) {
        const res = await fetch('/api/admin/payment-methods', {
          method: 'PUT', headers: getAuthHeaders(),
          body: JSON.stringify({ methodId: editing._id, ...form }),
        })
        const data = await res.json()
        if (data.success) { resetForm(); onRefresh() }
      } else {
        const res = await fetch('/api/admin/payment-methods', {
          method: 'POST', headers: getAuthHeaders(),
          body: JSON.stringify(form),
        })
        const data = await res.json()
        if (data.success) { resetForm(); onRefresh() }
      }
    } catch { /* ignore */ }
    setSaving(false)
  }

  const handleDelete = (id: string, name: string) => {
    setConfirmAction({
      type: 'delete',
      title: 'حذف طريقة الدفع',
      message: 'هل أنت متأكد من حذف طريقة الدفع هذه؟',
      details: `سيتم حذف "${name}" نهائياً.`,
      confirmLabel: 'حذف طريقة الدفع',
      onConfirm: async () => {
        setConfirmLoading(true)
        try {
          const res = await fetch('/api/admin/payment-methods', {
            method: 'DELETE', headers: getAuthHeaders(),
            body: JSON.stringify({ methodId: id }),
          })
          const data = await res.json()
          if (data.success) onRefresh()
        } catch { /* ignore */ }
        setConfirmLoading(false)
        setConfirmAction(null)
      },
    })
  }

  return (
    <div className="space-y-6">
      {/* Add Button */}
      <div className="flex items-center gap-3">
        <Button onClick={() => { resetForm(); setShowForm(true) }}
          className="bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/25 transition-all h-9">
          <Plus className="h-4 w-4 ml-1" /> إضافة طريقة دفع
        </Button>
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="glass-card p-4 sm:p-5 space-y-4 border border-neon-cyan/20">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-neon-cyan" />
                {editing ? 'تعديل طريقة الدفع' : 'إضافة طريقة دفع جديدة'}
              </h4>
              <Button variant="ghost" size="icon" onClick={resetForm} className="h-7 w-7 hover:bg-red-500/10">
                <X className="h-4 w-4 text-red-400" />
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">النوع</label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger className="bg-muted/50 border-border h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-med-card">
                    <SelectItem value="محفظة إلكترونية">محفظة إلكترونية</SelectItem>
                    <SelectItem value="تحويل بنكي">تحويل بنكي</SelectItem>
                    <SelectItem value="أخرى">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">الاسم *</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="bg-muted/50 border-border focus:border-neon-cyan/50 text-sm h-9" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">رقم الحساب *</label>
                <Input value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                  className="bg-muted/50 border-border focus:border-neon-cyan/50 text-sm h-9" dir="ltr" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">اسم الحساب</label>
                <Input value={form.accountName} onChange={(e) => setForm({ ...form, accountName: e.target.value })}
                  className="bg-muted/50 border-border focus:border-neon-cyan/50 text-sm h-9" />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">التعليمات</label>
              <Textarea value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                rows={3} className="bg-muted/50 border-border focus:border-neon-cyan/50 text-sm resize-none" />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="rounded border-border bg-muted/50 text-neon-cyan focus:ring-neon-cyan/30" />
              <span className="text-xs text-muted-foreground">مفعّلة</span>
            </label>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={!form.name || !form.accountNumber || saving}
                className="bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/25 transition-all h-9">
                <Save className="h-4 w-4 ml-1" />
                {saving ? 'جارٍ الحفظ...' : editing ? 'حفظ التعديلات' : 'إضافة'}
              </Button>
              <Button variant="ghost" onClick={resetForm} className="text-muted-foreground hover:text-foreground h-9">إلغاء</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Methods List */}
      {methods.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Wallet className="h-12 w-12 mx-auto mb-4 opacity-30 text-muted-foreground" />
          <p className="text-muted-foreground">لا توجد طرق دفع بعد</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {methods.map((method) => (
            <motion.div key={method._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              whileHover={cardHover} className="glass-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center">
                    <Wallet className="h-4 w-4 text-neon-cyan" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{method.name}</p>
                    <p className="text-[10px] text-muted-foreground">{method.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {method.active ? (
                    <Badge className="bg-neon-green/15 text-neon-green border border-neon-green/25 text-[9px]">مفعّلة</Badge>
                  ) : (
                    <Badge className="bg-red-500/15 text-red-400 border border-red-500/25 text-[9px]">معطّلة</Badge>
                  )}
                </div>
              </div>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <p>رقم الحساب: <span className="text-foreground font-mono" dir="ltr">{method.accountNumber}</span></p>
                {method.accountName && <p>اسم الحساب: <span className="text-foreground">{method.accountName}</span></p>}
              </div>
              {method.instructions && (
                <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-lg">{method.instructions}</p>
              )}
              <div className="flex gap-2 pt-1">
                <Button variant="ghost" size="sm" onClick={() => startEdit(method)}
                  className="h-7 text-xs hover:bg-neon-cyan/10 text-neon-cyan">
                  <Edit3 className="h-3 w-3 ml-1" /> تعديل
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(method._id, method.name)}
                  className="h-7 text-xs hover:bg-red-500/10 text-red-400">
                  <Trash2 className="h-3 w-3 ml-1" /> حذف
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      {/* Confirm Action Modal */}
      <AnimatePresence>
        {confirmAction && (
          <ConfirmActionModal
            action={confirmAction}
            onCancel={() => setConfirmAction(null)}
            loading={confirmLoading}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Settings Section Render Function ──────────────────────

function SettingsSection({ privacyText, aboutText, settingsLoading, settingsSaving, onSaveSettings }: {
  privacyText: string
  aboutText: string
  settingsLoading: boolean
  settingsSaving: boolean
  onSaveSettings: (key: 'privacy' | 'about', text: string) => void
}) {
  const [localPrivacy, setLocalPrivacy] = useState(privacyText)
  const [localAbout, setLocalAbout] = useState(aboutText)

  useEffect(() => { setLocalPrivacy(privacyText) }, [privacyText])
  useEffect(() => { setLocalAbout(aboutText) }, [aboutText])

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-neon-cyan" />
        <span className="mr-3 text-muted-foreground">جارٍ تحميل الإعدادات...</span>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Privacy Policy */}
      <div className="glass-card p-5 space-y-4 border border-neon-green/15">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neon-green/10 border border-neon-green/20 flex items-center justify-center">
            <Shield className="h-5 w-5 text-neon-green" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">سياسة الخصوصية</h3>
            <p className="text-xs text-muted-foreground">النص الذي يظهر للمستخدمين عند الضغط على الخصوصية</p>
          </div>
        </div>
        <Textarea
          value={localPrivacy}
          onChange={(e) => setLocalPrivacy(e.target.value)}
          rows={8}
          className="bg-muted/50 border-border focus:border-neon-green/30 text-sm resize-none"
          dir="rtl"
          placeholder="اكتب نص سياسة الخصوصية هنا..."
        />
        <div className="flex justify-end">
          <Button
            onClick={() => onSaveSettings('privacy', localPrivacy)}
            disabled={settingsSaving || localPrivacy === privacyText}
            className="bg-neon-green/15 text-neon-green border border-neon-green/30 hover:bg-neon-green/25 h-9"
          >
            {settingsSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 ml-1" />}
            حفظ الخصوصية
          </Button>
        </div>
      </div>

      {/* About App */}
      <div className="glass-card p-5 space-y-4 border border-neon-cyan/15">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center">
            <Info className="h-5 w-5 text-neon-cyan" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">حول التطبيق</h3>
            <p className="text-xs text-muted-foreground">النص الذي يظهر للمستخدمين عند الضغط على حول التطبيق</p>
          </div>
        </div>
        <Textarea
          value={localAbout}
          onChange={(e) => setLocalAbout(e.target.value)}
          rows={8}
          className="bg-muted/50 border-border focus:border-neon-cyan/30 text-sm resize-none"
          dir="rtl"
          placeholder="اكتب نص حول التطبيق هنا..."
        />
        <div className="flex justify-end">
          <Button
            onClick={() => onSaveSettings('about', localAbout)}
            disabled={settingsSaving || localAbout === aboutText}
            className="bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/25 h-9"
          >
            {settingsSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 ml-1" />}
            حفظ حول التطبيق
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Simulation Management Section ────────────────────────

function SimulationManagementSection() {
  const { simulationCases, updateSimulationCases } = useAppStore()
  const [localCases, setLocalCases] = useState(simulationCases)
  const [showForm, setShowForm] = useState(false)
  const [editingCase, setEditingCase] = useState<any>(null)
  const [form, setForm] = useState({
    titleAr: '', title: '', specialty: 'emergency', difficulty: 'medium' as 'easy' | 'medium' | 'hard' | 'expert',
    duration: 15, scenario: '', symptoms: '', vitalsHr: 80, vitalsBp: '120/80', vitalsSpo2: 98, vitalsTemp: 37.0, vitalsRr: 16,
    isLocked: false,
  })
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
  const [confirmLoading, setConfirmLoading] = useState(false)

  // Only sync from store on initial mount, not on every re-render
  // This prevents local toggle changes from being overwritten

  const resetForm = () => {
    setForm({ titleAr: '', title: '', specialty: 'emergency', difficulty: 'medium', duration: 15, scenario: '', symptoms: '', vitalsHr: 80, vitalsBp: '120/80', vitalsSpo2: 98, vitalsTemp: 37.0, vitalsRr: 16, isLocked: false })
    setShowForm(false)
    setEditingCase(null)
  }

  const handleSave = () => {
    if (!form.titleAr) return
    const symptomsList = form.symptoms.split('،').map(s => s.trim()).filter(Boolean)
    const newCase = {
      id: editingCase?.id || `sim-${Date.now()}`,
      titleAr: form.titleAr,
      title: form.title || form.titleAr,
      specialty: form.specialty,
      difficulty: form.difficulty,
      duration: form.duration,
      scenario: form.scenario,
      symptoms: symptomsList,
      vitals: { hr: form.vitalsHr, bp: form.vitalsBp, spo2: form.vitalsSpo2, temp: form.vitalsTemp, rr: form.vitalsRr },
      isLocked: form.isLocked,
    }
    if (editingCase) {
      setLocalCases(prev => {
        const updated = prev.map(c => c.id === editingCase.id ? newCase : c)
        updateSimulationCases(updated)
        return updated
      })
    } else {
      setLocalCases(prev => {
        const updated = [...prev, newCase]
        updateSimulationCases(updated)
        return updated
      })
    }
    resetForm()
  }

  const handleDelete = (id: string, title: string) => {
    setConfirmAction({
      type: 'delete',
      title: 'حذف حالة المحاكاة',
      message: 'هل أنت متأكد من حذف حالة المحاكاة؟',
      details: `سيتم حذف "${title}" نهائياً.`,
      confirmLabel: 'حذف الحالة',
      onConfirm: () => {
        const updated = localCases.filter(c => c.id !== id)
        setLocalCases(updated)
        updateSimulationCases(updated)
        setConfirmAction(null)
      },
    })
  }

  const handleToggleLock = (simCase: any) => {
    const updated = localCases.map(c => c.id === simCase.id ? { ...c, isLocked: !c.isLocked } : c)
    setLocalCases(updated)
    updateSimulationCases(updated)
  }

  const startEdit = (simCase: any) => {
    setEditingCase(simCase)
    setForm({
      titleAr: simCase?.titleAr ?? '', title: simCase?.title ?? '', specialty: simCase?.specialty ?? 'emergency', difficulty: simCase?.difficulty ?? 'medium',
      duration: simCase?.duration ?? 15, scenario: simCase?.scenario ?? '', symptoms: (simCase?.symptoms ?? []).join('،'),
      vitalsHr: simCase?.vitals?.hr ?? 80, vitalsBp: simCase?.vitals?.bp ?? '120/80', vitalsSpo2: simCase?.vitals?.spo2 ?? 98,
      vitalsTemp: simCase?.vitals?.temp ?? 37, vitalsRr: simCase?.vitals?.rr ?? 16, isLocked: simCase?.isLocked ?? false,
    })
    setShowForm(true)
  }

  const difficultyLabels: Record<string, string> = { easy: 'سهل', medium: 'متوسط', hard: 'صعب', expert: 'خبير' }
  const specialtyLabels: Record<string, string> = { emergency: 'طوارئ', neurology: 'أعصاب', icu: 'عناية مركزة', internal: 'باطني', cardiology: 'قلب', surgery: 'جراحة' }

  return (
    <motion.div key="simulation" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }} className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black neon-text flex items-center gap-3">
          <FlaskConical className="h-6 w-6 text-neon-cyan" /> إدارة المحاكاة
        </h1>
        <p className="text-sm text-muted-foreground mt-1">إدارة حالات المحاكاة السريرية</p>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={() => { resetForm(); setShowForm(true) }} disabled={showForm}
          className="bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/25 transition-all h-9">
          <Plus className="h-4 w-4 ml-1" /> إضافة حالة جديدة
        </Button>
        <Badge className="bg-neon-green/10 text-neon-green border-neon-green/20">{localCases.length} حالة</Badge>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="glass-card p-4 sm:p-5 space-y-4 border border-neon-green/20">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold flex items-center gap-2"><Edit3 className="h-4 w-4 text-neon-green" />{editingCase ? 'تعديل حالة' : 'إضافة حالة جديدة'}</h4>
              <Button variant="ghost" size="icon" onClick={resetForm} className="h-7 w-7 hover:bg-red-500/10"><X className="h-4 w-4 text-red-400" /></Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="text-xs text-muted-foreground mb-1 block">العنوان بالعربي *</label><Input value={form.titleAr} onChange={e => setForm({...form, titleAr: e.target.value})} className="bg-muted/50 border-border focus:border-neon-cyan/50 text-sm h-9" /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">العنوان بالإنجليزي</label><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="bg-muted/50 border-border focus:border-neon-cyan/50 text-sm h-9" dir="ltr" /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">التخصص</label>
                <Select value={form.specialty} onValueChange={v => setForm({...form, specialty: v})}>
                  <SelectTrigger className="bg-muted/50 border-border h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-med-card"><SelectItem value="emergency">طوارئ</SelectItem><SelectItem value="cardiology">قلب</SelectItem><SelectItem value="neurology">أعصاب</SelectItem><SelectItem value="icu">عناية مركزة</SelectItem><SelectItem value="internal">باطني</SelectItem><SelectItem value="surgery">جراحة</SelectItem></SelectContent>
                </Select>
              </div>
              <div><label className="text-xs text-muted-foreground mb-1 block">الصعوبة</label>
                <Select value={form.difficulty} onValueChange={v => setForm({...form, difficulty: v as any})}>
                  <SelectTrigger className="bg-muted/50 border-border h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-med-card"><SelectItem value="easy">سهل</SelectItem><SelectItem value="medium">متوسط</SelectItem><SelectItem value="hard">صعب</SelectItem><SelectItem value="expert">خبير</SelectItem></SelectContent>
                </Select>
              </div>
              <div><label className="text-xs text-muted-foreground mb-1 block">المدة (دقيقة)</label><Input type="number" value={form.duration} onChange={e => setForm({...form, duration: parseInt(e.target.value) || 0})} className="bg-muted/50 border-border focus:border-neon-cyan/50 text-sm h-9" /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">مقفلة؟</label><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.isLocked} onChange={e => setForm({...form, isLocked: e.target.checked})} className="rounded border-border bg-muted/50 text-neon-cyan focus:ring-neon-cyan/30" /><span className="text-xs text-muted-foreground">حالة مميزة</span></label></div>
            </div>
            <div><label className="text-xs text-muted-foreground mb-1 block">السيناريو</label><Textarea value={form.scenario} onChange={e => setForm({...form, scenario: e.target.value})} rows={3} className="bg-muted/50 border-border focus:border-neon-cyan/50 text-sm resize-none" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">الأعراض (مفصولة بفاصلة عربية)</label><Input value={form.symptoms} onChange={e => setForm({...form, symptoms: e.target.value})} className="bg-muted/50 border-border focus:border-neon-cyan/50 text-sm h-9" /></div>
            <div className="grid grid-cols-5 gap-2">
              <div><label className="text-[10px] text-muted-foreground block">HR</label><Input type="number" value={form.vitalsHr} onChange={e => setForm({...form, vitalsHr: parseInt(e.target.value) || 0})} className="bg-muted/50 border-border text-xs h-8" /></div>
              <div><label className="text-[10px] text-muted-foreground block">BP</label><Input value={form.vitalsBp} onChange={e => setForm({...form, vitalsBp: e.target.value})} className="bg-muted/50 border-border text-xs h-8" /></div>
              <div><label className="text-[10px] text-muted-foreground block">SpO2</label><Input type="number" value={form.vitalsSpo2} onChange={e => setForm({...form, vitalsSpo2: parseInt(e.target.value) || 0})} className="bg-muted/50 border-border text-xs h-8" /></div>
              <div><label className="text-[10px] text-muted-foreground block">Temp</label><Input type="number" step="0.1" value={form.vitalsTemp} onChange={e => setForm({...form, vitalsTemp: parseFloat(e.target.value) || 0})} className="bg-muted/50 border-border text-xs h-8" /></div>
              <div><label className="text-[10px] text-muted-foreground block">RR</label><Input type="number" value={form.vitalsRr} onChange={e => setForm({...form, vitalsRr: parseInt(e.target.value) || 0})} className="bg-muted/50 border-border text-xs h-8" /></div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={!form.titleAr} className="bg-neon-green/15 text-neon-green border border-neon-green/30 hover:bg-neon-green/25 transition-all h-9"><Save className="h-4 w-4 ml-1" />{editingCase ? 'حفظ التعديلات' : 'إضافة الحالة'}</Button>
              <Button variant="ghost" onClick={resetForm} className="text-muted-foreground hover:text-foreground h-9">إلغاء</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {localCases.length === 0 ? (
        <div className="glass-card p-12 text-center"><FlaskConical className="h-12 w-12 mx-auto mb-4 opacity-30 text-muted-foreground" /><p className="text-muted-foreground">لا توجد حالات محاكاة بعد</p></div>
      ) : (
        <div className="space-y-3">
          {localCases.map((simCase, idx) => (
            <motion.div key={simCase.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
              className="glass-card p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-neon-green/10 border border-neon-green/20 flex items-center justify-center shrink-0">
                  <FlaskConical className="h-4 w-4 text-neon-green" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">{simCase.titleAr}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge className="text-[9px] bg-neon-cyan/10 text-neon-cyan border-neon-cyan/20">{specialtyLabels[simCase?.specialty] || simCase?.specialty || 'طوارئ'}</Badge>
                    <Badge className="text-[9px] bg-neon-orange/10 text-neon-orange border-neon-orange/20">{difficultyLabels[simCase?.difficulty] || simCase?.difficulty || 'متوسط'}</Badge>
                    <span className="text-[10px] text-muted-foreground">{simCase.duration} د</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleToggleLock(simCase)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    simCase.isLocked
                      ? 'bg-neon-purple/10 text-neon-purple border-neon-purple/20 hover:bg-neon-purple/20'
                      : 'bg-neon-green/10 text-neon-green border-neon-green/20 hover:bg-neon-green/20'
                  }`}
                >
                  <div className={`w-7 h-4 rounded-full relative transition-colors ${simCase.isLocked ? 'bg-neon-purple/40' : 'bg-neon-green/40'}`}>
                    <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${simCase.isLocked ? 'right-0.5 bg-neon-purple' : 'left-0.5 bg-neon-green'}`} />
                  </div>
                  {simCase.isLocked ? 'مقفلة' : 'مفتوحة'}
                </button>
                <Button variant="ghost" size="sm" onClick={() => startEdit(simCase)} className="h-7 text-xs hover:bg-neon-cyan/10 text-neon-cyan"><Edit3 className="h-3 w-3 ml-1" /> تعديل</Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(simCase.id, simCase.titleAr)} className="h-7 text-xs hover:bg-red-500/10 text-red-400"><Trash2 className="h-3 w-3 ml-1" /> حذف</Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      {/* Confirm Action Modal */}
      <AnimatePresence>
        {confirmAction && (
          <ConfirmActionModal
            action={confirmAction}
            onCancel={() => setConfirmAction(null)}
            loading={confirmLoading}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Confirm Action Modal ─────────────────────────────────

interface ConfirmAction {
  type: 'delete' | 'approve' | 'reject' | 'warning'
  title: string
  message: string
  details?: string
  confirmLabel: string
  onConfirm: (note?: string) => void
  showNoteInput?: boolean
  notePlaceholder?: string
}

function ConfirmActionModal({ action, onCancel, loading }: { action: ConfirmAction; onCancel: () => void; loading: boolean }) {
  const [note, setNote] = useState('')

  // Reset note when action changes
  useEffect(() => { setNote('') }, [action])

  const iconConfig = {
    delete: { icon: Trash2, color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30', btnBg: 'bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/25' },
    reject: { icon: X, color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/30', btnBg: 'bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25' },
    approve: { icon: CheckCircle2, color: 'text-neon-green', bg: 'bg-neon-green/20', border: 'border-neon-green/30', btnBg: 'bg-neon-green/15 text-neon-green border-neon-green/30 hover:bg-neon-green/25' },
    warning: { icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/30', btnBg: 'bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25' },
  }

  const config = iconConfig[action.type]
  const IconComp = config.icon

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="glass-card p-6 max-w-md w-full border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="text-center mb-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20, delay: 0.1 }}
            className={`w-14 h-14 rounded-2xl ${config.bg} ${config.border} border flex items-center justify-center mx-auto mb-3`}
          >
            <IconComp className={`h-7 w-7 ${config.color}`} />
          </motion.div>
          <h3 className="text-lg font-bold">{action.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{action.message}</p>
        </div>

        {/* Details */}
        {action.details && (
          <div className="p-3 rounded-lg bg-muted/50 border border-border mb-4">
            <p className="text-xs text-muted-foreground">{action.details}</p>
          </div>
        )}

        {/* Note Input */}
        {action.showNoteInput && (
          <div className="mb-4">
            <label className="text-xs text-muted-foreground mb-1.5 block">ملاحظة (اختياري)</label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={action.notePlaceholder || 'أضف ملاحظة هنا...'}
              rows={2}
              className="bg-muted/50 border-border focus:border-neon-cyan/50 text-sm resize-none"
            />
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={() => action.onConfirm(note || undefined)}
            disabled={loading}
            className={`flex-1 border ${config.btnBg} h-10 transition-all`}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : action.confirmLabel}
          </Button>
          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 h-10"
          >
            إلغاء
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Community Management Section ─────────────────────────

function CommunityManagementSection() {
  const [apiGroups, setApiGroups] = useState<any[]>([])
  const [apiPosts, setApiPosts] = useState<any[]>([])
  const [joinRequests, setJoinRequests] = useState<any[]>([])
  const [totalPosts, setTotalPosts] = useState(0)
  const [dataLoading, setDataLoading] = useState(false)
  const [showGroupForm, setShowGroupForm] = useState(false)
  const [editingGroup, setEditingGroup] = useState<any>(null)
  const [groupForm, setGroupForm] = useState({ nameAr: '', name: '', icon: '📚', category: 'general', description: '' })
  const [broadcastMsg, setBroadcastMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [groupSaving, setGroupSaving] = useState(false)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null)
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [editPostContent, setEditPostContent] = useState('')
  const [editPostSaving, setEditPostSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'groups' | 'posts' | 'requests'>('groups')

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/community', { headers: getAuthHeaders() })
      const data = await res.json()
      if (data.success) {
        setApiGroups(data.groups || [])
        setApiPosts(data.posts || [])
        setTotalPosts(data.totalPosts || 0)
        setJoinRequests(data.joinRequests || [])
      }
    } catch (err) {
      console.error('Fetch community data error:', err)
    } finally {
      setDataLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const resetGroupForm = () => {
    setGroupForm({ nameAr: '', name: '', icon: '📚', category: 'general', description: '' })
    setShowGroupForm(false)
    setEditingGroup(null)
  }

  const handleSaveGroup = async () => {
    if (!groupForm.nameAr) return
    setGroupSaving(true)
    try {
      if (editingGroup) {
        const res = await fetch('/api/admin/community', {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            action: 'updateGroup',
            groupId: editingGroup.id,
            name: groupForm.name || groupForm.nameAr,
            nameAr: groupForm.nameAr,
            icon: groupForm.icon,
            category: groupForm.category,
            description: groupForm.description,
          }),
        })
        const data = await res.json()
        if (data.success) await fetchData()
      } else {
        const res = await fetch('/api/community/groups', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            name: groupForm.name || groupForm.nameAr,
            nameAr: groupForm.nameAr,
            icon: groupForm.icon,
            category: groupForm.category,
            description: groupForm.description,
          }),
        })
        const data = await res.json()
        if (data.success) await fetchData()
      }
    } catch (err) {
      console.error('Save group error:', err)
    }
    resetGroupForm()
    setGroupSaving(false)
  }

  const handleDeleteGroup = (id: string, name: string) => {
    setConfirmAction({
      type: 'delete',
      title: 'حذف المجموعة',
      message: 'هل أنت متأكد من حذف هذه المجموعة؟',
      details: `سيتم حذف مجموعة "${name}" وجميع طلبات الانضمام المرتبطة بها نهائياً.`,
      confirmLabel: 'حذف المجموعة',
      onConfirm: async () => {
        setConfirmLoading(true)
        try {
          const res = await fetch('/api/admin/community', {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ action: 'deleteGroup', groupId: id }),
          })
          const data = await res.json()
          if (data.success) await fetchData()
        } catch (err) {
          console.error('Delete group error:', err)
        }
        setConfirmLoading(false)
        setConfirmAction(null)
      },
    })
  }

  const startEditGroup = (group: any) => {
    setEditingGroup(group)
    setGroupForm({
      nameAr: group.nameAr,
      name: group.name,
      icon: group.icon || '📚',
      category: group.category || 'general',
      description: group.description || '',
    })
    setShowGroupForm(true)
  }

  const handleBroadcast = async () => {
    if (!broadcastMsg.trim()) return
    setSending(true)
    try {
      const res = await fetch('/api/admin/community', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ action: 'broadcast', message: broadcastMsg.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        setBroadcastMsg('')
        await fetchData()
      }
    } catch (err) {
      console.error('Broadcast error:', err)
    }
    setSending(false)
  }

  const handleDeletePost = (postId: string, author: string) => {
    setConfirmAction({
      type: 'delete',
      title: 'حذف المنشور',
      message: 'هل أنت متأكد من حذف هذا المنشور؟',
      details: `سيتم حذف منشور "${author}" وجميع التعليقات المرتبطة به نهائياً.`,
      confirmLabel: 'حذف المنشور',
      onConfirm: async () => {
        setConfirmLoading(true)
        try {
          const res = await fetch('/api/admin/community', {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ action: 'deletePost', postId }),
          })
          const data = await res.json()
          if (data.success) {
            await fetchData()
            setExpandedPostId(null)
            setEditingPostId(null)
          }
        } catch (err) {
          console.error('Delete post error:', err)
        }
        setConfirmLoading(false)
        setConfirmAction(null)
      },
    })
  }

  const handleEditPost = (post: any) => {
    setEditingPostId(post.id)
    setEditPostContent(post.content)
  }

  const handleSaveEditPost = async (postId: string) => {
    if (!editPostContent.trim()) return
    setEditPostSaving(true)
    try {
      const res = await fetch('/api/admin/community', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ action: 'editPost', postId, content: editPostContent.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        await fetchData()
        setEditingPostId(null)
        setEditPostContent('')
      }
    } catch (err) {
      console.error('Edit post error:', err)
    }
    setEditPostSaving(false)
  }

  const handleManageJoinRequest = (requestId: string, actionType: 'approve' | 'reject', userName: string, groupName: string) => {
    setConfirmAction({
      type: actionType === 'approve' ? 'approve' : 'reject',
      title: actionType === 'approve' ? 'قبول طلب الانضمام' : 'رفض طلب الانضمام',
      message: actionType === 'approve'
        ? 'هل تريد قبول طلب انضمام هذا المستخدم؟'
        : 'هل تريد رفض طلب انضمام هذا المستخدم؟',
      details: actionType === 'approve'
        ? `سيتم قبول "${userName}" في مجموعة "${groupName}" وسيتمكن من النشر والتعليق.`
        : `سيتم رفض طلب انضمام "${userName}" إلى مجموعة "${groupName}".`,
      confirmLabel: actionType === 'approve' ? 'قبول الطلب' : 'رفض الطلب',
      showNoteInput: actionType === 'reject',
      notePlaceholder: 'سبب الرفض (اختياري)...',
      onConfirm: async (note?: string) => {
        setConfirmLoading(true)
        try {
          const res = await fetch('/api/admin/community', {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({
              action: 'manageJoinRequest',
              requestId,
              requestAction: actionType,
              note: note || '',
            }),
          })
          const data = await res.json()
          if (data.success) await fetchData()
        } catch (err) {
          console.error('Manage join request error:', err)
        }
        setConfirmLoading(false)
        setConfirmAction(null)
      },
    })
  }

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      const diff = Date.now() - date.getTime()
      const minutes = Math.floor(diff / 60000)
      const hours = Math.floor(diff / 3600000)
      const days = Math.floor(diff / 86400000)
      if (minutes < 1) return 'الآن'
      if (minutes < 60) return `منذ ${minutes} دقيقة`
      if (hours < 24) return `منذ ${hours} ساعة`
      return `منذ ${days} يوم`
    } catch {
      return ''
    }
  }

  const totalPendingRequests = joinRequests.filter(r => r.status === 'pending').length

  return (
    <motion.div key="community" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black neon-text flex items-center gap-3">
            <MessageSquare className="h-6 w-6 text-neon-purple" /> إدارة المجتمع
          </h1>
          <p className="text-sm text-muted-foreground mt-1">إدارة مجموعات المجتمع والمنشورات وطلبات الانضمام</p>
        </div>
        <Button onClick={fetchData} variant="ghost" className="text-muted-foreground hover:text-foreground h-8 text-xs">
          <RefreshCw className="h-4 w-4 ml-1" /> تحديث
        </Button>
      </div>

      {/* Confirm Action Modal */}
      <AnimatePresence>
        {confirmAction && (
          <ConfirmActionModal
            action={confirmAction}
            onCancel={() => setConfirmAction(null)}
            loading={confirmLoading}
          />
        )}
      </AnimatePresence>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { title: 'المجموعات', value: String(apiGroups.length), icon: Users, color: 'text-neon-purple', bg: 'bg-neon-purple/10', border: 'border-neon-purple/20' },
          { title: 'المنشورات', value: String(totalPosts), icon: MessageSquare, color: 'text-neon-cyan', bg: 'bg-neon-cyan/10', border: 'border-neon-cyan/20' },
          { title: 'طلبات الانضمام', value: String(totalPendingRequests), icon: UserPlus, color: 'text-neon-orange', bg: 'bg-neon-orange/10', border: 'border-neon-orange/20' },
          { title: 'إجمالي الأعضاء', value: String(apiGroups.reduce((s: number, g: any) => s + (g.members || 0), 0)), icon: Users, color: 'text-neon-green', bg: 'bg-neon-green/10', border: 'border-neon-green/20' },
        ].map((item, idx) => (
          <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}
            className="glass-card p-4">
            <div className={`rounded-lg p-2 ${item.bg} ${item.border} border inline-block mb-2`}>
              <item.icon className={`h-4 w-4 ${item.color}`} />
            </div>
            <p className="text-xs text-muted-foreground">{item.title}</p>
            <p className="text-xl font-black neon-text mt-0.5">{item.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { id: 'groups' as const, label: 'المجموعات', icon: Users },
          { id: 'posts' as const, label: 'المنشورات', icon: MessageSquare },
          { id: 'requests' as const, label: 'طلبات الانضمام', icon: UserPlus, badge: totalPendingRequests },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-neon-purple/15 text-neon-purple border border-neon-purple/30'
                : 'text-muted-foreground hover:bg-muted border border-transparent'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            {tab.badge ? (
              <Badge className="bg-neon-orange/15 text-neon-orange border border-neon-orange/25 text-[9px] h-5 min-w-[20px] flex items-center justify-center">
                {tab.badge}
              </Badge>
            ) : null}
          </button>
        ))}
      </div>

      <>
          {/* ──── Groups Tab ──── */}
          {activeTab === 'groups' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold flex items-center gap-2"><Users className="h-4 w-4 text-neon-purple" /> المجموعات ({apiGroups.length})</h2>
                <Button onClick={() => { resetGroupForm(); setShowGroupForm(true) }} disabled={showGroupForm}
                  className="bg-neon-purple/15 text-neon-purple border border-neon-purple/30 hover:bg-neon-purple/25 transition-all h-8 text-xs">
                  <Plus className="h-3 w-3 ml-1" /> إضافة مجموعة
                </Button>
              </div>

              <AnimatePresence>
                {showGroupForm && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    className="glass-card p-4 space-y-3 border border-neon-purple/20">
                    <h4 className="text-sm font-bold">{editingGroup ? 'تعديل المجموعة' : 'إضافة مجموعة جديدة'}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div><label className="text-xs text-muted-foreground mb-1 block">الاسم بالعربي *</label><Input value={groupForm.nameAr} onChange={e => setGroupForm({...groupForm, nameAr: e.target.value})} className="bg-muted/50 border-border text-sm h-9" /></div>
                      <div><label className="text-xs text-muted-foreground mb-1 block">الاسم بالإنجليزي</label><Input value={groupForm.name} onChange={e => setGroupForm({...groupForm, name: e.target.value})} className="bg-muted/50 border-border text-sm h-9" dir="ltr" /></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div><label className="text-xs text-muted-foreground mb-1 block">الأيقونة (إيموجي)</label><Input value={groupForm.icon} onChange={e => setGroupForm({...groupForm, icon: e.target.value})} className="bg-muted/50 border-border text-sm h-9" /></div>
                      <div><label className="text-xs text-muted-foreground mb-1 block">التصنيف</label><Input value={groupForm.category} onChange={e => setGroupForm({...groupForm, category: e.target.value})} className="bg-muted/50 border-border text-sm h-9" dir="ltr" /></div>
                    </div>
                    <div><label className="text-xs text-muted-foreground mb-1 block">الوصف</label><Input value={groupForm.description} onChange={e => setGroupForm({...groupForm, description: e.target.value})} className="bg-muted/50 border-border text-sm h-9" /></div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveGroup} disabled={!groupForm.nameAr || groupSaving} className="bg-neon-purple/15 text-neon-purple border border-neon-purple/30 hover:bg-neon-purple/25 h-8 text-xs">
                        {groupSaving ? <Loader2 className="h-3 w-3 animate-spin ml-1" /> : <Save className="h-3 w-3 ml-1" />}
                        {editingGroup ? 'حفظ' : 'إضافة'}
                      </Button>
                      <Button variant="ghost" onClick={resetGroupForm} className="text-muted-foreground hover:text-foreground h-8 text-xs">إلغاء</Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {apiGroups.length === 0 ? (
                <div className="glass-card p-8 text-center"><Users className="h-10 w-10 mx-auto mb-3 opacity-30 text-muted-foreground" /><p className="text-sm text-muted-foreground">لا توجد مجموعات بعد</p></div>
              ) : (
                <div className="space-y-2">
                  {apiGroups.map((group: any, idx: number) => (
                    <motion.div key={group.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
                      className="glass-card p-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{group.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold truncate">{group.nameAr}</p>
                            {group.pendingRequests > 0 && (
                              <Badge className="bg-neon-orange/15 text-neon-orange border border-neon-orange/25 text-[8px] h-4 px-1.5">
                                {group.pendingRequests} طلب
                              </Badge>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground">{group.members.toLocaleString('ar-EG')} عضو · {group.category}</p>
                          {group.description && <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{group.description}</p>}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="ghost" size="sm" onClick={() => startEditGroup(group)} className="h-7 text-xs hover:bg-neon-purple/10 text-neon-purple"><Edit3 className="h-3 w-3 ml-1" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteGroup(group.id, group.nameAr)} className="h-7 text-xs hover:bg-red-500/10 text-red-400"><Trash2 className="h-3 w-3 ml-1" /></Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Broadcast Message */}
              <div className="glass-card p-4 border border-neon-orange/20">
                <h3 className="text-sm font-bold flex items-center gap-2 mb-3"><Send className="h-4 w-4 text-neon-orange" /> بث رسالة للمجتمع</h3>
                <Textarea value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)} placeholder="اكتب رسالة للبث لجميع أعضاء المجتمع..." rows={3}
                  className="bg-muted/50 border-border focus:border-neon-orange/50 text-sm resize-none mb-3" />
                <Button onClick={handleBroadcast} disabled={!broadcastMsg.trim() || sending}
                  className="bg-neon-orange/15 text-neon-orange border border-neon-orange/30 hover:bg-neon-orange/25 transition-all h-9 w-full">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 ml-2" /> بث الرسالة</>}
                </Button>
              </div>
            </motion.div>
          )}

          {/* ──── Posts Tab ──── */}
          {activeTab === 'posts' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <h2 className="text-base font-bold flex items-center gap-2"><MessageSquare className="h-4 w-4 text-neon-cyan" /> أحدث المنشورات ({totalPosts})</h2>
              {apiPosts.length === 0 ? (
                <div className="glass-card p-8 text-center"><MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30 text-muted-foreground" /><p className="text-sm text-muted-foreground">لا توجد منشورات بعد</p></div>
              ) : (
                <div className="space-y-3">
                  {apiPosts.map((post: any) => (
                    <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className="glass-card p-4">
                      {/* Post Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-purple/20 to-neon-cyan/20 flex items-center justify-center text-xs font-bold shrink-0">
                            {post.author?.charAt(0) || '؟'}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-bold">{post.author}</span>
                              {post.category === 'announcement' && (
                                <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/25 text-[8px] h-4">إعلان</Badge>
                              )}
                            </div>
                            <span className="text-[10px] text-muted-foreground">{formatDate(post.createdAt)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="ghost" size="sm" onClick={() => handleEditPost(post)} className="h-7 text-xs hover:bg-neon-cyan/10 text-neon-cyan">
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeletePost(post.id, post.author)} className="h-7 text-xs hover:bg-red-500/10 text-red-400">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Post Content - Full, not truncated */}
                      {editingPostId === post.id ? (
                        <div className="mb-3 space-y-2">
                          <Textarea
                            value={editPostContent}
                            onChange={(e) => setEditPostContent(e.target.value)}
                            rows={4}
                            className="bg-muted/50 border-border focus:border-neon-cyan/50 text-sm resize-none"
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleSaveEditPost(post.id)}
                              disabled={!editPostContent.trim() || editPostSaving}
                              className="bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/25 h-7 text-xs"
                            >
                              {editPostSaving ? <Loader2 className="h-3 w-3 animate-spin ml-1" /> : <Save className="h-3 w-3 ml-1" />}
                              حفظ
                            </Button>
                            <Button variant="ghost" onClick={() => setEditingPostId(null)} className="h-7 text-xs">إلغاء</Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm leading-7 whitespace-pre-line mb-3">{post.content}</p>
                      )}

                      {/* Tags */}
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {post.tags.map((tag: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-[9px] bg-neon-cyan/5 text-neon-cyan border-neon-cyan/15">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Post Stats + Expand Comments */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-muted-foreground">❤️ {post.likes}</span>
                          <span className="text-[10px] text-muted-foreground">💬 {post.comments}</span>
                        </div>
                        {post.comments > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedPostId(expandedPostId === post.id ? null : post.id)}
                            className="h-6 text-[10px] hover:bg-neon-cyan/10 text-neon-cyan"
                          >
                            <ChevronDown className={`h-3 w-3 ml-1 transition-transform ${expandedPostId === post.id ? 'rotate-180' : ''}`} />
                            {expandedPostId === post.id ? 'إخفاء التعليقات' : `عرض التعليقات (${post.comments})`}
                          </Button>
                        )}
                      </div>

                      {/* Expandable Comments */}
                      <AnimatePresence>
                        {expandedPostId === post.id && post.commentsList && post.commentsList.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-3 pt-3 border-t border-border space-y-2 max-h-64 overflow-y-auto">
                              {post.commentsList.map((comment: any) => (
                                <div key={comment.id} className="flex gap-2 p-2 rounded-lg bg-muted/20">
                                  <div className="w-6 h-6 rounded-full bg-neon-purple/10 flex items-center justify-center text-[9px] font-bold text-neon-purple shrink-0">
                                    {comment.authorName?.charAt(0) || '؟'}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-xs font-semibold">{comment.authorName}</span>
                                      <span className="text-[9px] text-muted-foreground">{formatDate(comment.createdAt)}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5">{comment.content}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ──── Join Requests Tab ──── */}
          {activeTab === 'requests' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <h2 className="text-base font-bold flex items-center gap-2"><UserPlus className="h-4 w-4 text-neon-orange" /> طلبات الانضمام المعلقة ({totalPendingRequests})</h2>
              {joinRequests.length === 0 ? (
                <div className="glass-card p-8 text-center">
                  <UserPlus className="h-10 w-10 mx-auto mb-3 opacity-30 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">لا توجد طلبات انضمام معلقة</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {joinRequests.map((req: any, idx: number) => (
                    <motion.div key={req.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
                      className="glass-card p-4 border-l-4 border-neon-orange">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-orange/20 to-neon-purple/20 flex items-center justify-center text-sm font-bold shrink-0">
                          {req.userName?.charAt(0) || '؟'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold">{req.userName}</p>
                          <p className="text-[10px] text-muted-foreground">
                            يطلب الانضمام إلى <span className="text-neon-purple font-semibold">{req.groupName}</span>
                          </p>
                          {req.userPhone && (
                            <p className="text-[10px] text-muted-foreground" dir="ltr">{req.userPhone}</p>
                          )}
                          <p className="text-[9px] text-muted-foreground mt-0.5">{formatDate(req.createdAt)}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleManageJoinRequest(req.id, 'approve', req.userName, req.groupName)}
                            className="h-8 text-xs hover:bg-neon-green/10 text-neon-green border border-neon-green/20"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 ml-1" /> قبول
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleManageJoinRequest(req.id, 'reject', req.userName, req.groupName)}
                            className="h-8 text-xs hover:bg-red-500/10 text-red-400 border border-red-500/20"
                          >
                            <X className="h-3.5 w-3.5 ml-1" /> رفض
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </>
    </motion.div>
  )
}

// ─── Quiz Management Section ────────────────────────────────

interface ApiQuizQuestion {
  id: string
  question: string
  questionAr: string
  options: string[]
  optionsAr: string[]
  correctIndex: number
  explanation: string
  explanationAr: string
  difficulty: 'easy' | 'medium' | 'hard'
  category: string
  active: boolean
  createdAt: string
}

const QUIZ_CATEGORIES = [
  { value: 'emergency', label: 'الطوارئ', icon: '🚑', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  { value: 'cardiology', label: 'القلب', icon: '❤️', color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' },
  { value: 'neurology', label: 'الأعصاب', icon: '🧠', color: 'text-neon-purple bg-neon-purple/10 border-neon-purple/20' },
  { value: 'pediatrics', label: 'الأطفال', icon: '👶', color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
  { value: 'surgery', label: 'الجراحة', icon: '🔪', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  { value: 'internal', label: 'الباطنة', icon: '🩺', color: 'text-neon-cyan bg-neon-cyan/10 border-neon-cyan/20' },
  { value: 'radiology', label: 'الأشعة', icon: '🔬', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
  { value: 'pharmacology', label: 'الأدوية', icon: '💊', color: 'text-neon-green bg-neon-green/10 border-neon-green/20' },
  { value: 'icu', label: 'العناية المركزة', icon: '🏥', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  { value: 'general', label: 'عام', icon: '📚', color: 'text-gray-400 bg-gray-500/10 border-gray-500/20' },
]

const DIFFICULTY_CONFIG = {
  easy: { label: 'سهل', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25', barColor: 'bg-emerald-400' },
  medium: { label: 'متوسط', color: 'bg-amber-500/15 text-amber-400 border-amber-500/25', barColor: 'bg-amber-400' },
  hard: { label: 'صعب', color: 'bg-red-500/15 text-red-400 border-red-500/25', barColor: 'bg-red-400' },
}

function QuizManagementSection() {
  // ─── State ────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'sets' | 'questions' | 'leaderboard'>('sets')
  const [dataLoading, setDataLoading] = useState(false)

  // Quiz Sets state
  const [quizSets, setQuizSets] = useState<any[]>([])
  const [showSetForm, setShowSetForm] = useState(false)
  const [editingSet, setEditingSet] = useState<any | null>(null)
  const [savingSet, setSavingSet] = useState(false)

  // Questions state
  const [questions, setQuestions] = useState<ApiQuizQuestion[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<ApiQuizQuestion | null>(null)
  const [saving, setSaving] = useState(false)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [quizStats, setQuizStats] = useState<any>(null)

  // Shared
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
  const [confirmLoading, setConfirmLoading] = useState(false)

  // Quiz Set form
  const [quizSetForm, setQuizSetForm] = useState({
    titleAr: '',
    title: '',
    descriptionAr: '',
    description: '',
    category: 'emergency',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    questionCount: 5,
    timeLimit: 0,
    xpReward: 10,
    coinReward: 5,
    icon: '📋',
    gradient: '',
    active: true,
  })

  // Question form
  const [form, setForm] = useState({
    questionAr: '',
    question: '',
    option1: '',
    option2: '',
    option3: '',
    option4: '',
    correctIndex: 0,
    explanationAr: '',
    explanation: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    category: 'emergency',
    active: true,
    selectedQuizSetIds: [] as string[],
  })

  // ─── Data Fetching ────────────────────────────────────────

  const fetchQuizSets = useCallback(async () => {
    try {
      const res = await fetch('/api/quizzes/sets', { headers: getAuthHeaders() })
      const data = await res.json()
      if (data.sets) setQuizSets(data.sets)
    } catch (err) {
      console.error('Fetch quiz sets error:', err)
    }
  }, [])

  const fetchQuestions = useCallback(async () => {
    try {
      const res = await fetch('/api/quizzes', { headers: getAuthHeaders() })
      const data = await res.json()
      if (data.questions) setQuestions(data.questions)
    } catch (err) {
      console.error('Fetch quizzes error:', err)
    }
  }, [])

  const fetchLeaderboard = useCallback(async () => {
    try {
      const [lbRes, statsRes] = await Promise.all([
        fetch('/api/quizzes/results?type=leaderboard&limit=20', { headers: getAuthHeaders() }),
        fetch('/api/quizzes/results?type=stats', { headers: getAuthHeaders() }),
      ])
      const lbData = await lbRes.json()
      const statsData = await statsRes.json()
      if (lbData.leaderboard) setLeaderboard(lbData.leaderboard)
      if (statsData.totalResults !== undefined) setQuizStats(statsData)
    } catch (err) {
      console.error('Fetch leaderboard error:', err)
    }
  }, [])

  const fetchAllData = useCallback(async () => {
    await Promise.all([fetchQuizSets(), fetchQuestions(), fetchLeaderboard()])
  }, [fetchQuizSets, fetchQuestions, fetchLeaderboard])

  useEffect(() => { fetchAllData() }, [fetchAllData])

  // ─── Quiz Set CRUD ────────────────────────────────────────

  const resetQuizSetForm = () => {
    setQuizSetForm({
      titleAr: '', title: '', descriptionAr: '', description: '',
      category: 'emergency', difficulty: 'medium', questionCount: 5,
      timeLimit: 0, xpReward: 10, coinReward: 5, icon: '📋', gradient: '', active: true,
    })
    setShowSetForm(false)
    setEditingSet(null)
  }

  const startEditSet = (s: any) => {
    setQuizSetForm({
      titleAr: s.titleAr || '', title: s.title || '',
      descriptionAr: s.descriptionAr || '', description: s.description || '',
      category: s.category || 'emergency', difficulty: s.difficulty || 'medium',
      questionCount: s.questionCount || 5, timeLimit: s.timeLimit || 0,
      xpReward: s.xpReward || 10, coinReward: s.coinReward || 5,
      icon: s.icon || '📋', gradient: s.gradient || '',
      active: s.active !== false,
    })
    setEditingSet(s)
    setShowSetForm(true)
  }

  const handleSaveSet = async () => {
    if (!quizSetForm.titleAr) return
    setSavingSet(true)
    try {
      const payload = { ...quizSetForm }
      if (editingSet) {
        const res = await fetch('/api/quizzes/sets', {
          method: 'PUT', headers: getAuthHeaders(),
          body: JSON.stringify({ id: editingSet.id, ...payload }),
        })
        const data = await res.json()
        if (data.success) { resetQuizSetForm(); await fetchQuizSets() }
      } else {
        const res = await fetch('/api/quizzes/sets', {
          method: 'POST', headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (data.success) { resetQuizSetForm(); await fetchQuizSets() }
      }
    } catch (err) { console.error('Save quiz set error:', err) }
    setSavingSet(false)
  }

  const handleDeleteSet = (set: any) => {
    setConfirmAction({
      type: 'delete',
      title: 'حذف مجموعة الاختبار',
      message: 'هل أنت متأكد من حذف مجموعة الاختبار؟',
      details: `سيتم حذف "${set.titleAr || set.title}" نهائياً.`,
      confirmLabel: 'حذف المجموعة',
      onConfirm: async () => {
        setConfirmLoading(true)
        try {
          const res = await fetch(`/api/quizzes/sets?id=${set.id}`, {
            method: 'DELETE', headers: getAuthHeaders(),
          })
          const data = await res.json()
          if (data.success) await fetchQuizSets()
        } catch (err) { console.error('Delete quiz set error:', err) }
        setConfirmLoading(false)
        setConfirmAction(null)
      },
    })
  }

  const handleToggleSetActive = async (s: any) => {
    try {
      await fetch('/api/quizzes/sets', {
        method: 'PUT', headers: getAuthHeaders(),
        body: JSON.stringify({ id: s.id, active: !s.active }),
      })
      await fetchQuizSets()
    } catch (err) { console.error('Toggle set active error:', err) }
  }

  // ─── Question CRUD ────────────────────────────────────────

  const resetQuestionForm = () => {
    setForm({
      questionAr: '', question: '', option1: '', option2: '', option3: '', option4: '',
      correctIndex: 0, explanationAr: '', explanation: '', difficulty: 'medium', category: 'emergency', active: true,
      selectedQuizSetIds: [],
    })
    setShowForm(false)
    setEditingQuestion(null)
  }

  const startEditQuestion = (q: ApiQuizQuestion) => {
    // Find which quiz sets contain this question
    const containingSets = quizSets
      .filter(s => (s.questionIds || []).includes(q.id))
      .map(s => s.id)
    setForm({
      questionAr: q.questionAr || q.question, question: q.question,
      option1: q.optionsAr?.[0] || q.options?.[0] || '',
      option2: q.optionsAr?.[1] || q.options?.[1] || '',
      option3: q.optionsAr?.[2] || q.options?.[2] || '',
      option4: q.optionsAr?.[3] || q.options?.[3] || '',
      correctIndex: q.correctIndex,
      explanationAr: q.explanationAr || q.explanation || '',
      explanation: q.explanation || '',
      difficulty: q.difficulty, category: q.category,
      active: q.active !== false,
      selectedQuizSetIds: containingSets,
    })
    setEditingQuestion(q)
    setShowForm(true)
  }

  const handleSaveQuestion = async () => {
    if (!form.questionAr || !form.option1 || !form.option2) return
    setSaving(true)
    try {
      const payload = {
        questionAr: form.questionAr, question: form.question || form.questionAr,
        optionsAr: [form.option1, form.option2, form.option3, form.option4].filter(Boolean),
        options: [form.option1, form.option2, form.option3, form.option4].filter(Boolean),
        correctIndex: form.correctIndex,
        explanationAr: form.explanationAr, explanation: form.explanation || form.explanationAr,
        difficulty: form.difficulty, category: form.category, active: form.active,
      }
      let savedQuestionId = editingQuestion?.id || null

      if (editingQuestion) {
        const res = await fetch('/api/quizzes', {
          method: 'PUT', headers: getAuthHeaders(),
          body: JSON.stringify({ id: editingQuestion.id, ...payload }),
        })
        const data = await res.json()
        if (data.success) { savedQuestionId = editingQuestion.id } 
        else { setSaving(false); return }
      } else {
        const res = await fetch('/api/quizzes', {
          method: 'POST', headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (data.success && data.question?.id) { savedQuestionId = data.question.id }
        else { setSaving(false); return }
      }

      // Update quiz sets with this question
      if (savedQuestionId && form.selectedQuizSetIds.length > 0) {
        for (const setId of form.selectedQuizSetIds) {
          const existingSet = quizSets.find(s => s.id === setId)
          if (existingSet) {
            const existingIds: string[] = existingSet.questionIds || []
            if (!existingIds.includes(savedQuestionId)) {
              const updatedIds = [...existingIds, savedQuestionId]
              await fetch('/api/quizzes/sets', {
                method: 'PUT', headers: getAuthHeaders(),
                body: JSON.stringify({ id: setId, questionIds: updatedIds }),
              })
            }
          }
        }
      }

      // Remove question from quiz sets that were unchecked
      if (savedQuestionId && editingQuestion) {
        const previousSets = quizSets.filter(s => (s.questionIds || []).includes(savedQuestionId)).map(s => s.id)
        const removedSets = previousSets.filter(id => !form.selectedQuizSetIds.includes(id))
        for (const setId of removedSets) {
          const existingSet = quizSets.find(s => s.id === setId)
          if (existingSet) {
            const updatedIds = (existingSet.questionIds || []).filter((id: string) => id !== savedQuestionId)
            await fetch('/api/quizzes/sets', {
              method: 'PUT', headers: getAuthHeaders(),
              body: JSON.stringify({ id: setId, questionIds: updatedIds }),
            })
          }
        }
      }

      resetQuestionForm()
      await Promise.all([fetchQuestions(), fetchQuizSets()])
    } catch (err) { console.error('Save quiz error:', err) }
    setSaving(false)
  }

  const handleDeleteQuestion = (id: string, questionText: string) => {
    setConfirmAction({
      type: 'delete', title: 'حذف السؤال',
      message: 'هل أنت متأكد من حذف هذا السؤال؟',
      details: `سيتم حذف "${questionText.substring(0, 50)}..." نهائياً.`,
      confirmLabel: 'حذف السؤال',
      onConfirm: async () => {
        setConfirmLoading(true)
        try {
          const res = await fetch(`/api/quizzes?id=${id}`, { method: 'DELETE', headers: getAuthHeaders() })
          const data = await res.json()
          if (data.success) await fetchQuestions()
        } catch (err) { console.error('Delete quiz error:', err) }
        setConfirmLoading(false)
        setConfirmAction(null)
      },
    })
  }

  const handleToggleQuestionActive = async (q: ApiQuizQuestion) => {
    try {
      await fetch('/api/quizzes', {
        method: 'PUT', headers: getAuthHeaders(),
        body: JSON.stringify({ id: q.id, active: !q.active }),
      })
      await fetchQuestions()
    } catch (err) { console.error('Toggle active error:', err) }
  }

  // ─── Computed ─────────────────────────────────────────────

  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      if (filterCategory !== 'all' && q.category !== filterCategory) return false
      if (filterDifficulty !== 'all' && q.difficulty !== filterDifficulty) return false
      if (searchQuery) {
        const text = (q.questionAr || q.question || '').toLowerCase()
        if (!text.includes(searchQuery.toLowerCase())) return false
      }
      return true
    })
  }, [questions, filterCategory, filterDifficulty, searchQuery])

  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {}
    questions.forEach(q => { stats[q.category] = (stats[q.category] || 0) + 1 })
    return stats
  }, [questions])

  const difficultyStats = useMemo(() => {
    const stats: Record<string, number> = { easy: 0, medium: 0, hard: 0 }
    questions.forEach(q => { stats[q.difficulty] = (stats[q.difficulty] || 0) + 1 })
    return stats
  }, [questions])

  const ICON_OPTIONS = ['📋', '🧠', '❤️', '🚑', '🔬', '💊', '🔪', '👶', '🩺', '🏥', '⚡', '🎯', '📖', '🃏', '🏆', '🧪', '💡', '🩻']

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* ─── Confirmation Dialog ─── */}
      <AnimatePresence>
        {confirmAction && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => !confirmLoading && setConfirmAction(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card p-6 max-w-sm w-full"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-red-400 mb-2">{confirmAction.title}</h3>
              <p className="text-sm text-muted-foreground mb-1">{confirmAction.message}</p>
              <p className="text-xs text-muted-foreground/70 mb-4">{confirmAction.details}</p>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setConfirmAction(null)} disabled={confirmLoading} className="flex-1">إلغاء</Button>
                <Button size="sm" onClick={confirmAction.onConfirm} disabled={confirmLoading}
                  className="flex-1 bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30">
                  {confirmLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : confirmAction.confirmLabel}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Header ─── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500/20 via-orange-500/15 to-red-500/10 flex items-center justify-center border border-amber-500/20">
            <Trophy className="h-6 w-6 text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold">إدارة الاختبارات</h2>
            <p className="text-xs text-muted-foreground mt-0.5">إدارة مجموعات الاختبارات والأسئلة ومتابعة المتصدرين</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => fetchAllData()}
            variant="ghost" size="sm" className="h-9 px-3 text-muted-foreground hover:text-neon-cyan"
          >
            <RefreshCw className="h-4 w-4 ml-1" />
            تحديث
          </Button>
          {activeTab === 'sets' && (
            <Button onClick={() => { resetQuizSetForm(); setShowSetForm(true) }}
              className="h-9 bg-gradient-to-l from-neon-cyan to-cyan-400 text-med-dark font-bold rounded-xl">
              <Plus className="h-4 w-4 ml-1" />
              إضافة اختبار
            </Button>
          )}
          {activeTab === 'questions' && (
            <Button onClick={() => { resetQuestionForm(); setShowForm(true) }}
              className="h-9 bg-gradient-to-l from-neon-cyan to-cyan-400 text-med-dark font-bold rounded-xl">
              <Plus className="h-4 w-4 ml-1" />
              إضافة سؤال
            </Button>
          )}
        </div>
      </motion.div>

      {/* ─── Stats Overview ─── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { icon: <Layers className="h-5 w-5" />, label: 'مجموعات الاختبار', value: quizSets.length, color: 'text-neon-purple', border: 'border-neon-purple/15', bg: 'bg-neon-purple/10' },
          { icon: <HelpCircle className="h-5 w-5" />, label: 'إجمالي الأسئلة', value: questions.length, color: 'text-neon-cyan', border: 'border-neon-cyan/15', bg: 'bg-neon-cyan/10' },
          { icon: <CheckCircle2 className="h-5 w-5" />, label: 'أسئلة نشطة', value: questions.filter(q => q.active !== false).length, color: 'text-emerald-400', border: 'border-emerald-500/15', bg: 'bg-emerald-500/10' },
          { icon: <Layers className="h-5 w-5" />, label: 'التصنيفات', value: Object.keys(categoryStats).length, color: 'text-amber-400', border: 'border-amber-500/15', bg: 'bg-amber-500/10' },
          { icon: <Trophy className="h-5 w-5" />, label: 'محاولات الاختبار', value: quizStats?.totalResults || 0, color: 'text-neon-purple', border: 'border-neon-purple/15', bg: 'bg-neon-purple/10' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`glass-card p-4 ${stat.border} relative overflow-hidden`}>
            <div className={`absolute top-0 left-0 w-16 h-16 ${stat.bg} rounded-full blur-2xl -translate-x-4 -translate-y-4`} />
            <div className="relative">
              <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center mb-2 ${stat.color}`}>
                {stat.icon}
              </div>
              <p className="text-2xl font-black text-foreground">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ─── Tabs ─── */}
      <div className="flex gap-1 border-b border-border">
        {[
          { id: 'sets' as const, label: 'الاختبارات', icon: Layers, count: quizSets.length },
          { id: 'questions' as const, label: 'الأسئلة', icon: HelpCircle, count: filteredQuestions.length },
          { id: 'leaderboard' as const, label: 'المتصدرين', icon: Trophy, count: leaderboard.length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
              activeTab === tab.id
                ? 'border-neon-cyan text-neon-cyan'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            <Badge className="text-[9px] h-5 min-w-[20px] flex items-center justify-center bg-muted/30 text-muted-foreground border-0">
              {tab.count}
            </Badge>
          </button>
        ))}
      </div>

      {/* ━━━━━━━━━━━━ Quiz Sets Tab ━━━━━━━━━━━━ */}
      {activeTab === 'sets' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">

          {/* Add/Edit Set Form */}
          <AnimatePresence>
            {showSetForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="glass-card p-5 border border-neon-purple/20 space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-32 h-32 bg-neon-purple/5 rounded-full blur-3xl" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-neon-purple/20 to-neon-cyan/10 flex items-center justify-center">
                          {editingSet ? <Edit3 className="h-4 w-4 text-neon-purple" /> : <Plus className="h-4 w-4 text-neon-purple" />}
                        </div>
                        {editingSet ? 'تعديل مجموعة الاختبار' : 'إضافة مجموعة اختبار جديدة'}
                      </h3>
                      <Button variant="ghost" size="sm" onClick={resetQuizSetForm} className="h-7 w-7 p-0">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Title */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">العنوان بالعربي *</label>
                        <Input value={quizSetForm.titleAr} onChange={e => setQuizSetForm(p => ({ ...p, titleAr: e.target.value }))}
                          placeholder="مثال: اختبار أمراض القلب" className="bg-muted/20 border-border h-10" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">العنوان بالإنجليزي</label>
                        <Input value={quizSetForm.title} onChange={e => setQuizSetForm(p => ({ ...p, title: e.target.value }))}
                          placeholder="e.g. Cardiology Quiz" className="bg-muted/20 border-border h-10" dir="ltr" />
                      </div>
                    </div>

                    {/* Description */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">الوصف بالعربي</label>
                        <Textarea value={quizSetForm.descriptionAr} onChange={e => setQuizSetForm(p => ({ ...p, descriptionAr: e.target.value }))}
                          placeholder="وصف مختصر للاختبار..." rows={2} className="bg-muted/20 border-border resize-none" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">الوصف بالإنجليزي</label>
                        <Textarea value={quizSetForm.description} onChange={e => setQuizSetForm(p => ({ ...p, description: e.target.value }))}
                          placeholder="Quiz description..." rows={2} className="bg-muted/20 border-border resize-none" dir="ltr" />
                      </div>
                    </div>

                    {/* Category + Difficulty + Icon */}
                    <div className="grid grid-cols-3 gap-3 mt-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">التصنيف *</label>
                        <Select value={quizSetForm.category} onValueChange={v => setQuizSetForm(p => ({ ...p, category: v }))}>
                          <SelectTrigger className="bg-muted/20 border-border h-9 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {QUIZ_CATEGORIES.map(cat => (
                              <SelectItem key={cat.value} value={cat.value}>{cat.icon} {cat.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">الصعوبة</label>
                        <Select value={quizSetForm.difficulty} onValueChange={v => setQuizSetForm(p => ({ ...p, difficulty: v as any }))}>
                          <SelectTrigger className="bg-muted/20 border-border h-9 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="easy">سهل</SelectItem>
                            <SelectItem value="medium">متوسط</SelectItem>
                            <SelectItem value="hard">صعب</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">الأيقونة</label>
                        <div className="flex flex-wrap gap-1 bg-muted/20 border rounded-md p-1.5 max-h-9 overflow-hidden">
                          {ICON_OPTIONS.slice(0, 8).map(ic => (
                            <button key={ic} type="button" onClick={() => setQuizSetForm(p => ({ ...p, icon: ic }))}
                              className={`text-sm rounded p-0.5 transition-all ${quizSetForm.icon === ic ? 'bg-neon-purple/20 ring-1 ring-neon-purple/50 scale-110' : 'hover:bg-muted/40'}`}>
                              {ic}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Numeric Fields */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">عدد الأسئلة</label>
                        <Input type="number" value={quizSetForm.questionCount} onChange={e => setQuizSetForm(p => ({ ...p, questionCount: parseInt(e.target.value) || 5 }))}
                          className="bg-muted/20 border-border h-9" min={1} />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">الوقت (ثانية)</label>
                        <Input type="number" value={quizSetForm.timeLimit} onChange={e => setQuizSetForm(p => ({ ...p, timeLimit: parseInt(e.target.value) || 0 }))}
                          className="bg-muted/20 border-border h-9" min={0} placeholder="0 = بدون حد" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">مكافأة XP</label>
                        <Input type="number" value={quizSetForm.xpReward} onChange={e => setQuizSetForm(p => ({ ...p, xpReward: parseInt(e.target.value) || 10 }))}
                          className="bg-muted/20 border-border h-9" min={0} />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">مكافأة عملات</label>
                        <Input type="number" value={quizSetForm.coinReward} onChange={e => setQuizSetForm(p => ({ ...p, coinReward: parseInt(e.target.value) || 5 }))}
                          className="bg-muted/20 border-border h-9" min={0} />
                      </div>
                    </div>

                    {/* Active Toggle */}
                    <div className="mt-3">
                      <button
                        onClick={() => setQuizSetForm(p => ({ ...p, active: !p.active }))}
                        className={`h-9 px-4 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all ${
                          quizSetForm.active ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/25 text-red-400'
                        }`}
                      >
                        {quizSetForm.active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                        {quizSetForm.active ? 'نشط' : 'معطل'}
                      </button>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-3">
                      <Button variant="ghost" onClick={resetQuizSetForm} className="flex-1 h-10 rounded-xl">إلغاء</Button>
                      <Button onClick={handleSaveSet} disabled={savingSet || !quizSetForm.titleAr}
                        className="flex-1 h-10 bg-gradient-to-l from-neon-purple to-neon-cyan text-white font-bold rounded-xl">
                        {savingSet ? <Loader2 className="h-4 w-4 animate-spin" /> : editingSet ? 'حفظ التعديلات' : 'إضافة المجموعة'}
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quiz Sets List */}
          {quizSets.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <Layers className="h-14 w-14 mx-auto mb-4 opacity-15 text-muted-foreground" />
              <h3 className="text-base font-bold text-muted-foreground mb-1">لا توجد مجموعات اختبار</h3>
              <p className="text-sm text-muted-foreground/60">ابدأ بإضافة مجموعات اختبار تظهر للمستخدمين</p>
              <Button onClick={() => { resetQuizSetForm(); setShowSetForm(true) }}
                className="mt-4 bg-gradient-to-l from-neon-purple to-neon-cyan text-white font-bold rounded-xl">
                <Plus className="h-4 w-4 ml-1" /> إضافة اختبار
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {quizSets.map((s, idx) => {
                const catInfo = QUIZ_CATEGORIES.find(c => c.value === s.category)
                const diffConfig = DIFFICULTY_CONFIG[s.difficulty as keyof typeof DIFFICULTY_CONFIG] || DIFFICULTY_CONFIG.medium
                return (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.04, 0.4) }}
                    className={`glass-card p-4 border ${catInfo?.color || 'border-border'} relative overflow-hidden ${s.active === false ? 'opacity-50' : ''}`}
                  >
                    <div className="absolute top-0 left-0 w-20 h-20 bg-current/5 rounded-full blur-2xl -translate-x-6 -translate-y-6" />
                    <div className="relative">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-purple/15 to-neon-cyan/10 flex items-center justify-center text-lg border border-neon-purple/15">
                            {s.icon || '📋'}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-sm line-clamp-1">{s.titleAr || s.title}</h3>
                            {s.descriptionAr && <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{s.descriptionAr}</p>}
                          </div>
                        </div>
                        {/* Actions */}
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button onClick={() => handleToggleSetActive(s)}
                            className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all ${
                              s.active !== false ? 'hover:bg-emerald-500/10 text-emerald-400' : 'hover:bg-red-500/10 text-red-400'
                            }`} title={s.active !== false ? 'تعطيل' : 'تفعيل'}>
                            {s.active !== false ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                          </button>
                          <button onClick={() => startEditSet(s)}
                            className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-neon-cyan/10 text-neon-cyan transition-all" title="تعديل">
                            <Edit3 className="h-3 w-3" />
                          </button>
                          <button onClick={() => handleDeleteSet(s)}
                            className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-red-500/10 text-red-400 transition-all" title="حذف">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        <Badge className={`${diffConfig.color} border text-[9px]`}>{diffConfig.label}</Badge>
                        <Badge className={`${catInfo?.color || 'bg-muted/30 text-muted-foreground border-border'} border text-[9px]`}>
                          {catInfo?.icon} {catInfo?.label}
                        </Badge>
                        {s.active !== false && (
                          <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/25 text-[9px] border">نشط</Badge>
                        )}
                      </div>

                      {/* Stats Row */}
                      <div className="grid grid-cols-4 gap-1.5">
                        <div className="bg-muted/20 rounded-lg p-1.5 text-center">
                          <p className="text-xs font-bold text-foreground">{s.questionCount || 0}</p>
                          <p className="text-[8px] text-muted-foreground">سؤال</p>
                        </div>
                        <div className="bg-muted/20 rounded-lg p-1.5 text-center">
                          <p className="text-xs font-bold text-foreground">{s.timeLimit > 0 ? `${Math.floor(s.timeLimit / 60)}:${String(s.timeLimit % 60).padStart(2, '0')}` : '∞'}</p>
                          <p className="text-[8px] text-muted-foreground">الوقت</p>
                        </div>
                        <div className="bg-muted/20 rounded-lg p-1.5 text-center">
                          <p className="text-xs font-bold text-neon-cyan">{s.xpReward || 0}</p>
                          <p className="text-[8px] text-muted-foreground">XP</p>
                        </div>
                        <div className="bg-muted/20 rounded-lg p-1.5 text-center">
                          <p className="text-xs font-bold text-amber-400">{s.attemptCount || 0}</p>
                          <p className="text-[8px] text-muted-foreground">محاولة</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* ━━━━━━━━━━━━ Questions Tab ━━━━━━━━━━━━ */}
      {activeTab === 'questions' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">

          {/* Difficulty & Category Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="glass-card p-4">
              <p className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
                <BarChart3 className="h-3.5 w-3.5" /> توزيع الصعوبة
              </p>
              <div className="space-y-3">
                {(['easy', 'medium', 'hard'] as const).map(d => {
                  const config = DIFFICULTY_CONFIG[d]
                  const count = difficultyStats[d]
                  const pct = questions.length > 0 ? Math.round((count / questions.length) * 100) : 0
                  return (
                    <div key={d}>
                      <div className="flex items-center justify-between mb-1">
                        <Badge className={`${config.color} border text-[10px]`}>{config.label}</Badge>
                        <span className="text-[10px] text-muted-foreground">{count} سؤال ({pct}%)</span>
                      </div>
                      <div className="h-2.5 rounded-full bg-muted/30 overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.3 }}
                          className={`h-full rounded-full ${config.barColor}`} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="glass-card p-4">
              <p className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" /> توزيع التصنيفات
              </p>
              <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto">
                {QUIZ_CATEGORIES.map(cat => {
                  const count = categoryStats[cat.value] || 0
                  return (
                    <div key={cat.value} className={`flex items-center gap-2 rounded-lg p-1.5 ${cat.color} border`}>
                      <span className="text-sm">{cat.icon}</span>
                      <div className="flex-1 min-w-0"><p className="text-[10px] font-semibold truncate">{cat.label}</p></div>
                      <span className="text-[10px] font-bold">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Add/Edit Question Form */}
          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="glass-card p-5 border border-neon-cyan/20 space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-32 h-32 bg-neon-cyan/5 rounded-full blur-3xl" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-neon-cyan/20 to-neon-blue/10 flex items-center justify-center">
                          {editingQuestion ? <Edit3 className="h-4 w-4 text-neon-cyan" /> : <Plus className="h-4 w-4 text-neon-cyan" />}
                        </div>
                        {editingQuestion ? 'تعديل السؤال' : 'إضافة سؤال جديد'}
                      </h3>
                      <Button variant="ghost" size="sm" onClick={resetQuestionForm} className="h-7 w-7 p-0">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">نص السؤال *</label>
                      <Textarea value={form.questionAr} onChange={e => setForm(p => ({ ...p, questionAr: e.target.value }))}
                        placeholder="أدخل نص السؤال بالعربية..." className="min-h-[80px] bg-muted/20 border-border" />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">الخيارات * (اضغط على الدائرة لتحديد الإجابة الصحيحة)</label>
                      <div className="space-y-2">
                        {[0, 1, 2, 3].map(idx => {
                          const key = `option${idx + 1}` as 'option1' | 'option2' | 'option3' | 'option4'
                          const isCorrect = form.correctIndex === idx
                          const labels = ['أ', 'ب', 'ج', 'د']
                          return (
                            <div key={idx} className="flex items-center gap-2">
                              <button onClick={() => setForm(p => ({ ...p, correctIndex: idx }))}
                                className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold transition-all shrink-0 ${
                                  isCorrect
                                    ? 'bg-neon-green/20 border-2 border-neon-green/50 text-neon-green shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                                    : 'bg-muted/30 border-2 border-border text-muted-foreground hover:border-neon-green/30'
                                }`}>
                                {isCorrect ? <CheckCircle2 className="h-4 w-4" /> : labels[idx]}
                              </button>
                              <Input value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                                placeholder={`الخيار ${idx + 1}${idx < 2 ? ' *' : ''}`}
                                className={`bg-muted/20 ${isCorrect ? 'border-neon-green/30 shadow-[0_0_8px_rgba(16,185,129,0.1)]' : 'border-border'}`} />
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">الشرح</label>
                      <Textarea value={form.explanationAr} onChange={e => setForm(p => ({ ...p, explanationAr: e.target.value }))}
                        placeholder="شرح الإجابة الصحيحة..." className="min-h-[60px] bg-muted/20 border-border" />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">التصنيف *</label>
                        <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                          <SelectTrigger className="bg-muted/20 border-border h-9 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {QUIZ_CATEGORIES.map(cat => (
                              <SelectItem key={cat.value} value={cat.value}>{cat.icon} {cat.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">الصعوبة</label>
                        <Select value={form.difficulty} onValueChange={v => setForm(p => ({ ...p, difficulty: v as any }))}>
                          <SelectTrigger className="bg-muted/20 border-border h-9 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="easy">سهل</SelectItem>
                            <SelectItem value="medium">متوسط</SelectItem>
                            <SelectItem value="hard">صعب</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">الحالة</label>
                        <button onClick={() => setForm(p => ({ ...p, active: !p.active }))}
                          className={`w-full h-9 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                            form.active ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/25 text-red-400'
                          }`}>
                          {form.active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                          {form.active ? 'نشط' : 'معطل'}
                        </button>
                      </div>
                    </div>

                    {/* Quiz Set Selector */}
                    {quizSets.length > 0 && (
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block flex items-center gap-1.5">
                          <Layers className="h-3.5 w-3.5" />
                          إضافة إلى مجموعة اختبار
                        </label>
                        <div className="flex flex-wrap gap-2 bg-muted/20 border border-border rounded-xl p-3 max-h-[120px] overflow-y-auto">
                          {quizSets.map(s => {
                            const isSelected = form.selectedQuizSetIds.includes(s.id)
                            return (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => {
                                  setForm(p => ({
                                    ...p,
                                    selectedQuizSetIds: isSelected
                                      ? p.selectedQuizSetIds.filter(id => id !== s.id)
                                      : [...p.selectedQuizSetIds, s.id],
                                    category: !isSelected && p.selectedQuizSetIds.length === 0 ? s.category : p.category,
                                  }))
                                }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                                  isSelected
                                    ? 'bg-neon-cyan/15 border-neon-cyan/40 text-neon-cyan shadow-[0_0_8px_rgba(0,245,255,0.1)]'
                                    : 'bg-muted/30 border-border text-muted-foreground hover:border-neon-cyan/20 hover:text-foreground'
                                }`}
                              >
                                <span className="text-sm">{s.icon || '📋'}</span>
                                <span>{s.titleAr || s.title}</span>
                                {isSelected && <CheckCircle2 className="h-3 w-3" />}
                              </button>
                            )
                          })}
                        </div>
                        <p className="text-[10px] text-muted-foreground/50 mt-1">اختر المجموعات التي سيظهر فيها هذا السؤال</p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button variant="ghost" onClick={resetQuestionForm} className="flex-1 h-10 rounded-xl">إلغاء</Button>
                      <Button onClick={handleSaveQuestion} disabled={saving || !form.questionAr || !form.option1 || !form.option2}
                        className="flex-1 h-10 bg-gradient-to-l from-neon-cyan to-cyan-400 text-med-dark font-bold rounded-xl">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingQuestion ? 'حفظ التعديلات' : 'إضافة السؤال'}
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search + Filters */}
          <div className="flex gap-2 flex-wrap items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="بحث في الأسئلة..." className="h-8 text-xs bg-muted/20 border-border pr-8" />
              <HelpCircle className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[140px] h-8 text-xs bg-muted/20 border-border"><SelectValue placeholder="التصنيف" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع التصنيفات</SelectItem>
                {QUIZ_CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.icon} {cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
              <SelectTrigger className="w-[120px] h-8 text-xs bg-muted/20 border-border"><SelectValue placeholder="الصعوبة" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="easy">سهل</SelectItem>
                <SelectItem value="medium">متوسط</SelectItem>
                <SelectItem value="hard">صعب</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Questions List */}
          {filteredQuestions.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <HelpCircle className="h-14 w-14 mx-auto mb-4 opacity-15 text-muted-foreground" />
              <h3 className="text-base font-bold text-muted-foreground mb-1">لا توجد أسئلة</h3>
              <p className="text-sm text-muted-foreground/60">ابدأ بإضافة أسئلة للاختبارات</p>
              <Button onClick={() => { resetQuestionForm(); setShowForm(true) }}
                className="mt-4 bg-gradient-to-l from-neon-cyan to-cyan-400 text-med-dark font-bold rounded-xl">
                <Plus className="h-4 w-4 ml-1" /> إضافة سؤال
              </Button>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredQuestions.map((q, idx) => {
                const catInfo = QUIZ_CATEGORIES.find(c => c.value === q.category)
                const diffConfig = DIFFICULTY_CONFIG[q.difficulty]
                return (
                  <motion.div
                    key={q.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.02, 0.5) }}
                    className={`glass-card p-4 border-r-4 ${q.active !== false ? 'border-r-neon-cyan' : 'border-r-red-400/50 opacity-60'} hover:bg-muted/5 transition-colors`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/15 to-orange-500/15 flex items-center justify-center text-xs font-bold text-amber-400 shrink-0 mt-0.5 border border-amber-500/15">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground leading-7 line-clamp-2">{q.questionAr || q.question}</p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {(q.optionsAr || q.options || []).map((opt: string, oi: number) => (
                            <span key={oi} className={`text-[10px] px-2 py-0.5 rounded-lg ${
                              oi === q.correctIndex ? 'bg-neon-green/15 text-neon-green border border-neon-green/25 font-bold' : 'bg-muted/30 text-muted-foreground border border-border'
                            }`}>
                              {oi === q.correctIndex && '✓ '}{opt}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={`${diffConfig.color} border text-[9px]`}>{diffConfig.label}</Badge>
                          <Badge className={`${catInfo?.color || 'bg-muted/30 text-muted-foreground border-border'} border text-[9px]`}>
                            {catInfo?.icon} {catInfo?.label}
                          </Badge>
                          {q.explanationAr && (
                            <span className="text-[9px] text-muted-foreground/50 flex items-center gap-0.5">
                              <Info className="h-2.5 w-2.5" /> شرح
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => handleToggleQuestionActive(q)}
                          className={`h-8 w-8 rounded-xl flex items-center justify-center transition-all ${
                            q.active !== false ? 'hover:bg-emerald-500/10 text-emerald-400' : 'hover:bg-red-500/10 text-red-400'
                          }`} title={q.active !== false ? 'تعطيل' : 'تفعيل'}>
                          {q.active !== false ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                        </button>
                        <button onClick={() => startEditQuestion(q)}
                          className="h-8 w-8 rounded-xl flex items-center justify-center hover:bg-neon-cyan/10 text-neon-cyan transition-all" title="تعديل">
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleDeleteQuestion(q.id, q.questionAr || q.question)}
                          className="h-8 w-8 rounded-xl flex items-center justify-center hover:bg-red-500/10 text-red-400 transition-all" title="حذف">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* ━━━━━━━━━━━━ Leaderboard Tab ━━━━━━━━━━━━ */}
      {activeTab === 'leaderboard' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {/* Stats Cards */}
          {quizStats && (
            <div className="grid grid-cols-3 gap-3">
              <div className="glass-card p-4 text-center border border-amber-500/15 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent" />
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center mx-auto mb-2">
                    <Trophy className="h-5 w-5 text-amber-400" />
                  </div>
                  <p className="text-2xl font-black text-amber-400">{quizStats.totalResults}</p>
                  <p className="text-[10px] text-muted-foreground">إجمالي المحاولات</p>
                </div>
              </div>
              <div className="glass-card p-4 text-center border border-neon-cyan/15 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-neon-cyan/5 to-transparent" />
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-neon-cyan/15 flex items-center justify-center mx-auto mb-2">
                    <Target className="h-5 w-5 text-neon-cyan" />
                  </div>
                  <p className="text-2xl font-black text-neon-cyan">{quizStats.avgScore}%</p>
                  <p className="text-[10px] text-muted-foreground">متوسط النتائج</p>
                </div>
              </div>
              <div className="glass-card p-4 text-center border border-neon-purple/15 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-neon-purple/5 to-transparent" />
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-neon-purple/15 flex items-center justify-center mx-auto mb-2">
                    <Zap className="h-5 w-5 text-neon-purple" />
                  </div>
                  <p className="text-2xl font-black text-neon-purple">{quizStats.totalXpEarned?.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">XP مكتسبة</p>
                </div>
              </div>
            </div>
          )}

          {/* Mode Stats */}
          {quizStats?.modeStats && quizStats.modeStats.length > 0 && (
            <div className="glass-card p-4">
              <p className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
                <Shuffle className="h-3.5 w-3.5" /> إحصائيات أنماط الاختبار
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { mode: 'quick', label: 'سريع', icon: '⚡', color: 'text-neon-cyan' },
                  { mode: 'topic', label: 'موضوعي', icon: '🎯', color: 'text-neon-purple' },
                  { mode: 'timed', label: 'تحدي الوقت', icon: '⏱️', color: 'text-neon-orange' },
                  { mode: 'comprehensive', label: 'شامل', icon: '📖', color: 'text-neon-green' },
                  { mode: 'flashcards', label: 'بطاقات', icon: '🃏', color: 'text-neon-pink' },
                ].map(m => {
                  const stat = quizStats.modeStats.find((s: any) => s.mode === m.mode)
                  return (
                    <div key={m.mode} className="glass-card p-2.5 text-center border border-border">
                      <span className="text-base">{m.icon}</span>
                      <p className={`text-sm font-bold ${m.color}`}>{stat?.count || 0}</p>
                      <p className="text-[9px] text-muted-foreground">{m.label}</p>
                      {stat && <p className="text-[9px] text-muted-foreground/60">متوسط {stat.avgScore}%</p>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Leaderboard */}
          {leaderboard.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <Trophy className="h-14 w-14 mx-auto mb-4 opacity-15 text-muted-foreground" />
              <h3 className="text-base font-bold text-muted-foreground mb-1">لا توجد نتائج بعد</h3>
              <p className="text-sm text-muted-foreground/60">ستظهر نتائج الاختبارات هنا بعد أن يبدأ المستخدمون بالاختبار</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Top 3 Podium */}
              {leaderboard.length >= 1 && (
                <div className="grid grid-cols-3 gap-3">
                  {leaderboard.slice(0, 3).map((entry: any, idx: number) => {
                    const medals = ['🥇', '🥈', '🥉']
                    const gradients = [
                      'from-amber-500/20 to-yellow-500/10 border-amber-500/30',
                      'from-gray-400/20 to-gray-500/10 border-gray-400/30',
                      'from-orange-600/20 to-amber-700/10 border-orange-600/30',
                    ]
                    const sizes = ['h-14 w-14', 'h-12 w-12', 'h-11 w-11']
                    const textSizes = ['text-xl', 'text-lg', 'text-base']
                    return (
                      <motion.div
                        key={entry.userId || idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.15 }}
                        className={`glass-card p-4 text-center border bg-gradient-to-b ${gradients[idx]} relative overflow-hidden`}
                      >
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-3xl">{medals[idx]}</div>
                        <div className={`${sizes[idx]} rounded-full bg-gradient-to-br from-neon-cyan/25 to-neon-purple/25 flex items-center justify-center mx-auto mb-2 mt-8 border-2 border-white/10`}>
                          <span className={`${textSizes[idx]} font-bold`}>{entry.name?.charAt(0) || '؟'}</span>
                        </div>
                        <p className="text-sm font-bold line-clamp-1">{entry.name}</p>
                        {entry.specialty && <p className="text-[9px] text-muted-foreground">{entry.specialty}</p>}
                        <div className="mt-2 flex items-center justify-center gap-2">
                          <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/25 text-[10px]">
                            <Trophy className="h-2.5 w-2.5 ml-0.5" /> {entry.score}%
                          </Badge>
                        </div>
                        <div className="flex items-center justify-center gap-3 mt-2 text-[9px] text-muted-foreground">
                          <span>{entry.totalQuizzes} اختبار</span>
                          <span className="text-neon-cyan">{entry.xp?.toLocaleString()} XP</span>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}

              {/* Rest of leaderboard */}
              {leaderboard.length > 3 && (
                <div className="glass-card overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="text-right text-[10px]">#</TableHead>
                        <TableHead className="text-right text-[10px]">المستخدم</TableHead>
                        <TableHead className="text-right text-[10px]">التخصص</TableHead>
                        <TableHead className="text-right text-[10px]">النتيجة</TableHead>
                        <TableHead className="text-right text-[10px]">الاختبارات</TableHead>
                        <TableHead className="text-right text-[10px]">XP</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaderboard.slice(3).map((entry: any) => (
                        <TableRow key={entry.userId} className="border-border hover:bg-muted/5">
                          <TableCell className="text-xs font-bold text-muted-foreground">{entry.rank}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-neon-cyan/15 to-neon-purple/15 flex items-center justify-center border border-border text-xs font-bold">
                                {entry.name?.charAt(0) || '؟'}
                              </div>
                              <span className="text-xs font-semibold">{entry.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{entry.specialty || '-'}</TableCell>
                          <TableCell>
                            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[9px]">{entry.score}%</Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{entry.totalQuizzes}</TableCell>
                          <TableCell className="text-xs text-neon-cyan font-semibold">{entry.xp?.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}
