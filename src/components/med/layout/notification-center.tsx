'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, CheckCircle2, X, Trash2, CheckCheck, Filter,
  CreditCard, Gift, Users, Activity, BookOpen, Award,
  AlertTriangle, Info, Sparkles, Settings, ChevronDown,
  Volume2, VolumeX, ShoppingBag, BellRing, ShieldAlert, Smartphone
} from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { usePushNotifications } from '@/components/med/layout/push-notification-provider'

// ─── Notification Type Config ────────────────────────────────

const typeConfig: Record<string, {
  label: string
  color: string
  bgColor: string
  borderColor: string
  icon: React.ElementType
  gradient: string
}> = {
  payment: {
    label: 'مدفوعات',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
    icon: CreditCard,
    gradient: 'from-amber-500/20 to-orange-500/10',
  },
  gift: {
    label: 'هدايا',
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/20',
    icon: Gift,
    gradient: 'from-pink-500/20 to-rose-500/10',
  },
  community: {
    label: 'مجتمع',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
    icon: Users,
    gradient: 'from-green-500/20 to-emerald-500/10',
  },
  simulation: {
    label: 'محاكاة',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
    icon: Activity,
    gradient: 'from-red-500/20 to-orange-500/10',
  },
  enrollment: {
    label: 'تسجيل',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    icon: BookOpen,
    gradient: 'from-blue-500/20 to-cyan-500/10',
  },
  achievement: {
    label: 'إنجاز',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
    icon: Award,
    gradient: 'from-purple-500/20 to-violet-500/10',
  },
  success: {
    label: 'نجاح',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
    icon: CheckCircle2,
    gradient: 'from-emerald-500/20 to-green-500/10',
  },
  warning: {
    label: 'تحذير',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
    icon: AlertTriangle,
    gradient: 'from-amber-500/20 to-yellow-500/10',
  },
  info: {
    label: 'معلومات',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/20',
    icon: Info,
    gradient: 'from-cyan-500/20 to-blue-500/10',
  },
  system: {
    label: 'نظام',
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/10',
    borderColor: 'border-slate-500/20',
    icon: Settings,
    gradient: 'from-slate-500/20 to-gray-500/10',
  },
}

function getTypeConfig(type: string) {
  return typeConfig[type] || typeConfig.info
}

// ─── Time Ago Helper ────────────────────────────────────────

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

// ─── Toast Notification Component ────────────────────────────

interface ToastNotificationProps {
  id: string
  title: string
  message: string
  type: string
  onClose: () => void
  onClick?: () => void
}

export function NotificationToast({ id, title, message, type, onClose, onClick }: ToastNotificationProps) {
  const config = getTypeConfig(type)
  const Icon = config.icon

  useEffect(() => {
    const timer = setTimeout(onClose, 5000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      onClick={onClick}
      className={`relative overflow-hidden rounded-xl border ${config.borderColor} bg-gradient-to-l ${config.gradient} backdrop-blur-xl shadow-2xl shadow-black/30 cursor-pointer max-w-sm w-full`}
      dir="rtl"
    >
      {/* Animated progress bar */}
      <motion.div
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: 5, ease: 'linear' }}
        className={`absolute bottom-0 right-0 h-0.5 ${config.color.replace('text-', 'bg-')}`}
      />
      
      <div className="p-4 flex items-start gap-3">
        {/* Icon with pulse */}
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: 2, duration: 0.5 }}
          className={`flex-shrink-0 w-10 h-10 rounded-xl ${config.bgColor} border ${config.borderColor} flex items-center justify-center`}
        >
          <Icon className={`w-5 h-5 ${config.color}`} />
        </motion.div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{message}</p>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onClose() }}
          className="flex-shrink-0 w-6 h-6 rounded-lg hover:bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  )
}

// ─── Toast Container ─────────────────────────────────────────

export function NotificationToastContainer() {
  const toasts = useAppStore(s => s._toastNotifications)
  
  return (
    <div className="fixed top-4 left-4 z-[200] flex flex-col gap-2 pointer-events-none" dir="rtl">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <NotificationToast
              id={toast.id}
              title={toast.title}
              message={toast.message}
              type={toast.type}
              onClose={() => useAppStore.getState().removeToast(toast.id)}
              onClick={toast.onClick}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// ─── Notification Item ───────────────────────────────────────

function NotificationItem({
  notification,
  onMarkRead,
  onDelete,
  onClick,
}: {
  notification: any
  onMarkRead: (id: string) => void
  onDelete: (id: string) => void
  onClick: (n: any) => void
}) {
  const config = getTypeConfig(notification.type)
  const Icon = config.icon

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -50, height: 0 }}
      className={`relative group rounded-xl transition-all ${
        !notification.read
          ? `bg-gradient-to-l ${config.gradient} border ${config.borderColor}`
          : 'bg-muted/20 border border-transparent'
      }`}
    >
      {/* Unread indicator */}
      {!notification.read && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-l-full bg-gradient-to-b from-neon-cyan to-neon-purple" />
      )}

      <div
        className="flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/20 transition-colors rounded-xl"
        onClick={() => {
          if (!notification.read) onMarkRead(notification.id)
          onClick(notification)
        }}
      >
        {/* Type icon */}
        <div className={`flex-shrink-0 w-9 h-9 rounded-xl ${config.bgColor} border ${config.borderColor} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${config.color}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className={`text-xs font-bold ${!notification.read ? 'text-foreground' : 'text-foreground/60'}`}>
              {notification.title}
            </p>
            <Badge className={`text-[8px] px-1.5 py-0 ${config.bgColor} ${config.color} border ${config.borderColor}`}>
              {config.label}
            </Badge>
          </div>
          <p className={`text-[11px] leading-5 line-clamp-2 ${!notification.read ? 'text-foreground/70' : 'text-foreground/40'}`}>
            {notification.message}
          </p>
          <p className="text-[9px] text-muted-foreground/50 mt-1">
            {timeAgo(notification.timestamp)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(notification.id) }}
            className="w-6 h-6 rounded-lg hover:bg-red-500/20 flex items-center justify-center text-muted-foreground hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Notification Bell with Badge ────────────────────────────

export function NotificationBell() {
  const unreadCount = useAppStore(s => s.unreadNotificationCount)
  const [isOpen, setIsOpen] = useState(false)
  const [animate, setAnimate] = useState(false)
  const { permission, isSubscribed } = usePushNotifications()

  // Animate bell when new notifications arrive
  useEffect(() => {
    if (unreadCount > 0) {
      setAnimate(true)
      const timer = setTimeout(() => setAnimate(false), 1000)
      return () => clearTimeout(timer)
    }
  }, [unreadCount])

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover:bg-muted">
          <motion.div
            animate={animate ? { rotate: [0, 15, -15, 15, -10, 0] } : {}}
            transition={{ duration: 0.5 }}
          >
            {isSubscribed ? (
              <BellRing className="w-5 h-5 text-neon-cyan" />
            ) : (
              <Bell className="w-5 h-5" />
            )}
          </motion.div>
          
          {/* Unread count badge */}
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-gradient-to-br from-red-500 to-red-600 text-[9px] text-white font-bold flex items-center justify-center px-1 shadow-lg shadow-red-500/30"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}

          {/* Push notification indicator dot */}
          {isSubscribed && (
            <span className="absolute -bottom-0.5 -left-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-background" />
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-96 bg-popover/95 backdrop-blur-xl border-border shadow-2xl shadow-black/30 p-0" align="end" sideOffset={8}>
        <NotificationCenterPanel onClose={() => setIsOpen(false)} />
      </PopoverContent>
    </Popover>
  )
}

// ─── Notification Center Panel ───────────────────────────────

function NotificationCenterPanel({ onClose }: { onClose: () => void }) {
  const notifications = useAppStore(s => s.notifications)
  const unreadCount = useAppStore(s => s.unreadNotificationCount)
  const unreadByCategory = useAppStore(s => s.unreadByCategory)
  const markNotificationRead = useAppStore(s => s.markNotificationRead)
  const markAllNotificationsRead = useAppStore(s => s.markAllNotificationsRead)
  const deleteNotification = useAppStore(s => s.deleteNotification)
  const clearAllNotifications = useAppStore(s => s.clearAllNotifications)
  const setActivePage = useAppStore(s => s.setActivePage)
  const authToken = useAppStore(s => s.authToken)
  
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [loading, setLoading] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)

  const { permission, isSubscribed, isSettingUp, requestPermissionAndSubscribe } = usePushNotifications()

  // Load sound preference
  useEffect(() => {
    const saved = localStorage.getItem('medai-notif-sound')
    setSoundEnabled(saved !== 'false')
  }, [])

  const toggleSound = () => {
    const newState = !soundEnabled
    setSoundEnabled(newState)
    localStorage.setItem('medai-notif-sound', String(newState))
  }

  // Fetch from API
  const fetchNotifications = useCallback(async () => {
    if (!authToken) return
    try {
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      const data = await res.json()
      if (data.success && data.notifications) {
        const mapped = data.notifications.map((n: any) => ({
          id: n._id || n.id,
          title: n.title || '',
          message: n.message || '',
          type: n.type || 'info',
          read: n.read || false,
          timestamp: new Date(n.createdAt).getTime(),
          link: n.link || n.actionUrl || '',
          category: n.category || n.type || '',
          icon: n.icon || '',
        }))
        useAppStore.getState().setNotifications(mapped)
      }
    } catch (e) { /* fallback to store notifications */ }
  }, [authToken])

  // Fetch notifications once when panel opens (PushNotificationProvider handles polling every 5s)
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

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

  const handleDelete = async (id: string) => {
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

  const handleNotificationClick = (n: any) => {
    // Navigate based on notification type/link
    if (n.link) {
      const pageMap: Record<string, any> = {
        'courses': 'courses',
        'course': 'courses',
        'community': 'community',
        'simulation': 'simulation',
        'quizzes': 'quizzes',
        'profile': 'profile',
        'subscriptions': 'subscriptions',
        'admin': 'admin',
      }
      
      // Check if link is a pageId
      for (const [key, pageId] of Object.entries(pageMap)) {
        if (n.link.includes(key)) {
          setActivePage(pageId as any)
          onClose()
          return
        }
      }
    }
    
    // Navigate based on type
    const typeToPage: Record<string, string> = {
      payment: 'subscriptions',
      gift: 'subscriptions',
      enrollment: 'courses',
      community: 'community',
      simulation: 'simulation',
      achievement: 'profile',
    }
    
    const targetPage = typeToPage[n.type]
    if (targetPage) {
      setActivePage(targetPage as any)
      onClose()
    }
  }

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    if (activeFilter === 'all') return notifications
    if (activeFilter === 'unread') return notifications.filter(n => !n.read)
    return notifications.filter(n => n.type === activeFilter)
  }, [notifications, activeFilter])

  // Category filters with counts
  const filterCategories = useMemo(() => {
    const cats: Array<{ id: string; label: string; count: number; color: string }> = [
      { id: 'all', label: 'الكل', count: notifications.length, color: 'text-foreground' },
      { id: 'unread', label: 'غير مقروء', count: unreadCount, color: 'text-neon-cyan' },
    ]
    
    // Add categories that have notifications
    const typeCounts: Record<string, number> = {}
    notifications.forEach(n => {
      typeCounts[n.type] = (typeCounts[n.type] || 0) + 1
    })
    
    for (const [type, count] of Object.entries(typeCounts)) {
      const config = getTypeConfig(type)
      cats.push({ id: type, label: config.label, count, color: config.color })
    }
    
    return cats
  }, [notifications, unreadCount])

  return (
    <div className="flex flex-col max-h-[70vh]" dir="rtl">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 border border-neon-cyan/20 flex items-center justify-center">
              <Bell className="w-4 h-4 text-neon-cyan" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">مركز الإشعارات</h3>
              {unreadCount > 0 && (
                <p className="text-[10px] text-muted-foreground">{unreadCount} إشعار جديد</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* Sound toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSound}
              className="text-muted-foreground hover:text-foreground h-7 w-7 p-0"
              title={soundEnabled ? 'إيقاف الصوت' : 'تشغيل الصوت'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </Button>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllRead}
                className="text-[10px] text-neon-cyan hover:text-neon-cyan h-7 px-2"
              >
                <CheckCheck className="w-3.5 h-3.5 ml-1" />
                تحديد الكل
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="text-[10px] text-red-400 hover:text-red-400 h-7 px-2"
              >
                <Trash2 className="w-3.5 h-3.5 ml-1" />
                حذف الكل
              </Button>
            )}
          </div>
        </div>

        {/* Push Notification Permission Status */}
        <PushPermissionStatus
          permission={permission}
          isSubscribed={isSubscribed}
          isSettingUp={isSettingUp}
          onRequestPermission={requestPermissionAndSubscribe}
        />

        {/* Category filter tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none mt-3">
          {filterCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveFilter(cat.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium whitespace-nowrap transition-all ${
                activeFilter === cat.id
                  ? 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/25'
                  : 'bg-muted/30 text-muted-foreground border border-transparent hover:bg-muted/50'
              }`}
            >
              {cat.label}
              {cat.count > 0 && (
                <span className={`min-w-[16px] h-4 rounded-full text-[8px] font-bold flex items-center justify-center px-1 ${
                  activeFilter === cat.id ? 'bg-neon-cyan/20 text-neon-cyan' : 'bg-muted/50 text-muted-foreground'
                }`}>
                  {cat.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1.5">
          <AnimatePresence mode="popLayout">
            {filteredNotifications.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-10"
              >
                <div className="w-14 h-14 rounded-2xl bg-muted/20 border border-border flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-7 h-7 text-muted-foreground/30" />
                </div>
                <p className="text-sm text-muted-foreground">لا توجد إشعارات</p>
                <p className="text-[10px] text-muted-foreground/50 mt-1">
                  {activeFilter !== 'all' ? 'جرّب فلتراً آخر' : 'ستظهر هنا الإشعارات الجديدة'}
                </p>
              </motion.div>
            ) : (
              filteredNotifications.slice(0, 30).map(n => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onMarkRead={handleMarkRead}
                  onDelete={handleDelete}
                  onClick={handleNotificationClick}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* Footer with category summary */}
      {unreadCount > 0 && (
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-2 flex-wrap">
            {Object.entries(unreadByCategory).map(([cat, count]) => {
              const config = getTypeConfig(cat)
              const CatIcon = config.icon
              return (
                <div key={cat} className={`flex items-center gap-1 px-2 py-1 rounded-lg ${config.bgColor} border ${config.borderColor}`}>
                  <CatIcon className={`w-3 h-3 ${config.color}`} />
                  <span className={`text-[9px] font-bold ${config.color}`}>{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Push Permission Status Component ──────────────────────

function PushPermissionStatus({
  permission,
  isSubscribed,
  isSettingUp,
  onRequestPermission,
}: {
  permission: string
  isSubscribed: boolean
  isSettingUp: boolean
  onRequestPermission: () => void
}) {
  if (permission === 'unsupported') {
    return (
      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
        <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0" />
        <p className="text-[10px] text-amber-300">المتصفح لا يدعم الإشعارات الفورية</p>
      </div>
    )
  }

  if (permission === 'granted' && isSubscribed) {
    return (
      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-green-500/10 border border-green-500/20">
        <Smartphone className="w-4 h-4 text-green-400 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-[10px] text-green-300 font-medium">الإشعارات الفورية مفعّلة</p>
          <p className="text-[9px] text-green-400/60">ستتلقى إشعارات صوتية حتى عند إغلاق التطبيق</p>
        </div>
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
      </div>
    )
  }

  if (permission === 'denied') {
    return (
      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
        <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-[10px] text-red-300 font-medium">الإشعارات محظورة</p>
          <p className="text-[9px] text-red-400/60">يرجى تفعيل الإشعارات من إعدادات المتصفح</p>
        </div>
      </div>
    )
  }

  // Not yet granted - show activation button
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onRequestPermission}
      disabled={isSettingUp}
      className="w-full flex items-center gap-3 p-3 rounded-xl bg-gradient-to-l from-neon-cyan/15 to-neon-purple/10 border border-neon-cyan/25 hover:border-neon-cyan/40 transition-all disabled:opacity-50"
    >
      <div className="w-9 h-9 rounded-xl bg-neon-cyan/15 border border-neon-cyan/30 flex items-center justify-center flex-shrink-0">
        {isSettingUp ? (
          <span className="w-4 h-4 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
        ) : (
          <BellRing className="w-4 h-4 text-neon-cyan" />
        )}
      </div>
      <div className="flex-1 text-right">
        <p className="text-xs font-bold text-neon-cyan">فعّل الإشعارات الصوتية</p>
        <p className="text-[10px] text-muted-foreground">احصل على إشعارات فورية حتى بإغلاق التطبيق</p>
      </div>
      <ChevronDown className="w-4 h-4 text-muted-foreground rotate-[-90deg]" />
    </motion.button>
  )
}

// ─── Admin Notification Badge (for sidebar) ─────────────────

export function AdminNotificationBadge({ category }: { category: string }) {
  const unreadByCategory = useAppStore(s => s.unreadByCategory)
  const count = unreadByCategory[category] || 0
  
  if (count === 0) return null
  
  const config = getTypeConfig(category)
  
  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={`min-w-[18px] h-[18px] rounded-full text-[9px] font-bold flex items-center justify-center px-1 ${config.bgColor} ${config.color} border ${config.borderColor}`}
    >
      {count > 99 ? '99+' : count}
    </motion.span>
  )
}
