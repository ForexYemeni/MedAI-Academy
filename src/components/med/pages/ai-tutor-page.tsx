'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  Mic,
  MicOff,
  Trash2,
  Globe,
  Brain,
  Sparkles,
  BookOpen,
  FlaskConical,
  Hospital,
  BookText,
  Layers,
  CalendarDays,
  MessageCircle,
  TrendingUp,
  Target,
  BarChart3,
  Zap,
  Clock,
  Crown,
  AlertCircle,
  X,
  Lock,
  CreditCard,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

// ─── Subscription Plans ────────────────────────────────────────────────────────
const SUBSCRIPTION_PLANS = [
  { id: 'weekly', name: 'أسبوعي', duration: '7 أيام', price: 'رمزي', icon: '⚡', color: 'neon-cyan' },
  { id: 'monthly', name: 'شهري', duration: '30 يوم', price: 'رمزي', icon: '🌟', color: 'neon-purple' },
  { id: 'lifetime', name: 'مدى الحياة', duration: 'للأبد', price: 'رمزي', icon: '👑', color: 'neon-orange' },
] as const

// ─── Quick Action Chips ──────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { id: 'summarize', label: '📋 تلخيص درس', icon: BookOpen, prompt: 'لخص لي أهم النقاط في درس طب الطوارئ' },
  { id: 'quiz', label: '🧪 اختبار سريع', icon: FlaskConical, prompt: 'أعطني اختبار سريع من 5 أسئلة في أمراض القلب' },
  { id: 'case', label: '🏥 حالة سريرية', icon: Hospital, prompt: 'اعرض لي حالة سريرية في طب الطوارئ مع التشخيص التفريقي' },
  { id: 'explain', label: '📖 شرح مبسط', icon: BookText, prompt: 'اشرح لي نظام ABC في تقييم المريض بطريقة مبسطة' },
  { id: 'flashcards', label: '🗂️ بطاقات مراجعة', icon: Layers, prompt: 'أنشئ لي 5 بطاقات مراجعة عن أدوية الطوارئ' },
  { id: 'plan', label: '📅 خطة تعلم', icon: CalendarDays, prompt: 'ضع لي خطة تعلم لمدة شهر في أمراض القلب' },
  { id: 'dialect', label: '💬 شرح باللهجة', icon: MessageCircle, prompt: 'اشرح لي آلية عمل القلب باللهجة العامية' },
]

// ─── Formatting Helper ───────────────────────────────────────────────────────

function formatAIText(text: string) {
  const lines = text.split('\n')
  return lines.map((line, i) => {
    let formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-neon-cyan font-bold">$1</strong>')
    formatted = formatted.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')

    if (line.startsWith('🚨') || line.startsWith('🚫') || line.startsWith('⚠️') || line.startsWith('🔒')) {
      return (
        <div key={i} className="text-red-400 font-semibold my-1" dangerouslySetInnerHTML={{ __html: formatted }} />
      )
    }
    if (line.startsWith('📌') || line.startsWith('💡') || line.startsWith('🎯') || line.startsWith('⚡') || line.startsWith('🔑')) {
      return (
        <div key={i} className="text-neon-cyan font-semibold my-1" dangerouslySetInnerHTML={{ __html: formatted }} />
      )
    }
    if (line.startsWith('✅') || line.startsWith('🔄') || line.startsWith('⬜')) {
      return (
        <div key={i} className="my-0.5 mr-2" dangerouslySetInnerHTML={{ __html: formatted }} />
      )
    }
    if (line.trim() === '') {
      return <div key={i} className="h-2" />
    }
    return (
      <div key={i} className="my-0.5" dangerouslySetInnerHTML={{ __html: formatted }} />
    )
  })
}

// ─── Typing Indicator ────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-start gap-3 mb-4"
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-neon-purple to-neon-blue flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.3)]">
        <Brain className="w-4 h-4 text-white" />
      </div>
      <div className="glass-card px-4 py-3 max-w-[80%]">
        <div className="flex gap-1.5 items-center">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-neon-purple"
              animate={{ y: [0, -8, 0], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Subscription Modal ───────────────────────────────────────────────────────

function SubscriptionModal({
  open,
  onClose,
  authToken,
  userPhone,
}: {
  open: boolean
  onClose: () => void
  authToken: string | null
  userPhone: string
}) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState('')
  const [paymentPhone, setPaymentPhone] = useState(userPhone)
  const [paymentNote, setPaymentNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleSubmit = async () => {
    if (!selectedPlan || !paymentMethod || !paymentPhone) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/ai/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          plan: selectedPlan,
          paymentMethod,
          paymentPhone,
          paymentNote,
        }),
      })
      const data = await res.json()
      setResult({
        success: data.success,
        message: data.message || data.error || 'حدث خطأ',
      })
    } catch {
      setResult({ success: false, message: 'فشل الاتصال بالخادم' })
    }
    setSubmitting(false)
  }

  if (!open) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass-card w-full max-w-md p-6 rounded-2xl border border-neon-purple/20 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Crown className="w-5 h-5 text-neon-purple" />
            اشترك في المساعد الذكي
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {result ? (
          <div className={`p-4 rounded-lg text-center ${result.success ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
            <span className="text-3xl">{result.success ? '🎉' : '❌'}</span>
            <p className="mt-2 text-sm font-bold">{result.message}</p>
            {result.success && (
              <p className="text-xs text-muted-foreground mt-1">سيتم تفعيل اشتراكك بعد مراجعة الإدارة</p>
            )}
            <Button onClick={onClose} className="mt-3 bg-gradient-to-r from-neon-cyan to-neon-blue text-white h-9">
              حسناً
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Plans */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">اختر الخطة:</p>
              {SUBSCRIPTION_PLANS.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`w-full p-3 rounded-xl border text-right transition-all ${
                    selectedPlan === plan.id
                      ? `border-${plan.color}/50 bg-${plan.color}/10`
                      : 'border-border bg-muted/20 hover:bg-muted/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{plan.icon}</span>
                      <div>
                        <p className="text-sm font-bold">{plan.name}</p>
                        <p className="text-[10px] text-muted-foreground">{plan.duration}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-neon-cyan">{plan.price}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Payment Info */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">طريقة الدفع:</p>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full h-10 rounded-lg border border-border bg-muted/30 px-3 text-sm outline-none focus:border-neon-cyan/50"
              >
                <option value="">اختر طريقة الدفع</option>
                <option value="zain">زين كاش</option>
                <option value="mtc">MTC</option>
                <option value="bank">تحويل بنكي</option>
                <option value="other">أخرى</option>
              </select>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">رقم هاتف الدفع:</p>
              <input
                type="tel"
                value={paymentPhone}
                onChange={(e) => setPaymentPhone(e.target.value)}
                placeholder="رقم الهاتف"
                className="w-full h-10 rounded-lg border border-border bg-muted/30 px-3 text-sm outline-none focus:border-neon-cyan/50"
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">ملاحظات (اختياري):</p>
              <input
                type="text"
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                placeholder="رقم العملية أو أي ملاحظة"
                className="w-full h-10 rounded-lg border border-border bg-muted/30 px-3 text-sm outline-none focus:border-neon-cyan/50"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!selectedPlan || !paymentMethod || !paymentPhone || submitting}
              className="w-full bg-gradient-to-r from-neon-purple to-neon-cyan text-white font-bold h-10 disabled:opacity-50"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin ml-2" />جاري الإرسال...</>
              ) : (
                <><CreditCard className="w-4 h-4 ml-2" />إرسال طلب الاشتراك</>
              )}
            </Button>

            <p className="text-[9px] text-muted-foreground text-center">
              سيتم مراجعة طلبك من قبل الإدارة خلال ساعات قليلة
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function AITutorPage() {
  const {
    aiMessages,
    aiLoading,
    addAiMessage,
    setAiLoading,
    clearAiMessages,
    user,
    language,
    setLanguage,
    authToken,
  } = useAppStore()

  const [input, setInput] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showSubModal, setShowSubModal] = useState(false)
  const [aiUsage, setAiUsage] = useState<{ remaining: number; limit: number; isPremium: boolean } | null>(null)
  const [pendingSub, setPendingSub] = useState<any>(null)
  const [activeSub, setActiveSub] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  const MAX_CHARS = 500

  // Fetch AI usage on mount
  useEffect(() => {
    const fetchUsage = async () => {
      if (!authToken) return
      try {
        const res = await fetch('/api/ai', {
          headers: { Authorization: `Bearer ${authToken}` },
        })
        const data = await res.json()
        if (data.success && data.usage) {
          setAiUsage(data.usage)
        }
      } catch {}
    }

    const fetchSubscription = async () => {
      if (!authToken) return
      try {
        const res = await fetch('/api/ai/subscription', {
          headers: { Authorization: `Bearer ${authToken}` },
        })
        const data = await res.json()
        if (data.success) {
          setActiveSub(data.activeSubscription)
          setPendingSub(data.pendingSubscription)
        }
      } catch {}
    }

    fetchUsage()
    fetchSubscription()
  }, [authToken])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [aiMessages, aiLoading])

  // Real AI response via API
  const sendToAI = useCallback(async (userMessage: string) => {
    setAiLoading(true)
    try {
      const history = aiMessages.slice(-10).map(m => ({
        role: m.role,
        content: m.content,
      }))

      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          message: userMessage,
          history,
        }),
      })

      const data = await res.json()

      // Update usage from response
      if (data.usage) {
        setAiUsage(data.usage)
      }

      if (data.response) {
        addAiMessage({
          id: Date.now().toString(),
          role: 'assistant',
          content: data.response,
          timestamp: Date.now(),
        })
      } else {
        addAiMessage({
          id: Date.now().toString(),
          role: 'assistant',
          content: '⚠️ عذراً، حدث خطأ في الاتصال بالمساعد الذكي.',
          timestamp: Date.now(),
        })
      }
    } catch (error) {
      addAiMessage({
        id: Date.now().toString(),
        role: 'assistant',
        content: '⚠️ عذراً، لم أتمكن من الاتصال بالخادم.',
        timestamp: Date.now(),
      })
    }
    setAiLoading(false)
  }, [aiMessages, addAiMessage, setAiLoading, authToken])

  // Send message
  const handleSend = useCallback(() => {
    const trimmed = input.trim()
    if (!trimmed || aiLoading) return

    addAiMessage({
      id: Date.now().toString(),
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    })

    setInput('')
    sendToAI(trimmed)
  }, [input, aiLoading, addAiMessage, sendToAI])

  // Quick action click
  const handleQuickAction = useCallback((prompt: string) => {
    if (aiLoading) return
    addAiMessage({
      id: Date.now().toString(),
      role: 'user',
      content: prompt,
      timestamp: Date.now(),
    })
    sendToAI(prompt)
  }, [aiLoading, addAiMessage, sendToAI])

  // Toggle voice input
  const toggleVoice = useCallback(() => {
    setIsListening((prev) => !prev)
    if (!isListening) {
      setTimeout(() => {
        setInput('ما هي خطوات الإنعاش القلبي الرئوي CPR؟')
        setIsListening(false)
      }, 2000)
    }
  }, [isListening])

  // Clear chat
  const handleClearChat = useCallback(() => {
    clearAiMessages()
    addAiMessage({
      id: Date.now().toString(),
      role: 'assistant',
      content: 'مرحباً! أنا مساعدك الطبي الذكي 🧠\n\nيمكنني مساعدتك في:\n- شرح أي مفهوم طبي\n- توليد حالات سريرية\n- اختبارات سريعة\n- خطط تعلم مخصصة\n\nكيف يمكنني مساعدتك اليوم؟',
      timestamp: Date.now(),
    })
  }, [clearAiMessages, addAiMessage])

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const isPremium = aiUsage?.isPremium || user.subscription === 'premium'
  const remainingMessages = aiUsage?.remaining ?? 999
  const totalLimit = aiUsage?.limit ?? 999
  const limitReached = !isPremium && remainingMessages <= 0

  return (
    <div dir="rtl" className="flex h-screen w-full bg-med-dark overflow-hidden">
      <SubscriptionModal
        open={showSubModal}
        onClose={() => setShowSubModal(false)}
        authToken={authToken}
        userPhone={user.phone}
      />

      {/* ─── Main Chat Area ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 relative">

        {/* Ambient Background Effects */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon-cyan/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-neon-purple/5 rounded-full blur-[100px]" />
        </div>

        {/* ─── Chat Header ─────────────────────────────────────────────────── */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong relative z-10 px-4 py-3 flex items-center justify-between border-b border-med-border"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-purple via-neon-blue to-neon-cyan flex items-center justify-center shadow-[0_0_20px_rgba(0,245,255,0.2)]">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -bottom-0.5 -left-0.5 w-3 h-3 rounded-full bg-neon-green border-2 border-med-dark animate-pulse" />
            </div>

            <div>
              <h1 className="text-sm font-bold text-foreground neon-text">
                المساعد الطبي الذكي 🧠
              </h1>
              <div className="flex items-center gap-2">
                <p className="text-[10px] text-neon-green flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-neon-green inline-block" />
                  متصل الآن • Groq AI
                </p>
                {/* Usage Badge */}
                {isPremium ? (
                  <Badge className="bg-neon-purple/20 text-neon-purple border-neon-purple/30 text-[9px] px-1.5 py-0">
                    <Crown className="w-2.5 h-2.5 ml-0.5" /> مميز
                  </Badge>
                ) : (
                  <Badge className={`text-[9px] px-1.5 py-0 ${
                    limitReached
                      ? 'bg-red-500/20 text-red-400 border-red-500/30'
                      : remainingMessages <= 2
                      ? 'bg-neon-orange/20 text-neon-orange border-neon-orange/30'
                      : 'bg-neon-cyan/20 text-neon-cyan border-neon-cyan/30'
                  }`}>
                    {limitReached ? '🔒 انتهى الحد' : `${remainingMessages} رسائل متبقية`}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className="text-muted-foreground hover:text-neon-cyan hover:bg-neon-cyan/10 h-8 w-8"
            >
              <Globe className="w-4 h-4" />
            </Button>

            {/* Subscribe button for free users */}
            {!isPremium && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSubModal(true)}
                className="text-muted-foreground hover:text-neon-purple hover:bg-neon-purple/10 h-8 w-8"
                title="اشترك الآن"
              >
                <Crown className="w-4 h-4" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-muted-foreground hover:text-neon-cyan hover:bg-neon-cyan/10 h-8 w-8 hidden lg:flex"
            >
              <BarChart3 className="w-4 h-4" />
            </Button>

            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-neon-cyan hover:bg-neon-cyan/10 h-8 w-8 lg:hidden"
                >
                  <BarChart3 className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-med-dark border-med-border p-0 w-80">
                <SheetHeader className="glass-strong border-b border-med-border p-4">
                  <SheetTitle className="text-foreground text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-neon-purple" />
                    إحصائيات التعلم
                  </SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-80px)]">
                  <SidebarContent
                    isPremium={isPremium}
                    remainingMessages={remainingMessages}
                    totalLimit={totalLimit}
                    activeSub={activeSub}
                  />
                </ScrollArea>
              </SheetContent>
            </Sheet>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleClearChat}
              className="text-muted-foreground hover:text-red-400 hover:bg-red-400/10 h-8 w-8"
              title="مسح المحادثة"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </motion.header>

        {/* ─── Limit Reached Banner ─────────────────────────────────────────── */}
        {limitReached && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="relative z-10 bg-gradient-to-r from-red-500/10 to-neon-purple/10 border-b border-red-500/20 px-4 py-2"
          >
            <div className="max-w-3xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-red-400" />
                <span className="text-xs text-red-400 font-medium">
                  لقد استنفدت حد الرسائل المجانية اليومية ({totalLimit} رسائل)
                </span>
              </div>
              <Button
                onClick={() => setShowSubModal(true)}
                className="h-7 text-xs bg-gradient-to-r from-neon-purple to-neon-cyan text-white px-3"
              >
                <Crown className="w-3 h-3 ml-1" /> اشترك الآن
              </Button>
            </div>
          </motion.div>
        )}

        {/* ─── Pending Subscription Banner ──────────────────────────────────── */}
        {pendingSub && !limitReached && (
          <div className="relative z-10 bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5">
            <div className="max-w-3xl mx-auto flex items-center gap-2">
              <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />
              <span className="text-[10px] text-amber-400">
                طلب اشتراكك ({pendingSub.planName}) قيد المراجعة من الإدارة
              </span>
            </div>
          </div>
        )}

        {/* ─── Messages Area ───────────────────────────────────────────────── */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto px-4 py-4 no-scrollbar relative z-10"
        >
          <div className="max-w-3xl mx-auto space-y-1">
            <AnimatePresence mode="popLayout">
              {aiMessages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className={`flex items-start gap-3 mb-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {msg.role === 'assistant' ? (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-neon-purple to-neon-blue flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                      <Brain className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-neon-cyan to-neon-blue flex items-center justify-center shadow-[0_0_15px_rgba(0,245,255,0.3)]">
                      <span className="text-xs font-bold text-med-dark">{user.name.charAt(0)}</span>
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-neon-cyan/20 to-neon-blue/20 border border-neon-cyan/20 rounded-2xl rounded-tr-sm'
                        : 'glass-card rounded-2xl rounded-tl-sm border-neon-purple/20'
                    } px-4 py-3`}
                  >
                    <div className="text-sm leading-relaxed text-foreground">
                      {msg.role === 'assistant' ? formatAIText(msg.content) : msg.content}
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      <Clock className="w-2.5 h-2.5 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">{formatTime(msg.timestamp)}</span>
                      {msg.role === 'assistant' && !isPremium && aiUsage && (
                        <span className="text-[9px] text-muted-foreground mr-2">
                          • متبقي {remainingMessages}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {aiLoading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* ─── Quick Actions ───────────────────────────────────────────────── */}
        <div className="relative z-10 px-4 pb-2">
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {QUICK_ACTIONS.map((action) => (
                <motion.button
                  key={action.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleQuickAction(action.prompt)}
                  disabled={aiLoading || limitReached}
                  className="flex-shrink-0 glass-card px-3 py-1.5 text-xs text-foreground hover:text-neon-cyan hover:border-neon-cyan/30 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {action.label}
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Input Area ──────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative z-10 px-4 pb-4 pt-1"
        >
          <div className="max-w-3xl mx-auto">
            <div className={`glass-strong rounded-2xl p-1.5 ${limitReached ? 'opacity-60' : 'neon-glow'}`}>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleVoice}
                  className={`h-9 w-9 rounded-xl transition-all ${
                    isListening
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 animate-pulse'
                      : 'text-muted-foreground hover:text-neon-cyan hover:bg-neon-cyan/10'
                  }`}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>

                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => {
                      if (e.target.value.length <= MAX_CHARS) setInput(e.target.value)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSend()
                      }
                    }}
                    placeholder={limitReached ? 'اشترك لإرسال المزيد من الرسائل...' : 'اسأل أي سؤال طبي...'}
                    disabled={aiLoading || limitReached}
                    className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none disabled:opacity-50 py-2"
                    dir="rtl"
                  />
                </div>

                <span className={`text-[10px] font-mono ${input.length > MAX_CHARS * 0.8 ? 'text-neon-orange' : 'text-muted-foreground'}`}>
                  {input.length}/{MAX_CHARS}
                </span>

                <motion.div whileTap={{ scale: 0.9 }}>
                  <Button
                    onClick={handleSend}
                    disabled={!input.trim() || aiLoading || limitReached}
                    className="h-9 w-9 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-blue text-med-dark hover:shadow-[0_0_25px_rgba(0,245,255,0.4)] transition-shadow disabled:opacity-50 disabled:hover:shadow-none"
                    size="icon"
                  >
                    <Send className="w-4 h-4 rtl-flip" />
                  </Button>
                </motion.div>
              </div>
            </div>

            <p className="text-[9px] text-muted-foreground text-center mt-2">
              ⚕️ المساعد الطبي الذكي للأغراض التعليمية فقط - لا يُغني عن الاستشارة الطبية المتخصصة
            </p>
          </div>
        </motion.div>
      </div>

      {/* ─── Desktop Sidebar ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="hidden lg:block border-r border-med-border bg-med-darker overflow-hidden"
          >
            <div className="w-80 h-full flex flex-col">
              <div className="glass-strong px-4 py-3 flex items-center justify-between border-b border-med-border">
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-neon-purple" />
                  إحصائيات التعلم
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="text-muted-foreground hover:text-foreground h-7 w-7">
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <ScrollArea className="flex-1">
                <SidebarContent
                  isPremium={isPremium}
                  remainingMessages={remainingMessages}
                  totalLimit={totalLimit}
                  activeSub={activeSub}
                />
              </ScrollArea>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Sidebar Content (updated with real usage) ────────────────────────────────

function SidebarContent({ isPremium, remainingMessages, totalLimit, activeSub }: {
  isPremium: boolean
  remainingMessages: number
  totalLimit: number
  activeSub: any
}) {
  const { user } = useAppStore()

  return (
    <div className="space-y-6 p-4">
      {/* AI Usage Meter */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-bold text-neon-purple flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4" />
          استخدام الذكاء الاصطناعي
        </h3>
        <div className="space-y-3">
          {isPremium ? (
            <>
              <div className="flex items-center gap-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg p-3 border border-purple-500/20">
                <Crown className="w-5 h-5 text-neon-purple" />
                <div>
                  <p className="text-sm font-bold text-neon-purple">اشتراك مميز ✨</p>
                  {activeSub?.expiresAt && (
                    <p className="text-[10px] text-muted-foreground">
                      ينتهي: {new Date(activeSub.expiresAt).toLocaleDateString('ar')}
                    </p>
                  )}
                </div>
              </div>
              <p className="text-xs text-emerald-400 text-center">رسائل غير محدودة 🎉</p>
            </>
          ) : (
            <>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-foreground">الرسائل اليومية</span>
                  <span className={remainingMessages <= 2 ? 'text-red-400' : 'text-neon-cyan'}>
                    {remainingMessages} / {totalLimit}
                  </span>
                </div>
                <Progress
                  value={Math.max(0, (remainingMessages / totalLimit) * 100)}
                  className={`h-2 bg-slate-800 ${remainingMessages <= 2 ? '[&>div]:bg-red-500' : '[&>div]:bg-neon-cyan'}`}
                />
              </div>
              <Button
                onClick={() => {}}
                className="w-full bg-gradient-to-r from-neon-purple to-neon-cyan text-white text-xs h-8"
              >
                <Crown className="w-3 h-3 ml-1" /> ترقية للاشتراك المميز
              </Button>
              <p className="text-[10px] text-muted-foreground text-center">
                رسائل غير محدودة مع الاشتراك المميز ✨
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
