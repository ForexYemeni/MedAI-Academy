'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  Users, DollarSign, BookOpen, Brain, TrendingUp, TrendingDown,
  Activity, Clock, Star, Send, Bell, MessageSquare,
  AlertCircle, CheckCircle2, Circle, ArrowUpRight, Shield,
  CreditCard, UserPlus, Zap, BarChart3, PieChart as PieChartIcon,
  Ticket, Settings, ChevronLeft, ChevronDown, ChevronUp, Edit3, Save, X, FileText, Video, HelpCircle, FlaskConical, Layers, Eye, Plus, Trash2,
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
import { useAppStore, type Course, type Lesson } from '@/store/app-store'

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
  transition: { duration: 0.25, ease: 'easeOut' as const },
}

// ─── Mock Data ──────────────────────────────────────────────

const sparklineUsers = [
  { v: 90 }, { v: 95 }, { v: 88 }, { v: 102 }, { v: 110 }, { v: 105 }, { v: 118 },
]
const sparklineRevenue = [
  { v: 72 }, { v: 78 }, { v: 74 }, { v: 82 }, { v: 85 }, { v: 80 }, { v: 89 },
]
const sparklineCourses = [
  { v: 300 }, { v: 310 }, { v: 315 }, { v: 320 }, { v: 328 }, { v: 335 }, { v: 342 },
]
const sparklineAI = [
  { v: 800 }, { v: 900 }, { v: 950 }, { v: 1000 }, { v: 1050 }, { v: 1100 }, { v: 1200 },
]

const revenueData = [
  { month: 'يناير', premium: 42000, free: 8500 },
  { month: 'فبراير', premium: 44000, free: 9000 },
  { month: 'مارس', premium: 46000, free: 9200 },
  { month: 'أبريل', premium: 45000, free: 8800 },
  { month: 'مايو', premium: 48000, free: 9500 },
  { month: 'يونيو', premium: 50000, free: 9800 },
  { month: 'يوليو', premium: 52000, free: 10200 },
  { month: 'أغسطس', premium: 54000, free: 10500 },
  { month: 'سبتمبر', premium: 56000, free: 10800 },
  { month: 'أكتوبر', premium: 58000, free: 11200 },
  { month: 'نوفمبر', premium: 60000, free: 11500 },
  { month: 'ديسمبر', premium: 63000, free: 12000 },
]

const userGrowthData = [
  { month: 'يناير', newUsers: 8500, activeUsers: 42000 },
  { month: 'فبراير', newUsers: 9200, activeUsers: 44000 },
  { month: 'مارس', newUsers: 8800, activeUsers: 46500 },
  { month: 'أبريل', newUsers: 10200, activeUsers: 48000 },
  { month: 'مايو', newUsers: 11000, activeUsers: 52000 },
  { month: 'يونيو', newUsers: 10500, activeUsers: 55000 },
  { month: 'يوليو', newUsers: 12000, activeUsers: 58000 },
  { month: 'أغسطس', newUsers: 11500, activeUsers: 61000 },
  { month: 'سبتمبر', newUsers: 13000, activeUsers: 65000 },
  { month: 'أكتوبر', newUsers: 12500, activeUsers: 68000 },
  { month: 'نوفمبر', newUsers: 14000, activeUsers: 72000 },
  { month: 'ديسمبر', newUsers: 15000, activeUsers: 78000 },
]

const aiUsageData = [
  { name: 'استفسارات الدردشة', value: 45, color: '#00f5ff' },
  { name: 'توليد الاختبارات', value: 25, color: '#8b5cf6' },
  { name: 'التوصيات', value: 15, color: '#10b981' },
  { name: 'المحاكاة', value: 10, color: '#f59e0b' },
  { name: 'أخرى', value: 5, color: '#ec4899' },
]

const recentActivity = [
  { id: '1', icon: UserPlus, text: 'تسجيل مستخدم جديد: د. فاطمة الزهراني', time: 'منذ 3 دقائق', color: 'text-neon-cyan' },
  { id: '2', icon: CheckCircle2, text: 'إتمام دورة: طب الطوارئ الشاملة - أحمد السعيد', time: 'منذ 12 دقيقة', color: 'text-neon-green' },
  { id: '3', icon: CreditCard, text: 'دفعة جديدة: ر.ي 27,000 - دورة مميزة', time: 'منذ 25 دقيقة', color: 'text-neon-purple' },
  { id: '4', icon: Zap, text: 'ارتفاع استخدام AI: 15,000 طلب في الساعة الأخيرة', time: 'منذ 38 دقيقة', color: 'text-neon-orange' },
  { id: '5', icon: UserPlus, text: 'تسجيل مستخدم جديد: د. نورة القحطاني', time: 'منذ 45 دقيقة', color: 'text-neon-cyan' },
  { id: '6', icon: CheckCircle2, text: 'إتمام دورة: علم الأدوية مبسط - سعيد الحربي', time: 'منذ ساعة', color: 'text-neon-green' },
]

const ticketsData = [
  { id: 'TK-2847', user: 'د. محمد العلي', subject: 'مشكلة في تشغيل المحاكاة', status: 'open' as const, priority: 'urgent' as const },
  { id: 'TK-2846', user: 'د. سارة الأحمد', subject: 'طلب استرداد مبلغ', status: 'review' as const, priority: 'high' as const },
  { id: 'TK-2845', user: 'أحمد السعيد', subject: 'لا يمكن الوصول للدورة', status: 'open' as const, priority: 'normal' as const },
  { id: 'TK-2844', user: 'د. نورة الحربي', subject: 'خطأ في حساب XP', status: 'review' as const, priority: 'normal' as const },
  { id: 'TK-2843', user: 'د. خالد المنصور', subject: 'اقتراح: إضافة تتبع التقدم', status: 'closed' as const, priority: 'normal' as const },
  { id: 'TK-2842', user: 'ريم الدوسري', subject: 'مشكلة في الدفع', status: 'review' as const, priority: 'high' as const },
]

// ─── Lesson Type Icons ──────────────────────────────────────

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

// ─── Stat Card Component ────────────────────────────────────

function StatCard({
  title, value, trend, trendLabel, icon: Icon, iconColor, sparkData, sparkColor, delay,
}: {
  title: string
  value: string
  trend: 'up' | 'down'
  trendLabel: string
  icon: React.ElementType
  iconColor: string
  sparkData: { v: number }[]
  sparkColor: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={cardHover}
      className="glass-card p-5 relative overflow-hidden group"
    >
      <div
        className="absolute top-0 left-0 w-32 h-32 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity"
        style={{ background: sparkColor }}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className={`rounded-xl p-2.5 border ${iconColor.includes('cyan') ? 'bg-neon-cyan/10 border-neon-cyan/20' : iconColor.includes('purple') ? 'bg-neon-purple/10 border-neon-purple/20' : iconColor.includes('green') ? 'bg-neon-green/10 border-neon-green/20' : iconColor.includes('orange') ? 'bg-neon-orange/10 border-neon-orange/20' : 'bg-neon-blue/10 border-neon-blue/20'}`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
            trend === 'up'
              ? 'bg-neon-green/10 text-neon-green border border-neon-green/20'
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}>
            {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trendLabel}
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-1">{title}</p>
        <p className="text-2xl font-black neon-text mb-3">{value}</p>

        <div className="h-10 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData}>
              <defs>
                <linearGradient id={`spark-${sparkColor.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={sparkColor} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={sparkColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={sparkColor}
                strokeWidth={2}
                fill={`url(#spark-${sparkColor.replace('#', '')})`}
                dot={false}
                isAnimationActive={true}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Custom Tooltip ─────────────────────────────────────────

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload) return null
  return (
    <div className="glass-strong rounded-xl p-3 border border-neon-cyan/20 shadow-lg">
      <p className="text-sm font-bold text-white mb-2">{label}</p>
      {payload.map((entry, idx) => (
        <div key={idx} className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-semibold text-white">${entry.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

function UserTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload) return null
  return (
    <div className="glass-strong rounded-xl p-3 border border-neon-cyan/20 shadow-lg">
      <p className="text-sm font-bold text-white mb-2">{label}</p>
      {payload.map((entry, idx) => (
        <div key={idx} className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-semibold text-white">{entry.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Status & Priority Helpers ──────────────────────────────

function getStatusBadge(status: 'active' | 'draft' | 'archived') {
  switch (status) {
    case 'active':
      return <Badge className="bg-neon-green/15 text-neon-green border border-neon-green/25 text-[10px]">نشط</Badge>
    case 'draft':
      return <Badge className="bg-neon-orange/15 text-neon-orange border border-neon-orange/25 text-[10px]">مسودة</Badge>
    case 'archived':
      return <Badge className="bg-gray-500/15 text-gray-400 border border-gray-500/25 text-[10px]">مؤرشف</Badge>
  }
}

function getTicketStatusBadge(status: 'open' | 'review' | 'closed') {
  switch (status) {
    case 'open':
      return <Badge className="bg-neon-orange/15 text-neon-orange border border-neon-orange/25 text-[10px] flex items-center gap-1"><Circle className="h-2 w-2 fill-neon-orange" />مفتوح</Badge>
    case 'review':
      return <Badge className="bg-neon-blue/15 text-neon-blue border border-neon-blue/25 text-[10px] flex items-center gap-1"><Clock className="h-2 w-2" />قيد المراجعة</Badge>
    case 'closed':
      return <Badge className="bg-neon-green/15 text-neon-green border border-neon-green/25 text-[10px] flex items-center gap-1"><CheckCircle2 className="h-2 w-2" />مغلق</Badge>
  }
}

function getPriorityBadge(priority: 'urgent' | 'high' | 'normal') {
  switch (priority) {
    case 'urgent':
      return <Badge className="bg-red-500/15 text-red-400 border border-red-500/25 text-[10px] flex items-center gap-1"><AlertCircle className="h-2 w-2" />عاجل</Badge>
    case 'high':
      return <Badge className="bg-neon-orange/15 text-neon-orange border border-neon-orange/25 text-[10px]">عالي</Badge>
    case 'normal':
      return <Badge className="bg-gray-500/15 text-gray-400 border border-gray-500/25 text-[10px]">عادي</Badge>
  }
}

// ─── Lesson Editor Component ────────────────────────────────

function LessonEditor({ lesson, onSave, onCancel }: { lesson: Lesson; onSave: (updated: Lesson) => void; onCancel: () => void }) {
  const [editData, setEditData] = useState<Lesson>({ ...lesson })

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="glass-card p-4 sm:p-5 space-y-4 border border-neon-cyan/20"
    >
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold flex items-center gap-2">
          <Edit3 className="h-4 w-4 text-neon-cyan" />
          تعديل الدرس
        </h4>
        <Button variant="ghost" size="icon" onClick={onCancel} className="h-7 w-7 hover:bg-red-500/10">
          <X className="h-4 w-4 text-red-400" />
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">العنوان بالعربي</label>
          <Input
            value={editData.titleAr}
            onChange={(e) => setEditData({ ...editData, titleAr: e.target.value })}
            className="bg-white/5 border-white/10 focus:border-neon-cyan/50 text-sm h-9"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">العنوان بالإنجليزي</label>
          <Input
            value={editData.title}
            onChange={(e) => setEditData({ ...editData, title: e.target.value })}
            className="bg-white/5 border-white/10 focus:border-neon-cyan/50 text-sm h-9"
            dir="ltr"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">النوع</label>
          <Select value={editData.type} onValueChange={(v) => setEditData({ ...editData, type: v as Lesson['type'] })}>
            <SelectTrigger className="bg-white/5 border-white/10 h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
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
          <Input
            type="number"
            value={editData.duration}
            onChange={(e) => setEditData({ ...editData, duration: parseInt(e.target.value) || 0 })}
            className="bg-white/5 border-white/10 focus:border-neon-cyan/50 text-sm h-9"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">الترتيب</label>
          <Input
            type="number"
            value={editData.order}
            onChange={(e) => setEditData({ ...editData, order: parseInt(e.target.value) || 0 })}
            className="bg-white/5 border-white/10 focus:border-neon-cyan/50 text-sm h-9"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={editData.isFree}
            onChange={(e) => setEditData({ ...editData, isFree: e.target.checked })}
            className="rounded border-white/20 bg-white/5 text-neon-cyan focus:ring-neon-cyan/30"
          />
          <span className="text-xs text-muted-foreground">درس مجاني</span>
        </label>
      </div>

      {editData.type === 'article' && (
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">المحتوى (Markdown)</label>
          <Textarea
            value={editData.content || ''}
            onChange={(e) => setEditData({ ...editData, content: e.target.value })}
            rows={8}
            className="bg-white/5 border-white/10 focus:border-neon-cyan/50 text-sm resize-none font-mono"
            dir="rtl"
          />
        </div>
      )}

      {editData.type === 'video' && (
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">رابط الفيديو</label>
          <Input
            value={editData.videoUrl || ''}
            onChange={(e) => setEditData({ ...editData, videoUrl: e.target.value })}
            placeholder="https://..."
            className="bg-white/5 border-white/10 focus:border-neon-cyan/50 text-sm h-9"
            dir="ltr"
          />
        </div>
      )}

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">الملخص</label>
        <Textarea
          value={editData.summary || ''}
          onChange={(e) => setEditData({ ...editData, summary: e.target.value })}
          rows={2}
          className="bg-white/5 border-white/10 focus:border-neon-cyan/50 text-sm resize-none"
        />
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">النقاط الرئيسية (كل نقطة في سطر)</label>
        <Textarea
          value={(editData.keyPoints || []).join('\n')}
          onChange={(e) => setEditData({ ...editData, keyPoints: e.target.value.split('\n').filter(Boolean) })}
          rows={4}
          className="bg-white/5 border-white/10 focus:border-neon-cyan/50 text-sm resize-none"
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          onClick={() => onSave(editData)}
          className="bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/25 transition-all h-9"
        >
          <Save className="h-4 w-4 ml-1" />
          حفظ التعديلات
        </Button>
        <Button
          variant="ghost"
          onClick={onCancel}
          className="text-muted-foreground hover:text-white h-9"
        >
          إلغاء
        </Button>
      </div>
    </motion.div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  MAIN COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function AdminPage() {
  const { courses, lessons, setActivePage, user } = useAppStore()
  const [activeTab, setActiveTab] = useState('courses')
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null)
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null)
  const [notifTitle, setNotifTitle] = useState('')
  const [notifMessage, setNotifMessage] = useState('')
  const [notifAudience, setNotifAudience] = useState('')
  const [sendingNotif, setSendingNotif] = useState(false)
  const [previewLessonId, setPreviewLessonId] = useState<string | null>(null)

  // Get lessons for a specific course
  const getCourseLessons = (courseId: string) => {
    return lessons
      .filter(l => l.courseId === courseId)
      .sort((a, b) => a.order - b.order)
  }

  const handleSaveLesson = (updatedLesson: Lesson) => {
    // Update the lesson in the store's lessons array
    const store = useAppStore.getState()
    const updatedLessons = store.lessons.map(l =>
      l.id === updatedLesson.id ? updatedLesson : l
    )
    // We need to update the store - using setState directly
    useAppStore.setState({ lessons: updatedLessons })
    setEditingLessonId(null)
  }

  const handleSendNotif = () => {
    if (!notifTitle.trim() || !notifMessage.trim()) return
    setSendingNotif(true)
    setTimeout(() => {
      setSendingNotif(false)
      setNotifTitle('')
      setNotifMessage('')
      setNotifAudience('')
    }, 1500)
  }

  const getCategoryColor = (category: string) => {
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

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      emergency: 'طوارئ',
      cardiology: 'قلب',
      neurology: 'أعصاب',
      pediatrics: 'أطفال',
      surgery: 'جراحة',
      internal: 'باطني',
      radiology: 'أشعة',
      pharmacology: 'أدوية',
    }
    return labels[category] || category
  }

  const getLevelLabel = (level: string) => {
    const labels: Record<string, string> = {
      beginner: 'مبتدئ',
      intermediate: 'متوسط',
      advanced: 'متقدم',
    }
    return labels[level] || level
  }

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      beginner: 'text-neon-green',
      intermediate: 'text-neon-orange',
      advanced: 'text-red-400',
    }
    return colors[level] || 'text-muted-foreground'
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
            <p className="text-sm text-muted-foreground mt-1">إدارة ومراقبة منصة MedAI Academy</p>
          </div>
          <div className="flex items-center gap-2">
            {user.role === 'admin' && (
              <Button
                variant="ghost"
                onClick={() => setActivePage('courses')}
                className="text-xs text-muted-foreground hover:text-white h-8"
              >
                <Eye className="h-3.5 w-3.5 ml-1" />
                عرض كمستخدم
              </Button>
            )}
            <Badge className="bg-neon-green/15 text-neon-green border border-neon-green/25 text-xs">
              <div className="w-1.5 h-1.5 rounded-full bg-neon-green mr-1 animate-pulse" />
              النظام يعمل
            </Badge>
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════
            TAB NAVIGATION
        ═══════════════════════════════════════════════════ */}
        <motion.div variants={itemVariants}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="glass-strong h-11 p-1 gap-1 w-full sm:w-auto flex-wrap">
              <TabsTrigger value="courses" className="data-[state=active]:bg-neon-cyan/15 data-[state=active]:text-neon-cyan data-[state=active]:shadow-[0_0_12px_rgba(0,245,255,0.15)] text-xs sm:text-sm px-3 sm:px-4">
                <BookOpen className="h-4 w-4 ml-1" />
                الدورات والدروس
              </TabsTrigger>
              <TabsTrigger value="users" className="data-[state=active]:bg-neon-cyan/15 data-[state=active]:text-neon-cyan data-[state=active]:shadow-[0_0_12px_rgba(0,245,255,0.15)] text-xs sm:text-sm px-3 sm:px-4">
                <Users className="h-4 w-4 ml-1" />
                المستخدمين
              </TabsTrigger>
              <TabsTrigger value="overview" className="data-[state=active]:bg-neon-cyan/15 data-[state=active]:text-neon-cyan data-[state=active]:shadow-[0_0_12px_rgba(0,245,255,0.15)] text-xs sm:text-sm px-3 sm:px-4">
                <Activity className="h-4 w-4 ml-1" />
                نظرة عامة
              </TabsTrigger>
              <TabsTrigger value="revenue" className="data-[state=active]:bg-neon-cyan/15 data-[state=active]:text-neon-cyan data-[state=active]:shadow-[0_0_12px_rgba(0,245,255,0.15)] text-xs sm:text-sm px-3 sm:px-4">
                <DollarSign className="h-4 w-4 ml-1" />
                الإيرادات
              </TabsTrigger>
              <TabsTrigger value="tickets" className="data-[state=active]:bg-neon-cyan/15 data-[state=active]:text-neon-cyan data-[state=active]:shadow-[0_0_12px_rgba(0,245,255,0.15)] text-xs sm:text-sm px-3 sm:px-4">
                <Ticket className="h-4 w-4 ml-1" />
                التذاكر
              </TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">

              {/* ═══════════════════════════════════════════════
                  COURSES & LESSONS TAB (MAIN ADMIN FEATURE)
              ═══════════════════════════════════════════════ */}
              {activeTab === 'courses' && (
                <motion.div
                  key="courses"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6 mt-6"
                >
                  {/* Course Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    {[
                      { title: 'إجمالي الدورات', value: String(courses.length), icon: BookOpen, color: 'text-neon-cyan', bg: 'bg-neon-cyan/10', border: 'border-neon-cyan/20' },
                      { title: 'إجمالي الدروس', value: String(lessons.length), icon: FileText, color: 'text-neon-purple', bg: 'bg-neon-purple/10', border: 'border-neon-purple/20' },
                      { title: 'الدروس المجانية', value: String(lessons.filter(l => l.isFree).length), icon: CheckCircle2, color: 'text-neon-green', bg: 'bg-neon-green/10', border: 'border-neon-green/20' },
                      { title: 'الدروس المدفوعة', value: String(lessons.filter(l => !l.isFree).length), icon: Star, color: 'text-neon-orange', bg: 'bg-neon-orange/10', border: 'border-neon-orange/20' },
                    ].map((item, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.08 }}
                        whileHover={cardHover}
                        className="glass-card p-4 sm:p-5"
                      >
                        <div className={`rounded-xl p-2 ${item.bg} ${item.border} border inline-block mb-2`}>
                          <item.icon className={`h-4 w-4 ${item.color}`} />
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground">{item.title}</p>
                        <p className="text-xl sm:text-2xl font-black neon-text mt-1">{item.value}</p>
                      </motion.div>
                    ))}
                  </div>

                  {/* Courses with expandable lessons */}
                  <div className="space-y-4">
                    {courses.map((course, courseIdx) => {
                      const courseLessons = getCourseLessons(course.id)
                      const isExpanded = expandedCourseId === course.id

                      return (
                        <motion.div
                          key={course.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: courseIdx * 0.05 }}
                          className="glass-card overflow-hidden"
                        >
                          {/* Course Header - Clickable to expand */}
                          <button
                            onClick={() => setExpandedCourseId(isExpanded ? null : course.id)}
                            className="w-full p-4 sm:p-5 flex items-center gap-3 sm:gap-4 hover:bg-white/5 transition-colors text-right"
                          >
                            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${getCategoryColor(course.category)} border flex items-center justify-center text-lg sm:text-xl font-bold shrink-0`}>
                              {courseIdx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-bold text-sm sm:text-base">{course.titleAr}</h3>
                                <Badge className="bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 text-[9px]">
                                  {getCategoryLabel(course.category)}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 sm:gap-4 mt-1 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <FileText className="h-3 w-3" />
                                  {courseLessons.length} درس
                                </span>
                                <span className="flex items-center gap-1">
                                  <Star className="h-3 w-3 text-amber-400" />
                                  {course.rating}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {course.students.toLocaleString()}
                                </span>
                                <span className={`${getLevelColor(course.level)} font-medium`}>
                                  {getLevelLabel(course.level)}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {course.isPremium ? (
                                <Badge className="bg-neon-orange/15 text-neon-orange border border-neon-orange/25 text-[10px]">
                                  {course.price.toLocaleString()} ر.ي
                                </Badge>
                              ) : (
                                <Badge className="bg-neon-green/15 text-neon-green border border-neon-green/25 text-[10px]">
                                  مجاني
                                </Badge>
                              )}
                              <motion.div
                                animate={{ rotate: isExpanded ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <ChevronDown className="h-5 w-5 text-muted-foreground" />
                              </motion.div>
                            </div>
                          </button>

                          {/* Expandable Lessons List */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                              >
                                <div className="px-3 sm:px-5 pb-4 sm:pb-5 space-y-2">
                                  {/* Lesson count info */}
                                  <div className="flex items-center justify-between px-2 py-2 rounded-lg bg-white/5 text-xs text-muted-foreground">
                                    <span>دروس هذه الدورة ({courseLessons.length})</span>
                                    <div className="flex items-center gap-3">
                                      <span className="flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-neon-green" />
                                        مجاني: {courseLessons.filter(l => l.isFree).length}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-neon-orange" />
                                        مدفوع: {courseLessons.filter(l => !l.isFree).length}
                                      </span>
                                    </div>
                                  </div>

                                  {courseLessons.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                      <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                      <p className="text-sm">لا توجد دروس لهذه الدورة بعد</p>
                                    </div>
                                  ) : (
                                    courseLessons.map((lesson, lessonIdx) => (
                                      <div key={lesson.id}>
                                        {editingLessonId === lesson.id ? (
                                          <LessonEditor
                                            lesson={lesson}
                                            onSave={handleSaveLesson}
                                            onCancel={() => setEditingLessonId(null)}
                                          />
                                        ) : (
                                          <motion.div
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: lessonIdx * 0.03 }}
                                            className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl hover:bg-white/5 transition-colors group"
                                          >
                                            {/* Order number */}
                                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                                              {lesson.order}
                                            </div>

                                            {/* Type icon */}
                                            <div className="shrink-0">
                                              {getLessonTypeIcon(lesson.type)}
                                            </div>

                                            {/* Lesson info */}
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center gap-2">
                                                <p className="text-sm font-medium truncate">{lesson.titleAr}</p>
                                              </div>
                                              <div className="flex items-center gap-2 mt-0.5 text-[10px] sm:text-xs text-muted-foreground">
                                                <span>{getLessonTypeLabel(lesson.type)}</span>
                                                <span>•</span>
                                                <span>{lesson.duration} دقيقة</span>
                                                {lesson.summary && (
                                                  <>
                                                    <span>•</span>
                                                    <span className="truncate max-w-[120px] sm:max-w-[200px]">{lesson.summary}</span>
                                                  </>
                                                )}
                                              </div>
                                            </div>

                                            {/* Free/Paid badge */}
                                            {lesson.isFree ? (
                                              <Badge className="bg-neon-green/10 text-neon-green border border-neon-green/20 text-[9px] shrink-0">
                                                مجاني
                                              </Badge>
                                            ) : (
                                              <Badge className="bg-neon-orange/10 text-neon-orange border border-neon-orange/20 text-[9px] shrink-0">
                                                مدفوع
                                              </Badge>
                                            )}

                                            {/* Action buttons */}
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setEditingLessonId(lesson.id)}
                                                className="h-7 w-7 hover:bg-neon-cyan/10"
                                              >
                                                <Edit3 className="h-3.5 w-3.5 text-neon-cyan" />
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setPreviewLessonId(previewLessonId === lesson.id ? null : lesson.id)}
                                                className="h-7 w-7 hover:bg-neon-purple/10"
                                              >
                                                <Eye className="h-3.5 w-3.5 text-neon-purple" />
                                              </Button>
                                            </div>
                                          </motion.div>
                                        )}

                                        {/* Lesson content preview */}
                                        <AnimatePresence>
                                          {previewLessonId === lesson.id && editingLessonId !== lesson.id && (
                                            <motion.div
                                              initial={{ height: 0, opacity: 0 }}
                                              animate={{ height: 'auto', opacity: 1 }}
                                              exit={{ height: 0, opacity: 0 }}
                                              className="overflow-hidden"
                                            >
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
                                                          <div className="w-1 h-1 rounded-full bg-neon-cyan mt-1.5 shrink-0" />
                                                          {point}
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
                </motion.div>
              )}

              {/* ═══════════════════════════════════════════════
                  USERS TAB (MOBILE RESPONSIVE)
              ═══════════════════════════════════════════════ */}
              {activeTab === 'users' && (
                <motion.div
                  key="users"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6 mt-6"
                >
                  {/* User Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    {[
                      { title: 'إجمالي المستخدمين', value: '125,847', icon: Users, color: 'text-neon-cyan', bg: 'bg-neon-cyan/10', border: 'border-neon-cyan/20' },
                      { title: 'المستخدمون النشطون', value: '78,432', icon: Activity, color: 'text-neon-green', bg: 'bg-neon-green/10', border: 'border-neon-green/20' },
                      { title: 'المشتركون المميزون', value: '34,210', icon: Star, color: 'text-neon-orange', bg: 'bg-neon-orange/10', border: 'border-neon-orange/20' },
                      { title: 'معدل الاحتفاظ', value: '87.3%', icon: TrendingUp, color: 'text-neon-purple', bg: 'bg-neon-purple/10', border: 'border-neon-purple/20' },
                    ].map((item, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.08 }}
                        whileHover={cardHover}
                        className="glass-card p-3 sm:p-5"
                      >
                        <div className={`rounded-xl p-2 ${item.bg} ${item.border} border inline-block mb-2`}>
                          <item.icon className={`h-4 w-4 ${item.color}`} />
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground">{item.title}</p>
                        <p className="text-lg sm:text-2xl font-black neon-text mt-1">{item.value}</p>
                      </motion.div>
                    ))}
                  </div>

                  {/* User Growth Chart */}
                  <motion.div variants={itemVariants} className="glass-card p-4 sm:p-6 neon-glow">
                    <h2 className="text-sm sm:text-base font-bold flex items-center gap-2 mb-4">
                      <BarChart3 className="h-5 w-5 text-neon-purple" />
                      نمو المستخدمين الشهري
                    </h2>
                    <div className="h-60 sm:h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={userGrowthData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} />
                          <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                          <Tooltip content={<UserTooltip />} />
                          <Legend formatter={(value) => <span className="text-xs text-muted-foreground">{value === 'newUsers' ? 'مستخدمون جدد' : 'مستخدمون نشطون'}</span>} />
                          <Bar dataKey="newUsers" name="newUsers" fill="#00f5ff" radius={[4, 4, 0, 0]} opacity={0.9} />
                          <Bar dataKey="activeUsers" name="activeUsers" fill="#8b5cf6" radius={[4, 4, 0, 0]} opacity={0.9} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>

                  {/* Users Table - Mobile responsive with card layout on mobile */}
                  <motion.div variants={itemVariants} className="glass-card p-4 sm:p-5 neon-glow overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-sm sm:text-base font-bold flex items-center gap-2">
                        <Users className="h-5 w-5 text-neon-cyan" />
                        المستخدمين الأخيرين
                      </h2>
                      <Badge className="bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 text-[10px]">
                        1,247 نشط
                      </Badge>
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden sm:block">
                      <ScrollArea className="max-h-[480px]">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-b border-white/10 hover:bg-transparent">
                              <TableHead className="text-neon-cyan/70 text-xs font-semibold">المستخدم</TableHead>
                              <TableHead className="text-neon-cyan/70 text-xs font-semibold text-center">الرقم</TableHead>
                              <TableHead className="text-neon-cyan/70 text-xs font-semibold text-center">الدور</TableHead>
                              <TableHead className="text-neon-cyan/70 text-xs font-semibold text-center">الاشتراك</TableHead>
                              <TableHead className="text-neon-cyan/70 text-xs font-semibold text-center">XP</TableHead>
                              <TableHead className="text-neon-cyan/70 text-xs font-semibold text-center">الحالة</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {[
                              { name: 'د. فاطمة الزهراني', phone: '771234567', role: 'user', subscription: 'premium', xp: 12400, status: 'active' },
                              { name: 'أحمد السعيد', phone: '773456789', role: 'user', subscription: 'free', xp: 8200, status: 'active' },
                              { name: 'د. نورة الحربي', phone: '775678901', role: 'user', subscription: 'premium', xp: 15600, status: 'active' },
                              { name: 'سعيد العمري', phone: '772345678', role: 'user', subscription: 'free', xp: 3100, status: 'inactive' },
                              { name: 'د. خالد المنصور', phone: '778901234', role: 'user', subscription: 'premium', xp: 22100, status: 'active' },
                              { name: 'ريم الدوسري', phone: '776789012', role: 'user', subscription: 'free', xp: 5500, status: 'active' },
                            ].map((user, idx) => (
                              <TableRow key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <TableCell className="font-semibold text-sm">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-600/20 flex items-center justify-center text-xs">
                                      {user.name.charAt(0)}
                                    </div>
                                    {user.name}
                                  </div>
                                </TableCell>
                                <TableCell className="text-center text-sm text-muted-foreground" dir="ltr">{user.phone}</TableCell>
                                <TableCell className="text-center">
                                  {user.role === 'admin' ? (
                                    <Badge className="bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 text-[10px]">مدير</Badge>
                                  ) : (
                                    <Badge className="bg-white/5 text-muted-foreground border border-white/10 text-[10px]">مستخدم</Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  {user.subscription === 'premium' ? (
                                    <Badge className="bg-neon-orange/10 text-neon-orange border border-neon-orange/20 text-[10px]">مميز</Badge>
                                  ) : (
                                    <Badge className="bg-white/5 text-muted-foreground border border-white/10 text-[10px]">مجاني</Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-center text-sm font-semibold text-neon-cyan">{user.xp.toLocaleString()}</TableCell>
                                <TableCell className="text-center">
                                  {user.status === 'active' ? (
                                    <Badge className="bg-neon-green/10 text-neon-green border border-neon-green/20 text-[10px] flex items-center gap-1">
                                      <div className="w-1.5 h-1.5 rounded-full bg-neon-green" />نشط
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-gray-500/10 text-gray-400 border border-gray-500/20 text-[10px]">غير نشط</Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </div>

                    {/* Mobile Cards */}
                    <div className="sm:hidden space-y-3">
                      {[
                        { name: 'د. فاطمة الزهراني', phone: '771234567', role: 'user', subscription: 'premium', xp: 12400, status: 'active' },
                        { name: 'أحمد السعيد', phone: '773456789', role: 'user', subscription: 'free', xp: 8200, status: 'active' },
                        { name: 'د. نورة الحربي', phone: '775678901', role: 'user', subscription: 'premium', xp: 15600, status: 'active' },
                        { name: 'سعيد العمري', phone: '772345678', role: 'user', subscription: 'free', xp: 3100, status: 'inactive' },
                        { name: 'د. خالد المنصور', phone: '778901234', role: 'user', subscription: 'premium', xp: 22100, status: 'active' },
                        { name: 'ريم الدوسري', phone: '776789012', role: 'user', subscription: 'free', xp: 5500, status: 'active' },
                      ].map((user, idx) => (
                        <div key={idx} className="glass-card p-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-600/20 flex items-center justify-center text-xs shrink-0">
                              {user.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate">{user.name}</p>
                              <p className="text-xs text-muted-foreground" dir="ltr">{user.phone}</p>
                            </div>
                            {user.status === 'active' ? (
                              <Badge className="bg-neon-green/10 text-neon-green border border-neon-green/20 text-[9px]">نشط</Badge>
                            ) : (
                              <Badge className="bg-gray-500/10 text-gray-400 border border-gray-500/20 text-[9px]">غير نشط</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            {user.subscription === 'premium' ? (
                              <Badge className="bg-neon-orange/10 text-neon-orange border border-neon-orange/20 text-[9px]">مميز</Badge>
                            ) : (
                              <Badge className="bg-white/5 text-muted-foreground border border-white/10 text-[9px]">مجاني</Badge>
                            )}
                            <span className="text-neon-cyan font-semibold">{user.xp.toLocaleString()} XP</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </motion.div>
              )}

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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title="إجمالي المستخدمين" value="125,847" trend="up" trendLabel="+12.5%" icon={Users} iconColor="text-neon-cyan" sparkData={sparklineUsers} sparkColor="#00f5ff" delay={0} />
                    <StatCard title="الإيرادات الشهرية" value="ر.ي 89,250" trend="up" trendLabel="+8.3%" icon={DollarSign} iconColor="text-neon-green" sparkData={sparklineRevenue} sparkColor="#10b981" delay={0.08} />
                    <StatCard title="الدورات النشطة" value={String(courses.length)} trend="up" trendLabel="+3.2%" icon={BookOpen} iconColor="text-neon-purple" sparkData={sparklineCourses} sparkColor="#8b5cf6" delay={0.16} />
                    <StatCard title="استخدام AI" value="1.2M" trend="up" trendLabel="+18.7%" icon={Brain} iconColor="text-neon-orange" sparkData={sparklineAI} sparkColor="#f59e0b" delay={0.24} />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <motion.div variants={itemVariants} className="glass-card p-5 neon-glow">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-bold flex items-center gap-2">
                          <DollarSign className="h-5 w-5 text-neon-cyan" />
                          الإيرادات الشهرية
                        </h2>
                        <Badge className="bg-neon-green/10 text-neon-green border border-neon-green/20 text-[10px]">+8.3%</Badge>
                      </div>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={revenueData}>
                            <defs>
                              <linearGradient id="premiumGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#00f5ff" stopOpacity={0.4} />
                                <stop offset="100%" stopColor="#00f5ff" stopOpacity={0} />
                              </linearGradient>
                              <linearGradient id="freeGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} />
                            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend formatter={(value) => <span className="text-xs text-muted-foreground">{value === 'premium' ? 'مميز' : 'مجاني'}</span>} />
                            <Area type="monotone" dataKey="premium" name="premium" stroke="#00f5ff" strokeWidth={2.5} fill="url(#premiumGradient)" dot={false} />
                            <Area type="monotone" dataKey="free" name="free" stroke="#8b5cf6" strokeWidth={2} fill="url(#freeGradient)" dot={false} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="glass-card p-5 neon-glow">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-bold flex items-center gap-2">
                          <Users className="h-5 w-5 text-neon-purple" />
                          نمو المستخدمين
                        </h2>
                        <Badge className="bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 text-[10px]">+12.5%</Badge>
                      </div>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={userGrowthData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} />
                            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <Tooltip content={<UserTooltip />} />
                            <Legend formatter={(value) => <span className="text-xs text-muted-foreground">{value === 'newUsers' ? 'مستخدمون جدد' : 'مستخدمون نشطون'}</span>} />
                            <Bar dataKey="newUsers" name="newUsers" fill="#00f5ff" radius={[4, 4, 0, 0]} opacity={0.9} />
                            <Bar dataKey="activeUsers" name="activeUsers" fill="#8b5cf6" radius={[4, 4, 0, 0]} opacity={0.9} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </motion.div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <motion.div variants={itemVariants} className="glass-card p-5 neon-glow">
                      <h2 className="text-base font-bold flex items-center gap-2 mb-4">
                        <Brain className="h-5 w-5 text-neon-orange" />
                        تحليلات استخدام AI
                      </h2>
                      <div className="h-52">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={aiUsageData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" stroke="none">
                              {aiUsageData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => [`${value}%`, '']} contentStyle={{ background: 'rgba(17, 24, 39, 0.9)', border: '1px solid rgba(0, 245, 255, 0.2)', borderRadius: '0.75rem', fontSize: '12px' }} itemStyle={{ color: '#e2e8f0' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-2 mt-2">
                        {aiUsageData.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                              <span className="text-muted-foreground">{item.name}</span>
                            </div>
                            <span className="font-semibold text-white">{item.value}%</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="glass-card p-5">
                      <h2 className="text-base font-bold flex items-center gap-2 mb-4">
                        <Activity className="h-5 w-5 text-neon-cyan" />
                        النشاط الأخير
                      </h2>
                      <ScrollArea className="h-[340px]">
                        <div className="space-y-3">
                          {recentActivity.map((item, idx) => {
                            const Icon = item.icon
                            return (
                              <div key={item.id} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors group">
                                <div className={`rounded-lg p-1.5 shrink-0 ${item.color.includes('cyan') ? 'bg-neon-cyan/10' : item.color.includes('green') ? 'bg-neon-green/10' : item.color.includes('purple') ? 'bg-neon-purple/10' : item.color.includes('orange') ? 'bg-neon-orange/10' : 'bg-red-500/10'}`}>
                                  <Icon className={`h-3.5 w-3.5 ${item.color}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs leading-5 group-hover:text-white transition-colors">{item.text}</p>
                                  <p className="text-[10px] text-muted-foreground mt-0.5">{item.time}</p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </ScrollArea>
                    </motion.div>

                    <motion.div variants={itemVariants} className="glass-card p-5 gradient-border">
                      <h2 className="text-base font-bold flex items-center gap-2 mb-4">
                        <Bell className="h-5 w-5 text-neon-pink" />
                        إرسال إشعار
                      </h2>
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1.5 block">العنوان</label>
                          <Input value={notifTitle} onChange={(e) => setNotifTitle(e.target.value)} placeholder="عنوان الإشعار..." className="bg-white/5 border-white/10 focus:border-neon-cyan/50 focus:ring-neon-cyan/20 text-sm h-9 placeholder:text-muted-foreground/50" />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1.5 block">الرسالة</label>
                          <Textarea value={notifMessage} onChange={(e) => setNotifMessage(e.target.value)} placeholder="نص الإشعار..." rows={3} className="bg-white/5 border-white/10 focus:border-neon-cyan/50 focus:ring-neon-cyan/20 text-sm resize-none placeholder:text-muted-foreground/50" />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1.5 block">الجمهور المستهدف</label>
                          <Select value={notifAudience} onValueChange={setNotifAudience}>
                            <SelectTrigger className="w-full bg-white/5 border-white/10 h-9 text-sm">
                              <SelectValue placeholder="اختر الجمهور" />
                            </SelectTrigger>
                            <SelectContent className="bg-med-card border-neon-cyan/20">
                              <SelectItem value="all">الكل</SelectItem>
                              <SelectItem value="premium">مميز</SelectItem>
                              <SelectItem value="free">مجاني</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button onClick={handleSendNotif} disabled={sendingNotif || !notifTitle.trim() || !notifMessage.trim()} className="w-full bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/25 hover:shadow-[0_0_20px_rgba(0,245,255,0.15)] transition-all h-10">
                          {sendingNotif ? (
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="h-4 w-4 border-2 border-neon-cyan/30 border-t-neon-cyan rounded-full" />
                          ) : (
                            <>
                              <Send className="h-4 w-4 ml-2" />
                              إرسال الإشعار
                            </>
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {/* ═══════════════════════════════════════════════
                  REVENUE TAB
              ═══════════════════════════════════════════════ */}
              {activeTab === 'revenue' && (
                <motion.div
                  key="revenue"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6 mt-6"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { title: 'إجمالي الإيرادات', value: 'ر.ي 1,068,000', icon: DollarSign, color: 'text-neon-cyan', bg: 'bg-neon-cyan/10', border: 'border-neon-cyan/20' },
                      { title: 'متوسط الإيرادات لكل مستخدم', value: 'ر.ي 8.49', icon: Users, color: 'text-neon-green', bg: 'bg-neon-green/10', border: 'border-neon-green/20' },
                      { title: 'معدل التحويل', value: '23.4%', icon: TrendingUp, color: 'text-neon-purple', bg: 'bg-neon-purple/10', border: 'border-neon-purple/20' },
                    ].map((item, idx) => (
                      <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} whileHover={cardHover} className="glass-card p-5">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`rounded-xl p-2.5 ${item.bg} ${item.border} border`}>
                            <item.icon className={`h-5 w-5 ${item.color}`} />
                          </div>
                          <span className="text-sm text-muted-foreground">{item.title}</span>
                        </div>
                        <p className="text-2xl font-black neon-text">{item.value}</p>
                      </motion.div>
                    ))}
                  </div>

                  <motion.div variants={itemVariants} className="glass-card p-6 neon-glow">
                    <h2 className="text-base font-bold flex items-center gap-2 mb-4">
                      <BarChart3 className="h-5 w-5 text-neon-cyan" />
                      تفصيل الإيرادات الشهرية
                    </h2>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueData}>
                          <defs>
                            <linearGradient id="premGradFull" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#00f5ff" stopOpacity={0.5} />
                              <stop offset="100%" stopColor="#00f5ff" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="freeGradFull" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
                              <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} />
                          <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend formatter={(value) => <span className="text-xs text-muted-foreground">{value === 'premium' ? 'مميز' : 'مجاني'}</span>} />
                          <Area type="monotone" dataKey="premium" name="premium" stroke="#00f5ff" strokeWidth={2.5} fill="url(#premGradFull)" dot={{ fill: '#00f5ff', r: 3 }} />
                          <Area type="monotone" dataKey="free" name="free" stroke="#8b5cf6" strokeWidth={2} fill="url(#freeGradFull)" dot={{ fill: '#8b5cf6', r: 3 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {/* ═══════════════════════════════════════════════
                  TICKETS TAB
              ═══════════════════════════════════════════════ */}
              {activeTab === 'tickets' && (
                <motion.div
                  key="tickets"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6 mt-6"
                >
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    {[
                      { title: 'التذاكر المفتوحة', value: '23', icon: AlertCircle, color: 'text-neon-orange', bg: 'bg-neon-orange/10', border: 'border-neon-orange/20' },
                      { title: 'قيد المراجعة', value: '15', icon: Clock, color: 'text-neon-blue', bg: 'bg-neon-blue/10', border: 'border-neon-blue/20' },
                      { title: 'تم الإغلاق اليوم', value: '42', icon: CheckCircle2, color: 'text-neon-green', bg: 'bg-neon-green/10', border: 'border-neon-green/20' },
                      { title: 'متوسط وقت الاستجابة', value: '2.4 ساعة', icon: Zap, color: 'text-neon-cyan', bg: 'bg-neon-cyan/10', border: 'border-neon-cyan/20' },
                    ].map((item, idx) => (
                      <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }} whileHover={cardHover} className="glass-card p-4 sm:p-5">
                        <div className={`rounded-xl p-2 ${item.bg} ${item.border} border inline-block mb-2`}>
                          <item.icon className={`h-4 w-4 ${item.color}`} />
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground">{item.title}</p>
                        <p className="text-lg sm:text-2xl font-black neon-text mt-1">{item.value}</p>
                      </motion.div>
                    ))}
                  </div>

                  <motion.div variants={itemVariants} className="glass-card p-4 sm:p-5 neon-glow overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-sm sm:text-base font-bold flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-neon-orange" />
                        تذاكر الدعم
                      </h2>
                      <Badge className="bg-neon-orange/10 text-neon-orange border border-neon-orange/20 text-[10px]">
                        {ticketsData.filter(t => t.status === 'open').length} مفتوح
                      </Badge>
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden sm:block">
                      <ScrollArea className="max-h-[420px]">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-b border-white/10 hover:bg-transparent">
                              <TableHead className="text-neon-cyan/70 text-xs font-semibold">رقم التذكرة</TableHead>
                              <TableHead className="text-neon-cyan/70 text-xs font-semibold">المستخدم</TableHead>
                              <TableHead className="text-neon-cyan/70 text-xs font-semibold">الموضوع</TableHead>
                              <TableHead className="text-neon-cyan/70 text-xs font-semibold text-center">الحالة</TableHead>
                              <TableHead className="text-neon-cyan/70 text-xs font-semibold text-center">الأولوية</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {ticketsData.map((ticket) => (
                              <TableRow key={ticket.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <TableCell className="font-mono text-xs text-neon-cyan">{ticket.id}</TableCell>
                                <TableCell className="text-sm font-semibold">{ticket.user}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">{ticket.subject}</TableCell>
                                <TableCell className="text-center">{getTicketStatusBadge(ticket.status)}</TableCell>
                                <TableCell className="text-center">{getPriorityBadge(ticket.priority)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </div>

                    {/* Mobile Cards */}
                    <div className="sm:hidden space-y-3">
                      {ticketsData.map((ticket) => (
                        <div key={ticket.id} className="glass-card p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs text-neon-cyan">{ticket.id}</span>
                            {getPriorityBadge(ticket.priority)}
                          </div>
                          <p className="text-sm font-semibold">{ticket.user}</p>
                          <p className="text-xs text-muted-foreground">{ticket.subject}</p>
                          <div>{getTicketStatusBadge(ticket.status)}</div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </Tabs>
        </motion.div>
      </div>
    </motion.div>
  )
}
