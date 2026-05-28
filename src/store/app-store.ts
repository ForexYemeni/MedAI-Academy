import { create } from 'zustand'

export type PageId = 'home' | 'courses' | 'course-viewer' | 'ai-tutor' | 'simulation' | 'shorts' | 'quizzes' | 'community' | 'profile' | 'subscriptions' | 'auth' | 'admin'

// ─── Default Data (fallbacks to prevent crashes) ───────────────────
const DEFAULT_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'dq1',
    question: 'ما هي الخطوة الأولى في تقييم مريض يعاني من ضيق تنفس حاد؟',
    options: ['فحص المجرى الهوائي', 'إعطاء أكسجين', 'قياس الضغط', 'طلب أشعة صدر'],
    correctIndex: 0,
    explanation: 'فحص المجرى الهوائي هو الخطوة الأولى والأهم في تقييم أي مريض يعاني من ضيق تنفس، وفقاً لبروتوكول ABC.',
    difficulty: 'medium',
    category: 'emergency',
  },
  {
    id: 'dq2',
    question: 'ما هو العلاج الأولي لصدمة تحسسية (Anaphylaxis)؟',
    options: ['مضاد حيوي', 'أدرينالين عضلي', 'كورتيزون وريدي', 'مضاد هيستامين'],
    correctIndex: 1,
    explanation: 'الأدرينالين العضلي هو العلاج الأولي والأهم في حالات الصدمة التحسسية ويجب إعطاؤه فوراً.',
    difficulty: 'hard',
    category: 'emergency',
  },
  {
    id: 'dq3',
    question: 'ما هو الضغط الدموي الطبيعي للبالغين؟',
    options: ['90/60', '120/80', '140/90', '160/100'],
    correctIndex: 1,
    explanation: 'الضغط الدموي الطبيعي للبالغين هو 120/80 ملم زئبق تقريباً.',
    difficulty: 'easy',
    category: 'general',
  },
]

const DEFAULT_SIMULATION_CASES: SimulationCase[] = [
  {
    id: 'ds1',
    title: 'توقف القلب',
    titleAr: 'توقف القلب',
    specialty: 'emergency',
    difficulty: 'hard',
    duration: 15,
    vitals: { hr: 0, bp: '0/0', spo2: 0, temp: 36.5, rr: 0 },
    symptoms: ['فقدان الوعي', 'انقطاع النبض', 'توقف التنفس'],
    scenario: 'مريض عمره 55 عاماً وصل لقسم الطوارئ فاقداً للوعي ولا يوجد نبض أو تنفس.',
    isLocked: false,
  },
  {
    id: 'ds2',
    title: 'تقييم السكتة الدماغية',
    titleAr: 'تقييم السكتة الدماغية',
    specialty: 'neurology',
    difficulty: 'medium',
    duration: 20,
    vitals: { hr: 88, bp: '180/100', spo2: 94, temp: 37.2, rr: 18 },
    symptoms: ['ضعف في الجهة اليسرى', 'صعوبة في الكلام', 'صداع شديد'],
    scenario: 'مريض عمره 65 عاماً يعاني من ضعف مفاجئ في الجهة اليسرى وصعوبة في الكلام منذ ساعة.',
    isLocked: false,
  },
  {
    id: 'ds3',
    title: 'صدمة تحسسية',
    titleAr: 'صدمة تحسسية',
    specialty: 'emergency',
    difficulty: 'medium',
    duration: 10,
    vitals: { hr: 120, bp: '70/40', spo2: 88, temp: 36.8, rr: 28 },
    symptoms: ['طفح جلدي', 'تورم الشفتين', 'ضيق تنفس شديد'],
    scenario: 'مريض عمره 30 عاماً ظهرت عليه أعراض تحسسية شديدة بعد تناول وجبة تحتوي على فول سوداني.',
    isLocked: false,
  },
]

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface Lesson {
  id: string
  courseId: string
  title: string
  titleAr: string
  type: 'video' | 'article' | 'quiz' | 'simulation' | 'flashcard'
  duration: number // minutes
  order: number
  isFree: boolean
  content?: string // markdown-like content for article lessons
  videoUrl?: string
  summary?: string
  keyPoints?: string[]
}

export interface CourseProgress {
  courseId: string
  completedLessons: string[]
  lastAccessedLessonId: string | null
  progress: number // 0-100
  lastAccessedAt: number
}

export interface Course {
  id: string
  title: string
  titleAr: string
  description: string
  category: string
  thumbnail: string
  instructor: string
  rating: number
  students: number
  duration: string
  level: 'beginner' | 'intermediate' | 'advanced'
  price: number
  isPremium: boolean
  isGifted?: boolean
  giftedAt?: string | null
  progress?: number
  lessons: number
  tags: string[]
  lessonsData?: Lesson[]
}

export interface SimulationCase {
  id: string
  title: string
  titleAr: string
  specialty: string
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'
  duration: number
  vitals: {
    hr: number
    bp: string
    spo2: number
    temp: number
    rr: number
  }
  symptoms: string[]
  scenario: string
  isLocked: boolean
}

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctIndex: number
  explanation: string
  difficulty: 'easy' | 'medium' | 'hard'
  category: string
}

export interface Badge {
  id: string
  name: string
  nameAr: string
  description: string
  icon: string
  earned: boolean
  earnedAt?: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export interface LeaderboardEntry {
  rank: number
  name: string
  avatar: string
  xp: number
  level: number
  rankTitle: string
  streak: number
}

export interface DailyMission {
  id: string
  title: string
  titleAr: string
  description: string
  xpReward: number
  coinReward: number
  progress: number
  target: number
  type: 'lesson' | 'quiz' | 'simulation' | 'streak' | 'community'
  completed: boolean
}

export interface ShortVideo {
  id: string
  title: string
  thumbnail: string
  duration: number
  views: number
  likes: number
  category: string
  instructor: string
}

export interface UserProfile {
  id: string
  name: string
  phone: string
  avatar: string
  xp: number
  coins: number
  level: number
  rankTitle: string
  rankIcon: string
  streak: number
  maxStreak: number
  completedCourses: number
  totalHours: number
  badges: Badge[]
  joinDate: string
  subscription: 'free' | 'premium' | 'instructor'
  medicalSpecialty: string
  role: 'admin' | 'user'
}

interface AppState {
  // Navigation
  activePage: PageId
  setActivePage: (page: PageId) => void
  activeCourseId: string | null
  setActiveCourseId: (courseId: string | null) => void
  activeLessonId: string | null
  setActiveLessonId: (lessonId: string | null) => void
  
  // User
  user: UserProfile
  updateUser: (updates: Partial<UserProfile>) => void
  
  // AI Tutor
  aiMessages: Message[]
  aiLoading: boolean
  addAiMessage: (message: Message) => void
  setAiLoading: (loading: boolean) => void
  clearAiMessages: () => void
  
  // Courses
  courses: Course[]
  lessons: Lesson[]
  courseProgress: CourseProgress[]
  openCourse: (courseId: string, lessonId?: string) => void
  completeLesson: (courseId: string, lessonId: string) => void
  getCourseProgress: (courseId: string) => CourseProgress | undefined
  enrollInCourse: (courseId: string) => void

  // Enrollment modal
  showEnrollModal: boolean
  setShowEnrollModal: (show: boolean) => void
  
  // Simulation
  simulationCases: SimulationCase[]
  activeSimulation: SimulationCase | null
  setActiveSimulation: (sim: SimulationCase | null) => void
  updateSimulationCases: (cases: SimulationCase[]) => void
  
  // Quiz
  quizQuestions: QuizQuestion[]
  currentQuizIndex: number
  quizScore: number
  quizActive: boolean
  setCurrentQuizIndex: (index: number) => void
  setQuizScore: (score: number) => void
  setQuizActive: (active: boolean) => void
  setQuizQuestions: (questions: QuizQuestion[]) => void
  
  // Shorts
  shorts: ShortVideo[]
  
  // Gamification
  dailyMissions: DailyMission[]
  leaderboard: LeaderboardEntry[]
  
  // Community
  communityGroups: Array<{id: string; name: string; nameAr: string; members: number; icon: string; unread: number}>
  
  // UI
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  language: 'ar' | 'en'
  setLanguage: (lang: 'ar' | 'en') => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  
  // Notifications (Enhanced)
  notifications: Array<{
    id: string
    title: string
    message: string
    type: 'info' | 'success' | 'warning' | 'achievement' | 'payment' | 'gift' | 'community' | 'simulation' | 'enrollment' | 'system'
    read: boolean
    timestamp: number
    link?: string
    category?: string
    icon?: string
  }>
  setNotifications: (notifications: Array<{
    id: string
    title: string
    message: string
    type: 'info' | 'success' | 'warning' | 'achievement' | 'payment' | 'gift' | 'community' | 'simulation' | 'enrollment' | 'system'
    read: boolean
    timestamp: number
    link?: string
    category?: string
    icon?: string
  }>) => void
  addNotification: (notification: {
    id: string
    title: string
    message: string
    type: 'info' | 'success' | 'warning' | 'achievement' | 'payment' | 'gift' | 'community' | 'simulation' | 'enrollment' | 'system'
    read?: boolean
    timestamp?: number
    link?: string
    category?: string
    icon?: string
  }) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  deleteNotification: (id: string) => void
  clearAllNotifications: () => void
  unreadNotificationCount: number
  unreadByCategory: Record<string, number>
  
  // Auth
  isLoggedIn: boolean
  setIsLoggedIn: (loggedIn: boolean) => void
  authToken: string | null
  setAuthToken: (token: string | null) => void
  mustChangePassword: boolean
  setMustChangePassword: (must: boolean) => void
  showAuthModal: boolean
  setShowAuthModal: (show: boolean) => void
  logout: () => void

  // Offline
  isOnline: boolean
  setIsOnline: (online: boolean) => void
  wasOffline: boolean
  setWasOffline: (was: boolean) => void
  cachedLessons: string[] // lesson IDs that are cached for offline
  addCachedLesson: (lessonId: string) => void
  isLessonCachedOffline: (lessonId: string) => boolean

  // Toast notifications (ephemeral, for real-time display)
  _toastNotifications: Array<{
    id: string
    title: string
    message: string
    type: string
    onClick?: () => void
  }>
  addToast: (toast: { id: string; title: string; message: string; type: string; onClick?: () => void }) => void
  removeToast: (id: string) => void
}

const MEDICAL_RANKS = [
  { title: 'طالب طب', titleEn: 'Intern', minXP: 0, icon: '🩺' },
  { title: 'ممرض', titleEn: 'Nurse', minXP: 500, icon: '💊' },
  { title: 'طبيب مقيم', titleEn: 'Resident', minXP: 2000, icon: '🏥' },
  { title: 'أخصائي', titleEn: 'Specialist', minXP: 5000, icon: '⚕️' },
  { title: 'جراح', titleEn: 'Surgeon', minXP: 10000, icon: '🔪' },
  { title: 'خبير طوارئ', titleEn: 'Trauma Master', minXP: 20000, icon: '🚑' },
  { title: 'قائد العناية المركزة', titleEn: 'ICU Commander', minXP: 50000, icon: '👑' },
]

function getRankForXP(xp: number) {
  let rank = MEDICAL_RANKS[0]
  for (const r of MEDICAL_RANKS) {
    if (xp >= r.minXP) rank = r
  }
  return rank
}

function getLevelForXP(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1
}

export const useAppStore = create<AppState>((set, get) => ({
  // Navigation
  activePage: 'home',
  setActivePage: (page) => set({ activePage: page }),
  activeCourseId: null,
  setActiveCourseId: (courseId) => set({ activeCourseId: courseId }),
  activeLessonId: null,
  setActiveLessonId: (lessonId) => set({ activeLessonId: lessonId }),
  
  // User
  user: {
    id: '',
    name: '',
    phone: '',
    avatar: '',
    xp: 0,
    coins: 0,
    level: 1,
    rankTitle: 'طالب طب',
    rankIcon: '🩺',
    streak: 0,
    maxStreak: 0,
    completedCourses: 0,
    totalHours: 0,
    badges: [],
    joinDate: '',
    subscription: 'free' as const,
    medicalSpecialty: '',
    role: 'user' as const,
  },
  updateUser: (updates) => set((state) => {
    const newUser = { ...state.user, ...updates }
    const rank = getRankForXP(newUser.xp)
    newUser.level = getLevelForXP(newUser.xp)
    newUser.rankTitle = rank.title
    newUser.rankIcon = rank.icon
    return { user: newUser }
  }),
  
  // AI Tutor
  aiMessages: [
    {
      id: '1',
      role: 'assistant',
      content: 'مرحباً! أنا مساعدك الطبي الذكي 🧠\\n\\nيمكنني مساعدتك في:\\n- شرح أي مفهوم طبي\\n- توليد حالات سريرية\\n- اختبارات سريعة\\n- خطط تعلم مخصصة\\n- تلخيص المحتوى\\n- بطاقات مراجعة\\n\\nكيف يمكنني مساعدتك اليوم؟',
      timestamp: Date.now(),
    }
  ],
  aiLoading: false,
  addAiMessage: (message) => set((state) => ({ aiMessages: [...state.aiMessages, message] })),
  setAiLoading: (loading) => set({ aiLoading: loading }),
  clearAiMessages: () => set({ aiMessages: [] }),
  
  // Courses (fetched from API)
  courses: [],

  // Lessons (fetched from API on demand)
  lessons: [],

  // Course progress - initialize empty
  courseProgress: [],

  // Enrollment modal
  showEnrollModal: false,
  setShowEnrollModal: (show) => set({ showEnrollModal: show }),

  // Simulation
  simulationCases: DEFAULT_SIMULATION_CASES,
  activeSimulation: null,
  setActiveSimulation: (sim) => set({ activeSimulation: sim }),
  updateSimulationCases: (cases) => set({ simulationCases: cases }),

  // Quiz
  quizQuestions: DEFAULT_QUIZ_QUESTIONS,
  currentQuizIndex: 0,
  quizScore: 0,
  quizActive: false,
  setCurrentQuizIndex: (index) => set({ currentQuizIndex: index }),
  setQuizScore: (score) => set({ quizScore: score }),
  setQuizActive: (active) => set({ quizActive: active }),
  setQuizQuestions: (questions) => set({ quizQuestions: questions }),

  // Shorts
  shorts: [],

  // Gamification
  dailyMissions: [],
  leaderboard: [],

  // Community
  communityGroups: [],

  // UI
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  language: 'ar' as const,
  setLanguage: (lang) => set({ language: lang }),
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),

  // Notifications
  notifications: [],
  setNotifications: (notifications) => set({ notifications }),
  addNotification: (notification) => set((state) => {
    const newNotification = { ...notification, read: notification.read ?? false, timestamp: notification.timestamp ?? Date.now() }
    const exists = state.notifications.some(n => n.id === notification.id)
    if (exists) return state
    const updated = [newNotification, ...state.notifications]
    const unreadCount = updated.filter(n => !n.read).length
    const unreadByCategory: Record<string, number> = {}
    updated.filter(n => !n.read).forEach(n => {
      const cat = n.type || 'info'
      unreadByCategory[cat] = (unreadByCategory[cat] || 0) + 1
    })
    return { notifications: updated, unreadNotificationCount: unreadCount, unreadByCategory }
  }),
  markNotificationRead: (id) => set((state) => {
    const updated = state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
    const unreadCount = updated.filter(n => !n.read).length
    const unreadByCategory: Record<string, number> = {}
    updated.filter(n => !n.read).forEach(n => {
      const cat = n.type || 'info'
      unreadByCategory[cat] = (unreadByCategory[cat] || 0) + 1
    })
    return { notifications: updated, unreadNotificationCount: unreadCount, unreadByCategory }
  }),
  markAllNotificationsRead: () => set((state) => {
    const updated = state.notifications.map(n => ({ ...n, read: true }))
    return { notifications: updated, unreadNotificationCount: 0, unreadByCategory: {} }
  }),
  deleteNotification: (id) => set((state) => {
    const updated = state.notifications.filter(n => n.id !== id)
    const unreadCount = updated.filter(n => !n.read).length
    const unreadByCategory: Record<string, number> = {}
    updated.filter(n => !n.read).forEach(n => {
      const cat = n.type || 'info'
      unreadByCategory[cat] = (unreadByCategory[cat] || 0) + 1
    })
    return { notifications: updated, unreadNotificationCount: unreadCount, unreadByCategory }
  }),
  clearAllNotifications: () => set({ notifications: [], unreadNotificationCount: 0, unreadByCategory: {} }),
  unreadNotificationCount: 0,
  unreadByCategory: {},

  openCourse: (courseId, lessonId) => {
    const state = get()
    const course = state.courses.find(c => c.id === courseId)
    if (!course) return

    const progress = state.courseProgress.find(p => p.courseId === courseId)
    const isEnrolled = !!progress

    // Free courses auto-enroll
    if (course.price === 0 && !isEnrolled) {
      const courseLessons = state.lessons.filter(l => l.courseId === courseId)
      const firstLesson = courseLessons.sort((a, b) => a.order - b.order)[0]
      const newProgress: CourseProgress = {
        courseId,
        completedLessons: [],
        lastAccessedLessonId: firstLesson?.id || null,
        progress: 0,
        lastAccessedAt: Date.now(),
      }
      const newProgressArr = [...state.courseProgress, newProgress]
      set({
        activeCourseId: courseId,
        activeLessonId: lessonId || firstLesson?.id || null,
        activePage: 'course-viewer' as PageId,
        courseProgress: newProgressArr,
      })
      if (typeof window !== 'undefined') {
        localStorage.setItem('medai-progress', JSON.stringify(newProgressArr))
      }
      return
    }

    // Paid courses - check server enrollment before showing pay modal
    if (course.price > 0 && !isEnrolled) {
      const token = state.authToken || (typeof window !== 'undefined' ? localStorage.getItem('medai-token') : null)
      if (token) {
        // Navigate to course viewer - it will verify enrollment with API
        // Do NOT create a local progress entry for paid courses without enrollment
        set({
          activeCourseId: courseId,
          activeLessonId: lessonId || null,
          activePage: 'course-viewer' as PageId,
        })
      } else {
        // No auth token - show enroll modal
        set({ showEnrollModal: true, activeCourseId: courseId })
      }
      return
    }

    // Already enrolled - navigate to course
    const targetLesson = lessonId || progress?.lastAccessedLessonId || null
    set({
      activeCourseId: courseId,
      activeLessonId: targetLesson,
      activePage: 'course-viewer' as PageId,
    })
  },

  completeLesson: (courseId, lessonId) => {
    const state = get()
    const existing = state.courseProgress.find(p => p.courseId === courseId)
    if (!existing) return

    if (existing.completedLessons.includes(lessonId)) return

    const course = state.courses.find(c => c.id === courseId)
    const lesson = state.lessons.find(l => l.id === lessonId && l.courseId === courseId)
    
    // For paid courses: only allow completing free lessons if not properly enrolled
    // A "proper" enrollment has completedLessons synced from server or the course is free
    if (course && course.price > 0 && lesson && !lesson.isFree) {
      // Check if user is actually enrolled (has server-synced progress)
      // If progress was created locally only (not from server), don't allow completing paid lessons
      // We check this by seeing if the progress was synced from server
      const isServerEnrolled = existing.progress > 0 || existing.completedLessons.length > 0
      // If this is a brand new progress entry with 0% and no completed lessons, 
      // it might be a local-only entry for a paid course
      if (!isServerEnrolled && existing.lastAccessedAt > Date.now() - 60000) {
        // This is a newly created local progress entry, probably not enrolled
        // Only allow completing free lessons
        return
      }
    }

    const courseLessons = state.lessons.filter(l => l.courseId === courseId)
    const newCompleted = [...existing.completedLessons, lessonId]
    
    // Calculate progress based only on lessons the user can access
    // For paid courses with free lessons, progress is based on accessible lessons
    const totalForProgress = courseLessons.length // Always use total for percentage
    const progressPercent = totalForProgress > 0 ? Math.round((newCompleted.length / totalForProgress) * 100) : 0

    const updatedProgress: CourseProgress = {
      ...existing,
      completedLessons: newCompleted,
      lastAccessedLessonId: lessonId,
      progress: progressPercent,
      lastAccessedAt: Date.now(),
    }

    const newProgressArr = state.courseProgress.map(p =>
      p.courseId === courseId ? updatedProgress : p
    )

    set({ courseProgress: newProgressArr })

    if (typeof window !== 'undefined') {
      localStorage.setItem('medai-progress', JSON.stringify(newProgressArr))
    }
    
    // Sync to server
    const token = state.authToken || (typeof window !== 'undefined' ? localStorage.getItem('medai-token') : null)
    if (token) {
      fetch('/api/enrollment/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ courseId, lessonId }),
      }).catch(() => {})
    }
  },

  getCourseProgress: (courseId) => {
    return get().courseProgress.find(p => p.courseId === courseId)
  },

  enrollInCourse: (courseId) => {
    const state = get()
    const existing = state.courseProgress.find(p => p.courseId === courseId)
    if (existing) return // Already enrolled

    const courseLessons = state.lessons.filter(l => l.courseId === courseId)
    const firstLesson = courseLessons.sort((a, b) => a.order - b.order)[0]
    const newProgress: CourseProgress = {
      courseId,
      completedLessons: [],
      lastAccessedLessonId: firstLesson?.id || null,
      progress: 0,
      lastAccessedAt: Date.now(),
    }
    const newProgressArr = [...state.courseProgress, newProgress]
    set({
      courseProgress: newProgressArr,
      showEnrollModal: false,
      activeCourseId: courseId,
      activeLessonId: firstLesson?.id || null,
      activePage: 'course-viewer' as PageId,
    })
    if (typeof window !== 'undefined') {
      localStorage.setItem('medai-progress', JSON.stringify(newProgressArr))
    }
  },

  // Auth
  isLoggedIn: false,
  setIsLoggedIn: (loggedIn) => {
    set({ isLoggedIn: loggedIn })
    if (typeof window !== 'undefined') {
      localStorage.setItem('medai-auth', loggedIn ? 'true' : 'false')
    }
  },
  authToken: null,
  setAuthToken: (token) => {
    set({ authToken: token })
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('medai-token', token)
      } else {
        localStorage.removeItem('medai-token')
      }
    }
  },
  mustChangePassword: false,
  setMustChangePassword: (must) => set({ mustChangePassword: must }),
  showAuthModal: false,
  setShowAuthModal: (show) => set({ showAuthModal: show }),

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('medai-user')
      localStorage.removeItem('medai-auth')
      localStorage.removeItem('medai-progress')
      localStorage.removeItem('medai-token')
    }
    set({
      isLoggedIn: false,
      authToken: null,
      mustChangePassword: false,
      user: {
        id: '',
        name: '',
        phone: '',
        avatar: '',
        xp: 0,
        coins: 0,
        level: 1,
        rankTitle: 'طالب طب',
        rankIcon: '🩺',
        streak: 0,
        maxStreak: 0,
        completedCourses: 0,
        totalHours: 0,
        badges: [],
        joinDate: '',
        subscription: 'free' as const,
        medicalSpecialty: '',
        role: 'user' as const,
      },
      courseProgress: [],
      activePage: 'home' as PageId,
    })
  },

  // Offline
  isOnline: typeof window !== 'undefined' ? navigator.onLine : true,
  setIsOnline: (online) => set({ isOnline: online }),
  wasOffline: false,
  setWasOffline: (was) => set({ wasOffline: was }),
  cachedLessons: (() => {
    if (typeof window === 'undefined') return []
    try {
      const stored = localStorage.getItem('medai-cached-lessons')
      return stored ? JSON.parse(stored) : []
    } catch { return [] }
  })(),
  addCachedLesson: (lessonId) => set((state) => {
    if (state.cachedLessons.includes(lessonId)) return state
    const updated = [...state.cachedLessons, lessonId]
    if (typeof window !== 'undefined') {
      localStorage.setItem('medai-cached-lessons', JSON.stringify(updated))
    }
    return { cachedLessons: updated }
  }),
  isLessonCachedOffline: (lessonId) => get().cachedLessons.includes(lessonId),

  // Toast notifications
  _toastNotifications: [],
  addToast: (toast) => set((state) => ({
    _toastNotifications: [...state._toastNotifications, toast]
  })),
  removeToast: (id) => set((state) => ({
    _toastNotifications: state._toastNotifications.filter(t => t.id !== id)
  })),
}))

// Hydrate from localStorage on client
if (typeof window !== 'undefined') {
  const savedProgress = localStorage.getItem('medai-progress')
  if (savedProgress) {
    try {
      const parsed = JSON.parse(savedProgress)
      useAppStore.setState({ courseProgress: parsed })
    } catch { /* ignore */ }
  }

  const savedUser = localStorage.getItem('medai-user')
  if (savedUser) {
    try {
      const parsed = JSON.parse(savedUser)
      useAppStore.setState({ user: parsed, isLoggedIn: true })
    } catch { /* ignore */ }
  }

  const savedAuth = localStorage.getItem('medai-auth')
  if (savedAuth === 'true') {
    useAppStore.setState({ isLoggedIn: true })
  }

  const savedToken = localStorage.getItem('medai-token')
  if (savedToken) {
    useAppStore.setState({ authToken: savedToken })
  }

  const savedMustChange = localStorage.getItem('medai-must-change-password')
  if (savedMustChange === 'true') {
    useAppStore.setState({ mustChangePassword: true })
  }
}
