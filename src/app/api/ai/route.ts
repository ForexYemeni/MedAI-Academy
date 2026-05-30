import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'

// ═══════════════════════════════════════════════════════════════════════════════
// 🧠 PROFESSIONAL MEDICAL AI SYSTEM PROMPT - ANTI-HALLUCINATION
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

// ─── Groq API ──────────────────────────────────────────────────────────────────
const GROQ_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
]

async function callGroq(
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string,
  temperature: number = 0.3,
  maxTokens: number = 2048,
): Promise<{ text: string | null; error?: string }> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return { text: null, error: 'GROQ_API_KEY not set' }
  }

  const apiMessages = [
    { role: 'system', content: systemPrompt },
    // Add a reinforcement message for accuracy
    { role: 'system', content: 'تذكير: لا تخترع معلومات. إذا لم تكن متأكداً، قل ذلك بصراحة. الدقة أهم من الإطناب.' },
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
            frequency_penalty: 0.3,
            presence_penalty: 0.2,
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

// ─── Professional Medical Fallback Responses ────────────────────────────────

const MEDICAL_RESPONSES: Array<{ keywords: string[]; response: string }> = [
  {
    keywords: ['قلب', 'heart', 'cardiac', 'تاجي', 'شرايين', 'احتشاء', ' MI ', 'فشل قلب', 'ذبحة'],
    response: `🫀 **أمراض القلب والأوعية الدموية**

**1. احتشاء عضلة القلب (Acute MI)**
- **السبب**: انسداد كامل في الشريان التاجي غالباً بسبب خثرة على لوحة تصلبية
- **الأعراض**: ألم صدري شديد خلف القوص (أكثر من 20 دقيقة)، ضيق تنفس، تعرق بارد، غثيان
- **التشخيص**: ECG (ارتفاع ST) + إنزيمات القلب (Troponin)
- **العلاج الإسعافي**: Aspirin + Nitroglycerin + Oxygen (إذا SpO2 < 94%)
- **العلاج النهائي**: PCI خلال 90 دقيقة أو أدوية حالّة للخثارة

**2. فشل القلب (Heart Failure)**
- **HFrEF** (انقباضي): EF < 40% → ACEi/ARB + Beta-blocker + MRA + SGLT2i
- **HFpEF** (انبساطي): EF ≥ 50% → SGLT2i + علاج السبب
- **الأعراض**: ضيق تنفس (خاصة عند الاستلقاء)، تورم الساقين، إرهاق

⚠️ المعلومات تعليمية فقط - لا تستخدمها كبديل لاستشارة الطبيب`
  },
  {
    keywords: ['cpr', 'إنعاش', 'انعاش', 'إسعاف', 'اسعاف', 'طوارئ', 'emergency', 'abc'],
    response: `🚑 **الإنعاش القلبي الرئوي (CPR) - إرشادات AHA**

**تقييم ABC:**
1. **A**irway - افتح مجرى الهواء (إمالة الرأس/رفع الذقن)
2. **B**reathing - تحقق من التنفس (أقصى 10 ثوانٍ)
3. **C**irculation - ابدأ الضغط الصدري فوراً

**ضغط صدري عالي الجودة:**
- المعدل: 100-120 ضغطة/دقيقة
- العمق: 5-6 سم للبالغين
- ارتداد كامل للصدر بين الضغطات
- نسبة الضغط للنفخ: 30:2

**أدوية الإنعاش:**
- Adrenaline 1 mg IV كل 3-5 دقائق
- Amiodarone 300 mg IV bolus (لـ VF/pVT المقاوم)

🚑 في حالات الطوارئ اتصل بالإسعاف فوراً!`
  },
  {
    keywords: ['دواء', 'أدوية', 'drug', 'حبوب', 'علاج', 'دوائي', 'تداخل', 'مضاد حيوي', 'مسكن', 'interaction'],
    response: `💊 **التداخلات الدوائية الخطيرة المعروفة**

1. **Warfarin + Aspirin/NSAIDs**: ⚠️ خطر نزيف مرتفع جداً
2. **SSRIs + MAOIs**: 🚫 متلازمة السيروتونين (حمى، رجفة، تشنجات)
3. **NSAIDs + Lithium**: ↑ مستوى الليثيوم → سمية
4. **Metronidazole + Alcohol**: تأثير الديسلفيرام (غثيان، قيء، تسرع قلب)
5. **ACEi + K-sparing diuretics**: ↑ البوتاسيوم → خطر على القلب
6. **Fluoroquinolones + Multivalent cations**: ↓ امتصاص المضاد الحيوي

💡 **قاعدة ذهبية**: راجع دائماً قائمة أدوية المريض كاملة قبل وصف أي دواء جديد!

⚠️ الجرعات تختلف حسب الحالة - راجع الطبيب المعالج`
  },
  {
    keywords: ['سكر', 'diabetes', 'أنسولين', 'insulin', 'سكري', 'glucose', 'hba1c'],
    response: `🩸 **مرض السكري (Diabetes Mellitus)**

**الأنواع الرئيسية:**
- **النوع 1**: مناعة ذاتية تدمر خلايا بيتا → لا أنسولين → يبدأ عادة في الصغر
- **النوع 2**: مقاومة أنسولين + نقص إفراز تدريجي → يبدأ عادة في الكبر

**معايير التشخيص (ADA):**
- HbA1c ≥ 6.5%
- صائم ≥ 126 mg/dL (7.0 mmol/L)
- عشوائي ≥ 200 mg/dL مع أعراض

**خطوط العلاج (النوع 2):**
1. تعديل نمط الحياة + **Metformin** (الخيار الأول)
2. إذا HbA1c فوق الهدف → إضافة SGLT2i أو GLP-1 RA (خاصة مع أمراض القلب/الكلى)
3. إذا استمر الارتفاع → أدوية أخرى أو أنسولين

💡 الهدف العام: HbA1c < 7% (قد يختلف حسب المريض)

⚠️ الجرعات والخطة العلاجية يحددها الطبيب المعالج`
  },
  {
    keywords: ['اختبار', 'quiz', 'امتحان', 'أسئلة', 'test', 'مراجعة'],
    response: `📝 **اختبار طبي سريع - المستوى المتوسط**

**1.** ما العلاج الإسعافي الأولي لاحتشاء القلب الحاد؟
→ Aspirin + Nitroglycerin + Oxygen (إذا لزم) → PCI

**2.** ما مضاد التخثر المفضل في الرجفان الأذيني غير الصمامي؟
→ DOACs (Apixaban/Rivaroxaban) على CHA2DS2-VASc

**3.** ما جرعة Adrenaline في الإنعاش ACLS؟
→ 1 mg IV كل 3-5 دقائق

**4.** ما أول خطوة في تقييم مريض فاقد الوعي؟
→ التأكد من مجرى الهواء (Airway)

**5.** ما أكثر سبب لالتهاب الكبد الحاد عالمياً؟
→ التهاب الكبد الفيروسي (خاصة B و C)

💡 أرسل تخصصاً محدداً (قلب، أعصاب، جراحة...) لاختبار مخصص!`
  },
  {
    keywords: ['كبد', 'liver', 'hepat', 'تليف', 'cirrhosis', 'يرقان', 'jaundice'],
    response: `🫘 **أمراض الكبد**

**أسباب التليف الكبدي (Cirrhosis):**
1. الكحول (الأكثر شيوعاً عالمياً)
2. التهاب الكبد الفيروسي المزمن (B, C)
3. الكبد الدهني غير الكحولي (NAFLD/NASH)
4. أمراض مناعية (PBC, PSC)

**علامات التليف:**
- يرقان، حكة، وذمة، استسقاء، ضمور العضلات
- علامات احتضان بابي: دوالي المريء، طحال متضخم

**تصنيف Child-Pugh:**
- A (5-6): بقاء جيد
- B (7-9): بقاء متوسط
- C (10-15): بقاء ضعيف

⚠️ التشخيص والعلاج يحددهما الطبيب المعالج`
  },
  {
    keywords: ['كلية', 'kidney', 'renal', 'فشل كلوي', 'dialysis', 'غسيل'],
    response: `🫘 **أمراض الكلى**

**الفشل الكلوي الحاد (AKI):**
- **قبل الكلية**: نقص حجم، فشل قلب، تضيق شريان كلوي
- **الكلية نفسها**: ATN، التهاب كبيبات، أدوية سامة للكلية
- **بعد الكلية**: انسداد مجرى البول

**معايير KDIGO لـ AKI:**
- ↑ الكرياتينين ≥ 0.3 mg/dL خلال 48 ساعة
- أو ↑ ≥ 1.5 ضعف الأساسي خلال 7 أيام
- أو البول < 0.5 mL/kg/h لمدة 6 ساعات

**مؤشرات الغسيل الكلوي العاجل:**
- فرط بوتاسيوم المقاوم للعلاج
- الحماض الأيضي الشديد
- احتقان رئوي مقاوم لل مدرات
- اعتلال دماغي يحملي

⚠️ التشخيص والعلاج يحددهما الطبيب المعالج`
  },
  {
    keywords: ['رئة', 'lung', 'pulmonary', 'تنفس', 'respiratory', 'ربو', 'asthma', 'copd'],
    response: `🫁 **أمراض الجهاز التنفسي**

**الربو القصبي (Asthma):**
- **الفيزيولوجيا**: تشنج قصبات + التهاب + مخاط → انسداد متنقل ومتبدل
- **العلاج**: 
  - سريع: SABA (Salbutamol) للإغاثة
  - طويل: ICS (الخط الأول للوقاية) ± LABA
- **نوبة الربو الشديدة**: العلاج بأكسجين + نيبولايزر Salbutamol + Steroids IV

**COPD:**
- **الفيزيولوجيا**: انسداد غير قابل للعكس الكامل (تشريحياً أمفسيما + التهاب قصبات)
- **العلاج**: LAMA ± LABA ± ICS حسب الشدة
- **الإقلاع عن التدخين**: أهم تدخل!

⚠️ الجرعات والخطة العلاجية يحددها الطبيب المعالج`
  },
  {
    keywords: ['دماغ', 'brain', 'neuro', 'أعصاب', 'سكتة', 'stroke', 'صرع', 'seizure', 'صداع'],
    response: `🧠 **أمراض الجهاز العصبي**

**السكتة الدماغية (Stroke):**
- **نقص التروية (80%)**: tPA خلال 4.5 ساعات أو Thrombectomy خلال 24 ساعة
- **نزفية (20%)**: ضبط الضغط + مراقبة + جراحة إن لزم
- **FAST**: Face drooping, Arm weakness, Speech difficulty, Time to call

**الصرع (Epilepsy):**
- **نوبة رمعية معممة**: Tonic-clonic → اللقطة الأولى غالباً Levetiracetam أو Valproate
- **نوبة بؤرية**: Carbamazepine أو Levetiracetam
- **حالة الصرع (Status Epilepticus)**: Benzodiazepine → Phenytoin/Fosphenytoin → ICU

⚠️ في حالة الاشتباه بسكتة - اتصل بالإسعاف فوراً! كل دقيقة مهمة!`
  },
  {
    keywords: ['حمل', 'pregnancy', 'ولادة', 'obstetric', 'نساء', 'gynecology', 'حامل'],
    response: `🤰 **طب النساء والتوليد**

**متابعة الحمل الطبيعي:**
- الزيارة الأولى: تأكيد الحمل + فحوصات أساسية (دم، بول، ضغط)
- كل 4 أسابيع حتى الأسبوع 28
- كل أسبوعين حتى الأسبوع 36
- أسبوعياً حتى الولادة

**علامات الخطر أثناء الحمل:**
- نزيف مهبلي
- صداع شديد أو اضطراب بصر → قد يشير لارتعاج (Preeclampsia)
- ارتفاع ضغط الدم ≥ 140/90 بعد الأسبوع 20
- حركة الجنين تقل أو تتوقف

⚠️ أي علامة خطر = مراجعة الطوارئ فوراً!`
  },
]

function getSmartFallback(message: string): string {
  const lowerMsg = message?.toLowerCase() || ''
  for (const topic of MEDICAL_RESPONSES) {
    if (topic.keywords.some(kw => lowerMsg.includes(kw.toLowerCase()))) {
      return topic.response
    }
  }
  return `📚 **مرحباً بك في المساعد الطبي الذكي!**

يمكنني مساعدتك في:
🫀 أمراض القلب | 💊 الأدوية والتداخلات | 🚑 الطوارئ والإسعاف
🩸 السكري | 🫁 التنفس | 🧠 الأعصاب | 🫘 الكبد والكلى
🤰 النساء والتوليد | 👶 الأطفال | 🔪 الجراحة

💡 اكتب سؤالك الطبي وسأجيبك بدقة قدر الإمكان.
⚠️ إذا لم أكن متأكداً من إجابة سأخبرك بصراحة بدلاً من التخمين.

⚠️ المعلومات للأغراض التعليمية فقط - لا تغني عن استشارة الطبيب`
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

    // Get system prompt (custom from admin or default)
    // Always append anti-hallucination rules even with custom prompts
    const basePrompt = (aiSettings?.systemPrompt && aiSettings.systemPrompt.trim().length > 0)
      ? aiSettings.systemPrompt
      : DEFAULT_SYSTEM_PROMPT
    
    const antiHallucinationAppend = `\n\n═══ قواعد إلزامية لا تُلغى أبداً ═══\n- لا تخترع معلومات طبية أبداً. إذا لم تكن متأكداً قل "لست متأكد".\n- لا تخترع أرقام إحصائيات أو جرعات أدوية غير مؤكدة.\n- أضف ⚠️ تحذير طبي عند ذكر أي جرعة أو علاج.\n- أنت مساعد تعليمي فقط - لا تستبدل الاستشارة الطبية.`
    const systemPrompt = basePrompt + antiHallucinationAppend

    // Professional temperature settings: lower = more accurate
    const temperature = aiSettings?.temperature ?? 0.3
    const maxTokens = aiSettings?.maxTokens ?? 2048

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

    // Build messages array with better context management
    const messages: Array<{ role: string; content: string }> = []

    if (Array.isArray(history) && history.length > 0) {
      // Use more history for better context (last 16 messages instead of 10)
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
