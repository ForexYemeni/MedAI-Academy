import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { createNotification } from '@/app/api/notifications/route'

// POST /api/community/comments - Add a comment to a post
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
    const { postId, content } = body

    if (!postId || !content?.trim()) {
      return NextResponse.json({ error: 'معرف المنشور والمحتوى مطلوبان' }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const { ObjectId } = await import('mongodb')

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

    const newComment = {
      id: new ObjectId().toString(),
      authorId: authUser.id,
      authorName: user?.name || authUser.name || 'مستخدم',
      content: content.trim(),
      createdAt: new Date(),
    }

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

    await db.collection('community_posts').updateOne(
      { _id: post._id },
      { $push: { comments: newComment }, $set: { updatedAt: new Date() } }
    )

    // Send notification to the post author (don't notify if commenting on own post)
    // Note: post document stores author as 'userId', not 'authorId'
    const postAuthorId = post.userId || post.authorId
    if (postAuthorId && postAuthorId.toString() !== authUser.id) {
      try {
        await createNotification({
          userId: postAuthorId.toString(),
          title: 'تعليق جديد على منشورك',
          message: `${user?.name || authUser.name || 'مستخدم'} علّق على منشورك: "${content.trim().substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
          type: 'community',
          link: 'community',
          category: 'community',
          icon: '💬',
        })
      } catch (e) { /* notification is non-critical */ }
    }

    return NextResponse.json({
      success: true,
      comment: newComment,
    })
  } catch (error: any) {
    console.error('Create comment error:', error)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}
