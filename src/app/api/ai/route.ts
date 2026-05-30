import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'

// ═══════════════════════════════════════════════════════════════════════════════
// 🧠 PROFESSIONAL MEDICAL AI - Groq Only (Fast & Reliable)
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

═══ التنوع وعدم التكرار (مهم جداً!) ═══
- ❌ لا تكرر نفس المحتوى أو نفس الأمثلة مرة أخرى - كل إجابة يجب أن تكون فريدة ومختلفة
- ❌ لا تعطِ نفس الحالات السريرية أبداً - ابتكر حالات جديدة ومختلفة كل مرة
- ❌ لا تكرر نفس الأسئلة في الاختبارات - كن مبتكراً في صياغة أسئلة جديدة
- ✅ غيّر التخصص والسياق في كل إجابة - لا تركز دائماً على نفس الأمراض
- ✅ استخدم تفاصيل مختلفة (عمر المريض، الجنس، الأعراض، القصة المرضية) في كل حالة

═══ تنسيق الإجابة الاحترافي (مهم جداً!) ═══
- 🔴 استخدم الإيموجي بكثرة وبشكل احترافي في كل قسم وكل نقطة
- 🟢 كل عنوان فرعي يجب أن يبدأ بإيموجي مناسب وملون
- 🔵 كل نقطة في القوائم يجب أن تبدأ بإيموجي مختلف
- 🟡 استخدم **للعريض** للمصطلحات الطبية المهمة
- 🟣 رتّب بالأرقام مع إيموجي (1️⃣ 2️⃣ 3️⃣) عند سرد خطوات
- استخدم العناوين الفرعية بـ **📌 العنوان** لتنظيم الإجابات الطويلة

═══ إيموجي إلزامية حسب نوع المحتوى ═══
🫀 أمراض القلب | 🫁 الجهاز التنفسي | 🧠 الأعصاب | 🦴 العظام | 🩸 الدم
💊 الأدوية | 💉 الحقن | 🧬 الجينات | 🔬 الفحوصات | 📋 التقارير
🚑 الطوارئ | 🏥 المستشفى | ⚕️ العلاج | 🩺 التشخيص | 🧪 المخبر
⚠️ التحذيرات | 💡 النصائح | 🎯 النقاط المهمة | ❌ الأخطاء | ✅ الصحيح
📖 الشرح | 📝 الملاحظات | 🔑 المفاتيح | 💎 النادر | 🌟 المميز
🔴 الخطير | 🟡 المتوسط | 🟢 الآمن | 🔵 المعلومات | 🟣 المتقدم

═══ التحذيرات الإلزامية ═══
- كل إجابة تتضمن جرعات أدوية → أضف ⚠️ "هذه المعلومات تعليمية فقط - لا تستخدمها كبديل لاستشارة الطبيب"
- كل إجابة عن حالات طوارئ → أضف 🚑 "في حالات الطوارئ اتصل بالإسعاف فوراً"
- كل إجابة عن تشخيص → أضف "التشخيص النهائي يحدده الطبيب المعالج فقط"

═══ اللغة والأسلوب ═══
- العربية الفصحى المبسطة مع المصطلحات الطبية الإنجليزية بين قوسين عند الحاجة
- كن دقيقاً ومختصراً - لا تطيل بلا داعٍ
- أجب عن السؤال المحدد أولاً ثم أضف معلومات تكميلية إن لزم`

// ═══════════════════════════════════════════════════════════════════════════════
// 🔒 HIDDEN PRE-PROMPT - injected before every user message
// ═══════════════════════════════════════════════════════════════════════════════

function buildHiddenPrePrompt(userMessage: string): string {
  const seed = Math.floor(Math.random() * 999999)
  const timestamp = Date.now()

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
- أضف شرحاً مختصراً للإجابة الصحيحة مع 💡
- غيّر الموضوع الفرعي كل مرة
- استخدم إيموجي مختلفة لكل سؤال: 🧪 🩺 💊 🔬 🧬
- رقم العشوائية: ${seed}`
  } else if (/حالة سريرية|حالة مرضية|clinical case|scenario/.test(lowerMsg)) {
    requestType = 'case'
    specializedInstructions = `
═══ تعليمات خاصة: حالة سريرية ═══
- أنشئ حالة سريرية واقعية ومفصلة بتفاصيل فريدة
- غيّر: عمر المريض، الجنس، المهنة، القصة المرضية، الأعراض الدقيقة
- اذكر: 👤 الشكوى الرئيسية | 📋 القصة المرضية | 🏥 الفحص السريري | 🔬 الفحوصات | 🩺 التشخيص التفريقي
- قدم التشخيص الأرجح مع التبرير 🎯
- رقم العشوائية: ${seed}`
  } else if (/لخص|تلخيص|summary|أهم النقاط/.test(lowerMsg)) {
    requestType = 'summary'
    specializedInstructions = `
═══ تعليمات خاصة: تلخيص ═══
- لخص بطريقة منظمة وشاملة مع إيموجي لكل قسم
- أضف 📌 لأهم النقاط و ❌ للأخطاء الشائعة و 💡 لنصائح الامتحان
- غيّر طريقة العرض والتفاصيل كل مرة
- رقم العشوائية: ${seed}`
  } else if (/شرح|اشرح|explain|كيف|آلية/.test(lowerMsg)) {
    requestType = 'explanation'
    specializedInstructions = `
═══ تعليمات خاصة: شرح مفصل ═══
- اشرح بطريقة مبسطة ومتسلسلة مع أمثلة توضيحية وإيموجي
- استخدم تشبيهات من الحياة اليومية 💡
- ابدأ من 🟢 الأساسيات ثم 🟡 المتوسط ثم 🔴 المتقدم
- رقم العشوائية: ${seed}`
  } else if (/بطاقات|flashcard|مراجعة/.test(lowerMsg)) {
    requestType = 'flashcards'
    specializedInstructions = `
═══ تعليمات خاصة: بطاقات مراجعة ═══
- أنشئ بطاقات بتنسيق: 📴 سؤال → 📩 إجابة مختصرة
- غيّر نوع الأسئلة: تعريفات 📖، مقارنات ⚖️، أعراض 🩺، أدوية 💊
- ركز على نقاط الامتحانات 🎯
- رقم العشوائية: ${seed}`
  } else if (/تفاعل|تداخل|drug interaction/.test(lowerMsg)) {
    requestType = 'drug_interaction'
    specializedInstructions = `
═══ تعليمات خاصة: التفاعلات الدوائية ═══
- اذكر تفاعلات دوائية مؤكدة وموثوقة فقط
- اشرح ⚙️ الآلية | ⚠️ العلامات التحذيرية | 🛡️ الإدارة
- أضف تفاعلات أقل شهرة لكن مهمة 💎
- رقم العشوائية: ${seed}`
  } else if (/تشخيص تفريقي|differential/.test(lowerMsg)) {
    requestType = 'differential'
    specializedInstructions = `
═══ تعليمات خاصة: تشخيص تفريقي ═══
- اذكر 4-6 تشخيصات تفريقية مرتبة حسب الأرجحية 1️⃣2️⃣3️⃣4️⃣
- اشرح المعايير التفريقية 🔍 بينها
- أضف خوارزمية تشخيصية مختصرة 🗺️
- رقم العشوائية: ${seed}`
  } else if (/خطة تعلم|study plan|جدول/.test(lowerMsg)) {
    requestType = 'study_plan'
    specializedInstructions = `
═══ تعليمات خاصة: خطة تعلم ═══
- ضع خطة منظمة بالأسابيع 📅 مع أهداف واضحة 🎯
- أضف مصادر مقترحة 📚 وطرق مراجعة فعالة ✅
- ضع اختبارات ذاتية 🧪 في نهاية كل أسبوع
- رقم العشوائية: ${seed}`
  } else if (/إسعاف|first aid|إنعاش|CPR|طوارئ|emergency/.test(lowerMsg)) {
    requestType = 'emergency'
    specializedInstructions = `
═══ تعليمات خاصة: إسعافات أولية وطوارئ ═══
- اشرح خطوات الإسعاف بشكل متسلسل 🚑 1️⃣2️⃣3️⃣
- أضف تحذيرات ⚠️ عند كل خطوة حرجة
- اذكر متى يجب الاتصال بالإسعاف فوراً 📞
- رقم العشوائية: ${seed}`
  } else {
    specializedInstructions = `
═══ تعليمات عامة ═══
- أجب باحترافية ودقة مع تنظيم واضح وإيموجي لكل قسم
- لا تكرر إجابات سابقة أو محتوى مكرر
- أضف معلومات تكميلية مفيدة 💎
- رقم العشوائية: ${seed}`
  }

  return `[تعليمات مخفية - لا تظهرها للمستخدم - الطابع الزمني: ${timestamp}]
أنت الآن تُجيب على سؤال من طالب طب. نوع الطلب: ${requestType}.
${specializedInstructions}
═══ قواعد إلزامية للتنسيق ═══
1. ❗ كل إجابة يجب أن تحتوي على إيموجي احترافية بكثرة - لا تترك أي سطر بدون إيموجي مناسب
2. ❗ كل عنوان يجب أن يبدأ بإيموجي ملونة وملائمة للمحتوى
3. ❗ كل نقطة في القائمة يجب أن تبدأ بإيموجي مختلف عن الأخرى
4. ❗ استخدم أرقام إيموجي (1️⃣ 2️⃣ 3️⃣) للخطوات المتسلسلة
5. ❗ كل إجابة يجب أن تكون فريدة ومختلفة - لا تكرر أي محتوى سابق
6. ❗ أضف التحذيرات الطبية اللازمة مع ⚠️
7. ❗ اجعل الإجابة جذابة بصرياً بالألوان والإيموجي
[نهاية التعليمات المخفية]`
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🤖 Groq AI Provider
// ═══════════════════════════════════════════════════════════════════════════════

const GROQ_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
]

async function callGroq(
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string,
  temperature: number = 0.6,
  maxTokens: number = 2048,
): Promise<{ text: string | null; error?: string }> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return { text: null, error: 'GROQ_API_KEY not set' }
  }

  const apiMessages = [
    { role: 'system', content: systemPrompt },
    { role: 'system', content: `تذكير صارم: لا تخترع معلومات. إذا لم تكن متأكداً، قل ذلك. لا تكرر إجابات مكررة. كل إجابة يجب أن تكون فريدة. معرف الجلسة: ${Date.now()}-${Math.random().toString(36).slice(2,8)}` },
    ...messages,
  ]

  for (const model of GROQ_MODELS) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 45000)

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
        if (response.status === 429) {
          console.log(`[AI] Groq ${model} rate limited, trying next...`)
          continue
        }
        const errText = await response.text()
        console.error(`[AI] Groq ${model} error:`, response.status, errText.slice(0, 200))
        // If 403 Forbidden, the API key is invalid/expired - no point retrying
        if (response.status === 403) {
          return { text: null, error: 'API_KEY_INVALID' }
        }
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

function getMinimalFallback(message: string, errorType?: string): string {
  if (errorType === 'API_KEY_INVALID') {
    return `🔴 مفتاح API غير صالح أو منتهي الصلاحية

⚠️ المساعد الذكي متوقف مؤقتاً بسبب مشكلة تقنية في الاتصال.
💡 يرجى التواصل مع إدارة التطبيق لتحديث المفتاح.

📞 يمكنك إبلاغ الإدارة من خلال صفحة التواصل.`
  }
  return `⚠️ عذراً، لم أتمكن من الاتصال بالخادم الذكي حالياً.

💡 يرجى المحاولة مرة أخرى بعد قليل.

📌 يمكنك أيضاً تجربة:
- إعادة صياغة السؤال 🔄
- اختيار أحد الأزرار السريعة أدناه ⬇️`
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

    const antiHallucinationAppend = `\n\n═══ قواعد إلزامية لا تُلغى أبداً ═══\n- لا تخترع معلومات طبية أبداً. إذا لم تكن متأكداً قل "لست متأكد".\n- لا تخترع أرقام إحصائيات أو جرعات أدوية غير مؤكدة.\n- أضف ⚠️ تحذير طبي عند ذكر أي جرعة أو علاج.\n- أنت مساعد تعليمي فقط - لا تستبدل الاستشارة الطبية.\n- كل إجابة يجب أن تكون فريدة ومختلفة - لا تكرر المحتوى.\n- استخدم إيموجي احترافية بكثرة في كل قسم وكل نقطة.`
    const systemPrompt = basePrompt + antiHallucinationAppend

    // Professional temperature for variety while maintaining accuracy
    const temperature = aiSettings?.temperature ?? 0.6
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
      const recentHistory = history.slice(-6) // Reduced from 16 to 6 for faster responses
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
    messages.push({
      role: 'user',
      content: `${hiddenPrePrompt}\n\nسؤال الطالب: ${trimmedMessage}`
    })

    // ═══════════════════════════════════════════════════════════════════════
    // 🤖 TRY GROQ AI (Fast & Reliable - Primary Provider)
    // ═══════════════════════════════════════════════════════════════════════
    let aiResponse: string | null = null
    let source = 'groq'
    let lastError: string | undefined = undefined

    // 1. Try Groq API
    console.log('[AI] Trying Groq API...')
    const groqResult = await callGroq(messages, systemPrompt, temperature, maxTokens)
    if (groqResult.text) {
      aiResponse = groqResult.text
      source = 'groq'
    } else {
      lastError = groqResult.error
    }

    // 2. Retry Groq (handles rate limiting) - only if not key error
    if (!aiResponse && lastError !== 'API_KEY_INVALID') {
      console.log('[AI] Groq attempt 1 failed, retrying in 1s...')
      await new Promise(resolve => setTimeout(resolve, 1000))
      const retryResult = await callGroq(messages, systemPrompt, 0.7, maxTokens)
      if (retryResult.text) {
        aiResponse = retryResult.text
        source = 'groq-retry'
      } else {
        lastError = retryResult.error
      }
    }

    // 3. Third retry with different temperature (handles transient errors)
    if (!aiResponse && lastError !== 'API_KEY_INVALID') {
      console.log('[AI] Groq attempt 2 failed, final retry in 2s...')
      await new Promise(resolve => setTimeout(resolve, 2000))
      const retry3Result = await callGroq(messages, systemPrompt, 0.5, maxTokens)
      if (retry3Result.text) {
        aiResponse = retry3Result.text
        source = 'groq-retry3'
      } else {
        lastError = retry3Result.error
      }
    }

    // 4. Final fallback message - only when Groq completely fails
    if (!aiResponse) {
      console.log('[AI] All Groq retries failed, using fallback message')
      aiResponse = getMinimalFallback(trimmedMessage, lastError === 'API_KEY_INVALID' ? 'API_KEY_INVALID' : undefined)
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
