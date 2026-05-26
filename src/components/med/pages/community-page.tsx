'use client'

import { useState, useMemo } from 'react'
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
  Mic,
  MicOff,
  Trophy,
  Zap,
  Flame,
  Star,
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
  Radio,
  Crown,
  ChevronLeft,
  Volume2,
  UserPlus,
  Sparkles,
  TrendingUp,
  MessageSquare,
  Circle,
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────

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
}

interface StudyRoom {
  id: string
  name: string
  subject: string
  subjectIcon: React.ReactNode
  participants: number
  maxParticipants: number
  isVoice: boolean
  isActive: boolean
}

interface LiveCompetition {
  id: string
  name: string
  timeRemaining: number
  participants: number
  prize: number
  category: string
}

// ─── Sample Data ────────────────────────────────────────────

const SAMPLE_POSTS: Post[] = [
  {
    id: '1',
    author: 'د. سارة الأحمد',
    authorAvatar: 'س',
    authorRank: 'أخصائي',
    authorRankColor: 'text-neon-purple',
    content: 'مريض عمره 55 سنة حضر بألم صدري حاد وضيق تنفس. ECG أظهر ارتفاع ST في الأطراف II، III، aVF. ما هو التشخيص الأرجح وما هي الخطوة التالية؟ 🫀\n\nشاركوا تحليلاتكم!',
    category: 'cardiology',
    tags: ['أمراض القلب', 'ECG', 'STEMI'],
    likes: 45,
    comments: 23,
    shares: 8,
    timestamp: Date.now() - 15 * 60 * 1000,
    isLiked: false,
  },
  {
    id: '2',
    author: 'د. محمد العلي',
    authorAvatar: 'م',
    authorRank: 'جراح',
    authorRankColor: 'text-amber-400',
    content: '📋 نصيحة للزملاء في طب الطوارئ:\n\nعند التعامل مع مريض رضح متعدد، لا تنسَ قاعدة ABCDE:\n- Airway: تأكد من المجرى الهوائي\n- Breathing: تحقق من التنفس\n- Circulation: افحص الدورة الدموية\n- Disability: قيّم العجز العصبي\n- Exposure: كشف كامل\n\nسلامتكم أولاً! 🚑',
    category: 'emergency',
    tags: ['طوارئ', 'رضح', 'ABCDE'],
    likes: 89,
    comments: 34,
    shares: 45,
    timestamp: Date.now() - 45 * 60 * 1000,
    isLiked: true,
  },
  {
    id: '3',
    author: 'د. ريم الدوسري',
    authorAvatar: 'ر',
    authorRank: 'طبيب مقيم',
    authorRankColor: 'text-neon-cyan',
    content: '💊 خطأ شائع: إعطاء الأدرينالين وريدياً في صدمة التأقية بدلاً من عضلياً!\n\nالجرعة الصحيحة: 0.3-0.5 ملغ عضلياً في الفخذ الخارجي. الإعطاء الوريدي قد يسبب اضطرابات نظم قلبية خطيرة.\n\nدائماً تأكدوا من طريق الإعطاء! ⚡',
    category: 'pharmacology',
    tags: ['أدوية', 'أدرينالين', 'صدمة تحسسية'],
    likes: 67,
    comments: 19,
    shares: 32,
    timestamp: Date.now() - 2 * 3600 * 1000,
    isLiked: false,
  },
  {
    id: '4',
    author: 'د. خالد المنصور',
    authorAvatar: 'خ',
    authorRank: 'أخصائي',
    authorRankColor: 'text-neon-purple',
    content: '🧠 حالة سريرية مثيرة:\n\nمريض 68 سنة حضر بضعف مفاجئ في الجهة اليسرى وصعوبة في الكلام منذ 45 دقيقة. الضغط 180/110. GCS 14.\n\nما هي خطوتك الأولى؟ هل تعطي tPA؟ ما هي معايير الاستبعاد؟\n\nشاركوا أراءكم! 👇',
    category: 'neurology',
    tags: ['أعصاب', 'سكتة دماغية', 'tPA'],
    likes: 56,
    comments: 41,
    shares: 15,
    timestamp: Date.now() - 3 * 3600 * 1000,
    isLiked: false,
  },
  {
    id: '5',
    author: 'د. نورة الحربي',
    authorAvatar: 'ن',
    authorRank: 'طبيب مقيم',
    authorRankColor: 'text-neon-cyan',
    content: '👶 نصائح لفحص حديثي الولادة:\n\n1. افحص الـ APGAR عند الدقيقة 1 و 5\n2. تأكد من وجود جميع المنعكسات البدئية\n3. افحص الوركين (Ortolani & Barlow)\n4. تأكد من التجويف الفموي\n5. افحص العجان والظهر\n\nلا تتخطى أي خطوة! كل فحص قد ينقذ حياة 💚',
    category: 'pediatrics',
    tags: ['أطفال', 'حديثي الولادة', 'فحص سريري'],
    likes: 73,
    comments: 12,
    shares: 28,
    timestamp: Date.now() - 5 * 3600 * 1000,
    isLiked: true,
  },
]

const STUDY_ROOMS: StudyRoom[] = [
  {
    id: '1',
    name: 'غرفة مراجعة الطب الباطني',
    subject: 'باطني',
    subjectIcon: <Stethoscope className="h-4 w-4 text-neon-orange" />,
    participants: 8,
    maxParticipants: 15,
    isVoice: true,
    isActive: true,
  },
  {
    id: '2',
    name: 'نقاش حالات الطوارئ',
    subject: 'طوارئ',
    subjectIcon: <Siren className="h-4 w-4 text-red-400" />,
    participants: 12,
    maxParticipants: 20,
    isVoice: true,
    isActive: true,
  },
  {
    id: '3',
    name: 'مراجعة الأدوية - الامتحان النهائي',
    subject: 'أدوية',
    subjectIcon: <Pill className="h-4 w-4 text-neon-purple" />,
    participants: 5,
    maxParticipants: 10,
    isVoice: false,
    isActive: true,
  },
  {
    id: '4',
    name: 'تشريح الأعصاب القحفية',
    subject: 'أعصاب',
    subjectIcon: <Brain className="h-4 w-4 text-neon-purple" />,
    participants: 3,
    maxParticipants: 8,
    isVoice: true,
    isActive: false,
  },
]

const LIVE_COMPETITIONS: LiveCompetition[] = [
  {
    id: '1',
    name: 'بطولة طب الطوارئ الكبرى',
    timeRemaining: 1800,
    participants: 156,
    prize: 500,
    category: 'emergency',
  },
  {
    id: '2',
    name: 'تحدي القلب والأوعية',
    timeRemaining: 3600,
    participants: 89,
    prize: 300,
    category: 'cardiology',
  },
]

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  emergency: <Siren className="h-4 w-4 text-red-400" />,
  cardiology: <HeartPulse className="h-4 w-4 text-pink-400" />,
  neurology: <Brain className="h-4 w-4 text-neon-purple" />,
  pediatrics: <Baby className="h-4 w-4 text-neon-green" />,
  surgery: <Scissors className="h-4 w-4 text-neon-blue" />,
  internal: <Stethoscope className="h-4 w-4 text-neon-orange" />,
  radiology: <ScanLine className="h-4 w-4 text-neon-cyan" />,
  pharmacology: <Pill className="h-4 w-4 text-neon-purple" />,
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

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  MAIN COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function CommunityPage() {
  const { communityGroups, user } = useAppStore()

  // ─── State ─────────────────────────────────────────────
  const [activeGroupId, setActiveGroupId] = useState(communityGroups[0]?.id ?? '1')
  const [posts, setPosts] = useState<Post[]>(SAMPLE_POSTS)
  const [newPostTitle, setNewPostTitle] = useState('')
  const [newPostContent, setNewPostContent] = useState('')
  const [newPostCategory, setNewPostCategory] = useState('general')
  const [newPostTags, setNewPostTags] = useState('')
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [mobileTab, setMobileTab] = useState<'feed' | 'groups'>('feed')

  // ─── Active Group ──────────────────────────────────────
  const activeGroup = useMemo(
    () => communityGroups.find((g) => g.id === activeGroupId) ?? communityGroups[0],
    [communityGroups, activeGroupId]
  )

  // ─── Create Post Handler ───────────────────────────────
  const handleCreatePost = () => {
    if (!newPostContent.trim()) return

    const newPost: Post = {
      id: `post-${Date.now()}`,
      author: user.name,
      authorAvatar: user.name.charAt(user.name.indexOf('.') + 2) || user.name.charAt(0),
      authorRank: user.rankTitle,
      authorRankColor: 'text-neon-cyan',
      content: newPostContent.trim(),
      category: newPostCategory,
      tags: newPostTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      likes: 0,
      comments: 0,
      shares: 0,
      timestamp: Date.now(),
      isLiked: false,
    }

    setPosts([newPost, ...posts])
    setNewPostContent('')
    setNewPostTitle('')
    setNewPostTags('')
    setShowCreatePost(false)
  }

  // ─── Like Handler ──────────────────────────────────────
  const handleLike = (postId: string) => {
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

            {/* Online indicator */}
            <div className="hidden sm:flex items-center gap-2 rounded-full bg-neon-green/10 px-3 py-1.5 border border-neon-green/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-green" />
              </span>
              <span className="text-xs font-semibold text-neon-green">1,247 متصل</span>
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
                    {communityGroups.map((group) => {
                      const isActive = activeGroupId === group.id
                      return (
                        <motion.button
                          key={group.id}
                          whileHover={{ x: -3 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setActiveGroupId(group.id)}
                          className={`w-full rounded-xl p-3 flex items-center gap-3 transition-all text-right ${
                            isActive
                              ? 'bg-neon-purple/10 border border-neon-purple/30 neon-glow'
                              : 'hover:bg-white/5 border border-transparent'
                          }`}
                          style={
                            isActive
                              ? { boxShadow: '0 0 20px rgba(139,92,246,0.15)' }
                              : {}
                          }
                        >
                          <div className="text-xl shrink-0">{group.icon}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold truncate">{group.nameAr}</span>
                              {group.unread > 0 && (
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-neon-purple text-[10px] font-bold text-white shrink-0">
                                  {group.unread}
                                </span>
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
                    })}
                  </div>
                </ScrollArea>
              </div>

              {/* Study Rooms */}
              <div className="glass-card p-4">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-neon-green" />
                  غرف الدراسة
                </h3>
                <div className="space-y-2">
                  {STUDY_ROOMS.slice(0, 3).map((room) => (
                    <motion.div
                      key={room.id}
                      whileHover={{ scale: 1.02 }}
                      className="rounded-xl bg-white/3 border border-white/5 p-3"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        {room.subjectIcon}
                        <span className="text-xs font-semibold truncate flex-1">{room.name}</span>
                        {room.isVoice && room.isActive && (
                          <div className="flex items-center gap-0.5">
                            {[0, 1, 2].map((i) => (
                              <motion.div
                                key={i}
                                className="w-1 rounded-full bg-neon-green"
                                animate={{ height: [4, 10, 4] }}
                                transition={{
                                  repeat: Infinity,
                                  duration: 0.6,
                                  delay: i * 0.15,
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {room.participants}/{room.maxParticipants}
                        </span>
                        <Button
                          size="sm"
                          className="h-6 text-[10px] px-2 bg-neon-green/10 text-neon-green border border-neon-green/30 hover:bg-neon-green/20"
                        >
                          انضمام
                        </Button>
                      </div>
                    </motion.div>
                  ))}
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
                {communityGroups.map((group) => {
                  const isActive = activeGroupId === group.id
                  return (
                    <motion.button
                      key={group.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setActiveGroupId(group.id)
                        setMobileTab('feed')
                      }}
                      className={`w-full glass-card p-4 flex items-center gap-3 text-right ${
                        isActive ? 'border-neon-purple/30' : ''
                      }`}
                      style={isActive ? { boxShadow: '0 0 20px rgba(139,92,246,0.15)' } : {}}
                    >
                      <div className="text-2xl">{group.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold truncate">{group.nameAr}</span>
                          {group.unread > 0 && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-neon-purple text-[10px] font-bold text-white">
                              {group.unread}
                            </span>
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

                {/* Mobile Study Rooms */}
                <div className="glass-card p-4 mt-4">
                  <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-neon-green" />
                    غرف الدراسة
                  </h3>
                  <div className="space-y-2">
                    {STUDY_ROOMS.map((room) => (
                      <div key={room.id} className="rounded-xl bg-white/3 border border-white/5 p-3">
                        <div className="flex items-center gap-2 mb-1.5">
                          {room.subjectIcon}
                          <span className="text-xs font-semibold truncate flex-1">{room.name}</span>
                          {room.isVoice && room.isActive && (
                            <div className="flex items-center gap-0.5">
                              {[0, 1, 2].map((i) => (
                                <motion.div
                                  key={i}
                                  className="w-1 rounded-full bg-neon-green"
                                  animate={{ height: [4, 10, 4] }}
                                  transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {room.participants}/{room.maxParticipants}
                          </span>
                          <Button
                            size="sm"
                            className="h-6 text-[10px] px-2 bg-neon-green/10 text-neon-green border border-neon-green/30 hover:bg-neon-green/20"
                          >
                            انضمام
                          </Button>
                        </div>
                      </div>
                    ))}
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
                <span className="text-2xl">{activeGroup?.icon}</span>
                <div className="flex-1">
                  <h2 className="font-bold text-lg">{activeGroup?.nameAr}</h2>
                  <p className="text-xs text-muted-foreground">
                    {activeGroup?.members.toLocaleString('ar-EG')} عضو · {activeGroup?.unread} منشور جديد
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="h-8 text-xs bg-neon-purple/10 text-neon-purple border border-neon-purple/30 hover:bg-neon-purple/20"
                  >
                    <UserPlus className="h-3.5 w-3.5 ml-1" />
                    انضمام
                  </Button>
                </div>
              </div>
            </div>

            {/* Create Post Button / FAB */}
            <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
              <DialogTrigger asChild>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <div className="glass-card p-4 flex items-center gap-3 cursor-pointer hover:border-neon-cyan/20 transition-all">
                    <Avatar className="h-10 w-10 border border-neon-cyan/20">
                      <AvatarFallback className="bg-neon-cyan/15 text-neon-cyan text-sm font-bold">
                        {user.name.charAt(user.name.indexOf('.') + 2) || user.name.charAt(0)}
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

              <DialogContent className="glass-strong border-neon-cyan/15 max-w-lg" dir="rtl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 neon-text">
                    <Sparkles className="h-5 w-5 text-neon-cyan" />
                    إنشاء منشور جديد
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 mt-2">
                  {/* Author info */}
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-neon-cyan/20">
                      <AvatarFallback className="bg-neon-cyan/15 text-neon-cyan text-sm font-bold">
                        {user.name.charAt(user.name.indexOf('.') + 2) || user.name.charAt(0)}
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
                    className="min-h-[120px] bg-white/5 border-white/10 focus:border-neon-cyan/30 resize-none text-sm"
                    dir="rtl"
                  />

                  {/* Category */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">التخصص</label>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(CATEGORY_LABELS).slice(0, 6).map(([key, label]) => (
                        <button
                          key={key}
                          onClick={() => setNewPostCategory(key)}
                          className={`rounded-lg px-3 py-1.5 text-xs border transition-all flex items-center gap-1.5 ${
                            newPostCategory === key
                              ? 'bg-neon-cyan/15 border-neon-cyan/30 text-neon-cyan'
                              : 'bg-white/5 border-white/10 text-muted-foreground hover:border-white/20'
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
                      className="bg-white/5 border-white/10 focus:border-neon-cyan/30 text-sm"
                      dir="rtl"
                    />
                  </div>

                  {/* Submit */}
                  <Button
                    onClick={handleCreatePost}
                    disabled={!newPostContent.trim()}
                    className="w-full h-11 bg-gradient-to-l from-neon-cyan to-neon-blue text-white font-bold hover:opacity-90 rounded-xl neon-glow disabled:opacity-40"
                  >
                    <Send className="h-4 w-4 ml-2" />
                    نشر المنشور
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Posts Feed */}
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
                    <Avatar className="h-10 w-10 border border-white/10">
                      <AvatarFallback className="bg-neon-purple/15 text-neon-purple text-sm font-bold">
                        {post.authorAvatar}
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

                  <Separator className="bg-white/5 mb-3" />

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                        post.isLiked
                          ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20'
                          : 'bg-white/3 text-muted-foreground border border-transparent hover:bg-white/5 hover:text-pink-400'
                      }`}
                    >
                      <Heart className={`h-3.5 w-3.5 ${post.isLiked ? 'fill-pink-400' : ''}`} />
                      <span>{post.likes}</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-white/3 text-muted-foreground border border-transparent hover:bg-white/5 hover:text-neon-cyan transition-all"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>{post.comments}</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-white/3 text-muted-foreground border border-transparent hover:bg-white/5 hover:text-neon-green transition-all"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      <span>{post.shares}</span>
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* ═══════════════════════════════════════════════════
                STUDY ROOMS SECTION
            ═══════════════════════════════════════════════════ */}
            <motion.section variants={itemVariants} className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-neon-green" />
                  غرف الدراسة النشطة
                </h3>
                <button className="text-xs text-neon-cyan hover:underline flex items-center gap-1">
                  الكل <ChevronLeft className="h-3 w-3" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {STUDY_ROOMS.map((room, i) => (
                  <motion.div
                    key={room.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="glass-card p-4"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="rounded-lg bg-white/5 p-2 border border-white/10">
                        {room.subjectIcon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold truncate">{room.name}</h4>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-0.5">
                            <Users className="h-3 w-3" />
                            {room.participants}/{room.maxParticipants}
                          </span>
                          {room.isVoice && (
                            <span className="flex items-center gap-0.5 text-neon-green">
                              <Volume2 className="h-3 w-3" />
                              صوتي
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Voice indicator */}
                      {room.isVoice && room.isActive && (
                        <div className="flex items-center gap-0.5 bg-neon-green/10 rounded-lg px-2 py-1 border border-neon-green/20">
                          {[0, 1, 2].map((j) => (
                            <motion.div
                              key={j}
                              className="w-1 rounded-full bg-neon-green"
                              animate={{ height: [4, 10, 4] }}
                              transition={{
                                repeat: Infinity,
                                duration: 0.6,
                                delay: j * 0.15,
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          room.isActive
                            ? 'bg-neon-green/10 text-neon-green border-neon-green/20'
                            : 'bg-white/5 text-muted-foreground border-white/10'
                        }`}
                      >
                        {room.isActive ? '● نشطة' : 'غير نشطة'}
                      </Badge>
                      <Button
                        size="sm"
                        className={`h-7 text-[10px] px-3 ${
                          room.isActive
                            ? 'bg-neon-green/10 text-neon-green border border-neon-green/30 hover:bg-neon-green/20'
                            : 'bg-white/5 text-muted-foreground border border-white/10 hover:bg-white/10'
                        }`}
                      >
                        انضمام
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>

            {/* ═══════════════════════════════════════════════════
                LIVE COMPETITIONS
            ═══════════════════════════════════════════════════ */}
            <motion.section variants={itemVariants} className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-400" />
                  المسابقات المباشرة
                  <span className="relative flex h-2.5 w-2.5 mr-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                  </span>
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {LIVE_COMPETITIONS.map((comp, i) => (
                  <motion.div
                    key={comp.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    whileHover={{ scale: 1.02 }}
                    className="glass-card gradient-border p-4 relative overflow-hidden"
                  >
                    {/* Background glow */}
                    <div className="absolute inset-0 bg-gradient-to-bl from-amber-500/5 via-transparent to-transparent" />

                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="rounded-lg bg-amber-500/10 p-1.5 border border-amber-500/20">
                          <Trophy className="h-4 w-4 text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold truncate">{comp.name}</h4>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            {CATEGORY_ICONS[comp.category]}
                            {CATEGORY_LABELS[comp.category] ?? 'عام'}
                          </span>
                        </div>
                        {/* Live badge */}
                        <div className="flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 border border-red-500/25">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
                          </span>
                          <span className="text-[9px] font-bold text-red-400">LIVE</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mb-3 text-xs">
                        <span className="flex items-center gap-1 text-amber-400">
                          <Clock className="h-3 w-3" />
                          متبقي {formatTime(comp.timeRemaining)}
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Users className="h-3 w-3" />
                          {comp.participants} مشارك
                        </span>
                        <span className="flex items-center gap-1 text-neon-cyan">
                          <Zap className="h-3 w-3" />
                          {comp.prize} XP
                        </span>
                      </div>

                      <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                        <Button className="w-full h-9 bg-gradient-to-l from-amber-500 to-amber-600 text-white font-bold text-xs hover:opacity-90 rounded-lg relative overflow-hidden">
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-l from-white/20 to-transparent"
                            animate={{ x: ['-100%', '200%'] }}
                            transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                          />
                          <span className="relative z-10 flex items-center gap-1.5">
                            <Flame className="h-3.5 w-3.5" />
                            انضم الآن
                          </span>
                        </Button>
                      </motion.div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          </motion.main>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          FLOATING ACTION BUTTON (Mobile Create Post)
      ═══════════════════════════════════════════════════ */}
      <motion.div
        className="fixed bottom-24 left-6 z-40 sm:hidden"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: 'spring' }}
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowCreatePost(true)}
          className="h-14 w-14 rounded-full bg-gradient-to-bl from-neon-cyan to-neon-blue flex items-center justify-center shadow-lg neon-glow-strong"
        >
          <Plus className="h-6 w-6 text-white" />
        </motion.button>
      </motion.div>
    </motion.div>
  )
}
