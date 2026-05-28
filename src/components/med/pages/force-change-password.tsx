'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Phone, Lock, Eye, EyeOff, ShieldAlert, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAppStore } from '@/store/app-store'

export default function ForceChangePassword() {
  const { setIsLoggedIn } = useAppStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [newPhone, setNewPhone] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!newPhone || newPhone.length < 8) {
      setError('رقم الهاتف الجديد مطلوب ويجب أن يكون 8 أرقام على الأقل')
      return
    }

    if (newPassword.length < 6) {
      setError('كلمة السر الجديدة يجب أن تكون 6 أحرف على الأقل')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('كلمة السر الجديدة غير متطابقة')
      return
    }

    if (newPassword === currentPassword) {
      setError('كلمة السر الجديدة يجب أن تكون مختلفة عن الحالية')
      return
    }

    setLoading(true)

    try {
      const token = localStorage.getItem('medai_token')
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          newPhone,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error)
        return
      }

      setSuccess(true)
      
      // مسح جميع بيانات الجلسة بما فيها flag تغيير كلمة المرور
      setTimeout(() => {
        localStorage.removeItem('medai_token')
        localStorage.removeItem('medai_user')
        localStorage.removeItem('medai_must_change_password')
        setIsLoggedIn(false)
      }, 3000)

    } catch {
      setError('حدث خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-4" dir="rtl">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">تم تغيير البيانات بنجاح! ✅</h2>
          <p className="text-muted-foreground mb-4">
            تم تغيير كلمة السر ورقم الهاتف بنجاح. بياناتك الجديدة آمنة ولن يتم كشفها لأي شخص.
          </p>
          <p className="text-sm text-amber-400">
            سيتم تسجيل خروجك الآن. سجّل دخولك بالبيانات الجديدة.
          </p>
          <motion.div 
            className="mt-4 h-1 rounded-full bg-[#1e293b] overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-green-500 to-cyan-500"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 3, ease: 'linear' }}
            />
          </motion.div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-4" dir="rtl">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Warning Header */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-500/20 flex items-center justify-center"
          >
            <ShieldAlert className="w-8 h-8 text-amber-400" />
          </motion.div>
          <h1 className="text-2xl font-bold text-amber-400">تغيير كلمة السر ورقم الهاتف إجباري</h1>
          <p className="text-sm text-muted-foreground mt-2">
            لحماية حسابك، يجب تغيير كلمة السر الافتراضية ورقم الهاتف عند أول دخول
          </p>
        </div>

        {/* Form Card */}
        <div className="glass-card p-6 space-y-4">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
            >
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Current Password */}
            <div className="space-y-1.5">
              <label className="text-sm text-muted-foreground">كلمة السر الحالية</label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  type={showCurrent ? 'text' : 'password'}
                  placeholder="كلمة السر الحالية"
                  className="pr-10 pl-10 bg-[#0a0e1a] border-med-border focus:border-amber-500 rounded-xl h-12"
                  required
                />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Phone */}
            <div className="space-y-1.5">
              <label className="text-sm text-muted-foreground">رقم الهاتف الجديد <span className="text-amber-400">(مطلوب)</span></label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  type="tel"
                  dir="ltr"
                  placeholder="777123456"
                  className="pr-10 text-left bg-[#0a0e1a] border-med-border focus:border-amber-500 rounded-xl h-12"
                  required
                />
              </div>
              <p className="text-xs text-amber-400/70">سيكون هذا رقمك الجديد الدائم لتسجيل الدخول</p>
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <label className="text-sm text-muted-foreground">كلمة السر الجديدة</label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  type={showNew ? 'text' : 'password'}
                  placeholder="6 أحرف على الأقل"
                  className="pr-10 pl-10 bg-[#0a0e1a] border-med-border focus:border-amber-500 rounded-xl h-12"
                  required
                  minLength={6}
                />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-sm text-muted-foreground">تأكيد كلمة السر الجديدة</label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="أعد كتابة كلمة السر الجديدة"
                  className="pr-10 pl-10 bg-[#0a0e1a] border-med-border focus:border-amber-500 rounded-xl h-12"
                  required
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-medium rounded-xl shadow-lg shadow-amber-500/25"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  تغيير البيانات والمتابعة
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </span>
              )}
            </Button>
          </form>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-amber-400/50">
            ⚠️ لن تتمكن من استخدام التطبيق حتى تغيّر كلمة السر ورقم الهاتف
          </p>
          <p className="text-xs text-red-400/50 mt-1">
            🔒 بياناتك الجديدة مشفرة ومحمية ولن يتم كشفها لأي شخص
          </p>
        </div>
      </motion.div>
    </div>
  )
}
