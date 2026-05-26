'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, BookOpen, CreditCard, TrendingUp,
  Activity, Shield, Plus, Pencil, Trash2, Check, X,
  Eye, Clock, Search, ChevronLeft, Wallet, DollarSign,
  BarChart3, RefreshCw, CheckCircle2, Image as ImageIcon,
  FileText, BookOpenCheck, ToggleLeft, ToggleRight, Menu,
  Settings, LogOut, XCircle, ArrowLeft, Play,
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
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { useAppStore } from '@/store/app-store'

// ─── Types ─────────────────────────────────────────────────
type AdminSection = 'overview' | 'users' | 'courses' | 'lessons' | 'payment-methods' | 'payments'

interface NavItem {
  id: AdminSection
  label: string
  icon: React.ElementType
  color: string
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'نظرة عامة', icon: Activity, color: 'text-neon-cyan' },
  { id: 'users', label: 'المستخدمين', icon: Users, color: 'text-blue-400' },
  { id: 'courses', label: 'الدورات', icon: BookOpen, color: 'text-neon-purple' },
  { id: 'payment-methods', label: 'طرق الدفع', icon: Wallet, color: 'text-neon-green' },
  { id: 'payments', label: 'المدفوعات', icon: CreditCard, color: 'text-neon-orange' },
]

const categories = [
  { id: 'emergency', name: 'طب الطوارئ' },
  { id: 'cardiology', name: 'أمراض القلب' },
  { id: 'neurology', name: 'الأعصاب' },
  { id: 'pediatrics', name: 'طب الأطفال' },
  { id: 'surgery', name: 'الجراحة' },
  { id: 'internal', name: 'الطب الباطني' },
  { id: 'radiology', name: 'الأشعة' },
  { id: 'pharmacology', name: 'الأدوية' },
  { id: 'general', name: 'عام' },
]

const levels = [
  { id: 'beginner', name: 'مبتدئ' },
  { id: 'intermediate', name: 'متوسط' },
  { id: 'advanced', name: 'متقدم' },
]

const lessonTypes = [
  { id: 'article', name: 'مقال' },
  { id: 'video', name: 'فيديو' },
  { id: 'quiz', name: 'اختبار' },
]

// ─── Animation Variants ─────────────────────────────────────
const pageVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.2 } },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
}

const staggerItem = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  MAIN COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function AdminPage() {
  const { authToken, user } = useAppStore()
  const [activeSection, setActiveSection] = useState<AdminSection>('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Stats
  const [stats, setStats] = useState<any>(null)

  // Users
  const [users, setUsers] = useState<any[]>([])
  const [usersSearch, setUsersSearch] = useState('')
  const [usersPage, setUsersPage] = useState(1)
  const [usersTotal, setUsersTotal] = useState(0)

  // Courses
  const [courses, setCourses] = useState<any[]>([])
  const [showCourseDialog, setShowCourseDialog] = useState(false)
  const [editingCourse, setEditingCourse] = useState<any>(null)
  const [courseForm, setCourseForm] = useState({
    titleAr: '', descriptionAr: '', category: 'emergency', level: 'beginner',
    price: 0, isPremium: false, published: true, instructorName: '',
  })

  // Lessons view
  const [selectedCourse, setSelectedCourse] = useState<any>(null)
  const [showLessonDialog, setShowLessonDialog] = useState(false)
  const [editingLesson, setEditingLesson] = useState<any>(null)
  const [lessonForm, setLessonForm] = useState({
    titleAr: '', type: 'article', duration: 25, isFree: false, content: '',
  })

  // Payment methods
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [showMethodDialog, setShowMethodDialog] = useState(false)
  const [editingMethod, setEditingMethod] = useState<any>(null)
  const [methodForm, setMethodForm] = useState({
    type: 'محفظة إلكترونية', name: '', accountNumber: '', accountName: '', instructions: '', active: true,
  })

  // Payments
  const [payments, setPayments] = useState<any[]>([])
  const [paymentsFilter, setPaymentsFilter] = useState('all')
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null)

  const authHeaders = {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json',
  }

  // ─── Fetch Functions ────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/stats', { headers: authHeaders })
      const data = await res.json()
      if (data.success) setStats(data.stats)
    } catch (err) { console.error('Stats error:', err) }
  }, [authToken])

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/users?page=${usersPage}&search=${usersSearch}`, { headers: authHeaders })
      const data = await res.json()
      if (data.success) { setUsers(data.users); setUsersTotal(data.total) }
    } catch (err) { console.error('Users error:', err) }
  }, [authToken, usersPage, usersSearch])

  const fetchCourses = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/courses', { headers: authHeaders })
      const data = await res.json()
      if (data.success) setCourses(data.courses)
    } catch (err) { console.error('Courses error:', err) }
  }, [authToken])

  const fetchPaymentMethods = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/payment-methods', { headers: authHeaders })
      const data = await res.json()
      if (data.success) setPaymentMethods(data.methods)
    } catch (err) { console.error('Payment methods error:', err) }
  }, [authToken])

  const fetchPayments = useCallback(async () => {
    try {
      const statusParam = paymentsFilter !== 'all' ? `?status=${paymentsFilter}` : ''
      const res = await fetch(`/api/admin/payments${statusParam}`, { headers: authHeaders })
      const data = await res.json()
      if (data.success) setPayments(data.payments)
    } catch (err) { console.error('Payments error:', err) }
  }, [authToken, paymentsFilter])

  const refreshAll = async () => {
    setRefreshing(true)
    await Promise.all([fetchStats(), fetchUsers(), fetchCourses(), fetchPaymentMethods(), fetchPayments()])
    setRefreshing(false)
  }

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      await Promise.all([fetchStats(), fetchUsers(), fetchCourses(), fetchPaymentMethods(), fetchPayments()])
      setLoading(false)
    }
    if (authToken) load()
  }, [authToken, usersPage, usersSearch, paymentsFilter])

  // ─── Format Date ────────────────────────────────────────
  const formatDate = (date: string | Date) => {
    try {
      return new Date(date).toLocaleDateString('ar-YE', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    } catch { return '—' }
  }

  // ─── Course Handlers ────────────────────────────────────
  const handleSaveCourse = async () => {
    try {
      const method = editingCourse ? 'PUT' : 'POST'
      const body = editingCourse
        ? { courseId: editingCourse._id, ...courseForm }
        : { ...courseForm, title: courseForm.titleAr }

      const res = await fetch('/api/admin/courses', { method, headers: authHeaders, body: JSON.stringify(body) })
      const data = await res.json()
      if (data.success) {
        setShowCourseDialog(false)
        setEditingCourse(null)
        setCourseForm({ titleAr: '', descriptionAr: '', category: 'emergency', level: 'beginner', price: 0, isPremium: false, published: true, instructorName: '' })
        fetchCourses(); fetchStats()
      }
    } catch (err) { console.error('Save course error:', err) }
  }

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الدورة؟')) return
    try {
      const res = await fetch('/api/admin/courses', { method: 'DELETE', headers: authHeaders, body: JSON.stringify({ courseId }) })
      const data = await res.json()
      if (data.success) { fetchCourses(); fetchStats() }
    } catch (err) { console.error('Delete course error:', err) }
  }

  const startEditCourse = (course: any) => {
    setEditingCourse(course)
    setCourseForm({
      titleAr: course.titleAr || '', descriptionAr: course.descriptionAr || '',
      category: course.category || 'emergency', level: course.level || 'beginner',
      price: course.price || 0, isPremium: course.isPremium || false,
      published: course.published ?? true, instructorName: course.instructorName || '',
    })
    setShowCourseDialog(true)
  }

  // ─── Lesson Handlers ────────────────────────────────────
  const handleSaveLesson = async () => {
    if (!selectedCourse) return
    try {
      if (editingLesson) {
        const res = await fetch('/api/admin/lessons', {
          method: 'PUT', headers: authHeaders,
          body: JSON.stringify({ courseId: selectedCourse._id, lessonId: editingLesson.id, updates: lessonForm }),
        })
        const data = await res.json()
        if (data.success) { setShowLessonDialog(false); setEditingLesson(null); fetchCourses() }
      } else {
        const res = await fetch('/api/admin/lessons', {
          method: 'POST', headers: authHeaders,
          body: JSON.stringify({ courseId: selectedCourse._id, lesson: lessonForm }),
        })
        const data = await res.json()
        if (data.success) {
          setShowLessonDialog(false)
          setLessonForm({ titleAr: '', type: 'article', duration: 25, isFree: false, content: '' })
          fetchCourses()
        }
      }
    } catch (err) { console.error('Save lesson error:', err) }
  }

  const handleDeleteLesson = async (courseId: string, lessonId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الدرس؟')) return
    try {
      const res = await fetch('/api/admin/lessons', { method: 'DELETE', headers: authHeaders, body: JSON.stringify({ courseId, lessonId }) })
      const data = await res.json()
      if (data.success) fetchCourses()
    } catch (err) { console.error('Delete lesson error:', err) }
  }

  const startEditLesson = (lesson: any) => {
    setEditingLesson(lesson)
    setLessonForm({
      titleAr: lesson.titleAr || '', type: lesson.type || 'article',
      duration: lesson.duration || 25, isFree: lesson.isFree || false, content: lesson.content || '',
    })
    setShowLessonDialog(true)
  }

  const openAddLesson = () => {
    setEditingLesson(null)
    const lessonCount = selectedCourse?.lessonsData?.length || 0
    setLessonForm({
      titleAr: '', type: 'article', duration: 25,
      isFree: lessonCount < 2, // أول درسين مجانيين تلقائياً
      content: '',
    })
    setShowLessonDialog(true)
  }

  // ─── Payment Method Handlers ────────────────────────────
  const handleSaveMethod = async () => {
    try {
      if (editingMethod) {
        const res = await fetch('/api/admin/payment-methods', {
          method: 'PUT', headers: authHeaders,
          body: JSON.stringify({ methodId: editingMethod._id, ...methodForm }),
        })
        const data = await res.json()
        if (data.success) { setShowMethodDialog(false); setEditingMethod(null); fetchPaymentMethods() }
      } else {
        const res = await fetch('/api/admin/payment-methods', {
          method: 'POST', headers: authHeaders, body: JSON.stringify(methodForm),
        })
        const data = await res.json()
        if (data.success) {
          setShowMethodDialog(false)
          setMethodForm({ type: 'محفظة إلكترونية', name: '', accountNumber: '', accountName: '', instructions: '', active: true })
          fetchPaymentMethods()
        }
      }
    } catch (err) { console.error('Save method error:', err) }
  }

  const handleDeleteMethod = async (methodId: string) => {
    if (!confirm('هل أنت متأكد من حذف طريقة الدفع هذه؟')) return
    try {
      const res = await fetch('/api/admin/payment-methods', { method: 'DELETE', headers: authHeaders, body: JSON.stringify({ methodId }) })
      const data = await res.json()
      if (data.success) fetchPaymentMethods()
    } catch (err) { console.error('Delete method error:', err) }
  }

  const toggleMethodActive = async (method: any) => {
    try {
      const res = await fetch('/api/admin/payment-methods', {
        method: 'PUT', headers: authHeaders,
        body: JSON.stringify({ methodId: method._id, active: !method.active }),
      })
      const data = await res.json()
      if (data.success) fetchPaymentMethods()
    } catch (err) { console.error('Toggle method error:', err) }
  }

  const startEditMethod = (method: any) => {
    setEditingMethod(method)
    setMethodForm({
      type: method.type || 'محفظة إلكترونية', name: method.name || '',
      accountNumber: method.accountNumber || '', accountName: method.accountName || '',
      instructions: method.instructions || '', active: method.active !== false,
    })
    setShowMethodDialog(true)
  }

  // ─── Payment Handlers ───────────────────────────────────
  const handleUpdatePayment = async (paymentId: string, status: string) => {
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'PUT', headers: authHeaders, body: JSON.stringify({ paymentId, status }),
      })
      const data = await res.json()
      if (data.success) { fetchPayments(); fetchStats() }
    } catch (err) { console.error('Update payment error:', err) }
  }

  // ─── User Handlers ──────────────────────────────────────
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return
    try {
      const res = await fetch('/api/admin/users', { method: 'DELETE', headers: authHeaders, body: JSON.stringify({ userId }) })
      const data = await res.json()
      if (data.success) { fetchUsers(); fetchStats() }
    } catch (err) { console.error('Delete user error:', err) }
  }

  // ─── Navigate to lessons ────────────────────────────────
  const openCourseLessons = (course: any) => {
    setSelectedCourse(course)
    setActiveSection('lessons')
  }

  const backToCourses = () => {
    setSelectedCourse(null)
    setActiveSection('courses')
  }

  // ─── Loading State ──────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center" dir="rtl">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-3 border-neon-cyan/30 border-t-neon-cyan rounded-full"
        />
      </div>
    )
  }

  // ─── Render Section Content ─────────────────────────────
  const renderContent = () => (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeSection}
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="min-h-screen"
      >
        {activeSection === 'overview' && <OverviewSection />}
        {activeSection === 'users' && <UsersSection />}
        {activeSection === 'courses' && <CoursesSection />}
        {activeSection === 'lessons' && selectedCourse && <LessonsSection />}
        {activeSection === 'payment-methods' && <PaymentMethodsSection />}
        {activeSection === 'payments' && <PaymentsSection />}
      </motion.div>
    </AnimatePresence>
  )

  // ═══════════════════════════════════════════════════════════
  //  OVERVIEW SECTION
  // ═══════════════════════════════════════════════════════════
  const OverviewSection = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'إجمالي المستخدمين', value: stats?.totalUsers || 0, icon: Users, color: 'cyan', sub: `+${stats?.newUsersToday || 0} اليوم` },
          { title: 'إجمالي الدورات', value: stats?.totalCourses || 0, icon: BookOpen, color: 'purple', sub: 'دورة نشطة' },
          { title: 'الإيرادات (ر.ي)', value: (stats?.totalRevenue || 0).toLocaleString(), icon: DollarSign, color: 'green', sub: `${stats?.approvedPayments || 0} دفعة مقبولة` },
          { title: 'مدفوعات معلقة', value: stats?.pendingPayments || 0, icon: Clock, color: 'orange', sub: 'بانتظار المراجعة' },
        ].map((item, idx) => (
          <motion.div key={idx} variants={staggerItem} className="glass-card p-4 relative overflow-hidden group">
            <div className={`absolute top-0 left-0 w-20 h-20 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity ${
              item.color === 'cyan' ? 'bg-neon-cyan' : item.color === 'purple' ? 'bg-neon-purple' : item.color === 'green' ? 'bg-neon-green' : 'bg-neon-orange'
            }`} />
            <div className="relative z-10">
              <div className={`rounded-xl p-2 border inline-flex mb-3 ${
                item.color === 'cyan' ? 'bg-neon-cyan/10 border-neon-cyan/20' :
                item.color === 'purple' ? 'bg-neon-purple/10 border-neon-purple/20' :
                item.color === 'green' ? 'bg-neon-green/10 border-neon-green/20' :
                'bg-neon-orange/10 border-neon-orange/20'
              }`}>
                <item.icon className={`h-4 w-4 ${
                  item.color === 'cyan' ? 'text-neon-cyan' : item.color === 'purple' ? 'text-neon-purple' :
                  item.color === 'green' ? 'text-neon-green' : 'text-neon-orange'
                }`} />
              </div>
              <p className="text-2xl font-black neon-text">{item.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{item.title}</p>
              <p className="text-[10px] text-muted-foreground/70 mt-0.5">{item.sub}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* المدفوعات المعلقة */}
        <motion.div variants={staggerItem} className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Clock className="h-5 w-5 text-neon-orange" />
              مدفوعات بانتظار المراجعة
            </h2>
            {stats?.pendingPayments > 0 && (
              <Badge className="bg-neon-orange/15 text-neon-orange border border-neon-orange/25 text-xs">
                {stats.pendingPayments} معلقة
              </Badge>
            )}
          </div>
          <ScrollArea className="h-[300px]">
            {payments.filter(p => p.status === 'pending').length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-10 w-10 mb-2 text-neon-green/50" />
                <p className="text-sm">لا توجد مدفوعات معلقة</p>
              </div>
            ) : (
              <div className="space-y-3">
                {payments.filter(p => p.status === 'pending').slice(0, 10).map((payment) => (
                  <div key={payment._id} className="glass-card p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{payment.userName}</p>
                        <p className="text-xs text-muted-foreground">{payment.userPhone}</p>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-neon-green">{(payment.amount || 0).toLocaleString()} ر.ي</p>
                        <p className="text-[10px] text-muted-foreground">{formatDate(payment.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Wallet className="h-3 w-3" />
                        <span>{payment.walletName}</span>
                      </div>
                      <div className="flex gap-1.5">
                        {payment.screenshotUrl && (
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-blue-400 hover:bg-blue-500/10" onClick={() => setScreenshotUrl(payment.screenshotUrl)}>
                            <ImageIcon className="h-3 w-3 ml-1" /> صورة
                          </Button>
                        )}
                        <Button size="sm" className="h-7 px-2 text-xs bg-neon-green/15 text-neon-green border border-neon-green/30 hover:bg-neon-green/25" onClick={() => handleUpdatePayment(payment._id, 'approved')}>
                          <Check className="h-3 w-3 ml-1" /> قبول
                        </Button>
                        <Button size="sm" className="h-7 px-2 text-xs bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25" onClick={() => handleUpdatePayment(payment._id, 'rejected')}>
                          <X className="h-3 w-3 ml-1" /> رفض
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </motion.div>

        {/* آخر المستخدمين */}
        <motion.div variants={staggerItem} className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Users className="h-5 w-5 text-neon-cyan" />
              آخر المسجلين
            </h2>
            <Button variant="ghost" size="sm" className="text-xs text-neon-cyan hover:bg-neon-cyan/10" onClick={() => setActiveSection('users')}>
              عرض الكل <ChevronLeft className="h-3 w-3 mr-1" />
            </Button>
          </div>
          <ScrollArea className="h-[300px]">
            {users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Users className="h-10 w-10 mb-2 text-neon-cyan/50" />
                <p className="text-sm">لا يوجد مستخدمين بعد</p>
              </div>
            ) : (
              <div className="space-y-2">
                {users.slice(0, 10).map((u) => (
                  <div key={u._id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-xs font-bold shrink-0">
                      {u.name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.phone}</p>
                    </div>
                    <div className="text-left shrink-0">
                      <p className="text-[10px] text-muted-foreground">{formatDate(u.createdAt)}</p>
                      <p className="text-[10px] text-neon-cyan">{u.enrollmentCount || 0} دورة</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </motion.div>
      </div>

      {/* إحصائيات شهرية */}
      {stats?.monthlyRevenue && stats.monthlyRevenue.length > 0 && (
        <motion.div variants={staggerItem} className="glass-card p-5">
          <h2 className="text-base font-bold flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-neon-cyan" />
            الإيرادات الشهرية (ر.ي)
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {stats.monthlyRevenue.map((item: any, idx: number) => (
              <div key={idx} className="glass-card p-3 text-center">
                <p className="text-xs text-muted-foreground">{item._id}</p>
                <p className="text-sm font-bold neon-text">{(item.revenue || 0).toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">{item.count} دفعة</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )

  // ═══════════════════════════════════════════════════════════
  //  USERS SECTION
  // ═══════════════════════════════════════════════════════════
  const UsersSection = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="بحث بالاسم أو الرقم..." value={usersSearch} onChange={(e) => { setUsersSearch(e.target.value); setUsersPage(1) }} className="pr-9 bg-white/5 border-white/10" />
        </div>
        <Badge variant="outline" className="text-xs">{usersTotal} مستخدم</Badge>
      </div>
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-right">المستخدم</TableHead>
                <TableHead className="text-right">الرقم</TableHead>
                <TableHead className="text-right">الدورات</TableHead>
                <TableHead className="text-right">المدفوعات</TableHead>
                <TableHead className="text-right">تاريخ التسجيل</TableHead>
                <TableHead className="text-right">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">لا يوجد مستخدمين</TableCell></TableRow>
              ) : users.map((u) => (
                <TableRow key={u._id} className="border-white/5 hover:bg-white/5">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-xs font-bold shrink-0">{u.name?.charAt(0) || '?'}</div>
                      <span className="font-medium text-sm">{u.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground" dir="ltr">{u.phone}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{u.enrollmentCount || 0}</Badge></TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{u.paymentCount || 0}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(u.createdAt)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:bg-red-500/10" onClick={() => handleDeleteUser(u._id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {usersTotal > 20 && (
          <div className="flex items-center justify-between p-3 border-t border-white/5">
            <Button variant="ghost" size="sm" disabled={usersPage <= 1} onClick={() => setUsersPage(p => p - 1)}>السابق</Button>
            <span className="text-xs text-muted-foreground">صفحة {usersPage} من {Math.ceil(usersTotal / 20)}</span>
            <Button variant="ghost" size="sm" disabled={usersPage >= Math.ceil(usersTotal / 20)} onClick={() => setUsersPage(p => p + 1)}>التالي</Button>
          </div>
        )}
      </div>
    </div>
  )

  // ═══════════════════════════════════════════════════════════
  //  COURSES SECTION
  // ═══════════════════════════════════════════════════════════
  const CoursesSection = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-xs">{courses.length} دورة</Badge>
        <Button className="bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/25" onClick={() => { setEditingCourse(null); setCourseForm({ titleAr: '', descriptionAr: '', category: 'emergency', level: 'beginner', price: 0, isPremium: false, published: true, instructorName: '' }); setShowCourseDialog(true) }}>
          <Plus className="h-4 w-4 ml-2" /> إضافة دورة جديدة
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {courses.length === 0 ? (
          <div className="col-span-2 glass-card p-8 text-center">
            <BookOpen className="h-12 w-12 text-neon-purple/50 mx-auto mb-3" />
            <p className="text-muted-foreground">لا توجد دورات بعد. أضف أول دورة!</p>
          </div>
        ) : courses.map((course) => (
          <motion.div key={course._id} variants={staggerItem} className="glass-card p-5 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-24 h-24 rounded-full blur-3xl opacity-10 bg-neon-purple group-hover:opacity-20 transition-opacity" />
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base truncate">{course.titleAr}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{course.descriptionAr}</p>
                </div>
                <div className="flex gap-1.5 mr-2 shrink-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-400 hover:bg-blue-500/10" onClick={() => openCourseLessons(course)} title="الدروس">
                    <BookOpenCheck className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-neon-cyan hover:bg-neon-cyan/10" onClick={() => startEditCourse(course)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:bg-red-500/10" onClick={() => handleDeleteCourse(course._id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-neon-purple/10 text-neon-purple border border-neon-purple/20 text-[10px]">{categories.find(c => c.id === course.category)?.name || course.category}</Badge>
                <Badge className="bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 text-[10px]">{levels.find(l => l.id === course.level)?.name || course.level}</Badge>
                <Badge className={`${course.isPremium ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-neon-green/10 text-neon-green border border-neon-green/20'} text-[10px]`}>
                  {course.isPremium ? `${(course.price || 0).toLocaleString()} ر.ي` : 'مجانية'}
                </Badge>
                <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px]">{course.lessonsData?.length || 0} درس</Badge>
                {course.published ? (
                  <Badge className="bg-neon-green/10 text-neon-green border border-neon-green/20 text-[10px]">منشورة</Badge>
                ) : (
                  <Badge className="bg-red-500/10 text-red-400 border border-red-500/20 text-[10px]">مسودة</Badge>
                )}
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {course.studentCount || 0} طالب</span>
                <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> {(course.revenue || 0).toLocaleString()} ر.ي</span>
                {course.instructorName && <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> {course.instructorName}</span>}
              </div>
              {/* Free/Paid lesson indicator */}
              <div className="mt-3 pt-3 border-t border-white/5">
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span>الدروس المجانية:</span>
                  <span className="text-neon-green font-medium">{course.lessonsData?.filter((l: any) => l.isFree).length || 0}</span>
                  <span>من</span>
                  <span className="font-medium">{course.lessonsData?.length || 0}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )

  // ═══════════════════════════════════════════════════════════
  //  LESSONS SECTION (for a specific course)
  // ═══════════════════════════════════════════════════════════
  const LessonsSection = () => {
    // Refresh selected course data from courses list
    const currentCourse = courses.find((c: any) => c._id === selectedCourse._id) || selectedCourse
    const lessons = currentCourse.lessonsData || []

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white" onClick={backToCourses}>
            <ArrowLeft className="h-4 w-4 ml-1" /> العودة للدورات
          </Button>
          <div className="flex-1">
            <h2 className="text-lg font-bold">{currentCourse.titleAr}</h2>
            <p className="text-xs text-muted-foreground">{lessons.length} درس — {lessons.filter((l: any) => l.isFree).length} مجاني</p>
          </div>
          <Button className="bg-neon-purple/15 text-neon-purple border border-neon-purple/30 hover:bg-neon-purple/25" onClick={openAddLesson}>
            <Plus className="h-4 w-4 ml-2" /> إضافة درس
          </Button>
        </div>

        {/* Lessons List */}
        {lessons.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <FileText className="h-12 w-12 text-neon-purple/50 mx-auto mb-3" />
            <p className="text-muted-foreground">لا توجد دروس بعد. أضف أول درس!</p>
            <p className="text-xs text-muted-foreground/70 mt-1">ملاحظة: الدرسان الأول والثاني يُنصح أن يكونا مجانيين</p>
          </div>
        ) : (
          <div className="space-y-2">
            {lessons.map((lesson: any, idx: number) => (
              <motion.div
                key={lesson.id || idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="glass-card p-4 relative overflow-hidden group"
              >
                <div className={`absolute top-0 left-0 w-16 h-16 rounded-full blur-3xl opacity-10 ${lesson.isFree ? 'bg-neon-green' : 'bg-neon-orange'}`} />
                <div className="relative z-10 flex items-center gap-4">
                  {/* Order Number */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                    lesson.isFree
                      ? 'bg-neon-green/10 border border-neon-green/20 text-neon-green'
                      : 'bg-neon-orange/10 border border-neon-orange/20 text-neon-orange'
                  }`}>
                    {lesson.order || idx + 1}
                  </div>

                  {/* Lesson Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-sm truncate">{lesson.titleAr}</h3>
                      {lesson.isFree && (
                        <Badge className="bg-neon-green/10 text-neon-green border border-neon-green/20 text-[9px] px-1.5 py-0">مجاني</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        {lesson.type === 'video' ? <Play className="h-3 w-3" /> : lesson.type === 'quiz' ? <HelpCircle className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                        {lessonTypes.find(t => t.id === lesson.type)?.name || lesson.type}
                      </span>
                      <span>{lesson.duration} دقيقة</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1.5 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-neon-cyan hover:bg-neon-cyan/10" onClick={() => startEditLesson(lesson)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:bg-red-500/10" onClick={() => handleDeleteLesson(currentCourse._id, lesson.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Content Preview */}
                {lesson.content && (
                  <div className="relative z-10 mt-2 pt-2 border-t border-white/5">
                    <p className="text-xs text-muted-foreground/70 line-clamp-2">{lesson.content}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Tip */}
        <div className="glass-card p-3 border border-neon-green/20">
          <p className="text-xs text-neon-green flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5" />
            نصيحة: اجعل الدرسين الأول والثاني مجانيين لجذب المستخدمين، وباقي الدروس تكون مدفوعة
          </p>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════
  //  PAYMENT METHODS SECTION
  // ═══════════════════════════════════════════════════════════
  const PaymentMethodsSection = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-xs">{paymentMethods.length} طريقة دفع</Badge>
        <Button className="bg-neon-green/15 text-neon-green border border-neon-green/30 hover:bg-neon-green/25" onClick={() => { setEditingMethod(null); setMethodForm({ type: 'محفظة إلكترونية', name: '', accountNumber: '', accountName: '', instructions: '', active: true }); setShowMethodDialog(true) }}>
          <Plus className="h-4 w-4 ml-2" /> إضافة طريقة دفع
        </Button>
      </div>

      {paymentMethods.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <Wallet className="h-12 w-12 text-neon-green/50 mx-auto mb-3" />
          <p className="text-muted-foreground">لا توجد طرق دفع بعد</p>
          <p className="text-xs text-muted-foreground/70 mt-1">أضف محفظة إلكترونية مثل "جيب" ليتمكن المستخدمون من الدفع</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paymentMethods.map((method) => (
            <motion.div key={method._id} variants={staggerItem} className="glass-card p-5 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-20 h-20 rounded-full blur-3xl opacity-10 bg-neon-green group-hover:opacity-20 transition-opacity" />
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-neon-green/10 border border-neon-green/20 flex items-center justify-center">
                      <Wallet className="h-5 w-5 text-neon-green" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base">{method.name}</h3>
                      <p className="text-xs text-muted-foreground">{method.type}</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-neon-cyan hover:bg-neon-cyan/10" onClick={() => startEditMethod(method)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:bg-red-500/10" onClick={() => handleDeleteMethod(method._id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">رقم المحفظة:</span>
                    <span className="font-medium" dir="ltr">{method.accountNumber}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">اسم صاحب المحفظة:</span>
                    <span className="font-medium">{method.accountName}</span>
                  </div>
                  {method.instructions && (
                    <div className="pt-2 border-t border-white/5">
                      <p className="text-xs text-muted-foreground">{method.instructions}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                  <span className="text-xs text-muted-foreground">الحالة:</span>
                  <button
                    onClick={() => toggleMethodActive(method)}
                    className="flex items-center gap-1.5 text-xs cursor-pointer"
                  >
                    {method.active !== false ? (
                      <>
                        <ToggleRight className="h-5 w-5 text-neon-green" />
                        <span className="text-neon-green">نشطة</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                        <span className="text-muted-foreground">معطلة</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )

  // ═══════════════════════════════════════════════════════════
  //  PAYMENTS SECTION
  // ═══════════════════════════════════════════════════════════
  const PaymentsSection = () => {
    const statusColors: Record<string, string> = {
      pending: 'bg-neon-orange/10 text-neon-orange border-neon-orange/20',
      approved: 'bg-neon-green/10 text-neon-green border-neon-green/20',
      rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
    }
    const statusNames: Record<string, string> = {
      pending: 'معلقة',
      approved: 'مقبولة',
      rejected: 'مرفوضة',
    }

    return (
      <div className="space-y-4">
        {/* Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          {['all', 'pending', 'approved', 'rejected'].map((s) => (
            <button
              key={s}
              onClick={() => setPaymentsFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                paymentsFilter === s
                  ? 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30'
                  : 'text-muted-foreground border border-white/5 hover:bg-white/5'
              }`}
            >
              {s === 'all' ? 'الكل' : statusNames[s]}
              {s === 'pending' && payments.filter(p => p.status === 'pending').length > 0 && (
                <span className="mr-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-neon-orange text-[9px] text-white">
                  {payments.filter(p => p.status === 'pending').length}
                </span>
              )}
            </button>
          ))}
          <Badge variant="outline" className="text-xs mr-auto">{payments.length} دفعة</Badge>
        </div>

        {/* Payments List */}
        {payments.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <CreditCard className="h-12 w-12 text-neon-orange/50 mx-auto mb-3" />
            <p className="text-muted-foreground">لا توجد مدفوعات</p>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => (
              <motion.div key={payment._id} variants={staggerItem} className="glass-card p-4 relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-16 h-16 rounded-full blur-3xl opacity-10 ${
                  payment.status === 'approved' ? 'bg-neon-green' : payment.status === 'rejected' ? 'bg-red-500' : 'bg-neon-orange'
                }`} />
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-sm font-bold shrink-0">
                        {payment.userName?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{payment.userName}</p>
                        <p className="text-xs text-muted-foreground" dir="ltr">{payment.userPhone}</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-lg font-bold text-neon-green">{(payment.amount || 0).toLocaleString()} <span className="text-xs">ر.ي</span></p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1"><Wallet className="h-3 w-3" /> {payment.walletName}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDate(payment.createdAt)}</span>
                    <Badge className={`${statusColors[payment.status] || ''} text-[10px]`}>{statusNames[payment.status] || payment.status}</Badge>
                  </div>

                  {/* Screenshot & Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <div>
                      {payment.screenshotUrl ? (
                        <Button size="sm" variant="ghost" className="h-8 px-3 text-xs text-blue-400 hover:bg-blue-500/10" onClick={() => setScreenshotUrl(payment.screenshotUrl)}>
                          <ImageIcon className="h-3.5 w-3.5 ml-1.5" /> عرض لقطة الشاشة
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground/50 flex items-center gap-1"><XCircle className="h-3 w-3" /> لا توجد لقطة شاشة</span>
                      )}
                    </div>
                    {payment.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button size="sm" className="h-8 px-3 text-xs bg-neon-green/15 text-neon-green border border-neon-green/30 hover:bg-neon-green/25" onClick={() => handleUpdatePayment(payment._id, 'approved')}>
                          <Check className="h-3.5 w-3.5 ml-1" /> موافقة
                        </Button>
                        <Button size="sm" className="h-8 px-3 text-xs bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25" onClick={() => handleUpdatePayment(payment._id, 'rejected')}>
                          <X className="h-3.5 w-3.5 ml-1" /> رفض
                        </Button>
                      </div>
                    )}
                    {payment.status === 'approved' && (
                      <Badge className="bg-neon-green/10 text-neon-green border border-neon-green/20 text-[10px]">
                        <CheckCircle2 className="h-3 w-3 ml-1" /> تمت الموافقة
                      </Badge>
                    )}
                    {payment.status === 'rejected' && (
                      <Badge className="bg-red-500/10 text-red-400 border border-red-500/20 text-[10px]">
                        <XCircle className="h-3 w-3 ml-1" /> مرفوضة
                      </Badge>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════
  //  MAIN RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div dir="rtl" className="min-h-screen flex">
      {/* ─── SIDEBAR (Desktop) ────────────────────────────── */}
      <div className="hidden lg:flex flex-col w-[260px] h-screen bg-[#060810]/95 border-l border-med-border fixed right-0 top-0 z-40 backdrop-blur-xl">
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-med-border">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">MedAI</h1>
            <p className="text-[10px] text-muted-foreground -mt-0.5">Admin Panel</p>
          </div>
        </div>

        {/* Admin User Card */}
        <div className="px-3 mt-3">
          <div className="glass-card p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center text-sm font-bold">
              👑
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-amber-400">مدير النظام</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 mt-4 px-3">
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.id || (item.id === 'courses' && activeSection === 'lessons')
              return (
                <motion.button
                  key={item.id}
                  onClick={() => { if (item.id !== 'lessons') setActiveSection(item.id); setSelectedCourse(null) }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 relative group ${
                    isActive ? 'bg-cyan-500/10 text-cyan-400' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  }`}
                  whileHover={{ x: -4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isActive && (
                    <motion.div layoutId="admin-sidebar-active" className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-l-full bg-cyan-400" transition={{ type: 'spring', stiffness: 300, damping: 30 }} />
                  )}
                  <item.icon className={`w-4.5 h-4.5 ${isActive ? item.color : ''}`} />
                  <span className="flex-1 text-right">{item.label}</span>
                  {item.id === 'payments' && stats?.pendingPayments > 0 && (
                    <span className="w-5 h-5 rounded-full bg-neon-orange text-white text-[9px] flex items-center justify-center">{stats.pendingPayments}</span>
                  )}
                </motion.button>
              )
            })}
          </div>
        </ScrollArea>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-med-border space-y-2">
          <div className="flex items-center gap-2 px-3">
            <Badge className="bg-neon-green/15 text-neon-green border border-neon-green/25 text-[10px]">
              <div className="w-1.5 h-1.5 rounded-full bg-neon-green mr-1 animate-pulse" /> متصل
            </Badge>
            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-white/5" onClick={refreshAll}>
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <motion.button
            onClick={() => { useAppStore.getState().logout(); if (typeof window !== 'undefined') { localStorage.removeItem('medai-user'); localStorage.removeItem('medai-auth'); localStorage.removeItem('medai-token') } }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all"
            whileHover={{ x: -4 }}
            whileTap={{ scale: 0.98 }}
          >
            <LogOut className="w-4.5 h-4.5" />
            <span className="flex-1 text-right">تسجيل الخروج</span>
          </motion.button>
        </div>
      </div>

      {/* ─── MOBILE HEADER ───────────────────────────────── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 glass-strong">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-foreground hover:bg-white/5" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-bold text-amber-400">{NAV_ITEMS.find(n => n.id === activeSection)?.label || 'لوحة الإدارة'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/5" onClick={refreshAll}>
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:bg-red-500/10" onClick={() => { useAppStore.getState().logout(); if (typeof window !== 'undefined') { localStorage.removeItem('medai-user'); localStorage.removeItem('medai-auth'); localStorage.removeItem('medai-token') } }}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* ─── MOBILE SIDEBAR OVERLAY ──────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 lg:hidden" onClick={() => setSidebarOpen(false)} />
            <motion.div
              initial={{ x: 260 }} animate={{ x: 0 }} exit={{ x: 260 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 bottom-0 w-[260px] bg-[#060810] border-l border-med-border z-50 lg:hidden flex flex-col"
            >
              {/* Close Button */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-med-border">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
                    <Activity className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">MedAI Admin</span>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSidebarOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Admin Card */}
              <div className="px-3 mt-3">
                <div className="glass-card p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center text-sm font-bold">👑</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.name}</p>
                    <p className="text-xs text-amber-400">مدير النظام</p>
                  </div>
                </div>
              </div>

              {/* Mobile Nav */}
              <ScrollArea className="flex-1 mt-4 px-3">
                <div className="space-y-1">
                  {NAV_ITEMS.map((item) => {
                    const isActive = activeSection === item.id || (item.id === 'courses' && activeSection === 'lessons')
                    return (
                      <button
                        key={item.id}
                        onClick={() => { setActiveSection(item.id); setSelectedCourse(null); setSidebarOpen(false) }}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all ${
                          isActive ? 'bg-cyan-500/10 text-cyan-400' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                        }`}
                      >
                        <item.icon className={`w-5 h-5 ${isActive ? item.color : ''}`} />
                        <span className="flex-1 text-right">{item.label}</span>
                        {item.id === 'payments' && stats?.pendingPayments > 0 && (
                          <span className="w-5 h-5 rounded-full bg-neon-orange text-white text-[9px] flex items-center justify-center">{stats.pendingPayments}</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </ScrollArea>

              {/* Mobile Logout */}
              <div className="p-3 border-t border-med-border">
                <button
                  onClick={() => { useAppStore.getState().logout(); if (typeof window !== 'undefined') { localStorage.removeItem('medai-user'); localStorage.removeItem('medai-auth'); localStorage.removeItem('medai-token') } }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="flex-1 text-right">تسجيل الخروج</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── MAIN CONTENT ────────────────────────────────── */}
      <main className="flex-1 lg:mr-[260px] pt-14 lg:pt-0">
        <div className="p-4 lg:p-6 max-w-5xl mx-auto">
          {/* Section Header */}
          <motion.div className="flex items-center justify-between mb-6" variants={staggerItem} initial="hidden" animate="visible">
            <div>
              <h1 className="text-xl lg:text-2xl font-black neon-text flex items-center gap-3">
                {activeSection === 'lessons' && selectedCourse ? (
                  <>
                    <BookOpenCheck className="h-6 w-6 text-neon-purple" />
                    إدارة الدروس
                  </>
                ) : (
                  <>
                    {(() => { const Icon = NAV_ITEMS.find(n => n.id === activeSection)?.icon || Activity; return <Icon className="h-6 w-6 text-neon-cyan" /> })()}
                    {NAV_ITEMS.find(n => n.id === activeSection)?.label || 'لوحة الإدارة'}
                  </>
                )}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">مرحباً {user.name} — إدارة ومراقبة منصة MedAI Academy</p>
            </div>
          </motion.div>

          {/* Section Content */}
          {renderContent()}
        </div>
      </main>

      {/* ─── DIALOGS ──────────────────────────────────────── */}

      {/* Course Dialog */}
      <Dialog open={showCourseDialog} onOpenChange={(open) => { setShowCourseDialog(open); if (!open) setEditingCourse(null) }}>
        <DialogContent className="bg-[#111827] border-white/10 max-w-lg max-h-[85vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingCourse ? 'تعديل الدورة' : 'إضافة دورة جديدة'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">عنوان الدورة (عربي)</label>
              <Input value={courseForm.titleAr} onChange={(e) => setCourseForm({ ...courseForm, titleAr: e.target.value })} placeholder="مثال: دورة طب الطوارئ الشاملة" className="bg-white/5 border-white/10" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">وصف الدورة</label>
              <Textarea value={courseForm.descriptionAr} onChange={(e) => setCourseForm({ ...courseForm, descriptionAr: e.target.value })} placeholder="وصف مختصر للدورة..." rows={3} className="bg-white/5 border-white/10 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">التصنيف</label>
                <Select value={courseForm.category} onValueChange={(v) => setCourseForm({ ...courseForm, category: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-med-card border-white/10">{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">المستوى</label>
                <Select value={courseForm.level} onValueChange={(v) => setCourseForm({ ...courseForm, level: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-med-card border-white/10">{levels.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">السعر (ر.ي)</label>
                <Input type="number" value={courseForm.price} onChange={(e) => setCourseForm({ ...courseForm, price: Number(e.target.value) })} className="bg-white/5 border-white/10" dir="ltr" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">اسم المدرب</label>
                <Input value={courseForm.instructorName} onChange={(e) => setCourseForm({ ...courseForm, instructorName: e.target.value })} placeholder="د. محمد" className="bg-white/5 border-white/10" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={courseForm.isPremium} onChange={(e) => setCourseForm({ ...courseForm, isPremium: e.target.checked })} className="rounded border-white/20" />
                <span className="text-sm">دورة مدفوعة</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={courseForm.published} onChange={(e) => setCourseForm({ ...courseForm, published: e.target.checked })} className="rounded border-white/20" />
                <span className="text-sm">منشورة</span>
              </label>
            </div>
            <Button onClick={handleSaveCourse} disabled={!courseForm.titleAr} className="w-full bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/25">
              {editingCourse ? 'حفظ التعديلات' : 'إضافة الدورة'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lesson Dialog */}
      <Dialog open={showLessonDialog} onOpenChange={(open) => { setShowLessonDialog(open); if (!open) setEditingLesson(null) }}>
        <DialogContent className="bg-[#111827] border-white/10 max-w-lg max-h-[85vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingLesson ? 'تعديل الدرس' : 'إضافة درس جديد'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">عنوان الدرس (عربي)</label>
              <Input value={lessonForm.titleAr} onChange={(e) => setLessonForm({ ...lessonForm, titleAr: e.target.value })} placeholder="مثال: مقدمة في طب الطوارئ" className="bg-white/5 border-white/10" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">نوع الدرس</label>
                <Select value={lessonForm.type} onValueChange={(v) => setLessonForm({ ...lessonForm, type: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-med-card border-white/10">{lessonTypes.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">المدة (دقيقة)</label>
                <Input type="number" value={lessonForm.duration} onChange={(e) => setLessonForm({ ...lessonForm, duration: Number(e.target.value) })} className="bg-white/5 border-white/10" dir="ltr" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">محتوى الدرس</label>
              <Textarea value={lessonForm.content} onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })} placeholder="محتوى الدرس التفصيلي..." rows={4} className="bg-white/5 border-white/10 resize-none" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={lessonForm.isFree} onChange={(e) => setLessonForm({ ...lessonForm, isFree: e.target.checked })} className="rounded border-white/20" />
              <span className="text-sm">درس مجاني (يمكن مشاهدته بدون دفع)</span>
            </label>
            {lessonForm.isFree && (
              <div className="p-2.5 rounded-xl bg-neon-green/5 border border-neon-green/20">
                <p className="text-[10px] text-neon-green flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  هذا الدرس سيكون متاحاً مجاناً لجميع المستخدمين
                </p>
              </div>
            )}
            <Button onClick={handleSaveLesson} disabled={!lessonForm.titleAr} className="w-full bg-neon-purple/15 text-neon-purple border border-neon-purple/30 hover:bg-neon-purple/25">
              {editingLesson ? 'حفظ التعديلات' : 'إضافة الدرس'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Method Dialog */}
      <Dialog open={showMethodDialog} onOpenChange={(open) => { setShowMethodDialog(open); if (!open) setEditingMethod(null) }}>
        <DialogContent className="bg-[#111827] border-white/10 max-w-lg max-h-[85vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingMethod ? 'تعديل طريقة الدفع' : 'إضافة طريقة دفع جديدة'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">النوع</label>
                <Select value={methodForm.type} onValueChange={(v) => setMethodForm({ ...methodForm, type: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-med-card border-white/10">
                    <SelectItem value="محفظة إلكترونية">محفظة إلكترونية</SelectItem>
                    <SelectItem value="تحويل بنكي">تحويل بنكي</SelectItem>
                    <SelectItem value="أخرى">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">اسم المحفظة / الخدمة</label>
                <Input value={methodForm.name} onChange={(e) => setMethodForm({ ...methodForm, name: e.target.value })} placeholder="مثال: جيب" className="bg-white/5 border-white/10" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">رقم المحفظة</label>
              <Input value={methodForm.accountNumber} onChange={(e) => setMethodForm({ ...methodForm, accountNumber: e.target.value })} placeholder="رقم هاتف المحفظة" className="bg-white/5 border-white/10" dir="ltr" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">اسم صاحب المحفظة</label>
              <Input value={methodForm.accountName} onChange={(e) => setMethodForm({ ...methodForm, accountName: e.target.value })} placeholder="الاسم المسجل في المحفظة" className="bg-white/5 border-white/10" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">تعليمات الدفع (اختياري)</label>
              <Textarea value={methodForm.instructions} onChange={(e) => setMethodForm({ ...methodForm, instructions: e.target.value })} placeholder="مثال: قم بتحويل المبلغ ثم ارفع لقطة الشاشة..." rows={2} className="bg-white/5 border-white/10 resize-none" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={methodForm.active} onChange={(e) => setMethodForm({ ...methodForm, active: e.target.checked })} className="rounded border-white/20" />
              <span className="text-sm">نشطة (ستظهر للمستخدمين)</span>
            </label>
            <Button onClick={handleSaveMethod} disabled={!methodForm.name || !methodForm.accountNumber || !methodForm.accountName} className="w-full bg-neon-green/15 text-neon-green border border-neon-green/30 hover:bg-neon-green/25">
              {editingMethod ? 'حفظ التعديلات' : 'إضافة طريقة الدفع'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Screenshot Viewer Modal */}
      <AnimatePresence>
        {screenshotUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setScreenshotUrl(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <Button variant="ghost" size="icon" className="absolute -top-10 left-0 text-white hover:bg-white/10" onClick={() => setScreenshotUrl(null)}>
                <X className="w-5 h-5" />
              </Button>
              <div className="glass-card p-2">
                <img src={screenshotUrl} alt="لقطة شاشة الدفع" className="w-full rounded-xl" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
