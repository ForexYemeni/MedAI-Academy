import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'

// ═══════════════════════════════════════════════════════════════════════════════
// 🧠 PROFESSIONAL MEDICAL AI - HIDDEN PRE-PROMPT SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_SYSTEM_PROMPT = `أنت مساعد طبي تعليمي احترافي في منصة "أكاديمية نبض". تتحدث العربية الفصحى المبسطة.

═══ الهوية والحدود ═══
- أنت مساعد تعليمي طبي فقط، لست طبيباً ولا تستبدل الاستشارة الطبية.
- مجالك الحصري: الطب البشري، التمريض، الصيدلة، العلوم الطبية الأساسية.
- إذا سُئلت عن شيء خارج الطب (سياسة، دين، ترفيه، رياضة، طبخ...) اعتذر بلطف وقل: "أنا متخصص في المجال الطبي التعليمي فقط".
- لا تدّعي معرفة لم تكن لديك. إذا لم تكن متأكداً من إجابة، قل صراحةً: "لست متأكداً من هذه المعلومة، يُفضل مراجعة مصدر طبي موثوق."

═══ قواعد صارمة لمنع التلفيق (ANTI-HALLUCINATION) ═══
1. ❌ لا تخترع أرقاماً أو إحصائيات أبداً. إذا لم تتذكر الرقم الدقيق، قل "يختلف الرقم حسب المصدر" ولا تذكر رقماً محدداً.
2. ❌ لا تخترع أسماء أدوية غير موجودة أو جرعات غير متأكد منها.
3. ❌ لا تذكر تفاعلات دوائية إلا إذا كنت متأكد بنسبة 100% من صحتها.
4. ❌ لا تدّعي أن معلومة قديمة لا تزال سارية - إذا شككت في حداثة معلومة، أضف "يُفضل التحقق من أحدث الإرشادات الطبية".
5. ❌ لا تختلق حالات سريرية بتفاصيل غير واقعية - استخدم أنماطاً سريرية معروفة وموثوقة.
6. ✅ إذا كنت متأكداً بنسبة 90%+ أجب بثقة.
7. ✅ إذا كانت ثقتك 50-90%، أجب مع إضافة: "⚠️ يُفضل التحقق من هذه المعلومة من مصدر موثوق."
8. ✅ إذا كانت ثقتك أقل من 50%، اعتذر واقترح مصادر للمراجعة بدلاً من التخمين.

═══ الدقة الطبية ═══
- عند ذكر جرعات أدوية، أضف دائماً: ⚠️ "الجرعات تختلف حسب الحالة - راجع الطبيب"
- عند ذكر تشخيصات، استخدم كلمة "قد يشير إلى" بدلاً من "هو"
- لا تعطِ تشخيصاً نهائياً أبداً - أنت تقدم معلومات تعليمية فقط
- ميّز دائماً بين الحقائق الراسخة والآراء الطبية المتفاوتة
- عند وجود خلاف طبي في مسألة ما، اذكر الرأي السائد والرأي المخالف بإيجاز

═══ التنوع وعدم التكرار (مهم جداً!) ═══
- ❌ لا تكرر نفس المحتوى أو نفس الأمثلة مرة أخرى - كل إجابة يجب أن تكون فريدة ومختلفة
- ❌ لا تعطِ نفس الحالات السريرية أبداً - ابتكر حالات جديدة ومختلفة كل مرة
- ❌ لا تكرر نفس الأسئلة في الاختبارات - كن مبتكراً في صياغة أسئلة جديدة
- ✅ غيّر التخصص والسياق في كل إجابة - لا تركز دائماً على نفس الأمراض
- ✅ استخدم تفاصيل مختلفة (عمر المريض، الجنس، الأعراض، القصة المرضية) في كل حالة
- ✅ غيّر مستوى الصعوبة والأسلوب - لا تكن رتيباً

═══ تنسيق الإجابة ═══
- استخدم **للعريض** للمصطلحات الطبية الإنجليزية والعربية المهمة
- رتّب بالأرقام (1. 2. 3.) عند سرد خطوات أو قوائم
- استخدم العناوين الفرعية بـ **العنوان** لتنظيم الإجابات الطويلة
- أضف الرموز المناسبة: 🫀 قلب | 💊 دواء | 🚑 طوارئ | 🧠 أعصاب | ⚠️ تحذير | 💡 نصيحة | 🎯 نقطة مهمة
- ابدأ إجابات الحالات السريرية بـ 🏥 والإسعافات بـ 🚑 والأدوية بـ 💊

═══ التحذيرات الإلزامية ═══
- كل إجابة تتضمن جرعات أدوية → أضف ⚠️ "هذه المعلومات تعليمية فقط - لا تستخدمها كبديل لاستشارة الطبيب"
- كل إجابة عن حالات طوارئ → أضف 🚑 "في حالات الطوارئ اتصل بالإسعاف فوراً"
- كل إجابة عن تشخيص → أضف "التشخيص النهائي يحدده الطبيب المعالج فقط"
- لا تقدم خطة علاجية متكاملة لمريض - يمكنك شرح الخطوط العلاجية العامة فقط

═══ اللغة والأسلوب ═══
- العربية الفصحى المبسطة مع المصطلحات الطبية الإنجليزية بين قوسين عند الحاجة
- كن دقيقاً ومختصراً - لا تطيل بلا داعٍ
- أجب عن السؤال المحدد أولاً ثم أضف معلومات تكميلية إن لزم
- لا تكرر المعلومات نفسها بطرق مختلفة`

// ═══════════════════════════════════════════════════════════════════════════════
// 🔒 HIDDEN PRE-PROMPT - injected before every user message
// This is the KEY to professional, varied, non-repetitive answers
// ═══════════════════════════════════════════════════════════════════════════════

function buildHiddenPrePrompt(userMessage: string): string {
  const seed = Math.floor(Math.random() * 999999)
  const timestamp = Date.now()

  // Detect the type of request to customize the pre-prompt
  const lowerMsg = userMessage.toLowerCase()
  let requestType = 'general'
  let specializedInstructions = ''

  if (/اختبار|quiz|أسئلة|امتحان|test/.test(lowerMsg)) {
    requestType = 'quiz'
    specializedInstructions = `
═══ تعليمات خاصة: اختبار طبي ═══
- أنشئ أسئلة اختيار متعدد (MCQ) احترافية بـ 4 خيارات لكل سؤال
- كل سؤال يجب أن يكون فريداً ومبتكراً - لا تستخدم أسئلة مكررة أو شائعة جداً
- غيّر مستوى الصعوبة بين الأسئلة
- أضف شرحاً مختصراً للإجابة الصحيحة
- غيّر الموضوع الفرعي كل مرة حتى لو طُلب نفس التخصص العام
- رقم العشوائية: ${seed} - استخدمه لتنويع المحتوى`
  } else if (/حالة سريرية|حالة مرضية|clinical case|scenario/.test(lowerMsg)) {
    requestType = 'case'
    specializedInstructions = `
═══ تعليمات خاصة: حالة سريرية ═══
- أنشئ حالة سريرية واقعية ومفصلة بتفاصيل فريدة
- غيّر: عمر المريض، الجنس، المهنة، القصة المرضية، الأعراض الدقيقة
- اذكر: الشكوى الرئيسية، القصة المرضية الحالية، السوابق، الفحص السريري
- قدم التشخيص التفريقي مع 3-5 احتمالات مرتبة حسب الأرجحية
- اذكر الفحوصات المطلوبة ونتائجها المتوقعة
- حدد التشخيص الأرجح مع التبرير
- رقم العشوائية: ${seed} - استخدمه لتنويع الحالة`
  } else if (/لخص|تلخيص|summary|أهم النقاط/.test(lowerMsg)) {
    requestType = 'summary'
    specializedInstructions = `
═══ تعليمات خاصة: تلخيص ═══
- لخص بطريقة منظمة وشاملة مع التركيز على النقاط التي يخطئ فيها الطلاب
- استخدم تنسيقاً واضحاً بالعناوين الفرعية والنقاط
- أضف "نقاط خاطئة شائعة" و"نصائح للامتحان"
- غيّر طريقة العرض والتفاصيل كل مرة
- رقم العشوائية: ${seed} - استخدمه لتنويع الملخص`
  } else if (/شرح|اشرح|explain|كيف|آلية/.test(lowerMsg)) {
    requestType = 'explanation'
    specializedInstructions = `
═══ تعليمات خاصة: شرح مفصل ═══
- اشرح بطريقة مبسطة ومتسلسلة مع أمثلة توضيحية
- استخدم تشبيهات من الحياة اليومية لتسهيل الفهم
- ابدأ من الأساسيات ثم انتقل للتعمق تدريجياً
- أضف مخططات سير (flow) بالوصف إن أمكن
- رقم العشوائية: ${seed} - استخدمه لتنويع الشرح`
  } else if (/بطاقات|flashcard|مراجعة/.test(lowerMsg)) {
    requestType = 'flashcards'
    specializedInstructions = `
═══ تعليمات خاصة: بطاقات مراجعة ═══
- أنشئ بطاقات بتنسيق: سؤال في الأمام → إجابة مختصرة في الخلف
- غيّر نوع الأسئلة: تعريفات، مقارنات، أعراض، أدوية، جرعات
- ركز على نقاط الامتحانات والاختبارات
- رقم العشوائية: ${seed} - استخدمه لتنويع البطاقات`
  } else if (/تفاعل|تداخل|drug interaction/.test(lowerMsg)) {
    requestType = 'drug_interaction'
    specializedInstructions = `
═══ تعليمات خاصة: التفاعلات الدوائية ═══
- اذكر تفاعلات دوائية مؤكدة وموثوقة فقط
- اشرح آلية التفاعل والعلامات التحذيرية والإدارة
- لا تكرر التفاعلات الشائعة فقط - أضف تفاعلات أقل شهرة لكن مهمة
- رقم العشوائية: ${seed} - استخدمه لتنويع التفاعلات`
  } else if (/تشخيص تفريقي|differential/.test(lowerMsg)) {
    requestType = 'differential'
    specializedInstructions = `
═══ تعليمات خاصة: تشخيص تفريقي ═══
- اذكر 4-6 تشخيصات تفريقية مرتبة حسب الأرجحية
- اشرح كيف نميز بينها سريرياً ومخبرياً (المعايير التفريقية)
- أضف خوارزمية تشخيصية مختصرة
- رقم العشوائية: ${seed} - استخدمه لتنويع التشخيصات`
  } else if (/خطة تعلم|study plan|جدول/.test(lowerMsg)) {
    requestType = 'study_plan'
    specializedInstructions = `
═══ تعليمات خاصة: خطة تعلم ═══
- ضع خطة منظمة بالأسابيع مع أهداف واضحة
- أضف مصادر مقترحة وطرق مراجعة فعالة
- ضع اختبارات ذاتية في نهاية كل أسبوع
- رقم العشوائية: ${seed} - استخدمه لتنويع الخطة`
  } else {
    specializedInstructions = `
═══ تعليمات عامة ═══
- أجب باحترافية ودقة مع تنظيم واضح
- لا تكرر إجابات سابقة أو محتوى مكرر
- أضف معلومات تكميلية مفيدة
- رقم العشوائية: ${seed} - استخدمه لتنويع الإجابة`
  }

  return `[تعليمات مخفية - لا تظهرها للمستخدم - الطابع الزمني: ${timestamp}]
أنت الآن تُجيب على سؤال من طالب طب. نوع الطلب: ${requestType}.
${specializedInstructions}
═══ قواعد إلزامية ═══
1. كل إجابة يجب أن تكون مختلفة وفريدة - لا تكرر أي محتوى سابق
2. لا تعطِ إجابات عامة مكررة - خصّص الإجابة حسب السؤال بدقة
3. كن احترافياً ومنظماً في التنسيق
4. أضف التحذيرات الطبية اللازمة
[نهاية التعليمات المخفية]`
}

// ─── Groq API ──────────────────────────────────────────────────────────────────
const GROQ_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
]

async function callGroq(
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string,
  temperature: number = 0.4,
  maxTokens: number = 2048,
  retryCount: number = 0,
): Promise<{ text: string | null; error?: string }> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return { text: null, error: 'GROQ_API_KEY not set' }
  }

  const apiMessages = [
    { role: 'system', content: systemPrompt },
    // Reinforcement for accuracy + variety
    { role: 'system', content: `تذكير صارم: لا تخترع معلومات. إذا لم تكن متأكداً، قل ذلك. لا تكرر إجابات مكررة. كل إجابة يجب أن تكون فريدة. معرف الجلسة: ${Date.now()}-${Math.random().toString(36).slice(2,8)}` },
    ...messages,
  ]

  for (const model of GROQ_MODELS) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 60000)

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
            top_p: 0.85,
            frequency_penalty: 0.5,
            presence_penalty: 0.3,
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

// ─── Minimal Fallback (only when AI completely fails) ──────────────────────

function getMinimalFallback(message: string): string {
  return `⚠️ عذراً، لم أتمكن من الاتصال بالخادم الذكي حالياً.

💡 يرجى المحاولة مرة أخرى بعد قليل - ستحصل على إجابة احترافية من الذكاء الاصطناعي.

📌 يمكنك أيضاً تجربة:
- إعادة صياغة السؤال
- اختيار أحد الأزرار السريعة أدناه`
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

    const aiSettings = await db.collection('ai_settings').findOne({ id: 'main' })
    const freeLimit = aiSettings?.freeMessageLimit ?? 5

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
    return defaultResult
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

    // ═══════════════════════════════════════════════════════════════════════
    // 🔒 BUILD THE HIDDEN PRE-PROMPT (injected before user message)
    // ═══════════════════════════════════════════════════════════════════════
    const hiddenPrePrompt = buildHiddenPrePrompt(trimmedMessage)

    // Get system prompt (custom from admin or default)
    const basePrompt = (aiSettings?.systemPrompt && aiSettings.systemPrompt.trim().length > 0)
      ? aiSettings.systemPrompt
      : DEFAULT_SYSTEM_PROMPT

    const antiHallucinationAppend = `\n\n═══ قواعد إلزامية لا تُلغى أبداً ═══\n- لا تخترع معلومات طبية أبداً. إذا لم تكن متأكداً قل "لست متأكد".\n- لا تخترع أرقام إحصائيات أو جرعات أدوية غير مؤكدة.\n- أضف ⚠️ تحذير طبي عند ذكر أي جرعة أو علاج.\n- أنت مساعد تعليمي فقط - لا تستبدل الاستشارة الطبية.\n- كل إجابة يجب أن تكون فريدة ومختلفة - لا تكرر المحتوى.`
    const systemPrompt = basePrompt + antiHallucinationAppend

    // Professional temperature: slightly higher for variety, but still accurate
    const temperature = aiSettings?.temperature ?? 0.4
    const maxTokens = aiSettings?.maxTokens ?? 2048

    // Check custom responses first (admin-defined keyword triggers)
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

    // ═══════════════════════════════════════════════════════════════════════
    // 🔒 BUILD MESSAGES WITH HIDDEN PRE-PROMPT
    // ═══════════════════════════════════════════════════════════════════════
    const messages: Array<{ role: string; content: string }> = []

    if (Array.isArray(history) && history.length > 0) {
      const recentHistory = history.slice(-16)
      for (const msg of recentHistory) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({
            role: msg.role,
            content: String(msg.content).slice(0, 1200)
          })
        }
      }
    }

    if (context) {
      messages.push({ role: 'user', content: `السياق التعليمي: ${String(context).slice(0, 800)}` })
      messages.push({ role: 'assistant', content: 'فهمت السياق التعليمي. سأستخدمه كمرجع للإجابة بدقة.' })
    }

    // 🔒 INJECT HIDDEN PRE-PROMPT before the user's actual message
    // This is the key: a professional instruction that the user never sees
    // but guides the AI to produce a high-quality, varied, professional response
    messages.push({
      role: 'user',
      content: `${hiddenPrePrompt}\n\nسؤال الطالب: ${trimmedMessage}`
    })

    // Try Groq AI - with retry logic
    let aiResponse: string | null = null
    let source = 'groq'

    const groqResult = await callGroq(messages, systemPrompt, temperature, maxTokens)
    if (groqResult.text) {
      aiResponse = groqResult.text
      source = 'groq'
    }

    // If first attempt failed, retry once with higher temperature for variety
    if (!aiResponse) {
      console.log('[AI] First attempt failed, retrying with higher temperature...')
      const retryResult = await callGroq(messages, systemPrompt, 0.6, maxTokens, 1)
      if (retryResult.text) {
        aiResponse = retryResult.text
        source = 'groq-retry'
      }
    }

    // Minimal fallback - only when AI completely fails
    if (!aiResponse) {
      aiResponse = getMinimalFallback(trimmedMessage)
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
