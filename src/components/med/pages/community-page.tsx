'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Users,
  MessageCircle,
  Heart,
  Share2,
  Plus,
  Clock,
  Trophy,
  Zap,
  Send,
  Hash,
  BookOpen,
  Stethoscope,
  Brain,
  HeartPulse,
  Siren,
  Scissors,
  Baby,
  Pill,
  ScanLine,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Circle,
  Loader2,
  Trash2,
  UserPlus,
  CheckCircle2,
  Lock,
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────

interface CommunityGroup {
  id: string
  name: string
  nameAr: string
  icon: string
  members: number
  category: string
  description: string
  joinStatus: 'none' | 'joined' | 'pending'
}

interface Comment {
  id: string
  authorId: string
  authorName: string
  content: string
  createdAt: string
}

interface Post {
  id: string
  author: string
  authorAvatar: string
  authorRank: string
  authorRankColor: string
  content: string
  category: string
  tags: string[]
  likes: number
  comments: number
  shares: number
  timestamp: number
  isLiked: boolean
  commentsList?: Comment[]
}

// ─── Category Config ────────────────────────────────────────

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  emergency: <Siren className="h-4 w-4 text-red-400" />,
  cardiology: <HeartPulse className="h-4 w-4 text-pink-400" />,
  neurology: <Brain className="h-4 w-4 text-neon-purple" />,
  pediatrics: <Baby className="h-4 w-4 text-neon-green" />,
  surgery: <Scissors className="h-4 w-4 text-neon-blue" />,
  internal: <Stethoscope className="h-4 w-4 text-neon-orange" />,
  radiology: <ScanLine className="h-4 w-4 text-neon-cyan" />,
  pharmacology: <Pill className="h-4 w-4 text-neon-purple" />,
  anatomy: <BookOpen className="h-4 w-4 text-neon-cyan" />,
  exams: <Sparkles className="h-4 w-4 text-amber-400" />,
  cases: <Stethoscope className="h-4 w-4 text-neon-green" />,
  general: <Users className="h-4 w-4 text-muted-foreground" />,
  announcement: <Zap className="h-4 w-4 text-amber-400" />,
}

const CATEGORY_LABELS: Record<string, string> = {
  emergency: 'طوارئ',
  cardiology: 'قلب',
  neurology: 'أعصاب',
  pediatrics: 'أطفال',
  surgery: 'جراحة',
  internal: 'باطني',
  radiology: 'أشعة',
  pharmacology: 'أدوية',
  anatomy: 'تشريح',
  exams: 'امتحانات',
  cases: 'حالات',
  general: 'عام',
  announcement: 'إعلان',
}

// ─── Animation Variants ─────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

// ─── Helper: Time Ago ───────────────────────────────────────

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'الآن'
  if (minutes < 60) return `منذ ${minutes} دقيقة`
  if (hours < 24) return `منذ ${hours} ساعة`
  return `منذ ${days} يوم`
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  MAIN COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function CommunityPage() {
  const { user, authToken } = useAppStore()

  // ─── State ─────────────────────────────────────────────
  const [groups, setGroups] = useState<CommunityGroup[]>([])
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [groupsLoading, setGroupsLoading] = useState(true)
  const [newPostContent, setNewPostContent] = useState('')
  const [newPostCategory, setNewPostCategory] = useState('general')
  const [newPostTags, setNewPostTags] = useState('')
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [mobileTab, setMobileTab] = useState<'feed' | 'groups'>('feed')
  const [submitting, setSubmitting] = useState(false)
  const [postError, setPostError] = useState('')
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({})
  const [submittingComments, setSubmittingComments] = useState<Set<string>>(new Set())
  const [joinSubmitting, setJoinSubmitting] = useState<Set<string>>(new Set())

  // ─── Fetch Groups ──────────────────────────────────────
  const fetchGroups = useCallback(async () => {
    try {
      const authHeader: HeadersInit = {}
      const token = authToken || (typeof window !== 'undefined' ? localStorage.getItem('medai-token') : null)
      if (token) {
        authHeader.Authorization = `Bearer ${token}`
      }
      const res = await fetch('/api/community/groups', { headers: authHeader })
      const data = await res.json()
      if (data.success) {
        setGroups(data.groups || [])
      }
    } catch (err) {
      console.error('Failed to fetch groups:', err)
    } finally {
      setGroupsLoading(false)
    }
  }, [authToken])

  // ─── Fetch Posts ───────────────────────────────────────
  const fetchPosts = useCallback(async (groupCategory?: string) => {
    try {
      setLoading(true)
      const url = groupCategory
        ? `/api/community?group=${groupCategory}`
        : '/api/community'
      
      const authHeader: HeadersInit = {}
      const token = authToken || (typeof window !== 'undefined' ? localStorage.getItem('medai-token') : null)
      if (token) {
        authHeader.Authorization = `Bearer ${token}`
      }
      
      const res = await fetch(url, { headers: authHeader })
      const data = await res.json()
      if (data.success) {
        setPosts(data.posts || [])
      }
    } catch (err) {
      console.error('Failed to fetch posts:', err)
    } finally {
      setLoading(false)
    }
  }, [authToken])

  // ─── Initial Load ──────────────────────────────────────
  useEffect(() => {
    fetchGroups()
  }, [fetchGroups])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  // ─── Active Group ──────────────────────────────────────
  const activeGroup = useMemo(
    () => groups.find((g) => g.id === activeGroupId) ?? null,
    [groups, activeGroupId]
  )

  // ─── Handle Group Selection ────────────────────────────
  const handleGroupSelect = useCallback((groupId: string) => {
    setActiveGroupId(groupId)
    const group = groups.find(g => g.id === groupId)
    if (group) {
      fetchPosts(group.category)
    }
    setMobileTab('feed')
  }, [groups, fetchPosts])

  // ─── Handle "All" Selection ────────────────────────────
  const handleShowAll = useCallback(() => {
    setActiveGroupId(null)
    fetchPosts()
    setMobileTab('feed')
  }, [fetchPosts])

  // ─── Create Post Handler ───────────────────────────────
  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return

    const token = authToken || (typeof window !== 'undefined' ? localStorage.getItem('medai-token') : null)
    if (!token) return

    setSubmitting(true)
    setPostError('')
    try {
      const res = await fetch('/api/community', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: newPostContent.trim(),
          category: newPostCategory,
          tags: newPostTags.split(',').map((t) => t.trim()).filter(Boolean),
        }),
      })

      const data = await res.json()
      if (data.success && data.post) {
        setPosts([data.post, ...posts])
        setNewPostContent('')
        setNewPostTags('')
        setShowCreatePost(false)
      } else {
        setPostError(data.error || 'حدث خطأ في نشر المنشور')
      }
    } catch (err) {
      console.error('Failed to create post:', err)
      setPostError('حدث خطأ في الاتصال. حاول مرة أخرى.')
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Like Handler ──────────────────────────────────────
  const handleLike = async (postId: string) => {
    const token = authToken || (typeof window !== 'undefined' ? localStorage.getItem('medai-token') : null)
    if (!token) return

    // Optimistic update
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              isLiked: !p.isLiked,
              likes: p.isLiked ? p.likes - 1 : p.likes + 1,
            }
          : p
      )
    )

    try {
      await fetch('/api/community', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'like', postId }),
      })
    } catch (err) {
      console.error('Failed to like post:', err)
      // Revert on error
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                isLiked: !p.isLiked,
                likes: p.isLiked ? p.likes - 1 : p.likes + 1,
              }
            : p
        )
      )
    }
  }

  // ─── Toggle Comments ───────────────────────────────────
  const toggleComments = (postId: string) => {
    setExpandedComments(prev => {
      const next = new Set(prev)
      if (next.has(postId)) {
        next.delete(postId)
      } else {
        next.add(postId)
      }
      return next
    })
  }

  // ─── Submit Comment ────────────────────────────────────
  const handleSubmitComment = async (postId: string) => {
    const content = commentInputs[postId]?.trim()
    if (!content) return

    const token = authToken || (typeof window !== 'undefined' ? localStorage.getItem('medai-token') : null)
    if (!token) return

    setSubmittingComments(prev => new Set(prev).add(postId))

    try {
      const res = await fetch('/api/community/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ postId, content }),
      })

      const data = await res.json()
      if (data.success && data.comment) {
        // Update the post with the new comment
        setPosts(prev => prev.map(p => {
          if (p.id === postId) {
            const existingComments = p.commentsList || []
            return {
              ...p,
              comments: p.comments + 1,
              commentsList: [...existingComments, data.comment],
            }
          }
          return p
        }))
        setCommentInputs(prev => ({ ...prev, [postId]: '' }))
      }
    } catch (err) {
      console.error('Failed to submit comment:', err)
    } finally {
      setSubmittingComments(prev => {
        const next = new Set(prev)
        next.delete(postId)
        return next
      })
    }
  }

  // ─── Request to Join Group ──────────────────────────────
  const handleJoinRequest = async (groupId: string) => {
    const token = authToken || (typeof window !== 'undefined' ? localStorage.getItem('medai-token') : null)
    if (!token) return

    setJoinSubmitting(prev => new Set(prev).add(groupId))
    try {
      const res = await fetch('/api/community/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'joinRequest', groupId }),
      })
      const data = await res.json()
      if (data.success) {
        // Update group join status locally
        setGroups(prev => prev.map(g =>
          g.id === groupId ? { ...g, joinStatus: 'pending' as const } : g
        ))
      }
    } catch (err) {
      console.error('Failed to request join:', err)
    } finally {
      setJoinSubmitting(prev => {
        const next = new Set(prev)
        next.delete(groupId)
        return next
      })
    }
  }

  // ─── Check if user can post ────────────────────────────
  const canUserPost = useMemo(() => {
    // Admin can always post
    if (user?.role === 'admin') return true
    // If no group is selected ("all" view), allow posting
    if (!activeGroupId) return true
    // If the active group is joined, allow posting
    const activeGroup = groups.find(g => g.id === activeGroupId)
    return activeGroup?.joinStatus === 'joined'
  }, [user?.role, activeGroupId, groups])

  // ─── Delete Post Handler ───────────────────────────────
  const handleDeletePost = async (postId: string) => {
    const token = authToken || (typeof window !== 'undefined' ? localStorage.getItem('medai-token') : null)
    if (!token) return

    try {
      const res = await fetch(`/api/community/delete?postId=${postId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await res.json()
      if (data.success) {
        setPosts(prev => prev.filter(p => p.id !== postId))
      }
    } catch (err) {
      console.error('Failed to delete post:', err)
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  RENDER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  return (
    <motion.div
      dir="rtl"
      className="min-h-screen w-full pb-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">

        {/* ═══════════════════════════════════════════════════
            HEADER
        ═══════════════════════════════════════════════════ */}
        <motion.div variants={itemVariants} className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-neon-purple/15 p-2.5 border border-neon-purple/20">
                <Users className="h-6 w-6 text-neon-purple" />
              </div>
              <div>
                <h1 className="text-2xl font-bold neon-text-purple">المجتمع الطبي</h1>
                <p className="text-sm text-muted-foreground">تواصل مع الزملاء وشارك المعرفة</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Mobile Tabs */}
        <div className="flex sm:hidden mb-4 gap-2">
          <button
            onClick={() => setMobileTab('feed')}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
              mobileTab === 'feed'
                ? 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30'
                : 'glass-card text-muted-foreground'
            }`}
          >
            المناقشات
          </button>
          <button
            onClick={() => setMobileTab('groups')}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
              mobileTab === 'groups'
                ? 'bg-neon-purple/15 text-neon-purple border border-neon-purple/30'
                : 'glass-card text-muted-foreground'
            }`}
          >
            المجموعات
          </button>
        </div>

        <div className="flex gap-6">
          {/* ═══════════════════════════════════════════════════
              LEFT SIDEBAR: GROUPS LIST (Desktop)
          ═══════════════════════════════════════════════════ */}
          <motion.aside
            variants={itemVariants}
            className={`hidden sm:block w-72 shrink-0`}
          >
            <div className="sticky top-24 space-y-4">
              {/* Groups */}
              <div className="glass-card p-4">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                  <Hash className="h-4 w-4 text-neon-purple" />
                  المجموعات
                </h3>
                <ScrollArea className="max-h-80">
                  <div className="space-y-1.5">
                    {/* All / General option */}
                    <motion.button
                      whileHover={{ x: -3 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleShowAll}
                      className={`w-full rounded-xl p-3 flex items-center gap-3 transition-all text-right ${
                        activeGroupId === null
                          ? 'bg-neon-cyan/10 border border-neon-cyan/30'
                          : 'hover:bg-muted border border-transparent'
                      }`}
                    >
                      <div className="text-xl shrink-0">🌍</div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold truncate block">جميع المناقشات</span>
                        <span className="text-[10px] text-muted-foreground">كل المنشورات</span>
                      </div>
                      {activeGroupId === null && (
                        <div className="w-1.5 h-8 rounded-full bg-neon-cyan shrink-0" />
                      )}
                    </motion.button>

                    {groupsLoading ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin text-neon-purple" />
                      </div>
                    ) : (
                      groups.map((group) => {
                        const isActive = activeGroupId === group.id
                        return (
                          <motion.button
                            key={group.id}
                            whileHover={{ x: -3 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleGroupSelect(group.id)}
                            className={`w-full rounded-xl p-3 flex items-center gap-3 transition-all text-right ${
                              isActive
                                ? 'bg-neon-purple/10 border border-neon-purple/30 neon-glow'
                                : 'hover:bg-muted border border-transparent'
                            }`}
                            style={
                              isActive
                                ? { boxShadow: '0 0 20px rgba(139,92,246,0.15)' }
                                : {}
                            }
                          >
                            <div className="text-xl shrink-0">{group.icon}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-semibold truncate block">{group.nameAr}</span>
                                {group.joinStatus === 'joined' && (
                                  <span className="text-[8px] bg-neon-green/15 text-neon-green px-1 py-0.5 rounded">عضو</span>
                                )}
                                {group.joinStatus === 'pending' && (
                                  <span className="text-[8px] bg-neon-orange/15 text-neon-orange px-1 py-0.5 rounded">معلق</span>
                                )}
                              </div>
                              <span className="text-[10px] text-muted-foreground">
                                {group.members.toLocaleString('ar-EG')} عضو
                              </span>
                            </div>
                            {isActive && (
                              <div className="w-1.5 h-8 rounded-full bg-neon-purple shrink-0" />
                            )}
                          </motion.button>
                        )
                      })
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Coming Soon - Study Rooms */}
              <div className="glass-card p-4">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-neon-green" />
                  غرف الدراسة
                </h3>
                <div className="text-center py-4">
                  <div className="w-10 h-10 rounded-full bg-neon-green/10 flex items-center justify-center mx-auto mb-2">
                    <Zap className="w-5 h-5 text-neon-green" />
                  </div>
                  <p className="text-xs text-muted-foreground">قريباً - غرف دراسة صوتية مباشرة</p>
                </div>
              </div>
            </div>
          </motion.aside>

          {/* Mobile Groups List */}
          <AnimatePresence>
            {mobileTab === 'groups' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="sm:hidden w-full space-y-3"
              >
                {/* All option */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleShowAll}
                  className={`w-full glass-card p-4 flex items-center gap-3 text-right ${
                    activeGroupId === null ? 'border-neon-cyan/30' : ''
                  }`}
                >
                  <div className="text-2xl">🌍</div>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold truncate block">جميع المناقشات</span>
                    <span className="text-xs text-muted-foreground">كل المنشورات</span>
                  </div>
                </motion.button>

                {groups.map((group) => {
                  const isActive = activeGroupId === group.id
                  return (
                    <motion.button
                      key={group.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleGroupSelect(group.id)}
                      className={`w-full glass-card p-4 flex items-center gap-3 text-right ${
                        isActive ? 'border-neon-purple/30' : ''
                      }`}
                      style={isActive ? { boxShadow: '0 0 20px rgba(139,92,246,0.15)' } : {}}
                    >
                      <div className="text-2xl">{group.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold truncate block">{group.nameAr}</span>
                          {group.joinStatus === 'joined' && (
                            <span className="text-[8px] bg-neon-green/15 text-neon-green px-1 py-0.5 rounded">عضو</span>
                          )}
                          {group.joinStatus === 'pending' && (
                            <span className="text-[8px] bg-neon-orange/15 text-neon-orange px-1 py-0.5 rounded">معلق</span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {group.members.toLocaleString('ar-EG')} عضو
                        </span>
                      </div>
                      <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                    </motion.button>
                  )
                })}

                {/* Mobile Study Rooms Coming Soon */}
                <div className="glass-card p-4 mt-4">
                  <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-neon-green" />
                    غرف الدراسة
                  </h3>
                  <div className="text-center py-4">
                    <div className="w-10 h-10 rounded-full bg-neon-green/10 flex items-center justify-center mx-auto mb-2">
                      <Zap className="w-5 h-5 text-neon-green" />
                    </div>
                    <p className="text-xs text-muted-foreground">قريباً - غرف دراسة صوتية مباشرة</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ═══════════════════════════════════════════════════
              MAIN CONTENT: DISCUSSION FEED
          ═══════════════════════════════════════════════════ */}
          <motion.main
            variants={itemVariants}
            className={`flex-1 min-w-0 space-y-4 ${
              mobileTab === 'groups' ? 'hidden sm:block' : ''
            }`}
          >
            {/* Active Group Header */}
            <div className="glass-card p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{activeGroup?.icon || '🌍'}</span>
                <div className="flex-1">
                  <h2 className="font-bold text-lg">{activeGroup?.nameAr || 'جميع المناقشات'}</h2>
                  <p className="text-xs text-muted-foreground">
                    {activeGroup
                      ? `${activeGroup.members.toLocaleString('ar-EG')} عضو`
                      : 'جميع المنشورات من كافة المجموعات'}
                  </p>
                </div>
                {/* Join Request Button */}
                {activeGroup && activeGroup.joinStatus === 'none' && user?.role !== 'admin' && (
                  <Button
                    onClick={() => handleJoinRequest(activeGroup.id)}
                    disabled={joinSubmitting.has(activeGroup.id)}
                    className="bg-neon-purple/15 text-neon-purple border border-neon-purple/30 hover:bg-neon-purple/25 h-8 text-xs"
                  >
                    {joinSubmitting.has(activeGroup.id) ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <UserPlus className="h-3.5 w-3.5 ml-1" />
                    )}
                    طلب انضمام
                  </Button>
                )}
                {activeGroup && activeGroup.joinStatus === 'pending' && (
                  <Badge className="bg-neon-orange/15 text-neon-orange border border-neon-orange/25 text-[10px]">
                    <Clock className="h-3 w-3 ml-1" />
                    طلبك معلق
                  </Badge>
                )}
                {activeGroup && activeGroup.joinStatus === 'joined' && (
                  <Badge className="bg-neon-green/15 text-neon-green border border-neon-green/25 text-[10px]">
                    <CheckCircle2 className="h-3 w-3 ml-1" />
                    أنت عضو
                  </Badge>
                )}
              </div>
            </div>

            {/* Create Post Button / FAB */}
            {canUserPost ? (
            <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
              <DialogTrigger asChild>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <div className="glass-card p-4 flex items-center gap-3 cursor-pointer hover:border-neon-cyan/20 transition-all">
                    <Avatar className="h-10 w-10 border border-neon-cyan/20">
                      <AvatarFallback className="bg-neon-cyan/15 text-neon-cyan text-sm font-bold">
                        {user.name ? (user.name.charAt(user.name.indexOf('.') + 2) || user.name.charAt(0)) : '?'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground flex-1">
                      شارك فكرة، حالة، أو سؤال...
                    </span>
                    <div className="rounded-lg bg-neon-cyan/10 p-2 border border-neon-cyan/20">
                      <Plus className="h-4 w-4 text-neon-cyan" />
                    </div>
                  </div>
                </motion.div>
              </DialogTrigger>

              <DialogContent className="glass-strong border-neon-cyan/15 max-w-lg max-h-[90vh] flex flex-col" dir="rtl">
                <DialogHeader className="shrink-0">
                  <DialogTitle className="flex items-center gap-2 neon-text">
                    <Sparkles className="h-5 w-5 text-neon-cyan" />
                    إنشاء منشور جديد
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 mt-2 overflow-y-auto flex-1 min-h-0 pr-1">
                  {/* Author info */}
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-neon-cyan/20">
                      <AvatarFallback className="bg-neon-cyan/15 text-neon-cyan text-sm font-bold">
                        {user.name ? (user.name.charAt(user.name.indexOf('.') + 2) || user.name.charAt(0)) : '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-bold">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.rankTitle}</p>
                    </div>
                  </div>

                  {/* Content */}
                  <Textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="ماذا تريد أن تشارك؟ اكتب سؤالك، حالتك، أو ملاحظتك هنا..."
                    className="min-h-[120px] max-h-[40vh] bg-muted/50 border-border focus:border-neon-cyan/30 resize-y text-sm"
                    dir="rtl"
                  />

                  {/* Category */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">التخصص</label>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(CATEGORY_LABELS).filter(([key]) => !['anatomy', 'exams', 'cases', 'announcement'].includes(key)).slice(0, 6).map(([key, label]) => (
                        <button
                          key={key}
                          onClick={() => setNewPostCategory(key)}
                          className={`rounded-lg px-3 py-1.5 text-xs border transition-all flex items-center gap-1.5 ${
                            newPostCategory === key
                              ? 'bg-neon-cyan/15 border-neon-cyan/30 text-neon-cyan'
                              : 'bg-muted/50 border-border text-muted-foreground hover:border-neon-cyan/30'
                          }`}
                        >
                          {CATEGORY_ICONS[key]}
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">الوسوم (مفصولة بفاصلة)</label>
                    <Input
                      value={newPostTags}
                      onChange={(e) => setNewPostTags(e.target.value)}
                      placeholder="مثال: طوارئ, CPR, إنعاش"
                      className="bg-muted/50 border-border focus:border-neon-cyan/30 text-sm"
                      dir="rtl"
                    />
                  </div>

                  {/* Error Message */}
                  {postError && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                      {postError}
                    </div>
                  )}

                  {/* Character count */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">
                      {newPostContent.length > 0 && `${newPostContent.length} حرف`}
                    </span>
                  </div>
                </div>

                {/* Submit - Always visible at bottom */}
                <div className="shrink-0 pt-3 border-t border-border/30">
                  <Button
                    onClick={handleCreatePost}
                    disabled={!newPostContent.trim() || submitting}
                    className="w-full h-11 bg-gradient-to-l from-neon-cyan to-neon-blue text-white font-bold hover:opacity-90 rounded-xl neon-glow disabled:opacity-40"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 ml-2" />
                    )}
                    نشر المنشور
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            ) : (
              <div className="glass-card p-4 flex items-center gap-3 border border-neon-orange/20">
                <Lock className="h-5 w-5 text-neon-orange shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-neon-orange">يجب الانضمام أولاً</p>
                  <p className="text-xs text-muted-foreground">اطلب الانضمام إلى هذه المجموعة لتتمكن من النشر والتعليق</p>
                </div>
              </div>
            )}

            {/* Posts Feed */}
            {loading ? (
              <div className="glass-card p-8 text-center">
                <Loader2 className="w-8 h-8 text-neon-cyan mx-auto mb-3 animate-spin" />
                <p className="text-sm text-muted-foreground">جاري تحميل المنشورات...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-neon-purple/10 flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-neon-purple/50" />
                </div>
                <h3 className="font-bold text-lg mb-2">لا توجد منشورات بعد</h3>
                <p className="text-sm text-muted-foreground mb-4">كن أول من يشارك المعرفة مع المجتمع الطبي!</p>
                <Button
                  onClick={() => setShowCreatePost(true)}
                  className="bg-neon-purple/15 text-neon-purple border border-neon-purple/30 hover:bg-neon-purple/25"
                >
                  <Plus className="w-4 h-4 ml-1" />
                  إنشاء منشور
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post, i) => (
                  <motion.div
                    key={post.id}
                    variants={itemVariants}
                    whileHover={{ y: -2 }}
                    className="glass-card p-5 transition-all hover:border-neon-cyan/15"
                  >
                    {/* Author Row */}
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-10 w-10 border border-border">
                        <AvatarFallback className={`text-sm font-bold ${
                          post.category === 'announcement' 
                            ? 'bg-amber-500/15 text-amber-400' 
                            : 'bg-neon-purple/15 text-neon-purple'
                        }`}>
                          {post.category === 'announcement' ? '📢' : post.authorAvatar}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold truncate">{post.author}</span>
                          <Badge
                            variant="outline"
                            className={`text-[9px] ${post.authorRankColor} border-current/20 bg-current/5`}
                          >
                            {post.authorRank}
                          </Badge>
                          {post.category === 'announcement' && (
                            <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/25 text-[9px]">
                              إعلان
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{timeAgo(post.timestamp)}</span>
                          {post.category && CATEGORY_LABELS[post.category] && (
                            <>
                              <span>·</span>
                              <span className="flex items-center gap-0.5">
                                {CATEGORY_ICONS[post.category]}
                                {CATEGORY_LABELS[post.category]}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      {/* Delete button for own posts */}
                      {user.role === 'admin' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePost(post.id)}
                          className="h-7 w-7 p-0 hover:bg-red-500/10 text-muted-foreground hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>

                    {/* Content */}
                    <div className="mb-4">
                      <p className="text-sm leading-7 whitespace-pre-line">{post.content}</p>
                    </div>

                    {/* Tags */}
                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {post.tags.map((tag, tagIdx) => (
                          <Badge
                            key={tagIdx}
                            variant="outline"
                            className="text-[10px] bg-neon-cyan/5 text-neon-cyan border-neon-cyan/15"
                          >
                            <Hash className="h-2.5 w-2.5 ml-0.5" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <Separator className="bg-border mb-3" />

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                          post.isLiked
                            ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20'
                            : 'bg-muted/30 text-muted-foreground border border-transparent hover:bg-muted hover:text-pink-400'
                        }`}
                      >
                        <Heart className={`h-3.5 w-3.5 ${post.isLiked ? 'fill-pink-400' : ''}`} />
                        <span>{post.likes}</span>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleComments(post.id)}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium border border-transparent transition-all ${
                          expandedComments.has(post.id)
                            ? 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/20'
                            : 'bg-muted/30 text-muted-foreground hover:bg-muted hover:text-neon-cyan'
                        }`}
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span>{post.comments}</span>
                        {expandedComments.has(post.id) ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-muted/30 text-muted-foreground border border-transparent hover:bg-muted hover:text-neon-green transition-all"
                      >
                        <Share2 className="h-3.5 w-3.5" />
                        <span>{post.shares}</span>
                      </motion.button>
                    </div>

                    {/* Comments Section (expandable) */}
                    <AnimatePresence>
                      {expandedComments.has(post.id) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3 pt-3 border-t border-border">
                            {/* Comment Input */}
                            <div className="flex items-center gap-2 mb-3">
                              <Avatar className="h-7 w-7 border border-neon-cyan/20">
                                <AvatarFallback className="bg-neon-cyan/15 text-neon-cyan text-[10px] font-bold">
                                  {user.name ? user.name.charAt(0) : '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 flex gap-2">
                                <Input
                                  value={commentInputs[post.id] || ''}
                                  onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                                  placeholder="اكتب تعليقاً..."
                                  className="bg-muted/50 border-border focus:border-neon-cyan/30 text-xs h-8"
                                  dir="rtl"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault()
                                      handleSubmitComment(post.id)
                                    }
                                  }}
                                />
                                <Button
                                  onClick={() => handleSubmitComment(post.id)}
                                  disabled={!commentInputs[post.id]?.trim() || submittingComments.has(post.id)}
                                  className="h-8 w-8 p-0 bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/25 disabled:opacity-40"
                                >
                                  {submittingComments.has(post.id) ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Send className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                              </div>
                            </div>

                            {/* Comments List */}
                            {post.commentsList && post.commentsList.length > 0 ? (
                              <div className="space-y-2 max-h-60 overflow-y-auto">
                                {post.commentsList.map((comment) => (
                                  <div key={comment.id} className="flex gap-2 p-2 rounded-lg bg-muted/20">
                                    <Avatar className="h-6 w-6 border border-border">
                                      <AvatarFallback className="bg-neon-purple/15 text-neon-purple text-[9px] font-bold">
                                        {comment.authorName.charAt(0)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold">{comment.authorName}</span>
                                        <span className="text-[9px] text-muted-foreground">
                                          {timeAgo(new Date(comment.createdAt).getTime())}
                                        </span>
                                      </div>
                                      <p className="text-xs text-muted-foreground mt-0.5 leading-5">{comment.content}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground text-center py-2">لا توجد تعليقات بعد. كن أول من يعلق!</p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            )}

            {/* ═══════════════════════════════════════════════════
                COMING SOON SECTIONS
            ═══════════════════════════════════════════════════ */}
            <motion.section variants={itemVariants} className="mt-6">
              <div className="glass-card p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-neon-green/10 flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="w-7 h-7 text-neon-green" />
                </div>
                <h3 className="font-bold text-base mb-1">غرف الدراسة النشطة</h3>
                <p className="text-xs text-muted-foreground">قريباً - غرف دراسة صوتية مباشرة للنقاش التعليمي</p>
              </div>
            </motion.section>

            <motion.section variants={itemVariants} className="mt-4">
              <div className="glass-card p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
                  <Trophy className="w-7 h-7 text-amber-400" />
                </div>
                <h3 className="font-bold text-base mb-1">المسابقات المباشرة</h3>
                <p className="text-xs text-muted-foreground">قريباً - مسابقات طبية مباشرة مع جوائز</p>
              </div>
            </motion.section>
          </motion.main>
        </div>
      </div>
    </motion.div>
  )
}
