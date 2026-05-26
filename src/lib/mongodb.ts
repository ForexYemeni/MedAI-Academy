import { Db, MongoClient } from 'mongodb'

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

export default connectToDatabase
