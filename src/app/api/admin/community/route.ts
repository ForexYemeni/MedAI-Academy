import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'

// GET /api/admin/community - Get all groups and posts for admin
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول' }, { status: 401 })
    }
    
    const token = authHeader.replace('Bearer ', '')
    const authUser = verifyToken(token)
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: 'صلاحيات مدير مطلوبة' }, { status: 403 })
    }
    
    const { db } = await connectToDatabase()
    const { ObjectId } = await import('mongodb')
    
    const groups = await db.collection('community_groups').find({}).sort({ members: -1 }).toArray()
    const posts = await db.collection('community_posts').find({}).sort({ createdAt: -1 }).limit(50).toArray()
    const totalPosts = await db.collection('community_posts').countDocuments({})
    
    // Fetch join requests for all groups
    const joinRequests = await db.collection('group_join_requests').find({ status: 'pending' }).toArray()
    
    // Build a map of group id -> pending requests count and list
    const groupRequestsMap = new Map<string, any[]>()
    for (const req of joinRequests) {
      const groupId = req.groupId?.toString() || ''
      if (!groupRequestsMap.has(groupId)) {
        groupRequestsMap.set(groupId, [])
      }
      groupRequestsMap.get(groupId)!.push({
        id: req._id.toString(),
        userId: req.userId,
        userName: req.userName || 'مستخدم',
        userPhone: req.userPhone || '',
        groupId: req.groupId?.toString() || '',
        groupName: req.groupName || '',
        status: req.status,
        createdAt: req.createdAt,
      })
    }
    
    return NextResponse.json({
      success: true,
      groups: groups.map(g => ({
        id: g._id.toString(),
        name: g.name,
        nameAr: g.nameAr,
        icon: g.icon,
        members: g.members || 0,
        category: g.category,
        description: g.description || '',
        pendingRequests: (groupRequestsMap.get(g._id.toString()) || []).length,
        pendingMembers: (g.pendingMembers || []),
        joinedMembers: (g.joinedMembers || []),
      })),
      posts: posts.map(p => ({
        id: p._id.toString(),
        author: p.authorName || 'مستخدم',
        content: p.content,
        category: p.category,
        likes: (p.likedBy || []).length,
        comments: (p.comments || []).length,
        commentsList: (p.comments || []).map((c: any) => ({
          id: c.id || c._id?.toString() || '',
          authorId: c.authorId || '',
          authorName: c.authorName || 'مستخدم',
          content: c.content || '',
          createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString(),
        })),
        createdAt: p.createdAt,
        tags: p.tags || [],
      })),
      joinRequests: Array.from(groupRequestsMap.values()).flat(),
      totalPosts,
    })
  } catch (error: any) {
    console.error('Get admin community error:', error)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}

// PUT /api/admin/community - Update group, edit post, manage join requests (admin)
export async function PUT(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول' }, { status: 401 })
    }
    
    const token = authHeader.replace('Bearer ', '')
    const authUser = verifyToken(token)
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: 'صلاحيات مدير مطلوبة' }, { status: 403 })
    }
    
    const body = await req.json()
    const { action, groupId, postId, name, nameAr, icon, category, description, message, content, requestId, requestAction } = body
    
    const { db } = await connectToDatabase()
    const { ObjectId } = await import('mongodb')
    
    if (action === 'updateGroup' && groupId) {
      const updates: any = {}
      if (name) updates.name = name
      if (nameAr) updates.nameAr = nameAr
      if (icon) updates.icon = icon
      if (category) updates.category = category
      if (description !== undefined) updates.description = description
      
      let oid: any = groupId
      try { if (ObjectId.isValid(groupId)) oid = new ObjectId(groupId) } catch { /* ignore */ }
      
      await db.collection('community_groups').updateOne(
        { _id: oid },
        { $set: updates }
      )
      return NextResponse.json({ success: true })
    }
    
    if (action === 'deleteGroup' && groupId) {
      let oid: any = groupId
      try { if (ObjectId.isValid(groupId)) oid = new ObjectId(groupId) } catch { /* ignore */ }
      
      await db.collection('community_groups').deleteOne({ _id: oid })
      // Also delete join requests for this group
      await db.collection('group_join_requests').deleteMany({ groupId: oid })
      return NextResponse.json({ success: true })
    }
    
    if (action === 'deletePost' && postId) {
      let oid: any = postId
      try { if (ObjectId.isValid(postId)) oid = new ObjectId(postId) } catch { /* ignore */ }
      
      await db.collection('community_posts').deleteOne({ _id: oid })
      return NextResponse.json({ success: true })
    }
    
    if (action === 'editPost' && postId) {
      let oid: any = postId
      try { if (ObjectId.isValid(postId)) oid = new ObjectId(postId) } catch { /* ignore */ }
      
      const updates: any = {}
      if (content !== undefined) updates.content = content
      if (category !== undefined) updates.category = category
      updates.updatedAt = new Date()
      
      await db.collection('community_posts').updateOne(
        { _id: oid },
        { $set: updates }
      )
      return NextResponse.json({ success: true })
    }
    
    if (action === 'manageJoinRequest' && requestId && requestAction) {
      let reqOid: any = requestId
      try { if (ObjectId.isValid(requestId)) reqOid = new ObjectId(requestId) } catch { /* ignore */ }
      
      const joinRequest = await db.collection('group_join_requests').findOne({ _id: reqOid })
      if (!joinRequest) {
        return NextResponse.json({ error: 'طلب الانضمام غير موجود' }, { status: 404 })
      }
      
      if (requestAction === 'approve') {
        // Update request status
        await db.collection('group_join_requests').updateOne(
          { _id: reqOid },
          { $set: { status: 'approved', updatedAt: new Date() } }
        )
        
        // Add user to group's joinedMembers and increment members count
        let groupOid: any = joinRequest.groupId
        try { if (ObjectId.isValid(joinRequest.groupId)) groupOid = new ObjectId(joinRequest.groupId) } catch { /* ignore */ }
        
        await db.collection('community_groups').updateOne(
          { _id: groupOid },
          {
            $addToSet: { joinedMembers: joinRequest.userId },
            $pull: { pendingMembers: joinRequest.userId },
            $inc: { members: 1 },
          }
        )
        
        // Add group to user's joinedGroups
        await db.collection('users').updateOne(
          { _id: new ObjectId(joinRequest.userId) },
          { $addToSet: { joinedGroups: joinRequest.groupId.toString() } }
        )
        
      } else if (requestAction === 'reject') {
        // Update request status
        await db.collection('group_join_requests').updateOne(
          { _id: reqOid },
          { $set: { status: 'rejected', updatedAt: new Date() } }
        )
        
        // Remove from pendingMembers
        let groupOid: any = joinRequest.groupId
        try { if (ObjectId.isValid(joinRequest.groupId)) groupOid = new ObjectId(joinRequest.groupId) } catch { /* ignore */ }
        
        await db.collection('community_groups').updateOne(
          { _id: groupOid },
          { $pull: { pendingMembers: joinRequest.userId } }
        )
      }
      
      return NextResponse.json({ success: true })
    }
    
    if (action === 'broadcast' && message) {
      // Create an admin broadcast post
      const newPost = {
        userId: 'admin',
        authorName: 'إدارة المنصة',
        authorRank: 'مدير النظام',
        authorRankColor: 'text-amber-400',
        content: message,
        category: 'announcement',
        tags: ['إعلان'],
        likedBy: [],
        comments: [],
        sharesCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      await db.collection('community_posts').insertOne(newPost)
      return NextResponse.json({ success: true })
    }
    
    return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 })
  } catch (error: any) {
    console.error('Admin community action error:', error)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}
