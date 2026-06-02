import { Db, MongoClient, ObjectId } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI || ''
const MONGODB_DB = process.env.MONGODB_DB || 'medai_academy'

let cachedClient: MongoClient | null = null
let cachedDb: Db | null = null

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  // إذا كان الاتصال موجوداً مسبقاً، أعد استخدامه
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb }
  }

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI غير موجود في متغيرات البيئة')
  }

  // إنشاء اتصال جديد
  const client = new MongoClient(MONGODB_URI, {
    maxPoolSize: 10,
    minPoolSize: 2,
    maxIdleTimeMS: 30000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 30000,
    serverSelectionTimeoutMS: 10000,
  })

  await client.connect()
  const db = client.db(MONGODB_DB)

  // حفظ في الذاكرة المؤقتة
  cachedClient = client
  cachedDb = db

  return { client, db }
}

// Create database indexes for performance
export async function createIndexes() {
  const { db } = await connectToDatabase()
  
  try {
    await Promise.all([
      db.collection('users').createIndex({ phone: 1 }, { unique: true }),
      db.collection('courses').createIndex({ published: 1, rating: -1 }),
      db.collection('courses').createIndex({ category: 1, published: 1 }),
      db.collection('courses').createIndex({ createdAt: -1 }),
      db.collection('courses').createIndex({ recommended: 1, published: 1 }),
      db.collection('courses').createIndex({ departmentId: 1 }),
      db.collection('enrollments').createIndex({ userId: 1, courseId: 1 }, { unique: true }),
      db.collection('enrollments').createIndex({ courseId: 1 }),
      db.collection('payments').createIndex({ userId: 1, status: 1 }),
      db.collection('payments').createIndex({ courseId: 1, status: 1 }),
      db.collection('notifications').createIndex({ userId: 1, read: 1, createdAt: -1 }),
      db.collection('push_subscriptions').createIndex({ userId: 1 }),
      db.collection('group_join_requests').createIndex({ groupId: 1, status: 1 }),
      db.collection('community_posts').createIndex({ createdAt: -1 }),
      db.collection('lessons').createIndex({ courseId: 1, order: 1 }),
      db.collection('departments').createIndex({ order: 1 }),
    ])
    console.log('[DB] Indexes created successfully')
  } catch (error) {
    console.warn('[DB] Some indexes may already exist:', error)
  }
}

export default connectToDatabase
