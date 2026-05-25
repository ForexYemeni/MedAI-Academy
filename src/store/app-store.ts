import { create } from 'zustand'

export type PageId = 'home' | 'courses' | 'ai-tutor' | 'simulation' | 'shorts' | 'quizzes' | 'community' | 'profile' | 'subscription' | 'admin' | 'auth'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
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
  progress?: number
  lessons: number
  tags: string[]
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
  name: string
  email: string
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
}

interface AppState {
  // Navigation
  activePage: PageId
  setActivePage: (page: PageId) => void
  
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
  
  // Simulation
  simulationCases: SimulationCase[]
  activeSimulation: SimulationCase | null
  setActiveSimulation: (sim: SimulationCase | null) => void
  
  // Quiz
  quizQuestions: QuizQuestion[]
  currentQuizIndex: number
  quizScore: number
  quizActive: boolean
  setCurrentQuizIndex: (index: number) => void
  setQuizScore: (score: number) => void
  setQuizActive: (active: boolean) => void
  
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
  
  // Notifications
  notifications: Array<{id: string; title: string; message: string; type: 'info' | 'success' | 'warning'; read: boolean; timestamp: number}>
  
  // Auth
  isLoggedIn: boolean
  setIsLoggedIn: (loggedIn: boolean) => void
  showAuthModal: boolean
  setShowAuthModal: (show: boolean) => void
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
  
  // User
  user: {
    name: 'د. أحمد الخالدي',
    email: 'ahmed@medai.com',
    avatar: '',
    xp: 3750,
    coins: 1250,
    level: getLevelForXP(3750),
    rankTitle: getRankForXP(3750).title,
    rankIcon: getRankForXP(3750).icon,
    streak: 14,
    maxStreak: 28,
    completedCourses: 12,
    totalHours: 156,
    badges: [
      { id: '1', name: 'First Steps', nameAr: 'الخطوات الأولى', description: 'أكمل أول درس', icon: '🎯', earned: true, earnedAt: Date.now() - 86400000 * 30, rarity: 'common' },
      { id: '2', name: 'Streak Master', nameAr: 'سيد التتابع', description: '7 أيام متتالية', icon: '🔥', earned: true, earnedAt: Date.now() - 86400000 * 7, rarity: 'rare' },
      { id: '3', name: 'Quiz Champion', nameAr: 'بطل الاختبارات', description: '100% في اختبار صعب', icon: '🏆', earned: true, earnedAt: Date.now() - 86400000 * 3, rarity: 'epic' },
      { id: '4', name: 'Life Saver', nameAr: 'منقذ الحياة', description: 'أكمل محاكاة إنقاذ', icon: '❤️', earned: true, earnedAt: Date.now() - 86400000, rarity: 'legendary' },
      { id: '5', name: 'Night Owl', nameAr: 'بومة الليل', description: 'ادرس بعد منتصف الليل', icon: '🦉', earned: false, rarity: 'rare' },
      { id: '6', name: 'ICU Ready', nameAr: 'جاهز للعناية المركزة', description: 'أكمل كل محاكاة ICU', icon: '🏥', earned: false, rarity: 'legendary' },
    ],
    joinDate: '2025-09-15',
    subscription: 'premium',
    medicalSpecialty: 'طب الطوارئ',
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
  
  // Courses
  courses: [
    { id: '1', title: 'Emergency Medicine Masterclass', titleAr: 'دورة طب الطوارئ الشاملة', description: 'أكبر دورة طب طوارئ عربية', category: 'emergency', thumbnail: '', instructor: 'د. محمد العلي', rating: 4.9, students: 15200, duration: '42 ساعة', level: 'advanced', price: 0, isPremium: false, progress: 65, lessons: 120, tags: ['طوارئ', 'ACLs', 'trauma'] },
    { id: '2', title: 'Cardiology Essentials', titleAr: 'أساسيات أمراض القلب', description: 'تعلم أمراض القلب من الصفر', category: 'cardiology', thumbnail: '', instructor: 'د. سارة الأحمد', rating: 4.8, students: 8900, duration: '28 ساعة', level: 'intermediate', price: 49, isPremium: true, progress: 30, lessons: 85, tags: ['قلب', 'ECG', 'أمراض قلبية'] },
    { id: '3', title: 'Neurology Deep Dive', titleAr: 'الغوص في علم الأعصاب', description: 'كل ما تحتاجه عن الأعصاب', category: 'neurology', thumbnail: '', instructor: 'د. خالد المنصور', rating: 4.7, students: 6300, duration: '35 ساعة', level: 'advanced', price: 59, isPremium: true, progress: 0, lessons: 95, tags: ['أعصاب', 'stroke', 'دماغ'] },
    { id: '4', title: 'Pediatrics Fundamentals', titleAr: 'أساسيات طب الأطفال', description: 'طب الأطفال بطريقة ممتعة', category: 'pediatrics', thumbnail: '', instructor: 'د. نورة الحربي', rating: 4.9, students: 11200, duration: '30 ساعة', level: 'beginner', price: 0, isPremium: false, progress: 85, lessons: 90, tags: ['أطفال', 'حديثي الولادة', 'لقاحات'] },
    { id: '5', title: 'Surgery Techniques', titleAr: 'تقنيات الجراحة', description: 'تعلم الجراحة خطوة بخطوة', category: 'surgery', thumbnail: '', instructor: 'د. فهد العمري', rating: 4.6, students: 4500, duration: '50 ساعة', level: 'advanced', price: 79, isPremium: true, progress: 0, lessons: 140, tags: ['جراحة', 'خياطة', 'تنظير'] },
    { id: '6', title: 'Internal Medicine Review', titleAr: 'مراجعة الطب الباطني', description: 'مراجعة شاملة للطب الباطني', category: 'internal', thumbnail: '', instructor: 'د. ليلى القحطاني', rating: 4.8, students: 9800, duration: '38 ساعة', level: 'intermediate', price: 39, isPremium: true, progress: 45, lessons: 110, tags: ['باطني', 'تشخيص', 'علاج'] },
    { id: '7', title: 'Radiology Interpretation', titleAr: 'تفسير الأشعة', description: 'اتقان قراءة الأشعة', category: 'radiology', thumbnail: '', instructor: 'د. عمر الشمري', rating: 4.7, students: 5600, duration: '25 ساعة', level: 'intermediate', price: 49, isPremium: true, progress: 0, lessons: 75, tags: ['أشعة', 'CT', 'MRI'] },
    { id: '8', title: 'Pharmacology Made Easy', titleAr: 'علم الأدوية مبسط', description: 'أدوية بشكل سهل وممتع', category: 'pharmacology', thumbnail: '', instructor: 'د. ريم الدوسري', rating: 4.9, students: 13500, duration: '32 ساعة', level: 'beginner', price: 0, isPremium: false, progress: 50, lessons: 100, tags: ['أدوية', 'جرعات', 'تداخلات'] },
  ],
  
  // Simulation
  simulationCases: [
    { id: '1', title: 'Cardiac Arrest', titleAr: 'توقف القلب', specialty: 'emergency', difficulty: 'hard', duration: 15, vitals: { hr: 0, bp: '0/0', spo2: 0, temp: 36.2, rr: 0 }, symptoms: ['فقدان الوعي', 'لا نبض', 'تنفس متوقف'], scenario: 'مريض عمره 55 سنة وصل لقسم الطوارئ فاقد الوعي ولا نبض له. ابدأ الإنعاش!', isLocked: false },
    { id: '2', title: 'Stroke Assessment', titleAr: 'تقييم السكتة الدماغية', specialty: 'neurology', difficulty: 'medium', duration: 20, vitals: { hr: 88, bp: '180/110', spo2: 94, temp: 37.1, rr: 18 }, symptoms: ['ضعف في الجهة اليسرى', 'صعوبة الكلام', 'انحراف الفم'], scenario: 'مريضة 68 سنة حضرت بقصة ضعف مفاجئ في الجهة اليسرى منذ 45 دقيقة.', isLocked: false },
    { id: '3', title: 'Anaphylaxis', titleAr: 'صدمة تحسسية', specialty: 'emergency', difficulty: 'medium', duration: 10, vitals: { hr: 130, bp: '70/40', spo2: 88, temp: 37.0, rr: 28 }, symptoms: ['تورم الوجه', 'ضيق تنفس شديد', 'طفح جلدي منتشر', 'انخفاض ضغط'], scenario: 'مريض 30 سنة بعد تناول فول سوداني ظهرت أعراض تحسسية شديدة.', isLocked: false },
    { id: '4', title: 'ICU Sepsis', titleAr: 'إنتان الدم في العناية المركزة', specialty: 'icu', difficulty: 'expert', duration: 30, vitals: { hr: 115, bp: '85/50', spo2: 91, temp: 39.2, rr: 24 }, symptoms: ['حمى عالية', 'انخفاض ضغط', 'تسارع القلب', 'تشوش ذهني'], scenario: 'مريض 72 سنة في العناية المركزة مع إنتان دموي شديد.', isLocked: true },
    { id: '5', title: 'Trauma Assessment', titleAr: 'تقييم الرضح', specialty: 'emergency', difficulty: 'hard', duration: 20, vitals: { hr: 110, bp: '90/60', spo2: 93, temp: 36.5, rr: 22 }, symptoms: ['جرح في البطن', 'نزيف خارجي', 'ألم شديد'], scenario: 'مصاب في حادث مروري مع إصابات متعددة.', isLocked: false },
    { id: '6', title: 'Diabetic Emergency', titleAr: 'طوارئ السكري', specialty: 'internal', difficulty: 'easy', duration: 12, vitals: { hr: 95, bp: '130/85', spo2: 97, temp: 36.8, rr: 20 }, symptoms: ['تشوش', 'عرق شديد', 'رعشة'], scenario: 'مريض سكري 45 سنة حضر بحالة تشوش وعرق شديد.', isLocked: false },
  ],
  activeSimulation: null,
  setActiveSimulation: (sim) => set({ activeSimulation: sim }),
  
  // Quiz
  quizQuestions: [
    { id: '1', question: 'ما هو العلاج الأولي لصدمة التأقية (Anaphylaxis)؟', options: ['هيدروكورتيزون', 'أدرينالين عضلي', 'ديفينهيدرامين', 'سوائل وريدية'], correctIndex: 1, explanation: 'الأدرينالين العضلي هو العلاج الأولي والأهم في صدمة التأقية، ويُعطى في الفخذ الخارجي.', difficulty: 'medium', category: 'emergency' },
    { id: '2', question: 'أي مما يلي يعتبر من علامات السكتة الدماغية؟', options: ['ألم صدري', 'انحراف الفم والضعف الأحادي', 'حمى عالية', 'طفح جلدي'], correctIndex: 1, explanation: 'انحراف الفم والضعف في جهة واحدة من العلامات الكلاسيكية للسكتة الدماغية.', difficulty: 'easy', category: 'neurology' },
    { id: '3', question: 'ما هي نسبة SpO2 الطبيعية؟', options: ['85-90%', '90-95%', '95-100%', '80-85%'], correctIndex: 2, explanation: 'النسبة الطبيعية لتشبع الأكسجين في الدم تتراوح بين 95-100%.', difficulty: 'easy', category: 'general' },
    { id: '4', question: 'في CPR للبالغين، ما نسبة الضغط إلى التنفس؟', options: ['15:2', '30:2', '30:1', '10:2'], correctIndex: 1, explanation: 'النسبة القياسية لإنعاش القلب للبالغين هي 30 ضغطة صدرية إلى 2 نفخة تنفسية.', difficulty: 'easy', category: 'emergency' },
    { id: '5', question: 'ما هو المؤشر الأهم لتشخيص احتشاء عضلة القلب الحاد؟', options: ['ارتفاع الضغط', 'تغيرات ST في ECG', 'تسارع القلب', 'ألم في الرقبة'], correctIndex: 1, explanation: 'ارتفاع شريحة ST في تخطيط القلب الكهربائي هو المؤشر الأهم لتشخيص احتشاء عضلة القلب الحاد STEMI.', difficulty: 'medium', category: 'cardiology' },
    { id: '6', question: 'أي دواء يُستخدم كخط أول لرفع ضغط الدم في الإنتان الدموي؟', options: ['دوبامين', 'نورأدرينالين', 'أدرينالين', 'فينيليفرين'], correctIndex: 1, explanation: 'النورأدرينالين هو الدواء الأول الموصى به لرفع ضغط الدم في الإنتان الدموي حسب إرشادات Surviving Sepsis.', difficulty: 'hard', category: 'icu' },
    { id: '7', question: 'ما هي جرعة الأدرينالين في صدمة التأقية للبالغين؟', options: ['0.1 mg', '0.3-0.5 mg', '1 mg', '0.05 mg'], correctIndex: 1, explanation: 'الجرعة القياسية هي 0.3-0.5 ملغ (0.3-0.5 مل من تركيز 1:1000) عضلياً.', difficulty: 'medium', category: 'emergency' },
    { id: '8', question: 'ما هو الـ Glasgow Coma Scale لشخص يفتح عينيه استجابة للألم وينطق كلمات غير مفهومة ويبعد الألم؟', options: ['GCS 8', 'GCS 9', 'GCS 10', 'GCS 7'], correctIndex: 0, explanation: 'E2 (فتح العين للألم) + V2 (أصوات غير مفهومة) + M4 (إبعاد الألم) = GCS 8.', difficulty: 'hard', category: 'neurology' },
    { id: '9', question: 'ما هو الترتيب الصحيح لتقييم المريض في الطوارئ (ABC)؟', options: ['Airway, Breathing, Circulation', 'Circulation, Airway, Breathing', 'Breathing, Circulation, Airway', 'Airway, Circulation, Breathing'], correctIndex: 0, explanation: 'الترتيب القياسي هو المجرى الهوائي أولاً، ثم التنفس، ثم الدورة الدموية.', difficulty: 'easy', category: 'emergency' },
    { id: '10', question: 'أي مما يلي ليس من معايير تشخيص متلازمة الضائقة التنفسية الحادة (ARDS)؟', options: ['نسبة PaO2/FiO2 أقل من 300', ' infiltrates ثنائي الجانب في الأشعة', 'ضغط انسداد الشعيرة الرئوية > 18', 'ظهور حاد خلال أسبوع'], correctIndex: 2, explanation: 'معايير برلين لتشخيص ARDS لا تتضمن قياس ضغط انسداد الشعيرة الرئوية كشرط، بل تستبعد السبب القلبي.', difficulty: 'hard', category: 'icu' },
  ],
  currentQuizIndex: 0,
  quizScore: 0,
  quizActive: false,
  setCurrentQuizIndex: (index) => set({ currentQuizIndex: index }),
  setQuizScore: (score) => set({ quizScore: score }),
  setQuizActive: (active) => set({ quizActive: active }),
  
  // Shorts
  shorts: [
    { id: '1', title: 'كيف تقرأ ECG في 60 ثانية', thumbnail: '', duration: 60, views: 45000, likes: 3200, category: 'cardiology', instructor: 'د. محمد' },
    { id: '2', title: '3 أخطاء قاتلة في CPR', thumbnail: '', duration: 45, views: 89000, likes: 7800, category: 'emergency', instructor: 'د. سارة' },
    { id: '3', title: 'الفرق بين Stroke و TIA', thumbnail: '', duration: 90, views: 32000, likes: 2100, category: 'neurology', instructor: 'د. خالد' },
    { id: '4', title: 'أدوية الطوارئ التي يجب حفظها', thumbnail: '', duration: 75, views: 67000, likes: 5400, category: 'pharmacology', instructor: 'د. ريم' },
    { id: '5', title: 'كيف تفحص المريض سريرياً', thumbnail: '', duration: 120, views: 51000, likes: 4200, category: 'general', instructor: 'د. فهد' },
    { id: '6', title: 'أسرار قراءة الأشعة الصدرية', thumbnail: '', duration: 80, views: 38000, likes: 2900, category: 'radiology', instructor: 'د. عمر' },
  ],
  
  // Gamification
  dailyMissions: [
    { id: '1', title: 'Daily Lesson', titleAr: 'الدرس اليومي', description: 'أكمل درساً واحداً اليوم', xpReward: 50, coinReward: 10, progress: 1, target: 1, type: 'lesson', completed: true },
    { id: '2', title: 'Quiz Master', titleAr: 'بطل الاختبارات', description: 'أجب على 10 أسئلة بشكل صحيح', xpReward: 100, coinReward: 25, progress: 7, target: 10, type: 'quiz', completed: false },
    { id: '3', title: 'Simulation Hero', titleAr: 'بطل المحاكاة', description: 'أكمل محاكاة طبية واحدة', xpReward: 150, coinReward: 30, progress: 0, target: 1, type: 'simulation', completed: false },
    { id: '4', title: 'Study Streak', titleAr: 'تتابع الدراسة', description: 'حافظ على تتابع 7 أيام', xpReward: 200, coinReward: 50, progress: 5, target: 7, type: 'streak', completed: false },
  ],
  leaderboard: [
    { rank: 1, name: 'د. ليلى القحطاني', avatar: '', xp: 28500, level: 17, rankTitle: 'جراح', streak: 45 },
    { rank: 2, name: 'د. محمد العلي', avatar: '', xp: 24200, level: 16, rankTitle: 'جراح', streak: 38 },
    { rank: 3, name: 'د. سارة الأحمد', avatar: '', xp: 19800, level: 15, rankTitle: 'أخصائي', streak: 32 },
    { rank: 4, name: 'د. خالد المنصور', avatar: '', xp: 15600, level: 13, rankTitle: 'أخصائي', streak: 28 },
    { rank: 5, name: 'د. أحمد الخالدي', avatar: '', xp: 3750, level: 7, rankTitle: 'طبيب مقيم', streak: 14 },
    { rank: 6, name: 'د. نورة الحربي', avatar: '', xp: 3200, level: 6, rankTitle: 'طبيب مقيم', streak: 12 },
    { rank: 7, name: 'د. فهد العمري', avatar: '', xp: 2800, level: 6, rankTitle: 'ممرض', streak: 9 },
    { rank: 8, name: 'د. ريم الدوسري', avatar: '', xp: 2100, level: 5, rankTitle: 'ممرض', streak: 7 },
    { rank: 9, name: 'د. عمر الشمري', avatar: '', xp: 1500, level: 4, rankTitle: 'ممرض', streak: 5 },
    { rank: 10, name: 'د. هند المالكي', avatar: '', xp: 800, level: 3, rankTitle: 'طالب طب', streak: 3 },
  ],
  
  // Community
  communityGroups: [
    { id: '1', name: 'Emergency Medicine', nameAr: 'طب الطوارئ', members: 12500, icon: '🚑', unread: 5 },
    { id: '2', name: 'Cardiology Club', nameAr: 'نادي القلب', members: 8900, icon: '❤️', unread: 2 },
    { id: '3', name: 'Study Room - Anatomy', nameAr: 'غرفة دراسة - تشريح', members: 3200, icon: '🦴', unread: 0 },
    { id: '4', name: 'Exam Prep Board', nameAr: 'لوحة تحضير الامتحانات', members: 15700, icon: '📝', unread: 12 },
    { id: '5', name: 'Case Discussion', nameAr: 'مناقشة الحالات', members: 6800, icon: '🩺', unread: 3 },
    { id: '6', name: 'Surgery Techniques', nameAr: 'تقنيات الجراحة', members: 4500, icon: '🔪', unread: 0 },
  ],
  
  // UI
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  language: 'ar',
  setLanguage: (lang) => set({ language: lang }),
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  // Notifications
  notifications: [
    { id: '1', title: 'حصتك اليومية! 🔥', message: 'لا تنسَ دراستك اليوم - تتابعك 14 يوم مستمر!', type: 'info', read: false, timestamp: Date.now() - 3600000 },
    { id: '2', title: 'ترقية جديدة! 🎉', message: 'لقد ترقيت إلى رتبة "طبيب مقيم"!', type: 'success', read: false, timestamp: Date.now() - 7200000 },
    { id: '3', title: 'دورة جديدة متاحة', message: 'دورة "تقنيات الجراحة" متاحة الآن!', type: 'info', read: true, timestamp: Date.now() - 86400000 },
  ],
  
  // Auth
  isLoggedIn: true,
  setIsLoggedIn: (loggedIn) => set({ isLoggedIn: loggedIn }),
  showAuthModal: false,
  setShowAuthModal: (show) => set({ showAuthModal: show }),
}))
