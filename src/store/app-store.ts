import { create } from 'zustand'

export type PageId = 'home' | 'courses' | 'course-viewer' | 'ai-tutor' | 'simulation' | 'shorts' | 'quizzes' | 'community' | 'profile' | 'auth' | 'admin'

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
  notifications: Array<{id: string; title: string; message: string; type: 'info' | 'success' | 'warning'; read: boolean; timestamp: number; link?: string}>
  setNotifications: (notifications: Array<{id: string; title: string; message: string; type: 'info' | 'success' | 'warning'; read: boolean; timestamp: number; link?: string}>) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  unreadNotificationCount: number
  
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
  
  // Courses
  courses: [
    { id: '1', title: 'Emergency Medicine Masterclass', titleAr: 'دورة طب الطوارئ الشاملة', description: 'أكبر دورة طب طوارئ عربية', category: 'emergency', thumbnail: '', instructor: 'د. محمد العلي', rating: 4.9, students: 15200, duration: '42 ساعة', level: 'advanced', price: 0, isPremium: false, progress: undefined, lessons: 12, tags: ['طوارئ', 'ACLs', 'trauma'] },
    { id: '2', title: 'Cardiology Essentials', titleAr: 'أساسيات أمراض القلب', description: 'تعلم أمراض القلب من الصفر', category: 'cardiology', thumbnail: '', instructor: 'د. سارة الأحمد', rating: 4.8, students: 8900, duration: '28 ساعة', level: 'intermediate', price: 27000, isPremium: true, progress: undefined, lessons: 10, tags: ['قلب', 'ECG', 'أمراض قلبية'] },
    { id: '3', title: 'Neurology Deep Dive', titleAr: 'الغوص في علم الأعصاب', description: 'كل ما تحتاجه عن الأعصاب', category: 'neurology', thumbnail: '', instructor: 'د. خالد المنصور', rating: 4.7, students: 6300, duration: '35 ساعة', level: 'advanced', price: 32000, isPremium: true, progress: undefined, lessons: 10, tags: ['أعصاب', 'stroke', 'دماغ'] },
    { id: '4', title: 'Pediatrics Fundamentals', titleAr: 'أساسيات طب الأطفال', description: 'طب الأطفال بطريقة ممتعة', category: 'pediatrics', thumbnail: '', instructor: 'د. نورة الحربي', rating: 4.9, students: 11200, duration: '30 ساعة', level: 'beginner', price: 0, isPremium: false, progress: undefined, lessons: 10, tags: ['أطفال', 'حديثي الولادة', 'لقاحات'] },
    { id: '5', title: 'Surgery Techniques', titleAr: 'تقنيات الجراحة', description: 'تعلم الجراحة خطوة بخطوة', category: 'surgery', thumbnail: '', instructor: 'د. فهد العمري', rating: 4.6, students: 4500, duration: '50 ساعة', level: 'advanced', price: 43000, isPremium: true, progress: undefined, lessons: 10, tags: ['جراحة', 'خياطة', 'تنظير'] },
    { id: '6', title: 'Internal Medicine Review', titleAr: 'مراجعة الطب الباطني', description: 'مراجعة شاملة للطب الباطني', category: 'internal', thumbnail: '', instructor: 'د. ليلى القحطاني', rating: 4.8, students: 9800, duration: '38 ساعة', level: 'intermediate', price: 21000, isPremium: true, progress: undefined, lessons: 10, tags: ['باطني', 'تشخيص', 'علاج'] },
    { id: '7', title: 'Radiology Interpretation', titleAr: 'تفسير الأشعة', description: 'اتقان قراءة الأشعة', category: 'radiology', thumbnail: '', instructor: 'د. عمر الشمري', rating: 4.7, students: 5600, duration: '25 ساعة', level: 'intermediate', price: 27000, isPremium: true, progress: undefined, lessons: 10, tags: ['أشعة', 'CT', 'MRI'] },
    { id: '8', title: 'Pharmacology Made Easy', titleAr: 'علم الأدوية مبسط', description: 'أدوية بشكل سهل وممتع', category: 'pharmacology', thumbnail: '', instructor: 'د. ريم الدوسري', rating: 4.9, students: 13500, duration: '32 ساعة', level: 'beginner', price: 0, isPremium: false, progress: undefined, lessons: 10, tags: ['أدوية', 'جرعات', 'تداخلات'] },
  ],

  // Lessons data for each course
  lessons: [
    // Course 1: Emergency Medicine
    { id: '1-1', courseId: '1', title: 'Introduction to Emergency Medicine', titleAr: 'مقدمة في طب الطوارئ', type: 'article', duration: 25, order: 1, isFree: true, content: '# مقدمة في طب الطوارئ\n\nطب الطوارئ هو أحد أهم التخصصات الطبية الذي يتعامل مع الحالات الحرجة والطارئة التي تتطلب تدخلاً فورياً لإنقاذ حياة المرضى.\n\n## ما هو طب الطوارئ؟\n\nطب الطوارئ هو التخصص الطبي الذي يركز على تشخيص وعلاج الأمراض والإصابات الحادة. يعمل أطباء الطوارئ في بيئة سريعة الإيقاع تتطلب اتخاذ قرارات حاسمة في أوقات حرجة.\n\n## أهمية طب الطوارئ\n\n- **الاستجابة السريعة**: القدرة على التقييم والعلاج الفوري\n- **إنقاذ الأرواح**: التدخل في اللحظات الحرجة يفرق بين الحياة والموت\n- **التعامل مع عدم اليقين**: القدرة على العمل في ظل معلومات محدودة\n- **العمل متعدد التخصصات**: التنسيق مع جميع التخصصات الطبية\n\n## المبادئ الأساسية\n\n### نظام ABC\n\nنظام ABC هو الأساس في تقييم أي مريض في الطوارئ:\n- **A - Airway**: تأمين المجرى الهوائي\n- **B - Breathing**: تقييم التنفس\n- **C - Circulation**: تقييم الدورة الدموية\n\n### التقييم الأولي (Primary Survey)\n\nيتم خلال أول 5-10 دقائق من وصول المريض ويركز على:\n1. فحص المجرى الهوائي مع حماية العمود الفقري العنقي\n2. تقييم التنفس والتهوية\n3. تقييم الدورة الدموية والنزيف\n4. تقييم العجز العصبي\n5. كشف المريض بالكامل\n\n### التقييم الثانوي (Secondary Survey)\n\nبعد استقرار حالة المريض، يتم إجراء فحص شامل من الرأس إلى القدم مع أخذ تاريخ طبي كامل.', summary: 'طب الطوارئ هو تخصص يركز على تشخيص وعلاج الحالات الحادة. نظام ABC هو الأساس: Airway, Breathing, Circulation.', keyPoints: ['نظام ABC هو أساس تقييم أي حالة طوارئ', 'التقييم الأولي يتم في أول 5-10 دقائق', 'التقييم الثانوي بعد استقرار المريض', 'طب الطوارئ يتطلب سرعة القرارة والدقة'] },
    { id: '1-2', courseId: '1', title: 'CPR & Cardiac Arrest', titleAr: 'الإنعاش القلبي وتوقف القلب', type: 'article', duration: 35, order: 2, isFree: true, content: '# الإنعاش القلبي الرئوي (CPR) وتوقف القلب\n\nتوقف القلب هو من أخطر الحالات الطبية التي يمكن مواجهتها في قسم الطوارئ. الإنعاش القلبي الرئوي هو الإجراء الأهم لإنقاذ حياة المريض.\n\n## تعريف توقف القلب\n\nتوقف القلب (Cardiac Arrest) هو التوقف المفاجئ لضخ القلب للدم، مما يؤدي إلى فقدان الوعي وعدم وجود نبض أو تنفس.\n\n## أنواع توقف القلب\n\n- **VF (الرجفان البطيني)**: النوع الأكثر شيوعاً، يمكن علاجه بالصدمة الكهربائية\n- **VT (تسرع القلب البطيني عديم النبض)**: يحتاج صدمة كهربائية أيضاً\n- **PEA (النشاط الكهربائي عديم النبض)**: لا يستجيب للصدمة\n- **Asystole (خط مستقيم)**: لا نشاط كهربائي، لا يستجيب للصدمة\n\n## خطوات CPR\n\n### للبالغين:\n1. **تأكد من السلامة** - تأكد من أمان المكان\n2. **تحقق من الاستجابة** - هز المريض واصرخ\n3. **اتصل بالإسعاف** - اطلب المساعدة فوراً\n4. **ابدأ بالضغط الصدري** - 30 ضغطة ثم نفختين\n5. **معدل الضغط**: 100-120 ضغطة في الدقيقة\n6. **عمق الضغط**: 5-6 سم للبالغين\n7. **استخدم AED** عند توفره\n\n### نسبة الضغط للتنفس:\n- **البالغون**: 30:2\n- **الأطفال**: 30:2 (للمنقذ الواحد) أو 15:2 (للمنقذين)\n- **حديثي الولادة**: 3:1\n\n## الأدوية في CPR\n\n- **أدرينالين**: 1 ملغ - كل 3-5 دقائق\n- **أميودارون**: 300 ملغ - بعد الصدمة 3\n- **صوديوم بيكربونات**: 1 ميلي مكافئ/كغ - في حالة الحماض', summary: 'CPR هو الإجراء الأهم في توقف القلب. نسبة الضغط للتنفس 30:2 للبالغين. الأدرينالين هو الدواء الأساسي.', keyPoints: ['نسبة CPR للبالغين 30:2', 'معدل الضغط 100-120/دقيقة', 'عمق الضغط 5-6 سم', 'أدرينالين 1ملغ كل 3-5 دقائق'] },
    { id: '1-3', courseId: '1', title: 'Trauma Assessment', titleAr: 'تقييم الرضح', type: 'article', duration: 30, order: 3, isFree: true, content: '# تقييم الرضح (Trauma Assessment)\n\nتقييم الرضح هو عملية منظمة لتقييم المصابين بإصابات رضحية. يستخدم نظام ATLS المتبع عالمياً.\n\n## تصنيف الرضح\n\n### الرضح المخترق\n- طعنات\n- إصابات نارية\n- أجسام حادة\n\n### الرضح غير المخترق\n- حوادث المرور\n- السقوط من ارتفاع\n- إصابات رياضية\n\n## تقييم ATLS\n\n### المرحلة الأولى: Primary Survey (ABCDE)\n\n- **A - Airway**: مع حماية العمود الفقري العنقي\n- **B - Breathing**: التهوية والأكسجة\n- **C - Circulation**: مع إيقاف النزيف\n- **D - Disability**: التقييم العصبي (GCS)\n- **E - Exposure**: كشف كامل مع تدفئة\n\n### مقياس غلاسكو للغيبوبة (GCS)\n\n**فتح العين**:\n- 4: تلقائي\n- 3: للأمر\n- 2: للألم\n- 1: لا يستجيب\n\n**الاستجابة اللفظية**:\n- 5: موجّه\n- 4: مشوش\n- 3: كلمات غير مناسبة\n- 2: أصوات غير مفهومة\n- 1: لا يستجيب\n\n**الاستجابة الحركية**:\n- 6: ينفذ الأوامر\n- 5: يبعد المؤثر\n- 4: يبعد الألم\n- 3: انثناء غير طبيعي\n- 2: بسط\n- 1: لا يستجيب', summary: 'تقييم الرضح يتبع نظام ATLS مع ABCDE. مقياس GCS أساسي في التقييم العصبي.', keyPoints: ['نظام ABCDE في تقييم الرضح', 'حماية العمود الفقري العنقي أولوية', 'GCS أقل من 8 = تنبيب', 'إيقاف النزيف أولوية في Circulation'] },
    { id: '1-4', courseId: '1', title: 'Shock Management', titleAr: 'إدارة الصدمة', type: 'article', duration: 30, order: 4, isFree: false, content: '# إدارة الصدمة (Shock Management)\n\nالصدمة هي حالة خطيرة تتميز بعدم كفاية تدفق الدم إلى الأنسجة، مما يؤدي إلى نقص الأكسجة وخلل في وظائف الأعضاء.\n\n## أنواع الصدمة\n\n### 1. صدمة نقص الحجم (Hypovolemic Shock)\nالنوع الأكثر شيوعاً، تحدث بسبب فقدان السوائل أو الدم.\n\n**الأسباب**:\n- نزيف خارجي أو داخلي\n- حروق شديدة\n- جفاف شديد\n\n**التصنيف حسب فقدان الدم**:\n- الدرجة 1: فقدان أقل من 15% (حجم الدم) - تسارع قلب خفيف\n- الدرجة 2: فقدان 15-30% - تسارع قلب، انخفاض ضغط الانقباض\n- الدرجة 3: فقدان 30-40% - انخفاض واضح في الضغط\n- الدرجة 4: فقدان أكثر من 40% - صدمة شديدة، خطر الحياة\n\n### 2. صدمة تأقية (Anaphylactic Shock)\n- رد فعل تحسسي شديد\n- العلاج: أدرينالين 0.3-0.5 ملغ عضلي فوراً\n\n### 3. صدمة قلبية (Cardiogenic Shock)\n- فشل القلب في ضخ الدم بشكل كافٍ\n- السبب الأشيع: احتشاء عضلة القلب الحاد\n\n### 4. صدمة إنتانية (Septic Shock)\n- إنتان دموي مع خلل في الأعضاء\n- العلاج: سوائل + مضادات حيوية + نورأدرينالين', summary: 'الصدمة أنواع عدة: نقص الحجم، التأقية، القلبية، والإنتانية. العلاج يعتمد على السبب.', keyPoints: ['صدمة نقص الحجم الأكثر شيوعاً', 'أدرينالين هو العلاج الأول لصدمة التأقية', 'الدرجة 4 = فقدان أكثر من 40% من حجم الدم', 'نورأدرينالين هو الدواء الأول في الصدمة الإنتانية'] },
    { id: '1-5', courseId: '1', title: 'Airway Management', titleAr: 'إدارة المجرى الهوائي', type: 'article', duration: 25, order: 5, isFree: false, content: '# إدارة المجرى الهوائي\n\nتأمين المجرى الهوائي هو الخطوة الأولى والأهم في إنقاذ أي مريض في حالة حرجة.\n\n## طرق تأمين المجرى الهوائي\n\n### 1. التدابير الأساسية\n- رفع الذقن ودفع الفك\n- وضعية الإفاقة\n- شفط الإفرازات\n\n### 2. الأدوات المساعدة\n- الأنبوب الفموي البلعومي (OPA)\n- الأنبوب الأنفي البلعومي (NPA)\n- القناع والبالون (Bag-Valve-Mask)\n\n### 3. التنبيب الرغامي\n- المعيار الذهبي لتأمين المجرى الهوائي\n- يتطلب تدريباً مكثفاً\n- يجب التأكد من وضع الأنبوب بالمنظار الحنجري\n\n### 4. التدابير الجراحية\n- Cricothyrotomy: في حالات الطوارئ القصوى\n- عندما تفشل جميع الطرق الأخرى', summary: 'تأمين المجرى الهوائي هو أولوية قصوى. التنبيب الرغامي هو المعيار الذهبي.', keyPoints: ['ABC - المجرى الهوائي أولاً', 'OPA للمرضى فاقدي الوعي', 'التنبيب الرغامي = المعيار الذهبي', 'Cricothyrotomy = الملاذ الأخير'] },
    { id: '1-6', courseId: '1', title: 'Emergency Drugs', titleAr: 'أدوية الطوارئ', type: 'article', duration: 35, order: 6, isFree: false, content: '# أدوية الطوارئ الأساسية\n\nمعرفة أدوية الطوارئ واستخداماتها هي مهارة أساسية لكل طبيب وممرض يعمل في قسم الطوارئ.\n\n## الأدوية المنقذة للحياة\n\n### 1. الأدرينالين (Epinephrine)\n- **الاستخدام**: توقف القلب، صدمة تأقية، تضيق قصبي شديد\n- **الجرعة في CPR**: 1 ملغ وريدي كل 3-5 دقائق\n- **الجرعة في صدمة التأقية**: 0.3-0.5 ملغ عضلي\n\n### 2. النورأدرينالين (Norepinephrine)\n- **الاستخدام**: رفع ضغط الدم في الصدمة الإنتانية\n- **الجرعة**: 0.1-0.5 ميكروغرام/كغ/دقيقة\n\n### 3. أميودارون (Amiodarone)\n- **الاستخدام**: الرجفان البطيني المقاوم للصدمة\n- **الجرعة**: 300 ملغ وريدي بلعة، ثم 150 ملغ\n\n### 4. الأتروبين (Atropine)\n- **الاستخدام**: بطء القلب العرضي\n- **الجرعة**: 0.5 ملغ وريدي (الحد الأقصى 3 ملغ)\n\n### 5. الدوبوتامين (Dobutamine)\n- **الاستخدام**: صدمة قلبية، فشل قلب احتقاني حاد\n- **الجرعة**: 2-20 ميكروغرام/كغ/دقيقة', summary: 'أدوية الطوارئ الأساسية تشمل الأدرينالين، النورأدرينالين، الأميودارون، والأتروبين.', keyPoints: ['أدرينالين 1ملغ كل 3-5 دقائق في CPR', 'أدرينالين 0.3-0.5ملغ عضلي في صدمة التأقية', 'نورأدرينالين = الدواء الأول في الصدمة الإنتانية', 'أميودارون 300ملغ بعد الصدمة الثالثة'] },
    { id: '1-7', courseId: '1', title: 'Wound Management', titleAr: 'إدارة الجروح', type: 'article', duration: 20, order: 7, isFree: false, content: '# إدارة الجروح في قسم الطوارئ\n\nإدارة الجروح هي واحدة من أكثر الإجراءات شيوعاً في قسم الطوارئ.\n\n## تصنيف الجروح\n\n- **جروح قطعية**: حواف نظيفة\n- **جروح تمزقية**: حواف غير منتظمة\n- **جروح وخزية**: عمق أكبر من العرض\n- **جروح سحجية**: إصابة سطحية\n\n## خطوات العلاج\n1. **إيقاف النزيف** - الضغط المباشر\n2. **التنظيف** - الماء والصابون أو محلول ملحي\n3. **إزالة الأجسام الغريبة**\n4. **تخدير موضعي** - ليدوكايين 1-2%\n5. **الخياطة** إن لزم\n6. **التطعيم ضد الكزاز** - إذا لزم الأمر\n7. **المضادات الحيوية** - في الحالات الملوثة', summary: 'إدارة الجروح تشمل إيقاف النزيف، التنظيف، التخدير الموضعي، والخياطة.', keyPoints: ['الضغط المباشر لإيقاف النزيف', 'ليدوكايين 1-2% للتخدير الموضعي', 'تطعيم الكزاز عند الحاجة', 'المضادات الحيوية للجروح الملوثة'] },
    { id: '1-8', courseId: '1', title: 'Burns Management', titleAr: 'إدارة الحروق', type: 'article', duration: 25, order: 8, isFree: false, content: '# إدارة الحروق\n\nالحروق من الإصابات الشائعة في الطوارئ وتتطلب تقييماً دقيقاً وعلاجاً مناسباً.\n\n## درجات الحروق\n\n- **الدرجة الأولى**: احمرار وألم (مثل حروق الشمس)\n- **الدرجة الثانية**: بثور وألم شديد\n- **الدرجة الثالثة**: تلف كامل للجلد، قد يكون بلا ألم\n\n## قاعدة التسعة (Rule of 9s)\n\n- الرأس والرقبة: 9%\n- كل طرف علوي: 9%\n- كل طرف سفلي: 18%\n- الجذع الأمامي: 18%\n- الجذع الخلفي: 18%\n- منطقة العجان: 1%\n\n## العلاج الأولي\n1. إبعاد المصدر\n2. تبريد الحرق بماء بارد (not ice)\n3. إزالة الملابس والمجوهرات\n4. تغطية الحرق بضمادة معقمة\n5. السوائل الوريدية حسب صيغة باركلاند', summary: 'الحروق تُصنف لثلاث درجات. قاعدة التسعة لحساب المساحة. صيغة باركلاند للسوائل.', keyPoints: ['قاعدة التسعة لحساب مساحة الحروق', 'الدرجة الثالثة = تلف كامل وقد يكون بلا ألم', 'تبريد بماء بارد وليس ثلج', 'صيغة باركلاند: 4مل×كغ×نسبة الحرق'] },
    { id: '1-9', courseId: '1', title: 'Fractures & Orthopedic Emergencies', titleAr: 'الكسور والطوارئ العظمية', type: 'article', duration: 30, order: 9, isFree: false, content: '# الكسور والطوارئ العظمية\n\nالكسور من أكثر الإصابات شيوعاً في قسم الطوارئ.\n\n## أنواع الكسور\n\n- **كسر مغلق**: الجلد سليم\n- **كسر مفتوح**: الجلد ممزق والعظم بارز\n- **كسر إجهادي**: نتيجة إجهاد متكرر\n\n## الكسور المفتوحة - طوارئ!\n\nالكسور المفتوحة تتطلب تدخلاً عاجلاً:\n1. إيقاف النزيف\n2. تغطية الجرح بضمادة معقمة\n3. تثبيت الطرف\n4. مضادات حيوية وريدي\n5. تطعيم الكزاز\n6. تصوير شعاعي\n7. تدخل جراحي خلال 6 ساعات\n\n## الكسور الحرجة\n\n- **كسر الحوض**: خطر نزيف داخلي شديد\n- **كسر الفخذ**: فقدان 1-2 لتر دم\n- **كسر العمود الفقري**: خطر إصابة الحبل الشوكي', summary: 'الكسور المفتوحة = طوارئ تتطلب تدخلاً فورياً. كسر الحوض والفخذ من الكسور الخطيرة.', keyPoints: ['الكسر المفتوح يحتاج مضادات حيوية فورية', 'كسر الفخذ = فقدان 1-2 لتر دم', 'كسر الحوض = خطر نزيف داخلي شديد', 'تثبيت الطرف قبل النقل'] },
    { id: '1-10', courseId: '1', title: 'Stroke Protocol', titleAr: 'بروتوكول السكتة الدماغية', type: 'article', duration: 25, order: 10, isFree: false, content: '# بروتوكول السكتة الدماغية\n\nالسكتة الدماغية هي حالة طوارئ عصبية تتطلب تدخلاً فورياً. الوقت هو الدماغ!\n\n## أنواع السكتة الدماغية\n\n- **احتشاء دماغي (Ischemic)**: 85% من الحالات\n- **نزيف دماغي (Hemorrhagic)**: 15% من الحالات\n\n## علامات السكتة (FAST)\n\n- **F - Face**: انحراف الوجه\n- **A - Arms**: ضعف في الذراع\n- **S - Speech**: صعوبة الكلام\n- **T - Time**: الوقت حاسم - اتصل بالإسعاف\n\n## التقييم والإدارة\n\n1. **CT Scan فوري** لتمييز النوع\n2. **إذا احتشائي وخلال 4.5 ساعات**: tPA (Alteplase)\n3. **إذا نزيف**: خفض الضغط والجراحة عند الحاجة\n\n## tPA - العلاج الحاسم\n- **الجرعة**: 0.9 ملغ/كغ (الحد الأقصى 90 ملغ)\n- **10% بلعة وريدي + 90% تسريب خلال ساعة**\n- **النافذة الزمنية**: خلال 4.5 ساعة من بدء الأعراض', summary: 'السكتة الدماغية = طوارئ عصبية. FAST للتعرف. tPA خلال 4.5 ساعات للاحتشاء.', keyPoints: ['FAST: Face, Arms, Speech, Time', 'CT scan فوري لتمييز النوع', 'tPA خلال 4.5 ساعات للاحتشاء', 'الوقت هو الدماغ!'] },
    { id: '1-11', courseId: '1', title: 'Poisoning & Overdose', titleAr: 'التسمم والجرعة الزائدة', type: 'article', duration: 25, order: 11, isFree: false, content: '# التسمم والجرعة الزائدة\n\nحالات التسمم شائعة في قسم الطوارئ وتتطلب معرفة الترياق المناسب لكل نوع.\n\n## أشهر الترياقات\n\n- **باراسيتامول**: N-أسيتيل سيستئين\n- **أفيونات**: نالوكسون\n- **بنزوديازيبينات**: فلومازينيل\n- **حديد**: ديفيروكسامين\n- **ميثانول/إيثيلين غليكول**: إيثانول أو فوميبازول\n- **حاصرات بيتا**: غلوكاغون\n- **حاصرات قنوات الكالسيوم**: غلوكاغون + كالسيوم\n\n## نالوكسون (Narcan)\n- **الاستخدام**: جرعة زائدة من الأفيونات\n- **الجرعة**: 0.4-2 ملغ وريدي/عضلي/أنفي\n- **يمكن تكرار الجرعة** كل 2-3 دقائق\n- **الحد الأقصى**: 10 ملغ\n\n## غسل المعدة\n- **خلال ساعة واحدة** من الابتلاع\n- **لا يُنصح** في حالة المواد الكاوية أو الهيدروكربونات', summary: 'معرفة الترياق المناسب لكل نوع تسمم أمر حاسم. نالوكسون لأفيونات، NAC لباراسيتامول.', keyPoints: ['نالوكسون 0.4-2ملغ لأفيونات', 'NAC لباراسيتامول', 'غسل المعدة خلال ساعة واحدة', 'لا غسل في المواد الكاوية'] },
    { id: '1-12', courseId: '1', title: 'Emergency Quiz', titleAr: 'اختبار طب الطوارئ', type: 'quiz', duration: 15, order: 12, isFree: true, content: 'اختبار شامل في طب الطوارئ' },

    // Course 2: Cardiology
    { id: '2-1', courseId: '2', title: 'Heart Anatomy & Physiology', titleAr: 'تشريح وفسيولوجيا القلب', type: 'article', duration: 30, order: 1, isFree: true, content: '# تشريح وفسيولوجيا القلب\n\nالقلب هو العضو الأهم في الجسم، ويعمل كمضخة ميكانيكية لدوران الدم عبر الجسم.\n\n## التشريح الأساسي\n\n- **الأذينان**: الأيمن والأيسر - يستقبلان الدم\n- **البطينان**: الأيمن والأيسر - يضخان الدم\n- **الصمامات**: ثلاثي الشرف، الرئوي، التاجي، الأبهري\n- **الشريان التاجي**: الأيسر والأيمن - يغذي عضلة القلب\n\n## الدورة الدموية\n\n1. الأذين الأيمن يستقبل الدم غير المؤكسج\n2. البطين الأيمن يضخه للرئتين\n3. الأذين الأيسر يستقبل الدم المؤكسج\n4. البطين الأيسر يضخه لجميع أنحاء الجسم', summary: 'القلب يتكون من 4 حجرات. الشريان التاجي يغذي عضلة القلب.', keyPoints: ['4 حجرات: أذينان وبطينان', 'الشريان التاجي يغذي القلب', 'البطين الأيسر الأقوى', 'الدورة الدموية: جهازية ورئوية'] },
    { id: '2-2', courseId: '2', title: 'ECG Interpretation', titleAr: 'تفسير تخطيط القلب', type: 'article', duration: 40, order: 2, isFree: true, content: '# تفسير تخطيط القلب الكهربائي (ECG)\n\nECG هو أداة تشخيصية أساسية في أمراض القلب.\n\n## المكونات الأساسية\n\n- **موجة P**: انقباض الأذينين\n- **مركب QRS**: انقباض البطينين\n- **موجة T**: عودة البطينين للاسترخاء\n- **المسافة PR**: 0.12-0.20 ثانية\n- **المسافة QT**: أقل من نصف الدورة\n\n## خطوات القراءة\n\n1. **المعدل**: 60-100 نبضة/دقيقة = طبيعي\n2. **النظم**: منتظم أم لا\n3. **موجة P**: موجودة ومتطابقة\n4. **المسافة PR**: طبيعية\n5. **مركب QRS**: ضيق (أقل من 0.12 ثانية)\n6. **موجة T**: طبيعية\n\n## حالات مهمة\n\n- **ارتفاع ST**: احتشاء حاد (STEMI)\n- **انخفاض ST**: نقص تروية\n- **توسع QRS**: حصار حزمة هيس\n- **موجة Q مرضية**: احتشاء سابق', summary: 'ECG يقرأ بالترتيب: المعدل، النظم، P، PR، QRS، T. ارتفاع ST = STEMI.', keyPoints: ['المعدل الطبيعي 60-100/دقيقة', 'ارتفاع ST = STEMI', 'QRS أقل من 0.12 ثانية', 'موجة Q مرضية = احتشاء سابق'] },
    { id: '2-3', courseId: '2', title: 'Heart Failure', titleAr: 'فشل القلب', type: 'article', duration: 35, order: 3, isFree: false, content: '# فشل القلب (Heart Failure)\n\nفشل القلب هو عدم قدرة القلب على ضخ كمية كافية من الدم لتلبية احتياجات الجسم.\n\n## التصنيف\n\n### حسب الجانب المصاب:\n- **فشل قلب أيمن**: احتقان وريدي محيطي\n- **فشل قلب أيسر**: وذمة رئوية\n\n### حسب الوظيفة:\n- **انخفاض الكسر القذفي (HFrEF)**: أقل من 40%\n- **حفظ الكسر القذفي (HFpEF)**: 50% أو أكثر\n\n## الأعراض\n\n- ضيق تنفس (خاصة عند الاستلقاء)\n- وذمة في الطرفين السفليين\n- تعب وإرهاق\n- سعال ليلي\n\n## العلاج\n\n### ACE inhibitors / ARBs\n### حاصرات بيتا\n### مدرات البول\n### سبيرونولاكتون', summary: 'فشل القلب: انخفاض أو حفظ الكسر القذفي. الأعراض: ضيق تنفس، وذمة، تعب.', keyPoints: ['HFrEF: كسر قذفي أقل من 40%', 'HFpEF: كسر قذفي 50%+', 'ACE inhibitors أساسية في العلاج', 'مدرات البول لأعراض الاحتقان'] },
    { id: '2-4', courseId: '2', title: 'Hypertension Emergency', titleAr: 'طوارئ ارتفاع الضغط', type: 'article', duration: 25, order: 4, isFree: false, content: '# طوارئ ارتفاع ضغط الدم\n\nطوارئ ارتفاع الضغط هي حالة يكون فيها الضغط الانقباضي أعلى من 180 أو الانبساطي أعلى من 120 مع ضرر في الأعضاء المستهدفة.\n\n## الأعضاء المستهدفة\n\n- **الدماغ**: اعتلال دماغي ارتفاع الضغط\n- **القلب**: تسلخ الأبهر، احتشاء\n- **الكلى**: فشل كلوي حاد\n- **العين**: نزيف شبكي\n\n## العلاج\n\n- **خفض الضغط تدريجياً**: 25% في الساعة الأولى\n- **لا تقلل الضغط بسرعة كبيرة**\n- **الأدوية**: نيتروبروسيد، لابيتالول، نيكارديبين', summary: 'طوارئ الضغط: انقباضي >180 أو انبساطي >120 مع ضرر أعضاء. خفض 25% في الساعة الأولى.', keyPoints: ['الضغط >180/120 مع ضرر أعضاء', 'خفض 25% في الساعة الأولى', 'لا تخفض بسرعة كبيرة', 'نيتروبروسيد أو لابيتالول'] },
    { id: '2-5', courseId: '2', title: 'Arrhythmias', titleAr: 'اضطرابات النظم القلبي', type: 'article', duration: 35, order: 5, isFree: false, content: '# اضطرابات النظم القلبي (Arrhythmias)\n\nاضطرابات النظم هي خلل في سرعة أو انتظام ضربات القلب.\n\n## التصنيف\n\n### تسارع القلب (Tachycardia)\n- **تسارع جيبي**: طبيعي عند الجهد\n- **تسرع أذيني**: معدل 150-250\n- **رجفان أذيني**: عدم انتظام كامل\n- **تسرع بطيني**: خطير، قد يتطور لتوقف قلب\n\n### بطء القلب (Bradycardia)\n- **بطء جيبي**: أقل من 60/دقيقة\n- **حصار قلبي**: الدرجة 1، 2، 3\n\n## العلاج\n\n- **رجفان أذيني**: تحكم بالمعدل أو علاج النظم\n- **تسرع بطيني مستقر**: أميودارون\n- **تسرع بطيني غير مستقر**: صدمة كهربائية\n- **بطء قلب عرضي**: أتروبين', summary: 'اضطرابات النظم: تسارع وبطء. التسرع البطيني أخطر. العلاج يعتمد على النوع والاستقرار.', keyPoints: ['تسرع بطيني غير مستقر = صدمة', 'أميودارون للتسرع البطيني المستقر', 'أتروبين لبطء القلب العرضي', 'رجفان أذيني = عدم انتظام كامل'] },
    { id: '2-6', courseId: '2', title: 'Aortic Dissection', titleAr: 'تسلخ الأبهر', type: 'article', duration: 20, order: 6, isFree: false, content: '# تسلخ الأبهر (Aortic Dissection)\n\nتسلخ الأبهر هو حالة مهددة للحياة تحدث عندما يتمزق الغشاء الداخلي للشريان الأبهر.\n\n## التصنيف\n\n- **نوع A**: يشمل الأبهر الصاعد (أخطر، يتطلب جراحة فورية)\n- **نوع B**: لا يشمل الأبهر الصاعد (علاج دوائي غالباً)\n\n## الأعراض\n\n- **ألم صدري ممزق**: ينتقل للظهر\n- **عدم تساوي الضغط** بين الذراعين\n- **اختلاف نبض** بين الطرفين\n\n## التشخيص\n\n- **CT Angiography**: الفحص الأفضل\n- **إيكو القلب**: سريع لكن أقل دقة\n\n## العلاج\n\n- **نوع A**: جراحة فورية\n- **نوع B**: خفض الضغط (حاصرات بيتا أولاً)', summary: 'تسلخ الأبهر: ألم ممزق ينتقل للظهر. نوع A = جراحة فورية. نوع B = خفض الضغط.', keyPoints: ['ألم صدري ممزق ينتقل للظهر', 'نوع A = جراحة فورية', 'نوع B = علاج دوائي', 'حاصرات بيتا أولاً لخفض الضغط'] },
    { id: '2-7', courseId: '2', title: 'Valvular Heart Disease', titleAr: 'أمراض صمامات القلب', type: 'article', duration: 30, order: 7, isFree: false, content: '# أمراض صمامات القلب\n\nأمراض الصمامات القلبية تشمل التضيق والقصور في أي من الصمامات الأربعة.\n\n## الصمام التاجي\n- **تضيق تاجي**: الأخطر عند الرجال، سببه الحمى الروماتيزمية\n- **قصور تاجي**: ارتجاع الدم عبر الصمام\n\n## الصمام الأبهري\n- **تضيق أبهري**: ألم صدري، إغماء، فشل قلب\n- **قصور أبهري**: تسرب الدم للخلف\n\n## التشخيص\n- **إيكو القلب**: الفحص الأساسي\n- **نقرات القلب**: تشخيص أولي\n\n## العلاج\n- **دوائي**: للأعراض الخفيفة\n- **جراحي**: تبديل الصمام عند التضيق الشديد', summary: 'أمراض الصمامات: تضيق وقصور. الإيكو أساسي في التشخيص. الجراحة عند التضيق الشديد.', keyPoints: ['إيكو القلب = الفحص الأساسي', 'تضيق أبهري = ألم + إغماء + فشل', 'تضيق تاجي سببه الحمى الروماتيزمية', 'تبديل الصمام عند التضيق الشديد'] },
    { id: '2-8', courseId: '2', title: 'Cardiac Medications', titleAr: 'أدوية القلب', type: 'article', duration: 30, order: 8, isFree: false, content: '# أدوية القلب الأساسية\n\n## حاصرات بيتا (Beta Blockers)\n- **مثال**: ميتوبرولول، كارفيديلول\n- **الاستخدام**: فشل القلب، ارتفاع الضغط، ما بعد الاحتشاء\n- **الآثار الجانبية**: بطء القلب، الربو\n\n## مثبطات ACE\n- **مثال**: إنالابريل، ليزينوبريل\n- **الاستخدام**: فشل القلب، ارتفاع الضغط، حماية الكلى\n- **الآثار الجانبية**: سعال، وذمة وعائية\n\n## مميعات الدم\n- **أسبرين**: 81-325 ملغ\n- **كلوبيدوغريل**: مع أسبرين بعد الدعامة\n- **وارفارين**: رجفان أذيني، صمام صناعي\n- **مميعات حديثة**: أبكسابان، ريفاروكسابان\n\n## ستاتينات\n- **الهدف**: خفض الكوليسترول\n- **مثال**: أتورفاستاتين، روزوفاستاتين', summary: 'أدوية القلب: حاصرات بيتا، ACE، مميعات، ستاتينات. كل فئة لها استخدام محدد.', keyPoints: ['حاصرات بيتا: بطء القلب والربق كآثار جانبية', 'ACE: السعال كأثر جانبي شائع', 'كلوبيدوغريل + أسبرين بعد الدعامة', 'الستاتينات لخفض الكوليسترول'] },
    { id: '2-9', courseId: '2', title: 'Acute Coronary Syndrome', titleAr: 'متلازمة الشريان التاجي الحادة', type: 'article', duration: 35, order: 9, isFree: false, content: '# متلازمة الشريان التاجي الحادة (ACS)\n\nACS هي طيف من الحالات الناتجة عن نقص تروية عضلة القلب بشكل حاد.\n\n## أنواع ACS\n\n- **STE-ACS (STEMI)**: ارتفاع ST - الأخطر\n- **NSTE-ACS**: يشمل NSTEMI و unstable angina\n\n## الأعراض\n\n- ألم صدري خلف القص (ضاغق)\n- ينتشر للذراع الأيسر والفك\n- مدة أكثر من 20 دقيقة\n- لا يزول بالراحة\n\n## العلاج الإسعافي\n\n### MONA:\n- **M**orphine: للألم\n- **O**xygen: إذا SpO2 أقل من 94%\n- **N**itrates: تحت اللسان\n- **A**spirin: 300 ملغ مضغ\n\n### STEMI - العلاج الحاسم:\n- **القسطرة الطارئة** خلال 90 دقيقة\n- أو **التخثر الدوائي** خلال 30 دقيقة إذا القسطرة غير متاحة', summary: 'ACS: STEMI الأخطر. MONA كعلاج إسعافي. القسطرة الطارئة خلال 90 دقيقة لـ STEMI.', keyPoints: ['STEMI = ارتفاع ST = الأكثر خطورة', 'MONA: Morphine, O2, Nitrates, Aspirin', 'القسطرة خلال 90 دقيقة لـ STEMI', 'ألم صدري ضاغق ينتشر للذراع الأيسر'] },
    { id: '2-10', courseId: '2', title: 'Cardiology Quiz', titleAr: 'اختبار أمراض القلب', type: 'quiz', duration: 15, order: 10, isFree: true, content: 'اختبار شامل في أمراض القلب' },

    // Course 8: Pharmacology
    { id: '8-1', courseId: '8', title: 'Introduction to Pharmacology', titleAr: 'مقدمة في علم الأدوية', type: 'article', duration: 25, order: 1, isFree: true, content: '# مقدمة في علم الأدوية\n\nعلم الأدوية (Pharmacology) هو العلم الذي يدرس التفاعل بين الأدوية والكائنات الحية.\n\n## فروع علم الأدوية\n\n- **حركية الدواء (Pharmacokinetics)**: ماذا يفعل الجسم بالدواء\n- **ديناميكية الدواء (Pharmacodynamics)**: ماذا يفعل الدواء بالجسم\n\n## حركية الدواء - ADME\n\n- **A - Absorption**: الامتصاص\n- **D - Distribution**: التوزيع\n- **M - Metabolism**: الاستقلاب (الكبد أساساً)\n- **E - Excretion**: الإخراج (الكلى أساساً)\n\n## مفاهيم مهمة\n\n- **الجرعة العلاجية**: الكمية المطلوبة للتأثير العلاجي\n- **الجرعة السامة**: الكمية التي تسبب سمية\n- **الحد الأدنى للفعالية**: أقل تركيز فعال\n- **التوافر الحيوي**: نسبة الدواء التي تصل للدورة الدموية\n- **عمر النصف**: الوقت لانخفاض التركيز للنصف', summary: 'علم الأدوية: حركية (ADME) وديناميكية. التوافر الحيوي وعمر النصف مفاهيم أساسية.', keyPoints: ['ADME: Absorption, Distribution, Metabolism, Excretion', 'الكبد = الاستقلاب الرئيسي', 'الكلى = الإخراج الرئيسي', 'عمر النصف = وقت انخفاض التركيز للنصف'] },
    { id: '8-2', courseId: '8', title: 'Drug Interactions', titleAr: 'التداخلات الدوائية', type: 'article', duration: 20, order: 2, isFree: true, content: '# التداخلات الدوائية\n\nالتداخلات الدوائية هي تغير في تأثير دواء بسبب وجود دواء آخر أو طعام.\n\n## أنواع التداخلات\n\n### 1. تداخل دواء-دواء\n- **تآزري**: تأثير أكبر من المجموع\n- **تضادي**: تأثير معاكس\n- **إضافة**: تأثير مجموع\n\n### 2. تداخل دواء-طعام\n- **وارفارين + فيتامين K**: يقلل تأثير الوارفارين\n- **تتراسيكلين + حليب**: يقلل الامتصاص\n- **GRAPEFRUIT**: يزيد تأثير أدوية كثيرة\n\n## مثبطات ومحفزات CYP450\n\n### مثبطات (تزيد مستوى الأدوية الأخرى):\n- كيتوكونازول\n- إريثروميسين\n- عصير الجريب فروت\n\n### محفزات (تقلل مستوى الأدوية الأخرى):\n- ريفامبيسين\n- فينيتوين\n- كاربامازيبين', summary: 'التداخلات: تآزرية، تضادية، إضافة. مثبطات CYP450 تزيد مستوى الأدوية.', keyPoints: ['CYP450 مثبطات تزيد مستوى الأدوية', 'جريب فروت يزيد تأثير أدوية كثيرة', 'وارفارين + فيتامين K = تضاد', 'ريفامبيسين = محفز CYP450'] },
    { id: '8-3', courseId: '8', title: 'Antibiotics', titleAr: 'المضادات الحيوية', type: 'article', duration: 35, order: 3, isFree: true, content: '# المضادات الحيوية\n\nالمضادات الحيوية هي أدوية تستخدم لعلاج الالتهابات البكتيرية.\n\n## التصنيف حسب آلية العمل\n\n### 1. مثبطات جدار الخلية\n- **بنسلينات**: أموكسيسيلين، أمبيسيلين\n- **سيفالوسبورينات**: سيفترياكسون، سيفازولين\n- **كاربابينيمات**: إيميبينيم\n- **فانكومايسين**: MRSA\n\n### 2. مثبطات تخليق البروتين\n- **أمينوغليكوزيدات**: جنتاميسين\n- **ماكروليدات**: أزيثروميسين\n- **تتراسيكلينات**: دوكسي سيكلين\n\n### 3. مثبطات الحمض النووي\n- **فلوروكينولونات**: سيبروفلوكساسين\n- **ميترونيدازول**: اللاهوائيات\n\n## قواعد مهمة\n- أكمل المدة الكاملة للعلاج\n- لا تستخدم للالتهابات الفيروسية\n- احذر من الحساسية (خاصة البنسلين)', summary: 'المضادات الحيوية: مثبطات جدار الخلية، بروتين، وحمض نووي. فانكومايسين لـ MRSA.', keyPoints: ['بنسلينات + سيفالوسبورينات = مثبطات جدار الخلية', 'فانكومايسين = علاج MRSA', 'أكمل المدة الكاملة للعلاج', 'لا تستخدم للفيروسات'] },
    { id: '8-4', courseId: '8', title: 'Pain Management', titleAr: 'إدارة الألم', type: 'article', duration: 25, order: 4, isFree: false, content: '# إدارة الألم (Pain Management)\n\nإدارة الألم من أهم المهارات السريرية. سلم الألم WHO يقدم نهجاً متدرجاً.\n\n## سلم الألم WHO\n\n### الدرجة 1: ألم خفيف\n- **باراسيتامول**: 500-1000 ملغ\n- **NSAIDs**: إيبوبروفين، ديكلوفيناك\n\n### الدرجة 2: ألم معتدل\n- **كودايين**: 30-60 ملغ\n- **ترامادول**: 50-100 ملغ\n\n### الدرجة 3: ألم شديد\n- **مورفين**: 5-10 ملغ\n- **فينتانيل**: للآلام الشديدة جداً\n\n## مسكنات إضافية\n\n- **غابابنتين**: الألم العصبي\n- **كاربامازيبين**: ألم العصب الخامس\n- **ديكساميثازون**: ألم الورم\n\n## الآثار الجانبية للمواد الأفيونية\n\n- **إمساك**: الأكثر شيوعاً\n- **غثيان وقيء**\n- **تثبيط تنفسي**: الأخطر', summary: 'سلم WHO: خفيف (باراسيتامول/NSAIDs)، معتدل (كودايين)، شديد (مورفين).', keyPoints: ['سلم WHO من 3 درجات', 'باراسيتامول = الخط الأول للألم الخفيف', 'مورفين = الألم الشديد', 'الإمساك = أشهر عرض جانبي للأفيونات'] },
    { id: '8-5', courseId: '8', title: 'Diabetes Medications', titleAr: 'أدوية السكري', type: 'article', duration: 30, order: 5, isFree: false, content: '# أدوية السكري\n\nأدوية السكري تهدف للسيطرة على مستوى السكر في الدم ومنع المضاعفات.\n\n## النوع الثاني - العلاج الدوائي\n\n### الخط الأول:\n- **ميتفورمين**: الدواء الأساسي\n  - يقلل إنتاج الجلوكوز الكبدي\n  - يحسن حساسية الأنسولين\n  - الآثار الجانبية: غثيان، إسهال، حماض لبني (نادر)\n\n### الخط الثاني:\n- **مثبطات DPP-4**: سيتاغليبتين\n- **ناهضات GLP-1**: ليراغلوتيد (حقن)\n- **مثبطات SGLT2**: إمباغليفلوزين (يقلل القلب والأوعية)\n- **سلفونيل يوريا**: غليبنكلاميد (خطر نقص السكر)\n\n## الأنسولين\n\n- **سريع**: بداية 15 دقيقة - ذروة 1-2 ساعة - مدة 4-6 ساعات\n- **قصير**: بداية 30 دقيقة - ذروة 2-4 ساعة - مدة 6-8 ساعات\n- **متوسط**: بداية 1-2 ساعة - ذروة 6-12 ساعة - مدة 12-18 ساعة\n- **طويل**: بداية 1-2 ساعة - بدون ذروة واضحة - مدة 24 ساعة+', summary: 'ميتفورمين = الخط الأول للنوع الثاني. أنواع الأنسولين حسب سرعة التأثير ومدته.', keyPoints: ['ميتفورمين = الخط الأول للنوع الثاني', 'SGLT2 = حماية قلبية وأوعية', 'سلفونيل يوريا = خطر نقص السكر', 'أنسولين: سريع، قصير، متوسط، طويل'] },
    { id: '8-6', courseId: '8', title: 'Cardiovascular Drugs', titleAr: 'أدوية القلب والأوعية', type: 'article', duration: 30, order: 6, isFree: false, content: '# أدوية القلب والأوعية الدموية\n\n## خافضات الضغط\n\n### مثبطات ACE\n- تنهي بـ (-pril)\n- مثال: إنالابريل، ليزينوبريل\n- آثر جانبي: سعال جاف، وذمة وعائية\n\n### حاصرات مستقبلات الأنجيوتنسين (ARBs)\n- تنهي بـ (-sartan)\n- مثال: لوسارتان، فالسارتان\n- بديل ACE عند وجود سعال\n\n### حاصرات قنوات الكالسيوم\n- تنهي بـ (-dipine)\n- مثال: أملوديبين، نيفيديبين\n\n### حاصرات بيتا\n- تنهي بـ (-olol)\n- مثال: ميتوبرولول، أتينولول\n\n## أدوية الدهون\n\n- **ستاتينات**: أتورفاستاتين (-statin)\n- **فيبرات**: فينوفيبرات\n- **إزيتيميب**: يقلل الامتصاص', summary: 'أدوية الضغط: ACE (-pril)، ARBs (-sartan)، CCB (-dipine)، بيتا (-olol). الستاتينات للكوليسترول.', keyPoints: ['ACE = -pril, ARB = -sartan', 'CCB = -dipine, بيتا = -olol', 'ACE تسبب سعال جاف', 'الستاتينات = الخط الأول للكوليسترول'] },
    { id: '8-7', courseId: '8', title: 'GI Medications', titleAr: 'أدوية الجهاز الهضمي', type: 'article', duration: 20, order: 7, isFree: false, content: '# أدوية الجهاز الهضمي\n\n## أدوية القرحة\n\n### مثبطات مضخة البروتون (PPIs)\n- تنهي بـ (-prazole)\n- مثال: أوميبرازول، بانتوبرازول\n- الأكثر فعالية لتقليل الحمض\n\n### حاصرات H2\n- تنهي بـ (-tidine)\n- مثال: رانيتيدين، فاموتيدين\n\n### مضادات الحمض\n- هيدروكسيد الألمنيوم والمغنيسيوم\n\n## أدوية الغثيان\n\n- **أوندانسيترون**: 4-8 ملغ وريدي\n- **ميتوكلوبراميد**: 10 ملغ\n- **بروميثازين**: مضاد هيستامين\n\n## أدوية الإسهال\n\n- **لوبراميد**: يبطئ الحركة\n- **سبيكتينوميسين**: مضاد حيوي\n\n## أدوية الإمساك\n\n- **لاكساتيف**: ملينات مختلفة\n- **بولي إيثيلين غليكول**: للإمساك المزمن', summary: 'PPIs (-prazole) الأكثر فعالية للقرحة. أوندانسيترون للغثيان. لوبراميد للإسهال.', keyPoints: ['PPIs = -prazole = الأقوى للحمض', 'H2 blockers = -tidine', 'أوندانسيترون = مضاد غثيان أساسي', 'لوبراميد = يبطئ الحركة المعوية'] },
    { id: '8-8', courseId: '8', title: 'Respiratory Drugs', titleAr: 'أدوية الجهاز التنفسي', type: 'article', duration: 25, order: 8, isFree: false, content: '# أدوية الجهاز التنفسي\n\n## أدوية الربو و COPD\n\n### موسعات الشعب\n\n**قصيرة المفعول (SABA/SAMA)**:\n- **سلبيوتامول**: الإسعافي\n- **إبراتروبيوم**: مضاد كوليني\n\n**طويلة المفعول (LABA/LAMA)**:\n- **سالميتيرول**: 12 ساعة\n- **تيوتروبيوم**: 24 ساعة\n\n### الكورتيكوستيرويدات الاستنشاقية\n- **بكلوميثازون**: الأكثر شيوعاً\n- **بوديسونيد**: أمان أفضل\n- **فلوتيكازون**: الأقوى\n\n## العلاج المتدرج للربو\n\n1. **الخطوة 1**: SABA عند الحاجة\n2. **الخطوة 2**: كورتيكوستيرويد استنشاقي منخفض\n3. **الخطوة 3**: ICS + LABA\n4. **الخطوة 4**: ICS عالي + LABA\n5. **الخطوة 5**: إضافة أوماليزوماب', summary: 'سلبيوتامول = الإسعافي للربو. العلاج متدرج من SABA إلى ICS+LABA.', keyPoints: ['سلبيوتامول = موسع طوارئ', 'ICS = حجر الزاوية في الوقاية', 'LABA لا يُستخدم وحده', 'العلاج متدرج حسب الشدة'] },
    { id: '8-9', courseId: '8', title: 'Corticosteroids', titleAr: 'الكورتيكوستيرويدات', type: 'article', duration: 25, order: 9, isFree: false, content: '# الكورتيكوستيرويدات\n\nالكورتيكوستيرويدات من أكثر الأدوية استخداماً وتأثيراً في الطب.\n\n## الأنواع\n\n- **بريدنيزولون**: الأكثر استخداماً فموياً\n- **ديكساميثازون**: الأقوى (لا يحتبس الصوديوم)\n- **هيدروكورتيزون**: وريدي في الطوارئ\n- **ميثيل بريدنيزولون**: جرعات عالية\n\n## الاستخدامات\n\n- أمراض المناعة الذاتية\n- الربو والحساسية\n- الوذمة الدماغية\n- الصدمة (صدمة إنتانية)\n- الأورام\n\n## الآثار الجانبية\n\n### قصيرة المدى:\n- ارتفاع السكر\n- احتباس السوائل\n- تغير المزاج\n\n### طويلة المدى:\n- هشاشة العظام\n- الساد (إعتام العدسة)\n- زيادة الوزن\n- ضمور الغدة الكظرية\n\n## قاعدة الفطام\n\n- لا توقف فجأة!\n- قلل تدريجياً\n- راقب أعراض القصور الكظري', summary: 'الكورتيكوستيرويدات: بريدنيزولون، ديكساميثازون. لا توقف فجأة. آثار جانبية كثيرة.', keyPoints: ['بريدنيزولون = الأكثر استخداماً', 'ديكساميثازون = الأقوى', 'لا توقف فجأة - خطر قصور كظري', 'هشاشة العظام والساد من الآثار طويلة المدى'] },
    { id: '8-10', courseId: '8', title: 'Pharmacology Quiz', titleAr: 'اختبار علم الأدوية', type: 'quiz', duration: 15, order: 10, isFree: true, content: 'اختبار شامل في علم الأدوية' },
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
  setNotifications: (notifications) => set({ notifications }),
  markNotificationRead: (id) => set((state) => ({
    notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
  })),
  markAllNotificationsRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, read: true }))
  })),
  unreadNotificationCount: 0,
  
  // Course progress - initialize empty
  courseProgress: [],

  // Enrollment modal
  showEnrollModal: false,
  setShowEnrollModal: (show) => set({ showEnrollModal: show }),

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

    // Paid courses need enrollment check
    if (course.price > 0 && !isEnrolled) {
      set({ showEnrollModal: true, activeCourseId: courseId })
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

    const courseLessons = state.lessons.filter(l => l.courseId === courseId)
    const newCompleted = [...existing.completedLessons, lessonId]
    const progressPercent = Math.round((newCompleted.length / courseLessons.length) * 100)

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
}
