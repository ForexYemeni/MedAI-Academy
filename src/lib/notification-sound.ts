// أكاديمية نبض - نظام الإشعارات الصوتية وطلب الأذونات
// يتعامل مع Web Audio API للأصوات داخل التطبيق
// و Push API للإشعارات عند إغلاق التطبيق

// ─── VAPID Public Key ──────────────────────────────────────
export function getVapidPublicKey(): string {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
}

// ─── Browser Notification Support Check ────────────────────
export function browserNotificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function pushApiSupported(): boolean {
  return typeof window !== 'undefined' && 
    'serviceWorker' in navigator && 
    'PushManager' in window
}

// ─── Notification Permission Helpers ───────────────────────
export type NotificationPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported'

export function getNotificationPermission(): NotificationPermissionStatus {
  if (!browserNotificationsSupported()) return 'unsupported'
  return Notification.permission as NotificationPermissionStatus
}

export async function requestNotificationPermission(): Promise<NotificationPermissionStatus> {
  if (!browserNotificationsSupported()) return 'unsupported'
  
  try {
    const permission = await Notification.requestPermission()
    return permission as NotificationPermissionStatus
  } catch (error) {
    console.error('Error requesting notification permission:', error)
    return 'denied'
  }
}

// ─── Push Subscription Management ──────────────────────────
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!pushApiSupported()) {
    console.warn('[Push] Push API not supported')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.ready
    const vapidKey = getVapidPublicKey()
    
    if (!vapidKey) {
      console.error('[Push] VAPID public key not configured')
      return null
    }

    // Check if already subscribed
    const existingSubscription = await registration.pushManager.getSubscription()
    if (existingSubscription) {
      console.log('[Push] Already subscribed, returning existing subscription')
      return existingSubscription
    }

    // Convert VAPID key to Uint8Array
    const applicationServerKey = urlBase64ToUint8Array(vapidKey)

    // Subscribe
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    })

    console.log('[Push] Subscribed successfully')
    return subscription
  } catch (error: any) {
    console.error('[Push] Subscription failed:', error)
    return null
  }
}

export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    if (subscription) {
      await subscription.unsubscribe()
      return true
    }
    return false
  } catch (error) {
    console.error('[Push] Unsubscribe failed:', error)
    return false
  }
}

export async function getPushSubscription(): Promise<PushSubscription | null> {
  try {
    const registration = await navigator.serviceWorker.ready
    return await registration.pushManager.getSubscription()
  } catch (error) {
    return null
  }
}

// ─── Save Push Subscription to Server ──────────────────────
export async function savePushSubscriptionToServer(
  subscription: PushSubscription,
  authToken: string
): Promise<boolean> {
  try {
    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(subscription.toJSON()),
    })
    const data = await res.json()
    return data.success === true
  } catch (error) {
    console.error('[Push] Save subscription failed:', error)
    return false
  }
}

export async function removePushSubscriptionFromServer(
  endpoint: string,
  authToken: string
): Promise<boolean> {
  try {
    const res = await fetch(`/api/push/subscribe?endpoint=${encodeURIComponent(endpoint)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` },
    })
    const data = await res.json()
    return data.success === true
  } catch (error) {
    console.error('[Push] Remove subscription failed:', error)
    return false
  }
}

// ─── Full Setup: Request Permission + Subscribe + Save ─────
export async function setupPushNotifications(authToken: string): Promise<{
  permission: NotificationPermissionStatus
  subscribed: boolean
  error?: string
}> {
  // 1. Check support
  if (!browserNotificationsSupported() || !pushApiSupported()) {
    return { permission: 'unsupported', subscribed: false, error: 'المتصفح لا يدعم الإشعارات' }
  }

  // 2. Ensure Service Worker is ready
  try {
    await navigator.serviceWorker.ready
  } catch (e) {
    return { permission: 'default', subscribed: false, error: 'Service Worker غير جاهز' }
  }

  // 3. Request permission
  const permission = await requestNotificationPermission()
  if (permission !== 'granted') {
    return { permission, subscribed: false, error: 'لم يتم منح إذن الإشعارات' }
  }

  // 4. Subscribe to push
  const subscription = await subscribeToPush()
  if (!subscription) {
    return { permission, subscribed: false, error: 'فشل الاشتراك في الإشعارات' }
  }

  // 5. Save to server
  const saved = await savePushSubscriptionToServer(subscription, authToken)
  if (!saved) {
    return { permission, subscribed: false, error: 'فشل حفظ الاشتراك' }
  }

  // 6. Pre-initialize AudioContext for sound playback
  initAudioContext()

  console.log('[Push] Setup complete - permission:', permission, 'subscribed:', true)
  return { permission, subscribed: true }
}

// ─── Show Browser Notification (when app is open but not focused) ──
export async function showBrowserNotification({
  title,
  body,
  icon = '/icons/icon-192x192.png',
  tag,
  url = '/',
  type = 'info',
}: {
  title: string
  body: string
  icon?: string
  tag?: string
  url?: string
  type?: string
}): Promise<void> {
  if (!browserNotificationsSupported()) return
  if (Notification.permission !== 'granted') return

  // Only show browser notification if the tab is NOT visible
  if (document.visibilityState === 'visible') return

  try {
    const registration = await navigator.serviceWorker.ready
    await registration.showNotification(title, {
      body,
      icon,
      badge: '/icons/icon-72x72.png',
      tag: tag || `nabd-${Date.now()}`,
      dir: 'rtl',
      lang: 'ar',
      silent: false,
      data: { url, type, timestamp: Date.now() },
      vibrate: [200, 100, 200, 100, 200],
    })
  } catch (error) {
    // Fallback to basic Notification API
    try {
      new Notification(title, { body, icon, dir: 'rtl', tag })
    } catch (e) {
      // Silently fail
    }
  }
}

// ─── Web Audio API - Notification Sounds ───────────────────
// These play when the app tab is open/active (even in background)
// When the app is fully closed, the OS plays the default notification sound
// via the Service Worker (silent: false)

let audioContext: AudioContext | null = null
let audioContextResumed = false

// Pre-initialize AudioContext on user interaction
// This ensures sound can play even when the tab is in background
export function initAudioContext() {
  if (typeof window === 'undefined') return
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      console.log('[Audio] AudioContext created, state:', audioContext.state)
    } catch (e) {
      console.warn('[Audio] Failed to initialize AudioContext:', e)
      return
    }
  }
  // Always try to resume
  if (audioContext.state === 'suspended') {
    audioContext.resume().then(() => {
      audioContextResumed = true
      console.log('[Audio] AudioContext resumed')
    }).catch(() => {})
  } else {
    audioContextResumed = true
  }
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioContext) {
    initAudioContext()
  }
  if (audioContext?.state === 'suspended') {
    audioContext.resume().catch(() => {})
  }
  return audioContext
}

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.3) {
  const ctx = getAudioContext()
  if (!ctx) return

  try {
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime)

    gainNode.gain.setValueAtTime(volume, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + duration)
  } catch (e) {
    // Silently fail - AudioContext might be in invalid state
  }
}

// ─── Fallback sound using Audio element (for Safari, mobile, etc.) ───
function playFallbackBeep() {
  try {
    // Create a short beep using a data URI WAV
    const audio = new Audio('data:audio/wav;base64,UklGRl9vT19teleUQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU' + Array(300).fill('123').join('').slice(0, 1000) + '=')
    audio.volume = 0.5
    audio.play().catch(() => {})
  } catch (e) {
    // Ignore
  }
}

// Different sounds for different notification types
export function playNotificationSound(type: string = 'default') {
  if (typeof window === 'undefined') return

  // Check if sound is enabled
  const soundEnabled = localStorage.getItem('medai-notif-sound')
  if (soundEnabled === 'false') return

  const ctx = getAudioContext()

  // If AudioContext is not available or not resumed, try fallback
  if (!ctx || ctx.state !== 'running') {
    console.log('[Audio] AudioContext not running, state:', ctx?.state, '- trying init')
    initAudioContext()
    // Try again after a brief delay
    if (!ctx) {
      // Use fallback beep
      try {
        // Simple beep using OscillatorNode with forced context
        const tempCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
        tempCtx.resume().then(() => {
          const osc = tempCtx.createOscillator()
          const gain = tempCtx.createGain()
          osc.connect(gain)
          gain.connect(tempCtx.destination)
          osc.frequency.value = 800
          gain.gain.value = 0.3
          gain.gain.exponentialRampToValueAtTime(0.01, tempCtx.currentTime + 0.2)
          osc.start(tempCtx.currentTime)
          osc.stop(tempCtx.currentTime + 0.2)
        }).catch(() => {})
      } catch (e) {
        // Final fallback
        playFallbackBeep()
      }
      return
    }
  }

  console.log('[Audio] Playing sound for type:', type)

  switch (type) {
    case 'payment':
      playTone(880, 0.15, 'sine', 0.3)
      setTimeout(() => playTone(1100, 0.15, 'sine', 0.25), 100)
      setTimeout(() => playTone(1320, 0.25, 'sine', 0.2), 200)
      break

    case 'gift':
      playTone(880, 0.1, 'sine', 0.25)
      setTimeout(() => playTone(1047, 0.1, 'sine', 0.2), 80)
      setTimeout(() => playTone(1319, 0.1, 'sine', 0.2), 160)
      setTimeout(() => playTone(1760, 0.2, 'sine', 0.25), 240)
      break

    case 'success':
    case 'enrollment':
    case 'achievement':
      playTone(523, 0.15, 'sine', 0.25)
      setTimeout(() => playTone(659, 0.15, 'sine', 0.25), 120)
      setTimeout(() => playTone(784, 0.3, 'sine', 0.3), 240)
      break

    case 'warning':
      playTone(440, 0.12, 'square', 0.15)
      setTimeout(() => playTone(440, 0.12, 'square', 0.15), 200)
      break

    case 'community':
      playTone(660, 0.12, 'sine', 0.2)
      setTimeout(() => playTone(880, 0.2, 'sine', 0.25), 150)
      break

    case 'simulation':
      playTone(600, 0.08, 'triangle', 0.2)
      setTimeout(() => playTone(700, 0.08, 'triangle', 0.2), 100)
      setTimeout(() => playTone(900, 0.15, 'triangle', 0.25), 200)
      break

    case 'system':
      playTone(523, 0.1, 'sine', 0.2)
      setTimeout(() => playTone(659, 0.15, 'sine', 0.2), 100)
      break

    default:
      playTone(800, 0.15, 'sine', 0.3)
      setTimeout(() => playTone(1000, 0.2, 'sine', 0.25), 120)
      break
  }
}

// ─── Utility ───────────────────────────────────────────────
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
