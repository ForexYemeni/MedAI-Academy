'use client'

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart, Activity, Thermometer, Wind, Droplets, Lock, Clock, Play,
  Stethoscope, FlaskConical, Pill, Syringe, PhoneForwarded, ChevronLeft,
  Timer, CheckCircle2, XCircle, AlertTriangle, Star, Zap, Award,
  RotateCcw, Trophy, ArrowRight, Shield, Brain, Eye, User,
  FileText, ClipboardList, Siren, BedDouble
} from 'lucide-react'
import { useAppStore, SimulationCase } from '@/store/app-store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'

// ─── Types ───────────────────────────────────────────────────────────
interface DecisionEntry {
  id: string
  action: string
  actionAr: string
  detail: string
  detailAr: string
  timestamp: number
  isCorrect: boolean
  feedback?: string
}

interface SimulationEvaluation {
  score: number
  correctActions: string[]
  missedActions: string[]
  performanceBreakdown: { label: string; labelAr: string; score: number; max: number }[]
  timeTaken: number
  xpEarned: number
}

// ─── Difficulty Config ───────────────────────────────────────────────
const difficultyConfig: Record<string, { color: string; bg: string; border: string; label: string }> = {
  easy: { color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/30', label: 'سهل' },
  medium: { color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/30', label: 'متوسط' },
  hard: { color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/30', label: 'صعب' },
  expert: { color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/30', label: 'خبير' },
}

const specialtyConfig: Record<string, { icon: React.ElementType; label: string }> = {
  emergency: { icon: Siren, label: 'طب الطوارئ' },
  neurology: { icon: Brain, label: 'الأعصاب' },
  icu: { icon: BedDouble, label: 'العناية المركزة' },
  internal: { icon: Stethoscope, label: 'الباطني' },
  cardiology: { icon: Heart, label: 'القلب' },
  surgery: { icon: Syringe, label: 'الجراحة' },
}

// ─── Medical Action Dialog Data ─────────────────────────────────────
const actionOptions: Record<string, { id: string; label: string; isCorrect: boolean; feedback: string }[]> = {
  examine: [
    { id: 'ex-airway', label: 'فحص المجرى الهوائي', isCorrect: true, feedback: 'أحسنت! فحص المجرى الهوائي خطوة أساسية.' },
    { id: 'ex-breathing', label: 'تقييم التنفس', isCorrect: true, feedback: 'ممتاز! تقييم التنفس ضروري.' },
    { id: 'ex-circulation', label: 'فحص الدورة الدموية', isCorrect: true, feedback: 'صحيح! تقييم الدورة الدموية مهم.' },
    { id: 'ex-neuro', label: 'تقييم عصبي', isCorrect: true, feedback: 'جيد! التقييم العصبي يساعد في التشخيص.' },
    { id: 'ex-abdomen', label: 'فحص البطن', isCorrect: false, feedback: 'فحص البطن ليس أولوية الآن.' },
  ],
  tests: [
    { id: 't-cbc', label: 'تعداد دم شامل (CBC)', isCorrect: true, feedback: 'أحسنت! فحص الدم الشامل مهم.' },
    { id: 't-bmp', label: 'شوارد وكلى (BMP)', isCorrect: true, feedback: 'ممتاز! فحص الشوارد ضروري.' },
    { id: 't-ecg', label: 'تخطيط قلب (ECG)', isCorrect: true, feedback: 'صحيح! ECG مهم في هذه الحالة.' },
    { id: 't-xray', label: 'أشعة صدر', isCorrect: true, feedback: 'جيد! أشعة الصدر تساعد في التقييم.' },
    { id: 't-ct', label: 'أشعة مقطعية (CT)', isCorrect: false, feedback: 'CT ليس ضرورياً في هذه المرحلة.' },
  ],
  medication: [
    { id: 'm-oxygen', label: 'أوكسجين', isCorrect: true, feedback: 'أحسنت! الأوكسجين هو الخطوة الأولى.' },
    { id: 'm-fluids', label: 'سوائل وريدية', isCorrect: true, feedback: 'ممتاز! السوائل الوريدية مهمة.' },
    { id: 'm-epinephrine', label: 'أدرينالين', isCorrect: true, feedback: 'صحيح! الأدرينالين قد يكون منقذاً.' },
    { id: 'm-antibiotic', label: 'مضاد حيوي', isCorrect: false, feedback: 'مضاد حيوي ليس ضرورياً حالياً.' },
    { id: 'm-sedative', label: 'مهدئ', isCorrect: false, feedback: 'المهدئ ليس مناسباً الآن.' },
  ],
  procedure: [
    { id: 'p-intubation', label: 'تنبيب', isCorrect: true, feedback: 'أحسنت! التنبيب قد ينقذ الحياة.' },
    { id: 'p-cpr', label: 'إنعاش قلبي رئوي', isCorrect: true, feedback: 'ممتاز! CPR خطوة حاسمة.' },
    { id: 'p-cvp', label: 'خط وريدي مركزي', isCorrect: false, feedback: 'لا حاجة لخط مركزي الآن.' },
    { id: 'p-chest-tube', label: 'أنبوب صدري', isCorrect: false, feedback: 'لا يوجد استرواح صدري.' },
  ],
  consult: [
    { id: 'c-icu', label: 'استشارة العناية المركزة', isCorrect: true, feedback: 'أحسنت! استشارة ICU مهمة.' },
    { id: 'c-cardio', label: 'استشارة القلب', isCorrect: true, feedback: 'ممتاز! استشارة القلب مفيدة.' },
    { id: 'c-surgery', label: 'استشارة الجراحة', isCorrect: false, feedback: 'لا حاجة لاستشارة جراحية حالياً.' },
    { id: 'c-neuro', label: 'استشارة الأعصاب', isCorrect: false, feedback: 'استشارة الأعصاب ليست أولوية.' },
  ],
}

// ─── ECG Wave SVG Component ─────────────────────────────────────────
function ECGWave({ color = '#00ff88', height = 50, width = 300 }: { color?: string; height?: number; width?: number }) {
  const pathRef = useRef<SVGPathElement>(null)
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    let animFrame: number
    let lastTime = 0
    const speed = 80

    const animate = (time: number) => {
      if (lastTime) {
        const delta = (time - lastTime) / 1000
        setOffset(prev => {
          const next = prev + speed * delta
          return next > 600 ? 0 : next
        })
      }
      lastTime = time
      animFrame = requestAnimationFrame(animate)
    }
    animFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animFrame)
  }, [])

  const ecgPath = useMemo(() => {
    const mid = height / 2
    const amp = height * 0.35
    const segWidth = 60
    const numSegs = Math.ceil(width / segWidth) + 2
    let d = ''
    for (let i = 0; i < numSegs; i++) {
      const x = i * segWidth
      d += `M ${x},${mid} `
      d += `L ${x + 8},${mid} `
      d += `L ${x + 12},${mid - amp * 0.15} `
      d += `L ${x + 16},${mid + amp * 0.3} `
      d += `L ${x + 20},${mid - amp} `
      d += `L ${x + 24},${mid + amp * 0.5} `
      d += `L ${x + 28},${mid - amp * 0.1} `
      d += `L ${x + 32},${mid} `
      d += `L ${x + 42},${mid} `
      d += `L ${x + 50},${mid - amp * 0.2} `
      d += `L ${x + 55},${mid - amp * 0.2} `
      d += `L ${x + 60},${mid} `
    }
    return d
  }, [height, width])

  return (
    <svg width={width} height={height} className="overflow-hidden" style={{ direction: 'ltr' }}>
      <defs>
        <linearGradient id="ecgGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity="0" />
          <stop offset="30%" stopColor={color} stopOpacity="1" />
          <stop offset="70%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <filter id="ecgGlow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g transform={`translate(${-offset}, 0)`}>
        <path
          ref={pathRef}
          d={ecgPath}
          fill="none"
          stroke="url(#ecgGrad)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#ecgGlow)"
        />
      </g>
    </svg>
  )
}

// ─── SpO2 Waveform ──────────────────────────────────────────────────
function SpO2Wave({ color = '#00ccff', height = 30, width = 200 }: { color?: string; height?: number; width?: number }) {
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    let animFrame: number
    let lastTime = 0
    const speed = 60

    const animate = (time: number) => {
      if (lastTime) {
        const delta = (time - lastTime) / 1000
        setOffset(prev => {
          const next = prev + speed * delta
          return next > 400 ? 0 : next
        })
      }
      lastTime = time
      animFrame = requestAnimationFrame(animate)
    }
    animFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animFrame)
  }, [])

  const path = useMemo(() => {
    const mid = height / 2
    const amp = height * 0.3
    const segWidth = 40
    const numSegs = Math.ceil(width / segWidth) + 3
    let d = ''
    for (let i = 0; i < numSegs; i++) {
      const x = i * segWidth
      d += `M ${x},${mid} `
      d += `C ${x + 10},${mid - amp} ${x + 15},${mid - amp} ${x + 20},${mid} `
      d += `C ${x + 25},${mid + amp * 0.3} ${x + 30},${mid + amp * 0.3} ${x + 40},${mid} `
    }
    return d
  }, [height, width])

  return (
    <svg width={width} height={height} className="overflow-hidden" style={{ direction: 'ltr' }}>
      <defs>
        <linearGradient id="spo2Grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity="0" />
          <stop offset="30%" stopColor={color} stopOpacity="1" />
          <stop offset="70%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <g transform={`translate(${-offset}, 0)`}>
        <path d={path} fill="none" stroke="url(#spo2Grad)" strokeWidth="1.5" strokeLinecap="round" />
      </g>
    </svg>
  )
}

// ─── Circular Timer ─────────────────────────────────────────────────
function CircularTimer({ timeLeft, totalTime }: { timeLeft: number; totalTime: number }) {
  const radius = 44
  const circumference = 2 * Math.PI * radius
  const progress = timeLeft / totalTime
  const strokeDashoffset = circumference * (1 - progress)
  const isUrgent = timeLeft <= 60

  return (
    <div className="relative flex items-center justify-center">
      <svg width="110" height="110" className="transform -rotate-90">
        <circle cx="55" cy="55" r={radius} fill="none" stroke="rgba(0,245,255,0.1)" strokeWidth="6" />
        <circle
          cx="55" cy="55" r={radius} fill="none"
          stroke={isUrgent ? '#ef4444' : '#00f5ff'}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-linear"
          style={{ filter: `drop-shadow(0 0 6px ${isUrgent ? '#ef4444' : '#00f5ff'})` }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-xl font-mono font-bold ${isUrgent ? 'text-red-400' : 'text-cyan-400'}`}>
          {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
        </span>
        <span className="text-[10px] text-muted-foreground">متبقي</span>
      </div>
    </div>
  )
}

// ─── Vital Sign Display ─────────────────────────────────────────────
function VitalSign({
  label, value, unit, icon: Icon, color, isAbnormal, wave
}: {
  label: string
  value: string | number
  unit: string
  icon: React.ElementType
  color: string
  isAbnormal: boolean
  wave?: React.ReactNode
}) {
  const [flicker, setFlicker] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setFlicker(true)
      setTimeout(() => setFlicker(false), 50)
    }, 3000 + Math.random() * 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className={`relative flex flex-col gap-1 p-3 rounded-lg border transition-all ${
      isAbnormal
        ? 'border-red-500/30 bg-red-500/5'
        : 'border-cyan-500/10 bg-cyan-500/5'
    }`}>
      <div className="flex items-center gap-1.5">
        <Icon className={`size-3.5 ${isAbnormal ? 'text-red-400' : color}`} />
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-mono font-bold tabular-nums transition-opacity duration-50 ${
          isAbnormal
            ? 'text-red-400'
            : color
        } ${flicker ? 'opacity-70' : 'opacity-100'}`}
          style={isAbnormal ? { textShadow: '0 0 10px rgba(239,68,68,0.5)' } : {}}
        >
          {value}
        </span>
        <span className="text-xs text-muted-foreground">{unit}</span>
      </div>
      {wave && <div className="mt-1 overflow-hidden rounded">{wave}</div>}
      {isAbnormal && (
        <motion.div
          className="absolute top-1 left-1"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <AlertTriangle className="size-3 text-red-400" />
        </motion.div>
      )}
    </div>
  )
}

// ─── Simulation Cases Grid ──────────────────────────────────────────
function SimulationCasesGrid() {
  const { simulationCases, setActiveSimulation } = useAppStore()
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col gap-6"
      dir="rtl"
    >
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
            <Stethoscope className="size-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground neon-text">غرفة المحاكاة</h1>
            <p className="text-sm text-muted-foreground">تدرب على الحالات السريرية في بيئة آمنة</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/20">
            <Activity className="size-3 ml-1" />
            {simulationCases.length} حالة متاحة
          </Badge>
          <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20">
            <Zap className="size-3 ml-1" />
            اكسب XP
          </Badge>
        </div>
      </div>

      {/* Cases Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {simulationCases.map((simCase, index) => (
            <SimulationCaseCard
              key={simCase?.id ?? index}
              simCase={simCase}
              index={index}
              isHovered={hoveredId === simCase?.id ?? null}
              onHover={setHoveredId}
              onStart={() => setActiveSimulation(simCase)}
            />
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

function SimulationCaseCard({
  simCase, index, isHovered, onHover, onStart
}: {
  simCase: SimulationCase
  index: number
  isHovered: boolean
  onHover: (id: string | null) => void
  onStart: () => void
}) {
  const diff = difficultyConfig[simCase?.difficulty ?? 'medium'] ?? difficultyConfig.medium
  const spec = specialtyConfig[simCase?.specialty ?? 'emergency'] ?? specialtyConfig.emergency
  const SpecIcon = spec.icon

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      onMouseEnter={() => onHover(simCase?.id ?? null)}
      onMouseLeave={() => onHover(null)}
      className="group relative"
    >
      <div className={`relative overflow-hidden rounded-xl border transition-all duration-300 ${
        isHovered
          ? 'border-cyan-500/30 bg-med-card-hover neon-glow'
          : 'border-med-border bg-med-card'
      }`}>
        {/* Heartbeat animation overlay */}
        <motion.div
          className="absolute top-3 left-3 z-10"
          animate={isHovered ? { scale: [1, 1.15, 1, 1.15, 1] } : { scale: 1 }}
          transition={isHovered ? { duration: 0.8, repeat: Infinity } : {}}
        >
          <Heart className={`size-5 ${isHovered ? 'text-red-400 fill-red-400' : 'text-red-400/40'}`}
            style={isHovered ? { filter: 'drop-shadow(0 0 6px rgba(239,68,68,0.5))' } : {}}
          />
        </motion.div>

        {/* Lock overlay */}
        {simCase?.isLocked && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-20 flex items-center justify-center rounded-xl">
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-500/20 border border-purple-500/30">
                <Lock className="size-5 text-purple-400" />
              </div>
              <span className="text-sm text-purple-400 font-medium">حالة مميزة</span>
              <Button size="sm" className="bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30 text-xs">
                <Star className="size-3 ml-1" />
                اشتراك مميز
              </Button>
            </div>
          </div>
        )}

        <div className="p-4 flex flex-col gap-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${diff.bg} border ${diff.border}`}>
                <SpecIcon className={`size-4 ${diff.color}`} />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-sm leading-tight">{simCase?.titleAr ?? ''}</h3>
                <span className="text-xs text-muted-foreground">{spec.label}</span>
              </div>
            </div>
          </div>

          {/* Difficulty & Duration */}
          <div className="flex items-center gap-2">
            <Badge className={`${diff.bg} ${diff.color} border ${diff.border} text-[10px]`}>
              <Shield className="size-2.5 ml-0.5" />
              {diff.label}
            </Badge>
            <Badge className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px]">
              <Clock className="size-2.5 ml-0.5" />
              {simCase?.duration ?? 15} دقيقة
            </Badge>
          </div>

          {/* Symptoms Preview */}
          <div className="flex flex-wrap gap-1.5">
            {(simCase?.symptoms ?? []).slice(0, 3).map((symptom, i) => (
              <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-background/50 text-muted-foreground border border-border">
                {symptom}
              </span>
            ))}
            {(simCase?.symptoms ?? []).length > 3 && (
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-background/50 text-cyan-400 border border-cyan-500/20">
                +{(simCase?.symptoms ?? []).length - 3}
              </span>
            )}
          </div>

          {/* Scenario preview */}
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {simCase?.scenario ?? ''}
          </p>

          {/* Start Button */}
          <Button
            onClick={onStart}
            disabled={simCase?.isLocked ?? false}
            className="w-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 hover:text-cyan-300 transition-all group/btn"
          >
            <Play className="size-4 ml-1 transition-transform group-hover/btn:scale-110" />
            ابدأ المحاكاة
          </Button>
        </div>

        {/* Bottom glow line */}
        <motion.div
          className="h-[2px] bg-gradient-to-l from-transparent via-cyan-500 to-transparent"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          style={{ originX: 1 }}
        />
      </div>
    </motion.div>
  )
}

// ─── Active Simulation View ─────────────────────────────────────────
function ActiveSimulationView({ simCase }: { simCase: SimulationCase }) {
  const { setActiveSimulation, updateUser, user } = useAppStore()
  const [vitals, setVitals] = useState(simCase?.vitals ?? { hr: 80, bp: '120/80', spo2: 98, temp: 37, rr: 16 })
  const [timeLeft, setTimeLeft] = useState((simCase?.duration ?? 15) * 60)
  const [decisions, setDecisions] = useState<DecisionEntry[]>([])
  const [isComplete, setIsComplete] = useState(false)
  const [evaluation, setEvaluation] = useState<SimulationEvaluation | null>(null)
  const [activeDialog, setActiveDialog] = useState<string | null>(null)
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set())
  const [startTime] = useState(Date.now())

  // Timer countdown
  useEffect(() => {
    if (isComplete) return
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleCompleteSimulation()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [isComplete])

  // Vital signs fluctuation
  useEffect(() => {
    if (isComplete) return
    const interval = setInterval(() => {
      setVitals(prev => ({
        hr: Math.max(0, prev.hr + Math.round((Math.random() - 0.5) * 4)),
        bp: prev.bp,
        spo2: Math.min(100, Math.max(0, prev.spo2 + Math.round((Math.random() - 0.5) * 2))),
        temp: Math.round((prev.temp + (Math.random() - 0.5) * 0.1) * 10) / 10,
        rr: Math.max(0, prev.rr + Math.round((Math.random() - 0.5) * 2)),
      }))
    }, 2000)
    return () => clearInterval(interval)
  }, [isComplete])

  // Check for abnormal vitals
  const isHRAbnormal = vitals.hr === 0 || vitals.hr > 120 || vitals.hr < 50
  const isBPAbnormal = vitals.bp === '0/0'
  const isSpo2Abnormal = vitals.spo2 < 92
  const isTempAbnormal = vitals.temp > 38.5 || vitals.temp < 35
  const isRRAbnormal = vitals.rr === 0 || vitals.rr > 24 || vitals.rr < 10

  const handleOpenDialog = useCallback((actionType: string) => {
    setSelectedOptions(new Set())
    setActiveDialog(actionType)
  }, [])

  const handleSelectOption = useCallback((optionId: string) => {
    setSelectedOptions(prev => {
      const next = new Set(prev)
      if (next.has(optionId)) next.delete(optionId)
      else next.add(optionId)
      return next
    })
  }, [])

  const handleConfirmAction = useCallback(() => {
    if (!activeDialog || selectedOptions.size === 0) return

    const options = actionOptions[activeDialog] || []
    const actionLabels: Record<string, string> = {
      examine: 'فحص المريض',
      tests: 'طلب فحوصات',
      medication: 'إعطاء دواء',
      procedure: 'إجراء تدخل',
      consult: 'طلب استشارة',
    }

    selectedOptions.forEach(optId => {
      const option = options.find(o => o.id === optId)
      if (option) {
        setDecisions(prev => [...prev, {
          id: `${Date.now()}-${optId}`,
          action: activeDialog,
          actionAr: actionLabels[activeDialog] || activeDialog,
          detail: option.id,
          detailAr: option.label,
          timestamp: Date.now(),
          isCorrect: option.isCorrect,
          feedback: option.feedback,
        }])
      }
    })

    setActiveDialog(null)
    setSelectedOptions(new Set())
  }, [activeDialog, selectedOptions])

  const handleCompleteSimulation = useCallback(() => {
    setIsComplete(true)

    const correctCount = decisions.filter(d => d.isCorrect).length
    const totalPossibleCorrect = Object.values(actionOptions)
      .flat()
      .filter(o => o.isCorrect).length
    const takenCorrect = new Set(decisions.filter(d => d.isCorrect).map(d => d.detail)).size

    const score = Math.min(100, Math.round((takenCorrect / totalPossibleCorrect) * 100))
    const timeTaken = Math.round((Date.now() - startTime) / 1000)
    const xpEarned = Math.round(score * 1.5)

    const allCorrectActionIds = Object.values(actionOptions).flat().filter(o => o.isCorrect).map(o => o.id)
    const takenActionIds = new Set(decisions.map(d => d.detail))
    const missedActions = Object.values(actionOptions)
      .flat()
      .filter(o => o.isCorrect && !takenActionIds.has(o.id))
      .map(o => o.label)
    const correctActions = Object.values(actionOptions)
      .flat()
      .filter(o => o.isCorrect && takenActionIds.has(o.id))
      .map(o => o.label)

    setEvaluation({
      score,
      correctActions,
      missedActions,
      performanceBreakdown: [
        { label: 'Examination', labelAr: 'الفحص السريري', score: decisions.filter(d => d.action === 'examine' && d.isCorrect).length, max: actionOptions.examine.filter(o => o.isCorrect).length },
        { label: 'Lab Tests', labelAr: 'الفحوصات', score: decisions.filter(d => d.action === 'tests' && d.isCorrect).length, max: actionOptions.tests.filter(o => o.isCorrect).length },
        { label: 'Medication', labelAr: 'الأدوية', score: decisions.filter(d => d.action === 'medication' && d.isCorrect).length, max: actionOptions.medication.filter(o => o.isCorrect).length },
        { label: 'Procedures', labelAr: 'التدخلات', score: decisions.filter(d => d.action === 'procedure' && d.isCorrect).length, max: actionOptions.procedure.filter(o => o.isCorrect).length },
        { label: 'Consultations', labelAr: 'الاستشارات', score: decisions.filter(d => d.action === 'consult' && d.isCorrect).length, max: actionOptions.consult.filter(o => o.isCorrect).length },
      ],
      timeTaken,
      xpEarned,
    })

    updateUser({ xp: user.xp + xpEarned })
  }, [decisions, startTime, updateUser, user.xp])

  const handleExitSimulation = useCallback(() => {
    setActiveSimulation(null)
  }, [setActiveSimulation])

  const actionButtons = [
    { key: 'examine', icon: Stethoscope, label: 'فحص المريض', color: 'cyan' },
    { key: 'tests', icon: FlaskConical, label: 'طلب فحوصات', color: 'emerald' },
    { key: 'medication', icon: Pill, label: 'إعطاء دواء', color: 'amber' },
    { key: 'procedure', icon: Syringe, label: 'إجراء تدخل', color: 'red' },
    { key: 'consult', icon: PhoneForwarded, label: 'طلب استشارة', color: 'purple' },
  ]

  const colorMap: Record<string, { bg: string; border: string; text: string; hoverBg: string }> = {
    cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400', hoverBg: 'hover:bg-cyan-500/20' },
    emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', hoverBg: 'hover:bg-emerald-500/20' },
    amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', hoverBg: 'hover:bg-amber-500/20' },
    red: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', hoverBg: 'hover:bg-red-500/20' },
    purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400', hoverBg: 'hover:bg-purple-500/20' },
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col gap-4 min-h-screen"
      dir="rtl"
    >
      {/* ─── Top Bar ─── */}
      <div className="flex items-center justify-between glass-strong rounded-xl p-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleExitSimulation}
            className="text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="size-5 rtl-flip" />
          </Button>
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Siren className="size-5 text-red-400" />
              {simCase?.titleAr ?? ''}
            </h2>
            <span className="text-xs text-muted-foreground">{specialtyConfig[simCase?.specialty ?? 'emergency']?.label}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Timer */}
          {!isComplete && (
            <div className="flex items-center gap-2">
              <CircularTimer timeLeft={timeLeft} totalTime={(simCase?.duration ?? 15) * 60} />
            </div>
          )}
          {!isComplete && (
            <Button
              onClick={handleCompleteSimulation}
              className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
            >
              <CheckCircle2 className="size-4 ml-1" />
              إنهاء المحاكاة
            </Button>
          )}
        </div>
      </div>

      {/* ─── Vital Signs Monitor ─── */}
      {!isComplete && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-cyan-500/15 bg-card p-4 relative overflow-hidden"
        >
          {/* Scanline effect */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,245,255,0.1) 2px, rgba(0,245,255,0.1) 4px)',
            }}
          />

          {/* Monitor Header */}
          <div className="flex items-center gap-2 mb-3">
            <Activity className="size-4 text-cyan-400" />
            <span className="text-xs font-mono text-cyan-400 tracking-wider">VITAL SIGNS MONITOR</span>
            <div className="flex-1" />
            <motion.div
              className="flex items-center gap-1"
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] font-mono text-emerald-400">LIVE</span>
            </motion.div>
          </div>

          {/* Vitals Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <VitalSign
              label="HR"
              value={vitals.hr}
              unit="bpm"
              icon={Heart}
              color="text-green-400"
              isAbnormal={isHRAbnormal}
              wave={<ECGWave color={isHRAbnormal ? '#ef4444' : '#00ff88'} height={40} width={200} />}
            />
            <VitalSign
              label="BP"
              value={vitals.bp}
              unit="mmHg"
              icon={Activity}
              color="text-cyan-400"
              isAbnormal={isBPAbnormal}
            />
            <VitalSign
              label="SpO2"
              value={vitals.spo2}
              unit="%"
              icon={Droplets}
              color="text-cyan-300"
              isAbnormal={isSpo2Abnormal}
              wave={<SpO2Wave color={isSpo2Abnormal ? '#ef4444' : '#00ccff'} height={30} width={200} />}
            />
            <VitalSign
              label="TEMP"
              value={vitals.temp.toFixed(1)}
              unit="°C"
              icon={Thermometer}
              color="text-amber-400"
              isAbnormal={isTempAbnormal}
            />
            <VitalSign
              label="RR"
              value={vitals.rr}
              unit="/min"
              icon={Wind}
              color="text-emerald-400"
              isAbnormal={isRRAbnormal}
            />
          </div>
        </motion.div>
      )}

      {/* ─── Main Content Area ─── */}
      {!isComplete ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Patient Info Panel */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <User className="size-4 text-cyan-400" />
                <h3 className="font-bold text-foreground">معلومات المريض</h3>
              </div>

              <div className="bg-background/30 rounded-lg p-4 mb-3 border border-border">
                <div className="flex items-start gap-2 mb-2">
                  <FileText className="size-4 text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-foreground leading-relaxed">{simCase?.scenario ?? ''}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <ClipboardList className="size-4 text-red-400" />
                <h4 className="text-sm font-semibold text-foreground">الأعراض</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {(simCase?.symptoms ?? []).map((symptom, i) => (
                  <span key={i} className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                    {symptom}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <Syringe className="size-4 text-cyan-400" />
                <h3 className="font-bold text-foreground">الإجراءات الطبية</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {actionButtons.map(btn => {
                  const c = colorMap[btn.color]
                  const BtnIcon = btn.icon
                  return (
                    <motion.button
                      key={btn.key}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleOpenDialog(btn.key)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${c.bg} ${c.border} ${c.text} ${c.hoverBg}`}
                    >
                      <BtnIcon className="size-5" />
                      <span className="text-xs font-medium text-center">{btn.label}</span>
                    </motion.button>
                  )
                })}
              </div>
            </motion.div>
          </div>

          {/* Decision History */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <Timer className="size-4 text-cyan-400" />
              <h3 className="font-bold text-foreground">سجل القرارات</h3>
              <Badge className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] mr-auto">
                {decisions.length} إجراء
              </Badge>
            </div>

            <ScrollArea className="max-h-96">
              <div className="flex flex-col gap-2">
                <AnimatePresence>
                  {decisions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <Eye className="size-8 mb-2 opacity-30" />
                      <span className="text-xs">لم تتخذ أي إجراء بعد</span>
                    </div>
                  ) : (
                    decisions.map((decision, i) => (
                      <motion.div
                        key={decision.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 }}
                        className={`flex items-start gap-2 p-2.5 rounded-lg border text-xs ${
                          decision.isCorrect
                            ? 'bg-emerald-500/5 border-emerald-500/20'
                            : 'bg-red-500/5 border-red-500/20'
                        }`}
                      >
                        {decision.isCorrect ? (
                          <CheckCircle2 className="size-3.5 text-emerald-400 mt-0.5 shrink-0" />
                        ) : (
                          <XCircle className="size-3.5 text-red-400 mt-0.5 shrink-0" />
                        )}
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="font-medium text-foreground">{decision.actionAr}</span>
                          <span className="text-muted-foreground">{decision.detailAr}</span>
                          {decision.feedback && (
                            <span className={`text-[10px] ${decision.isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                              {decision.feedback}
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground/60">
                            {new Date(decision.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </motion.div>
        </div>
      ) : (
        /* ─── AI Evaluation ─── */
        evaluation && <AIEvaluation evaluation={evaluation} onRestart={handleExitSimulation} />
      )}

      {/* ─── Action Dialogs ─── */}
      <Dialog open={!!activeDialog} onOpenChange={(open) => { if (!open) setActiveDialog(null) }}>
        <DialogContent className="glass-strong border-cyan-500/20 max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              {activeDialog === 'examine' && <Stethoscope className="size-5 text-cyan-400" />}
              {activeDialog === 'tests' && <FlaskConical className="size-5 text-emerald-400" />}
              {activeDialog === 'medication' && <Pill className="size-5 text-amber-400" />}
              {activeDialog === 'procedure' && <Syringe className="size-5 text-red-400" />}
              {activeDialog === 'consult' && <PhoneForwarded className="size-5 text-purple-400" />}
              {activeDialog === 'examine' && 'فحص المريض'}
              {activeDialog === 'tests' && 'طلب فحوصات'}
              {activeDialog === 'medication' && 'إعطاء دواء'}
              {activeDialog === 'procedure' && 'إجراء تدخل'}
              {activeDialog === 'consult' && 'طلب استشارة'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              اختر الإجراءات المناسبة لحالة المريض
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            {(actionOptions[activeDialog || ''] || []).map(option => (
              <button
                key={option.id}
                onClick={() => handleSelectOption(option.id)}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-right ${
                  selectedOptions.has(option.id)
                    ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                    : 'bg-background/30 border-border text-foreground hover:bg-background/50'
                }`}
              >
                <div className={`flex items-center justify-center w-5 h-5 rounded border shrink-0 ${
                  selectedOptions.has(option.id)
                    ? 'bg-cyan-500 border-cyan-500'
                    : 'border-border'
                }`}>
                  {selectedOptions.has(option.id) && <CheckCircle2 className="size-3 text-white" />}
                </div>
                <span className="text-sm">{option.label}</span>
              </button>
            ))}
          </div>

          <DialogFooter className="flex-row gap-2 sm:justify-start">
            <Button
              onClick={handleConfirmAction}
              disabled={selectedOptions.size === 0}
              className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20"
            >
              <CheckCircle2 className="size-4 ml-1" />
              تأكيد ({selectedOptions.size})
            </Button>
            <Button
              variant="ghost"
              onClick={() => setActiveDialog(null)}
              className="text-muted-foreground"
            >
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

// ─── AI Evaluation Component ────────────────────────────────────────
function AIEvaluation({
  evaluation, onRestart
}: {
  evaluation: SimulationEvaluation
  onRestart: () => void
}) {
  const [showDetails, setShowDetails] = useState(false)

  const scoreColor = evaluation.score >= 80 ? 'text-emerald-400' :
    evaluation.score >= 60 ? 'text-yellow-400' :
    evaluation.score >= 40 ? 'text-amber-400' : 'text-red-400'

  const scoreGrade = evaluation.score >= 90 ? 'ممتاز' :
    evaluation.score >= 80 ? 'جيد جداً' :
    evaluation.score >= 60 ? 'جيد' :
    evaluation.score >= 40 ? 'مقبول' : 'يحتاج تحسين'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col gap-6"
    >
      {/* Score Card */}
      <div className="glass-card rounded-xl p-6 flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.3, stiffness: 200 }}
        >
          <Trophy className="size-12 text-amber-400 mb-2" style={{ filter: 'drop-shadow(0 0 10px rgba(245,158,11,0.4))' }} />
        </motion.div>

        <h2 className="text-xl font-bold text-foreground mb-1">تقييم المحاكاة</h2>
        <p className="text-sm text-muted-foreground mb-4">تم إنهاء المحاكاة بنجاح</p>

        {/* Score Circle */}
        <div className="relative flex items-center justify-center mb-4">
          <svg width="140" height="140" className="transform -rotate-90">
            <circle cx="70" cy="70" r="58" fill="none" stroke="rgba(0,245,255,0.1)" strokeWidth="8" />
            <motion.circle
              cx="70" cy="70" r="58" fill="none"
              stroke={evaluation.score >= 80 ? '#10b981' : evaluation.score >= 60 ? '#f59e0b' : '#ef4444'}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 58}
              initial={{ strokeDashoffset: 2 * Math.PI * 58 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 58 * (1 - evaluation.score / 100) }}
              transition={{ duration: 1.5, delay: 0.5 }}
              style={{ filter: 'drop-shadow(0 0 8px rgba(0,245,255,0.4))' }}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <motion.span
              className={`text-4xl font-mono font-bold ${scoreColor}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              style={{ textShadow: `0 0 20px ${evaluation.score >= 80 ? 'rgba(16,185,129,0.5)' : evaluation.score >= 60 ? 'rgba(245,158,11,0.5)' : 'rgba(239,68,68,0.5)'}` }}
            >
              {evaluation.score}
            </motion.span>
            <span className="text-xs text-muted-foreground">من 100</span>
          </div>
        </div>

        <Badge className={`${scoreColor} bg-background/30 border-border text-sm px-3 py-1`}>
          <Award className="size-3.5 ml-1" />
          {scoreGrade}
        </Badge>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mt-6 w-full">
          <div className="flex flex-col items-center gap-1">
            <Zap className="size-5 text-amber-400" />
            <span className="text-lg font-bold text-amber-400">+{evaluation.xpEarned}</span>
            <span className="text-[10px] text-muted-foreground">XP مكتسب</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Clock className="size-5 text-cyan-400" />
            <span className="text-lg font-bold text-cyan-400">
              {Math.floor(evaluation.timeTaken / 60)}:{(evaluation.timeTaken % 60).toString().padStart(2, '0')}
            </span>
            <span className="text-[10px] text-muted-foreground">الوقت المستغرق</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <CheckCircle2 className="size-5 text-emerald-400" />
            <span className="text-lg font-bold text-emerald-400">{evaluation.correctActions.length}</span>
            <span className="text-[10px] text-muted-foreground">إجراء صحيح</span>
          </div>
        </div>
      </div>

      {/* Performance Breakdown */}
      <div className="glass-card rounded-xl p-4">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-2 w-full text-right"
        >
          <Activity className="size-4 text-cyan-400" />
          <h3 className="font-bold text-foreground flex-1">تفاصيل الأداء</h3>
          <ArrowRight className={`size-4 text-muted-foreground transition-transform ${showDetails ? 'rotate-90' : ''}`} />
        </button>

        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-3 mt-4">
                {evaluation.performanceBreakdown.map((item, i) => (
                  <div key={i} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground">{item.labelAr}</span>
                      <span className="text-muted-foreground font-mono">{item.score}/{item.max}</span>
                    </div>
                    <Progress
                      value={item.max > 0 ? (item.score / item.max) * 100 : 0}
                      className="h-2 bg-cyan-500/10"
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Correct & Missed Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="size-4 text-emerald-400" />
            <h3 className="font-bold text-foreground text-sm">ما تم بشكل صحيح</h3>
          </div>
          <ScrollArea className="max-h-48">
            <div className="flex flex-col gap-1.5">
              {evaluation.correctActions.length > 0 ? evaluation.correctActions.map((action, i) => (
                <div key={i} className="flex items-center gap-2 text-xs p-2 rounded bg-emerald-500/5 border border-emerald-500/10">
                  <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />
                  <span className="text-emerald-400">{action}</span>
                </div>
              )) : (
                <span className="text-xs text-muted-foreground">لم تُنفذ أي إجراءات صحيحة</span>
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <XCircle className="size-4 text-red-400" />
            <h3 className="font-bold text-foreground text-sm">ما فاتك</h3>
          </div>
          <ScrollArea className="max-h-48">
            <div className="flex flex-col gap-1.5">
              {evaluation.missedActions.length > 0 ? evaluation.missedActions.map((action, i) => (
                <div key={i} className="flex items-center gap-2 text-xs p-2 rounded bg-red-500/5 border border-red-500/10">
                  <XCircle className="size-3 text-red-400 shrink-0" />
                  <span className="text-red-400">{action}</span>
                </div>
              )) : (
                <span className="text-xs text-emerald-400">أحسنت! لم يفتك شيء مهم 👏</span>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-3">
        <Button
          onClick={onRestart}
          className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20"
        >
          <RotateCcw className="size-4 ml-1" />
          العودة للحالات
        </Button>
      </div>
    </motion.div>
  )
}

// ─── Main Export ─────────────────────────────────────────────────────
export function SimulationPage() {
  const { activeSimulation } = useAppStore()

  return (
    <div className="w-full max-w-7xl mx-auto p-4">
      <AnimatePresence mode="wait">
        {activeSimulation ? (
          <ActiveSimulationView key="active" simCase={activeSimulation} />
        ) : (
          <SimulationCasesGrid key="grid" />
        )}
      </AnimatePresence>
    </div>
  )
}

export default SimulationPage
