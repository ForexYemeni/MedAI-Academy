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
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Target,
  BarChart3,
  Zap,
  Clock,
  Crown,
  AlertCircle,
  CheckCircle2,
  X,
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
    // Bold
    let formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-neon-cyan font-bold">$1</strong>')
    // Italic markers (single *)
    formatted = formatted.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')

    if (line.startsWith('🚨') || line.startsWith('🚫') || line.startsWith('⚠️')) {
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
              animate={{
                y: [0, -8, 0],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.15,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Sidebar Content ─────────────────────────────────────────────────────────

function SidebarContent() {
  const { user } = useAppStore()

  const weakAreas = [
    { name: 'أمراض القلب', nameEn: 'Cardiology', score: 45 },
    { name: 'علم الأدوية', nameEn: 'Pharmacology', score: 52 },
    { name: 'طب الأعصاب', nameEn: 'Neurology', score: 38 },
  ]

  const studyStats = [
    { label: 'رسائل اليوم', value: '12', icon: MessageCircle },
    { label: 'ساعات الدراسة', value: '2.5', icon: Clock },
    { label: 'مواضيع مغطاة', value: '8', icon: BookOpen },
    { label: 'دقة الإجابات', value: '87%', icon: Target },
  ]

  return (
    <div className="space-y-6 p-4">
      {/* Learning Path */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-bold text-neon-cyan flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4" />
          مسار التعلم
        </h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-foreground">طب الطوارئ</span>
              <span className="text-neon-cyan">65%</span>
            </div>
            <Progress value={65} className="h-2 bg-slate-800 [&>div]:bg-gradient-to-r [&>div]:from-neon-cyan [&>div]:to-neon-blue" />
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-foreground">أمراض القلب</span>
              <span className="text-neon-purple">30%</span>
            </div>
            <Progress value={30} className="h-2 bg-slate-800 [&>div]:bg-gradient-to-r [&>div]:from-neon-purple [&>div]:to-neon-pink" />
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-foreground">طب الأطفال</span>
              <span className="text-neon-green">85%</span>
            </div>
            <Progress value={85} className="h-2 bg-slate-800 [&>div]:bg-gradient-to-r [&>div]:from-neon-green [&>div]:to-neon-cyan" />
          </div>
        </div>
      </div>

      {/* Weak Areas */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-bold text-neon-orange flex items-center gap-2 mb-3">
          <AlertCircle className="w-4 h-4" />
          نقاط الضعف المكتشفة
        </h3>
        <div className="space-y-2">
          {weakAreas.map((area) => (
            <div key={area.nameEn} className="flex items-center justify-between">
              <span className="text-xs text-foreground">{area.name}</span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      area.score < 40
                        ? 'bg-red-500'
                        : area.score < 60
                        ? 'bg-neon-orange'
                        : 'bg-neon-green'
                    }`}
                    style={{ width: `${area.score}%` }}
                  />
                </div>
                <span className={`text-xs font-mono ${
                  area.score < 40
                    ? 'text-red-400'
                    : area.score < 60
                    ? 'text-neon-orange'
                    : 'text-neon-green'
                }`}>
                  {area.score}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Study Statistics */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-bold text-neon-blue flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4" />
          إحصائيات الدراسة
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {studyStats.map((stat) => (
            <div key={stat.label} className="bg-slate-800/50 rounded-lg p-2.5 text-center border border-slate-700/50">
              <stat.icon className="w-3.5 h-3.5 mx-auto mb-1 text-neon-cyan" />
              <div className="text-sm font-bold text-foreground">{stat.value}</div>
              <div className="text-[10px] text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Usage Meter */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-bold text-neon-purple flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4" />
          استخدام الذكاء الاصطناعي
        </h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-foreground">الرسائل اليومية</span>
              <span className="text-neon-cyan">12 / 50</span>
            </div>
            <Progress value={24} className="h-2 bg-slate-800 [&>div]:bg-neon-cyan" />
          </div>
          <div className="flex items-center justify-between bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg p-2.5 border border-purple-500/20">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-neon-purple" />
              <span className="text-xs text-foreground">اشتراك مميز</span>
            </div>
            <Badge className="bg-neon-purple/20 text-neon-purple border-neon-purple/30 text-[10px]">
              {user.subscription === 'premium' ? 'بريميوم' : 'مجاني'}
            </Badge>
          </div>
          <p className="text-[10px] text-muted-foreground text-center">
            رسائل غير محدودة مع الاشتراك المميز ✨
          </p>
        </div>
      </div>
    </div>
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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  const MAX_CHARS = 500

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [aiMessages, aiLoading])

  // Real AI response via API
  const sendToAI = useCallback(async (userMessage: string) => {
    setAiLoading(true)
    try {
      // Build history from existing messages (last 10)
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

      if (data.response) {
        addAiMessage({
          id: Date.now().toString(),
          role: 'assistant',
          content: data.response,
          timestamp: Date.now(),
        })
      } else {
        // Error fallback
        addAiMessage({
          id: Date.now().toString(),
          role: 'assistant',
          content: '⚠️ عذراً، حدث خطأ في الاتصال بالمساعد الذكي. يرجى المحاولة مرة أخرى.',
          timestamp: Date.now(),
        })
      }
    } catch (error) {
      console.error('AI fetch error:', error)
      addAiMessage({
        id: Date.now().toString(),
        role: 'assistant',
        content: '⚠️ عذراً، لم أتمكن من الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.',
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
      content: 'مرحباً! أنا مساعدك الطبي الذكي 🧠\n\nيمكنني مساعدتك في:\n- شرح أي مفهوم طبي\n- توليد حالات سريرية\n- اختبارات سريعة\n- خطط تعلم مخصصة\n- تلخيص المحتوى\n- بطاقات مراجعة\n\nكيف يمكنني مساعدتك اليوم؟',
      timestamp: Date.now(),
    })
  }, [clearAiMessages, addAiMessage])

  // Format timestamp
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div
      dir="rtl"
      className="flex h-screen w-full bg-med-dark overflow-hidden"
    >
      {/* ─── Main Chat Area ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 relative">

        {/* ─── Ambient Background Effects ──────────────────────────────────── */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon-cyan/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-neon-purple/5 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 right-0 w-64 h-64 bg-neon-blue/3 rounded-full blur-[80px]" />
        </div>

        {/* ─── Chat Header ─────────────────────────────────────────────────── */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong relative z-10 px-4 py-3 flex items-center justify-between border-b border-med-border"
        >
          <div className="flex items-center gap-3">
            {/* AI Avatar */}
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-purple via-neon-blue to-neon-cyan flex items-center justify-center shadow-[0_0_20px_rgba(0,245,255,0.2)]">
                <Brain className="w-5 h-5 text-white" />
              </div>
              {/* Online indicator */}
              <div className="absolute -bottom-0.5 -left-0.5 w-3 h-3 rounded-full bg-neon-green border-2 border-med-dark animate-pulse" />
            </div>

            <div>
              <h1 className="text-sm font-bold text-foreground neon-text">
                المساعد الطبي الذكي 🧠
              </h1>
              <p className="text-[10px] text-neon-green flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-neon-green inline-block" />
                متصل الآن • مدعوم بالذكاء الاصطناعي
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Language Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className="text-muted-foreground hover:text-neon-cyan hover:bg-neon-cyan/10 h-8 w-8"
              title={language === 'ar' ? 'Switch to English' : 'التبديل للعربية'}
            >
              <Globe className="w-4 h-4" />
            </Button>

            {/* Sidebar Toggle (desktop) */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-muted-foreground hover:text-neon-cyan hover:bg-neon-cyan/10 h-8 w-8 hidden lg:flex"
            >
              <BarChart3 className="w-4 h-4" />
            </Button>

            {/* Sidebar Toggle (mobile) - Sheet */}
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
                  <SidebarContent />
                </ScrollArea>
              </SheetContent>
            </Sheet>

            {/* Clear Chat */}
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
                  transition={{
                    duration: 0.3,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                  className={`flex items-start gap-3 mb-4 ${
                    msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  {/* Avatar */}
                  {msg.role === 'assistant' ? (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-neon-purple to-neon-blue flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                      <Brain className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-neon-cyan to-neon-blue flex items-center justify-center shadow-[0_0_15px_rgba(0,245,255,0.3)]">
                      <span className="text-xs font-bold text-med-dark">
                        {user.name.charAt(0)}
                      </span>
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[80%] ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-neon-cyan/20 to-neon-blue/20 border border-neon-cyan/20 rounded-2xl rounded-tr-sm'
                        : 'glass-card rounded-2xl rounded-tl-sm border-neon-purple/20'
                    } px-4 py-3`}
                  >
                    {/* Content */}
                    <div className={`text-sm leading-relaxed ${
                      msg.role === 'user' ? 'text-foreground' : 'text-foreground'
                    }`}>
                      {msg.role === 'assistant'
                        ? formatAIText(msg.content)
                        : msg.content}
                    </div>

                    {/* Timestamp */}
                    <div className="flex items-center gap-1 mt-2">
                      <Clock className="w-2.5 h-2.5 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing Indicator */}
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
                  disabled={aiLoading}
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
            <div className="glass-strong rounded-2xl p-1.5 neon-glow">
              <div className="flex items-center gap-2">
                {/* Voice Input */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleVoice}
                  className={`h-9 w-9 rounded-xl transition-all ${
                    isListening
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 animate-pulse'
                      : 'text-muted-foreground hover:text-neon-cyan hover:bg-neon-cyan/10'
                  }`}
                  title={isListening ? 'إيقاف التسجيل' : 'إدخال صوتي'}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>

                {/* Text Input */}
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => {
                      if (e.target.value.length <= MAX_CHARS) {
                        setInput(e.target.value)
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSend()
                      }
                    }}
                    placeholder="اسأل أي سؤال طبي..."
                    disabled={aiLoading}
                    className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none disabled:opacity-50 py-2"
                    dir="rtl"
                  />
                </div>

                {/* Character Count */}
                <span className={`text-[10px] font-mono ${
                  input.length > MAX_CHARS * 0.8
                    ? 'text-neon-orange'
                    : 'text-muted-foreground'
                }`}>
                  {input.length}/{MAX_CHARS}
                </span>

                {/* Send Button */}
                <motion.div whileTap={{ scale: 0.9 }}>
                  <Button
                    onClick={handleSend}
                    disabled={!input.trim() || aiLoading}
                    className="h-9 w-9 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-blue text-med-dark hover:shadow-[0_0_25px_rgba(0,245,255,0.4)] transition-shadow disabled:opacity-50 disabled:hover:shadow-none"
                    size="icon"
                  >
                    <Send className="w-4 h-4 rtl-flip" />
                  </Button>
                </motion.div>
              </div>
            </div>

            {/* Disclaimer */}
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
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(false)}
                  className="text-muted-foreground hover:text-foreground h-7 w-7"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <ScrollArea className="flex-1">
                <SidebarContent />
              </ScrollArea>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  )
}
