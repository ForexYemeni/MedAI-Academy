'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/app-store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Check, X, Crown, Sparkles, Shield, Clock, CreditCard,
  Zap, Brain, BookOpen, Download, Award, FlaskConical,
  ClipboardList, Radio, BarChart3, Upload, Users,
  TrendingUp, Headphones, Star, ChevronDown, Lock,
  MessageSquare, Wifi, Volume2, HeartPulse
} from 'lucide-react'

// ─── Animation Variants ─────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

// ─── Plans Data ─────────────────────────────────────────────

const PLANS = [
  {
    id: 'free' as const,
    name: 'مجاني',
    nameEn: 'Free',
    price: 0,
    priceLabel: '$0',
    period: '',
    accent: 'neon-blue',
    accentColor: '#0088ff',
    borderColor: 'border-neon-blue/20',
    bgAccent: 'bg-neon-blue/10',
    textAccent: 'text-neon-blue',
    glowAccent: 'shadow-[0_0_30px_rgba(0,136,255,0.15)]',
    gradientAccent: 'from-neon-blue/20 to-neon-blue/5',
    buttonStyle: 'bg-neon-blue/10 text-neon-blue border border-neon-blue/30 hover:bg-neon-blue/20',
    recommended: false,
    features: [
      { label: 'محتوى محدود', icon: <BookOpen className="w-4 h-4" />, included: true },
      { label: 'اختبارات يومية', icon: <ClipboardList className="w-4 h-4" />, included: true },
      { label: 'AI محدود (5 رسائل/يوم)', icon: <Brain className="w-4 h-4" />, included: true },
    ],
    notIncluded: [
      'تحميل أوفلاين',
      'شهادات معتمدة',
      'محاكاة كاملة',
      'بنك أسئلة شامل',
      'Live Sessions',
      'تحليلات متقدمة',
    ],
  },
  {
    id: 'premium' as const,
    name: 'مميز',
    nameEn: 'Premium',
    price: 9.99,
    priceLabel: '$9.99',
    period: '/شهر',
    accent: 'neon-cyan',
    accentColor: '#00f5ff',
    borderColor: 'border-neon-cyan/30',
    bgAccent: 'bg-neon-cyan/10',
    textAccent: 'text-neon-cyan',
    glowAccent: 'shadow-[0_0_40px_rgba(0,245,255,0.2)]',
    gradientAccent: 'from-neon-cyan/25 via-neon-purple/15 to-neon-pink/10',
    buttonStyle: 'bg-gradient-to-l from-neon-cyan to-cyan-400 text-med-dark font-bold hover:shadow-[0_0_30px_rgba(0,245,255,0.4)]',
    recommended: true,
    features: [
      { label: 'AI غير محدود', icon: <Brain className="w-4 h-4" />, included: true },
      { label: 'تحميل أوفلاين', icon: <Download className="w-4 h-4" />, included: true },
      { label: 'شهادات معتمدة', icon: <Award className="w-4 h-4" />, included: true },
      { label: 'محاكاة كاملة', icon: <FlaskConical className="w-4 h-4" />, included: true },
      { label: 'بنك أسئلة شامل', icon: <ClipboardList className="w-4 h-4" />, included: true },
      { label: 'Live Sessions', icon: <Radio className="w-4 h-4" />, included: true },
      { label: 'تحليلات متقدمة', icon: <BarChart3 className="w-4 h-4" />, included: true },
      { label: 'بدون إعلانات', icon: <Volume2 className="w-4 h-4" />, included: true },
    ],
    notIncluded: [],
  },
  {
    id: 'instructor' as const,
    name: 'مدرب',
    nameEn: 'Instructor',
    price: 29.99,
    priceLabel: '$29.99',
    period: '/شهر',
    accent: 'amber',
    accentColor: '#f59e0b',
    borderColor: 'border-amber-400/30',
    bgAccent: 'bg-amber-400/10',
    textAccent: 'text-amber-400',
    glowAccent: 'shadow-[0_0_30px_rgba(245,158,11,0.15)]',
    gradientAccent: 'from-amber-400/20 to-amber-600/5',
    buttonStyle: 'bg-gradient-to-l from-amber-400 to-amber-500 text-med-dark font-bold hover:shadow-[0_0_30px_rgba(245,158,11,0.4)]',
    recommended: false,
    features: [
      { label: 'كل مميزات Premium', icon: <Crown className="w-4 h-4" />, included: true },
      { label: 'رفع الدورات', icon: <Upload className="w-4 h-4" />, included: true },
      { label: 'إدارة الطلاب', icon: <Users className="w-4 h-4" />, included: true },
      { label: 'إحصائيات متقدمة', icon: <TrendingUp className="w-4 h-4" />, included: true },
      { label: 'أرباح 80%', icon: <CreditCard className="w-4 h-4" />, included: true },
      { label: 'دعم خاص', icon: <Headphones className="w-4 h-4" />, included: true },
    ],
    notIncluded: [],
  },
]

// ─── Comparison Data ────────────────────────────────────────

const COMPARISON_FEATURES = [
  { label: 'المحتوى التعليمي', free: 'محدود', premium: 'كامل', instructor: 'كامل + رفع' },
  { label: 'المساعد الذكي AI', free: '5 رسائل/يوم', premium: 'غير محدود', instructor: 'غير محدود' },
  { label: 'الاختبارات', free: 'يومية فقط', premium: 'بنك أسئلة شامل', instructor: 'بنك أسئلة شامل' },
  { label: 'المحاكاة الطبية', free: '❌', premium: '✅ كاملة', instructor: '✅ كاملة' },
  { label: 'تحميل أوفلاين', free: '❌', premium: '✅', instructor: '✅' },
  { label: 'شهادات معتمدة', free: '❌', premium: '✅', instructor: '✅' },
  { label: 'Live Sessions', free: '❌', premium: '✅', instructor: '✅' },
  { label: 'بدون إعلانات', free: '❌', premium: '✅', instructor: '✅' },
  { label: 'تحليلات متقدمة', free: '❌', premium: '✅', instructor: '✅ متقدمة' },
  { label: 'رفع الدورات', free: '❌', premium: '❌', instructor: '✅' },
  { label: 'إدارة الطلاب', free: '❌', premium: '❌', instructor: '✅' },
  { label: 'نسبة الأرباح', free: '—', premium: '—', instructor: '80%' },
]

// ─── FAQ Data ───────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    question: 'هل يمكنني إلغاء الاشتراك في أي وقت؟',
    answer: 'نعم بالتأكيد! يمكنك إلغاء اشتراكك في أي وقت بدون أي رسوم إضافية. سيستمر وصولك إلى المحتوى حتى نهاية فترة الاشتراك المدفوعة.',
  },
  {
    question: 'ما هو ضمان 7 أيام؟',
    answer: 'نقدم ضمان استرداد كامل خلال 7 أيام من تاريخ الاشتراك. إذا لم تكن راضياً عن الخدمة، يمكنك طلب استرداد كامل المبلغ بدون أسئلة.',
  },
  {
    question: 'كيف تتم عملية الدفع؟',
    answer: 'نستخدم بوابات دفع مشفرة وآمنة بالكامل. نقبل بطاقات الائتمان والخصم (Visa, Mastercard) بالإضافة إلى Apple Pay و Google Pay. جميع المعاملات مشفرة بتقنية SSL.',
  },
  {
    question: 'هل يمكنني الترقية أو التنزيل بين الخطط؟',
    answer: 'نعم! يمكنك الترقية في أي وقت وسيتم احتساب الفرق بشكل تناسبي. أما التنزيل فيسري من بداية الدورة التالية.',
  },
  {
    question: 'ما الفرق بين خطة مميز وخطة المدرب؟',
    answer: 'خطة مميز مخصصة للطلاب الذين يريدون الوصول الكامل لجميع المحتوى والميزات. خطة المدرب تتضمن كل مميزات Premium بالإضافة إلى إمكانية رفع الدورات وإنشاء محتوى وإدارة الطلاب مع نسبة أرباح 80%.',
  },
  {
    question: 'هل المحتوى متوفر باللغة العربية؟',
    answer: 'نعم! جميع المحتوى التعليمي متوفر باللغة العربية مع دعم كامل للواجهة العربية. بعض الدورات المتقدمة قد تتضمن مصطلحات باللغة الإنجليزية حسب التخصص الطبي.',
  },
]

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  MAIN COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function SubscriptionPage() {
  const { user } = useAppStore()
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')

  const currentPlan = user.subscription

  return (
    <motion.div
      dir="rtl"
      className="min-h-screen w-full pb-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="mx-auto max-w-5xl space-y-8 px-4 sm:px-6">

        {/* ═══════════════════════════════════════════════════
            1. HEADER
        ═══════════════════════════════════════════════════ */}
        <motion.section variants={itemVariants} className="text-center py-8 sm:py-12 relative">
          {/* Background decoration */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-neon-cyan/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-neon-purple/5 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 border border-neon-cyan/20 flex items-center justify-center mx-auto mb-5"
            >
              <Crown className="w-8 h-8 text-amber-400" />
            </motion.div>
            <h1 className="text-3xl sm:text-4xl font-black mb-3">
              <span className="bg-gradient-to-l from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent">
                اختر خطتك المثالية
              </span>
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">
              ابدأ رحلتك التعليمية الطبية اليوم — خطط تناسب جميع الاحتياجات
            </p>

            {/* Billing toggle */}
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  billingPeriod === 'monthly'
                    ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                شهري
              </button>
              <button
                onClick={() => setBillingPeriod('yearly')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all relative ${
                  billingPeriod === 'yearly'
                    ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                سنوي
                <span className="absolute -top-2 -left-2 text-[9px] bg-neon-green/20 text-neon-green border border-neon-green/30 px-1.5 py-0.5 rounded-full">
                  وفّر 20%
                </span>
              </button>
            </div>
          </div>
        </motion.section>

        {/* ═══════════════════════════════════════════════════
            2. PLAN CARDS
        ═══════════════════════════════════════════════════ */}
        <motion.section variants={itemVariants}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
            {PLANS.map((plan, i) => {
              const isCurrentPlan = currentPlan === plan.id
              const displayPrice = billingPeriod === 'yearly' && plan.price > 0
                ? `$${(plan.price * 12 * 0.8).toFixed(2)}`
                : plan.priceLabel
              const displayPeriod = billingPeriod === 'yearly' && plan.price > 0
                ? '/سنة'
                : plan.period

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.12 }}
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                  className={`
                    relative glass-card p-5 sm:p-6 flex flex-col
                    ${plan.recommended ? `gradient-border ${plan.glowAccent}` : ''}
                    ${isCurrentPlan ? 'ring-1 ring-neon-green/30' : ''}
                  `}
                >
                  {/* Recommended badge */}
                  {plan.recommended && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                      <div className="flex items-center gap-1 rounded-full bg-gradient-to-l from-neon-cyan to-neon-purple px-4 py-1 shadow-[0_0_20px_rgba(0,245,255,0.3)]">
                        <Sparkles className="w-3 h-3 text-white" />
                        <span className="text-xs font-bold text-white">الأكثر شعبية</span>
                      </div>
                    </div>
                  )}

                  {/* Current plan indicator */}
                  {isCurrentPlan && (
                    <div className="absolute -top-3 right-3 z-20">
                      <Badge className="text-[10px] bg-neon-green/20 text-neon-green border border-neon-green/30">
                        خطتك الحالية
                      </Badge>
                    </div>
                  )}

                  {/* Plan header */}
                  <div className="text-center mb-5 pt-2">
                    <div className={`w-12 h-12 rounded-xl ${plan.bgAccent} flex items-center justify-center mx-auto mb-3`}>
                      {plan.id === 'free' && <BookOpen className={`w-6 h-6 ${plan.textAccent}`} />}
                      {plan.id === 'premium' && <Crown className={`w-6 h-6 ${plan.textAccent}`} />}
                      {plan.id === 'instructor' && <Star className={`w-6 h-6 ${plan.textAccent}`} />}
                    </div>
                    <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                    <p className="text-xs text-muted-foreground">{plan.nameEn}</p>
                    <div className="mt-3">
                      <span className={`text-4xl font-black ${plan.textAccent}`} style={{ textShadow: `0 0 20px ${plan.accentColor}40` }}>
                        {displayPrice}
                      </span>
                      {displayPeriod && (
                        <span className="text-sm text-muted-foreground">{displayPeriod}</span>
                      )}
                    </div>
                  </div>

                  {/* Features list */}
                  <div className="flex-1 space-y-2.5 mb-6">
                    {plan.features.map((feature, fi) => (
                      <motion.div
                        key={fi}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 + fi * 0.05 }}
                        className="flex items-center gap-2.5"
                      >
                        <div className={`w-5 h-5 rounded-full ${plan.bgAccent} flex items-center justify-center shrink-0`}>
                          <Check className={`w-3 h-3 ${plan.textAccent}`} />
                        </div>
                        <span className="text-sm text-foreground/90">{feature.label}</span>
                      </motion.div>
                    ))}
                    {plan.notIncluded.map((feature, fi) => (
                      <div key={fi} className="flex items-center gap-2.5 opacity-40">
                        <div className="w-5 h-5 rounded-full bg-muted/30 flex items-center justify-center shrink-0">
                          <X className="w-3 h-3 text-muted-foreground" />
                        </div>
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <Button
                    className={`w-full h-11 text-sm font-bold rounded-xl ${plan.buttonStyle}`}
                    disabled={isCurrentPlan}
                  >
                    {isCurrentPlan ? 'الخطة الحالية ✓' : plan.id === 'free' ? 'ابدأ مجاناً' : 'اشترك الآن'}
                  </Button>
                </motion.div>
              )
            })}
          </div>
        </motion.section>

        {/* ═══════════════════════════════════════════════════
            3. COMPARISON TABLE
        ═══════════════════════════════════════════════════ */}
        <motion.section variants={itemVariants}>
          <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-center justify-center">
            <BarChart3 className="w-5 h-5 text-neon-purple" />
            مقارنة شاملة بين الخطط
          </h2>
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-right p-4 text-sm font-semibold text-muted-foreground">الميزة</th>
                    <th className="p-4 text-center">
                      <div className="text-sm font-bold text-neon-blue">مجاني</div>
                    </th>
                    <th className="p-4 text-center relative">
                      <div className="text-sm font-bold text-neon-cyan">مميز</div>
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-l from-neon-cyan to-neon-purple rounded-full" />
                    </th>
                    <th className="p-4 text-center">
                      <div className="text-sm font-bold text-amber-400">مدرب</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_FEATURES.map((feature, fi) => (
                    <motion.tr
                      key={fi}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: fi * 0.03 }}
                      className="border-b border-border hover:bg-muted/20 transition-colors"
                    >
                      <td className="p-3.5 text-sm text-foreground/80">{feature.label}</td>
                      <td className="p-3.5 text-center text-sm text-muted-foreground">{feature.free}</td>
                      <td className="p-3.5 text-center text-sm text-foreground/90 bg-neon-cyan/3">{feature.premium}</td>
                      <td className="p-3.5 text-center text-sm text-foreground/90">{feature.instructor}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.section>

        {/* ═══════════════════════════════════════════════════
            4. FAQ SECTION
        ═══════════════════════════════════════════════════ */}
        <motion.section variants={itemVariants}>
          <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-center justify-center">
            <MessageSquare className="w-5 h-5 text-neon-green" />
            الأسئلة الشائعة
          </h2>
          <div className="glass-card p-2 sm:p-3">
            <Accordion type="single" collapsible className="w-full">
              {FAQ_ITEMS.map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="border-b border-border last:border-0"
                >
                  <AccordionTrigger className="text-right hover:no-underline hover:bg-muted/20 px-4 py-3.5 transition-colors text-sm font-semibold text-foreground [&>svg]:mr-auto [&>svg]:ml-0">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </motion.section>

        {/* ═══════════════════════════════════════════════════
            5. TRUST BADGES
        ═══════════════════════════════════════════════════ */}
        <motion.section variants={itemVariants}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: <Shield className="w-6 h-6 text-neon-green" />, label: 'دفع آمن', desc: 'تشفير SSL بالكامل', bg: 'bg-neon-green/10', border: 'border-neon-green/20' },
              { icon: <Clock className="w-6 h-6 text-neon-cyan" />, label: 'إلغاء أي وقت', desc: 'بدون رسوم إضافية', bg: 'bg-neon-cyan/10', border: 'border-neon-cyan/20' },
              { icon: <HeartPulse className="w-6 h-6 text-neon-purple" />, label: 'ضمان 7 أيام', desc: 'استرداد كامل المبلغ', bg: 'bg-neon-purple/10', border: 'border-neon-purple/20' },
            ].map((trust, i) => (
              <motion.div
                key={trust.label}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`glass-card p-5 flex items-center gap-4 border ${trust.border}`}
              >
                <div className={`w-12 h-12 rounded-xl ${trust.bg} flex items-center justify-center shrink-0`}>
                  {trust.icon}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">{trust.label}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{trust.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ═══════════════════════════════════════════════════
            6. CTA SECTION
        ═══════════════════════════════════════════════════ */}
        <motion.section
          variants={itemVariants}
          className="relative overflow-hidden rounded-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-bl from-neon-cyan/15 via-neon-purple/10 to-neon-pink/15" />
          <div className="absolute top-0 left-0 w-48 h-48 bg-neon-cyan/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-neon-purple/10 rounded-full blur-3xl" />
          {/* ECG decoration */}
          <svg className="absolute bottom-0 left-0 w-full h-12 opacity-15" viewBox="0 0 600 30" preserveAspectRatio="none">
            <path d="M0,15 L80,15 L95,5 L110,25 L125,8 L140,22 L155,15 L250,15 L265,5 L280,25 L295,8 L310,22 L325,15 L420,15 L435,5 L450,25 L465,8 L480,22 L495,15 L600,15" stroke="#00f5ff" strokeWidth="1.5" fill="none" className="ecg-animate" />
          </svg>

          <div className="relative p-8 sm:p-10 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.3 }}
            >
              <Sparkles className="w-8 h-8 text-neon-cyan mx-auto mb-4" />
            </motion.div>
            <h2 className="text-2xl sm:text-3xl font-black neon-text mb-3">
              ابدأ رحلتك الطبية اليوم
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
              انضم لأكثر من 50,000 طالب وطبيب يثقون في أكاديمية نبض لتطوير مهاراتهم الطبية
            </p>
            <Button className="bg-gradient-to-l from-neon-cyan to-cyan-400 text-med-dark font-bold text-base h-12 px-8 rounded-xl hover:shadow-[0_0_30px_rgba(0,245,255,0.4)] transition-all">
              <Crown className="w-5 h-5 ml-2" />
              اشترك الآن في الخطة المميزة
            </Button>
          </div>
        </motion.section>

      </div>
    </motion.div>
  )
}
