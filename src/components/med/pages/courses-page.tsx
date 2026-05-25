'use client'

import React, { useState, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Filter, Star, Clock, Users, BookOpen, Crown,
  ChevronLeft, ChevronRight, TrendingUp, Sparkles, Play,
  SlidersHorizontal, GraduationCap, Zap, ArrowRight
} from 'lucide-react'
import { useAppStore, type Course } from '@/store/app-store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

// Category gradient map
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

const categoryLabels: Record<string, string> = {
  emergency: 'طب الطوارئ',
  cardiology: 'أمراض القلب',
  neurology: 'الأعصاب',
  pediatrics: 'طب الأطفال',
  surgery: 'الجراحة',
  internal: 'الطب الباطني',
  radiology: 'الأشعة',
  pharmacology: 'الأدوية',
}

const levelConfig = {
  beginner: { label: 'مبتدئ', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  intermediate: { label: 'متوسط', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  advanced: { label: 'متقدم', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
}

const categories = [
  { id: 'all', label: 'الكل', icon: '📚' },
  { id: 'emergency', label: 'طب الطوارئ', icon: '🚑' },
  { id: 'cardiology', label: 'أمراض القلب', icon: '❤️' },
  { id: 'neurology', label: 'الأعصاب', icon: '🧠' },
  { id: 'pediatrics', label: 'طب الأطفال', icon: '👶' },
  { id: 'surgery', label: 'الجراحة', icon: '🔪' },
  { id: 'internal', label: 'الطب الباطني', icon: '🩺' },
  { id: 'radiology', label: 'الأشعة', icon: '🔬' },
  { id: 'pharmacology', label: 'الأدوية', icon: '💊' },
]

const sortOptions = [
  { id: 'popular', label: 'الأكثر شعبية' },
  { id: 'newest', label: 'الأحدث' },
  { id: 'rating', label: 'الأعلى تقييماً' },
  { id: 'price-low', label: 'السعر: الأقل' },
  { id: 'price-high', label: 'السعر: الأعلى' },
]

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" dir="ltr">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-3 h-3 ${
            star <= Math.floor(rating)
              ? 'fill-yellow-400 text-yellow-400'
              : star <= rating
              ? 'fill-yellow-400/50 text-yellow-400'
              : 'text-gray-600'
          }`}
        />
      ))}
      <span className="text-xs text-yellow-400 mr-1 font-semibold">{rating}</span>
    </div>
  )
}

function CourseCard({ course, index }: { course: Course; index: number }) {
  const gradient = categoryGradients[course.category] || 'from-cyan-600/80 via-blue-500/60 to-indigo-400/40'
  const icon = categoryIcons[course.category] || '📚'
  const level = levelConfig[course.level]
  const isEnrolled = course.progress !== undefined && course.progress > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      whileHover={{ scale: 1.03, y: -4 }}
      className="group relative flex-shrink-0 w-[260px] sm:w-[280px] cursor-pointer"
    >
      {/* Neon glow on hover */}
      <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-neon-cyan/0 via-neon-purple/0 to-neon-pink/0 group-hover:from-neon-cyan/40 group-hover:via-neon-purple/30 group-hover:to-neon-pink/20 rounded-2xl blur-sm transition-all duration-500" />

      <div className="relative glass-card overflow-hidden rounded-2xl">
        {/* Thumbnail area with gradient */}
        <div className={`relative h-36 bg-gradient-to-br ${gradient} overflow-hidden`}>
          {/* Animated mesh pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-2 right-4 text-4xl animate-float">{icon}</div>
            <div className="absolute bottom-2 left-4 w-16 h-16 rounded-full border border-white/10" />
            <div className="absolute top-8 left-12 w-8 h-8 rounded-full border border-white/5" />
          </div>

          {/* Level badge */}
          <div className="absolute top-3 right-3">
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${level.color}`}>
              {level.label}
            </span>
          </div>

          {/* Premium badge */}
          {course.isPremium && (
            <div className="absolute top-3 left-3">
              <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 font-medium">
                <Crown className="w-3 h-3" />
                مميز
              </span>
            </div>
          )}

          {/* Play overlay on hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/30">
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="w-12 h-12 rounded-full bg-neon-cyan/20 border border-neon-cyan/50 flex items-center justify-center backdrop-blur-sm"
            >
              <Play className="w-5 h-5 text-neon-cyan fill-neon-cyan mr-[-2px]" />
            </motion.div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-2.5">
          <h3 className="text-sm font-bold text-white leading-relaxed line-clamp-2 min-h-[2.5rem]">
            {course.titleAr}
          </h3>

          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-neon-cyan/30 to-neon-purple/30 flex items-center justify-center">
              <GraduationCap className="w-3 h-3 text-neon-cyan" />
            </div>
            <span className="text-xs text-muted-foreground">{course.instructor}</span>
          </div>

          <div className="flex items-center justify-between">
            <StarRating rating={course.rating} />
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="w-3 h-3" />
              <span>{(course.students / 1000).toFixed(1)}ك</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{course.duration}</span>
            </div>
            <div className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              <span>{course.lessons} درس</span>
            </div>
          </div>

          {/* Progress bar if enrolled */}
          {isEnrolled && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neon-cyan">التقدم</span>
                <span className="text-muted-foreground">{course.progress}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${course.progress}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className="h-full rounded-full bg-gradient-to-l from-neon-cyan to-neon-purple"
                />
              </div>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center justify-between pt-1">
            {course.price === 0 ? (
              <span className="text-sm font-bold text-emerald-400">مجاني</span>
            ) : (
              <span className="text-sm font-bold text-neon-cyan">${course.price}</span>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-neon-cyan hover:text-neon-cyan hover:bg-neon-cyan/10"
            >
              {isEnrolled ? 'متابعة' : 'سجل الآن'}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function HorizontalCourseRow({
  title,
  courses,
  icon,
  showProgress = false,
}: {
  title: string
  courses: Course[]
  icon?: React.ReactNode
  showProgress?: boolean
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 320
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  if (courses.length === 0) return null

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          {icon}
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <Badge variant="secondary" className="text-[10px] bg-white/5 text-muted-foreground border-0">
            {courses.length} دورة
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll('right')}
            className="w-8 h-8 rounded-full glass flex items-center justify-center hover:bg-neon-cyan/10 transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-neon-cyan" />
          </button>
          <button
            onClick={() => scroll('left')}
            className="w-8 h-8 rounded-full glass flex items-center justify-center hover:bg-neon-cyan/10 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-neon-cyan" />
          </button>
        </div>
      </div>

      {/* Horizontal Scroll Row */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto no-scrollbar pb-2"
        dir="rtl"
      >
        {courses.map((course, i) => (
          <CourseCard key={course.id} course={course} index={i} />
        ))}
      </div>
    </div>
  )
}

export function CoursesPage() {
  const { courses, searchQuery, setSearchQuery } = useAppStore()
  const [activeCategory, setActiveCategory] = useState('all')
  const [activeLevel, setActiveLevel] = useState<string>('all')
  const [sortBy, setSortBy] = useState('popular')
  const [showFilters, setShowFilters] = useState(false)

  // Filter and sort courses
  const filteredCourses = useMemo(() => {
    let result = [...courses]

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (c) =>
          c.titleAr.toLowerCase().includes(q) ||
          c.instructor.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q))
      )
    }

    // Category filter
    if (activeCategory !== 'all') {
      result = result.filter((c) => c.category === activeCategory)
    }

    // Level filter
    if (activeLevel !== 'all') {
      result = result.filter((c) => c.level === activeLevel)
    }

    // Sort
    switch (sortBy) {
      case 'popular':
        result.sort((a, b) => b.students - a.students)
        break
      case 'rating':
        result.sort((a, b) => b.rating - a.rating)
        break
      case 'price-low':
        result.sort((a, b) => a.price - b.price)
        break
      case 'price-high':
        result.sort((a, b) => b.price - a.price)
        break
    }

    return result
  }, [courses, searchQuery, activeCategory, activeLevel, sortBy])

  // Categorized courses
  const trendingCourses = useMemo(
    () => [...courses].sort((a, b) => b.students - a.students),
    [courses]
  )
  const emergencyCourses = useMemo(
    () => courses.filter((c) => c.category === 'emergency'),
    [courses]
  )
  const cardiologyCourses = useMemo(
    () => courses.filter((c) => c.category === 'cardiology'),
    [courses]
  )
  const continueLearning = useMemo(
    () => courses.filter((c) => c.progress && c.progress > 0),
    [courses]
  )
  const featuredCourse = useMemo(
    () => courses.find((c) => c.id === '1') || courses[0],
    [courses]
  )

  return (
    <div className="min-h-screen pb-8" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Search & Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-neon-cyan/20 via-neon-purple/20 to-neon-pink/20 blur-xl opacity-30" />
            <div className="relative flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neon-cyan/60" />
                <input
                  type="text"
                  placeholder="ابحث عن دورة، مدرب، أو موضوع..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-12 pr-12 pl-4 rounded-xl bg-med-card/80 border border-neon-cyan/20 text-white placeholder:text-muted-foreground focus:outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/20 transition-all backdrop-blur-md"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`h-12 px-4 rounded-xl flex items-center gap-2 transition-all ${
                  showFilters
                    ? 'bg-neon-cyan/20 border border-neon-cyan/40 text-neon-cyan'
                    : 'glass text-muted-foreground hover:text-neon-cyan hover:border-neon-cyan/20'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="text-sm">تصفية</span>
              </button>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {categories.map((cat) => (
              <motion.button
                key={cat.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeCategory === cat.id
                    ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40 shadow-[0_0_15px_rgba(0,245,255,0.15)]'
                    : 'glass text-muted-foreground hover:text-white hover:border-neon-cyan/20'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </motion.button>
            ))}
          </div>

          {/* Extended Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="glass rounded-xl p-4 space-y-4">
                  <div className="flex flex-wrap items-center gap-4">
                    {/* Level Filter */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">المستوى:</span>
                      {(['all', 'beginner', 'intermediate', 'advanced'] as const).map((level) => (
                        <button
                          key={level}
                          onClick={() => setActiveLevel(level)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                            activeLevel === level
                              ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30'
                              : 'text-muted-foreground hover:text-white border border-transparent hover:border-white/10'
                          }`}
                        >
                          {level === 'all' ? 'الكل' : levelConfig[level].label}
                        </button>
                      ))}
                    </div>

                    {/* Sort Dropdown */}
                    <div className="flex items-center gap-2 mr-auto">
                      <span className="text-xs text-muted-foreground">ترتيب:</span>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="bg-med-card/80 border border-neon-cyan/15 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-neon-cyan/40 appearance-none cursor-pointer"
                      >
                        {sortOptions.map((opt) => (
                          <option key={opt.id} value={opt.id} className="bg-med-dark">
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Featured Course Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative overflow-hidden rounded-2xl"
        >
          <div className="absolute inset-0">
            <div className={`absolute inset-0 bg-gradient-to-br ${categoryGradients[featuredCourse.category]}`} />
            <div className="absolute inset-0 bg-gradient-to-t from-med-dark via-med-dark/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-l from-transparent to-med-dark/80" />
            {/* Animated background elements */}
            <div className="absolute top-6 left-10 w-24 h-24 rounded-full border border-white/5 animate-float" />
            <div className="absolute bottom-10 right-20 w-16 h-16 rounded-full border border-white/10 animate-float" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 left-1/3 text-6xl opacity-10 animate-float" style={{ animationDelay: '2s' }}>
              {categoryIcons[featuredCourse.category]}
            </div>
          </div>

          <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row items-start gap-6">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2">
                <Badge className="bg-neon-cyan/20 text-neon-cyan border-neon-cyan/30 text-xs">
                  <Sparkles className="w-3 h-3 ml-1" />
                  موصى به
                </Badge>
                <Badge className="bg-neon-purple/20 text-neon-purple border-neon-purple/30 text-xs">
                  <TrendingUp className="w-3 h-3 ml-1" />
                  رائج
                </Badge>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-white neon-text">
                {featuredCourse.titleAr}
              </h1>

              <p className="text-sm text-gray-300 max-w-lg leading-relaxed">
                {featuredCourse.description}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-neon-cyan" />
                  <span>{featuredCourse.instructor}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-yellow-400 font-semibold">{featuredCourse.rating}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  <span>{(featuredCourse.students / 1000).toFixed(1)}ك طالب</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>{featuredCourse.duration}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  <span>{featuredCourse.lessons} درس</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button className="bg-gradient-to-l from-neon-cyan to-cyan-400 text-med-dark font-bold hover:shadow-[0_0_30px_rgba(0,245,255,0.3)] transition-all">
                  <Play className="w-4 h-4 ml-2 fill-med-dark" />
                  ابدأ الآن
                </Button>
                <Button variant="ghost" className="text-white border border-white/10 hover:bg-white/5">
                  <Zap className="w-4 h-4 ml-2" />
                  نظرة سريعة
                </Button>
              </div>
            </div>

            {/* Featured card visual */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="hidden sm:flex flex-col items-center justify-center w-48 h-36 glass rounded-2xl p-4"
            >
              <div className="text-5xl mb-2">{categoryIcons[featuredCourse.category]}</div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-emerald-400">متاح الآن</span>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Continue Learning Section */}
        {continueLearning.length > 0 && (
          <HorizontalCourseRow
            title="واصل التعلم 📖"
            courses={continueLearning}
            icon={
              <div className="w-8 h-8 rounded-lg bg-neon-cyan/10 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-neon-cyan" />
              </div>
            }
            showProgress
          />
        )}

        {/* Category Rows (Netflix style) */}
        {searchQuery || activeCategory !== 'all' || activeLevel !== 'all' ? (
          /* Show filtered results */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                نتائج البحث
                <span className="text-sm text-muted-foreground font-normal mr-2">
                  ({filteredCourses.length} دورة)
                </span>
              </h2>
            </div>
            {filteredCourses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredCourses.map((course, i) => (
                  <CourseCard key={course.id} course={course} index={i} />
                ))}
              </div>
            ) : (
              <div className="glass rounded-2xl p-12 text-center">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">لا توجد نتائج</h3>
                <p className="text-sm text-muted-foreground">
                  جرّب البحث بكلمات مختلفة أو غيّر التصفية
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Netflix-style category rows */
          <div className="space-y-10">
            <HorizontalCourseRow
              title="دورات رائجة 🔥"
              courses={trendingCourses}
              icon={
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-orange-400" />
                </div>
              }
            />

            <HorizontalCourseRow
              title="طب الطوارئ"
              courses={emergencyCourses}
              icon={
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <span className="text-base">🚑</span>
                </div>
              }
            />

            <HorizontalCourseRow
              title="أمراض القلب"
              courses={cardiologyCourses}
              icon={
                <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center">
                  <span className="text-base">❤️</span>
                </div>
              }
            />

            <HorizontalCourseRow
              title="حديثاً ✨"
              courses={[...courses].reverse()}
              icon={
                <div className="w-8 h-8 rounded-lg bg-neon-purple/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-neon-purple" />
                </div>
              }
            />
          </div>
        )}
      </div>
    </div>
  )
}
