import { Db, MongoClient } from 'mongodb'

if (!process.env.MONGODB_URI) {
  throw new Error('يرجى إضافة MONGODB_URI في ملف .env')
}

const MONGODB_URI = process.env.MONGODB_URI
const MONGODB_DB = process.env.MONGODB_DB || 'medai_academy'

let cachedClient: MongoClient | null = null
let cachedDb: Db | null = null

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  // إذا كان الاتصال موجوداً مسبقاً، أعد استخدامه
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb }
  }

  // إنشاء اتصال جديد
  const client = new MongoClient(MONGODB_URI, {
    // MongoDB Driver options
    maxPoolSize: 10,
    minPoolSize: 2,
    maxIdleTimeMS: 30000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  })

  await client.connect()
  const db = client.db(MONGODB_DB)

  // حفظ في الذاكرة المؤقتة
  cachedClient = client
  cachedDb = db

  return { client, db }
}

// إنشاء الفهارس (Indexes) للأداء
export async function createIndexes(db: Db) {
  // Users
  await db.collection('users').createIndex({ email: 1 }, { unique: true })
  await db.collection('users').createIndex({ xp: -1 }) // للـ leaderboard
  await db.collection('users').createIndex({ subscription: 1 })

  // Courses
  await db.collection('courses').createIndex({ category: 1 })
  await db.collection('courses').createIndex({ level: 1 })
  await db.collection('courses').createIndex({ rating: -1 })
  await db.collection('courses').createIndex({ students: -1 })
  await db.collection('courses').createIndex({ titleAr: 'text', title: 'text', tags: 'text' }) // بحث نصي

  // Enrollments
  await db.collection('enrollments').createIndex({ userId: 1, courseId: 1 }, { unique: true })
  await db.collection('enrollments').createIndex({ userId: 1 })

  // Quiz Results
  await db.collection('quizResults').createIndex({ userId: 1, createdAt: -1 })
  await db.collection('quizResults').createIndex({ category: 1 })

  // Simulation Results
  await db.collection('simulationResults').createIndex({ userId: 1, createdAt: -1 })
  await db.collection('simulationResults').createIndex({ caseId: 1 })

  // Notifications
  await db.collection('notifications').createIndex({ userId: 1, read: 1, createdAt: -1 })

  // Community Posts
  await db.collection('communityPosts').createIndex({ groupId: 1, createdAt: -1 })
  await db.collection('communityPosts').createIndex({ authorId: 1 })

  // Sessions (for auth)
  await db.collection('sessions').createIndex({ token: 1 }, { unique: true })
  await db.collection('sessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })

  console.log('✅ MongoDB indexes created successfully')
}

export default connectToDatabase
