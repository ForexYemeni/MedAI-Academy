'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, BookOpen, CreditCard, TrendingUp, TrendingDown,
  Activity, Shield, Plus, Pencil, Trash2, Check, X,
  Eye, Clock, Search, ChevronLeft, Wallet, DollarSign,
  BarChart3, RefreshCw, AlertCircle, CheckCircle2, Image as ImageIcon,
  Lesson,
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
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { useAppStore } from '@/store/app-store'

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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  MAIN COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function AdminPage() {
  const { authToken, user } = useAppStore()
  const [activeTab, setActiveTab] = useState('overview')
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
  
  // Lessons
  const [showLessonDialog, setShowLessonDialog] = useState(false)
  const [selectedCourseForLessons, setSelectedCourseForLessons] = useState<any>(null)
  const [lessonForm, setLessonForm] = useState({
    titleAr: '', type: 'article', duration: 25, isFree: false, content: '',
  })
  
  // Payments
  const [payments, setPayments] = useState<any[]>([])
  const [paymentsFilter, setPaymentsFilter] = useState('all')
  
  // Payment screenshot viewer
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null)

  const authHeaders = {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json',
  }

  // جلب الإحصائيات
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/stats', { headers: authHeaders })
      const data = await res.json()
      if (data.success) {
        setStats(data.stats)
      }
    } catch (err) {
      console.error('Stats fetch error:', err)
    }
  }, [authToken])

  // جلب المستخدمين
  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/users?page=${usersPage}&search=${usersSearch}`, { headers: authHeaders })
      const data = await res.json()
      if (data.success) {
        setUsers(data.users)
        setUsersTotal(data.total)
      }
    } catch (err) {
      console.error('Users fetch error:', err)
    }
  }, [authToken, usersPage, usersSearch])

  // جلب الدورات
  const fetchCourses = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/courses', { headers: authHeaders })
      const data = await res.json()
      if (data.success) {
        setCourses(data.courses)
      }
    } catch (err) {
      console.error('Courses fetch error:', err)
    }
  }, [authToken])

  // جلب المدفوعات
  const fetchPayments = useCallback(async () => {
    try {
      const statusParam = paymentsFilter !== 'all' ? `?status=${paymentsFilter}` : ''
      const res = await fetch(`/api/admin/payments${statusParam}`, { headers: authHeaders })
      const data = await res.json()
      if (data.success) {
        setPayments(data.payments)
      }
    } catch (err) {
      console.error('Payments fetch error:', err)
    }
  }, [authToken, paymentsFilter])

  // تحديث الكل
  const refreshAll = async () => {
    setRefreshing(true)
    await Promise.all([fetchStats(), fetchUsers(), fetchCourses(), fetchPayments()])
    setRefreshing(false)
  }

  // تحميل أولي
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      await Promise.all([fetchStats(), fetchUsers(), fetchCourses(), fetchPayments()])
      setLoading(false)
    }
    if (authToken) load()
  }, [authToken, usersPage, usersSearch, paymentsFilter])

  // حفظ دورة
  const handleSaveCourse = async () => {
    try {
      const url = editingCourse ? '/api/admin/courses' : '/api/admin/courses'
      const method = editingCourse ? 'PUT' : 'POST'
      const body = editingCourse ? { courseId: editingCourse._id, ...courseForm } : courseForm

      const res = await fetch(url, {
        method,
        headers: authHeaders,
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.success) {
        setShowCourseDialog(false)
        setEditingCourse(null)
        setCourseForm({ titleAr: '', descriptionAr: '', category: 'emergency', level: 'beginner', price: 0, isPremium: false, published: true, instructorName: '' })
        fetchCourses()
        fetchStats()
      }
    } catch (err) {
      console.error('Save course error:', err)
    }
  }

  // حذف دورة
  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الدورة؟')) return
    try {
      const res = await fetch('/api/admin/courses', {
        method: 'DELETE',
        headers: authHeaders,
        body: JSON.stringify({ courseId }),
      })
      const data = await res.json()
      if (data.success) {
        fetchCourses()
        fetchStats()
      }
    } catch (err) {
      console.error('Delete course error:', err)
    }
  }

  // إضافة درس
  const handleAddLesson = async () => {
    if (!selectedCourseForLessons) return
    try {
      const res = await fetch('/api/admin/lessons', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          courseId: selectedCourseForLessons._id,
          lesson: lessonForm,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setShowLessonDialog(false)
        setLessonForm({ titleAr: '', type: 'article', duration: 25, isFree: false, content: '' })
        fetchCourses()
      }
    } catch (err) {
      console.error('Add lesson error:', err)
    }
  }

  // حذف درس
  const handleDeleteLesson = async (courseId: string, lessonId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الدرس؟')) return
    try {
      const res = await fetch('/api/admin/lessons', {
        method: 'DELETE',
        headers: authHeaders,
        body: JSON.stringify({ courseId, lessonId }),
      })
      const data = await res.json()
      if (data.success) {
        fetchCourses()
      }
    } catch (err) {
      console.error('Delete lesson error:', err)
    }
  }

  // تحديث حالة الدفع
  const handleUpdatePayment = async (paymentId: string, status: string) => {
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ paymentId, status }),
      })
      const data = await res.json()
      if (data.success) {
        fetchPayments()
        fetchStats()
      }
    } catch (err) {
      console.error('Update payment error:', err)
    }
  }

  // حذف مستخدم
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: authHeaders,
        body: JSON.stringify({ userId }),
      })
      const data = await res.json()
      if (data.success) {
        fetchUsers()
        fetchStats()
      }
    } catch (err) {
      console.error('Delete user error:', err)
    }
  }

  // تعديل دورة
  const startEditCourse = (course: any) => {
    setEditingCourse(course)
    setCourseForm({
      titleAr: course.titleAr || '',
      descriptionAr: course.descriptionAr || '',
      category: course.category || 'emergency',
      level: course.level || 'beginner',
      price: course.price || 0,
      isPremium: course.isPremium || false,
      published: course.published ?? true,
      instructorName: course.instructorName || '',
    })
    setShowCourseDialog(true)
  }

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

  // ─── Format Date ────────────────────────────────────────
  const formatDate = (date: string | Date) => {
    try {
      return new Date(date).toLocaleDateString('ar-YE', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    } catch {
      return '—'
    }
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

  return (
    <motion.div
      dir="rtl"
      className="min-h-screen w-full pb-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6">

        {/* ═══════════════════════════════════════════════════
            HEADER
        ═══════════════════════════════════════════════════ */}
        <motion.div variants={itemVariants} className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-black neon-text flex items-center gap-3">
              <Shield className="h-7 w-7 text-neon-cyan" />
              لوحة الإدارة
            </h1>
            <p className="text-sm text-muted-foreground mt-1">مرحباً {user.name} — إدارة ومراقبة منصة MedAI Academy</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-neon-green/15 text-neon-green border border-neon-green/25 text-xs">
              <div className="w-1.5 h-1.5 rounded-full bg-neon-green mr-1 animate-pulse" />
              متصل بقاعدة البيانات
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={refreshAll}
              className="hover:bg-white/5"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════
            TAB NAVIGATION
        ═══════════════════════════════════════════════════ */}
        <motion.div variants={itemVariants}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="glass-strong h-11 p-1 gap-1 w-full sm:w-auto flex-wrap">
              <TabsTrigger value="overview" className="data-[state=active]:bg-neon-cyan/15 data-[state=active]:text-neon-cyan text-xs sm:text-sm px-3 sm:px-4">
                <Activity className="h-4 w-4 ml-1" />
                نظرة عامة
              </TabsTrigger>
              <TabsTrigger value="users" className="data-[state=active]:bg-neon-cyan/15 data-[state=active]:text-neon-cyan text-xs sm:text-sm px-3 sm:px-4">
                <Users className="h-4 w-4 ml-1" />
                المستخدمين
              </TabsTrigger>
              <TabsTrigger value="courses" className="data-[state=active]:bg-neon-cyan/15 data-[state=active]:text-neon-cyan text-xs sm:text-sm px-3 sm:px-4">
                <BookOpen className="h-4 w-4 ml-1" />
                الدورات
              </TabsTrigger>
              <TabsTrigger value="payments" className="data-[state=active]:bg-neon-cyan/15 data-[state=active]:text-neon-cyan text-xs sm:text-sm px-3 sm:px-4">
                <CreditCard className="h-4 w-4 ml-1" />
                المدفوعات
              </TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
              {/* ═══════════════════════════════════════════════
                  OVERVIEW TAB
              ═══════════════════════════════════════════════ */}
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6 mt-6"
                >
                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { title: 'إجمالي المستخدمين', value: stats?.totalUsers || 0, icon: Users, color: 'cyan', sub: `+${stats?.newUsersToday || 0} اليوم` },
                      { title: 'إجمالي الدورات', value: stats?.totalCourses || 0, icon: BookOpen, color: 'purple', sub: 'دورة نشطة' },
                      { title: 'الإيرادات (ر.ي)', value: (stats?.totalRevenue || 0).toLocaleString(), icon: DollarSign, color: 'green', sub: `${stats?.approvedPayments || 0} دفعة مقبولة` },
                      { title: 'مدفوعات معلقة', value: stats?.pendingPayments || 0, icon: Clock, color: 'orange', sub: 'بانتظار المراجعة' },
                    ].map((item, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.08 }}
                        className="glass-card p-4 relative overflow-hidden group"
                      >
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
                              item.color === 'cyan' ? 'text-neon-cyan' :
                              item.color === 'purple' ? 'text-neon-purple' :
                              item.color === 'green' ? 'text-neon-green' :
                              'text-neon-orange'
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
                    <motion.div variants={itemVariants} className="glass-card p-5">
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
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 px-2 text-xs text-blue-400 hover:bg-blue-500/10"
                                        onClick={() => setScreenshotUrl(payment.screenshotUrl)}
                                      >
                                        <ImageIcon className="h-3 w-3 ml-1" />
                                        صورة
                                      </Button>
                                    )}
                                    <Button
                                      size="sm"
                                      className="h-7 px-2 text-xs bg-neon-green/15 text-neon-green border border-neon-green/30 hover:bg-neon-green/25"
                                      onClick={() => handleUpdatePayment(payment._id, 'approved')}
                                    >
                                      <Check className="h-3 w-3 ml-1" />
                                      قبول
                                    </Button>
                                    <Button
                                      size="sm"
                                      className="h-7 px-2 text-xs bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25"
                                      onClick={() => handleUpdatePayment(payment._id, 'rejected')}
                                    >
                                      <X className="h-3 w-3 ml-1" />
                                      رفض
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
                    <motion.div variants={itemVariants} className="glass-card p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-bold flex items-center gap-2">
                          <Users className="h-5 w-5 text-neon-cyan" />
                          آخر المسجلين
                        </h2>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-neon-cyan hover:bg-neon-cyan/10"
                          onClick={() => setActiveTab('users')}
                        >
                          عرض الكل
                          <ChevronLeft className="h-3 w-3 mr-1" />
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
                    <motion.div variants={itemVariants} className="glass-card p-5">
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
                </motion.div>
              )}

              {/* ═══════════════════════════════════════════════
                  USERS TAB
              ═══════════════════════════════════════════════ */}
              {activeTab === 'users' && (
                <motion.div
                  key="users"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4 mt-6"
                >
                  {/* Search */}
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="بحث بالاسم أو الرقم..."
                        value={usersSearch}
                        onChange={(e) => { setUsersSearch(e.target.value); setUsersPage(1) }}
                        className="pr-9 bg-white/5 border-white/10"
                      />
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {usersTotal} مستخدم
                    </Badge>
                  </div>

                  {/* Users Table */}
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
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                لا يوجد مستخدمين
                              </TableCell>
                            </TableRow>
                          ) : (
                            users.map((u) => (
                              <TableRow key={u._id} className="border-white/5 hover:bg-white/5">
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-xs font-bold shrink-0">
                                      {u.name?.charAt(0) || '?'}
                                    </div>
                                    <span className="font-medium text-sm">{u.name}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground" dir="ltr">{u.phone}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-xs">{u.enrollmentCount || 0}</Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-xs">{u.paymentCount || 0}</Badge>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">{formatDate(u.createdAt)}</TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-red-400 hover:bg-red-500/10"
                                    onClick={() => handleDeleteUser(u._id)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                    {/* Pagination */}
                    {usersTotal > 20 && (
                      <div className="flex items-center justify-between p-3 border-t border-white/5">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={usersPage <= 1}
                          onClick={() => setUsersPage(p => p - 1)}
                        >
                          السابق
                        </Button>
                        <span className="text-xs text-muted-foreground">
                          صفحة {usersPage} من {Math.ceil(usersTotal / 20)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={usersPage >= Math.ceil(usersTotal / 20)}
                          onClick={() => setUsersPage(p => p + 1)}
                        >
                          التالي
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ═══════════════════════════════════════════════
                  COURSES TAB
              ═══════════════════════════════════════════════ */}
              {activeTab === 'courses' && (
                <motion.div
                  key="courses"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4 mt-6"
                >
                  {/* Add Course Button */}
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">{courses.length} دورة</Badge>
                    <Dialog open={showCourseDialog} onOpenChange={(open) => {
                      setShowCourseDialog(open)
                      if (!open) {
                        setEditingCourse(null)
                        setCourseForm({ titleAr: '', descriptionAr: '', category: 'emergency', level: 'beginner', price: 0, isPremium: false, published: true, instructorName: '' })
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button className="bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/25">
                          <Plus className="h-4 w-4 ml-2" />
                          إضافة دورة جديدة
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-[#111827] border-white/10 max-w-lg max-h-[85vh] overflow-y-auto" dir="rtl">
                        <DialogHeader>
                          <DialogTitle>{editingCourse ? 'تعديل الدورة' : 'إضافة دورة جديدة'}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          <div>
                            <label className="text-xs text-muted-foreground mb-1.5 block">عنوان الدورة (عربي)</label>
                            <Input
                              value={courseForm.titleAr}
                              onChange={(e) => setCourseForm({ ...courseForm, titleAr: e.target.value })}
                              placeholder="مثال: دورة طب الطوارئ الشاملة"
                              className="bg-white/5 border-white/10"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground mb-1.5 block">وصف الدورة</label>
                            <Textarea
                              value={courseForm.descriptionAr}
                              onChange={(e) => setCourseForm({ ...courseForm, descriptionAr: e.target.value })}
                              placeholder="وصف مختصر للدورة..."
                              rows={3}
                              className="bg-white/5 border-white/10 resize-none"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-muted-foreground mb-1.5 block">التصنيف</label>
                              <Select value={courseForm.category} onValueChange={(v) => setCourseForm({ ...courseForm, category: v })}>
                                <SelectTrigger className="bg-white/5 border-white/10">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-med-card border-white/10">
                                  {categories.map(c => (
                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground mb-1.5 block">المستوى</label>
                              <Select value={courseForm.level} onValueChange={(v) => setCourseForm({ ...courseForm, level: v })}>
                                <SelectTrigger className="bg-white/5 border-white/10">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-med-card border-white/10">
                                  {levels.map(l => (
                                    <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-muted-foreground mb-1.5 block">السعر (ر.ي)</label>
                              <Input
                                type="number"
                                value={courseForm.price}
                                onChange={(e) => setCourseForm({ ...courseForm, price: Number(e.target.value) })}
                                className="bg-white/5 border-white/10"
                                dir="ltr"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground mb-1.5 block">اسم المدرب</label>
                              <Input
                                value={courseForm.instructorName}
                                onChange={(e) => setCourseForm({ ...courseForm, instructorName: e.target.value })}
                                placeholder="د. محمد"
                                className="bg-white/5 border-white/10"
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={courseForm.isPremium}
                                onChange={(e) => setCourseForm({ ...courseForm, isPremium: e.target.checked })}
                                className="rounded border-white/20"
                              />
                              <span className="text-sm">دورة مدفوعة</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={courseForm.published}
                                onChange={(e) => setCourseForm({ ...courseForm, published: e.target.checked })}
                                className="rounded border-white/20"
                              />
                              <span className="text-sm">منشورة</span>
                            </label>
                          </div>
                          <Button
                            onClick={handleSaveCourse}
                            disabled={!courseForm.titleAr}
                            className="w-full bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/25"
                          >
                            {editingCourse ? 'حفظ التعديلات' : 'إضافة الدورة'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* Courses Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {courses.length === 0 ? (
                      <div className="col-span-2 glass-card p-8 text-center">
                        <BookOpen className="h-12 w-12 text-neon-purple/50 mx-auto mb-3" />
                        <p className="text-muted-foreground">لا توجد دورات بعد. أضف أول دورة!</p>
                      </div>
                    ) : (
                      courses.map((course) => (
                        <motion.div
                          key={course._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="glass-card p-4 space-y-3"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-bold text-sm">{course.titleAr}</h3>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{course.descriptionAr}</p>
                            </div>
                            <div className="flex gap-1 mr-2 shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-neon-cyan hover:bg-neon-cyan/10"
                                onClick={() => {
                                  setSelectedCourseForLessons(course)
                                  setShowLessonDialog(true)
                                }}
                                title="إدارة الدروس"
                              >
                                <BookOpen className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-blue-400 hover:bg-blue-500/10"
                                onClick={() => startEditCourse(course)}
                                title="تعديل"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-red-400 hover:bg-red-500/10"
                                onClick={() => handleDeleteCourse(course._id)}
                                title="حذف"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="text-[10px]">
                              {categories.find(c => c.id === course.category)?.name || course.category}
                            </Badge>
                            <Badge variant="outline" className="text-[10px]">
                              {levels.find(l => l.id === course.level)?.name || course.level}
                            </Badge>
                            <Badge className={`text-[10px] ${course.isPremium ? 'bg-neon-purple/15 text-neon-purple' : 'bg-neon-green/15 text-neon-green'}`}>
                              {course.isPremium ? `${(course.price || 0).toLocaleString()} ر.ي` : 'مجاني'}
                            </Badge>
                            <Badge className={`text-[10px] ${course.published ? 'bg-neon-green/15 text-neon-green' : 'bg-neon-orange/15 text-neon-orange'}`}>
                              {course.published ? 'منشورة' : 'مسودة'}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{course.lessonsData?.length || 0} درس</span>
                            <span>{course.studentCount || 0} طالب</span>
                            <span>إيرادات: {(course.revenue || 0).toLocaleString()} ر.ي</span>
                          </div>
                          
                          {/* Lessons Preview */}
                          {course.lessonsData && course.lessonsData.length > 0 && (
                            <div className="border-t border-white/5 pt-2 space-y-1">
                              <p className="text-[10px] text-muted-foreground font-medium">الدروس:</p>
                              {course.lessonsData.slice(0, 3).map((lesson: any, idx: number) => (
                                <div key={lesson.id || idx} className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-white/5">
                                  <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground w-4 text-center">{idx + 1}</span>
                                    <span className="truncate max-w-[150px]">{lesson.titleAr}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {lesson.isFree && <Badge className="text-[8px] bg-neon-green/10 text-neon-green h-4">مجاني</Badge>}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-5 w-5 text-red-400 hover:bg-red-500/10"
                                      onClick={() => handleDeleteLesson(course._id, lesson.id)}
                                    >
                                      <X className="h-2.5 w-2.5" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                              {course.lessonsData.length > 3 && (
                                <p className="text-[10px] text-neon-cyan cursor-pointer hover:underline"
                                  onClick={() => {
                                    setSelectedCourseForLessons(course)
                                    setShowLessonDialog(true)
                                  }}
                                >
                                  +{course.lessonsData.length - 3} دروس أخرى
                                </p>
                              )}
                            </div>
                          )}
                        </motion.div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}

              {/* ═══════════════════════════════════════════════
                  PAYMENTS TAB
              ═══════════════════════════════════════════════ */}
              {activeTab === 'payments' && (
                <motion.div
                  key="payments"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4 mt-6"
                >
                  {/* Filter */}
                  <div className="flex items-center gap-3">
                    <Select value={paymentsFilter} onValueChange={setPaymentsFilter}>
                      <SelectTrigger className="w-40 bg-white/5 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-med-card border-white/10">
                        <SelectItem value="all">الكل</SelectItem>
                        <SelectItem value="pending">معلقة</SelectItem>
                        <SelectItem value="approved">مقبولة</SelectItem>
                        <SelectItem value="rejected">مرفوضة</SelectItem>
                      </SelectContent>
                    </Select>
                    <Badge variant="outline" className="text-xs">{payments.length} دفعة</Badge>
                  </div>

                  {/* Payments Table */}
                  <div className="glass-card overflow-hidden">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-white/10 hover:bg-transparent">
                            <TableHead className="text-right">المستخدم</TableHead>
                            <TableHead className="text-right">المبلغ</TableHead>
                            <TableHead className="text-right">المحفظة</TableHead>
                            <TableHead className="text-right">الحالة</TableHead>
                            <TableHead className="text-right">التاريخ</TableHead>
                            <TableHead className="text-right">إجراءات</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {payments.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                لا توجد مدفوعات
                              </TableCell>
                            </TableRow>
                          ) : (
                            payments.map((payment) => (
                              <TableRow key={payment._id} className="border-white/5 hover:bg-white/5">
                                <TableCell>
                                  <div>
                                    <p className="text-sm font-medium">{payment.userName}</p>
                                    <p className="text-xs text-muted-foreground" dir="ltr">{payment.userPhone}</p>
                                  </div>
                                </TableCell>
                                <TableCell className="font-bold text-neon-green">{(payment.amount || 0).toLocaleString()} ر.ي</TableCell>
                                <TableCell>
                                  <div>
                                    <p className="text-xs">{payment.walletName}</p>
                                    <p className="text-xs text-muted-foreground" dir="ltr">{payment.walletPhone}</p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge className={`text-[10px] ${
                                    payment.status === 'pending' ? 'bg-neon-orange/15 text-neon-orange border-neon-orange/25' :
                                    payment.status === 'approved' ? 'bg-neon-green/15 text-neon-green border-neon-green/25' :
                                    'bg-red-500/15 text-red-400 border-red-500/25'
                                  }`}>
                                    {payment.status === 'pending' ? 'معلق' :
                                     payment.status === 'approved' ? 'مقبول' : 'مرفوض'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">{formatDate(payment.createdAt)}</TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    {payment.screenshotUrl && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-blue-400 hover:bg-blue-500/10"
                                        onClick={() => setScreenshotUrl(payment.screenshotUrl)}
                                      >
                                        <ImageIcon className="h-3.5 w-3.5" />
                                      </Button>
                                    )}
                                    {payment.status === 'pending' && (
                                      <>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 text-neon-green hover:bg-neon-green/10"
                                          onClick={() => handleUpdatePayment(payment._id, 'approved')}
                                        >
                                          <Check className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 text-red-400 hover:bg-red-500/10"
                                          onClick={() => handleUpdatePayment(payment._id, 'rejected')}
                                        >
                                          <X className="h-3.5 w-3.5" />
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Tabs>
        </motion.div>
      </div>

      {/* Add Lesson Dialog */}
      <Dialog open={showLessonDialog} onOpenChange={(open) => {
        setShowLessonDialog(open)
        if (!open) {
          setLessonForm({ titleAr: '', type: 'article', duration: 25, isFree: false, content: '' })
        }
      }}>
        <DialogContent className="bg-[#111827] border-white/10 max-w-lg max-h-[85vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>إدارة دروس: {selectedCourseForLessons?.titleAr}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {/* Existing Lessons */}
            {selectedCourseForLessons?.lessonsData?.length > 0 && (
              <div className="space-y-2 mb-4">
                <p className="text-xs text-muted-foreground font-medium">الدروس الحالية ({selectedCourseForLessons.lessonsData.length}):</p>
                <ScrollArea className="max-h-[200px]">
                  <div className="space-y-1">
                    {selectedCourseForLessons.lessonsData.map((lesson: any, idx: number) => (
                      <div key={lesson.id || idx} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-5 text-center">{idx + 1}</span>
                          <span className="text-sm">{lesson.titleAr}</span>
                          {lesson.isFree && <Badge className="text-[8px] bg-neon-green/10 text-neon-green h-4">مجاني</Badge>}
                          <Badge variant="outline" className="text-[8px] h-4">{lesson.type}</Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-red-400 hover:bg-red-500/10"
                          onClick={() => handleDeleteLesson(selectedCourseForLessons._id, lesson.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            <hr className="border-white/10" />
            <p className="text-xs font-medium text-neon-cyan">إضافة درس جديد</p>

            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">عنوان الدرس (عربي)</label>
              <Input
                value={lessonForm.titleAr}
                onChange={(e) => setLessonForm({ ...lessonForm, titleAr: e.target.value })}
                placeholder="مثال: مقدمة في طب الطوارئ"
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">نوع الدرس</label>
                <Select value={lessonForm.type} onValueChange={(v) => setLessonForm({ ...lessonForm, type: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-med-card border-white/10">
                    <SelectItem value="article">مقال</SelectItem>
                    <SelectItem value="video">فيديو</SelectItem>
                    <SelectItem value="quiz">اختبار</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">المدة (دقيقة)</label>
                <Input
                  type="number"
                  value={lessonForm.duration}
                  onChange={(e) => setLessonForm({ ...lessonForm, duration: Number(e.target.value) })}
                  className="bg-white/5 border-white/10"
                  dir="ltr"
                />
              </div>
            </div>
            {lessonForm.type === 'article' && (
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">محتوى الدرس</label>
                <Textarea
                  value={lessonForm.content}
                  onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                  placeholder="اكتب محتوى الدرس هنا..."
                  rows={6}
                  className="bg-white/5 border-white/10 resize-none"
                />
              </div>
            )}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={lessonForm.isFree}
                onChange={(e) => setLessonForm({ ...lessonForm, isFree: e.target.checked })}
                className="rounded border-white/20"
              />
              <span className="text-sm">درس مجاني (بدون دفع)</span>
            </label>
            <Button
              onClick={handleAddLesson}
              disabled={!lessonForm.titleAr}
              className="w-full bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/25"
            >
              <Plus className="h-4 w-4 ml-2" />
              إضافة الدرس
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Screenshot Viewer */}
      {screenshotUrl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setScreenshotUrl(null)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="relative max-w-lg max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={screenshotUrl}
              alt="لقطة شاشة الدفع"
              className="w-full h-auto max-h-[80vh] object-contain rounded-xl"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 left-2 bg-black/50 hover:bg-black/70 text-white"
              onClick={() => setScreenshotUrl(null)}
            >
              <X className="h-5 w-5" />
            </Button>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  )
}
