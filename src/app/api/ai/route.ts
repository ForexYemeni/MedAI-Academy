import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'

const DEFAULT_SYSTEM_PROMPT = `أنت مساعد طبي ذكي متخصص في التعليم الطبي لمنصة أكاديمية نبض. أنت تتحدث العربية بشكل أساسي.

دورك:
- مساعدة الطلاب في فهم المفاهيم الطبية بشكل مبسط وواضح
- الإجابة على الأسئلة الطبية بدقة علمية عالية
- توليد حالات سريرية تعليمية
- إنشاء اختبارات سريعة وأسئلة مراجعة
- اقتراح خطط تعلم مخصصة
- شرح التداخلات الدوائية والأعراض والتشخيصات
- استخدام أمثلة سريرية واقعية
- تلخيص المحتوى الطبي المعقد

إرشادات الاستجابة:
- استخدم العربية الفصحى المبسطة
- أضف رموز تعبيرية مناسبة للمحتوى الطبي (🫀💊🚑🏥🧠⚡)
- رتب الإجابات بترقيم واضح عند السرد
- استخدم الخط العريض للمصطلحات المهمة
- أضف تحذيرات عند الحديث عن جرعات أدوية أو حالات طوارئ
- لا تقدم نصائح علاجية مباشرة - أكد دائماً أن المعلومات للأغراض التعليمية فقط
- إذا سُئلت عن شيء خارج التخصص الطبي، وجّه للمجال الصحيق بلطف

تنسيق Markdown:
- استخدم **للعريض** للتأكيد على المصطلحات
- استخدم القوائم المرقمة للخطوات
- استخدم العناوين الفرعية للتنظيم
- أضف ⚠️ للتحذيرات و 💡 للنصائح و 🎯 للنقاط المهمة

تذكر: أنت مساعد تعليمي، لا تغني عن الاستشارة الطبية المتخصصة.`

// ─── Groq API ──────────────────────────────────────────────────────────────────
const GROQ_MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant']

async function callGroq(
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string,
  temperature: number = 0.7,
  maxTokens: number = 2000,
): Promise<{ text: string | null; error?: string }> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return { text: null, error: 'GROQ_API_KEY not set' }
  }

  const apiMessages = [
    { role: 'system', content: systemPrompt },
    ...messages,
  ]

  for (const model of GROQ_MODELS) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 30000)

      const response = await fetch(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          signal: controller.signal,
          body: JSON.stringify({
            model,
            messages: apiMessages,
            temperature,
            max_tokens: maxTokens,
            top_p: 0.95,
          }),
        }
      )

      clearTimeout(timeout)

      if (!response.ok) {
        const errText = await response.text()
        if (response.status === 429) {
          console.log(`[AI] Groq ${model} rate limited, trying next...`)
          continue
        }
        console.error(`[AI] Groq ${model} error:`, response.status, errText.slice(0, 200))
        continue
      }

      const data = await response.json()
      const text = data?.choices?.[0]?.message?.content
      if (text && text.trim().length > 0) {
        console.log(`[AI] Groq ${model} success, length: ${text.length}`)
        return { text: text.trim() }
      }
      continue
    } catch (error: any) {
      console.error(`[AI] Groq ${model} error:`, error?.message || error)
      continue
    }
  }

  return { text: null, error: 'All Groq models failed' }
}

// ─── Smart Fallback ────────────────────────────────────────────────────────────

const MEDICAL_RESPONSES: Array<{ keywords: string[]; response: string }> = [
  {
    keywords: ['قلب', 'heart', 'cardiac', 'تاجي', 'شرايين', 'احتشاء', ' MI ', 'فشل قلب'],
    response: `🫀 **أمراض القلب والأوعية الدموية**

أمراض القلب من أكثر الأمراض شيوعاً وخطراً في العالم:

**1. احتشاء عضلة القلب (MI)**
- السبب: انسداد كامل في الشريان التاجي
- الأعراض: ألم صدري شديد، ضيق تنفس، تعرق بارد
- التشخيص: ECG + إنزيمات القلب (Troponin)
- العلاج: الإسعاف الفوري → فتح الشريان (PCI) أو أدوية حالّة للخثارة

**2. فشل القلب (Heart Failure)**
- الأعراض: ضيق تنفس، تورم الساقين، إرهاق
- التصنيف: انقباضي (HFrEF) أو انبساطي (HFpEF)
- العلاج: ACEi/ARB + Beta-blocker + MRA + SGLT2i

⚠️ هذه المعلومات تعليمية فقط - راجع طبيبك دائماً!`
  },
  {
    keywords: ['cpr', 'إنعاش', 'انعاش', 'إسعاف', 'اسعاف', 'طوارئ', 'emergency'],
    response: `🚑 **الإسعافات الأولية والطوارئ**

**خطوات الإنعاش القلبي الرئوي (CPR):**
1. ✅ تأكد من السلامة
2. 📢 تحقق من الاستجابة
3. 📞 اتصل بالإسعاف
4. 💪 30 ضغطة صدرية (معدل 100-120/دقيقة، عمق 5-6 سم)
5. 🌬️ نفختان تنفسيتان (نسبة 30:2)

⏱️ كل دقيقة مهمة في الطوارئ - تصرف فوراً!`
  },
  {
    keywords: ['دواء', 'أدوية', 'drug', 'حبوب', 'علاج', 'دوائي', 'تداخل', 'مضاد حيوي', 'مسكن'],
    response: `💊 **معلومات دوائية مهمة**

**التداخلات الدوائية الخطيرة:**
1. **Warfarin + Aspirin**: ⚠️ خطر نزيف مرتفع جداً
2. **SSRIs + MAOIs**: 🚫 متلازمة السيروتونين!
3. **NSAIDs + Lithium**: سمية الليثيوم
4. **Metronidazole + Alcohol**: تأثير الديسلفيرام

💡 دائماً راجع قائمة أدوية المريض كاملة!

⚠️ هذه المعلومات تعليمية فقط!`
  },
  {
    keywords: ['سكر', 'diabetes', 'أنسولين', 'insulin', 'سكري'],
    response: `🩸 **مرض السكري**
- **النوع 1**: مناعة ذاتية → لا أنسولين
- **النوع 2**: مقاومة أنسولين
- **التشخيص**: HbA1c ≥ 6.5% أو صائم ≥ 126 mg/dL
- **العلاج**: تعديل نمط الحياة + Metformin → SGLT2i/GLP-1 RA → أنسولين
💡 الهدف: HbA1c < 7%`
  },
  {
    keywords: ['اختبار', 'quiz', 'امتحان', 'أسئلة', 'test'],
    response: `📝 **اختبار طبي سريع**
1. ما هو العلاج الأولي لاحتشاء القلب؟ → Aspirin + Heparin + PCI
2. مضاد التخثر المفضل في الرجفان الأذيني؟ → DOACs
3. جرعة Adrenaline في الإنعاش؟ → 1 mg IV كل 3-5 دقائق
💡 أرسل "اختبار" مع تخصص محدد لمزيد من الأسئلة!`
  },
  {
    keywords: ['تلخيص', 'شرح', 'explain', 'ما هو', 'ما هي', 'مرحبا', 'كيف'],
    response: `📚 **مرحباً بك في المساعد الطبي الذكي!**

يمكنني مساعدتك في:
🫀 أمراض القلب | 💊 الأدوية | 🚑 الطوارئ | 🩸 السكري
🫁 التنفس | 🧠 الأعصاب | 🫘 الكلى | 👶 الأطفال | 🤰 النساء | 🔪 الجراحة

⚠️ المعلومات للأغراض التعليمية فقط`
  },
]

function getSmartFallback(message: string): string {
  const lowerMsg = message?.toLowerCase() || ''
  for (const topic of MEDICAL_RESPONSES) {
    if (topic.keywords.some(kw => lowerMsg.includes(kw.toLowerCase()))) {
      return topic.response
    }
  }
  return MEDICAL_RESPONSES[MEDICAL_RESPONSES.length - 1].response
}

// ─── Usage Tracking ────────────────────────────────────────────────────────────

interface UsageCheckResult {
  allowed: boolean
  remaining: number
  limit: number
  isPremium: boolean
  subscriptionType: string | null
  subscriptionExpiresAt: Date | null
}

async function checkAIUsage(userId: string | undefined): Promise<UsageCheckResult> {
  const defaultResult: UsageCheckResult = {
    allowed: true,
    remaining: 999,
    limit: 999,
    isPremium: false,
    subscriptionType: null,
    subscriptionExpiresAt: null,
  }

  if (!userId) return defaultResult

  try {
    const { db } = await connectToDatabase()

    // Get AI settings for free limit
    const aiSettings = await db.collection('ai_settings').findOne({ id: 'main' })
    const freeLimit = aiSettings?.freeMessageLimit ?? 5

    // Check user's active AI subscription
    const now = new Date()
    const activeSub = await db.collection('ai_subscriptions').findOne({
      userId,
      status: 'active',
      expiresAt: { $gt: now },
    })

    if (activeSub) {
      return {
        allowed: true,
        remaining: 9999,
        limit: 9999,
        isPremium: true,
        subscriptionType: activeSub.plan,
        subscriptionExpiresAt: activeSub.expiresAt,
      }
    }

    // Check daily usage for free users
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)

    const usageDoc = await db.collection('ai_usage').findOne({ userId, date: todayStart })
    const usedToday = usageDoc?.count ?? 0

    return {
      allowed: usedToday < freeLimit,
      remaining: Math.max(0, freeLimit - usedToday),
      limit: freeLimit,
      isPremium: false,
      subscriptionType: null,
      subscriptionExpiresAt: null,
    }
  } catch (error) {
    console.error('[AI] Usage check error:', error)
    return defaultResult // Allow on error
  }
}

async function incrementUsage(userId: string | undefined) {
  if (!userId) return
  try {
    const { db } = await connectToDatabase()
    const now = new Date()
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)

    await db.collection('ai_usage').updateOne(
      { userId, date: todayStart },
      { $inc: { count: 1 }, $setOnInsert: { userId, date: todayStart, createdAt: now } },
      { upsert: true }
    )
  } catch (error) {
    console.error('[AI] Usage increment error:', error)
  }
}

// ─── Main API Route ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { message, context, history, userId, userName } = await req.json()

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'الرسالة مطلوبة' }, { status: 400 })
    }

    const trimmedMessage = message.trim().slice(0, 1000)

    // Verify user token for usage tracking
    let verifiedUserId = userId
    const authHeader = req.headers.get('Authorization')
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '')
        const authUser = verifyToken(token)
        if (authUser) verifiedUserId = authUser.id
      } catch {}
    }

    // Fetch AI settings from DB
    let aiSettings: any = null
    try {
      const { db } = await connectToDatabase()
      aiSettings = await db.collection('ai_settings').findOne({ id: 'main' })

      // Migration: Fix old ai_settings that had enabled=false
      // Reset to enabled=true with new fields
      if (aiSettings && (aiSettings.enabled === false || !aiSettings.freeMessageLimit)) {
        await db.collection('ai_settings').updateOne(
          { id: 'main' },
          { $set: { enabled: true, provider: 'groq', freeMessageLimit: aiSettings.freeMessageLimit || 5, updatedAt: new Date() } }
        )
        aiSettings.enabled = true
        aiSettings.provider = 'groq'
        aiSettings.freeMessageLimit = aiSettings.freeMessageLimit || 5
      }
    } catch {}

    // Check if AI is intentionally disabled by admin
    // Only works after admin explicitly saves settings with the new system (has freeMessageLimit)
    if (aiSettings && aiSettings.enabled === false && aiSettings.freeMessageLimit !== undefined) {
      return NextResponse.json({
        response: '⚠️ المساعد الذكي معطل حالياً من قبل الإدارة.',
        source: 'disabled',
        timestamp: Date.now(),
      })
    }

    // Check usage limits
    const usage = await checkAIUsage(verifiedUserId)
    if (!usage.allowed) {
      return NextResponse.json({
        response: usage.isPremium
          ? '⚠️ خطأ في التحقق من الاشتراك. يرجى إعادة تسجيل الدخول.'
          : `🔒 **لقد استنفدت حد الرسائل المجانية اليومية** (${usage.limit} رسائل/يوم)\n\n💡 اشترك في الخطة المميزة للحصول على رسائل غير محدودة!\n\n📌 اذهب إلى صفحة الاشتراكات للاشتراك الآن`,
        source: 'limit_reached',
        timestamp: Date.now(),
        usage: { remaining: 0, limit: usage.limit, isPremium: usage.isPremium },
      })
    }

    // Get system prompt (custom from admin or default)
    const systemPrompt = (aiSettings?.systemPrompt && aiSettings.systemPrompt.trim().length > 0)
      ? aiSettings.systemPrompt
      : DEFAULT_SYSTEM_PROMPT
    const temperature = aiSettings?.temperature ?? 0.7
    const maxTokens = aiSettings?.maxTokens ?? 2000

    // Check custom responses first
    if (aiSettings?.customResponses && Array.isArray(aiSettings.customResponses)) {
      for (const cr of aiSettings.customResponses) {
        if (cr.keyword && cr.response) {
          const lowerMsg = trimmedMessage.toLowerCase()
          const keywords = cr.keyword.toLowerCase().split(',').map((k: string) => k.trim())
          if (keywords.some((k: string) => lowerMsg.includes(k))) {
            await incrementUsage(verifiedUserId)
            saveChatLog(verifiedUserId, userName, trimmedMessage, cr.response, 'custom')
            return NextResponse.json({
              response: cr.response,
              source: 'custom',
              timestamp: Date.now(),
              usage: { remaining: usage.remaining - 1, limit: usage.limit, isPremium: usage.isPremium },
            })
          }
        }
      }
    }

    // Build messages array
    const messages: Array<{ role: string; content: string }> = []

    if (Array.isArray(history) && history.length > 0) {
      const recentHistory = history.slice(-10)
      for (const msg of recentHistory) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({
            role: msg.role,
            content: String(msg.content).slice(0, 1000)
          })
        }
      }
    }

    if (context) {
      messages.push({ role: 'user', content: `السياق: ${String(context).slice(0, 500)}` })
      messages.push({ role: 'assistant', content: 'فهمت السياق. أنا مستعد لمساعدتك بناءً على هذه المعلومات.' })
    }

    messages.push({ role: 'user', content: trimmedMessage })

    // Try Groq AI
    let aiResponse: string | null = null
    let source = 'fallback'

    const groqResult = await callGroq(messages, systemPrompt, temperature, maxTokens)
    if (groqResult.text) {
      aiResponse = groqResult.text
      source = 'groq'
    }

    // Smart fallback
    if (!aiResponse) {
      aiResponse = getSmartFallback(trimmedMessage)
      source = 'fallback'
    }

    // Track usage
    await incrementUsage(verifiedUserId)
    saveChatLog(verifiedUserId, userName, trimmedMessage, aiResponse, source)

    return NextResponse.json({
      response: aiResponse,
      source,
      timestamp: Date.now(),
      usage: { remaining: usage.remaining - 1, limit: usage.limit, isPremium: usage.isPremium },
    })

  } catch (error) {
    console.error('[AI] Route error:', error)
    return NextResponse.json({ error: 'حدث خطأ في معالجة الطلب' }, { status: 500 })
  }
}

// GET - Check usage limits
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const authUser = verifyToken(token)
    if (!authUser) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const usage = await checkAIUsage(authUser.id)

    return NextResponse.json({
      success: true,
      usage: {
        remaining: usage.remaining,
        limit: usage.limit,
        isPremium: usage.isPremium,
        subscriptionType: usage.subscriptionType,
        subscriptionExpiresAt: usage.subscriptionExpiresAt?.toISOString() || null,
      }
    })
  } catch (error) {
    console.error('[AI] GET error:', error)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}

// Save chat log to DB (non-blocking)
function saveChatLog(userId: string | undefined, userName: string | undefined, userMessage: string, aiResponse: string, source: string) {
  connectToDatabase().then(({ db }) => {
    db.collection('ai_chat_logs').insertOne({
      userId: userId || 'anonymous',
      userName: userName || 'مجهول',
      userMessage,
      aiResponse,
      source,
      timestamp: new Date(),
    }).catch(() => {})
  }).catch(() => {})
}
