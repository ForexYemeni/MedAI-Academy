// MongoDB Collections Schema Definition
// هذا الملف يوضح بنية قاعدة البيانات الكاملة لـ MongoDB

import { ObjectId, type Collection, type Db } from 'mongodb'

// ============================================
// Users Collection
// ============================================
export interface MongoUser {
  _id?: ObjectId
  email: string
  name: string
  avatar?: string
  password: string // bcrypt hashed
  xp: number
  coins: number
  level: number
  rankTitle: string
  rankIcon: string
  streak: number
  maxStreak: number
  subscription: 'free' | 'premium' | 'instructor'
  specialty?: string
  totalHours: number
  completedCourses: number
  badges: MongoBadge[]
  weakAreas: string[]
  aiUsageCount: number
  aiUsageLimit: number // 5 for free, unlimited for premium
  lastStudyDate?: Date
  preferences: {
    language: 'ar' | 'en'
    notifications: boolean
    dailyGoal: number // minutes
    soundEffects: boolean
  }
  createdAt: Date
  updatedAt: Date
}

// ============================================
// Departments Collection
// ============================================
export interface MongoDepartment {
  _id?: ObjectId
  nameAr: string          // Arabic name e.g. "تمريض"
  nameEn: string          // English name e.g. "Nursing" 
  icon: string            // Emoji icon e.g. "🩺"
  color: string           // Hex color e.g. "#06b6d4"
  description?: string    // Optional description
  order: number           // Display order
  published: boolean      // Whether visible to users
  createdAt: Date
  updatedAt: Date
}

// ============================================
// Courses Collection
// ============================================
export interface MongoCourse {
  _id?: ObjectId
  title: string
  titleAr: string
  description: string
  descriptionAr: string
  category: 'emergency' | 'cardiology' | 'neurology' | 'pediatrics' | 'surgery' | 'internal' | 'radiology' | 'pharmacology' | 'general'
  instructorId: ObjectId
  instructorName: string
  thumbnail?: string
  rating: number
  totalRatings: number
  students: number
  duration: string
  totalHours: number
  level: 'beginner' | 'intermediate' | 'advanced'
  price: number
  isPremium: boolean
  lessons: number
  tags: string[]
  // Lessons array (embedded)
  lessonsData: MongoLesson[]
  departmentId?: ObjectId  // Reference to department
  recommended?: boolean    // Whether admin recommends this course (default: false)
  published: boolean
  createdAt: Date
  updatedAt: Date
}

export interface MongoLesson {
  id: string
  title: string
  titleAr: string
  type: 'video' | 'article' | 'quiz' | 'simulation' | 'flashcard'
  duration: number // minutes
  videoUrl?: string
  content?: string
  images?: string[] // مصفوفة من روابط الصور أو بيانات base64
  order: number
  isFree: boolean
}

// ============================================
// Enrollments Collection
// ============================================
export interface MongoEnrollment {
  _id?: ObjectId
  userId: ObjectId
  courseId: ObjectId
  progress: number // 0-100
  completedLessons: string[]
  lastAccessedLesson?: string
  completed: boolean
  certificateId?: string
  enrolledAt: Date
  updatedAt: Date
}

// ============================================
// Quiz Results Collection
// ============================================
export interface MongoQuizResult {
  _id?: ObjectId
  userId: ObjectId
  category: string
  score: number
  totalQuestions: number
  percentage: number
  timeTaken: number // seconds
  answers: Array<{
    questionId: string
    selectedAnswer: number
    correctAnswer: number
    isCorrect: boolean
  }>
  mode: 'quick' | 'topic' | 'timed' | 'comprehensive' | 'flashcard'
  xpEarned: number
  createdAt: Date
}

// ============================================
// Simulation Results Collection
// ============================================
export interface MongoSimulationResult {
  _id?: ObjectId
  userId: ObjectId
  caseId: string
  caseTitle: string
  score: number
  timeTaken: number // seconds
  decisions: Array<{
    action: string
    option: string
    isCorrect: boolean
    timestamp: Date
  }>
  correctActions: string[]
  missedActions: string[]
  xpEarned: number
  coinsEarned: number
  createdAt: Date
}

// ============================================
// Badges
// ============================================
export interface MongoBadge {
  id: string
  name: string
  nameAr: string
  description: string
  icon: string
  earned: boolean
  earnedAt?: Date
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

// ============================================
// Daily Missions Collection
// ============================================
export interface MongoDailyMission {
  _id?: ObjectId
  userId: ObjectId
  title: string
  titleAr: string
  description: string
  xpReward: number
  coinReward: number
  progress: number
  target: number
  type: 'lesson' | 'quiz' | 'simulation' | 'streak' | 'community'
  completed: boolean
  date: Date // يوم المهمة
  createdAt: Date
}

// ============================================
// Notifications Collection
// ============================================
export interface MongoNotification {
  _id?: ObjectId
  userId: ObjectId
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'achievement' | 'payment' | 'gift' | 'community' | 'simulation' | 'enrollment' | 'system'
  category: string
  icon: string
  read: boolean
  link?: string
  actionUrl?: string
  createdAt: Date
  updatedAt?: Date
}

// ============================================
// Community
// ============================================
export interface MongoCommunityGroup {
  _id?: ObjectId
  name: string
  nameAr: string
  description?: string
  icon: string
  members: number
  category: string
  isStudyRoom: boolean
  isVoiceRoom: boolean
  activeUsers: number
  createdAt: Date
}

export interface MongoCommunityPost {
  _id?: ObjectId
  groupId: ObjectId
  authorId: ObjectId
  authorName: string
  authorRank: string
  content: string
  tags: string[]
  likes: number
  likedBy: ObjectId[]
  comments: Array<{
    id: string
    authorId: ObjectId
    authorName: string
    content: string
    createdAt: Date
  }>
  createdAt: Date
  updatedAt: Date
}

// ============================================
// Sessions (Auth)
// ============================================
export interface MongoSession {
  _id?: ObjectId
  userId: ObjectId
  token: string
  refreshToken: string
  device?: string
  ip?: string
  expiresAt: Date
  createdAt: Date
}

// ============================================
// Subscriptions (Stripe)
// ============================================
export interface MongoSubscription {
  _id?: ObjectId
  userId: ObjectId
  plan: 'free' | 'premium' | 'instructor'
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  stripePriceId?: string
  currentPeriodStart?: Date
  currentPeriodEnd?: Date
  cancelAtPeriodEnd: boolean
  status: 'active' | 'past_due' | 'canceled' | 'trialing'
  createdAt: Date
  updatedAt: Date
}

// ============================================
// Certificates
// ============================================
export interface MongoCertificate {
  _id?: ObjectId
  userId: ObjectId
  courseId: ObjectId
  courseName: string
  courseNameAr: string
  userName: string
  certificateId: string // unique for QR verification
  issuedAt: Date
  verificationUrl: string
}

// ============================================
// Helper: Initialize Database with Seed Data
// ============================================
export async function seedDatabase(db: Db) {
  const usersCount = await db.collection('users').countDocuments()
  if (usersCount > 0) {
    console.log('Database already seeded, skipping...')
    return
  }

  // Seed departments
  const departmentsCount = await db.collection('departments').countDocuments()
  if (departmentsCount === 0) {
    const departments = [
      { nameAr: 'تمريض', nameEn: 'Nursing', icon: '🩺', color: '#06b6d4', description: 'قسم التمريض وعلومه', order: 1, published: true, createdAt: new Date(), updatedAt: new Date() },
      { nameAr: 'قبالة', nameEn: 'Midwifery', icon: '👶', color: '#ec4899', description: 'قسم القبالة وصحة الأمومة', order: 2, published: true, createdAt: new Date(), updatedAt: new Date() },
      { nameAr: 'مساعد طبيب', nameEn: 'Medical Assistant', icon: '👨‍⚕️', color: '#8b5cf6', description: 'قسم مساعدي الأطباء', order: 3, published: true, createdAt: new Date(), updatedAt: new Date() },
      { nameAr: 'مختبرات', nameEn: 'Laboratory', icon: '🔬', color: '#10b981', description: 'قسم المختبرات الطبية', order: 4, published: true, createdAt: new Date(), updatedAt: new Date() },
      { nameAr: 'صيدلة', nameEn: 'Pharmacy', icon: '💊', color: '#f59e0b', description: 'قسم الصيدلة وعلم الأدوية', order: 5, published: true, createdAt: new Date(), updatedAt: new Date() },
      { nameAr: 'أشعة', nameEn: 'Radiology', icon: '📸', color: '#6366f1', description: 'قسم الأشعة والتصوير الطبي', order: 6, published: true, createdAt: new Date(), updatedAt: new Date() },
    ]
    await db.collection('departments').insertMany(departments)
    console.log(`✅ Seeded ${departments.length} departments`)
  }

  // Seed medical categories
  const categories = [
    { id: 'emergency', nameAr: 'طب الطوارئ', icon: '🚑', color: '#ef4444' },
    { id: 'cardiology', nameAr: 'أمراض القلب', icon: '❤️', color: '#ec4899' },
    { id: 'neurology', nameAr: 'الأعصاب', icon: '🧠', color: '#8b5cf6' },
    { id: 'pediatrics', nameAr: 'طب الأطفال', icon: '👶', color: '#10b981' },
    { id: 'surgery', nameAr: 'الجراحة', icon: '🔪', color: '#f59e0b' },
    { id: 'internal', nameAr: 'الطب الباطني', icon: '🩺', color: '#06b6d4' },
    { id: 'radiology', nameAr: 'الأشعة', icon: '📸', color: '#6366f1' },
    { id: 'pharmacology', nameAr: 'الأدوية', icon: '💊', color: '#14b8a6' },
  ]
  await db.collection('categories').insertMany(categories)

  // Seed medical ranks
  const ranks = [
    { title: 'طالب طب', titleEn: 'Intern', minXP: 0, icon: '🩺' },
    { title: 'ممرض', titleEn: 'Nurse', minXP: 500, icon: '💊' },
    { title: 'طبيب مقيم', titleEn: 'Resident', minXP: 2000, icon: '🏥' },
    { title: 'أخصائي', titleEn: 'Specialist', minXP: 5000, icon: '⚕️' },
    { title: 'جراح', titleEn: 'Surgeon', minXP: 10000, icon: '🔪' },
    { title: 'خبير طوارئ', titleEn: 'Trauma Master', minXP: 20000, icon: '🚑' },
    { title: 'قائد العناية المركزة', titleEn: 'ICU Commander', minXP: 50000, icon: '👑' },
  ]
  await db.collection('ranks').insertMany(ranks)

  // Seed courses with lessons
  const coursesCount = await db.collection('courses').countDocuments()
  if (coursesCount === 0) {
    const courses = [
      {
        title: 'Emergency Medicine Masterclass', titleAr: 'دورة طب الطوارئ الشاملة',
        description: 'Comprehensive emergency medicine course', descriptionAr: 'أكبر دورة طب طوارئ عربية',
        category: 'emergency', instructorId: new ObjectId(), instructorName: 'د. محمد العلي',
        rating: 4.9, totalRatings: 1520, students: 15200, duration: '42 ساعة', totalHours: 42,
        level: 'advanced', price: 0, isPremium: false, published: true, tags: ['طوارئ', 'ACLs', 'trauma'],
        lessonsData: [
          { id: '1-1', title: 'Introduction to Emergency Medicine', titleAr: 'مقدمة في طب الطوارئ', type: 'article', duration: 25, order: 1, isFree: true, summary: 'طب الطوارئ هو تخصص يركز على تشخيص وعلاج الحالات الحادة. نظام ABC هو الأساس.', keyPoints: ['نظام ABC هو أساس تقييم أي حالة طوارئ', 'التقييم الأولي يتم في أول 5-10 دقائق', 'التقييم الثانوي بعد استقرار المريض'] },
          { id: '1-2', title: 'CPR & Cardiac Arrest', titleAr: 'الإنعاش القلبي وتوقف القلب', type: 'article', duration: 35, order: 2, isFree: true, summary: 'CPR هو الإجراء الأهم في توقف القلب. نسبة الضغط للتنفس 30:2 للبالغين.', keyPoints: ['نسبة CPR للبالغين 30:2', 'معدل الضغط 100-120/دقيقة', 'عمق الضغط 5-6 سم'] },
          { id: '1-3', title: 'Trauma Assessment', titleAr: 'تقييم الرضح', type: 'article', duration: 30, order: 3, isFree: true, summary: 'تقييم الرضح يتبع نظام ATLS مع ABCDE. مقياس GCS أساسي في التقييم العصبي.', keyPoints: ['نظام ABCDE في تقييم الرضح', 'حماية العمود الفقري العنقي أولوية', 'GCS أقل من 8 = تنبيب'] },
          { id: '1-4', title: 'Shock Management', titleAr: 'إدارة الصدمة', type: 'article', duration: 30, order: 4, isFree: false, summary: 'الصدمة أنواع عدة: نقص الحجم، التأقية، القلبية، والإنتانية.', keyPoints: ['صدمة نقص الحجم الأكثر شيوعاً', 'أدرينالين هو العلاج الأول لصدمة التأقية', 'الدرجة 4 = فقدان أكثر من 40% من حجم الدم'] },
          { id: '1-5', title: 'Airway Management', titleAr: 'إدارة المجرى الهوائي', type: 'article', duration: 25, order: 5, isFree: false, summary: 'تأمين المجرى الهوائي هو أولوية قصوى. التنبيب الرغامي هو المعيار الذهبي.', keyPoints: ['ABC - المجرى الهوائي أولاً', 'OPA للمرضى فاقدي الوعي', 'التنبيب الرغامي = المعيار الذهبي'] },
          { id: '1-6', title: 'Emergency Drugs', titleAr: 'أدوية الطوارئ', type: 'article', duration: 35, order: 6, isFree: false, summary: 'أدوية الطوارئ الأساسية تشمل الأدرينالين، النورأدرينالين، الأميودارون، والأتروبين.', keyPoints: ['أدرينالين 1ملغ كل 3-5 دقائق في CPR', 'أدرينالين 0.3-0.5ملغ عضلي في صدمة التأقية', 'نورأدرينالين = الدواء الأول في الصدمة الإنتانية'] },
          { id: '1-7', title: 'Wound Management', titleAr: 'إدارة الجروح', type: 'article', duration: 20, order: 7, isFree: false, summary: 'إدارة الجروح تشمل إيقاف النزيف، التنظيف، التخدير الموضعي، والخياطة.', keyPoints: ['الضغط المباشر لإيقاف النزيف', 'ليدوكايين 1-2% للتخدير الموضعي', 'تطعيم الكزاز عند الحاجة'] },
          { id: '1-8', title: 'Burns Management', titleAr: 'إدارة الحروق', type: 'article', duration: 25, order: 8, isFree: false, summary: 'الحروق تُصنف لثلاث درجات. قاعدة التسعة لحساب المساحة.', keyPoints: ['قاعدة التسعة لحساب مساحة الحروق', 'الدرجة الثالثة = تلف كامل وقد يكون بلا ألم', 'تبريد بماء بارد وليس ثلج'] },
          { id: '1-9', title: 'Fractures & Orthopedic Emergencies', titleAr: 'الكسور والطوارئ العظمية', type: 'article', duration: 30, order: 9, isFree: false, summary: 'الكسور المفتوحة = طوارئ تتطلب تدخلاً فورياً.', keyPoints: ['الكسر المفتوح يحتاج مضادات حيوية فورية', 'كسر الفخذ = فقدان 1-2 لتر دم', 'كسر الحوض = خطر نزيف داخلي شديد'] },
          { id: '1-10', title: 'Stroke Protocol', titleAr: 'بروتوكول السكتة الدماغية', type: 'article', duration: 25, order: 10, isFree: false, summary: 'السكتة الدماغية = طوارئ عصبية. FAST للتعرف. tPA خلال 4.5 ساعات.', keyPoints: ['FAST: Face, Arms, Speech, Time', 'CT scan فوري لتمييز النوع', 'tPA خلال 4.5 ساعات للاحتشاء'] },
          { id: '1-11', title: 'Poisoning & Overdose', titleAr: 'التسمم والجرعة الزائدة', type: 'article', duration: 25, order: 11, isFree: false, summary: 'معرفة الترياق المناسب لكل نوع تسمم أمر حاسم.', keyPoints: ['نالوكسون 0.4-2ملغ لأفيونات', 'NAC لباراسيتامول', 'غسل المعدة خلال ساعة واحدة'] },
          { id: '1-12', title: 'Emergency Quiz', titleAr: 'اختبار طب الطوارئ', type: 'quiz', duration: 15, order: 12, isFree: true, content: 'اختبار شامل في طب الطوارئ' },
        ],
        createdAt: new Date(), updatedAt: new Date(),
      },
      {
        title: 'Cardiology Essentials', titleAr: 'أساسيات أمراض القلب',
        description: 'Learn cardiology from scratch', descriptionAr: 'تعلم أمراض القلب من الصفر',
        category: 'cardiology', instructorId: new ObjectId(), instructorName: 'د. سارة الأحمد',
        rating: 4.8, totalRatings: 890, students: 8900, duration: '28 ساعة', totalHours: 28,
        level: 'intermediate', price: 27000, isPremium: true, published: true, tags: ['قلب', 'ECG', 'أمراض قلبية'],
        lessonsData: [
          { id: '2-1', title: 'Heart Anatomy & Physiology', titleAr: 'تشريح وفسيولوجيا القلب', type: 'article', duration: 30, order: 1, isFree: true, summary: 'القلب يتكون من 4 حجرات. الشريان التاجي يغذي عضلة القلب.', keyPoints: ['4 حجرات: أذينان وبطينان', 'الشريان التاجي يغذي القلب', 'البطين الأيسر الأقوى'] },
          { id: '2-2', title: 'ECG Interpretation', titleAr: 'تفسير تخطيط القلب', type: 'article', duration: 40, order: 2, isFree: true, summary: 'ECG يقرأ بالترتيب: المعدل، النظم، P، PR، QRS، T. ارتفاع ST = STEMI.', keyPoints: ['المعدل الطبيعي 60-100/دقيقة', 'ارتفاع ST = STEMI', 'QRS أقل من 0.12 ثانية'] },
          { id: '2-3', title: 'Heart Failure', titleAr: 'فشل القلب', type: 'article', duration: 35, order: 3, isFree: false, summary: 'فشل القلب: انخفاض أو حفظ الكسر القذفي.', keyPoints: ['HFrEF: كسر قذفي أقل من 40%', 'HFpEF: كسر قذفي 50%+', 'ACE inhibitors أساسية في العلاج'] },
          { id: '2-4', title: 'Hypertension Emergency', titleAr: 'طوارئ ارتفاع الضغط', type: 'article', duration: 25, order: 4, isFree: false, summary: 'طوارئ الضغط: انقباضي >180 أو انبساطي >120 مع ضرر أعضاء.', keyPoints: ['الضغط >180/120 مع ضرر أعضاء', 'خفض 25% في الساعة الأولى', 'نيتروبروسيد أو لابيتالول'] },
          { id: '2-5', title: 'Arrhythmias', titleAr: 'اضطرابات النظم القلبي', type: 'article', duration: 35, order: 5, isFree: false, summary: 'اضطرابات النظم: تسارع وبطء. التسرع البطيني أخطر.', keyPoints: ['تسرع بطيني غير مستقر = صدمة', 'أميودارون للتسرع البطيني المستقر', 'أتروبين لبطء القلب العرضي'] },
          { id: '2-6', title: 'Aortic Dissection', titleAr: 'تسلخ الأبهر', type: 'article', duration: 20, order: 6, isFree: false, summary: 'تسلخ الأبهر: ألم ممزق ينتقل للظهر. نوع A = جراحة فورية.', keyPoints: ['ألم صدري ممزق ينتقل للظهر', 'نوع A = جراحة فورية', 'نوع B = علاج دوائي'] },
          { id: '2-7', title: 'Valvular Heart Disease', titleAr: 'أمراض صمامات القلب', type: 'article', duration: 30, order: 7, isFree: false, summary: 'أمراض الصمامات: تضيق وقصور. الإيكو أساسي في التشخيص.', keyPoints: ['إيكو القلب = الفحص الأساسي', 'تضيق أبهري = ألم + إغماء + فشل', 'تبديل الصمام عند التضيق الشديد'] },
          { id: '2-8', title: 'Cardiac Medications', titleAr: 'أدوية القلب', type: 'article', duration: 30, order: 8, isFree: false, summary: 'أدوية القلب: حاصرات بيتا، ACE، مميعات، ستاتينات.', keyPoints: ['حاصرات بيتا: بطء القلب والربو كآثار جانبية', 'ACE: السعال كأثر جانبي شائع', 'كلوبيدوغريل + أسبرين بعد الدعامة'] },
          { id: '2-9', title: 'Acute Coronary Syndrome', titleAr: 'متلازمة الشريان التاجي الحادة', type: 'article', duration: 35, order: 9, isFree: false, summary: 'ACS: STEMI الأخطر. MONA كعلاج إسعافي.', keyPoints: ['STEMI = ارتفاع ST = الأكثر خطورة', 'MONA: Morphine, O2, Nitrates, Aspirin', 'القسطرة خلال 90 دقيقة لـ STEMI'] },
          { id: '2-10', title: 'Cardiology Quiz', titleAr: 'اختبار أمراض القلب', type: 'quiz', duration: 15, order: 10, isFree: true, content: 'اختبار شامل في أمراض القلب' },
        ],
        createdAt: new Date(), updatedAt: new Date(),
      },
      {
        title: 'Neurology Deep Dive', titleAr: 'الغوص في علم الأعصاب',
        description: 'Everything about neurology', descriptionAr: 'كل ما تحتاجه عن الأعصاب',
        category: 'neurology', instructorId: new ObjectId(), instructorName: 'د. خالد المنصور',
        rating: 4.7, totalRatings: 630, students: 6300, duration: '35 ساعة', totalHours: 35,
        level: 'advanced', price: 32000, isPremium: true, published: true, tags: ['أعصاب', 'stroke', 'دماغ'],
        lessonsData: [
          { id: '3-1', title: 'Neuroanatomy Basics', titleAr: 'أساسيات التشريح العصبي', type: 'article', duration: 30, order: 1, isFree: true, summary: 'أساسيات الجهاز العصبي المركزي والمحيطي.' },
          { id: '3-2', title: 'Neurological Examination', titleAr: 'الفحص العصبي', type: 'article', duration: 35, order: 2, isFree: true, summary: 'خطوات الفحص العصبي الشامل.' },
          { id: '3-3', title: 'Stroke', titleAr: 'السكتة الدماغية', type: 'article', duration: 40, order: 3, isFree: false, summary: 'تشخيص وعلاج السكتة الدماغية الحادة.' },
          { id: '3-4', title: 'Epilepsy', titleAr: 'الصرع', type: 'article', duration: 30, order: 4, isFree: false, summary: 'أنواع الصرع وطرق العلاج.' },
          { id: '3-5', title: 'Headache Disorders', titleAr: 'اضطرابات الصداع', type: 'article', duration: 25, order: 5, isFree: false, summary: 'تصنيف وتشخيص الصداع.' },
          { id: '3-6', title: 'Demyelinating Diseases', titleAr: 'أمراض إزالة الميالين', type: 'article', duration: 30, order: 6, isFree: false, summary: 'التصلب المتعدد وأمراض إزالة الميالين.' },
          { id: '3-7', title: 'Neurodegenerative Diseases', titleAr: 'الأمراض التنكسية العصبية', type: 'article', duration: 35, order: 7, isFree: false, summary: 'الزهايمر وباركنسون.' },
          { id: '3-8', title: 'Spinal Cord Disorders', titleAr: 'أمراض الحبل الشوكي', type: 'article', duration: 30, order: 8, isFree: false, summary: 'إصابات وأمراض الحبل الشوكي.' },
          { id: '3-9', title: 'Peripheral Neuropathy', titleAr: 'اعتلال الأعصاب المحيطية', type: 'article', duration: 25, order: 9, isFree: false, summary: 'أنواع وأسباب اعتلال الأعصاب المحيطية.' },
          { id: '3-10', title: 'Neurology Quiz', titleAr: 'اختبار علم الأعصاب', type: 'quiz', duration: 15, order: 10, isFree: true, content: 'اختبار شامل في علم الأعصاب' },
        ],
        createdAt: new Date(), updatedAt: new Date(),
      },
      {
        title: 'Pediatrics Fundamentals', titleAr: 'أساسيات طب الأطفال',
        description: 'Pediatrics made fun', descriptionAr: 'طب الأطفال بطريقة ممتعة',
        category: 'pediatrics', instructorId: new ObjectId(), instructorName: 'د. نورة الحربي',
        rating: 4.9, totalRatings: 1120, students: 11200, duration: '30 ساعة', totalHours: 30,
        level: 'beginner', price: 0, isPremium: false, published: true, tags: ['أطفال', 'حديثي الولادة', 'لقاحات'],
        lessonsData: [
          { id: '4-1', title: 'Pediatric Assessment', titleAr: 'تقييم الطفل', type: 'article', duration: 25, order: 1, isFree: true, summary: 'أساسيات تقييم الطفل في مختلف الأعمار.' },
          { id: '4-2', title: 'Neonatal Care', titleAr: 'رعاية حديثي الولادة', type: 'article', duration: 35, order: 2, isFree: true, summary: 'رعاية المواليد الجدد والفحص الأولي.' },
          { id: '4-3', title: 'Vaccination Schedule', titleAr: 'جدول اللقاحات', type: 'article', duration: 20, order: 3, isFree: false, summary: 'جدول اللقاحات المحدث ومواعيدها.' },
          { id: '4-4', title: 'Common Pediatric Infections', titleAr: 'الالتهابات الشائعة عند الأطفال', type: 'article', duration: 30, order: 4, isFree: false, summary: 'أشهر الالتهابات وعلاجها.' },
          { id: '4-5', title: 'Pediatric Emergencies', titleAr: 'طوارئ الأطفال', type: 'article', duration: 35, order: 5, isFree: false, summary: 'الحالات الطارئة في طب الأطفال.' },
          { id: '4-6', title: 'Growth & Development', titleAr: 'النمو والتطور', type: 'article', duration: 25, order: 6, isFree: false, summary: 'معالم النمو والتطور عند الأطفال.' },
          { id: '4-7', title: 'Nutrition & Feeding', titleAr: 'التغذية والرضاعة', type: 'article', duration: 20, order: 7, isFree: false, summary: 'أسس التغذية السليمة للطفل.' },
          { id: '4-8', title: 'Congenital Heart Disease', titleAr: 'أمراض القلب الخلقية', type: 'article', duration: 30, order: 8, isFree: false, summary: 'أمراض القلب الخلقية وتشخيصها.' },
          { id: '4-9', title: 'Childhood Respiratory Disorders', titleAr: 'أمراض الجهاز التنفسي', type: 'article', duration: 25, order: 9, isFree: false, summary: 'أمراض الجهاز التنفسي عند الأطفال.' },
          { id: '4-10', title: 'Pediatrics Quiz', titleAr: 'اختبار طب الأطفال', type: 'quiz', duration: 15, order: 10, isFree: true, content: 'اختبار شامل في طب الأطفال' },
        ],
        createdAt: new Date(), updatedAt: new Date(),
      },
      {
        title: 'Surgery Techniques', titleAr: 'تقنيات الجراحة',
        description: 'Learn surgery step by step', descriptionAr: 'تعلم الجراحة خطوة بخطوة',
        category: 'surgery', instructorId: new ObjectId(), instructorName: 'د. فهد العمري',
        rating: 4.6, totalRatings: 450, students: 4500, duration: '50 ساعة', totalHours: 50,
        level: 'advanced', price: 43000, isPremium: true, published: true, tags: ['جراحة', 'خياطة', 'تنظير'],
        lessonsData: [
          { id: '5-1', title: 'Surgical Basics', titleAr: 'أساسيات الجراحة', type: 'article', duration: 30, order: 1, isFree: true, summary: 'المبادئ الأساسية للجراحة.' },
          { id: '5-2', title: 'Suture Techniques', titleAr: 'تقنيات الخياطة', type: 'video', duration: 25, order: 2, isFree: true, summary: 'طرق الخياطة الجراحية المختلفة.' },
          { id: '5-3', title: 'Laparoscopic Surgery', titleAr: 'الجراحة التنظيرية', type: 'article', duration: 35, order: 3, isFree: false, summary: 'أساسيات الجراحة بالمنظار.' },
          { id: '5-4', title: 'Appendectomy', titleAr: 'استئصال الزائدة', type: 'article', duration: 30, order: 4, isFree: false, summary: 'خطوات استئصال الزائدة الدودية.' },
          { id: '5-5', title: 'Cholecystectomy', titleAr: 'استئصال المرارة', type: 'article', duration: 30, order: 5, isFree: false, summary: 'استئصال المرارة بالتنظير والمفتوحة.' },
          { id: '5-6', title: 'Hernia Repair', titleAr: 'إصلاح الفتق', type: 'article', duration: 25, order: 6, isFree: false, summary: 'طرق إصلاح الفتق المختلفة.' },
          { id: '5-7', title: 'Trauma Surgery', titleAr: 'جراحة الرضح', type: 'article', duration: 40, order: 7, isFree: false, summary: 'التدخلات الجراحية في حالات الرضح.' },
          { id: '5-8', title: 'Post-operative Care', titleAr: 'الرعاية بعد الجراحة', type: 'article', duration: 20, order: 8, isFree: false, summary: 'متابعة المريض بعد العملية.' },
          { id: '5-9', title: 'Surgical Complications', titleAr: 'مضاعفات الجراحة', type: 'article', duration: 25, order: 9, isFree: false, summary: 'المضاعفات الشائعة وكيفية التعامل معها.' },
          { id: '5-10', title: 'Surgery Quiz', titleAr: 'اختبار الجراحة', type: 'quiz', duration: 15, order: 10, isFree: true, content: 'اختبار شامل في الجراحة' },
        ],
        createdAt: new Date(), updatedAt: new Date(),
      },
      {
        title: 'Internal Medicine Review', titleAr: 'مراجعة الطب الباطني',
        description: 'Comprehensive internal medicine review', descriptionAr: 'مراجعة شاملة للطب الباطني',
        category: 'internal', instructorId: new ObjectId(), instructorName: 'د. ليلى القحطاني',
        rating: 4.8, totalRatings: 980, students: 9800, duration: '38 ساعة', totalHours: 38,
        level: 'intermediate', price: 21000, isPremium: true, published: true, tags: ['باطني', 'تشخيص', 'علاج'],
        lessonsData: [
          { id: '6-1', title: 'Clinical Reasoning', titleAr: 'التفكير السريري', type: 'article', duration: 30, order: 1, isFree: true, summary: 'أساسيات التفكير السريري والتشخيص التفريقي.' },
          { id: '6-2', title: 'Respiratory Medicine', titleAr: 'أمراض الجهاز التنفسي', type: 'article', duration: 35, order: 2, isFree: true, summary: 'أمراض الرئة والتنفس الشائعة.' },
          { id: '6-3', title: 'Gastroenterology', titleAr: 'أمراض الجهاز الهضمي', type: 'article', duration: 30, order: 3, isFree: false, summary: 'أمراض المعدة والأمعاء والكبد.' },
          { id: '6-4', title: 'Nephrology', titleAr: 'أمراض الكلى', type: 'article', duration: 25, order: 4, isFree: false, summary: 'أمراض الكلى الحادة والمزمنة.' },
          { id: '6-5', title: 'Endocrinology', titleAr: 'أمراض الغدد الصماء', type: 'article', duration: 30, order: 5, isFree: false, summary: 'السكري وأمراض الغدة الدرقية.' },
          { id: '6-6', title: 'Hematology', titleAr: 'أمراض الدم', type: 'article', duration: 25, order: 6, isFree: false, summary: 'فقر الدم واضطرابات التخثر.' },
          { id: '6-7', title: 'Rheumatology', titleAr: 'أمراض الروماتيزم', type: 'article', duration: 25, order: 7, isFree: false, summary: 'التهاب المفاصل وأمراض المناعة الذاتية.' },
          { id: '6-8', title: 'Infectious Diseases', titleAr: 'الأمراض المعدية', type: 'article', duration: 35, order: 8, isFree: false, summary: 'الأمراض المعدية الشائعة وعلاجها.' },
          { id: '6-9', title: 'Oncology Basics', titleAr: 'أساسيات الأورام', type: 'article', duration: 30, order: 9, isFree: false, summary: 'أنواع الأورام وطرق العلاج.' },
          { id: '6-10', title: 'Internal Medicine Quiz', titleAr: 'اختبار الطب الباطني', type: 'quiz', duration: 15, order: 10, isFree: true, content: 'اختبار شامل في الطب الباطني' },
        ],
        createdAt: new Date(), updatedAt: new Date(),
      },
      {
        title: 'Radiology Interpretation', titleAr: 'تفسير الأشعة',
        description: 'Master radiology interpretation', descriptionAr: 'اتقان قراءة الأشعة',
        category: 'radiology', instructorId: new ObjectId(), instructorName: 'د. عمر الشمري',
        rating: 4.7, totalRatings: 560, students: 5600, duration: '25 ساعة', totalHours: 25,
        level: 'intermediate', price: 27000, isPremium: true, published: true, tags: ['أشعة', 'CT', 'MRI'],
        lessonsData: [
          { id: '7-1', title: 'X-ray Basics', titleAr: 'أساسيات الأشعة السينية', type: 'article', duration: 25, order: 1, isFree: true, summary: 'كيفية قراءة صور الأشعة السينية.' },
          { id: '7-2', title: 'CT Scan Interpretation', titleAr: 'تفسير الأشعة المقطعية', type: 'article', duration: 35, order: 2, isFree: true, summary: 'قراءة وتفسير فحوصات CT.' },
          { id: '7-3', title: 'MRI Basics', titleAr: 'أساسيات الرنين المغناطيسي', type: 'article', duration: 30, order: 3, isFree: false, summary: 'مبادئ وتطبيقات MRI.' },
          { id: '7-4', title: 'Chest X-ray', titleAr: 'أشعة الصدر', type: 'article', duration: 25, order: 4, isFree: false, summary: 'تفسير أشعة الصدر الشائعة.' },
          { id: '7-5', title: 'Abdominal Imaging', titleAr: 'تصوير البطن', type: 'article', duration: 30, order: 5, isFree: false, summary: 'تفسير صور البطن المختلفة.' },
          { id: '7-6', title: 'Brain Imaging', titleAr: 'تصوير الدماغ', type: 'article', duration: 35, order: 6, isFree: false, summary: 'CT و MRI للدماغ.' },
          { id: '7-7', title: 'Musculoskeletal Imaging', titleAr: 'تصوير الجهاز العضلي الهيكلي', type: 'article', duration: 25, order: 7, isFree: false, summary: 'أشعة العظام والمفاصل.' },
          { id: '7-8', title: 'Ultrasound', titleAr: 'التصوير بالموجات فوق الصوتية', type: 'article', duration: 20, order: 8, isFree: false, summary: 'تطبيقات الإيكو والسونار.' },
          { id: '7-9', title: 'Interventional Radiology', titleAr: 'الأشعة التداخلية', type: 'article', duration: 30, order: 9, isFree: false, summary: 'إجراءات الأشعة التداخلية.' },
          { id: '7-10', title: 'Radiology Quiz', titleAr: 'اختبار الأشعة', type: 'quiz', duration: 15, order: 10, isFree: true, content: 'اختبار شامل في الأشعة' },
        ],
        createdAt: new Date(), updatedAt: new Date(),
      },
      {
        title: 'Pharmacology Made Easy', titleAr: 'علم الأدوية مبسط',
        description: 'Pharmacology made simple', descriptionAr: 'أدوية بشكل سهل وممتع',
        category: 'pharmacology', instructorId: new ObjectId(), instructorName: 'د. ريم الدوسري',
        rating: 4.9, totalRatings: 1350, students: 13500, duration: '32 ساعة', totalHours: 32,
        level: 'beginner', price: 0, isPremium: false, published: true, tags: ['أدوية', 'جرعات', 'تداخلات'],
        lessonsData: [
          { id: '8-1', title: 'Introduction to Pharmacology', titleAr: 'مقدمة في علم الأدوية', type: 'article', duration: 25, order: 1, isFree: true, summary: 'علم الأدوية: حركية (ADME) وديناميكية.', keyPoints: ['ADME: Absorption, Distribution, Metabolism, Excretion', 'الكبد = الاستقلاب الرئيسي', 'الكلى = الإخراج الرئيسي'] },
          { id: '8-2', title: 'Drug Interactions', titleAr: 'التداخلات الدوائية', type: 'article', duration: 20, order: 2, isFree: true, summary: 'التداخلات الدوائية: أنواعها وكيفية تجنبها.', keyPoints: ['تداخل دواء-دواء', 'تداخل دواء-طعام', 'تآزر وتضاد'] },
          { id: '8-3', title: 'Antibiotics', titleAr: 'المضادات الحيوية', type: 'article', duration: 35, order: 3, isFree: false, summary: 'تصنيف واستخدامات المضادات الحيوية.' },
          { id: '8-4', title: 'Pain Management', titleAr: 'إدارة الألم', type: 'article', duration: 30, order: 4, isFree: false, summary: 'مسكنات الألم وسلم الألم.' },
          { id: '8-5', title: 'Cardiovascular Drugs', titleAr: 'أدوية القلب والأوعية', type: 'article', duration: 35, order: 5, isFree: false, summary: 'أدوية الضغط والقلب.' },
          { id: '8-6', title: 'Diabetes Medications', titleAr: 'أدوية السكري', type: 'article', duration: 25, order: 6, isFree: false, summary: 'أنواع أدوية السكري واستخداماتها.' },
          { id: '8-7', title: 'Respiratory Drugs', titleAr: 'أدوية الجهاز التنفسي', type: 'article', duration: 20, order: 7, isFree: false, summary: 'أدوية الربو وانسداد الرئة.' },
          { id: '8-8', title: 'GI Medications', titleAr: 'أدوية الجهاز الهضمي', type: 'article', duration: 20, order: 8, isFree: false, summary: 'أدوية المعدة والأمعاء.' },
          { id: '8-9', title: 'CNS Drugs', titleAr: 'أدوية الجهاز العصبي', type: 'article', duration: 30, order: 9, isFree: false, summary: 'أدوية الاكتئاب والقلق والصرع.' },
          { id: '8-10', title: 'Pharmacology Quiz', titleAr: 'اختبار علم الأدوية', type: 'quiz', duration: 15, order: 10, isFree: true, content: 'اختبار شامل في علم الأدوية' },
        ],
        createdAt: new Date(), updatedAt: new Date(),
      },
    ]

    // Add lessons count for each course
    for (const course of courses) {
      course.lessons = course.lessonsData.length
    }

    await db.collection('courses').insertMany(courses)
    console.log(`✅ Seeded ${courses.length} courses with lessons`)
  }

  console.log('✅ Database seeded with initial data')
}
