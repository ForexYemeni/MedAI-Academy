import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'

// GET /api/mongodb/init - Initialize MongoDB connection and test
export async function GET() {
  try {
    const { db } = await connectToDatabase()
    
    // Test connection
    const collections = await db.listCollections().toArray()
    
    return NextResponse.json({
      status: 'connected',
      message: 'تم الاتصال بـ MongoDB بنجاح!',
      database: db.databaseName,
      collectionsCount: collections.length,
      collections: collections.map(c => c.name),
      timestamp: new Date().toISOString(),
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'فشل الاتصال بـ MongoDB',
        error: message 
      },
      { status: 500 }
    )
  }
}

// POST /api/mongodb/init - Initialize with seed data
export async function POST() {
  try {
    const { db } = await connectToDatabase()
    
    // Import and run seed
    const { seedDatabase } = await import('@/lib/mongodb-schema')
    await seedDatabase(db)
    
    return NextResponse.json({
      status: 'initialized',
      message: 'تم تهيئة قاعدة البيانات بالبيانات الأولية بنجاح!',
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'فشل تهيئة قاعدة البيانات',
        error: message 
      },
      { status: 500 }
    )
  }
}
