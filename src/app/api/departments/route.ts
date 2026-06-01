import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { ObjectId } from 'mongodb'

// GET - Fetch departments (public: only published, admin: all)
export async function GET(req: NextRequest) {
  try {
    const { db } = await connectToDatabase()

    // Check if admin auth provided
    const authHeader = req.headers.get('Authorization')
    let isAdmin = false
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '')
        const authUser = verifyToken(token)
        if (authUser && authUser.role === 'admin') {
          isAdmin = true
        }
      } catch { /* ignore */ }
    }

    // Build query: public users only see published departments
    const query: any = {}
    if (!isAdmin) {
      query.published = true
    }

    const departments = await db.collection('departments')
      .find(query)
      .sort({ order: 1 })
      .toArray()

    // Get course counts per department (free and paid)
    const departmentIds = departments.map(d => d._id)

    const courseCounts = await db.collection('courses').aggregate([
      {
        $match: {
          departmentId: { $in: departmentIds },
          ...(isAdmin ? {} : { published: true })
        }
      },
      {
        $group: {
          _id: '$departmentId',
          totalCourses: { $sum: 1 },
          freeCourses: {
            $sum: {
              $cond: [{ $eq: ['$price', 0] }, 1, 0]
            }
          },
          paidCourses: {
            $sum: {
              $cond: [{ $gt: ['$price', 0] }, 1, 0]
            }
          },
        }
      }
    ]).toArray()

    // Build lookup map
    const countMap = new Map(courseCounts.map(c => [c._id.toString(), c]))

    const departmentsWithCounts = departments.map(dept => ({
      ...dept,
      id: dept._id.toString(),
      courseCount: countMap.get(dept._id.toString())?.totalCourses || 0,
      freeCourseCount: countMap.get(dept._id.toString())?.freeCourses || 0,
      paidCourseCount: countMap.get(dept._id.toString())?.paidCourses || 0,
    }))

    return NextResponse.json({
      success: true,
      departments: departmentsWithCounts,
    })
  } catch (error: any) {
    console.error('Get departments error:', error)
    return NextResponse.json({ error: 'حدث خطأ في جلب الأقسام' }, { status: 500 })
  }
}

// POST - Create department (admin only)
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const authUser = verifyToken(token)
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 })
    }

    const body = await req.json()
    const { nameAr, nameEn, icon, color, description, order, published } = body

    if (!nameAr || !nameEn) {
      return NextResponse.json({ error: 'اسم القسم بالعربي والإنجليزي مطلوبان' }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const department = {
      nameAr,
      nameEn,
      icon: icon || '📁',
      color: color || '#06b6d4',
      description: description || '',
      order: order || 0,
      published: published ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection('departments').insertOne(department)

    return NextResponse.json({
      success: true,
      departmentId: result.insertedId,
      message: 'تم إضافة القسم بنجاح',
    })
  } catch (error: any) {
    console.error('Create department error:', error)
    return NextResponse.json({ error: 'حدث خطأ في إضافة القسم' }, { status: 500 })
  }
}

// PUT - Update department (admin only)
export async function PUT(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const authUser = verifyToken(token)
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 })
    }

    const body = await req.json()
    const { departmentId, ...updates } = body

    if (!departmentId) {
      return NextResponse.json({ error: 'معرف القسم مطلوب' }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    updates.updatedAt = new Date()

    await db.collection('departments').updateOne(
      { _id: new ObjectId(departmentId) },
      { $set: updates }
    )

    return NextResponse.json({
      success: true,
      message: 'تم تعديل القسم بنجاح',
    })
  } catch (error: any) {
    console.error('Update department error:', error)
    return NextResponse.json({ error: 'حدث خطأ في تعديل القسم' }, { status: 500 })
  }
}

// DELETE - Delete department (admin only)
export async function DELETE(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const authUser = verifyToken(token)
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 })
    }

    const { departmentId } = await req.json()
    if (!departmentId) {
      return NextResponse.json({ error: 'معرف القسم مطلوب' }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Delete the department
    await db.collection('departments').deleteOne({ _id: new ObjectId(departmentId) })

    // Unset departmentId on all courses in this department
    await db.collection('courses').updateMany(
      { departmentId: new ObjectId(departmentId) },
      { $unset: { departmentId: '' } }
    )

    return NextResponse.json({
      success: true,
      message: 'تم حذف القسم بنجاح',
    })
  } catch (error: any) {
    console.error('Delete department error:', error)
    return NextResponse.json({ error: 'حدث خطأ في حذف القسم' }, { status: 500 })
  }
}
