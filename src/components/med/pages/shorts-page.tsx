'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart, MessageCircle, Share2, Bookmark, Play, Pause,
  Volume2, VolumeX, MoreVertical, ChevronUp, ChevronDown,
  GraduationCap, Clock, Eye, Flame
} from 'lucide-react'
import { useAppStore, type ShortVideo } from '@/store/app-store'
import { Badge } from '@/components/ui/badge'

const categoryColors: Record<string, string> = {
  cardiology: 'from-pink-600 via-rose-500 to-red-600',
  emergency: 'from-red-600 via-orange-500 to-amber-500',
  neurology: 'from-purple-600 via-violet-500 to-indigo-600',
  pharmacology: 'from-fuchsia-600 via-pink-500 to-rose-600',
  general: 'from-cyan-600 via-teal-500 to-emerald-500',
  radiology: 'from-amber-600 via-yellow-500 to-orange-500',
}

const categoryLabels: Record<string, string> = {
  cardiology: 'أمراض القلب',
  emergency: 'طب الطوارئ',
  neurology: 'الأعصاب',
  pharmacology: 'الأدوية',
  general: 'طب عام',
  radiology: 'الأشعة',
}

const categoryIcons: Record<string, string> = {
  cardiology: '❤️',
  emergency: '🚑',
  neurology: '🧠',
  pharmacology: '💊',
  general: '🩺',
  radiology: '🔬',
}

function formatDuration(seconds: number): string {
  const min = Math.floor(seconds / 60)
  const sec = seconds % 60
  return `${min}:${sec.toString().padStart(2, '0')}`
}

function formatViews(views: number): string {
  if (views >= 1000) return `${(views / 1000).toFixed(1)}ك`
  return views.toString()
}

interface ShortCardProps {
  short: ShortVideo
  isActive: boolean
  onLike: (id: string) => void
  onBookmark: (id: string) => void
  isLiked: boolean
  isBookmarked: boolean
}

function ShortCard({ short, isActive, onLike, onBookmark, isLiked, isBookmarked }: ShortCardProps) {
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showComments, setShowComments] = useState(false)
  const gradient = categoryColors[short.category] || 'from-cyan-600 via-blue-500 to-indigo-600'
  const icon = categoryIcons[short.category] || '📚'
  const categoryLabel = categoryLabels[short.category] || 'أخرى'

  // Simulate progress when active
  useEffect(() => {
    if (!isActive || !isPlaying) return

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setIsPlaying(false)
          return 100
        }
        return prev + 100 / (short.duration * 10)
      })
    }, 100)

    return () => clearInterval(interval)
  }, [isActive, isPlaying, short.duration])

  // Reset progress when short changes
  useEffect(() => {
    if (isActive) {
      requestAnimationFrame(() => {
        setProgress(0)
        setIsPlaying(true)
      })
    }
  }, [isActive])

  return (
    <div
      className="relative w-full flex-shrink-0 overflow-hidden rounded-2xl"
      style={{ height: 'calc(100vh - 120px)' }}
    >
      {/* Background gradient simulating video */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />

      {/* Animated background pattern */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating medical icons */}
        <div className="absolute top-[10%] right-[10%] text-6xl opacity-10 animate-float">{icon}</div>
        <div className="absolute bottom-[30%] left-[5%] text-4xl opacity-5 animate-float" style={{ animationDelay: '1s' }}>{icon}</div>
        <div className="absolute top-[50%] right-[60%] text-3xl opacity-5 animate-float" style={{ animationDelay: '2s' }}>{icon}</div>

        {/* Circular rings */}
        <div className="absolute top-[20%] left-[50%] w-48 h-48 rounded-full border border-border animate-pulse" />
        <div className="absolute bottom-[20%] right-[30%] w-32 h-32 rounded-full border border-border animate-pulse" style={{ animationDelay: '1.5s' }} />

        {/* ECG line overlay */}
        <svg className="absolute bottom-[15%] left-0 w-full h-16 opacity-10" viewBox="0 0 400 50">
          <path
            d="M0,25 L50,25 L60,10 L70,40 L80,5 L90,45 L100,25 L150,25 L160,10 L170,40 L180,5 L190,45 L200,25 L250,25 L260,10 L270,40 L280,5 L290,45 L300,25 L350,25 L360,10 L370,40 L380,5 L390,45 L400,25"
            fill="none"
            stroke="white"
            strokeWidth="2"
            className="ecg-animate"
          />
        </svg>
      </div>

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
      <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-black/40" />

      {/* Top info bar */}
      <div className="absolute top-0 left-0 right-0 p-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Playing indicator */}
            {isActive && isPlaying && (
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1"
              >
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-[10px] text-white font-medium">جاري التشغيل</span>
              </motion.div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Category badge */}
            <Badge className="bg-black/40 backdrop-blur-sm text-foreground border-border text-xs">
              <span className="ml-1">{icon}</span>
              {categoryLabel}
            </Badge>

            {/* Duration badge */}
            <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-full px-2.5 py-1">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] text-foreground font-medium">{formatDuration(short.duration)}</span>
            </div>
          </div>
        </div>

        {/* Title overlay */}
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-lg font-bold text-foreground mt-3 neon-text max-w-[70%] leading-relaxed"
        >
          {short.title}
        </motion.h2>
      </div>

      {/* Center play/pause button */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <AnimatePresence>
          {!isPlaying && (
            <motion.button
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.5 }}
              onClick={() => setIsPlaying(true)}
              className="w-16 h-16 rounded-full bg-black/30 backdrop-blur-md border border-border flex items-center justify-center"
            >
              <Play className="w-7 h-7 text-foreground fill-foreground mr-[-2px]" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Double tap to pause overlay */}
        <div
          className="absolute inset-0 z-5"
          onDoubleClick={() => setIsPlaying(!isPlaying)}
          onClick={() => setIsPlaying(!isPlaying)}
        />
      </div>

      {/* Right side action buttons (TikTok style) */}
      <div className="absolute left-3 bottom-28 flex flex-col items-center gap-5 z-10">
        {/* Instructor avatar */}
        <motion.div
          whileHover={{ scale: 1.1 }}
          className="relative"
        >
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-neon-cyan/40 to-neon-purple/40 border-2 border-neon-cyan/50 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-foreground" />
          </div>
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-neon-cyan flex items-center justify-center">
            <span className="text-[8px] text-med-dark font-bold">+</span>
          </div>
        </motion.div>

        {/* Like button */}
        <motion.button
          whileTap={{ scale: 0.8 }}
          onClick={() => onLike(short.id)}
          className="flex flex-col items-center gap-1"
        >
          <div className={`transition-colors ${isLiked ? 'text-red-500' : 'text-foreground'}`}>
            <Heart className={`w-7 h-7 ${isLiked ? 'fill-red-500' : ''}`} />
          </div>
          <span className="text-[10px] text-foreground font-medium">{formatViews(short.likes + (isLiked ? 1 : 0))}</span>
        </motion.button>

        {/* Comment button */}
        <motion.button
          whileTap={{ scale: 0.8 }}
          onClick={() => setShowComments(!showComments)}
          className="flex flex-col items-center gap-1"
        >
          <MessageCircle className="w-7 h-7 text-foreground" />
          <span className="text-[10px] text-foreground font-medium">{formatViews(Math.floor(short.likes * 0.3))}</span>
        </motion.button>

        {/* Share button */}
        <motion.button
          whileTap={{ scale: 0.8 }}
          className="flex flex-col items-center gap-1"
        >
          <Share2 className="w-7 h-7 text-foreground" />
          <span className="text-[10px] text-foreground font-medium">شارك</span>
        </motion.button>

        {/* Bookmark button */}
        <motion.button
          whileTap={{ scale: 0.8 }}
          onClick={() => onBookmark(short.id)}
          className="flex flex-col items-center gap-1"
        >
          <Bookmark className={`w-7 h-7 transition-colors ${isBookmarked ? 'fill-yellow-400 text-yellow-400' : 'text-foreground'}`} />
          <span className="text-[10px] text-foreground font-medium">حفظ</span>
        </motion.button>

        {/* Mute toggle */}
        <motion.button
          whileTap={{ scale: 0.8 }}
          onClick={() => setIsMuted(!isMuted)}
          className="w-9 h-9 rounded-full bg-muted/50 backdrop-blur-sm flex items-center justify-center"
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-foreground" />
          ) : (
            <Volume2 className="w-4 h-4 text-foreground" />
          )}
        </motion.button>
      </div>

      {/* Bottom info section */}
      <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
        {/* Instructor and description */}
        <div className="mb-3 pr-12">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-sm font-bold text-foreground">{short.instructor}</span>
            <Badge className="bg-neon-cyan/20 text-neon-cyan border-neon-cyan/30 text-[9px] h-4">
              مُعتمد
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            تعلّم أسرار {categoryLabel} في أقل من دقيقة! محتوى طبي موثوق ومبسط لمساعدتك في مسيرتك المهنية 🩺✨
          </p>
        </div>

        {/* Views and fire */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Eye className="w-3 h-3" />
            <span>{formatViews(short.views)} مشاهدة</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-orange-400">
            <Flame className="w-3 h-3" />
            <span>رائج</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative h-1 rounded-full bg-muted/50 overflow-hidden">
          <motion.div
            className="absolute right-0 top-0 h-full rounded-full bg-gradient-to-l from-neon-cyan to-neon-purple"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>

        {/* Time indicator */}
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[9px] text-muted-foreground/50">0:00</span>
          <span className="text-[9px] text-muted-foreground/50">{formatDuration(short.duration)}</span>
        </div>
      </div>

      {/* Comments panel */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, translateY: '100%' }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0, translateY: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="absolute bottom-0 left-0 right-0 bg-med-dark/95 backdrop-blur-xl rounded-t-2xl border-t border-neon-cyan/10 z-20"
            style={{ maxHeight: '50%' }}
          >
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground">التعليقات</h3>
                <button
                  onClick={() => setShowComments(false)}
                  className="w-6 h-6 rounded-full bg-muted/30 flex items-center justify-center"
                >
                  <ChevronDown className="w-3 h-3 text-foreground" />
                </button>
              </div>

              {/* Sample comments */}
              {[
                { name: 'د. أحمد', text: 'محتوى رائع! شكراً 🙏', time: 'منذ ساعة' },
                { name: 'سارة', text: 'شرح واضح ومفيد جداً 👏', time: 'منذ 3 ساعات' },
                { name: 'د. خالد', text: 'أخيراً فهمت هالمفهوم! 💡', time: 'منذ 5 ساعات' },
              ].map((comment, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] text-foreground">{comment.name[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">{comment.name}</span>
                      <span className="text-[9px] text-muted-foreground/50">{comment.time}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{comment.text}</p>
                  </div>
                </div>
              ))}

              {/* Comment input */}
              <div className="flex items-center gap-2 pt-1">
                <div className="w-7 h-7 rounded-full bg-neon-cyan/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] text-neon-cyan">أ</span>
                </div>
                <input
                  type="text"
                  placeholder="أضف تعليقاً..."
                  className="flex-1 h-8 px-3 rounded-full bg-muted/30 border border-border text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-neon-cyan/30"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function ShortsPage() {
  const { shorts } = useAppStore()
  const [activeIndex, setActiveIndex] = useState(0)
  const [likedShorts, setLikedShorts] = useState<Set<string>>(new Set())
  const [bookmarkedShorts, setBookmarkedShorts] = useState<Set<string>>(new Set())
  const containerRef = useRef<HTMLDivElement>(null)

  const handleLike = useCallback((id: string) => {
    setLikedShorts((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) newSet.delete(id)
      else newSet.add(id)
      return newSet
    })
  }, [])

  const handleBookmark = useCallback((id: string) => {
    setBookmarkedShorts((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) newSet.delete(id)
      else newSet.add(id)
      return newSet
    })
  }, [])

  // Handle scroll snap to detect active short
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return
    const container = containerRef.current
    const scrollTop = container.scrollTop
    const itemHeight = container.clientHeight
    const newIndex = Math.round(scrollTop / itemHeight)
    if (newIndex !== activeIndex && newIndex >= 0 && newIndex < shorts.length) {
      setActiveIndex(newIndex)
    }
  }, [activeIndex, shorts.length])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault()
        setActiveIndex((prev) => Math.min(prev + 1, shorts.length - 1))
        containerRef.current?.children[activeIndex + 1]?.scrollIntoView({ behavior: 'smooth' })
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault()
        setActiveIndex((prev) => Math.max(prev - 1, 0))
        containerRef.current?.children[activeIndex - 1]?.scrollIntoView({ behavior: 'smooth' })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeIndex, shorts.length])

  // Scroll to active index when it changes via keyboard
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.children[activeIndex]?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [activeIndex])

  return (
    <div className="relative" dir="rtl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 border border-neon-cyan/20 flex items-center justify-center">
            <Play className="w-5 h-5 text-neon-cyan fill-neon-cyan" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">فيديوهات قصيرة</h2>
            <p className="text-xs text-muted-foreground">تعلّم في دقيقة ⚡</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-neon-cyan/10 text-neon-cyan border-neon-cyan/20 text-xs">
            {shorts.length} فيديو
          </Badge>
        </div>
      </motion.div>

      {/* Vertical scroll container with snap */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="overflow-y-auto no-scrollbar rounded-2xl"
        style={{
          height: 'calc(100vh - 120px)',
          scrollSnapType: 'y mandatory',
        }}
      >
        {shorts.map((short, index) => (
          <div
            key={short.id}
            style={{
              scrollSnapAlign: 'start',
              scrollSnapStop: 'always',
            }}
          >
            <ShortCard
              short={short}
              isActive={index === activeIndex}
              onLike={handleLike}
              onBookmark={handleBookmark}
              isLiked={likedShorts.has(short.id)}
              isBookmarked={bookmarkedShorts.has(short.id)}
            />
          </div>
        ))}
      </div>

      {/* Scroll indicator dots */}
      <div className="absolute top-1/2 -translate-y-1/2 -left-2 flex flex-col items-center gap-1.5 z-10">
        {shorts.map((_, index) => (
          <motion.button
            key={index}
            whileHover={{ scale: 1.3 }}
            onClick={() => {
              setActiveIndex(index)
              containerRef.current?.children[index]?.scrollIntoView({ behavior: 'smooth' })
            }}
            className={`rounded-full transition-all duration-300 ${
              index === activeIndex
                ? 'w-1.5 h-4 bg-neon-cyan shadow-[0_0_8px_rgba(0,245,255,0.5)]'
                : 'w-1.5 h-1.5 bg-muted/70 hover:bg-muted'
            }`}
          />
        ))}
      </div>

      {/* Navigation hint */}
      <AnimatePresence>
        {activeIndex === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 z-10"
          >
            <motion.div
              animate={{ y: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="flex flex-col items-center"
            >
              <ChevronDown className="w-4 h-4 text-muted-foreground/30" />
              <span className="text-[9px] text-muted-foreground/30">اسحب للأسفل</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
