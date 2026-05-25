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
  type: 'info' | 'success' | 'warning' | 'achievement'
  read: boolean
  actionUrl?: string
  createdAt: Date
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

  console.log('✅ Database seeded with initial data')
}
