'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight, BookOpen, Clock, Play, Pause, CheckCircle2, Lock,
  Crown, Star, Users, ChevronDown, ChevronUp, FileText,
  Video, FileIcon, GraduationCap, Loader2, ArrowLeft,
  Hourglass, X, Volume2, VolumeX, Maximize, Minimize, Heart, Thermometer, Wind, Droplets, Activity, Zap, Siren, Syringe, Stethoscope, User, ClipboardList, RotateCcw, Trophy, Brain, Target, Lightbulb, Award, Shield
} from 'lucide-react'
import { useAppStore, type Course } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { PaymentDialog } from '@/components/med/features/payment-dialog'
import { useToast } from '@/hooks/use-toast'

interface Lesson {
  id: string
  _id?: string
  courseId: string
  title: string
  titleAr: string
  type: 'article' | 'video' | 'pdf' | 'quiz' | 'flashcard' | 'simulation'
  order: number
  content?: string
  videoUrl?: string
  videoType?: 'youtube' | 'external'
  pdfUrl?: string
  pdfName?: string
  duration?: number
  isFree: boolean
  isLocked?: boolean
  published?: boolean
  quizData?: { question: string; options: string[]; correctIndex: number; explanation: string }[]
  flashcardData?: { front: string; back: string }[]
  simulationData?: { patientInfo: string; vitals: { hr: number; bp: string; spo2: number; temp: number; rr: number }; symptoms: string[]; diagnosis: string; treatment: string; actions: string[] }
}

const categoryGradients: Record<string, string> = {
  emergency: 'from-red-600/80 via-orange-500/60 to-yellow-500/40',
  cardiology: 'from-pink-600/80 via-rose-500/60 to-red-400/40',
  neurology: 'from-purple-600/80 via-violet-500/60 to-indigo-400/40',
  pediatrics: 'from-cyan-600/80 via-teal-500/60 to-emerald-400/40',
  surgery: 'from-blue-600/80 via-indigo-500/60 to-purple-400/40',
  internal: 'from-emerald-600/80 via-green-500/60 to-lime-400/40',
  radiology: 'from-amber-600/80 via-yellow-500/60 to-orange-400/40',
  pharmacology: 'from-fuchsia-600/80 via-pink-500/60 to-rose-400/40',
}

const categoryIcons: Record<string, string> = {
  emergency: '🚑',
  cardiology: '❤️',
  neurology: '🧠',
  pediatrics: '👶',
  surgery: '🔪',
  internal: '🩺',
  radiology: '🔬',
  pharmacology: '💊',
}

const levelConfig = {
  beginner: { label: 'مبتدئ', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  intermediate: { label: 'متوسط', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  advanced: { label: 'متقدم', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
}

function getYouTubeId(url: string): string | null {
  if (!url) return null
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

// ─── Professional Video Player ──
// CRITICAL: Sound ONLY works when user clicks INSIDE the YouTube iframe directly.
// Browser autoplay policies block programmatic playVideo()/unMute() from parent page.
// NO overlay blocking the YouTube player - user must click YouTube's own play button.
// IFrame API attached to iframe only for state detection + mute/fullscreen controls.
function DetailVideoPlayer({ ytId, duration }: { ytId: string; duration?: number }) {
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const playerRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const origin = typeof window !== 'undefined' ? encodeURIComponent(window.location.origin) : ''
  const embedUrl = `https://www.youtube.com/embed/${ytId}?autoplay=0&mute=0&controls=1&modestbranding=1&rel=0&iv_load_policy=3&fs=1&playsinline=1&enablejsapi=1&origin=${origin}`

  // Attach IFrame API to existing iframe for state detection + custom controls
  useEffect(() => {
    if (!iframeRef.current) return

    const loadYTAPI = (): Promise<void> => {
      return new Promise((resolve) => {
        if ((window as any).YT && (window as any).YT.Player) {
          resolve()
          return
        }
        const tag = document.createElement('script')
        tag.src = 'https://www.youtube.com/iframe_api'
        const firstScriptTag = document.getElementsByTagName('script')[0]
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)
        ;(window as any).onYouTubeIframeAPIReady = () => resolve()
      })
    }

    const attachPlayer = async () => {
      await loadYTAPI()
      const YT = (window as any).YT
      if (!YT || !YT.Player || !iframeRef.current) return

      try {
        playerRef.current = new YT.Player(iframeRef.current, {
          events: {
            onReady: () => {},
            onStateChange: (event: any) => {
              if (event.data === YT.PlayerState.PLAYING) setPlaying(true)
              if (event.data === YT.PlayerState.PAUSED) setPlaying(false)
              if (event.data === YT.PlayerState.ENDED) setPlaying(false)
            }
          }
        })
      } catch {}
    }

    const timer = setTimeout(attachPlayer, 500)

    return () => {
      clearTimeout(timer)
      if (playerRef.current) {
        try { playerRef.current.destroy() } catch {}
        playerRef.current = null
      }
    }
  }, [ytId])

  useEffect(() => {
    const handleFSChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handleFSChange)
    return () => document.removeEventListener('fullscreenchange', handleFSChange)
  }, [])

  const toggleMute = () => {
    if (!playerRef.current) return
    try {
      if (muted) {
        playerRef.current.unMute()
        playerRef.current.setVolume(100)
        setMuted(false)
      } else {
        playerRef.current.mute()
        setMuted(true)
      }
    } catch {}
  }

  const toggleFullscreen = () => {
    if (!containerRef.current) return
    try {
      if (document.fullscreenElement) document.exitFullscreen()
      else containerRef.current.requestFullscreen()
    } catch {}
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-black rounded-xl overflow-hidden"
      style={{ aspectRatio: '16/9' }}
    >
      {/* YouTube iframe - NO overlay. User clicks YouTube's play button for SOUND. */}
      <iframe
        ref={iframeRef}
        src={embedUrl}
        allow="autoplay; encrypted-media"
        className="absolute inset-0 w-full h-full"
        style={{ border: 'none' }}
        allowFullScreen
      />

      {/* Duration badge - pointer-events:none */}
      {duration && !playing && (
        <div className="absolute bottom-3 left-3 px-2 py-1 rounded bg-black/70 text-white text-[11px] font-medium z-10 pointer-events-none">
          {duration} دقيقة
        </div>
      )}

      {/* CSS Overlays to hide YouTube branding - pointer-events:none */}
      <div
        className="absolute top-0 left-0 right-0 h-[50px] z-20 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 60%, transparent 100%)' }}
      />
      <div
        className="absolute top-0 right-0 w-[44px] bottom-0 z-20 pointer-events-none"
        style={{ background: 'linear-gradient(to left, rgba(0,0,0,0.7) 0%, transparent 100%)' }}
      />

      {/* Custom mute + fullscreen controls - only after playback starts */}
      {playing && (
        <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5">
          <button
            onClick={toggleMute}
            className="w-8 h-8 rounded-lg bg-black/60 hover:bg-black/80 flex items-center justify-center transition-colors"
          >
            {muted ? <VolumeX className="w-4 h-4 text-amber-400" /> : <Volume2 className="w-4 h-4 text-white" />}
          </button>
          <button
            onClick={toggleFullscreen}
            className="w-8 h-8 rounded-lg bg-black/60 hover:bg-black/80 flex items-center justify-center transition-colors"
          >
            {isFullscreen ? <Minimize className="w-4 h-4 text-white" /> : <Maximize className="w-4 h-4 text-white" />}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Detail Inline Simulation (Professional with Results) ────────
function DetailInlineSimulation({ lesson }: { lesson: any }) {
  const [phase, setPhase] = useState<'intro' | 'vitals' | 'actions' | 'reveal' | 'results'>('intro')
  const [selectedActions, setSelectedActions] = useState<string[]>([])
  const [startTime] = useState(Date.now())
  const simData = lesson.simulationData

  const vitals = simData?.vitals || { hr: 0, bp: '--', spo2: 0, temp: 0, rr: 0 }
  const symptoms = simData?.symptoms || []
  const actions = simData?.actions || []
  const diagnosis = simData?.diagnosis || ''
  const treatment = simData?.treatment || ''
  const patientInfo = simData?.patientInfo || ''

  const isHRAbnormal = vitals.hr > 100 || vitals.hr < 60
  const isSpo2Abnormal = vitals.spo2 < 94
  const isTempAbnormal = vitals.temp > 38 || vitals.temp < 36
  const isRRAbnormal = vitals.rr > 20 || vitals.rr < 12

  const calculateScore = () => {
    if (actions.length === 0) return 0
    const correctCount = selectedActions.filter(a => actions.includes(a)).length
    return Math.round((correctCount / actions.length) * 100)
  }
  const score = calculateScore()
  const missedActions = actions.filter(a => !selectedActions.includes(a))
  const correctSelectedActions = selectedActions.filter(a => actions.includes(a))
  const xpEarned = Math.round(score * 1.5)
  const timeTaken = Math.round((Date.now() - startTime) / 1000)
  const scoreColor = score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-yellow-400' : score >= 40 ? 'text-amber-400' : 'text-red-400'
  const scoreGrade = score >= 90 ? 'ممتاز' : score >= 80 ? 'جيد جداً' : score >= 60 ? 'جيد' : score >= 40 ? 'مقبول' : 'يحتاج تحسين'

  if (!simData || (!patientInfo && !diagnosis)) {
    return (
      <div className="py-6 text-center">
        <Activity className="w-12 h-12 text-purple-400/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">لم تتم إضافة بيانات المحاكاة لهذا الدرس بعد</p>
      </div>
    )
  }

  const toggleAction = (action: string) => {
    setSelectedActions(prev => prev.includes(action) ? prev.filter(a => a !== action) : [...prev, action])
  }

  const allPhases = ['intro', 'vitals', 'actions', 'reveal', 'results']

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="py-2">
      <div className="glass-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 pb-3 border-b border-border">
          <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center">
            <Siren className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground">محاكاة تفاعلية</p>
            <p className="text-[10px] text-muted-foreground">
              {phase === 'intro' && 'قراءة الحالة المرضية'}
              {phase === 'vitals' && 'فحص العلامات الحيوية'}
              {phase === 'actions' && 'اتخاذ الإجراءات الطبية'}
              {phase === 'reveal' && 'التشخيص والعلاج'}
              {phase === 'results' && 'نتائج التقييم'}
            </p>
          </div>
          <div className="flex gap-1">
            {allPhases.map((p) => (
              <div key={p} className={`w-2 h-2 rounded-full transition-all ${allPhases.indexOf(phase) >= allPhases.indexOf(p) ? 'bg-purple-400' : 'bg-muted/30'}`} />
            ))}
          </div>
        </div>

        {/* Intro */}
        {phase === 'intro' && (
          <div className="p-5">
            <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/15 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <User className="size-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-foreground">معلومات المريض</h3>
              </div>
              <div className="bg-background/30 rounded-lg p-3 border border-border">
                <p className="text-foreground/80 leading-7 text-sm">{patientInfo}</p>
              </div>
            </div>
            {symptoms.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="size-4 text-red-400" />
                  <p className="text-sm font-semibold text-foreground">الأعراض</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {symptoms.map((s: string, i: number) => (
                    <span key={i} className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-medium">{s}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-end">
              <Button onClick={() => setPhase('vitals')} className="bg-gradient-to-l from-purple-500 to-violet-500 text-white font-bold">
                فحص العلامات الحيوية <ArrowRight className="w-4 h-4 mr-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Vitals */}
        {phase === 'vitals' && (
          <div className="p-5">
            <div className="rounded-xl border border-cyan-500/15 bg-card p-4 relative overflow-hidden mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="size-4 text-cyan-400" />
                <span className="text-xs font-mono text-cyan-400 tracking-wider">VITAL SIGNS MONITOR</span>
                <div className="flex-1" />
                <motion.div className="flex items-center gap-1" animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[10px] font-mono text-emerald-400">LIVE</span>
                </motion.div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                  { label: 'HR', value: vitals.hr, unit: 'bpm', icon: Heart, abnormal: isHRAbnormal },
                  { label: 'BP', value: vitals.bp, unit: 'mmHg', icon: Activity, abnormal: false },
                  { label: 'SpO2', value: vitals.spo2, unit: '%', icon: Droplets, abnormal: isSpo2Abnormal },
                  { label: 'TEMP', value: typeof vitals.temp === 'number' ? vitals.temp.toFixed(1) : vitals.temp, unit: '°C', icon: Thermometer, abnormal: isTempAbnormal },
                  { label: 'RR', value: vitals.rr, unit: '/min', icon: Wind, abnormal: isRRAbnormal },
                ].map((v, i) => {
                  const VIcon = v.icon
                  return (
                    <div key={i} className={`relative flex flex-col gap-1 p-3 rounded-lg border transition-all ${v.abnormal ? 'border-red-500/30 bg-red-500/5' : 'border-cyan-500/10 bg-cyan-500/5'}`}>
                      <div className="flex items-center gap-1.5">
                        <VIcon className={`size-3.5 ${v.abnormal ? 'text-red-400' : 'text-cyan-400'}`} />
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{v.label}</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className={`text-xl font-mono font-bold tabular-nums ${v.abnormal ? 'text-red-400' : 'text-neon-green'}`}>{v.value}</span>
                        <span className="text-[10px] text-muted-foreground">{v.unit}</span>
                      </div>
                      {v.abnormal && (
                        <motion.div className="absolute top-1 left-1" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                          <Zap className="size-3 text-red-400" />
                        </motion.div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="flex justify-between">
              <Button onClick={() => setPhase('intro')} variant="ghost" className="text-muted-foreground">رجوع</Button>
              <Button onClick={() => setPhase('actions')} className="bg-gradient-to-l from-purple-500 to-violet-500 text-white font-bold">
                اتخاذ الإجراءات <ArrowRight className="w-4 h-4 mr-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Actions */}
        {phase === 'actions' && (
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Syringe className="size-4 text-cyan-400" />
              <h3 className="font-bold text-foreground text-sm">الإجراءات الطبية</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">اختر الإجراءات المناسبة للحالة:</p>
            <div className="space-y-2 mb-4">
              {actions.map((action: string, i: number) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => toggleAction(action)}
                  className={`w-full text-right p-3 rounded-xl border transition-all flex items-center gap-3 ${
                    selectedActions.includes(action) ? 'bg-purple-500/10 border-purple-500/30' : 'bg-muted/20 border-border hover:border-muted-foreground/30'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${selectedActions.includes(action) ? 'border-purple-400 bg-purple-400/20' : 'border-border'}`}>
                    {selectedActions.includes(action) && <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />}
                  </div>
                  <span className="text-sm text-foreground/90">{action}</span>
                </motion.button>
              ))}
            </div>
            <div className="flex justify-between">
              <Button onClick={() => setPhase('vitals')} variant="ghost" className="text-muted-foreground">رجوع</Button>
              <Button onClick={() => setPhase('reveal')} disabled={selectedActions.length === 0}
                className="bg-gradient-to-l from-purple-500 to-violet-500 text-white font-bold disabled:opacity-50">
                عرض التشخيص <ArrowRight className="w-4 h-4 mr-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Reveal */}
        {phase === 'reveal' && (
          <div className="p-5">
            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-emerald-400">التشخيص</h3>
              </div>
              <p className="text-foreground/90 text-sm leading-7">{diagnosis}</p>
            </div>
            {treatment && (
              <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/15 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-sm font-bold text-cyan-400">خطة العلاج</h3>
                </div>
                <p className="text-foreground/80 text-sm leading-7">{treatment}</p>
              </div>
            )}
            <div className="p-3 rounded-lg bg-muted/20 border border-border mb-4">
              <p className="text-xs text-muted-foreground mb-1">الإجراءات التي اخترتها:</p>
              <div className="flex flex-wrap gap-1.5">
                {selectedActions.map((a, i) => (
                  <span key={i} className={`px-2 py-1 rounded border text-[10px] ${actions.includes(a) ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-red-500/10 border-red-500/20 text-red-300'}`}>{a}</span>
                ))}
              </div>
            </div>
            <div className="flex justify-between">
              <Button onClick={() => { setPhase('intro'); setSelectedActions([]) }} variant="outline" className="border-border text-foreground">
                <RotateCcw className="w-4 h-4 ml-1" />
                إعادة المحاكاة
              </Button>
              <Button onClick={() => setPhase('results')} className="bg-gradient-to-l from-amber-500 to-orange-500 text-white font-bold">
                عرض النتائج <Trophy className="w-4 h-4 mr-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Results */}
        {phase === 'results' && (
          <div className="p-5">
            <div className="glass-card rounded-xl p-6 flex flex-col items-center text-center mb-4">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.3, stiffness: 200 }}>
                <Trophy className="size-12 text-amber-400 mb-2" style={{ filter: 'drop-shadow(0 0 10px rgba(245,158,11,0.4))' }} />
              </motion.div>
              <h2 className="text-xl font-bold text-foreground mb-1">تقييم المحاكاة</h2>
              <p className="text-sm text-muted-foreground mb-4">تم إنهاء المحاكاة بنجاح</p>
              <div className="relative flex items-center justify-center mb-4">
                <svg width="140" height="140" className="transform -rotate-90">
                  <circle cx="70" cy="70" r="58" fill="none" stroke="rgba(0,245,255,0.1)" strokeWidth="8" />
                  <motion.circle
                    cx="70" cy="70" r="58" fill="none"
                    stroke={score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 58}
                    initial={{ strokeDashoffset: 2 * Math.PI * 58 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 58 * (1 - score / 100) }}
                    transition={{ duration: 1.5, delay: 0.5 }}
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <motion.span className={`text-4xl font-mono font-bold ${scoreColor}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>{score}</motion.span>
                  <span className="text-xs text-muted-foreground">من 100</span>
                </div>
              </div>
              <Badge className={`${scoreColor} bg-background/30 border-border text-sm px-3 py-1`}>
                <Award className="size-3.5 ml-1" />{scoreGrade}
              </Badge>
              <div className="grid grid-cols-3 gap-4 mt-6 w-full">
                <div className="flex flex-col items-center gap-1">
                  <Zap className="size-5 text-amber-400" />
                  <span className="text-lg font-bold text-amber-400">+{xpEarned}</span>
                  <span className="text-[10px] text-muted-foreground">XP مكتسب</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Clock className="size-5 text-cyan-400" />
                  <span className="text-lg font-bold text-cyan-400">{Math.floor(timeTaken / 60)}:{(timeTaken % 60).toString().padStart(2, '0')}</span>
                  <span className="text-[10px] text-muted-foreground">الوقت المستغرق</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <CheckCircle2 className="size-5 text-emerald-400" />
                  <span className="text-lg font-bold text-emerald-400">{correctSelectedActions.length}/{actions.length}</span>
                  <span className="text-[10px] text-muted-foreground">إجراء صحيح</span>
                </div>
              </div>
            </div>
            <div className="glass-card rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="size-4 text-cyan-400" />
                <h3 className="font-bold text-foreground text-sm">تفاصيل الأداء</h3>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground">الإجراءات المكتملة</span>
                  <span className="text-muted-foreground font-mono">{correctSelectedActions.length}/{actions.length}</span>
                </div>
                <Progress value={actions.length > 0 ? (correctSelectedActions.length / actions.length) * 100 : 0} className="h-2 bg-cyan-500/10" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="glass-card rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="size-4 text-emerald-400" />
                  <h3 className="font-bold text-foreground text-sm">ما تم بشكل صحيح</h3>
                </div>
                <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto">
                  {correctSelectedActions.length > 0 ? correctSelectedActions.map((action, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs p-2 rounded bg-emerald-500/5 border border-emerald-500/10">
                      <CheckCircle2 className="size-3 text-emerald-400 shrink-0" /><span className="text-emerald-400">{action}</span>
                    </div>
                  )) : <span className="text-xs text-muted-foreground">لم تُنفذ أي إجراءات صحيحة</span>}
                </div>
              </div>
              <div className="glass-card rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="size-4 text-red-400" />
                  <h3 className="font-bold text-foreground text-sm">ما فاتك</h3>
                </div>
                <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto">
                  {missedActions.length > 0 ? missedActions.map((action, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs p-2 rounded bg-red-500/5 border border-red-500/10">
                      <Shield className="size-3 text-red-400 shrink-0" /><span className="text-red-400">{action}</span>
                    </div>
                  )) : <span className="text-xs text-emerald-400">أحسنت! لم يفتك شيء مهم</span>}
                </div>
              </div>
            </div>
            <div className="flex justify-center gap-3">
              <Button onClick={() => { setPhase('intro'); setSelectedActions([]) }} variant="outline" className="border-border text-foreground">
                <RotateCcw className="w-4 h-4 ml-1" />إعادة المحاكاة
              </Button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export function CourseDetailPage() {
  const {
    activeCourseId, courses, setActivePage, user,
    courseProgress,
  } = useAppStore()
  const { toast } = useToast()

  const [lessons, setLessons] = useState<Lesson[]>([])
  const [lessonsLoading, setLessonsLoading] = useState(true)
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
  const [completedLessons, setCompletedLessons] = useState<string[]>([])
  const [enrolling, setEnrolling] = useState(false)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [courseProgress, setCourseProgress] = useState(0)

  // Find the current course
  const course = courses.find(c => c.id === activeCourseId)

  const isUnlocked = course ? (course.price === 0 || !course.isPremium || !!courseProgress.find(p => p.courseId === course.id)) : true
  const isPending = false // Pending is checked via API when needed

  // Fetch lessons
  useEffect(() => {
    if (!activeCourseId) return

    const fetchLessons = async () => {
      setLessonsLoading(true)
      try {
        const token = localStorage.getItem('medai-token')
        const res = await fetch(`/api/lessons?courseId=${activeCourseId}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        })
        if (res.ok) {
          const data = await res.json()
          const rawLessons = data.lessons || []
          // Map API data to Lesson type including quizData, flashcardData, simulationData
          const mappedLessons = rawLessons.map((l: any) => ({
            id: l.id,
            courseId: activeCourseId,
            title: l.title || '',
            titleAr: l.titleAr || '',
            type: l.type || 'article',
            duration: l.duration || 15,
            order: l.order || 1,
            isFree: l.isFree || false,
            content: l.content,
            videoUrl: l.videoUrl,
            images: l.images,
            summary: l.summary,
            keyPoints: l.keyPoints,
            quizData: l.quizData || undefined,
            flashcardData: l.flashcardData || undefined,
            simulationData: l.simulationData || undefined,
            isLocked: l.isLocked,
          }))
          setLessons(mappedLessons)
          // Auto-expand first section
          if (mappedLessons.length > 0) {
            setExpandedSections({ 'all': true })
          }
        }
      } catch (err) {
        console.error('Failed to fetch lessons:', err)
      } finally {
        setLessonsLoading(false)
      }
    }

    fetchLessons()
  }, [activeCourseId])

  // Fetch enrollment data (completed lessons + progress)
  useEffect(() => {
    if (!activeCourseId) return

    const fetchEnrollment = async () => {
      try {
        const token = localStorage.getItem('medai-token')
        if (!token) return

        const res = await fetch('/api/enrollments', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ courseId: activeCourseId }),
        })
        if (res.ok) {
          const data = await res.json()
          if (data.enrollment) {
            setCompletedLessons(data.enrollment.completedLessons?.map((id: unknown) => String(id)) || [])
            setCourseProgress(data.enrollment.progress || 0)
          }
        }
      } catch (err) {
        console.error('Failed to fetch enrollment:', err)
      }
    }

    fetchEnrollment()
  }, [activeCourseId])

  // Auto-enroll for free courses
  const handleFreeEnroll = useCallback(async () => {
    if (!activeCourseId || enrolling) return
    setEnrolling(true)

    try {
      const token = localStorage.getItem('medai-token')
      const res = await fetch('/api/enrollments', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseId: activeCourseId }),
      })

      if (res.ok) {
        // Refresh enrollments
        const enrollRes = await fetch('/api/enrollments', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (enrollRes.ok) {
          const data = await enrollRes.json()
          // Sync enrollment to store
          const existing = courseProgress.find(p => p.courseId === activeCourseId)
          if (!existing) {
            const newProgress = [...courseProgress, {
              courseId: activeCourseId,
              completedLessons: [],
              lastAccessedLessonId: null,
              progress: 0,
              lastAccessedAt: Date.now(),
            }]
            useAppStore.setState({ courseProgress: newProgress })
          }
        }
        toast({
          title: 'تم التسجيل بنجاح 🎉',
          description: 'يمكنك الآن الوصول إلى جميع دروس الدورة',
        })
      }
    } catch (err) {
      console.error('Failed to enroll:', err)
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في التسجيل، حاول مرة أخرى',
        variant: 'destructive',
      })
    } finally {
      setEnrolling(false)
    }
  }, [activeCourseId, enrolling, courseProgress, toast])

  // Mark lesson as completed
  const markLessonComplete = useCallback(async (lessonId: string) => {
    if (completedLessons.includes(lessonId)) return

    try {
      const token = localStorage.getItem('medai-token')
      await fetch('/api/enrollments', {
        method: 'POST', // reuse POST to update progress
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: activeCourseId,
          completedLessonId: lessonId,
        }),
      })

      // Optimistically update
      const newCompleted = [...completedLessons, lessonId]
      setCompletedLessons(newCompleted)
      const progress = lessons.length > 0 ? Math.round((newCompleted.length / lessons.length) * 100) : 0
      setCourseProgress(progress)
    } catch (err) {
      console.error('Failed to mark lesson complete:', err)
    }
  }, [completedLessons, lessons.length, activeCourseId])

  // Handle back navigation
  const handleBack = () => {
    setActivePage('courses')
    useAppStore.getState().setActiveCourseId(null)
  }

  // Can user access a specific lesson?
  const canAccessLesson = (lesson: Lesson): boolean => {
    if (!course) return false
    if (isUnlocked) return true // enrolled or free course
    if (lesson.isFree) return true // free preview lesson
    return false
  }

  // Toggle section
  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" dir="rtl">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-cyan-400/30 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">الدورة غير موجودة</h3>
          <Button onClick={handleBack} variant="ghost" className="text-neon-cyan">
            <ArrowRight className="w-4 h-4 ml-2" />
            العودة للدورات
          </Button>
        </div>
      </div>
    )
  }

  const gradient = categoryGradients[course.category] || 'from-cyan-600/80 via-blue-500/60 to-indigo-400/40'
  const icon = categoryIcons[course.category] || '📚'
  const level = levelConfig[course.level] || levelConfig.beginner
  const totalDuration = lessons.reduce((acc, l) => acc + (l.duration || 0), 0)

  return (
    <div className="min-h-screen pb-8" dir="rtl">
      <div className="max-w-5xl mx-auto px-3 sm:px-6">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="pt-2 pb-3"
        >
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-neon-cyan transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            العودة للدورات
          </button>
        </motion.div>

        {/* Course Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl mb-6"
        >
          <div className={`relative h-40 sm:h-52 bg-gradient-to-br ${gradient} overflow-hidden`}>
            <div className="absolute inset-0 bg-gradient-to-t from-med-dark via-med-dark/60 to-transparent" />
            <div className="absolute top-6 left-10 text-6xl opacity-10 animate-float">{icon}</div>
            <div className="absolute bottom-4 right-6 w-20 h-20 rounded-full border border-white/10" />

            <div className="absolute inset-0 flex items-end p-4 sm:p-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${level.color}`}>
                    {level.label}
                  </span>
                  {course.isPremium && (
                    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 font-medium">
                      <Crown className="w-3 h-3" />
                      مميز
                    </span>
                  )}
                  {!course.isPremium && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">
                      مجاني
                    </span>
                  )}
                  {isPending && (
                    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-medium">
                      <Hourglass className="w-3 h-3 animate-pulse" />
                      قيد المراجعة
                    </span>
                  )}
                </div>
                <h1 className="text-xl sm:text-3xl font-bold text-white neon-text leading-relaxed">
                  {course.titleAr}
                </h1>
              </div>
            </div>
          </div>

          {/* Course Stats Bar */}
          <div className="glass-card p-3 sm:p-4 border-t-0 rounded-t-none">
            <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-400">
              <div className="flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-neon-cyan" />
                <span>{course.instructor}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-yellow-400 font-semibold">{course.rating}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                <span>{course.students} طالب</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>{course.duration || `${totalDuration} دقيقة`}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" />
                <span>{lessons.length || course.lessons} درس</span>
              </div>
            </div>

            {course.description && (
              <p className="text-xs sm:text-sm text-gray-400 mt-2 leading-relaxed line-clamp-2">
                {course.description}
              </p>
            )}

            {/* Progress bar for enrolled users */}
            {(isUnlocked || !course.isPremium) && lessons.length > 0 && (
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neon-cyan font-medium">تقدمك في الدورة</span>
                  <span className="text-muted-foreground">{courseProgress}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${courseProgress}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full rounded-full bg-gradient-to-l from-neon-cyan to-neon-purple"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {completedLessons.length} من {lessons.length} درس مكتمل
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Access Control Banner */}
        {!isUnlocked && course.isPremium && !isPending && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-4 sm:p-6 mb-6 border border-yellow-500/20 text-center"
          >
            <Crown className="w-10 h-10 text-yellow-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-2">هذه الدورة مميزة</h3>
            <p className="text-sm text-muted-foreground mb-4">
              يجب الدفع لفتح هذه الدورة والوصول إلى جميع الدروس
            </p>
            <Button
              onClick={() => setPaymentDialogOpen(true)}
              className="bg-gradient-to-l from-yellow-500 to-amber-500 text-med-dark font-bold hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] transition-all"
            >
              <Crown className="w-4 h-4 ml-2" />
              ادفع لفتح الدورة - {course.price.toLocaleString()} ر.ي
            </Button>
            <p className="text-[10px] text-muted-foreground mt-2">
              يمكنك تصفح الدروس المجانية أدناه قبل الدفع
            </p>
          </motion.div>
        )}

        {/* Pending Payment Banner */}
        {isPending && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-4 sm:p-6 mb-6 border border-amber-500/20 text-center"
          >
            <Hourglass className="w-10 h-10 text-amber-400 mx-auto mb-3 animate-pulse" />
            <h3 className="text-lg font-bold text-white mb-2">طلب الدفع قيد المراجعة</h3>
            <p className="text-sm text-muted-foreground">
              سيتم فتح الدورة بعد تأكيد الدفع من الإدارة. يمكنك تصفح الدروس المجانية أدناه.
            </p>
          </motion.div>
        )}

        {/* Free Course - Enroll Button */}
        {!course.isPremium && !isUnlocked && !courseProgress.find(p => p.courseId === course.id) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-4 sm:p-6 mb-6 border border-emerald-500/20 text-center"
          >
            <BookOpen className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-2">دورة مجانية</h3>
            <p className="text-sm text-muted-foreground mb-4">
              اضغط على الزر أدناه للتسجيل والبدء في التعلم
            </p>
            <Button
              onClick={handleFreeEnroll}
              disabled={enrolling}
              className="bg-gradient-to-l from-emerald-500 to-teal-500 text-white font-bold hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all"
            >
              {enrolling ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Play className="w-4 h-4 ml-2 fill-white" />
                  ابدأ الدورة مجاناً
                </>
              )}
            </Button>
          </motion.div>
        )}

        {/* Main Content - Two Column Layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Lessons List */}
          <div className="flex-1 order-2 lg:order-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-neon-cyan" />
                  محتوى الدورة
                </h2>
                <Badge variant="secondary" className="text-[10px] bg-white/5 text-muted-foreground border-0">
                  {lessons.length} درس
                </Badge>
              </div>

              {lessonsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 text-neon-cyan animate-spin" />
                  <span className="text-sm text-muted-foreground mr-3">جاري تحميل الدروس...</span>
                </div>
              ) : lessons.length === 0 ? (
                <div className="glass-card p-8 text-center">
                  <BookOpen className="w-12 h-12 text-cyan-400/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">لم يتم إضافة دروس لهذه الدورة بعد</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {lessons.map((lesson, index) => {
                    const isCompleted = completedLessons.includes(lesson.id) || completedLessons.includes(lesson._id?.toString() || '')
                    const canAccess = canAccessLesson(lesson)
                    const isActive = activeLesson?.id === lesson.id

                    return (
                      <motion.div
                        key={lesson.id || lesson._id?.toString() || index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        onClick={() => canAccess ? setActiveLesson(lesson) : null}
                        className={`relative rounded-xl overflow-hidden transition-all duration-200 ${
                          canAccess ? 'cursor-pointer' : 'cursor-not-allowed'
                        } ${
                          isActive
                            ? 'glass-card border border-neon-cyan/40 shadow-[0_0_15px_rgba(0,245,255,0.1)]'
                            : 'glass-card hover:border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3 p-3 sm:p-4">
                          {/* Lesson Number / Status */}
                          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            isCompleted
                              ? 'bg-emerald-500/20'
                              : isActive
                              ? 'bg-neon-cyan/20'
                              : canAccess
                              ? 'bg-white/5'
                              : 'bg-white/[0.02]'
                          }`}>
                            {isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                            ) : canAccess ? (
                              <span className="text-xs sm:text-sm font-bold text-muted-foreground">{index + 1}</span>
                            ) : (
                              <Lock className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400/50" />
                            )}
                          </div>

                          {/* Lesson Info */}
                          <div className="flex-1 min-w-0">
                            <h4 className={`text-xs sm:text-sm font-medium leading-relaxed ${
                              isActive ? 'text-neon-cyan' : canAccess ? 'text-white' : 'text-gray-500'
                            }`}>
                              {lesson.titleAr || lesson.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              {/* Lesson type badge */}
                              {(lesson.type === 'article' || lesson.type === 'text') && (
                                <span className="flex items-center gap-1 text-[10px] text-blue-400">
                                  <FileText className="w-3 h-3" />
                                  مقال
                                </span>
                              )}
                              {lesson.type === 'video' && (
                                <span className="flex items-center gap-1 text-[10px] text-purple-400">
                                  <Video className="w-3 h-3" />
                                  فيديو
                                </span>
                              )}
                              {lesson.type === 'pdf' && (
                                <span className="flex items-center gap-1 text-[10px] text-amber-400">
                                  <FileIcon className="w-3 h-3" />
                                  PDF
                                </span>
                              )}
                              {lesson.duration && (
                                <span className="text-[10px] text-muted-foreground">
                                  {lesson.duration} دقيقة
                                </span>
                              )}
                              {lesson.isFree && !isUnlocked && course.isPremium && (
                                <span className="text-[10px] text-emerald-400 font-medium">مجاني</span>
                              )}
                            </div>
                          </div>

                          {/* Play icon */}
                          {canAccess && (
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                              isActive ? 'bg-neon-cyan/20' : 'bg-white/5'
                            }`}>
                              <Play className={`w-3.5 h-3.5 ${isActive ? 'text-neon-cyan fill-neon-cyan' : 'text-muted-foreground'}`} />
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          </div>

          {/* Lesson Content Viewer */}
          <div className="lg:w-[55%] order-1 lg:order-2 lg:sticky lg:top-4 lg:self-start">
            <AnimatePresence mode="wait">
              {activeLesson ? (
                <motion.div
                  key={activeLesson.id || activeLesson._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="glass-card overflow-hidden rounded-2xl"
                >
                  {/* Lesson Header */}
                  <div className="p-4 border-b border-white/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {(activeLesson.type === 'article' || activeLesson.type === 'text') && <FileText className="w-4 h-4 text-blue-400" />}
                        {activeLesson.type === 'video' && <Video className="w-4 h-4 text-purple-400" />}
                        {activeLesson.type === 'pdf' && <FileIcon className="w-4 h-4 text-amber-400" />}
                        <h3 className="text-sm sm:text-base font-bold text-white">
                          {activeLesson.titleAr || activeLesson.title}
                        </h3>
                      </div>
                      <button
                        onClick={() => setActiveLesson(null)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors"
                      >
                        <X className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  </div>

                  {/* Lesson Content */}
                  <div className="p-4 sm:p-6 max-h-[60vh] overflow-y-auto">
                    {/* Video Content */}
                    {activeLesson.type === 'video' && activeLesson.videoUrl && (() => {
                      const ytId = getYouTubeId(activeLesson.videoUrl)
                      return ytId ? (
                        <DetailVideoPlayer ytId={ytId} duration={activeLesson.duration} />
                      ) : (
                        <div className="text-center py-8">
                          <Video className="w-12 h-12 text-purple-400/30 mx-auto mb-3" />
                          <a
                            href={activeLesson.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-neon-cyan hover:underline"
                          >
                            مشاهدة الفيديو (رابط خارجي) ↗
                          </a>
                        </div>
                      )
                    })()}

                    {/* Article Content */}
                    {(activeLesson.type === 'article' || activeLesson.type === 'text') && activeLesson.content && (
                      <div
                        className="prose prose-invert prose-sm sm:prose-base max-w-none
                          prose-headings:text-white prose-headings:font-bold
                          prose-p:text-gray-300 prose-p:leading-relaxed
                          prose-strong:text-white prose-strong:font-bold
                          prose-ul:text-gray-300 prose-ol:text-gray-300
                          prose-li:text-gray-300
                          prose-a:text-neon-cyan prose-a:no-underline hover:prose-a:underline
                          prose-img:rounded-xl prose-img:border prose-img:border-white/10
                          prose-blockquote:border-neon-cyan/30 prose-blockquote:text-gray-300
                          prose-code:text-neon-cyan prose-code:bg-white/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                          prose-h1:text-xl prose-h2:text-lg prose-h3:text-base
                          prose-table:border-collapse
                          prose-th:bg-white/5 prose-th:p-2 prose-th:text-white prose-th:border prose-th:border-white/10
                          prose-td:p-2 prose-td:text-gray-300 prose-td:border prose-td:border-white/10"
                        dangerouslySetInnerHTML={{ __html: activeLesson.content }}
                      />
                    )}

                    {/* PDF Content */}
                    {activeLesson.type === 'pdf' && activeLesson.pdfUrl && (
                      <div className="text-center py-8">
                        <FileIcon className="w-12 h-12 text-amber-400/30 mx-auto mb-3" />
                        <a
                          href={activeLesson.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-colors text-sm"
                        >
                          <FileIcon className="w-4 h-4" />
                          فتح ملف PDF
                        </a>
                        {activeLesson.pdfName && (
                          <p className="text-xs text-muted-foreground mt-2">{activeLesson.pdfName}</p>
                        )}
                      </div>
                    )}

                    {/* Empty content */}
                    {(activeLesson.type === 'article' || activeLesson.type === 'text') && !activeLesson.content && (
                      <div className="text-center py-8">
                        <FileText className="w-12 h-12 text-blue-400/30 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">لم يتم إضافة محتوى لهذا الدرس بعد</p>
                      </div>
                    )}

                    {/* Quiz Content */}
                    {activeLesson.type === 'quiz' && (
                      <div className="py-6">
                        {activeLesson.quizData && activeLesson.quizData.length > 0 ? (
                          <div className="space-y-4">
                            {activeLesson.quizData.map((q, qIdx) => (
                              <div key={qIdx} className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/15">
                                <p className="font-bold text-foreground text-sm mb-3">{qIdx + 1}. {q.question}</p>
                                <div className="space-y-2">
                                  {q.options.map((opt, oIdx) => (
                                    <div key={oIdx} className={`p-2.5 rounded-lg text-sm ${oIdx === q.correctIndex ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-muted/20 border border-border text-foreground/70'}`}>
                                      {opt}
                                    </div>
                                  ))}
                                </div>
                                {q.explanation && <p className="text-xs text-muted-foreground mt-2">💡 {q.explanation}</p>}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <p className="text-sm text-muted-foreground">لم تتم إضافة أسئلة لهذا الاختبار بعد</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Flashcard Content */}
                    {activeLesson.type === 'flashcard' && (
                      <div className="py-6">
                        {activeLesson.flashcardData && activeLesson.flashcardData.length > 0 ? (
                          <div className="space-y-3">
                            {activeLesson.flashcardData.map((card, cIdx) => (
                              <div key={cIdx} className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/15">
                                <p className="font-bold text-foreground text-sm">{card.front}</p>
                                <p className="text-sm text-cyan-400 mt-2">{card.back}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <p className="text-sm text-muted-foreground">لم تتم إضافة بطاقات لهذا الدرس بعد</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Simulation Content - Interactive */}
                    {activeLesson.type === 'simulation' && (
                      <DetailInlineSimulation lesson={activeLesson} />
                    )}

                    {/* Mark as Complete Button */}
                    {isUnlocked && !completedLessons.includes(activeLesson.id) && !completedLessons.includes(activeLesson._id?.toString() || '') && (
                      <div className="mt-6 pt-4 border-t border-white/5">
                        <Button
                          onClick={() => markLessonComplete(activeLesson.id || activeLesson._id?.toString() || '')}
                          className="w-full bg-gradient-to-l from-emerald-500 to-teal-500 text-white font-bold hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all"
                        >
                          <CheckCircle2 className="w-4 h-4 ml-2" />
                          إكمال الدرس
                        </Button>
                      </div>
                    )}

                    {completedLessons.includes(activeLesson.id) || completedLessons.includes(activeLesson._id?.toString() || '') ? (
                      <div className="mt-6 pt-4 border-t border-white/5">
                        <div className="flex items-center justify-center gap-2 text-sm text-emerald-400">
                          <CheckCircle2 className="w-4 h-4" />
                          تم إكمال هذا الدرس
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="glass-card p-8 rounded-2xl text-center"
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-neon-cyan/10 to-neon-purple/10 flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-neon-cyan/40" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">اختر درساً للبدء</h3>
                  <p className="text-xs text-muted-foreground">
                    اضغط على أي درس من القائمة لعرض محتواه
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Payment Dialog */}
      {course.isPremium && (
        <PaymentDialog
          open={paymentDialogOpen}
          onOpenChange={(open) => {
            setPaymentDialogOpen(open)
            if (!open) {
              // Refresh enrollments after dialog closes
              const token = localStorage.getItem('medai-token')
              if (token) {
                fetch('/api/enrollments', {
                  headers: { 'Authorization': `Bearer ${token}` }
                })
                  .then(res => res.json())
                  .then(data => {
                    // Sync enrollment to store
                    const existing = courseProgress.find(p => p.courseId === activeCourseId)
                    if (!existing) {
                      const newProgress = [...courseProgress, {
                        courseId: activeCourseId,
                        completedLessons: [],
                        lastAccessedLessonId: null,
                        progress: 0,
                        lastAccessedAt: Date.now(),
                      }]
                      useAppStore.setState({ courseProgress: newProgress })
                    }
                  })
                  .catch(() => {})
              }
            }
          }}
          courseId={course.id}
          courseName={course.titleAr}
          amount={course.price}
        />
      )}
    </div>
  )
}
