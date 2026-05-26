import { Db, MongoClient } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI
const MONGODB_DB = process.env.MONGODB_DB || 'medai_academy'

if (!MONGODB_URI) {
  console.warn('⚠️ MONGODB_URI is not set. Database features will be unavailable.')
}

let cachedClient: MongoClient | null = null
let cachedDb: Db | null = null

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI غير مضبوط. يرجى إضافة متغير البيئة في Vercel أو ملف .env')
  }

  // Check cached connection is still alive
  if (cachedClient && cachedDb) {
    try {
      await cachedClient.db('admin').command({ ping: 1 })
      return { client: cachedClient, db: cachedDb }
    } catch {
      cachedClient = null
      cachedDb = null
    }
  }

  // Create new connection
  const client = new MongoClient(MONGODB_URI, {
    maxPoolSize: 10,
    minPoolSize: 2,
    maxIdleTimeMS: 30000,
    connectTimeoutMS: 15000,
    socketTimeoutMS: 45000,
    serverSelectionTimeoutMS: 15000,
    retryWrites: true,
  })

  await client.connect()
  const db = client.db(MONGODB_DB)

  cachedClient = client
  cachedDb = db

  console.log('✅ Connected to MongoDB:', MONGODB_DB)

  return { client, db }
}

export default connectToDatabase
