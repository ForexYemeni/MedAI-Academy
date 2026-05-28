import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { createAdminNotification } from '@/app/api/notifications/route'

// GET /api/community/groups - List all groups (with user join status)
export async function GET(req: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    
    // Get current user if authenticated
    const authHeader = req.headers.get('Authorization')
    let userId: string | null = null
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '')
        const authUser = verifyToken(token)
        if (authUser) userId = authUser.id
      } catch { /* ignore */ }
    }
    
    const groups = await db.collection('community_groups')
      .find({})
      .sort({ members: -1 })
      .toArray()
    
    // If no groups exist, seed default groups
    if (groups.length === 0) {
      const defaultGroups = [
        { name: 'Emergency Medicine', nameAr: 'طب الطوارئ', icon: '🚑', members: 0, category: 'emergency', description: 'مناقشة حالات الطوارئ والإنعاش', joinedMembers: [], pendingMembers: [], createdAt: new Date() },
        { name: 'Cardiology Club', nameAr: 'نادي القلب', icon: '❤️', members: 0, category: 'cardiology', description: 'كل ما يتعلق بأمراض القلب', joinedMembers: [], pendingMembers: [], createdAt: new Date() },
        { name: 'Study Room - Anatomy', nameAr: 'غرفة دراسة - تشريح', icon: '🦴', members: 0, category: 'anatomy', description: 'مراجعة التشريح البشري', joinedMembers: [], pendingMembers: [], createdAt: new Date() },
        { name: 'Exam Prep Board', nameAr: 'لوحة تحضير الامتحانات', icon: '📝', members: 0, category: 'exams', description: 'تحضير للامتحانات الطبية', joinedMembers: [], pendingMembers: [], createdAt: new Date() },
        { name: 'Case Discussion', nameAr: 'مناقشة الحالات', icon: '🩺', members: 0, category: 'cases', description: 'مناقشة الحالات السريرية', joinedMembers: [], pendingMembers: [], createdAt: new Date() },
        { name: 'Surgery Techniques', nameAr: 'تقنيات الجراحة', icon: '🔪', members: 0, category: 'surgery', description: 'تقنيات ومهارات جراحية', joinedMembers: [], pendingMembers: [], createdAt: new Date() },
      ]
      await db.collection('community_groups').insertMany(defaultGroups)
      const seeded = await db.collection('community_groups').find({}).sort({ members: -1 }).toArray()
      return NextResponse.json({ success: true, groups: seeded.map(g => formatGroup(g, userId)) })
    }
    
    return NextResponse.json({ success: true, groups: groups.map(g => formatGroup(g, userId)) })
  } catch (error: any) {
    console.error('Get community groups error:', error)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}

function formatGroup(g: any, userId: string | null) {
  const joinedMembers = g.joinedMembers || []
  const pendingMembers = g.pendingMembers || []
  
  let joinStatus: 'none' | 'joined' | 'pending' = 'none'
  if (userId) {
    if (joinedMembers.some((id: any) => id.toString() === userId)) {
      joinStatus = 'joined'
    } else if (pendingMembers.some((id: any) => id.toString() === userId)) {
      joinStatus = 'pending'
    }
  }
  
  return {
    id: g._id.toString(),
    name: g.name,
    nameAr: g.nameAr,
    icon: g.icon,
    members: g.members || 0,
    category: g.category,
    description: g.description || '',
    joinStatus,
  }
}

// POST /api/community/groups - Create a new group (admin only) OR request to join
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول' }, { status: 401 })
    }
    
    const token = authHeader.replace('Bearer ', '')
    const authUser = verifyToken(token)
    if (!authUser) {
      return NextResponse.json({ error: 'رمز المصادقة غير صالح' }, { status: 401 })
    }
    
    const body = await req.json()
    const { name, nameAr, icon, category, description, action, groupId } = body
    
    // Join request action
    if (action === 'joinRequest' && groupId) {
      const { db } = await connectToDatabase()
      const { ObjectId } = await import('mongodb')
      
      let groupOid: any = groupId
      try { if (ObjectId.isValid(groupId)) groupOid = new ObjectId(groupId) } catch { /* ignore */ }
      
      const group = await db.collection('community_groups').findOne({ _id: groupOid })
      if (!group) {
        return NextResponse.json({ error: 'المجموعة غير موجودة' }, { status: 404 })
      }
      
      // Check if already joined
      const joinedMembers = group.joinedMembers || []
      if (joinedMembers.some((id: any) => id.toString() === authUser.id)) {
        return NextResponse.json({ error: 'أنت عضو بالفعل في هذه المجموعة' }, { status: 400 })
      }
      
      // Check if already pending
      const pendingMembers = group.pendingMembers || []
      if (pendingMembers.some((id: any) => id.toString() === authUser.id)) {
        return NextResponse.json({ error: 'لديك طلب انضمام معلق بالفعل' }, { status: 400 })
      }
      
      // Get user info
      let user: any = null
      try {
        if (ObjectId.isValid(authUser.id)) {
          user = await db.collection('users').findOne({ _id: new ObjectId(authUser.id) })
        }
      } catch { /* ignore */ }
      if (!user) {
        user = await db.collection('users').findOne({ _id: authUser.id as any })
      }
      
      // Create join request
      const joinRequest = {
        userId: authUser.id,
        userName: user?.name || authUser.name || 'مستخدم',
        userPhone: user?.phone || '',
        groupId: groupOid,
        groupName: group.nameAr || group.name,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      await db.collection('group_join_requests').insertOne(joinRequest)
      
      // Add user to group's pendingMembers
      await db.collection('community_groups').updateOne(
        { _id: groupOid },
        { $addToSet: { pendingMembers: authUser.id } }
      )
      
      // Notify admins about the join request (non-blocking)
      try {
        createAdminNotification({
          title: 'طلب انضمام جديد',
          message: `${user?.name || 'مستخدم'} يريد الانضمام إلى "${group.nameAr || group.name}"`,
          type: 'community',
          link: 'admin',
          category: 'community',
        }).catch(() => {})
      } catch (e) { /* non-critical */ }
      
      return NextResponse.json({ success: true, message: 'تم إرسال طلب الانضمام بنجاح' })
    }
    
    // Create group (admin only)
    if (!name || !nameAr) {
      return NextResponse.json({ error: 'اسم المجموعة مطلوب' }, { status: 400 })
    }
    
    if (authUser.role !== 'admin') {
      return NextResponse.json({ error: 'صلاحيات مدير مطلوبة' }, { status: 403 })
    }
    
    const { db } = await connectToDatabase()
    const newGroup = {
      name,
      nameAr,
      icon: icon || '📚',
      members: 0,
      category: category || 'general',
      description: description || '',
      joinedMembers: [],
      pendingMembers: [],
      createdAt: new Date(),
    }
    
    const result = await db.collection('community_groups').insertOne(newGroup)
    
    return NextResponse.json({
      success: true,
      group: { id: result.insertedId.toString(), ...newGroup },
    })
  } catch (error: any) {
    console.error('Community groups POST error:', error)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}
