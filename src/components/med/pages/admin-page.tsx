'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, DollarSign, BookOpen, TrendingUp, TrendingDown,
  Activity, Clock, Star, Send, Bell,
  AlertCircle, CheckCircle2, Circle, Shield,
  CreditCard, UserPlus, Zap, BarChart3,
  Settings, ChevronDown, Edit3, Save, X, FileText, Video, HelpCircle, FlaskConical, Layers, Plus, Trash2, RefreshCw, Loader2, Wallet, ToggleLeft, ToggleRight, Image as ImageIcon,
  Menu, LogOut,
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

// ─── Types ──────────────────────────────────────────────────

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
  summary?: string
  keyPoints?: string[]
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
  const token = typeof window !== 'undefined' ? localStorage.getItem('medai-token') : null
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

type AdminSection = 'overview' | 'courses' | 'users' | 'payments' | 'payment-methods'

const sidebarItems: { id: AdminSection; label: string; icon: typeof Activity }[] = [
  { id: 'overview', label: 'نظرة عامة', icon: Activity },
  { id: 'courses', label: 'الدورات والدروس', icon: BookOpen },
  { id: 'users', label: 'المستخدمين', icon: Users },
  { id: 'payments', label: 'المدفوعات', icon: CreditCard },
  { id: 'payment-methods', label: 'طرق الدفع', icon: Wallet },
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
      className="glass-card p-4 sm:p-5 space-y-4 border border-neon-cyan/20">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold flex items-center gap-2">
          <Edit3 className="h-4 w-4 text-neon-cyan" />
          {course ? 'تعديل الدورة' : 'إضافة دورة جديدة'}
        </h4>
        <Button variant="ghost" size="icon" onClick={onCancel} className="h-7 w-7 hover:bg-red-500/10">
          <X className="h-4 w-4 text-red-400" />
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">العنوان بالعربي *</label>
          <Input value={form.titleAr} onChange={(e) => setForm({ ...form, titleAr: e.target.value })}
            className="bg-white/5 border-white/10 focus:border-neon-cyan/50 text-sm h-9" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">العنوان بالإنجليزي *</label>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="bg-white/5 border-white/10 focus:border-neon-cyan/50 text-sm h-9" dir="ltr" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">الوصف بالعربي</label>
          <Textarea value={form.descriptionAr} onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })}
            rows={3} className="bg-white/5 border-white/10 focus:border-neon-cyan/50 text-sm resize-none" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">الوصف بالإنجليزي</label>
          <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3} className="bg-white/5 border-white/10 focus:border-neon-cyan/50 text-sm resize-none" dir="ltr" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">التصنيف *</label>
          <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
            <SelectTrigger className="bg-white/5 border-white/10 h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-med-card border-neon-cyan/20">
              <SelectItem value="emergency">طب الطوارئ</SelectItem>
              <SelectItem value="cardiology">أمراض القلب</SelectItem>
              <SelectItem value="neurology">الأعصاب</SelectItem>
              <SelectItem value="pediatrics">طب الأطفال</SelectItem>
              <SelectItem value="surgery">الجراحة</SelectItem>
              <SelectItem value="internal">الطب الباطني</SelectItem>
              <SelectItem value="radiology">الأشعة</SelectItem>
              <SelectItem value="pharmacology">الأدوية</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">المستوى</label>
          <Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v as any })}>
            <SelectTrigger className="bg-white/5 border-white/10 h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-med-card border-neon-cyan/20">
              <SelectItem value="beginner">مبتدئ</SelectItem>
              <SelectItem value="intermediate">متوسط</SelectItem>
              <SelectItem value="advanced">متقدم</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">المدة</label>
          <Input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })}
            placeholder="مثال: 42 ساعة" className="bg-white/5 border-white/10 focus:border-neon-cyan/50 text-sm h-9" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">السعر (ر.ي)</label>
          <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) || 0 })}
            className="bg-white/5 border-white/10 focus:border-neon-cyan/50 text-sm h-9" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">اسم المدرب</label>
          <Input value={form.instructorName} onChange={(e) => setForm({ ...form, instructorName: e.target.value })}
            className="bg-white/5 border-white/10 focus:border-neon-cyan/50 text-sm h-9" />
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.isPremium} onChange={(e) => setForm({ ...form, isPremium: e.target.checked })}
            className="rounded border-white/20 bg-white/5 text-neon-cyan focus:ring-neon-cyan/30" />
          <span className="text-xs text-muted-foreground">دورة مميزة (مدفوعة)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })}
            className="rounded border-white/20 bg-white/5 text-neon-cyan focus:ring-neon-cyan/30" />
          <span className="text-xs text-muted-foreground">منشورة</span>
        </label>
      </div>

      <div className="flex gap-2 pt-2">
        <Button onClick={() => onSave(form)} disabled={!form.titleAr || !form.title || !form.category}
          className="bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/25 transition-all h-9">
          <Save className="h-4 w-4 ml-1" />
          {course ? 'حفظ التعديلات' : 'إضافة الدورة'}
        </Button>
        <Button variant="ghost" onClick={onCancel} className="text-muted-foreground hover:text-white h-9">إلغاء</Button>
      </div>
    </motion.div>
  )
}

// ─── Lesson Form Component ──────────────────────────────────

function LessonForm({ lesson, courseId, onSave, onCancel }: {
  lesson?: ApiLesson | null
  courseId: string
  onSave: (data: any) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState<ApiLesson>({
    id: lesson?.id || `lesson-${Date.now()}`,
    title: lesson?.title || '',
    titleAr: lesson?.titleAr || '',
    type: lesson?.type || 'article',
    duration: lesson?.duration || 15,
    order: lesson?.order || 1,
    isFree: lesson?.isFree || false,
    content: lesson?.content || '',
    videoUrl: lesson?.videoUrl || '',
    summary: lesson?.summary || '',
    keyPoints: lesson?.keyPoints || [],
  })

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
      className="glass-card p-4 sm:p-5 space-y-4 border border-neon-purple/20">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold flex items-center gap-2">
          <Edit3 className="h-4 w-4 text-neon-purple" />
          {lesson ? 'تعديل الدرس' : 'إضافة درس جديد'}
        </h4>
        <Button variant="ghost" size="icon" onClick={onCancel} className="h-7 w-7 hover:bg-red-500/10">
          <X className="h-4 w-4 text-red-400" />
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">العنوان بالعربي *</label>
          <Input value={form.titleAr} onChange={(e) => setForm({ ...form, titleAr: e.target.value })}
            className="bg-white/5 border-white/10 focus:border-neon-cyan/50 text-sm h-9" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">العنوان بالإنجليزي *</label>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="bg-white/5 border-white/10 focus:border-neon-cyan/50 text-sm h-9" dir="ltr" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">النوع</label>
          <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as ApiLesson['type'] })}>
            <SelectTrigger className="bg-white/5 border-white/10 h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-med-card border-neon-cyan/20">
              <SelectItem value="article">مقال</SelectItem>
              <SelectItem value="video">فيديو</SelectItem>
              <SelectItem value="quiz">اختبار</SelectItem>
              <SelectItem value="simulation">محاكاة</SelectItem>
              <SelectItem value="flashcard">بطاقات</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">المدة (دقيقة)</label>
          <Input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || 0 })}
            className="bg-white/5 border-white/10 focus:border-neon-cyan/50 text-sm h-9" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">الترتيب</label>
          <Input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
            className="bg-white/5 border-white/10 focus:border-neon-cyan/50 text-sm h-9" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.isFree} onChange={(e) => setForm({ ...form, isFree: e.target.checked })}
            className="rounded border-white/20 bg-white/5 text-neon-cyan focus:ring-neon-cyan/30" />
          <span className="text-xs text-muted-foreground">درس مجاني</span>
        </label>
      </div>

      {form.type === 'article' && (
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">المحتوى (Markdown)</label>
          <Textarea value={form.content || ''} onChange={(e) => setForm({ ...form, content: e.target.value })}
            rows={8} className="bg-white/5 border-white/10 focus:border-neon-cyan/50 text-sm resize-none font-mono" dir="rtl" />
        </div>
      )}

      {form.type === 'video' && (
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">رابط الفيديو</label>
          <Input value={form.videoUrl || ''} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
            placeholder="https://..." className="bg-white/5 border-white/10 focus:border-neon-cyan/50 text-sm h-9" dir="ltr" />
        </div>
      )}

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">الملخص</label>
        <Textarea value={form.summary || ''} onChange={(e) => setForm({ ...form, summary: e.target.value })}
          rows={2} className="bg-white/5 border-white/10 focus:border-neon-cyan/50 text-sm resize-none" />
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">النقاط الرئيسية (كل نقطة في سطر)</label>
        <Textarea value={(form.keyPoints || []).join('\n')} onChange={(e) => setForm({ ...form, keyPoints: e.target.value.split('\n').filter(Boolean) })}
          rows={4} className="bg-white/5 border-white/10 focus:border-neon-cyan/50 text-sm resize-none" />
      </div>

      <div className="flex gap-2 pt-2">
        <Button onClick={() => onSave(form)} disabled={!form.titleAr || !form.title}
          className="bg-neon-purple/15 text-neon-purple border border-neon-purple/30 hover:bg-neon-purple/25 transition-all h-9">
          <Save className="h-4 w-4 ml-1" />
          {lesson ? 'حفظ التعديلات' : 'إضافة الدرس'}
        </Button>
        <Button variant="ghost" onClick={onCancel} className="text-muted-foreground hover:text-white h-9">إلغاء</Button>
      </div>
    </motion.div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  MAIN COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function AdminPage() {
  const { user, logout } = useAppStore()

  // ─── API Data State ─────────────────────────────────────
  const [courses, setCourses] = useState<ApiCourse[]>([])
  const [dbUsers, setDbUsers] = useState<ApiUser[]>([])
  const [payments, setPayments] = useState<ApiPayment[]>([])
  const [paymentMethods, setPaymentMethods] = useState<ApiPaymentMethod[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
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

  // ─── Initial Data Load (Lazy - only load data for the active section) ───

  const [loadedSections, setLoadedSections] = useState<Set<AdminSection>>(new Set())
  const [sectionLoading, setSectionLoading] = useState<Set<AdminSection>>(new Set())

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
          await fetchPayments()
          break
        case 'payment-methods':
          await fetchPaymentMethods()
          break
      }
      setLoadedSections(prev => new Set(prev).add(section))
    } catch (err) { console.error('Load section error:', err) }
    setSectionLoading(prev => { const next = new Set(prev); next.delete(section); return next })
  }, [loadedSections, sectionLoading, fetchStats, fetchPayments, fetchCourses, fetchUsers, fetchPaymentMethods])

  // Initial load: only load overview data
  useEffect(() => {
    const loadInitial = async () => {
      setLoading(true)
      try {
        await Promise.all([fetchStats(), fetchPayments()])
        setLoadedSections(new Set(['overview']))
      } catch (err) { console.error('Initial load error:', err) }
      setLoading(false)
    }
    loadInitial()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Load data when section changes
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

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الدورة؟ سيتم حذف جميع الدروس والتسجيلات المرتبطة بها.')) return
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
    try {
      const res = await fetch('/api/admin/lessons', {
        method: 'PUT', headers: getAuthHeaders(),
        body: JSON.stringify({ courseId: editingLesson.course._id, lessonId: editingLesson.lesson.id, updates: formData }),
      })
      const data = await res.json()
      if (data.success) { setEditingLesson(null); await fetchCourses() }
      else setError(data.error || 'فشل تعديل الدرس')
    } catch { setError('خطأ في الاتصال') }
    setSaving(false)
  }

  const handleDeleteLesson = async (courseId: string, lessonId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الدرس؟')) return
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
  }

  const handleApprovePayment = async (paymentId: string, status: 'approved' | 'rejected', note?: string) => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'PUT', headers: getAuthHeaders(),
        body: JSON.stringify({ paymentId, status, adminNote: note || '' }),
      })
      const data = await res.json()
      if (data.success) { await fetchPayments(); await fetchStats() }
      else setError(data.error || 'فشل تحديث الدفع')
    } catch { setError('خطأ في الاتصال') }
    setSaving(false)
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return
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

  const handleSendNotif = () => {
    if (!notifTitle.trim() || !notifMessage.trim()) return
    setSendingNotif(true)
    setTimeout(() => { setSendingNotif(false); setNotifTitle(''); setNotifMessage('') }, 1500)
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
              MedAI Admin
            </h2>
            <p className="text-[10px] text-muted-foreground">لوحة التحكم الإدارية</p>
          </div>
        </div>
      </div>

      <Separator className="bg-white/5 mx-3 w-auto" />

      {/* Admin User Card */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
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

      {/* System Status */}
      <div className="px-4 pb-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neon-green/5 border border-neon-green/10">
          <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
          <span className="text-[11px] text-neon-green font-medium">النظام يعمل</span>
        </div>
      </div>

      <Separator className="bg-white/5 mx-3 w-auto" />

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
                  : 'text-muted-foreground hover:bg-white/5 hover:text-white'
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
              <item.icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-cyan-400' : 'text-muted-foreground group-hover:text-white'}`} />
              <span className="font-medium">{item.label}</span>
              {item.id === 'payments' && payments.filter(p => p.status === 'pending').length > 0 && (
                <Badge className="mr-auto bg-neon-orange/15 text-neon-orange border border-neon-orange/25 text-[9px] h-5 min-w-[20px] flex items-center justify-center">
                  {payments.filter(p => p.status === 'pending').length}
                </Badge>
              )}
            </button>
          )
        })}
      </nav>

      <Separator className="bg-white/5 mx-3 w-auto" />

      {/* Bottom Actions */}
      <div className="p-3 space-y-2">
        {/* Refresh */}
        <button
          onClick={handleRefreshAll}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-white/5 hover:text-white transition-all"
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
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
              <span className="text-sm text-muted-foreground">مستخدمين جدد اليوم</span>
              <span className="font-bold text-neon-cyan">{stats?.newUsersToday || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
              <span className="text-sm text-muted-foreground">مدفوعات معلقة اليوم</span>
              <span className="font-bold text-neon-orange">{stats?.pendingPaymentsToday || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
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
                className="bg-white/5 border-white/10 focus:border-neon-cyan/50 text-sm h-9" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">الرسالة</label>
              <Textarea value={notifMessage} onChange={(e) => setNotifMessage(e.target.value)} placeholder="نص الإشعار..." rows={3}
                className="bg-white/5 border-white/10 focus:border-neon-cyan/50 text-sm resize-none" />
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
                      className="flex-1 min-w-0 text-right hover:bg-white/5 rounded-lg transition-colors">
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
                      <div className="px-2 sm:px-5 pb-3 sm:pb-5 space-y-2 border-t border-white/5 pt-3 sm:pt-4 overflow-x-auto">
                        {/* Lessons count + Add Lesson Button */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-2 sm:px-3 py-2 rounded-lg bg-white/5 text-xs text-muted-foreground gap-2">
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
                                  onSave={handleUpdateLesson}
                                  onCancel={() => setEditingLesson(null)} />
                              ) : (
                                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: lessonIdx * 0.02 }}
                                  className="p-1.5 sm:p-3 rounded-lg sm:rounded-xl hover:bg-white/5 transition-colors group">
                                  {/* Lesson info row */}
                                  <div className="flex items-center gap-1 sm:gap-2">
                                    <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-md bg-white/5 flex items-center justify-center text-[9px] sm:text-xs font-bold text-muted-foreground shrink-0">
                                      {lesson.order}
                                    </div>
                                    <div className="shrink-0 hidden sm:block">{getLessonTypeIcon(lesson.type)}</div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[10px] sm:text-sm font-medium truncate">{lesson.titleAr}</p>
                                      <div className="flex items-center gap-1 sm:gap-1.5 mt-0.5 text-[8px] sm:text-xs text-muted-foreground">
                                        <span className="flex items-center gap-0.5">{getLessonTypeIcon(lesson.type)} <span className="sm:hidden text-[7px]">{getLessonTypeLabel(lesson.type)}</span></span>
                                        <span className="hidden sm:inline">{getLessonTypeLabel(lesson.type)}</span>
                                        <span>•</span>
                                        <span>{lesson.duration} د</span>
                                        {lesson.summary && (<><span className="hidden md:inline">•</span><span className="hidden md:inline truncate max-w-[200px]">{lesson.summary}</span></>)}
                                      </div>
                                    </div>
                                    {lesson.isFree ? (
                                      <Badge className="bg-neon-green/10 text-neon-green border border-neon-green/20 text-[7px] sm:text-[8px] px-1 shrink-0">مجاني</Badge>
                                    ) : (
                                      <Badge className="bg-neon-orange/10 text-neon-orange border border-neon-orange/20 text-[7px] sm:text-[8px] px-1 shrink-0">مدفوع</Badge>
                                    )}
                                    {/* Action buttons - compact on mobile */}
                                    <div className="flex items-center gap-0 shrink-0">
                                      <Button variant="ghost" size="icon"
                                        onClick={() => setEditingLesson({ course, lesson })}
                                        className="h-6 w-6 sm:h-7 sm:w-7 hover:bg-neon-cyan/10">
                                        <Edit3 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-neon-cyan" />
                                      </Button>
                                      <Button variant="ghost" size="icon"
                                        onClick={() => handleDeleteLesson(course._id, lesson.id)}
                                        className="h-6 w-6 sm:h-7 sm:w-7 hover:bg-red-500/10">
                                        <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-red-400" />
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
            className="bg-white/5 border-white/10 focus:border-neon-cyan/50 text-sm h-9" />
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
              <TableRow className="border-b border-white/10 hover:bg-transparent">
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
                <TableRow key={u._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
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
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(u._id)}
                      className="h-7 w-7 hover:bg-red-500/10"><Trash2 className="h-3.5 w-3.5 text-red-400" /></Button>
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
    </motion.div>
  )

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
            {payments.filter(p => p.status === 'pending').length}
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} whileHover={cardHover} className="glass-card p-4 sm:p-5">
          <div className="rounded-xl p-2 bg-neon-green/10 border border-neon-green/20 inline-block mb-2">
            <CheckCircle2 className="h-4 w-4 text-neon-green" />
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">مقبولة</p>
          <p className="text-xl sm:text-2xl font-black text-neon-green mt-1">
            {payments.filter(p => p.status === 'approved').length}
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} whileHover={cardHover} className="glass-card p-4 sm:p-5">
          <div className="rounded-xl p-2 bg-red-500/10 border border-red-500/20 inline-block mb-2">
            <X className="h-4 w-4 text-red-400" />
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">مرفوضة</p>
          <p className="text-xl sm:text-2xl font-black text-red-400 mt-1">
            {payments.filter(p => p.status === 'rejected').length}
          </p>
        </motion.div>
      </div>

      {/* Payments List - Mobile + Desktop */}
      {payments.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-30 text-muted-foreground" />
          <p className="text-muted-foreground">لا توجد مدفوعات بعد</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((payment) => (
            <div key={payment._id} className="glass-card p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-600/20 flex items-center justify-center text-xs shrink-0">
                    {(payment.userName || '?').charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{payment.userName || payment.userId}</p>
                    <p className="text-xs text-muted-foreground" dir="ltr">{payment.userPhone || ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-neon-cyan">{payment.amount?.toLocaleString() || 0} ر.ي</span>
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
              <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                <span>المحفظة: {payment.walletName}</span>
                <span dir="ltr">{payment.walletPhone}</span>
                <span>{new Date(payment.createdAt).toLocaleDateString('ar')}</span>
              </div>
              {payment.screenshotUrl && (
                <button onClick={() => setScreenshotView(payment.screenshotUrl!)}
                  className="text-xs text-neon-cyan hover:underline flex items-center gap-1">
                  <ImageIcon className="h-3 w-3" /> عرض لقطة الشاشة
                </button>
              )}
              {payment.status === 'pending' && (
                <div className="flex gap-2 pt-1">
                  <Button onClick={() => handleApprovePayment(payment._id, 'approved')}
                    className="bg-neon-green/15 text-neon-green border border-neon-green/30 hover:bg-neon-green/25 h-8 text-xs">
                    <CheckCircle2 className="h-3.5 w-3.5 ml-1" /> قبول
                  </Button>
                  <Button onClick={() => handleApprovePayment(payment._id, 'rejected')}
                    className="bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 h-8 text-xs">
                    <X className="h-3.5 w-3.5 ml-1" /> رفض
                  </Button>
                </div>
              )}
              {payment.adminNote && (
                <p className="text-xs text-muted-foreground bg-white/5 p-2 rounded-lg">ملاحظة: {payment.adminNote}</p>
              )}
            </div>
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

  // ─── Render ─────────────────────────────────────────────

  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center bg-[#060810]">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="h-10 w-10 border-3 border-neon-cyan/30 border-t-neon-cyan rounded-full" />
      </div>
    )
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[#060810] flex">

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
                className="absolute top-3 left-3 z-10 h-9 w-9 rounded-full bg-black/60 hover:bg-black/80 text-white"
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
      <aside className="hidden lg:flex w-[260px] shrink-0 flex-col fixed right-0 top-0 bottom-0 bg-[#060810] border-l border-med-border z-40">
        {sidebarContent}
      </aside>

      {/* ═══════════ MOBILE SIDEBAR (Sheet from right) ═══════════ */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="right" className="w-[280px] bg-[#060810] border-l border-med-border p-0">
          <SheetTitle className="sr-only">القائمة الجانبية</SheetTitle>
          <SheetDescription className="sr-only">قائمة التنقل الإدارية</SheetDescription>
          {sidebarContent}
        </SheetContent>
      </Sheet>

      {/* ═══════════ MOBILE TOP HEADER ═══════════ */}
      <header className="lg:hidden fixed top-0 right-0 left-0 h-14 bg-[#060810]/95 backdrop-blur-xl border-b border-med-border z-30 flex items-center justify-between px-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="h-9 w-9 hover:bg-white/10">
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-cyan-400" />
            <span className="text-sm font-bold bg-gradient-to-l from-cyan-300 to-cyan-500 bg-clip-text text-transparent">
              MedAI Admin
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={handleRefreshAll} className="h-9 w-9 hover:bg-white/10">
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
            </div>

            {/* Section Content */}
            <AnimatePresence mode="wait">
              {activeSection === 'overview' && renderOverview()}
              {activeSection === 'courses' && renderCourses()}
              {activeSection === 'users' && renderUsers()}
              {activeSection === 'payments' && renderPayments()}
              {activeSection === 'payment-methods' && renderPaymentMethods()}
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

  const handleDelete = async (id: string) => {
    if (!confirm('حذف طريقة الدفع هذه؟')) return
    try {
      const res = await fetch('/api/admin/payment-methods', {
        method: 'DELETE', headers: getAuthHeaders(),
        body: JSON.stringify({ methodId: id }),
      })
      const data = await res.json()
      if (data.success) onRefresh()
    } catch { /* ignore */ }
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
                  <SelectTrigger className="bg-white/5 border-white/10 h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-med-card border-neon-cyan/20">
                    <SelectItem value="محفظة إلكترونية">محفظة إلكترونية</SelectItem>
                    <SelectItem value="تحويل بنكي">تحويل بنكي</SelectItem>
                    <SelectItem value="أخرى">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">الاسم *</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="bg-white/5 border-white/10 focus:border-neon-cyan/50 text-sm h-9" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">رقم الحساب *</label>
                <Input value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                  className="bg-white/5 border-white/10 focus:border-neon-cyan/50 text-sm h-9" dir="ltr" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">اسم الحساب</label>
                <Input value={form.accountName} onChange={(e) => setForm({ ...form, accountName: e.target.value })}
                  className="bg-white/5 border-white/10 focus:border-neon-cyan/50 text-sm h-9" />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">التعليمات</label>
              <Textarea value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                rows={3} className="bg-white/5 border-white/10 focus:border-neon-cyan/50 text-sm resize-none" />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="rounded border-white/20 bg-white/5 text-neon-cyan focus:ring-neon-cyan/30" />
              <span className="text-xs text-muted-foreground">مفعّلة</span>
            </label>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={!form.name || !form.accountNumber || saving}
                className="bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/25 transition-all h-9">
                <Save className="h-4 w-4 ml-1" />
                {saving ? 'جارٍ الحفظ...' : editing ? 'حفظ التعديلات' : 'إضافة'}
              </Button>
              <Button variant="ghost" onClick={resetForm} className="text-muted-foreground hover:text-white h-9">إلغاء</Button>
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
                <p>رقم الحساب: <span className="text-white font-mono" dir="ltr">{method.accountNumber}</span></p>
                {method.accountName && <p>اسم الحساب: <span className="text-white">{method.accountName}</span></p>}
              </div>
              {method.instructions && (
                <p className="text-xs text-muted-foreground bg-white/5 p-2 rounded-lg">{method.instructions}</p>
              )}
              <div className="flex gap-2 pt-1">
                <Button variant="ghost" size="sm" onClick={() => startEdit(method)}
                  className="h-7 text-xs hover:bg-neon-cyan/10 text-neon-cyan">
                  <Edit3 className="h-3 w-3 ml-1" /> تعديل
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(method._id)}
                  className="h-7 text-xs hover:bg-red-500/10 text-red-400">
                  <Trash2 className="h-3 w-3 ml-1" /> حذف
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
