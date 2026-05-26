'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, BookOpen, Brain, Activity, Play, HelpCircle, Users, User,
  Menu, X, Search, Bell, Globe, ChevronRight, Sparkles, LogOut, Settings, Award, MessageSquare, Eye, EyeOff, Lock, Phone, UserPlus, Shield, Heart, CreditCard
} from 'lucide-react'
import { useAppStore, type PageId } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

// Lazy load page components
import dynamic from 'next/dynamic'

const HomePage = dynamic(() => import('@/components/med/pages/home-page').then(m => ({ default: m.HomePage })), { ssr: false })
const CoursesPage = dynamic(() => import('@/components/med/pages/courses-page').then(m => ({ default: m.CoursesPage })), { ssr: false })
const CourseViewerPage = dynamic(() => import('@/components/med/pages/course-viewer-page').then(m => ({ default: m.CourseViewerPage })), { ssr: false })
const AITutorPage = dynamic(() => import('@/components/med/pages/ai-tutor-page').then(m => ({ default: m.AITutorPage })), { ssr: false })
const SimulationPage = dynamic(() => import('@/components/med/pages/simulation-page').then(m => ({ default: m.SimulationPage })), { ssr: false })
const ShortsPage = dynamic(() => import('@/components/med/pages/shorts-page').then(m => ({ default: m.ShortsPage })), { ssr: false })
const QuizzesPage = dynamic(() => import('@/components/med/pages/quizzes-page').then(m => ({ default: m.QuizzesPage })), { ssr: false })
const CommunityPage = dynamic(() => import('@/components/med/pages/community-page').then(m => ({ default: m.CommunityPage })), { ssr: false })
const ProfilePage = dynamic(() => import('@/components/med/pages/profile-page').then(m => ({ default: m.ProfilePage })), { ssr: false })
const AdminPage = dynamic(() => import('@/components/med/pages/admin-page').then(m => ({ default: m.AdminPage })), { ssr: false })

const USER_NAV_ITEMS: Array<{
  id: PageId
  label: string
  icon: React.ElementType
  color: string
  badge?: number
}> = [
  { id: 'home', label: 'الرئيسية', icon: Home, color: 'text-cyan-400' },
  { id: 'courses', label: 'الدورات', icon: BookOpen, color: 'text-blue-400' },
  { id: 'ai-tutor', label: 'المساعد AI', icon: Brain, color: 'text-purple-400' },
  { id: 'simulation', label: 'المحاكاة', icon: Activity, color: 'text-red-400' },
  { id: 'shorts', label: 'Shorts', icon: Play, color: 'text-pink-400' },
  { id: 'quizzes', label: 'الاختبارات', icon: HelpCircle, color: 'text-amber-400' },
  { id: 'community', label: 'المجتمع', icon: Users, color: 'text-green-400', badge: 5 },
  { id: 'profile', label: 'حسابي', icon: User, color: 'text-emerald-400' },
]

const BOTTOM_NAV_ITEMS = USER_NAV_ITEMS.slice(0, 5)

function Logo() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="relative">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-[#060810] animate-pulse" />
      </div>
      <div>
        <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          MedAI
        </h1>
        <p className="text-[10px] text-muted-foreground -mt-0.5">Academy</p>
      </div>
    </div>
  )
}

// ─── Admin Sidebar ────────────────────────────────────────
function AdminSidebar() {
  const { user } = useAppStore()

  return (
    <div className="hidden lg:flex flex-col w-[260px] h-screen bg-[#060810] border-l border-med-border fixed right-0 top-0 z-40">
      <Logo />

      <div className="px-3 mt-2">
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

      <ScrollArea className="flex-1 mt-3 px-2">
        <div className="glass-card p-3 mx-1">
          <p className="text-xs text-muted-foreground mb-2">لوحة الإدارة</p>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2 text-neon-cyan">
              <Shield className="w-3.5 h-3.5" />
              <span>إدارة كاملة للنظام</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="w-3.5 h-3.5" />
              <span>إدارة المستخدمين</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <BookOpen className="w-3.5 h-3.5" />
              <span>إدارة الدورات والدروس</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CreditCard className="w-3.5 h-3.5" />
              <span>إدارة المدفوعات</span>
            </div>
          </div>
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-med-border">
        <motion.button
          onClick={() => {
            useAppStore.getState().logout()
            if (typeof window !== 'undefined') {
              localStorage.removeItem('medai-user')
              localStorage.removeItem('medai-auth')
              localStorage.removeItem('medai-token')
            }
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all"
          whileHover={{ x: -4 }}
          whileTap={{ scale: 0.98 }}
        >
          <LogOut className="w-4.5 h-4.5" />
          <span className="flex-1 text-right">تسجيل الخروج</span>
        </motion.button>
      </div>
    </div>
  )
}

// ─── User Sidebar ─────────────────────────────────────────
function UserSidebar() {
  const { activePage, setActivePage, user, notifications } = useAppStore()
  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="hidden lg:flex flex-col w-[260px] h-screen bg-[#060810] border-l border-med-border fixed right-0 top-0 z-40">
      <Logo />

      <div className="px-3 mt-2">
        <div className="glass-card p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-sm font-bold">
            {user.name ? user.name.replace(/^(د\.|دكتور|Dr\.?)\s*/i, '').charAt(0) : '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.rankIcon} {user.rankTitle}</p>
          </div>
          <div className="text-xs text-cyan-400 font-bold">Lv.{user.level}</div>
        </div>
      </div>

      <div className="px-4 mt-3">
        <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
          <span>{user.xp.toLocaleString()} XP</span>
          <span>المستوى {user.level + 1}</span>
        </div>
        <div className="h-1.5 rounded-full bg-[#1e293b] overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${((user.xp % 1000) / 1000) * 100}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
      </div>

      <ScrollArea className="flex-1 mt-3 px-2">
        <div className="space-y-0.5">
          {USER_NAV_ITEMS.map((item) => {
            const isActive = activePage === item.id
            return (
              <motion.button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 relative group ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-400'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`}
                whileHover={{ x: -4 }}
                whileTap={{ scale: 0.98 }}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-l-full bg-cyan-400"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon className={`w-4.5 h-4.5 ${isActive ? item.color : ''}`} />
                <span className="flex-1 text-right">{item.label}</span>
                {item.badge && (
                  <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </motion.button>
            )
          })}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-med-border space-y-2">
        <div className="glass-card p-2.5 flex items-center gap-2">
          <div className="text-lg">🔥</div>
          <div className="flex-1">
            <p className="text-xs font-medium">تتابع {user.streak} يوم</p>
            <p className="text-[10px] text-muted-foreground">أعلى: {user.maxStreak} يوم</p>
          </div>
          <div className="text-xs font-bold text-amber-400">{user.coins} 🪙</div>
        </div>
        <motion.button
          onClick={() => {
            useAppStore.getState().logout()
            if (typeof window !== 'undefined') {
              localStorage.removeItem('medai-user')
              localStorage.removeItem('medai-auth')
              localStorage.removeItem('medai-token')
            }
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all"
          whileHover={{ x: -4 }}
          whileTap={{ scale: 0.98 }}
        >
          <LogOut className="w-4.5 h-4.5" />
          <span className="flex-1 text-right">تسجيل الخروج</span>
        </motion.button>
      </div>
    </div>
  )
}

// ─── Admin Mobile Header ──────────────────────────────────
function AdminMobileHeader() {
  const { user } = useAppStore()

  return (
    <div className="lg:hidden sticky top-0 z-50 glass-strong">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-amber-400">لوحة الإدارة</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-neon-green/15 text-neon-green text-[10px]">مدير</Badge>
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-white/5 text-red-400"
            onClick={() => {
              useAppStore.getState().logout()
              if (typeof window !== 'undefined') {
                localStorage.removeItem('medai-user')
                localStorage.removeItem('medai-auth')
                localStorage.removeItem('medai-token')
              }
            }}
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── User Mobile Header ───────────────────────────────────
function MobileHeader() {
  const { user, notifications, setActivePage } = useAppStore()
  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="lg:hidden sticky top-0 z-50 glass-strong">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-foreground hover:bg-white/5">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] bg-[#060810] border-l border-med-border p-0">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b border-med-border">
                  <Logo />
                </div>
                <MobileNavContent />
              </div>
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              MedAI
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative hover:bg-white/5">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-[9px] text-white flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-[#111827] border-med-border" align="end">
              <div className="space-y-3">
                <h3 className="text-sm font-bold">الإشعارات</h3>
                {notifications.map(n => (
                  <div key={n.id} className={`p-2.5 rounded-lg ${n.read ? 'opacity-60' : ''} glass-card`}>
                    <p className="text-xs font-medium">{n.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{n.message}</p>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-white/5"
            onClick={() => setActivePage('profile')}
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-xs font-bold">
              {user.name ? user.name.replace(/^(د\.|دكتور|Dr\.?)\s*/i, '').charAt(0) : '?'}
            </div>
          </Button>
        </div>
      </div>
    </div>
  )
}

function MobileNavContent() {
  const { activePage, setActivePage, user } = useAppStore()

  return (
    <>
      <div className="p-4">
        <div className="glass-card p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-sm font-bold">
            {user.name ? user.name.replace(/^(د\.|دكتور|Dr\.?)\s*/i, '').charAt(0) : '?'}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.rankIcon} {user.rankTitle} · Lv.{user.level}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">🔥 {user.streak} يوم</span>
          <span className="flex items-center gap-1">⚡ {user.xp.toLocaleString()} XP</span>
          <span className="flex items-center gap-1">🪙 {user.coins}</span>
        </div>
      </div>
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-0.5">
          {USER_NAV_ITEMS.map((item) => {
            const isActive = activePage === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-400'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? item.color : ''}`} />
                <span className="flex-1 text-right">{item.label}</span>
                {item.badge && (
                  <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight className="w-4 h-4 rotate-180" />}
              </button>
            )
          })}
        </div>
      </ScrollArea>
      <div className="p-3 border-t border-med-border">
        <motion.button
          onClick={() => {
            useAppStore.getState().logout()
            if (typeof window !== 'undefined') {
              localStorage.removeItem('medai-user')
              localStorage.removeItem('medai-auth')
              localStorage.removeItem('medai-token')
            }
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all"
          whileHover={{ x: -4 }}
          whileTap={{ scale: 0.98 }}
        >
          <LogOut className="w-4.5 h-4.5" />
          <span className="flex-1 text-right">تسجيل الخروج</span>
        </motion.button>
      </div>
    </>
  )
}

function BottomNav() {
  const { activePage, setActivePage } = useAppStore()

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass-strong border-t border-med-border">
      <div className="flex items-center justify-around px-2 py-1.5 safe-area-bottom">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const isActive = activePage === item.id
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className="flex flex-col items-center gap-0.5 py-1 px-2 min-w-[56px] relative"
            >
              <motion.div
                animate={{ scale: isActive ? 1.1 : 1, y: isActive ? -2 : 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <item.icon className={`w-5 h-5 ${isActive ? item.color : 'text-muted-foreground'}`} />
              </motion.div>
              <span className={`text-[10px] ${isActive ? 'text-cyan-400 font-medium' : 'text-muted-foreground'}`}>
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-active"
                  className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-cyan-400"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function UserPageRenderer() {
  const { activePage } = useAppStore()

  const pages: Record<PageId, React.ComponentType> = {
    home: HomePage,
    courses: CoursesPage,
    'course-viewer': CourseViewerPage,
    'ai-tutor': AITutorPage,
    simulation: SimulationPage,
    shorts: ShortsPage,
    quizzes: QuizzesPage,
    community: CommunityPage,
    profile: ProfilePage,
    auth: HomePage,
  }

  const PageComponent = pages[activePage] || HomePage

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activePage}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="h-full"
      >
        <PageComponent />
      </motion.div>
    </AnimatePresence>
  )
}

// =============================================
// Change Password Modal
// =============================================
function ChangePasswordModal({ onComplete }: { onComplete: () => void }) {
  const { authToken } = useAppStore()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)

  const handleChangePassword = async () => {
    setError('')

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('جميع الحقول مطلوبة')
      return
    }

    if (newPassword.length < 6) {
      setError('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('كلمة المرور الجديدة غير متطابقة')
      return
    }

    if (newPassword === currentPassword) {
      setError('كلمة المرور الجديدة يجب أن تكون مختلفة عن الحالية')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: authToken,
          currentPassword,
          newPassword,
        }),
      })

      const data = await res.json()

      if (data.success) {
        onComplete()
      } else {
        setError(data.error || 'حدث خطأ في تغيير كلمة المرور')
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال بالخادم')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
      dir="rtl"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, type: 'spring' }}
        className="relative glass-card p-8 w-full max-w-md"
      >
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/30"
          >
            <Shield className="w-8 h-8 text-white" />
          </motion.div>
          <h2 className="text-xl font-black text-white">تغيير كلمة المرور</h2>
          <p className="text-sm text-amber-400 mt-1">يجب تغيير كلمة المرور الافتراضية قبل المتابعة</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center"
          >
            {error}
          </motion.div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">كلمة المرور الحالية</label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 px-4 pl-10 rounded-xl bg-med-card/80 border border-amber-500/15 text-white placeholder:text-muted-foreground/50 focus:outline-none focus:border-amber-500/40 text-sm"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">كلمة المرور الجديدة</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="6 أحرف على الأقل"
                className="w-full h-11 px-4 pl-10 rounded-xl bg-med-card/80 border border-amber-500/15 text-white placeholder:text-muted-foreground/50 focus:outline-none focus:border-amber-500/40 text-sm"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">تأكيد كلمة المرور الجديدة</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-11 px-4 rounded-xl bg-med-card/80 border border-amber-500/15 text-white placeholder:text-muted-foreground/50 focus:outline-none focus:border-amber-500/40 text-sm"
              dir="ltr"
            />
          </div>

          <Button
            onClick={handleChangePassword}
            disabled={loading || !currentPassword || !newPassword || !confirmPassword}
            className="w-full h-12 font-bold text-base bg-gradient-to-l from-amber-500 to-red-500 text-white hover:shadow-[0_0_30px_rgba(245,158,11,0.3)]"
          >
            {loading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
              />
            ) : 'تغيير كلمة المرور'}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// =============================================
// Auth Screen (Login + Register)
// =============================================
function AuthScreen() {
  const { setIsLoggedIn, updateUser, setAuthToken, setMustChangePassword } = useAppStore()
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [authName, setAuthName] = useState('')
  const [authPhone, setAuthPhone] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const handleLogin = async () => {
    setAuthError('')
    if (!authPhone || !authPassword) {
      setAuthError('رقم الهاتف وكلمة المرور مطلوبان')
      return
    }

    setAuthLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: authPhone, password: authPassword }),
      })

      const data = await res.json()

      if (data.success) {
        const { user, token } = data

        const newUser = {
          id: user.id,
          name: user.name,
          phone: user.phone,
          avatar: '',
          xp: 0,
          coins: 0,
          level: 1,
          rankTitle: user.role === 'admin' ? 'مدير النظام' : 'طالب طب',
          rankIcon: user.role === 'admin' ? '👑' : '🩺',
          streak: 0,
          maxStreak: 0,
          completedCourses: 0,
          totalHours: 0,
          badges: [],
          joinDate: new Date().toISOString().split('T')[0],
          subscription: user.role === 'admin' ? 'premium' as const : 'free' as const,
          medicalSpecialty: '',
          role: user.role as 'admin' | 'user',
        }

        updateUser(newUser)
        setAuthToken(token)
        setIsLoggedIn(true)

        if (user.mustChangePassword) {
          setMustChangePassword(true)
        }

        if (typeof window !== 'undefined') {
          localStorage.setItem('medai-user', JSON.stringify(newUser))
          localStorage.setItem('medai-auth', 'true')
          localStorage.setItem('medai-token', token)
        }
      } else {
        setAuthError(data.error || 'حدث خطأ في تسجيل الدخول')
      }
    } catch (err) {
      setAuthError('حدث خطأ في الاتصال بالخادم')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleRegister = async () => {
    setAuthError('')
    if (!authName || !authPhone || !authPassword) {
      setAuthError('جميع الحقول مطلوبة')
      return
    }

    if (authPassword.length < 6) {
      setAuthError('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      return
    }

    setAuthLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: authName, phone: authPhone, password: authPassword }),
      })

      const data = await res.json()

      if (data.success) {
        const { user, token } = data

        const newUser = {
          id: user.id,
          name: user.name,
          phone: user.phone,
          avatar: '',
          xp: 0,
          coins: 0,
          level: 1,
          rankTitle: 'طالب طب',
          rankIcon: '🩺',
          streak: 0,
          maxStreak: 0,
          completedCourses: 0,
          totalHours: 0,
          badges: [],
          joinDate: new Date().toISOString().split('T')[0],
          subscription: 'free' as const,
          medicalSpecialty: '',
          role: 'user' as const,
        }

        updateUser(newUser)
        setAuthToken(token)
        setIsLoggedIn(true)

        if (typeof window !== 'undefined') {
          localStorage.setItem('medai-user', JSON.stringify(newUser))
          localStorage.setItem('medai-auth', 'true')
          localStorage.setItem('medai-token', token)
        }
      } else {
        setAuthError(data.error || 'حدث خطأ في إنشاء الحساب')
      }
    } catch (err) {
      setAuthError('حدث خطأ في الاتصال بالخادم')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleAuth = () => {
    if (authMode === 'login') {
      handleLogin()
    } else {
      handleRegister()
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4" dir="rtl">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-neon-cyan/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-neon-purple/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/3 rounded-full blur-3xl" />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(0,245,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,245,255,0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative glass-card p-8 w-full max-w-md"
      >
        <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-cyan-500/20 blur-sm -z-10" />

        {/* Logo */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 15 }}
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-500/30 relative"
          >
            <Heart className="w-10 h-10 text-white" />
            <motion.div
              className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-400 to-purple-500"
              animate={{ opacity: [0, 0.5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            MedAI Academy
          </h1>
          <p className="text-sm text-muted-foreground mt-2">منصة التعليم الطبي الذكي</p>
        </motion.div>

        {/* Auth tabs */}
        <motion.div
          className="flex gap-2 mb-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <button
            onClick={() => { setAuthMode('login'); setAuthError('') }}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300 relative overflow-hidden ${
              authMode === 'login'
                ? 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30 shadow-[0_0_20px_rgba(0,245,255,0.1)]'
                : 'text-muted-foreground hover:text-white border border-transparent hover:border-white/10'
            }`}
          >
            {authMode === 'login' && (
              <motion.div
                layoutId="auth-tab-glow"
                className="absolute inset-0 bg-gradient-to-l from-cyan-500/10 to-transparent"
              />
            )}
            <span className="relative z-10 flex items-center justify-center gap-2">
              <Lock className="w-4 h-4" />
              تسجيل الدخول
            </span>
          </button>
          <button
            onClick={() => { setAuthMode('register'); setAuthError('') }}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300 relative overflow-hidden ${
              authMode === 'register'
                ? 'bg-neon-purple/15 text-neon-purple border border-neon-purple/30 shadow-[0_0_20px_rgba(139,92,246,0.1)]'
                : 'text-muted-foreground hover:text-white border border-transparent hover:border-white/10'
            }`}
          >
            {authMode === 'register' && (
              <motion.div
                layoutId="auth-tab-glow"
                className="absolute inset-0 bg-gradient-to-l from-purple-500/10 to-transparent"
              />
            )}
            <span className="relative z-10 flex items-center justify-center gap-2">
              <UserPlus className="w-4 h-4" />
              إنشاء حساب
            </span>
          </button>
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {authError && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center overflow-hidden"
            >
              {authError}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {/* Name (Register only) */}
          <AnimatePresence>
            {authMode === 'register' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <label className="text-xs text-muted-foreground mb-1.5 block flex items-center gap-1.5">
                  <User className="w-3 h-3" />
                  الاسم
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="أدخل اسمك الكامل"
                    className={`w-full h-11 px-4 rounded-xl bg-med-card/80 border text-white placeholder:text-muted-foreground/50 focus:outline-none text-sm transition-all duration-300 ${
                      focusedField === 'name' ? 'border-neon-purple/50 shadow-[0_0_15px_rgba(139,92,246,0.15)]' : 'border-neon-purple/15'
                    }`}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Phone */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block flex items-center gap-1.5">
              <Phone className="w-3 h-3" />
              الرقم
            </label>
            <div className="relative">
              <input
                type="tel"
                value={authPhone}
                onChange={(e) => setAuthPhone(e.target.value.replace(/[^0-9]/g, ''))}
                onFocus={() => setFocusedField('phone')}
                onBlur={() => setFocusedField(null)}
                placeholder="7XXXXXXXX"
                className={`w-full h-11 px-4 rounded-xl bg-med-card/80 border text-white placeholder:text-muted-foreground/50 focus:outline-none text-sm transition-all duration-300 ${
                  focusedField === 'phone' ? 'border-neon-cyan/50 shadow-[0_0_15px_rgba(0,245,255,0.15)]' : 'border-neon-cyan/15'
                }`}
                dir="ltr"
              />
              {authPhone && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-green-400"
                />
              )}
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block flex items-center gap-1.5">
              <Lock className="w-3 h-3" />
              كلمة السر
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                placeholder="••••••••"
                className={`w-full h-11 px-4 pl-10 rounded-xl bg-med-card/80 border text-white placeholder:text-muted-foreground/50 focus:outline-none text-sm transition-all duration-300 ${
                  focusedField === 'password' ? 'border-neon-cyan/50 shadow-[0_0_15px_rgba(0,245,255,0.15)]' : 'border-neon-cyan/15'
                }`}
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <Button
              onClick={handleAuth}
              disabled={authLoading || (authMode === 'login' ? (!authPhone || !authPassword) : (!authName || !authPhone || !authPassword))}
              className={`w-full h-12 font-bold text-base rounded-xl transition-all duration-300 ${
                authMode === 'login'
                  ? 'bg-gradient-to-l from-neon-cyan to-cyan-400 text-med-dark hover:shadow-[0_0_30px_rgba(0,245,255,0.3)]'
                  : 'bg-gradient-to-l from-neon-purple to-purple-400 text-white hover:shadow-[0_0_30px_rgba(139,92,246,0.3)]'
              }`}
            >
              {authLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
                />
              ) : authMode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب'}
            </Button>
          </motion.div>
        </motion.div>

        <motion.p
          className="text-center text-xs text-muted-foreground mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          بالتسجيل، أنت توافق على شروط الاستخدام وسياسة الخصوصية
        </motion.p>
      </motion.div>
    </div>
  )
}

// =============================================
// Main App Shell
// =============================================
export default function AppShell() {
  const { isLoggedIn, mustChangePassword, setMustChangePassword, user } = useAppStore()

  // Restore session from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && !isLoggedIn) {
      const savedAuth = localStorage.getItem('medai-auth')
      const savedUser = localStorage.getItem('medai-user')
      const savedToken = localStorage.getItem('medai-token')

      if (savedAuth === 'true' && savedUser && savedToken) {
        try {
          const userData = JSON.parse(savedUser)
          useAppStore.getState().updateUser(userData)
          useAppStore.getState().setAuthToken(savedToken)
          useAppStore.getState().setIsLoggedIn(true)
        } catch {
          localStorage.removeItem('medai-user')
          localStorage.removeItem('medai-auth')
          localStorage.removeItem('medai-token')
        }
      }
    }
  }, [])

  // Show change password modal if admin must change password
  if (isLoggedIn && mustChangePassword) {
    return (
      <>
        <ChangePasswordModal
          onComplete={() => {
            setMustChangePassword(false)
          }}
        />
        <div className="min-h-screen bg-background" dir="rtl" />
      </>
    )
  }

  // Show auth screen if not logged in
  if (!isLoggedIn) {
    return <AuthScreen />
  }

  // Admin view - AdminPage now has its own sidebar navigation
  if (user.role === 'admin') {
    return (
      <div className="min-h-screen bg-background text-foreground" dir="rtl">
        <AdminPage />
      </div>
    )
  }

  // User view
  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <UserSidebar />

      <div className="lg:mr-[260px] flex flex-col min-h-screen">
        <MobileHeader />

        <main className="flex-1 pb-20 lg:pb-4">
          <UserPageRenderer />
        </main>
      </div>

      <BottomNav />

      {/* AI Floating Button */}
      <motion.button
        className="fixed bottom-24 lg:bottom-6 left-4 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 shadow-lg shadow-cyan-500/25 flex items-center justify-center group"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => useAppStore.getState().setActivePage('ai-tutor')}
      >
        <Brain className="w-6 h-6 text-white" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-background animate-pulse" />
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 animate-ping opacity-20" />
      </motion.button>
    </div>
  )
}
