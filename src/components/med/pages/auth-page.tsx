'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, Lock, User, Stethoscope, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAppStore, type Course } from '@/store/app-store'

type AuthMode = 'login' | 'register'

export default function AuthPage() {
  const { setIsLoggedIn, updateUser, setAuthToken } = useAppStore()
  const [mode, setMode] = useState<AuthMode>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [specialty, setSpecialty] = useState('')

  const loadAppData = async (token: string) => {
    try {
      // جلب الدورات من قاعدة البيانات
      const coursesRes = await fetch('/api/courses')
      if (coursesRes.ok) {
        const coursesData = await coursesRes.json()
        if (coursesData.courses?.length > 0) {
          const apiCourses: Course[] = coursesData.courses.map((c: Record<string, unknown>) => ({
            id: (c._id as string)?.toString() || (c.id as string),
            title: (c.title as string) || '',
            titleAr: (c.titleAr as string) || (c.title as string) || '',
            description: (c.description as string) || '',
            category: (c.category as string) || 'general',
            thumbnail: (c.thumbnail as string) || '',
            instructor: (c.instructorName as string) || (c.instructor as string) || '',
            rating: (c.rating as number) || 0,
            students: (c.students as number) || 0,
            duration: (c.duration as string) || '0 ساعة',
            level: (c.level as 'beginner' | 'intermediate' | 'advanced') || 'beginner',
            price: (c.price as number) || 0,
            isPremium: (c.isPremium as boolean) || false,
            lessons: (c.lessonsCount as number) || 0,
            tags: (c.tags as string[]) || [],
          }))
          useAppStore.setState({ courses: apiCourses })
        }
      }
    } catch {
      // silent fail
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (mode === 'register') {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, password, name, specialty }),
        })
        const data = await res.json()

        if (!res.ok) {
          setError(data.error)
          return
        }

        // Save token
        localStorage.setItem('medai-token', data.token)
        localStorage.setItem('medai-user', JSON.stringify(data.user))
        localStorage.setItem('medai-auth', 'true')
        
        // Update store with real data
        const apiUser = data.user
        updateUser({
          id: apiUser.id,
          name: apiUser.name,
          phone: apiUser.phone,
          xp: apiUser.xp || 0,
          coins: apiUser.coins || 0,
          medicalSpecialty: apiUser.medicalSpecialty || specialty,
          rankTitle: apiUser.role === 'admin' ? 'مدير النظام' : undefined,
          rankIcon: apiUser.role === 'admin' ? '👑' : undefined,
          subscription: apiUser.role === 'admin' ? 'premium' as const : 'free' as const,
          role: apiUser.role as 'admin' | 'user',
        })
        setAuthToken(data.token)
        setIsLoggedIn(true)
        
        // Load app data
        await loadAppData(data.token)
        
        setSuccess(data.message)
      } else {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, password }),
        })
        const data = await res.json()

        if (!res.ok) {
          setError(data.error)
          return
        }

        localStorage.setItem('medai-token', data.token)
        localStorage.setItem('medai-user', JSON.stringify(data.user))
        localStorage.setItem('medai-auth', 'true')
        
        // Update store with real data from API
        const apiUser = data.user
        updateUser({
          id: apiUser.id,
          name: apiUser.name,
          phone: apiUser.phone,
          xp: apiUser.xp || 0,
          coins: apiUser.coins || 0,
          level: apiUser.level || 1,
          streak: apiUser.streak || 0,
          maxStreak: apiUser.maxStreak || 0,
          medicalSpecialty: apiUser.medicalSpecialty || '',
          rankTitle: apiUser.role === 'admin' ? 'مدير النظام' : undefined,
          rankIcon: apiUser.role === 'admin' ? '👑' : undefined,
          subscription: apiUser.role === 'admin' ? 'premium' as const : (apiUser.subscription as 'free' | 'premium' | 'instructor') || 'free' as const,
          role: apiUser.role as 'admin' | 'user',
        })
        setAuthToken(data.token)
        
        // Check if admin must change password - ONLY from API response
        if (data.mustChangePassword === true) {
          localStorage.setItem('medai-must-change-password', 'true')
        } else {
          localStorage.removeItem('medai-must-change-password')
        }
        
        setIsLoggedIn(true)
        
        // Load courses etc
        await loadAppData(data.token)
        
        setSuccess(data.message)
      }
    } catch {
      setError('حدث خطأ في الاتصال بالخادم')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      dir="rtl"
      style={{
        backgroundColor: 'var(--background)',
        color: 'var(--foreground)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center"
            style={{
              backgroundColor: 'var(--primary)',
              boxShadow: '0 4px 20px rgba(0, 245, 255, 0.25)',
            }}
          >
            <Stethoscope className="w-10 h-10" style={{ color: '#ffffff' }} />
          </motion.div>
          <h1
            className="text-3xl font-bold"
            style={{ color: 'var(--primary)' }}
          >
            MedAI Academy
          </h1>
          <p className="mt-2" style={{ color: 'var(--muted-foreground)' }}>
            المنصة الطبية الذكية
          </p>
        </div>

        {/* Auth Card — solid background, no backdrop-filter dependency */}
        <div
          className="p-8 rounded-2xl"
          style={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
          }}
        >
          {/* Mode Toggle — solid background, no opacity modifiers */}
          <div
            className="flex gap-2 mb-6 p-1 rounded-xl"
            style={{
              backgroundColor: 'var(--muted)',
              border: '1px solid var(--border)',
            }}
          >
            <button
              onClick={() => { setMode('login'); setError(''); setSuccess('') }}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={
                mode === 'login'
                  ? {
                      backgroundColor: 'var(--primary)',
                      color: 'var(--primary-foreground)',
                      border: 'none',
                      boxShadow: '0 2px 8px rgba(0, 245, 255, 0.2)',
                    }
                  : {
                      backgroundColor: 'transparent',
                      color: 'var(--muted-foreground)',
                      border: 'none',
                    }
              }
            >
              تسجيل الدخول
            </button>
            <button
              onClick={() => { setMode('register'); setError(''); setSuccess('') }}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={
                mode === 'register'
                  ? {
                      backgroundColor: 'var(--primary)',
                      color: 'var(--primary-foreground)',
                      border: 'none',
                      boxShadow: '0 2px 8px rgba(0, 245, 255, 0.2)',
                    }
                  : {
                      backgroundColor: 'transparent',
                      color: 'var(--muted-foreground)',
                      border: 'none',
                    }
              }
            >
              حساب جديد
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.form
              key={mode}
              initial={{ opacity: 0, x: mode === 'login' ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: mode === 'login' ? 20 : -20 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {/* Error Message — solid background, no opacity modifiers */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 rounded-xl text-sm"
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#ef4444',
                  }}
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              {/* Success Message */}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 rounded-xl text-sm"
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#10b981',
                  }}
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{success}</span>
                </motion.div>
              )}

              {/* Name (Register Only) */}
              {mode === 'register' && (
                <div className="space-y-1.5">
                  <label className="text-sm" style={{ color: 'var(--foreground)' }}>
                    الاسم الكامل
                  </label>
                  <div className="relative">
                    <User
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4"
                      style={{ color: 'var(--muted-foreground)' }}
                    />
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="د. أحمد الخالدي"
                      className="pr-10 rounded-xl h-12"
                      style={{
                        backgroundColor: 'var(--input)',
                        border: '1px solid var(--border)',
                        color: 'var(--foreground)',
                      }}
                      required
                    />
                  </div>
                </div>
              )}

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-sm" style={{ color: 'var(--foreground)' }}>
                  رقم الهاتف
                </label>
                <div className="relative">
                  <Phone
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4"
                    style={{ color: 'var(--muted-foreground)' }}
                  />
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="777123456"
                    type="tel"
                    dir="ltr"
                    className="pr-10 text-left rounded-xl h-12"
                    style={{
                      backgroundColor: 'var(--input)',
                      border: '1px solid var(--border)',
                      color: 'var(--foreground)',
                    }}
                    required
                  />
                </div>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  أدخل الرقم بدون رمز الدولة أو معه
                </p>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-sm" style={{ color: 'var(--foreground)' }}>
                  كلمة السر
                </label>
                <div className="relative">
                  <Lock
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4"
                    style={{ color: 'var(--muted-foreground)' }}
                  />
                  <Input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pr-10 pl-10 rounded-xl h-12"
                    style={{
                      backgroundColor: 'var(--input)',
                      border: '1px solid var(--border)',
                      color: 'var(--foreground)',
                    }}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  6 أحرف على الأقل
                </p>
              </div>

              {/* Specialty (Register Only) */}
              {mode === 'register' && (
                <div className="space-y-1.5">
                  <label className="text-sm" style={{ color: 'var(--foreground)' }}>
                    التخصص الطبي (اختياري)
                  </label>
                  <div className="relative">
                    <Stethoscope
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4"
                      style={{ color: 'var(--muted-foreground)' }}
                    />
                    <Input
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      placeholder="طب الطوارئ، أمراض القلب..."
                      className="pr-10 rounded-xl h-12"
                      style={{
                        backgroundColor: 'var(--input)',
                        border: '1px solid var(--border)',
                        color: 'var(--foreground)',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Submit Button — solid background, no gradient */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 font-medium rounded-xl transition-all"
                style={{
                  backgroundColor: 'var(--primary)',
                  color: 'var(--primary-foreground)',
                  border: 'none',
                  boxShadow: '0 4px 16px rgba(0, 245, 255, 0.25)',
                }}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span className="flex items-center gap-2">
                    {mode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب'}
                    <ArrowRight className="w-4 h-4 rotate-180" />
                  </span>
                )}
              </Button>
            </motion.form>
          </AnimatePresence>

          {/* Footer */}
          <div
            className="mt-6 pt-4 text-center"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              بتسجيلك أنت توافق على{' '}
              <span style={{ color: 'var(--primary)', cursor: 'pointer' }}>شروط الاستخدام</span>
              {' '}و{' '}
              <span style={{ color: 'var(--primary)', cursor: 'pointer' }}>سياسة الخصوصية</span>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
