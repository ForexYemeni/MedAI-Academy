'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, DollarSign, BookOpen, TrendingUp, TrendingDown,
  Activity, Clock, Star, Send, Bell,
  AlertCircle, CheckCircle2, Circle, Shield,
  CreditCard, UserPlus, Zap, BarChart3,
  Settings, ChevronDown, Edit3, Save, X, FileText, Video, HelpCircle, FlaskConical, Layers, Eye, Plus, Trash2, RefreshCw, Loader2, Wallet, ToggleLeft, ToggleRight, Image as ImageIcon,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
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
  const { user, setActivePage } = useAppStore()

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
  const [activeTab, setActiveTab] = useState('courses')
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null)
  const [showAddCourse, setShowAddCourse] = useState(false)
  const [editingCourse, setEditingCourse] = useState<ApiCourse | null>(null)
  const [addingLessonToCourse, setAddingLessonToCourse] = useState<string | null>(null)
  const [editingLesson, setEditingLesson] = useState<{ course: ApiCourse; lesson: ApiLesson } | null>(null)
  const [previewLesson, setPreviewLesson] = useState<ApiLesson | null>(null)
  const [usersSearch, setUsersSearch] = useState('')
  const [usersPage, setUsersPage] = useState(1)
  const [usersTotal, setUsersTotal] = useState(0)
  const [notifTitle, setNotifTitle] = useState('')
  const [notifMessage, setNotifMessage] = useState('')
  const [sendingNotif, setSendingNotif] = useState(false)

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

  // ─── Initial Data Load ──────────────────────────────────

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true)
      await Promise.all([fetchCourses(), fetchUsers(), fetchPayments(), fetchPaymentMethods(), fetchStats()])
      setLoading(false)
    }
    loadAll()
  }, [fetchCourses, fetchUsers, fetchPayments, fetchPaymentMethods, fetchStats])

  useEffect(() => { fetchUsers() }, [usersPage, usersSearch, fetchUsers])

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

  // ─── Computed ───────────────────────────────────────────

  const totalLessons = courses.reduce((sum, c) => sum + (c.lessonsData?.length || 0), 0)
  const freeLessons = courses.reduce((sum, c) => sum + (c.lessonsData?.filter(l => l.isFree).length || 0), 0)
  const paidLessons = totalLessons - freeLessons

  // ─── Render ─────────────────────────────────────────────

  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="h-10 w-10 border-3 border-neon-cyan/30 border-t-neon-cyan rounded-full" />
      </div>
    )
  }

  return (
    <motion.div dir="rtl" className="min-h-screen w-full pb-8" variants={containerVariants} initial="hidden" animate="visible">
      <div className="mx-auto max-w-7xl space-y-6 px-3 sm:px-6">

        {/* Error Toast */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="fixed top-4 left-1/2 -translate-x-1/2 z-50 glass-strong px-4 py-3 rounded-xl border border-red-500/30 text-red-400 text-sm flex items-center gap-2 shadow-lg">
              <AlertCircle className="h-4 w-4" />
              {error}
              <Button variant="ghost" size="icon" className="h-6 w-6 ml-2" onClick={() => setError('')}><X className="h-3 w-3" /></Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ HEADER ═══ */}
        <motion.div variants={itemVariants} className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-black neon-text flex items-center gap-3">
              <Shield className="h-7 w-7 text-neon-cyan" /> لوحة الإدارة
            </h1>
            <p className="text-sm text-muted-foreground mt-1">إدارة ومراقبة منصة MedAI Academy</p>
          </div>
          <div className="flex items-center gap-2">
            {user.role === 'admin' && (
              <Button variant="ghost" onClick={() => setActivePage('courses')}
                className="text-xs text-muted-foreground hover:text-white h-8">
                <Eye className="h-3.5 w-3.5 ml-1" /> عرض كمستخدم
              </Button>
            )}
            <Button variant="ghost" onClick={() => { fetchCourses(); fetchUsers(); fetchPayments(); fetchStats(); }}
              className="text-xs text-muted-foreground hover:text-white h-8">
              <RefreshCw className="h-3.5 w-3.5 ml-1" /> تحديث
            </Button>
            <Badge className="bg-neon-green/15 text-neon-green border border-neon-green/25 text-xs">
              <div className="w-1.5 h-1.5 rounded-full bg-neon-green mr-1 animate-pulse" /> النظام يعمل
            </Badge>
          </div>
        </motion.div>

        {/* ═══ TAB NAVIGATION ═══ */}
        <motion.div variants={itemVariants}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
              <TabsList className="glass-strong h-11 p-1 gap-1 w-max sm:w-auto flex-nowrap sm:flex-wrap">
                <TabsTrigger value="courses" className="data-[state=active]:bg-neon-cyan/15 data-[state=active]:text-neon-cyan text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap">
                  <BookOpen className="h-4 w-4 ml-1" /> الدورات والدروس
                </TabsTrigger>
                <TabsTrigger value="users" className="data-[state=active]:bg-neon-cyan/15 data-[state=active]:text-neon-cyan text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap">
                  <Users className="h-4 w-4 ml-1" /> المستخدمين
                </TabsTrigger>
                <TabsTrigger value="payments" className="data-[state=active]:bg-neon-cyan/15 data-[state=active]:text-neon-cyan text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap">
                  <CreditCard className="h-4 w-4 ml-1" /> المدفوعات
                </TabsTrigger>
                <TabsTrigger value="payment-methods" className="data-[state=active]:bg-neon-cyan/15 data-[state=active]:text-neon-cyan text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap">
                  <Wallet className="h-4 w-4 ml-1" /> طرق الدفع
                </TabsTrigger>
                <TabsTrigger value="overview" className="data-[state=active]:bg-neon-cyan/15 data-[state=active]:text-neon-cyan text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap">
                  <Activity className="h-4 w-4 ml-1" /> نظرة عامة
                </TabsTrigger>
              </TabsList>
            </div>

            <AnimatePresence mode="wait">

              {/* ═══════════════════════════════════════════════════
                  COURSES & LESSONS TAB
              ═══════════════════════════════════════════════════ */}
              {activeTab === 'courses' && (
                <motion.div key="courses" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }} className="space-y-6 mt-6">

                  {/* Course Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    {[
                      { title: 'إجمالي الدورات', value: String(courses.length), icon: BookOpen, color: 'text-neon-cyan', bg: 'bg-neon-cyan/10', border: 'border-neon-cyan/20' },
                      { title: 'إجمالي الدروس', value: String(totalLessons), icon: FileText, color: 'text-neon-purple', bg: 'bg-neon-purple/10', border: 'border-neon-purple/20' },
                      { title: 'الدروس المجانية', value: String(freeLessons), icon: CheckCircle2, color: 'text-neon-green', bg: 'bg-neon-green/10', border: 'border-neon-green/20' },
                      { title: 'الدروس المدفوعة', value: String(paidLessons), icon: Star, color: 'text-neon-orange', bg: 'bg-neon-orange/10', border: 'border-neon-orange/20' },
                    ].map((item, idx) => (
                      <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}
                        whileHover={cardHover} className="glass-card p-4 sm:p-5">
                        <div className={`rounded-xl p-2 ${item.bg} ${item.border} border inline-block mb-2`}>
                          <item.icon className={`h-4 w-4 ${item.color}`} />
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground">{item.title}</p>
                        <p className="text-xl sm:text-2xl font-black neon-text mt-1">{item.value}</p>
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
                    <div className="glass-card p-12 text-center">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-30 text-muted-foreground" />
                      <p className="text-muted-foreground mb-4">لا توجد دورات بعد. أضف أول دورة!</p>
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
                            <div className="p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
                              <button onClick={() => setExpandedCourseId(isExpanded ? null : course._id)}
                                className="flex-1 flex items-center gap-3 sm:gap-4 hover:bg-white/5 transition-colors text-right min-w-0">
                                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${getCategoryColor(course.category)} border flex items-center justify-center text-lg sm:text-xl font-bold shrink-0`}>
                                  {courseIdx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="font-bold text-sm sm:text-base">{course.titleAr}</h3>
                                    <Badge className="bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 text-[9px]">
                                      {getCategoryLabel(course.category)}
                                    </Badge>
                                    {!course.published && (
                                      <Badge className="bg-neon-orange/10 text-neon-orange border border-neon-orange/20 text-[9px]">مسودة</Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 sm:gap-4 mt-1 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> {courseLessons.length} درس</span>
                                    <span className="flex items-center gap-1"><Star className="h-3 w-3 text-amber-400" /> {course.rating}</span>
                                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {(course.studentCount || course.students || 0).toLocaleString()}</span>
                                    <span className={`${getLevelColor(course.level)} font-medium`}>{getLevelLabel(course.level)}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  {course.isPremium ? (
                                    <Badge className="bg-neon-orange/15 text-neon-orange border border-neon-orange/25 text-[10px]">
                                      {course.price.toLocaleString()} ر.ي
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-neon-green/15 text-neon-green border border-neon-green/25 text-[10px]">مجاني</Badge>
                                  )}
                                  <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                  </motion.div>
                                </div>
                              </button>

                              {/* Course Actions */}
                              <div className="flex items-center gap-1 shrink-0">
                                <Button variant="ghost" size="icon" onClick={() => handleTogglePublish(course)}
                                  className="h-8 w-8 hover:bg-white/10" title={course.published ? 'إلغاء النشر' : 'نشر'}>
                                  {course.published ? (
                                    <ToggleRight className="h-4 w-4 text-neon-green" />
                                  ) : (
                                    <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => { setEditingCourse(course); setShowAddCourse(false) }}
                                  className="h-8 w-8 hover:bg-neon-cyan/10">
                                  <Edit3 className="h-4 w-4 text-neon-cyan" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteCourse(course._id)}
                                  className="h-8 w-8 hover:bg-red-500/10">
                                  <Trash2 className="h-4 w-4 text-red-400" />
                                </Button>
                              </div>
                            </div>

                            {/* Expandable Lessons List */}
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.3 }} className="overflow-hidden">
                                  <div className="px-3 sm:px-5 pb-4 sm:pb-5 space-y-2 border-t border-white/5 pt-4">
                                    {/* Lessons count + Add Lesson Button */}
                                    <div className="flex items-center justify-between px-2 py-2 rounded-lg bg-white/5 text-xs text-muted-foreground">
                                      <span>دروس هذه الدورة ({courseLessons.length})</span>
                                      <div className="flex items-center gap-3">
                                        <span className="flex items-center gap-1">
                                          <div className="w-2 h-2 rounded-full bg-neon-green" /> مجاني: {courseLessons.filter(l => l.isFree).length}
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <div className="w-2 h-2 rounded-full bg-neon-orange" /> مدفوع: {courseLessons.filter(l => !l.isFree).length}
                                        </span>
                                        <Button onClick={() => setAddingLessonToCourse(course._id)}
                                          className="h-7 text-[10px] bg-neon-purple/15 text-neon-purple border border-neon-purple/30 hover:bg-neon-purple/25 px-2">
                                          <Plus className="h-3 w-3 ml-1" /> درس
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
                                              className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl hover:bg-white/5 transition-colors group">
                                              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                                                {lesson.order}
                                              </div>
                                              <div className="shrink-0">{getLessonTypeIcon(lesson.type)}</div>
                                              <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{lesson.titleAr}</p>
                                                <div className="flex items-center gap-2 mt-0.5 text-[10px] sm:text-xs text-muted-foreground">
                                                  <span>{getLessonTypeLabel(lesson.type)}</span>
                                                  <span>•</span>
                                                  <span>{lesson.duration} دقيقة</span>
                                                  {lesson.summary && (<><span>•</span><span className="truncate max-w-[100px] sm:max-w-[200px]">{lesson.summary}</span></>)}
                                                </div>
                                              </div>
                                              {lesson.isFree ? (
                                                <Badge className="bg-neon-green/10 text-neon-green border border-neon-green/20 text-[9px] shrink-0">مجاني</Badge>
                                              ) : (
                                                <Badge className="bg-neon-orange/10 text-neon-orange border border-neon-orange/20 text-[9px] shrink-0">مدفوع</Badge>
                                              )}
                                              <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                <Button variant="ghost" size="icon"
                                                  onClick={() => setEditingLesson({ course, lesson })}
                                                  className="h-7 w-7 hover:bg-neon-cyan/10">
                                                  <Edit3 className="h-3.5 w-3.5 text-neon-cyan" />
                                                </Button>
                                                <Button variant="ghost" size="icon"
                                                  onClick={() => setPreviewLesson(previewLesson?.id === lesson.id ? null : lesson)}
                                                  className="h-7 w-7 hover:bg-neon-purple/10">
                                                  <Eye className="h-3.5 w-3.5 text-neon-purple" />
                                                </Button>
                                                <Button variant="ghost" size="icon"
                                                  onClick={() => handleDeleteLesson(course._id, lesson.id)}
                                                  className="h-7 w-7 hover:bg-red-500/10">
                                                  <Trash2 className="h-3.5 w-3.5 text-red-400" />
                                                </Button>
                                              </div>
                                            </motion.div>
                                          )}

                                          {/* Lesson Preview */}
                                          <AnimatePresence>
                                            {previewLesson?.id === lesson.id && editingLesson?.lesson.id !== lesson.id && (
                                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden">
                                                <div className="mr-9 sm:mr-12 p-3 sm:p-4 rounded-xl bg-white/3 border border-white/5 space-y-3">
                                                  {lesson.content && (
                                                    <div>
                                                      <p className="text-xs text-muted-foreground mb-1">المحتوى:</p>
                                                      <div className="text-xs text-muted-foreground/80 max-h-40 overflow-y-auto whitespace-pre-wrap leading-5">
                                                        {lesson.content.substring(0, 500)}{lesson.content.length > 500 ? '...' : ''}
                                                      </div>
                                                    </div>
                                                  )}
                                                  {lesson.summary && (
                                                    <div>
                                                      <p className="text-xs text-muted-foreground mb-1">الملخص:</p>
                                                      <p className="text-xs text-muted-foreground/80">{lesson.summary}</p>
                                                    </div>
                                                  )}
                                                  {lesson.keyPoints && lesson.keyPoints.length > 0 && (
                                                    <div>
                                                      <p className="text-xs text-muted-foreground mb-1">النقاط الرئيسية:</p>
                                                      <ul className="space-y-1">
                                                        {lesson.keyPoints.map((point, i) => (
                                                          <li key={i} className="text-xs text-muted-foreground/80 flex items-start gap-1.5">
                                                            <div className="w-1 h-1 rounded-full bg-neon-cyan mt-1.5 shrink-0" />{point}
                                                          </li>
                                                        ))}
                                                      </ul>
                                                    </div>
                                                  )}
                                                </div>
                                              </motion.div>
                                            )}
                                          </AnimatePresence>
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
              )}

              {/* ═══════════════════════════════════════════════════
                  USERS TAB
              ═══════════════════════════════════════════════════ */}
              {activeTab === 'users' && (
                <motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }} className="space-y-6 mt-6">

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

                  {/* Desktop Table */}
                  <motion.div variants={itemVariants} className="glass-card p-4 sm:p-5 neon-glow overflow-hidden hidden sm:block">
                    <ScrollArea className="max-h-[560px]">
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
                    </ScrollArea>
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

                  {/* Mobile Cards */}
                  <div className="sm:hidden space-y-3">
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
                  </div>
                </motion.div>
              )}

              {/* ═══════════════════════════════════════════════════
                  PAYMENTS TAB
              ═══════════════════════════════════════════════════ */}
              {activeTab === 'payments' && (
                <motion.div key="payments" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }} className="space-y-6 mt-6">

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
                            <a href={payment.screenshotUrl} target="_blank" rel="noopener noreferrer"
                              className="text-xs text-neon-cyan hover:underline flex items-center gap-1">
                              <ImageIcon className="h-3 w-3" /> عرض لقطة الشاشة
                            </a>
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
              )}

              {/* ═══════════════════════════════════════════════════
                  PAYMENT METHODS TAB
              ═══════════════════════════════════════════════════ */}
              {activeTab === 'payment-methods' && (
                <motion.div key="payment-methods" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }} className="space-y-6 mt-6">

                  <PaymentMethodsManager methods={paymentMethods} onRefresh={fetchPaymentMethods} />
                </motion.div>
              )}

              {/* ═══════════════════════════════════════════════════
                  OVERVIEW TAB
              ═══════════════════════════════════════════════════ */}
              {activeTab === 'overview' && (
                <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }} className="space-y-6 mt-6">

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

                  {/* Recent Stats */}
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
              )}
            </AnimatePresence>
          </Tabs>
        </motion.div>
      </div>
    </motion.div>
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
      await fetch('/api/admin/payment-methods', {
        method: 'DELETE', headers: getAuthHeaders(), body: JSON.stringify({ methodId: id }),
      })
      onRefresh()
    } catch { /* ignore */ }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button onClick={() => { resetForm(); setShowForm(true) }} className="bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/25 h-9">
          <Plus className="h-4 w-4 ml-1" /> إضافة طريقة دفع
        </Button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4 sm:p-5 space-y-4 border border-neon-cyan/20">
          <h4 className="text-sm font-bold">{editing ? 'تعديل طريقة الدفع' : 'إضافة طريقة دفع جديدة'}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">النوع</label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger className="bg-white/5 border-white/10 h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-med-card border-neon-cyan/20">
                  <SelectItem value="محفظة إلكترونية">محفظة إلكترونية</SelectItem>
                  <SelectItem value="تحويل بنكي">تحويل بنكي</SelectItem>
                  <SelectItem value="أخرى">أخرى</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">اسم المحفظة/البنك *</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-white/5 border-white/10 focus:border-neon-cyan/50 text-sm h-9" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">رقم الحساب *</label>
              <Input value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                className="bg-white/5 border-white/10 focus:border-neon-cyan/50 text-sm h-9" dir="ltr" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">اسم صاحب الحساب *</label>
              <Input value={form.accountName} onChange={(e) => setForm({ ...form, accountName: e.target.value })}
                className="bg-white/5 border-white/10 focus:border-neon-cyan/50 text-sm h-9" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">تعليمات الدفع</label>
            <Textarea value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })}
              rows={3} className="bg-white/5 border-white/10 focus:border-neon-cyan/50 text-sm resize-none" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="rounded border-white/20 bg-white/5 text-neon-cyan focus:ring-neon-cyan/30" />
            <span className="text-xs text-muted-foreground">نشطة</span>
          </label>
          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} disabled={!form.name || !form.accountNumber || !form.accountName || saving}
              className="bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/25 h-9">
              <Save className="h-4 w-4 ml-1" /> {editing ? 'حفظ' : 'إضافة'}
            </Button>
            <Button variant="ghost" onClick={resetForm} className="h-9">إلغاء</Button>
          </div>
        </motion.div>
      )}

      {methods.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Wallet className="h-12 w-12 mx-auto mb-4 opacity-30 text-muted-foreground" />
          <p className="text-muted-foreground">لا توجد طرق دفع. أضف طريقة دفع للمستخدمين!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {methods.map((m) => (
            <div key={m._id} className="glass-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm">{m.name}</h4>
                {m.active ? (
                  <Badge className="bg-neon-green/15 text-neon-green border border-neon-green/25 text-[9px]">نشطة</Badge>
                ) : (
                  <Badge className="bg-gray-500/15 text-gray-400 border border-gray-500/25 text-[9px]">معطلة</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{m.type}</p>
              <p className="text-xs text-muted-foreground" dir="ltr">رقم الحساب: {m.accountNumber}</p>
              <p className="text-xs text-muted-foreground">اسم صاحب الحساب: {m.accountName}</p>
              {m.instructions && <p className="text-xs text-muted-foreground/70">{m.instructions}</p>}
              <div className="flex gap-2 pt-1">
                <Button variant="ghost" size="sm" onClick={() => startEdit(m)} className="h-7 text-xs text-neon-cyan hover:bg-neon-cyan/10">
                  <Edit3 className="h-3 w-3 ml-1" /> تعديل
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(m._id)} className="h-7 text-xs text-red-400 hover:bg-red-500/10">
                  <Trash2 className="h-3 w-3 ml-1" /> حذف
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
