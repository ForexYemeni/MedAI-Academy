'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Upload, X, CreditCard, Wallet, Loader2, CheckCircle2, AlertCircle,
  Copy, Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { useAppStore } from '@/store/app-store'

interface PaymentMethod {
  _id: string
  walletName: string
  walletNumber: string
  walletOwnerName: string
  type: string
  active: boolean
}

interface PaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  courseId?: string
  courseName?: string
  amount?: number
}

// تنسيق المبلغ بالريال اليمني
function formatYER(amount: number): string {
  return `${amount.toLocaleString('ar-SA')} ر.ي`
}

export function PaymentDialog({ open, onOpenChange, courseId, courseName, amount }: PaymentDialogProps) {
  const { user } = useAppStore()
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [methodsLoading, setMethodsLoading] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const displayAmount = amount || 0

  // جلب طرق الدفع من API
  useEffect(() => {
    if (open) {
      fetchPaymentMethods()
    }
  }, [open])

  const fetchPaymentMethods = async () => {
    setMethodsLoading(true)
    try {
      const token = localStorage.getItem('medai_token')
      const res = await fetch('/api/admin/payment-methods', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (res.ok) {
        const data = await res.json()
        const methods = data.paymentMethods || []
        setPaymentMethods(methods)
        if (methods.length > 0) {
          setSelectedMethod(methods[0])
        }
      }
    } catch (err) {
      console.error('Failed to fetch payment methods:', err)
    } finally {
      setMethodsLoading(false)
    }
  }

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError('حجم الصورة يجب أن يكون أقل من 5 ميجابايت')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setScreenshot(reader.result as string)
      setError('')
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async () => {
    if (!screenshot) {
      setError('يرجى رفع لقطة شاشة الدفع')
      return
    }

    if (!selectedMethod) {
      setError('لا توجد طريقة دفع متاحة حالياً')
      return
    }

    if (!courseId) {
      setError('معرف الدورة مطلوب')
      return
    }

    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('medai_token')
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          plan: 'course',
          courseId,
          courseName,
          amount: displayAmount,
          screenshotData: screenshot,
          paymentMethodId: selectedMethod._id,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setSuccess(true)
      } else {
        setError(data.error || 'حدث خطأ في إرسال الطلب')
      }
    } catch {
      setError('حدث خطأ في الاتصال بالخادم')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setScreenshot(null)
    setSuccess(false)
    setError('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#111827] border-neon-cyan/20 sm:max-w-md max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-neon-cyan flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            دفع الدورة: {courseName}
          </DialogTitle>
        </DialogHeader>

        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neon-green/20 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-neon-green" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">تم إرسال طلب الدفع بنجاح!</h3>
            <p className="text-sm text-muted-foreground mb-4">
              سيتم فتح الدورة بعد تأكيد الدفع من الإدارة
            </p>
            <Button onClick={handleClose} className="bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30">
              حسناً
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-4 mt-2">
            {/* Amount Display */}
            <div className="glass-card p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">المبلغ المطلوب</p>
              <p className="text-3xl font-black neon-text">{formatYER(displayAmount)}</p>
              <p className="text-xs text-muted-foreground mt-1">دفعة واحدة</p>
            </div>

            {/* Payment Method Info - Admin's Wallet Details */}
            {methodsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 text-neon-cyan animate-spin" />
                <span className="text-sm text-muted-foreground mr-2">جاري تحميل طرق الدفع...</span>
              </div>
            ) : paymentMethods.length === 0 ? (
              <div className="glass-card p-4 text-center border border-amber-500/20">
                <AlertCircle className="h-6 w-6 text-amber-400 mx-auto mb-2" />
                <p className="text-sm text-amber-400">لا توجد طرق دفع متاحة حالياً</p>
                <p className="text-xs text-muted-foreground mt-1">يرجى التواصل مع الإدارة</p>
              </div>
            ) : (
              <div className="glass-card p-4 border border-neon-cyan/20">
                <h4 className="text-sm font-bold text-neon-cyan mb-3 flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  يحول المبلغ إلى المحفظة التالية
                </h4>

                {/* Payment Method Selection if multiple */}
                {paymentMethods.length > 1 && (
                  <div className="flex gap-2 mb-3 flex-wrap">
                    {paymentMethods.map((method) => (
                      <button
                        key={method._id}
                        onClick={() => setSelectedMethod(method)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          selectedMethod?._id === method._id
                            ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30'
                            : 'bg-white/5 text-muted-foreground border border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {method.walletName}
                      </button>
                    ))}
                  </div>
                )}

                {selectedMethod && (
                  <div className="space-y-3">
                    {/* Wallet Name */}
                    <div className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2.5">
                      <div>
                        <p className="text-[10px] text-muted-foreground">اسم المحفظة</p>
                        <p className="text-sm font-bold text-white">{selectedMethod.walletName}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-neon-cyan hover:bg-neon-cyan/10"
                        onClick={() => copyToClipboard(selectedMethod.walletName, 'name')}
                      >
                        {copiedField === 'name' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      </Button>
                    </div>

                    {/* Wallet Number */}
                    <div className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2.5">
                      <div>
                        <p className="text-[10px] text-muted-foreground">رقم المحفظة</p>
                        <p className="text-sm font-bold text-white font-mono" dir="ltr">{selectedMethod.walletNumber}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-neon-cyan hover:bg-neon-cyan/10"
                        onClick={() => copyToClipboard(selectedMethod.walletNumber, 'number')}
                      >
                        {copiedField === 'number' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      </Button>
                    </div>

                    {/* Wallet Owner */}
                    <div className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2.5">
                      <div>
                        <p className="text-[10px] text-muted-foreground">اسم صاحب المحفظة</p>
                        <p className="text-sm font-bold text-white">{selectedMethod.walletOwnerName}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-neon-cyan hover:bg-neon-cyan/10"
                        onClick={() => copyToClipboard(selectedMethod.walletOwnerName, 'owner')}
                      >
                        {copiedField === 'owner' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      </Button>
                    </div>

                    <p className="text-[10px] text-muted-foreground text-center">
                      قم بتحويل المبلغ إلى المحفظة أعلاه ثم ارفع لقطة الشاشة أدناه
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Screenshot Upload */}
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">لقطة شاشة الدفع * (إلزامي)</label>
              <div className="relative">
                {screenshot ? (
                  <div className="relative rounded-xl overflow-hidden border border-neon-cyan/20">
                    <img src={screenshot} alt="لقطة الدفع" className="w-full max-h-48 object-contain bg-black/50" />
                    <button
                      onClick={() => setScreenshot(null)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500/80 flex items-center justify-center hover:bg-red-500"
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-32 rounded-xl border-2 border-dashed border-white/10 hover:border-neon-cyan/30 cursor-pointer transition-colors bg-white/[0.02]">
                    <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                    <span className="text-xs text-muted-foreground">اضغط لرفع لقطة الشاشة</span>
                    <span className="text-[10px] text-muted-foreground/60 mt-1">PNG, JPG حتى 5MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleScreenshotUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Submit */}
            <Button
              onClick={handleSubmit}
              disabled={loading || !selectedMethod}
              className="w-full bg-gradient-to-l from-neon-cyan to-cyan-400 text-[#0a0e1a] font-bold h-11 hover:shadow-[0_0_30px_rgba(0,245,255,0.3)] transition-all"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  إرسال طلب الدفع - {formatYER(displayAmount)}
                </span>
              )}
            </Button>

            <p className="text-[10px] text-muted-foreground text-center">
              سيتم مراجعة الدفعة وفتح الدورة خلال 24 ساعة بعد تأكيد الدفع
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
