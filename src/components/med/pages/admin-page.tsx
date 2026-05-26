'use client'

import { useState } from 'react'
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
  Ticket, Settings, ChevronLeft,
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

const coursesData = [
  { id: '1', name: 'طب الطوارئ الشاملة', students: 15200, rating: 4.9, revenue: 245000, completion: 72, status: 'active' as const },
  { id: '2', name: 'أساسيات أمراض القلب', students: 8900, rating: 4.8, revenue: 189000, completion: 65, status: 'active' as const },
  { id: '3', name: 'الغوص في علم الأعصاب', students: 6300, rating: 4.7, revenue: 156000, completion: 58, status: 'active' as const },
  { id: '4', name: 'أساسيات طب الأطفال', students: 11200, rating: 4.9, revenue: 98000, completion: 81, status: 'active' as const },
  { id: '5', name: 'تقنيات الجراحة', students: 4500, rating: 4.6, revenue: 210000, completion: 44, status: 'draft' as const },
  { id: '6', name: 'مراجعة الطب الباطني', students: 9800, rating: 4.8, revenue: 175000, completion: 69, status: 'active' as const },
  { id: '7', name: 'تفسير الأشعة', students: 5600, rating: 4.7, revenue: 142000, completion: 53, status: 'active' as const },
  { id: '8', name: 'علم الأدوية مبسط', students: 13500, rating: 4.9, revenue: 88000, completion: 78, status: 'active' as const },
  { id: '9', name: 'الطب الشرعي الأساسي', students: 2100, rating: 4.3, revenue: 35000, completion: 22, status: 'archived' as const },
  { id: '10', name: 'الوراثة الطبية', students: 3800, rating: 4.5, revenue: 67000, completion: 35, status: 'draft' as const },
]

const recentActivity = [
  { id: '1', icon: UserPlus, text: 'تسجيل مستخدم جديد: د. فاطمة الزهراني', time: 'منذ 3 دقائق', color: 'text-neon-cyan' },
  { id: '2', icon: CheckCircle2, text: 'إتمام دورة: طب الطوارئ الشاملة - أحمد السعيد', time: 'منذ 12 دقيقة', color: 'text-neon-green' },
  { id: '3', icon: CreditCard, text: 'دفعة جديدة: $49 - اشتراك مميز', time: 'منذ 25 دقيقة', color: 'text-neon-purple' },
  { id: '4', icon: Zap, text: 'ارتفاع استخدام AI: 15,000 طلب في الساعة الأخيرة', time: 'منذ 38 دقيقة', color: 'text-neon-orange' },
  { id: '5', icon: UserPlus, text: 'تسجيل مستخدم جديد: د. نورة القحطاني', time: 'منذ 45 دقيقة', color: 'text-neon-cyan' },
  { id: '6', icon: CheckCircle2, text: 'إتمام دورة: علم الأدوية مبسط - سعيد الحربي', time: 'منذ ساعة', color: 'text-neon-green' },
  { id: '7', icon: CreditCard, text: 'دفعة جديدة: $79 - اشتراك مميز', time: 'منذ ساعة و 15 دقيقة', color: 'text-neon-purple' },
  { id: '8', icon: AlertCircle, text: 'تنبيه: ارتفاع معدل الأخطاء في محرك AI بنسبة 2%', time: 'منذ ساعتين', color: 'text-red-400' },
  { id: '9', icon: UserPlus, text: '10 تسجيلات جديدة في آخر ساعتين', time: 'منذ ساعتين', color: 'text-neon-cyan' },
  { id: '10', icon: Zap, text: 'تحديث نموذج AI: GPT-Med v3.2 تم نشره', time: 'منذ 3 ساعات', color: 'text-neon-orange' },
]

const ticketsData = [
  { id: 'TK-2847', user: 'د. محمد العلي', subject: 'مشكلة في تشغيل المحاكاة', status: 'open' as const, priority: 'urgent' as const },
  { id: 'TK-2846', user: 'د. سارة الأحمد', subject: 'طلب استرداد مبلغ', status: 'review' as const, priority: 'high' as const },
  { id: 'TK-2845', user: 'أحمد السعيد', subject: 'لا يمكن الوصول للدورة', status: 'open' as const, priority: 'normal' as const },
  { id: 'TK-2844', user: 'د. نورة الحربي', subject: 'خطأ في حساب XP', status: 'review' as const, priority: 'normal' as const },
  { id: 'TK-2843', user: 'د. خالد المنصور', subject: 'اقتراح: إضافة تتبع التقدم', status: 'closed' as const, priority: 'normal' as const },
  { id: 'TK-2842', user: 'ريم الدوسري', subject: 'مشكلة في الدفع', status: 'review' as const, priority: 'high' as const },
  { id: 'TK-2841', user: 'د. فهد العمري', subject: 'استفسار عن الاشتراك', status: 'closed' as const, priority: 'normal' as const },
  { id: 'TK-2840', user: 'د. ليلى القحطاني', subject: 'فشل تحميل الفيديو', status: 'open' as const, priority: 'urgent' as const },
]

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
      {/* Background glow */}
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

        {/* Sparkline */}
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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  MAIN COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function AdminPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [notifTitle, setNotifTitle] = useState('')
  const [notifMessage, setNotifMessage] = useState('')
  const [notifAudience, setNotifAudience] = useState('')
  const [sendingNotif, setSendingNotif] = useState(false)

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
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black neon-text flex items-center gap-3">
              <Shield className="h-7 w-7 text-neon-cyan" />
              لوحة الإدارة
            </h1>
            <p className="text-sm text-muted-foreground mt-1">إدارة ومراقبة منصة MedAI Academy</p>
          </div>
          <div className="flex items-center gap-2">
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
              <TabsTrigger value="overview" className="data-[state=active]:bg-neon-cyan/15 data-[state=active]:text-neon-cyan data-[state=active]:shadow-[0_0_12px_rgba(0,245,255,0.15)] text-xs sm:text-sm px-3 sm:px-4">
                <Activity className="h-4 w-4 ml-1" />
                نظرة عامة
              </TabsTrigger>
              <TabsTrigger value="revenue" className="data-[state=active]:bg-neon-cyan/15 data-[state=active]:text-neon-cyan data-[state=active]:shadow-[0_0_12px_rgba(0,245,255,0.15)] text-xs sm:text-sm px-3 sm:px-4">
                <DollarSign className="h-4 w-4 ml-1" />
                الإيرادات
              </TabsTrigger>
              <TabsTrigger value="users" className="data-[state=active]:bg-neon-cyan/15 data-[state=active]:text-neon-cyan data-[state=active]:shadow-[0_0_12px_rgba(0,245,255,0.15)] text-xs sm:text-sm px-3 sm:px-4">
                <Users className="h-4 w-4 ml-1" />
                المستخدمين
              </TabsTrigger>
              <TabsTrigger value="courses" className="data-[state=active]:bg-neon-cyan/15 data-[state=active]:text-neon-cyan data-[state=active]:shadow-[0_0_12px_rgba(0,245,255,0.15)] text-xs sm:text-sm px-3 sm:px-4">
                <BookOpen className="h-4 w-4 ml-1" />
                الدورات
              </TabsTrigger>
              <TabsTrigger value="tickets" className="data-[state=active]:bg-neon-cyan/15 data-[state=active]:text-neon-cyan data-[state=active]:shadow-[0_0_12px_rgba(0,245,255,0.15)] text-xs sm:text-sm px-3 sm:px-4">
                <Ticket className="h-4 w-4 ml-1" />
                التذاكر
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
                  {/* 1. TOP STATS ROW */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                      title="إجمالي المستخدمين"
                      value="125,847"
                      trend="up"
                      trendLabel="+12.5%"
                      icon={Users}
                      iconColor="text-neon-cyan"
                      sparkData={sparklineUsers}
                      sparkColor="#00f5ff"
                      delay={0}
                    />
                    <StatCard
                      title="الإيرادات الشهرية"
                      value="$89,250"
                      trend="up"
                      trendLabel="+8.3%"
                      icon={DollarSign}
                      iconColor="text-neon-green"
                      sparkData={sparklineRevenue}
                      sparkColor="#10b981"
                      delay={0.08}
                    />
                    <StatCard
                      title="الدورات النشطة"
                      value="342"
                      trend="up"
                      trendLabel="+3.2%"
                      icon={BookOpen}
                      iconColor="text-neon-purple"
                      sparkData={sparklineCourses}
                      sparkColor="#8b5cf6"
                      delay={0.16}
                    />
                    <StatCard
                      title="استخدام AI"
                      value="1.2M"
                      trend="up"
                      trendLabel="+18.7%"
                      icon={Brain}
                      iconColor="text-neon-orange"
                      sparkData={sparklineAI}
                      sparkColor="#f59e0b"
                      delay={0.24}
                    />
                  </div>

                  {/* CHARTS ROW - Revenue + User Growth */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 2. REVENUE CHART */}
                    <motion.div
                      variants={itemVariants}
                      className="glass-card p-5 neon-glow"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-bold flex items-center gap-2">
                          <DollarSign className="h-5 w-5 text-neon-cyan" />
                          الإيرادات الشهرية
                        </h2>
                        <Badge className="bg-neon-green/10 text-neon-green border border-neon-green/20 text-[10px]">
                          +8.3% هذا الشهر
                        </Badge>
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
                            <XAxis
                              dataKey="month"
                              tick={{ fill: '#94a3b8', fontSize: 11 }}
                              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                              tickLine={false}
                            />
                            <YAxis
                              tick={{ fill: '#94a3b8', fontSize: 11 }}
                              axisLine={false}
                              tickLine={false}
                              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                              formatter={(value) => (
                                <span className="text-xs text-muted-foreground">
                                  {value === 'premium' ? 'مميز' : 'مجاني'}
                                </span>
                              )}
                            />
                            <Area
                              type="monotone"
                              dataKey="premium"
                              name="premium"
                              stroke="#00f5ff"
                              strokeWidth={2.5}
                              fill="url(#premiumGradient)"
                              dot={false}
                              activeDot={{ r: 5, fill: '#00f5ff', stroke: '#0a0e1a', strokeWidth: 2 }}
                            />
                            <Area
                              type="monotone"
                              dataKey="free"
                              name="free"
                              stroke="#8b5cf6"
                              strokeWidth={2}
                              fill="url(#freeGradient)"
                              dot={false}
                              activeDot={{ r: 4, fill: '#8b5cf6', stroke: '#0a0e1a', strokeWidth: 2 }}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </motion.div>

                    {/* 3. USER GROWTH CHART */}
                    <motion.div
                      variants={itemVariants}
                      className="glass-card p-5 neon-glow"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-bold flex items-center gap-2">
                          <Users className="h-5 w-5 text-neon-purple" />
                          نمو المستخدمين
                        </h2>
                        <Badge className="bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 text-[10px]">
                          +12.5% نمو
                        </Badge>
                      </div>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={userGrowthData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis
                              dataKey="month"
                              tick={{ fill: '#94a3b8', fontSize: 11 }}
                              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                              tickLine={false}
                            />
                            <YAxis
                              tick={{ fill: '#94a3b8', fontSize: 11 }}
                              axisLine={false}
                              tickLine={false}
                              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                            />
                            <Tooltip content={<UserTooltip />} />
                            <Legend
                              formatter={(value) => (
                                <span className="text-xs text-muted-foreground">
                                  {value === 'newUsers' ? 'مستخدمون جدد' : 'مستخدمون نشطون'}
                                </span>
                              )}
                            />
                            <Bar
                              dataKey="newUsers"
                              name="newUsers"
                              fill="#00f5ff"
                              radius={[4, 4, 0, 0]}
                              opacity={0.9}
                            />
                            <Bar
                              dataKey="activeUsers"
                              name="activeUsers"
                              fill="#8b5cf6"
                              radius={[4, 4, 0, 0]}
                              opacity={0.9}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </motion.div>
                  </div>

                  {/* BOTTOM ROW - AI Usage + Activity + Quick Notifications */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* 5. AI USAGE ANALYTICS */}
                    <motion.div
                      variants={itemVariants}
                      className="glass-card p-5 neon-glow"
                    >
                      <h2 className="text-base font-bold flex items-center gap-2 mb-4">
                        <Brain className="h-5 w-5 text-neon-orange" />
                        تحليلات استخدام AI
                      </h2>
                      <div className="h-52">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={aiUsageData}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={80}
                              paddingAngle={3}
                              dataKey="value"
                              stroke="none"
                            >
                              {aiUsageData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value: number) => [`${value}%`, '']}
                              contentStyle={{
                                background: 'rgba(17, 24, 39, 0.9)',
                                border: '1px solid rgba(0, 245, 255, 0.2)',
                                borderRadius: '0.75rem',
                                fontSize: '12px',
                              }}
                              itemStyle={{ color: '#e2e8f0' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      {/* Legend */}
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

                    {/* 6. RECENT ACTIVITY FEED */}
                    <motion.div
                      variants={itemVariants}
                      className="glass-card p-5"
                    >
                      <h2 className="text-base font-bold flex items-center gap-2 mb-4">
                        <Activity className="h-5 w-5 text-neon-cyan" />
                        النشاط الأخير
                      </h2>
                      <ScrollArea className="h-[340px]">
                        <div className="space-y-3">
                          {recentActivity.map((item, idx) => {
                            const Icon = item.icon
                            return (
                              <motion.div
                                key={item.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors group"
                              >
                                <div className={`rounded-lg p-1.5 shrink-0 ${item.color.includes('cyan') ? 'bg-neon-cyan/10' : item.color.includes('green') ? 'bg-neon-green/10' : item.color.includes('purple') ? 'bg-neon-purple/10' : item.color.includes('orange') ? 'bg-neon-orange/10' : 'bg-red-500/10'}`}>
                                  <Icon className={`h-3.5 w-3.5 ${item.color}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs leading-5 group-hover:text-white transition-colors">{item.text}</p>
                                  <p className="text-[10px] text-muted-foreground mt-0.5">{item.time}</p>
                                </div>
                              </motion.div>
                            )
                          })}
                        </div>
                      </ScrollArea>
                    </motion.div>

                    {/* 8. NOTIFICATIONS PANEL */}
                    <motion.div
                      variants={itemVariants}
                      className="glass-card p-5 gradient-border"
                    >
                      <h2 className="text-base font-bold flex items-center gap-2 mb-4">
                        <Bell className="h-5 w-5 text-neon-pink" />
                        إرسال إشعار
                      </h2>
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1.5 block">العنوان</label>
                          <Input
                            value={notifTitle}
                            onChange={(e) => setNotifTitle(e.target.value)}
                            placeholder="عنوان الإشعار..."
                            className="bg-white/5 border-white/10 focus:border-neon-cyan/50 focus:ring-neon-cyan/20 text-sm h-9 placeholder:text-muted-foreground/50"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1.5 block">الرسالة</label>
                          <Textarea
                            value={notifMessage}
                            onChange={(e) => setNotifMessage(e.target.value)}
                            placeholder="نص الإشعار..."
                            rows={3}
                            className="bg-white/5 border-white/10 focus:border-neon-cyan/50 focus:ring-neon-cyan/20 text-sm resize-none placeholder:text-muted-foreground/50"
                          />
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
                        <Button
                          onClick={handleSendNotif}
                          disabled={sendingNotif || !notifTitle.trim() || !notifMessage.trim()}
                          className="w-full bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/25 hover:shadow-[0_0_20px_rgba(0,245,255,0.15)] transition-all h-10"
                        >
                          {sendingNotif ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                              className="h-4 w-4 border-2 border-neon-cyan/30 border-t-neon-cyan rounded-full"
                            />
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
                  {/* Revenue Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { title: 'إجمالي الإيرادات', value: '$1,068,000', icon: DollarSign, color: 'text-neon-cyan', bg: 'bg-neon-cyan/10', border: 'border-neon-cyan/20' },
                      { title: 'متوسط الإيرادات لكل مستخدم', value: '$8.49', icon: Users, color: 'text-neon-green', bg: 'bg-neon-green/10', border: 'border-neon-green/20' },
                      { title: 'معدل التحويل', value: '23.4%', icon: TrendingUp, color: 'text-neon-purple', bg: 'bg-neon-purple/10', border: 'border-neon-purple/20' },
                    ].map((item, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        whileHover={cardHover}
                        className="glass-card p-5"
                      >
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

                  {/* Full Revenue Chart */}
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
                          <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend formatter={(value) => <span className="text-xs text-muted-foreground">{value === 'premium' ? 'مميز' : 'مجاني'}</span>} />
                          <Area type="monotone" dataKey="premium" name="premium" stroke="#00f5ff" strokeWidth={2.5} fill="url(#premGradFull)" dot={{ fill: '#00f5ff', r: 3 }} activeDot={{ r: 6, fill: '#00f5ff', stroke: '#0a0e1a', strokeWidth: 2 }} />
                          <Area type="monotone" dataKey="free" name="free" stroke="#8b5cf6" strokeWidth={2} fill="url(#freeGradFull)" dot={{ fill: '#8b5cf6', r: 3 }} activeDot={{ r: 5, fill: '#8b5cf6', stroke: '#0a0e1a', strokeWidth: 2 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>
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
                  className="space-y-6 mt-6"
                >
                  {/* User Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
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
                        className="glass-card p-5"
                      >
                        <div className={`rounded-xl p-2.5 ${item.bg} ${item.border} border inline-block mb-3`}>
                          <item.icon className={`h-5 w-5 ${item.color}`} />
                        </div>
                        <p className="text-sm text-muted-foreground">{item.title}</p>
                        <p className="text-2xl font-black neon-text mt-1">{item.value}</p>
                      </motion.div>
                    ))}
                  </div>

                  {/* Full User Growth Chart */}
                  <motion.div variants={itemVariants} className="glass-card p-6 neon-glow">
                    <h2 className="text-base font-bold flex items-center gap-2 mb-4">
                      <BarChart3 className="h-5 w-5 text-neon-purple" />
                      نمو المستخدمين الشهري
                    </h2>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={userGrowthData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} />
                          <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                          <Tooltip content={<UserTooltip />} />
                          <Legend formatter={(value) => <span className="text-xs text-muted-foreground">{value === 'newUsers' ? 'مستخدمون جدد' : 'مستخدمون نشطون'}</span>} />
                          <Bar dataKey="newUsers" name="newUsers" fill="#00f5ff" radius={[4, 4, 0, 0]} opacity={0.9} />
                          <Bar dataKey="activeUsers" name="activeUsers" fill="#8b5cf6" radius={[4, 4, 0, 0]} opacity={0.9} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>
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
                  className="space-y-6 mt-6"
                >
                  {/* Course Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { title: 'إجمالي الدورات', value: '342', icon: BookOpen, color: 'text-neon-cyan', bg: 'bg-neon-cyan/10', border: 'border-neon-cyan/20' },
                      { title: 'متوسط التقييم', value: '4.72', icon: Star, color: 'text-neon-orange', bg: 'bg-neon-orange/10', border: 'border-neon-orange/20' },
                      { title: 'معدل الإكمال', value: '64.8%', icon: CheckCircle2, color: 'text-neon-green', bg: 'bg-neon-green/10', border: 'border-neon-green/20' },
                    ].map((item, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        whileHover={cardHover}
                        className="glass-card p-5"
                      >
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

                  {/* 4. COURSE PERFORMANCE TABLE */}
                  <motion.div variants={itemVariants} className="glass-card p-5 neon-glow overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-base font-bold flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-neon-purple" />
                        أداء الدورات
                      </h2>
                      <Badge className="bg-neon-purple/10 text-neon-purple border border-neon-purple/20 text-[10px]">
                        {coursesData.length} دورة
                      </Badge>
                    </div>
                    <ScrollArea className="max-h-[480px]">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-b border-white/10 hover:bg-transparent">
                            <TableHead className="text-neon-cyan/70 text-xs font-semibold">اسم الدورة</TableHead>
                            <TableHead className="text-neon-cyan/70 text-xs font-semibold text-center">الطلاب</TableHead>
                            <TableHead className="text-neon-cyan/70 text-xs font-semibold text-center">التقييم</TableHead>
                            <TableHead className="text-neon-cyan/70 text-xs font-semibold text-center">الإيرادات</TableHead>
                            <TableHead className="text-neon-cyan/70 text-xs font-semibold text-center">الإكمال</TableHead>
                            <TableHead className="text-neon-cyan/70 text-xs font-semibold text-center">الحالة</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {coursesData.map((course, idx) => (
                            <TableRow
                              key={course.id}
                              className="border-b border-white/5 hover:bg-white/5 transition-colors"
                            >
                              <TableCell className="font-semibold text-sm">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-purple/20 to-neon-cyan/20 flex items-center justify-center text-xs">
                                    {idx + 1}
                                  </div>
                                  {course.name}
                                </div>
                              </TableCell>
                              <TableCell className="text-center text-sm text-muted-foreground">
                                {course.students.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-center">
                                <span className="flex items-center justify-center gap-1 text-sm">
                                  <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                                  <span className="font-semibold">{course.rating}</span>
                                </span>
                              </TableCell>
                              <TableCell className="text-center text-sm font-semibold text-neon-green">
                                ${course.revenue.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${course.completion}%` }}
                                      transition={{ duration: 1, delay: idx * 0.05 }}
                                      className={`h-full rounded-full ${
                                        course.completion >= 70
                                          ? 'bg-neon-green'
                                          : course.completion >= 50
                                          ? 'bg-neon-orange'
                                          : 'bg-red-400'
                                      }`}
                                    />
                                  </div>
                                  <span className="text-xs text-muted-foreground w-8">{course.completion}%</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                {getStatusBadge(course.status)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
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
                  {/* Ticket Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    {[
                      { title: 'التذاكر المفتوحة', value: '23', icon: AlertCircle, color: 'text-neon-orange', bg: 'bg-neon-orange/10', border: 'border-neon-orange/20' },
                      { title: 'قيد المراجعة', value: '15', icon: Clock, color: 'text-neon-blue', bg: 'bg-neon-blue/10', border: 'border-neon-blue/20' },
                      { title: 'تم الإغلاق اليوم', value: '42', icon: CheckCircle2, color: 'text-neon-green', bg: 'bg-neon-green/10', border: 'border-neon-green/20' },
                      { title: 'متوسط وقت الاستجابة', value: '2.4 ساعة', icon: Zap, color: 'text-neon-cyan', bg: 'bg-neon-cyan/10', border: 'border-neon-cyan/20' },
                    ].map((item, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.08 }}
                        whileHover={cardHover}
                        className="glass-card p-5"
                      >
                        <div className={`rounded-xl p-2.5 ${item.bg} ${item.border} border inline-block mb-3`}>
                          <item.icon className={`h-5 w-5 ${item.color}`} />
                        </div>
                        <p className="text-sm text-muted-foreground">{item.title}</p>
                        <p className="text-2xl font-black neon-text mt-1">{item.value}</p>
                      </motion.div>
                    ))}
                  </div>

                  {/* 7. SUPPORT TICKETS TABLE */}
                  <motion.div variants={itemVariants} className="glass-card p-5 neon-glow overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-base font-bold flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-neon-orange" />
                        تذاكر الدعم
                      </h2>
                      <Badge className="bg-neon-orange/10 text-neon-orange border border-neon-orange/20 text-[10px]">
                        {ticketsData.filter(t => t.status === 'open').length} مفتوح
                      </Badge>
                    </div>
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
                            <TableRow
                              key={ticket.id}
                              className="border-b border-white/5 hover:bg-white/5 transition-colors"
                            >
                              <TableCell className="font-mono text-xs text-neon-cyan">
                                {ticket.id}
                              </TableCell>
                              <TableCell className="text-sm font-semibold">
                                {ticket.user}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {ticket.subject}
                              </TableCell>
                              <TableCell className="text-center">
                                {getTicketStatusBadge(ticket.status)}
                              </TableCell>
                              <TableCell className="text-center">
                                {getPriorityBadge(ticket.priority)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
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
