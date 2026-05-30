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
  Upload,
  Wallet,
  Copy,
  Check,
  ChevronLeft,
  ImageIcon,
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

// ─── Dynamic Quick Action Chips (generate different prompts each time) ────────

const MEDICAL_TOPICS = [
  'أمراض القلب', 'الجهاز التنفسي', 'الجهاز الهضمي', 'الجهاز العصبي', 'أمراض الكلى',
  'الغدد الصماء والسكري', 'أمراض الدم', 'الأمراض المعدية', 'الروماتيزم والمفاصل',
  'الأمراض النفسية', 'طب الطوارئ', 'الأورام', 'طب الأطفال', 'طب النساء والتوليد',
  'الجراحة العامة', 'طب العيون', 'طب الأنف والأذن', 'الأمراض الجلدية',
  'التخدير والعناية المركزة', 'الأشعة والتصوير الطبي', 'علم الأمراض',
  'التشريح المرضي', 'علم الأدوية والصيدلة', 'طب الأسرة',
]

const CLINICAL_SCENARIOS = [
  'مريض يبلغ من العمر 45 عاماً يعاني من ألم صدري حاد مع ضيق تنفس',
  'امرأة حامل في الأسبوع 32 شكت من صداع شديد وارتفاع ضغط الدم',
  'طفل عمره 3 سنوات مع حرارة مرتفعة وطفح جلدي',
  'مريض مسن يعاني من التبول المتكرر والعطش الشديد وفقدان الوزن',
  'شاب يبلغ 25 عاماً يعاني من ألم حاد في البطن مع غثيان وقيء',
  'مريض يعاني من رجفة مفاجئة وفقدان الوعي لمدة دقيقتين',
  'مريضة تشكو من تورم في الساقين وضيق تنفس عند الاستلقاء',
  'مريض يعاني من سعال مزمن مع بلدموي وفقدان وزن',
  'طفل حديث الولادة يعاني من اصفرار شديد في الجلد',
  'مريض يعاني من ألم مفاجئ شديد في الخاصرة اليسى مع دم في البول',
  'مريض محمول للطوارئ بعد حادث مروري مع ضيق تنفس وانخفاض ضغط',
  'مريضة تشكو من ألم مفصلي متعدد مع تعب وطفح على الوجه',
  'مريض في الخمسينات يعاني من نسيان متزايد وارتباك',
  'شاب يعاني من صداع نصفي متكرر مع اضطراب بصري',
  'مريض يعاني من حرقة معدة مزمنة مع صعوبة في البلع',
]

const SPECIFIC_CONDITIONS = [
  'احتشاء عضلة القلب الحاد (STEMI)', 'السكتة الدماغية', 'الربو القصبي الحاد',
  'الفشل الكلوي المزمن', 'تليف الكبد', 'السكري النوع 2', 'التهاب الزائدة الدودية',
  'الالتهاب الرئوي المكتسب من المجتمع', 'الرجفان الأذيني',
  'انسداد الأمعاء', 'التهاب السحايا', 'متلازمة الكبد الكظري',
  'الحماض الكيتوني السكري', 'الصدمة التأقية', 'تسمم الحمل',
  'الانصباب الجنبي', 'خثار الأوردة العميقة', 'التهاب البنكرياس الحاد',
  'الانفتال الرئوي', 'ارتفاع ضغط الدم الخبيث',
]

const DRUG_CATEGORIES = [
  'مضادات التخثر', 'المضادات الحيوية', 'مضادات الاكتئاب', 'أدوية الضغط',
  'أدوية السكري', 'المسكنات والأفيونات', 'أدوية الربو', 'أدوية القلب',
  'أدوية الصرع', 'الكورتيكوستيرويدات', 'أدوية الغدة الدرقية',
  'أدوية القرحة', 'أدوية النقرس', 'أدوية الأورام',
]

const PHYSIOLOGY_TOPICS = [
  'آلية انقباض عضلة القلب', 'تبادل الغازات في الرئتين', 'تصفية الكلى وتكوين البول',
  'النقل العصبي المشبكي', 'تنظيم سكر الدم', 'آليات المناعة الفطرية',
  'التخثر وتجلط الدم', 'تنظيم التوازن الحمضي القاعدي', 'الهرمونات وتنظيمها',
  'حركة الأمعاء والهضم', 'التنفس الخلوي وإنتاج الطاقة',
]

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

interface QuickAction {
  id: string
  label: string
  icon: any
  generate: () => string
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'quiz',
    label: '🧪 اختبار سريع',
    icon: FlaskConical,
    generate: () => {
      const topic = pickRandom(MEDICAL_TOPICS)
      const difficulty = pickRandom(['سهل', 'متوسط', 'متقدم'])
      return `أنشئ لي اختبار طبي من 5 أسئلة اختيار متعدد في موضوع "${topic}" بمستوى ${difficulty}. كل سؤال له 4 خيارات مع الإجابة الصحيحة وشرح مختصر. لا تكرر أسئلة شائعة - كن مبتكراً في صياغة الأسئلة.`
    },
  },
  {
    id: 'case',
    label: '🏥 حالة سريرية',
    icon: Hospital,
    generate: () => {
      const scenario = pickRandom(CLINICAL_SCENARIOS)
      return `أعطني حالة سريرية تفصيلية: ${scenario}. اذكر الأعراض بالتفصيل، الفحص السريري، الفحوصات المطلوبة، التشخيص التفريقي (3-4 احتمالات)، والتشخيص الأرجح مع التبرير. كن واقعياً ومبتكراً - لا تكرر الحالات الشائعة.`
    },
  },
  {
    id: 'summarize',
    label: '📋 تلخيص درس',
    icon: BookOpen,
    generate: () => {
      const topic = pickRandom(MEDICAL_TOPICS)
      return `لخص لي أهم النقاط في موضوع "${topic}" بطريقة منظمة تشمل: التعريف، الأسباب، الأعراض، التشخيص، والعلاج. ركز على النقاط التي يخطئ فيها الطلاب كثيراً.`
    },
  },
  {
    id: 'explain',
    label: '📖 شرح مبسط',
    icon: BookText,
    generate: () => {
      const topic = pickRandom(PHYSIOLOGY_TOPICS)
      return `اشرح لي "${topic}" بطريقة مبسطة جداً كأنك تشرح لطالب في السنة الأولى. استخدم أمثلة من الحياة اليومية للتوضيح. اجعل الشرح متسلسل ومنطقي.`
    },
  },
  {
    id: 'flashcards',
    label: '🗂️ بطاقات مراجعة',
    icon: Layers,
    generate: () => {
      const category = pickRandom(DRUG_CATEGORIES)
      return `أنشئ لي 6 بطاقات مراجعة عن "${category}" - كل بطاقة تحتوي على سؤال في الأمام والإجابة المختصرة في الخلف. ركز على النقاط التي تأتي في الامتحانات. كن متنوعاً ولا تكرر أنماط الأسئلة.`
    },
  },
  {
    id: 'drug',
    label: '💊 تفاعل دوائي',
    icon: Wallet,
    generate: () => {
      const cat = pickRandom(DRUG_CATEGORIES)
      return `اكتب لي عن أهم التفاعلات الدوائية الخطيرة المتعلقة بـ "${cat}" مع شرح الآلية والعلامات التحذيرية والإدارة المناسبة. لا تكرر التفاعلات الشائعة فقط - أضف تفاعلات أقل شهرة لكن مهمة.`
    },
  },
  {
    id: 'condition',
    label: '🩺 تشخيص تفريقي',
    icon: Target,
    generate: () => {
      const condition = pickRandom(SPECIFIC_CONDITIONS)
      return `اشرح لي التشخيص التفريقي لحالة "${condition}" - اذكر 4-5 حالات مشابهة وكيف نميز بينها سريرياً ومخبرياً. رتبها حسب الأرجحية.`
    },
  },
]

// ─── Professional Formatting Helper with Multi-Color System ──────────────────

function formatAIText(text: string) {
  const lines = text.split('\n')
  return lines.map((line, i) => {
    let formatted = line

    // Bold text with gradient cyan color
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold" style="color:#00f5ff">$1</strong>')
    // Italic text with soft purple
    formatted = formatted.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em style="color:#a78bfa">$1</em>')

    // ─── Emoji-based Color Mapping (Professional Multi-Color) ───

    // 🔴 RED - Dangers, warnings, critical info
    if (/^[🚨🚫⚠️🔒🔴❌🛑]/.test(line)) {
      return (
        <div key={i} className="my-1 px-3 py-1.5 rounded-lg bg-red-500/10 border-r-2 border-red-500/40" 
          dangerouslySetInnerHTML={{ __html: `<span style="color:#f87171;font-weight:600">${formatted}</span>` }} />
      )
    }

    // 🟢 GREEN - Success, correct, safe
    if (/^[✅🟢💚✔️✓🌱💪🏆]/.test(line)) {
      return (
        <div key={i} className="my-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 border-r-2 border-emerald-500/40"
          dangerouslySetInnerHTML={{ __html: `<span style="color:#34d399;font-weight:600">${formatted}</span>` }} />
      )
    }

    // 🔵 BLUE - Info, notes, general knowledge
    if (/^[🔵ℹ️📘📝📌🔖🏷️📋]/.test(line)) {
      return (
        <div key={i} className="my-1 px-3 py-1.5 rounded-lg bg-blue-500/10 border-r-2 border-blue-500/40"
          dangerouslySetInnerHTML={{ __html: `<span style="color:#60a5fa;font-weight:600">${formatted}</span>` }} />
      )
    }

    // 🟡 YELLOW/AMBER - Tips, advice, medium importance
    if (/^[💡🟡⚡🌟⭐✨💛🔔💎🎯🔑]/.test(line)) {
      return (
        <div key={i} className="my-1 px-3 py-1.5 rounded-lg bg-amber-500/10 border-r-2 border-amber-500/40"
          dangerouslySetInnerHTML={{ __html: `<span style="color:#fbbf24;font-weight:600">${formatted}</span>` }} />
      )
    }

    // 🟣 PURPLE - Advanced, special, pharmacology
    if (/^[🟣💜🔮🧬⚗️💊]/.test(line)) {
      return (
        <div key={i} className="my-1 px-3 py-1.5 rounded-lg bg-purple-500/10 border-r-2 border-purple-500/40"
          dangerouslySetInnerHTML={{ __html: `<span style="color:#a78bfa;font-weight:600">${formatted}</span>` }} />
      )
    }

    // 🏥 Medical emojis - hospital, diagnosis, etc.
    if (/^[🏥🩺⚕️🫀🫁🧠🦴🩸💉🧪🔬🩻]/.test(line)) {
      return (
        <div key={i} className="my-1 px-3 py-1.5 rounded-lg bg-teal-500/10 border-r-2 border-teal-500/40"
          dangerouslySetInnerHTML={{ __html: `<span style="color:#2dd4bf;font-weight:600">${formatted}</span>` }} />
      )
    }

    // 🚑 Emergency / First Aid
    if (/^[🚑🆘📞🏥⛑️]/.test(line)) {
      return (
        <div key={i} className="my-1 px-3 py-1.5 rounded-lg bg-orange-500/10 border-r-2 border-orange-500/40"
          dangerouslySetInnerHTML={{ __html: `<span style="color:#fb923c;font-weight:600">${formatted}</span>` }} />
      )
    }

    // 📖 Education / Study
    if (/^[📖📚🎓🏫📖✏️🖊️]/.test(line)) {
      return (
        <div key={i} className="my-1 px-3 py-1.5 rounded-lg bg-indigo-500/10 border-r-2 border-indigo-500/40"
          dangerouslySetInnerHTML={{ __html: `<span style="color:#818cf8;font-weight:600">${formatted}</span>` }} />
      )
    }

    // 🔄 Process / Steps
    if (/^[🔄🔄🔃♻️]/.test(line)) {
      return (
        <div key={i} className="my-1 px-3 py-1.5 rounded-lg bg-cyan-500/10 border-r-2 border-cyan-500/40"
          dangerouslySetInnerHTML={{ __html: `<span style="color:#22d3ee;font-weight:500">${formatted}</span>` }} />
      )
    }

    // Numbered emoji steps (1️⃣ 2️⃣ 3️⃣ etc)
    if (/^[1-9️⃣⃣]/.test(line) || /^\d️⃣/.test(line)) {
      return (
        <div key={i} className="my-1 px-3 py-1.5 rounded-lg bg-sky-500/10 border-r-2 border-sky-500/40"
          dangerouslySetInnerHTML={{ __html: `<span style="color:#38bdf8;font-weight:500">${formatted}</span>` }} />
      )
    }

    // ─── Markdown Headers (### ##) ───
    if (/^#{1,3}\s/.test(line)) {
      const headerText = line.replace(/^#{1,3}\s/, '')
      const isH3 = line.startsWith('###')
      return (
        <div key={i} className={`my-2 font-bold ${isH3 ? 'text-base' : 'text-lg'}`} 
          style={{ color: '#00f5ff' }}
          dangerouslySetInnerHTML={{ __html: headerText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
      )
    }

    // ─── Bullet points (-, *, •) with colored dots ───
    if (/^[\s]*[-*•]\s/.test(line)) {
      const indent = line.match(/^(\s*)/)?.[1].length || 0
      const bulletContent = line.replace(/^[\s]*[-*•]\s/, '')
      return (
        <div key={i} className="my-0.5 flex items-start gap-2" style={{ paddingRight: `${indent * 8}px` }}>
          <span style={{ color: '#00f5ff', marginTop: '2px' }}>●</span>
          <span className="flex-1" dangerouslySetInnerHTML={{ __html: formatted.replace(/^[\s]*[-*•]\s/, '') }} />
        </div>
      )
    }

    // ─── Numbered lists (1. 2. etc) ───
    if (/^\d+[.)]\s/.test(line)) {
      const num = line.match(/^(\d+)/)?.[1] || '1'
      return (
        <div key={i} className="my-0.5 flex items-start gap-2">
          <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold" 
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)', color: 'white' }}>
            {num}
          </span>
          <span className="flex-1" dangerouslySetInnerHTML={{ __html: formatted.replace(/^\d+[.)]\s/, '') }} />
        </div>
      )
    }

    // ─── Divider lines ───
    if (/^[─═─━-]{3,}$/.test(line.trim())) {
      return <div key={i} className="my-2 border-t border-white/10" />
    }

    // ─── Empty lines ───
    if (line.trim() === '') {
      return <div key={i} className="h-2" />
    }

    // ─── Default line ───
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

// ─── Image Compress Helper ────────────────────────────────────────────────
function compressImage(file: File, maxWidth = 1200, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const reader = new FileReader()
    reader.onload = (e) => {
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, width, height)
        const compressed = canvas.toDataURL('image/jpeg', quality)
        resolve(compressed)
      }
      img.onerror = () => reject(new Error('فشل تحميل الصورة'))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('فشل قراءة الملف'))
    reader.readAsDataURL(file)
  })
}

// ─── Subscription Card (Professional) ──────────────────────────────────────

function SubscriptionCard({
  authToken,
  onSubscribed,
}: {
  authToken: string | null
  onSubscribed: () => void
}) {
  const [plans, setPlans] = useState<any>(null)
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [selectedMethod, setSelectedMethod] = useState<any>(null)
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [paymentNote, setPaymentNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [step, setStep] = useState<'plan' | 'payment' | 'confirm'>('plan')

  useEffect(() => {
    const fetchData = async () => {
      if (!authToken) return
      try {
        const res = await fetch('/api/ai/subscription', {
          headers: { Authorization: `Bearer ${authToken}` },
        })
        const data = await res.json()
        if (data.success) {
          setPlans(data.plans)
          const methods = data.paymentMethods || []
          setPaymentMethods(methods)
          if (methods.length > 0) setSelectedMethod(methods[0])
        }
      } catch {}
    }
    fetchData()
  }, [authToken])

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) return
    try {
      const compressed = await compressImage(file)
      setScreenshot(compressed)
    } catch {}
  }

  const handleSubmit = async () => {
    if (!selectedPlan || !screenshot || !selectedMethod) return
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
          paymentMethodId: selectedMethod._id,
          paymentScreenshot: screenshot,
          paymentNote,
        }),
      })
      const data = await res.json()
      setResult({
        success: data.success,
        message: data.message || data.error || 'حدث خطأ',
      })
      if (data.success) onSubscribed()
    } catch {
      setResult({ success: false, message: 'فشل الاتصال بالخادم' })
    }
    setSubmitting(false)
  }

  const planIcons: Record<string, string> = { weekly: '⚡', monthly: '🌟', lifetime: '👑' }
  const planColors: Record<string, string> = {
    weekly: 'from-amber-500 to-orange-500',
    monthly: 'from-purple-500 to-pink-500',
    lifetime: 'from-neon-cyan to-emerald-500',
  }
  const planBorders: Record<string, string> = {
    weekly: 'border-amber-500/30',
    monthly: 'border-purple-500/30',
    lifetime: 'border-neon-cyan/30',
  }
  const planGlows: Record<string, string> = {
    weekly: 'shadow-[0_0_20px_rgba(245,158,11,0.15)]',
    monthly: 'shadow-[0_0_20px_rgba(168,85,247,0.15)]',
    lifetime: 'shadow-[0_0_20px_rgba(0,245,255,0.15)]',
  }

  if (!plans) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-neon-cyan animate-spin" />
      </div>
    )
  }

  if (result) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-6 rounded-2xl bg-gradient-to-b from-med-dark/80 to-med-darker/80 border border-neon-cyan/10 text-center space-y-4"
      >
        <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${result.success ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
          {result.success ? <CheckCircle2 className="w-8 h-8 text-emerald-400" /> : <AlertCircle className="w-8 h-8 text-red-400" />}
        </div>
        <p className="text-sm font-bold">{result.message}</p>
        {result.success && (
          <p className="text-xs text-muted-foreground">سيتم تفعيل اشتراكك بعد مراجعة الإدارة</p>
        )}
        <Button onClick={() => { setResult(null); setStep('plan') }} className="bg-gradient-to-r from-neon-cyan to-neon-blue text-white h-9">
          حسناً
        </Button>
      </motion.div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Step: Select Plan */}
      {step === 'plan' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-neon-purple to-neon-cyan shadow-[0_0_30px_rgba(168,85,247,0.3)]">
              <Crown className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-lg font-bold bg-gradient-to-l from-neon-cyan to-neon-purple bg-clip-text text-transparent">
              اشترك في المساعد الذكي
            </h3>
            <p className="text-xs text-muted-foreground">احصل على رسائل غير محدودة مع المساعد الطبي الذكي</p>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(plans).map(([key, plan]: [string, any]) => (
              <button
                key={key}
                onClick={() => setSelectedPlan(key)}
                className={`relative p-3 rounded-xl border text-center transition-all duration-300 ${
                  selectedPlan === key
                    ? `${planBorders[key]} bg-gradient-to-b ${planColors[key]}/10 ${planGlows[key]}`
                    : 'border-border bg-muted/10 hover:bg-muted/20'
                }`}
              >
                {selectedPlan === key && (
                  <div className="absolute top-1.5 left-1.5">
                    <CheckCircle2 className="w-4 h-4 text-neon-cyan" />
                  </div>
                )}
                <span className="text-2xl">{planIcons[key]}</span>
                <p className="text-sm font-bold mt-1">{plan.name}</p>
                <p className="text-[10px] text-muted-foreground">{key === 'lifetime' ? 'للأبد' : plan.durationDays + ' يوم'}</p>
                <div className="mt-2">
                  <span className={`text-sm font-black ${selectedPlan === key ? 'text-neon-cyan' : 'text-foreground'}`}>
                    {plan.price > 0 ? `${plan.price.toLocaleString()} ر.ي` : 'مجاني'}
                  </span>
                </div>
              </button>
            ))}
          </div>

          <Button
            onClick={() => selectedPlan && setStep('payment')}
            disabled={!selectedPlan}
            className="w-full bg-gradient-to-r from-neon-purple to-neon-cyan text-white font-bold h-11 disabled:opacity-50"
          >
            متابعة الدفع
            <ChevronLeft className="w-4 h-4 mr-1" />
          </Button>
        </motion.div>
      )}

      {/* Step: Payment Method & Upload */}
      {step === 'payment' && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          {/* Back button */}
          <button onClick={() => setStep('plan')} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-3 h-3 rotate-180" />
            رجوع لاختيار الخطة
          </button>

          {/* Selected Plan Summary */}
          {selectedPlan && plans[selectedPlan] && (
            <div className={`p-3 rounded-xl border ${planBorders[selectedPlan]} bg-gradient-to-r ${planColors[selectedPlan]}/5`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{planIcons[selectedPlan]}</span>
                  <div>
                    <p className="text-sm font-bold">{plans[selectedPlan].name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {selectedPlan === 'lifetime' ? 'للأبد' : `${plans[selectedPlan].durationDays} يوم`}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-black text-neon-cyan">
                  {plans[selectedPlan].price > 0 ? `${plans[selectedPlan].price.toLocaleString()} ر.ي` : 'مجاني'}
                </span>
              </div>
            </div>
          )}

          {/* Payment Method Selection */}
          {paymentMethods.length === 0 ? (
            <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-center">
              <AlertCircle className="w-5 h-5 text-amber-400 mx-auto mb-2" />
              <p className="text-xs text-amber-400">لا توجد طرق دفع متاحة حالياً</p>
              <p className="text-[10px] text-muted-foreground mt-1">يرجى التواصل مع الإدارة</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-bold text-muted-foreground">💳 اختر طريقة الدفع</p>
              {paymentMethods.map((method: any) => (
                <button
                  key={method._id}
                  onClick={() => setSelectedMethod(method)}
                  className={`w-full p-3 rounded-xl border text-right transition-all ${
                    selectedMethod?._id === method._id
                      ? 'border-neon-cyan/40 bg-neon-cyan/5'
                      : 'border-border bg-muted/10 hover:bg-muted/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-neon-cyan" />
                      <span className="text-sm font-bold">{method.name}</span>
                    </div>
                    {selectedMethod?._id === method._id && (
                      <CheckCircle2 className="w-4 h-4 text-neon-cyan" />
                    )}
                  </div>
                  {/* Show account details when selected */}
                  {selectedMethod?._id === method._id && (
                    <div className="mt-3 space-y-2 pt-2 border-t border-border/30">
                      {method.accountNumber && (
                        <div className="flex items-center justify-between bg-muted/20 rounded-lg px-3 py-2">
                          <div>
                            <p className="text-[10px] text-muted-foreground">رقم الحساب</p>
                            <p className="text-sm font-bold font-mono" dir="ltr">{method.accountNumber}</p>
                          </div>
                          <Button size="sm" variant="ghost" className="h-6 px-2 text-neon-cyan hover:bg-neon-cyan/10"
                            onClick={(e) => { e.stopPropagation(); copyToClipboard(method.accountNumber, 'acc') }}>
                            {copiedField === 'acc' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          </Button>
                        </div>
                      )}
                      {method.accountName && (
                        <div className="flex items-center justify-between bg-muted/20 rounded-lg px-3 py-2">
                          <div>
                            <p className="text-[10px] text-muted-foreground">اسم صاحب الحساب</p>
                            <p className="text-sm font-bold">{method.accountName}</p>
                          </div>
                          <Button size="sm" variant="ghost" className="h-6 px-2 text-neon-cyan hover:bg-neon-cyan/10"
                            onClick={(e) => { e.stopPropagation(); copyToClipboard(method.accountName, 'name') }}>
                            {copiedField === 'name' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          </Button>
                        </div>
                      )}
                      {method.instructions && (
                        <p className="text-[10px] text-muted-foreground bg-muted/10 rounded-lg p-2">{method.instructions}</p>
                      )}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Screenshot Upload */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-muted-foreground">📸 صورة تأكيد الدفع <span className="text-red-400">*</span></p>
            {screenshot ? (
              <div className="relative rounded-xl overflow-hidden border border-neon-cyan/20">
                <img src={screenshot} alt="تأكيد الدفع" className="w-full max-h-40 object-contain bg-black/50" />
                <button
                  onClick={() => setScreenshot(null)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500/80 flex items-center justify-center hover:bg-red-500"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-28 rounded-xl border-2 border-dashed border-white/10 hover:border-neon-cyan/30 cursor-pointer transition-colors bg-white/[0.02]">
                <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                <span className="text-xs text-muted-foreground">اضغط لرفع صورة تأكيد الدفع</span>
                <span className="text-[10px] text-muted-foreground/60 mt-1">PNG, JPG حتى 10MB</span>
                <input type="file" accept="image/*" onChange={handleScreenshotUpload} className="hidden" />
              </label>
            )}
          </div>

          {/* Payment Note */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">ملاحظات (اختياري):</p>
            <input
              type="text"
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
              placeholder="رقم العملية أو أي ملاحظة"
              className="w-full h-9 rounded-lg border border-border bg-muted/30 px-3 text-xs outline-none focus:border-neon-cyan/50"
            />
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={!selectedPlan || !screenshot || !selectedMethod || submitting}
            className="w-full bg-gradient-to-r from-neon-purple to-neon-cyan text-white font-bold h-11 disabled:opacity-50"
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
        </motion.div>
      )}
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

  // Quick action click - generates a NEW random prompt each time
  const handleQuickAction = useCallback((action: QuickAction) => {
    if (aiLoading) return
    const prompt = action.generate() // Different every click!
    addAiMessage({
      id: Date.now().toString(),
      role: 'user',
      content: prompt,
      timestamp: Date.now(),
    })
    sendToAI(prompt)
  }, [aiLoading, addAiMessage, sendToAI])

  // Toggle voice input - placeholder for future voice recognition
  const toggleVoice = useCallback(() => {
    setIsListening((prev) => !prev)
    if (!isListening) {
      setTimeout(() => {
        const voicePrompts = [
          'اشرح لي آلية عمل القلب',
          'ما هي أسباب ضيق التنفس؟',
          'ما الفرق بين السكري النوع 1 و2؟',
          'اشرح لي التشخيص التفريقي لألم الصدر',
          'ما هي أخطاء شائعة في استخدام المضادات الحيوية؟',
        ]
        setInput(voicePrompts[Math.floor(Math.random() * voicePrompts.length)])
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

  const refreshSubscription = useCallback(() => {
    if (!authToken) return
    fetch('/api/ai/subscription', {
      headers: { Authorization: `Bearer ${authToken}` },
    }).then(res => res.json()).then(data => {
      if (data.success) {
        setActiveSub(data.activeSubscription)
        setPendingSub(data.pendingSubscription)
      }
    }).catch(() => {})
    fetch('/api/ai', {
      headers: { Authorization: `Bearer ${authToken}` },
    }).then(res => res.json()).then(data => {
      if (data.success && data.usage) setAiUsage(data.usage)
    }).catch(() => {})
  }, [authToken])

  return (
    <div dir="rtl" className="flex h-screen w-full bg-med-dark overflow-hidden">
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
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-muted-foreground hover:text-neon-cyan hover:bg-neon-cyan/10 h-8 w-8 hidden lg:flex"
            >
              <BarChart3 className="w-4 h-4" />
            </Button>

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

        {/* ─── Professional Subscription Card (when limit reached) ─────── */}
        {limitReached && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="relative z-10 px-4 pb-2"
          >
            <div className="max-w-3xl mx-auto">
              <div className="relative rounded-2xl border border-neon-purple/20 bg-gradient-to-b from-med-dark/90 via-med-darker/90 to-med-dark/90 backdrop-blur-xl p-5 shadow-[0_0_40px_rgba(168,85,247,0.1)] overflow-hidden">
                {/* Decorative corner accents */}
                <div className="absolute top-0 left-0 w-16 h-16 bg-gradient-to-br from-neon-purple/10 to-transparent rounded-br-full" />
                <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-neon-cyan/10 to-transparent rounded-tl-full" />

                <SubscriptionCard
                  authToken={authToken}
                  onSubscribed={refreshSubscription}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── Quick Actions ───────────────────────────────────────────────── */}
        <div className="relative z-10 px-4 pb-2">
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {QUICK_ACTIONS.map((action) => (
                <motion.button
                  key={action.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleQuickAction(action)}
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
              <p className="text-[10px] text-muted-foreground text-center">
                اشترك للحصول على رسائل غير محدودة ✨
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
