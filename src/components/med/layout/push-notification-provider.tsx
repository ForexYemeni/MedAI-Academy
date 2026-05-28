'use client'

import React, { useEffect, useState, useCallback, useRef, createContext, useContext } from 'react'
import { useAppStore } from '@/store/app-store'
import {
  browserNotificationsSupported,
  pushApiSupported,
  getNotificationPermission,
  requestNotificationPermission,
  subscribeToPush,
  savePushSubscriptionToServer,
  getPushSubscription,
  setupPushNotifications,
  playNotificationSound,
  showBrowserNotification,
  initAudioContext,
  type NotificationPermissionStatus,
} from '@/lib/notification-sound'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Shield, Volume2, Smartphone, X } from 'lucide-react'

// ─── Context ───────────────────────────────────────────────
interface PushNotificationContextType {
  permission: NotificationPermissionStatus
  isSubscribed: boolean
  isSettingUp: boolean
  requestPermissionAndSubscribe: () => Promise<void>
  showPermissionPrompt: boolean
  dismissPermissionPrompt: () => void
}

const PushNotificationContext = createContext<PushNotificationContextType>({
  permission: 'default',
  isSubscribed: false,
  isSettingUp: false,
  requestPermissionAndSubscribe: async () => {},
  showPermissionPrompt: false,
  dismissPermissionPrompt: () => {},
})

export const usePushNotifications = () => useContext(PushNotificationContext)

// ─── Provider ──────────────────────────────────────────────
export function PushNotificationProvider({ children }: { children: React.ReactNode }) {
  const [permission, setPermission] = useState<NotificationPermissionStatus>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isSettingUp, setIsSettingUp] = useState(false)
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false)

  const authToken = useAppStore(s => s.authToken)
  const isLoggedIn = useAppStore(s => s.isLoggedIn)
  const addToast = useAppStore(s => s.addToast)
  const addNotification = useAppStore(s => s.addNotification)
  const notifications = useAppStore(s => s.notifications)

  // Track whether initial notification load is done (to avoid playing sounds for old notifications)
  const initialLoadDone = useRef(false)
  // Track last notification count to detect NEW notifications only
  const lastNotifCountRef = useRef(0)
  // Track recently received push tags to prevent duplicate sounds
  const recentPushTags = useRef<Set<string>>(new Set())
  // Track notification IDs we've already played sound for
  const soundPlayedFor = useRef<Set<string>>(new Set())

  // ─── Initialize AudioContext on first user interaction ───
  useEffect(() => {
    if (typeof window === 'undefined') return

    const initOnInteraction = () => {
      initAudioContext()
      // Remove listeners after first interaction
      document.removeEventListener('click', initOnInteraction)
      document.removeEventListener('keydown', initOnInteraction)
      document.removeEventListener('touchstart', initOnInteraction)
    }

    document.addEventListener('click', initOnInteraction, { once: true })
    document.addEventListener('keydown', initOnInteraction, { once: true })
    document.addEventListener('touchstart', initOnInteraction, { once: true })

    return () => {
      document.removeEventListener('click', initOnInteraction)
      document.removeEventListener('keydown', initOnInteraction)
      document.removeEventListener('touchstart', initOnInteraction)
    }
  }, [])

  // ─── Force Service Worker Update ───
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    const updateSW = async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration()
        if (registration) {
          await registration.update()
          console.log('[PushProvider] SW update check done')
        }
      } catch (e) {
        // Ignore
      }
    }
    updateSW()
    // Check for SW updates every 5 minutes
    const interval = setInterval(updateSW, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Check current permission and subscription status
  const checkStatus = useCallback(async () => {
    if (!browserNotificationsSupported()) {
      setPermission('unsupported')
      return
    }

    const currentPermission = getNotificationPermission()
    setPermission(currentPermission)

    if (currentPermission === 'granted' && pushApiSupported()) {
      try {
        const sub = await getPushSubscription()
        setIsSubscribed(!!sub)
      } catch {
        setIsSubscribed(false)
      }
    }
  }, [])

  // Request permission and subscribe
  const requestPermissionAndSubscribe = useCallback(async () => {
    if (!authToken) return
    setIsSettingUp(true)

    try {
      const result = await setupPushNotifications(authToken)
      setPermission(result.permission)
      setIsSubscribed(result.subscribed)

      if (result.subscribed) {
        addToast({
          id: `push-success-${Date.now()}`,
          title: 'الإشعارات مفعّلة',
          message: 'ستتلقى إشعارات فورية حتى عند إغلاق التطبيق',
          type: 'success',
        })
      } else if (result.error) {
        addToast({
          id: `push-error-${Date.now()}`,
          title: 'تنبيه الإشعارات',
          message: result.error,
          type: 'warning',
        })
      }
    } catch (error) {
      console.error('Push setup error:', error)
    } finally {
      setIsSettingUp(false)
      setShowPermissionPrompt(false)
    }
  }, [authToken, addToast])

  const dismissPermissionPrompt = useCallback(() => {
    setShowPermissionPrompt(false)
    localStorage.setItem('medai-notif-prompt-dismissed', 'true')
  }, [])

  // ─── On login: check status, fetch notifications, auto-subscribe ───
  useEffect(() => {
    if (!isLoggedIn || !authToken) return

    checkStatus()

    // Show permission prompt after a delay if not yet granted
    const timer = setTimeout(() => {
      if (!browserNotificationsSupported()) return

      const currentPermission = getNotificationPermission()
      const dismissed = localStorage.getItem('medai-notif-prompt-dismissed')

      if (currentPermission === 'default' && !dismissed) {
        setShowPermissionPrompt(true)
      } else if (currentPermission === 'granted' && pushApiSupported()) {
        // Always re-subscribe to ensure VAPID key matches (handles key rotation)
        const token = useAppStore.getState().authToken
        if (token) {
          setupPushNotifications(token).then(result => {
            setPermission(result.permission)
            setIsSubscribed(result.subscribed)
            console.log('[PushProvider] Auto-subscribe result:', result.subscribed)
          }).catch(err => {
            console.warn('[PushProvider] Auto-subscribe failed:', err)
          })
        }
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [isLoggedIn, authToken, checkStatus])

  // ─── Fetch notifications from API on login + auto-refresh ───
  useEffect(() => {
    if (!isLoggedIn || !authToken) return

    // Fetch notifications immediately on login
    const fetchNotifs = async () => {
      const token = useAppStore.getState().authToken
      if (!token) return
      try {
        const res = await fetch('/api/notifications', {
          headers: { Authorization: `Bearer ${token}` }
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

          // Mark initial load as done AFTER first fetch
          if (!initialLoadDone.current) {
            initialLoadDone.current = true
            lastNotifCountRef.current = mapped.length
            // Add all existing notification IDs to soundPlayedFor to avoid replaying
            mapped.forEach((n: any) => soundPlayedFor.current.add(n.id))
          }
        }
      } catch (e) { /* ignore */ }
    }

    fetchNotifs()

    // Auto-refresh every 5 seconds
    const interval = setInterval(fetchNotifs, 5000)
    return () => clearInterval(interval)
  }, [isLoggedIn, authToken])

  // ─── Listen for PUSH_NOTIFICATION_RECEIVED from Service Worker ───
  // This handles push notifications received while the app is open (foreground or background tab)
  useEffect(() => {
    if (!pushApiSupported()) return

    const handleMessage = (event: MessageEvent) => {
      // ─── Push notification received via SW ───
      if (event.data?.type === 'PUSH_NOTIFICATION_RECEIVED') {
        const { title, body, type, url, tag, sound, timestamp } = event.data.payload || {}

        console.log('[PushProvider] Push received:', type, title)

        // Prevent duplicate sounds for same tag
        const pushTag = tag || `push-${Date.now()}`
        if (recentPushTags.current.has(pushTag)) return
        recentPushTags.current.add(pushTag)
        setTimeout(() => recentPushTags.current.delete(pushTag), 15000)

        // 1. Play custom notification sound IMMEDIATELY
        if (sound !== false) {
          playNotificationSound(type || 'default')
        }

        // 2. Add notification to store IMMEDIATELY (optimistic - no API wait)
        const storeState = useAppStore.getState()
        const existingNotif = storeState.notifications.find(
          n => n.title === title && n.message === body
        )

        if (!existingNotif) {
          const optimisticId = `push-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

          useAppStore.getState().addNotification({
            id: optimisticId,
            title: title || '',
            message: body || '',
            type: (type || 'info') as any,
            read: false,
            timestamp: timestamp || Date.now(),
            link: url || '',
            category: type || 'info',
          })

          // Show toast popup for the notification
          useAppStore.getState().addToast({
            id: optimisticId,
            title: title || '',
            message: body || '',
            type: (type || 'info') as any,
          })

          // Mark this ID as sound-played so the polling fallback doesn't replay it
          soundPlayedFor.current.add(optimisticId)
        }

        // 3. Sync with server in background
        const token = storeState.authToken
        if (token) {
          setTimeout(() => {
            fetch('/api/notifications', {
              headers: { Authorization: `Bearer ${token}` }
            })
              .then(r => r.json())
              .then(data => {
                if (data.success && data.notifications) {
                  const mapped = data.notifications.map((n: any) => ({
                    id: n._id || n.id,
                    title: n.title || '',
                    message: n.message || '',
                    type: n.type || 'info',
                    read: n.read || false,
                    timestamp: new Date(n.createdAt).getTime(),
                    link: n.link || '',
                    category: n.category || n.type || '',
                    icon: n.icon || '',
                  }))
                  useAppStore.getState().setNotifications(mapped)
                }
              })
              .catch(() => {})
          }, 500)
        }
      }

      // ─── Notification click from SW ───
      if (event.data?.type === 'NOTIFICATION_CLICK') {
        const { url, notifType } = event.data
        const pageMap: Record<string, string> = {
          payment: 'subscriptions',
          gift: 'subscriptions',
          enrollment: 'courses',
          community: 'community',
          simulation: 'simulation',
          achievement: 'profile',
          courses: 'courses',
          quizzes: 'quizzes',
        }

        if (notifType && pageMap[notifType]) {
          useAppStore.getState().setActivePage(pageMap[notifType] as any)
        } else if (url) {
          for (const [key, pageId] of Object.entries(pageMap)) {
            if (url.includes(key)) {
              useAppStore.getState().setActivePage(pageId as any)
              break
            }
          }
        }
      }

      // ─── Push subscription changed ───
      if (event.data?.type === 'PUSH_SUBSCRIPTION_CHANGED') {
        if (authToken && getNotificationPermission() === 'granted') {
          subscribeToPush().then(sub => {
            if (sub) {
              savePushSubscriptionToServer(sub, authToken).then(() => {
                setIsSubscribed(true)
              })
            }
          })
        }
      }
    }

    navigator.serviceWorker?.addEventListener('message', handleMessage)
    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleMessage)
    }
  }, [authToken])

  // ─── Sound fallback: Play sound when new notifications arrive via polling ───
  // This catches notifications that weren't received via push
  useEffect(() => {
    if (!initialLoadDone.current) return // Don't play sounds before initial load
    if (notifications.length === 0) return

    // Detect new unread notifications that we haven't played sound for
    const newUnread = notifications.filter(n => !n.read && !soundPlayedFor.current.has(n.id))

    if (newUnread.length === 0) return

    // Play sound for the latest new notification
    const latest = newUnread[0]
    const tag = latest.id

    // Skip if already handled by push handler
    if (recentPushTags.current.has(tag)) return

    // Mark as sound-played
    soundPlayedFor.current.add(latest.id)

    // Play in-app sound
    playNotificationSound(latest.type)

    // Show toast popup for the notification
    useAppStore.getState().addToast({
      id: latest.id,
      title: latest.title,
      message: latest.message,
      type: latest.type,
    })

    // Show browser notification if tab is not focused
    if (document.visibilityState !== 'visible') {
      showBrowserNotification({
        title: latest.title,
        body: latest.message,
        type: latest.type,
        url: latest.link || '/',
        tag: latest.id,
      })
    }
  }, [notifications])

  // Clean up old soundPlayedFor entries periodically (keep set from growing infinitely)
  useEffect(() => {
    const cleanup = setInterval(() => {
      if (soundPlayedFor.current.size > 500) {
        // Keep only the last 200 entries
        const entries = Array.from(soundPlayedFor.current)
        soundPlayedFor.current = new Set(entries.slice(-200))
      }
    }, 60000)
    return () => clearInterval(cleanup)
  }, [])

  return (
    <PushNotificationContext.Provider
      value={{
        permission,
        isSubscribed,
        isSettingUp,
        requestPermissionAndSubscribe,
        showPermissionPrompt,
        dismissPermissionPrompt,
      }}
    >
      {children}

      {/* Permission Request Modal */}
      <AnimatePresence>
        {showPermissionPrompt && (
          <PermissionRequestModal
            onAllow={requestPermissionAndSubscribe}
            onDismiss={dismissPermissionPrompt}
            isSettingUp={isSettingUp}
          />
        )}
      </AnimatePresence>
    </PushNotificationContext.Provider>
  )
}

// ─── Permission Request Modal ──────────────────────────────
function PermissionRequestModal({
  onAllow,
  onDismiss,
  isSettingUp,
}: {
  onAllow: () => void
  onDismiss: () => void
  isSettingUp: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      dir="rtl"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="relative w-full max-w-md mx-4 rounded-2xl bg-gradient-to-b from-card/95 to-card/90 border border-neon-cyan/20 shadow-2xl shadow-black/40 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-neon-cyan/5 via-transparent to-neon-purple/5 pointer-events-none" />

        <button
          onClick={onDismiss}
          className="absolute top-3 left-3 w-8 h-8 rounded-xl bg-muted/30 hover:bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="relative p-6">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 border border-neon-cyan/30 flex items-center justify-center mx-auto mb-4"
          >
            <Bell className="w-8 h-8 text-neon-cyan" />
          </motion.div>

          <h3 className="text-xl font-bold text-foreground text-center mb-2">
            فعّل الإشعارات الفورية
          </h3>
          <p className="text-sm text-muted-foreground text-center mb-6">
            احصل على إشعارات صوتية فورية حتى عند إغلاق التطبيق
          </p>

          <div className="space-y-3 mb-6">
            {[
              { icon: Volume2, text: 'إشعارات صوتية فورية', desc: 'صوت مختلف لكل نوع إشعار' },
              { icon: Smartphone, text: 'يعمل حتى بإغلاق التطبيق', desc: 'Push notifications عبر المتصفح' },
              { icon: Shield, text: 'خصوصية كاملة', desc: 'يمكنك إيقافها في أي وقت' },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * i }}
                className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/50"
              >
                <div className="w-9 h-9 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-4 h-4 text-neon-cyan" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{feature.text}</p>
                  <p className="text-[11px] text-muted-foreground">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onDismiss}
              disabled={isSettingUp}
              className="flex-1 py-3 px-4 rounded-xl bg-muted/30 border border-border hover:bg-muted/50 text-muted-foreground text-sm font-medium transition-all disabled:opacity-50"
            >
              لاحقاً
            </button>
            <button
              onClick={onAllow}
              disabled={isSettingUp}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-l from-neon-cyan to-cyan-500 hover:from-neon-cyan/90 hover:to-cyan-500/90 text-white text-sm font-bold transition-all disabled:opacity-50 shadow-lg shadow-neon-cyan/20"
            >
              {isSettingUp ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  جاري التفعيل...
                </span>
              ) : (
                'تفعيل الإشعارات'
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
