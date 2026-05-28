'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Lock, Crown, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PremiumLockProps {
  type?: 'course' | 'lesson' | 'feature'
  title?: string
  description?: string
  onSubscribe?: () => void
}

export default function PremiumLock({ 
  type = 'course', 
  title, 
  description,
  onSubscribe 
}: PremiumLockProps) {
  
  const content = {
    course: {
      title: title || 'هذه الدورة مدفوعة 👑',
      description: description || 'اشترك في الخطة المميزة للوصول إلى جميع الدورات والمحتوى الحصري',
      icon: '🎓',
    },
    lesson: {
      title: title || 'هذا الدرس للمشتركين فقط 🔒',
      description: description || 'هذا الدرس جزء من دورة مدفوعة. اشترك لمتابعة التعلم',
      icon: '📖',
    },
    feature: {
      title: title || 'ميزة مميزة 👑',
      description: description || 'هذه الميزة متاحة فقط للمشتركين في الخطة المميزة',
      icon: '⚡',
    },
  }

  const { title: t, description: d, icon } = content[type]

  return (
    <div className="relative">
      <div className="absolute inset-0 z-10 backdrop-blur-sm bg-background/60 rounded-2xl" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="absolute inset-0 z-20 flex items-center justify-center p-4"
      >
        <div className="glass-card p-8 text-center max-w-sm w-full neon-glow">
          <motion.div
            initial={{ y: -10 }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-amber-500/20 to-purple-600/20 border border-amber-500/30 flex items-center justify-center"
          >
            <span className="text-3xl">{icon}</span>
          </motion.div>

          <div className="flex items-center justify-center gap-2 mb-3">
            <Lock className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-amber-400 font-medium uppercase tracking-wider">محتوى مميز</span>
          </div>

          <h3 className="text-lg font-bold text-foreground mb-2">{t}</h3>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{d}</p>

          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {['دورات غير محدودة', 'AI بدون حدود', 'تحميل أوفلاين', 'شهادات معتمدة'].map((b) => (
              <span 
                key={b}
                className="text-[10px] px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400"
              >
                {b}
              </span>
            ))}
          </div>

          <Button
            onClick={onSubscribe || (() => window.location.href = '/subscription')}
            className="w-full h-11 bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-white font-medium rounded-xl shadow-lg shadow-amber-500/20 group"
          >
            <Crown className="w-4 h-4 ml-2 group-hover:scale-110 transition-transform" />
            اشترك الآن
            <Sparkles className="w-3 h-3 mr-1.5 opacity-60" />
          </Button>

          <p className="text-[10px] text-muted-foreground mt-3">بدءاً من 1,500 ر.ي/شهر • إلغاء أي وقت</p>
        </div>
      </motion.div>
    </div>
  )
}

export function PremiumBadge() {
  return (
    <div className="absolute top-3 left-3 z-10 flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/20 backdrop-blur-sm border border-amber-500/30">
      <Crown className="w-3 h-3 text-amber-400" />
      <span className="text-[10px] text-amber-400 font-medium">مميز</span>
    </div>
  )
}

export function LessonLock() {
  return (
    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20">
      <Lock className="w-3 h-3 text-amber-400" />
      <span className="text-[10px] text-amber-400">مدفوع</span>
    </div>
  )
}
