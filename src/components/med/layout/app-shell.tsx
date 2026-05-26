'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, BookOpen, Brain, Activity, Play, HelpCircle, Users, User, Crown, Shield,
  Menu, X, Search, Bell, Globe, ChevronRight, Sparkles, LogOut, Settings, Award, MessageSquare
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
const SubscriptionPage = dynamic(() => import('@/components/med/pages/subscription-page').then(m => ({ default: m.SubscriptionPage })), { ssr: false })
const AdminPage = dynamic(() => import('@/components/med/pages/admin-page').then(m => ({ default: m.AdminPage })), { ssr: false })

const NAV_ITEMS: Array<{
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
  { id: 'subscription', label: 'الاشتراك', icon: Crown, color: 'text-yellow-400' },
  { id: 'admin', label: 'الإدارة', icon: Shield, color: 'text-orange-400' },
]

const BOTTOM_NAV_ITEMS = NAV_ITEMS.slice(0, 5)

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

function Sidebar() {
  const { activePage, setActivePage, user, notifications, setSidebarOpen } = useAppStore()
  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="hidden lg:flex flex-col w-[260px] h-screen bg-[#060810] border-l border-med-border fixed right-0 top-0 z-40">
      <Logo />
      
      <div className="px-3 mt-2">
        <div className="glass-card p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-sm font-bold">
            أ
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.rankIcon} {user.rankTitle}</p>
          </div>
          <div className="text-xs text-cyan-400 font-bold">Lv.{user.level}</div>
        </div>
      </div>

      {/* XP Bar */}
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
          {NAV_ITEMS.map((item) => {
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

      {/* Bottom Section */}
      <div className="p-3 border-t border-med-border space-y-2">
        <div className="glass-card p-2.5 flex items-center gap-2">
          <div className="text-lg">🔥</div>
          <div className="flex-1">
            <p className="text-xs font-medium">تتابع {user.streak} يوم</p>
            <p className="text-[10px] text-muted-foreground">أعلى: {user.maxStreak} يوم</p>
          </div>
          <div className="text-xs font-bold text-amber-400">{user.coins} 🪙</div>
        </div>
      </div>
    </div>
  )
}

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
              أ
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
            أ
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
          {NAV_ITEMS.map((item) => {
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

function PageRenderer() {
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
    subscription: SubscriptionPage,
    admin: AdminPage,
    auth: HomePage, // fallback
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

export default function AppShell() {
  const { activePage, setActivePage } = useAppStore()

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <Sidebar />
      
      <div className="lg:mr-[260px] flex flex-col min-h-screen">
        <MobileHeader />
        
        <main className="flex-1 pb-20 lg:pb-4">
          <PageRenderer />
        </main>
      </div>

      <BottomNav />

      {/* AI Floating Button */}
      <motion.button
        className="fixed bottom-24 lg:bottom-6 left-4 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 shadow-lg shadow-cyan-500/25 flex items-center justify-center group"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setActivePage('ai-tutor')}
      >
        <Brain className="w-6 h-6 text-white" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-background animate-pulse" />
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 animate-ping opacity-20" />
      </motion.button>
    </div>
  )
}
