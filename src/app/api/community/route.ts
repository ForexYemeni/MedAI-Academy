import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { createNotification, createAdminNotification } from '@/app/api/notifications/route'

// Increase body size limit for long posts
export const maxBodyLength = 4 * 1024 * 1024 // 4mb

// GET /api/community - Fetch posts
export async function GET(req: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    const { searchParams } = new URL(req.url)
    const group = searchParams.get('group')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Build query
    const query: any = {}
    if (group) query.category = group

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

    // Fetch posts
    const posts = await db.collection('community_posts')
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    const total = await db.collection('community_posts').countDocuments(query)

    // Map posts for response
    const mappedPosts = posts.map((post: any) => ({
      id: post._id.toString(),
      author: post.authorName || 'مستخدم',
      authorAvatar: post.authorName ? post.authorName.charAt(0) : '؟',
      authorRank: post.authorRank || 'طالب طب',
      authorRankColor: post.authorRankColor || 'text-neon-cyan',
      content: post.content,
      category: post.category || 'general',
      tags: post.tags || [],
      likes: (post.likedBy || []).length,
      comments: (post.comments || []).length,
      shares: post.sharesCount || 0,
      timestamp: new Date(post.createdAt).getTime(),
      isLiked: userId ? (post.likedBy || []).some((id: any) => id.toString() === userId) : false,
      commentsList: (post.comments || []).map((c: any) => ({
        id: c.id || c._id?.toString() || '',
        authorId: c.authorId || '',
        authorName: c.authorName || 'مستخدم',
        content: c.content || '',
        createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString(),
      })),
    }))

    return NextResponse.json({
      success: true,
      posts: mappedPosts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error: any) {
    console.error('Get community posts error:', error)
    return NextResponse.json({ error: 'حدث خطأ في جلب المنشورات' }, { status: 500 })
  }
}

// POST /api/community - Create a new post
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول أولاً' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const authUser = verifyToken(token)
    if (!authUser) {
      return NextResponse.json({ error: 'رمز المصادقة غير صالح' }, { status: 401 })
    }

    const body = await req.json()
    const { content, category, tags } = body

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'محتوى المنشور مطلوب' }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Get user info
    const { ObjectId } = await import('mongodb')
    let user: any = null
    try {
      if (ObjectId.isValid(authUser.id)) {
        user = await db.collection('users').findOne({ _id: new ObjectId(authUser.id) })
      }
    } catch { /* ignore */ }
    if (!user) {
      user = await db.collection('users').findOne({ _id: authUser.id as any })
    }

    const newPost = {
      userId: authUser.id,
      authorName: user?.name || authUser.name || 'مستخدم',
      authorRank: user?.rankTitle || 'طالب طب',
      authorRankColor: 'text-neon-cyan',
      content: content.trim(),
      category: category || 'general',
      tags: tags || [],
      likedBy: [],
      comments: [],
      sharesCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection('community_posts').insertOne(newPost)

    // Notify group members about the new post (non-blocking)
    if (category && category !== 'general') {
      try {
        const { ObjectId: ObjId } = await import('mongodb')
        // Find the group
        const group = await db.collection('community_groups').findOne({ category: category })
        if (group) {
          const memberIds = (group.joinedMembers || []).filter(
            (id: any) => id.toString() !== authUser.id
          )
          // Send notification to each member (batch, non-blocking)
          for (const memberId of memberIds.slice(0, 100)) {
            createNotification({
              userId: memberId.toString(),
              title: 'منشور جديد في المجموعة',
              message: `${user?.name || 'مستخدم'} نشر منشوراً جديداً في "${group.nameAr || group.name}"`,
              type: 'community',
              link: 'community',
              category: 'community',
            }).catch(() => {})
          }
        }
      } catch (e) { /* non-critical */ }
    }

    return NextResponse.json({
      success: true,
      post: {
        id: result.insertedId.toString(),
        author: newPost.authorName,
        authorAvatar: newPost.authorName.charAt(0),
        authorRank: newPost.authorRank,
        authorRankColor: newPost.authorRankColor,
        content: newPost.content,
        category: newPost.category,
        tags: newPost.tags,
        likes: 0,
        comments: 0,
        shares: 0,
        timestamp: Date.now(),
        isLiked: false,
      },
    })
  } catch (error: any) {
    console.error('Create community post error:', error)
    return NextResponse.json({ error: 'حدث خطأ في إنشاء المنشور' }, { status: 500 })
  }
}

// PUT /api/community - Like/unlike a post
export async function PUT(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول أولاً' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const authUser = verifyToken(token)
    if (!authUser) {
      return NextResponse.json({ error: 'رمز المصادقة غير صالح' }, { status: 401 })
    }

    const body = await req.json()
    const { action, postId } = body

    if (action === 'like' && postId) {
      const { db } = await connectToDatabase()
      const { ObjectId } = await import('mongodb')

      // Find the post
      let post: any = null
      try {
        if (ObjectId.isValid(postId)) {
          post = await db.collection('community_posts').findOne({ _id: new ObjectId(postId) })
        }
      } catch { /* ignore */ }

      if (!post) {
        return NextResponse.json({ error: 'المنشور غير موجود' }, { status: 404 })
      }

      const likedBy = post.likedBy || []
      const alreadyLiked = likedBy.some((id: any) => id.toString() === authUser.id)

      if (alreadyLiked) {
        // Unlike
        await db.collection('community_posts').updateOne(
          { _id: post._id },
          { $pull: { likedBy: authUser.id as any }, $set: { updatedAt: new Date() } }
        )
        return NextResponse.json({ success: true, liked: false, likes: likedBy.length - 1 })
      } else {
        // Like
        await db.collection('community_posts').updateOne(
          { _id: post._id },
          { $push: { likedBy: authUser.id as any }, $set: { updatedAt: new Date() } }
        )

        // Notify the post author about the like (non-blocking)
        if (post.authorId && post.authorId.toString() !== authUser.id) {
          try {
            let userName = authUser.name || 'مستخدم'
            const { ObjectId: ObjId } = await import('mongodb')
            try {
              const liker = await db.collection('users').findOne({ _id: new ObjId(authUser.id) })
              if (liker?.name) userName = liker.name
            } catch { /* use default name */ }

            createNotification({
              userId: post.authorId.toString(),
              title: 'إعجاب جديد بمنشورك',
              message: `${userName} أعجب بمنشورك`,
              type: 'community',
              link: 'community',
              category: 'community',
            }).catch(() => {})
          } catch (e) { /* non-critical */ }
        }

        return NextResponse.json({ success: true, liked: true, likes: likedBy.length + 1 })
      }
    }

    return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 })
  } catch (error: any) {
    console.error('Community action error:', error)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}
