import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'

// DELETE /api/community/delete - Delete a post (admin or author)
export async function DELETE(req: NextRequest) {
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

    const { searchParams } = new URL(req.url)
    const postId = searchParams.get('postId')

    if (!postId) {
      return NextResponse.json({ error: 'معرف المنشور مطلوب' }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const { ObjectId } = await import('mongodb')

    let post: any = null
    try {
      if (ObjectId.isValid(postId)) {
        post = await db.collection('community_posts').findOne({ _id: new ObjectId(postId) })
      }
    } catch { /* ignore */ }

    if (!post) {
      return NextResponse.json({ error: 'المنشور غير موجود' }, { status: 404 })
    }

    // Only admin or author can delete
    if (authUser.role !== 'admin' && post.userId !== authUser.id && post.authorId?.toString() !== authUser.id) {
      return NextResponse.json({ error: 'ليس لديك صلاحية حذف هذا المنشور' }, { status: 403 })
    }

    await db.collection('community_posts').deleteOne({ _id: post._id })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete community post error:', error)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}
