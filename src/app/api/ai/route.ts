import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'

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

// ─── Gemini API ────────────────────────────────────────────────────────────────
const GEMINI_MODELS = ['gemini-2.0-flash', 'gemini-2.0-flash-lite-001']

async function callGemini(
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string,
  temperature: number = 0.7,
  maxTokens: number = 2000,
): Promise<{ text: string | null; error?: string }> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return { text: null, error: 'GEMINI_API_KEY not set' }
  }

  const geminiContents = convertToGeminiFormat(messages)

  for (const model of GEMINI_MODELS) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 30000)

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: geminiContents,
            generationConfig: { temperature, maxOutputTokens: maxTokens, topP: 0.95, topK: 40 },
            safetySettings: [
              { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
              { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
              { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
              { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
            ]
          }),
        }
      )

      clearTimeout(timeout)

      if (!response.ok) {
        const errText = await response.text()
        if (response.status === 429) {
          console.log(`[AI] Gemini ${model} rate limited, trying next...`)
          continue
        }
        if (response.status === 404) {
          console.log(`[AI] Gemini ${model} not found, trying next...`)
          continue
        }
        console.error(`[AI] Gemini ${model} error:`, response.status, errText.slice(0, 200))
        continue
      }

      const data = await response.json()
      if (data?.candidates?.[0]?.finishReason === 'SAFETY') {
        return { text: '⚠️ عذراً، تم حظر الرد بسبب سياسات الأمان. يرجى إعادة صياغة السؤال.' }
      }

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
      if (text && text.trim().length > 0) {
        console.log(`[AI] Gemini ${model} success, length: ${text.length}`)
        return { text: text.trim() }
      }
      continue
    } catch (error: any) {
      console.error(`[AI] Gemini ${model} error:`, error?.message || error)
      continue
    }
  }

  return { text: null, error: 'All Gemini models failed (quota exhausted or key invalid)' }
}

function convertToGeminiFormat(messages: Array<{ role: string; content: string }>) {
  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = []
  for (const msg of messages) {
    if (msg.role === 'system') continue
    const geminiRole = msg.role === 'assistant' ? 'model' : 'user'
    const last = contents[contents.length - 1]
    if (last && last.role === geminiRole) {
      last.parts[0].text += '\n' + msg.content
    } else {
      contents.push({ role: geminiRole, parts: [{ text: msg.content }] })
    }
  }
  if (contents.length > 0 && contents[0].role !== 'user') {
    contents.unshift({ role: 'user', parts: [{ text: 'ابدأ المحادثة' }] })
  }
  return contents
}

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

**3. الرجفان الأذيني (AF)**
- اضطراب نظم شائع يزيد خطر السكتة الدماغية 5 أضعاف
- العلاج: مضادات التخثر (Warfarin/DOACs) + التحكم بالنظم/المعدل

**4. ارتفاع ضغط الدم**
- القيم الطبيعية: أقل من 120/80 mmHg
- مرحلة 1: 130-139/80-89 | مرحلة 2: ≥140/90
- العلاج: تعديل نمط الحياة + أدوية (ACEi, CCB, Thiazide)

⚠️ هذه المعلومات تعليمية فقط - راجع طبيبك دائماً!`
  },
  {
    keywords: ['cpr', 'إنعاش', 'انعاش', 'إسعاف', 'اسعاف', 'طوارئ', 'emergency', 'غرق', 'حرق', 'اختناق'],
    response: `🚑 **الإسعافات الأولية والطوارئ**

**خطوات الإنعاش القلبي الرئوي (CPR):**
1. ✅ تأكد من السلامة - تأمين مكان الحادث
2. 📢 تحقق من الاستجابة - هز المريض واهتف بصوت عالٍ
3. 📞 اتصل بالإسعاف (937 في السعودية)
4. 💪 ابدأ الضغط الصدري:
   - 30 ضغطة صدرية بمعدل 100-120/دقيقة
   - عمق 5-6 سم في البالغين
   - اسمح للصدر بالارتداد الكامل
5. 🌬️ نفختان تنفسيتان (نسبة 30:2)
6. 🔄 استمر حتى وصول الإسعاف أو عودة النبض

**حالات الطوارئ الشائعة:**
- **الحروق**: برّد بالماء الجاري 20 دقيقة، لا تضع ثلج
- **النزيف**: اضغط مباشرة على الجرح، ارفع الطرف
- **الاختناق**: مناورة هايمليخ (Heimlich)
- **الصدمة**: استلقِ المريض، ارفع قدميه، غطّه

⏱️ كل دقيقة مهمة في الطوارئ - تصرف فوراً!`
  },
  {
    keywords: ['دواء', 'أدوية', 'drug', 'حبوب', 'علاج', 'دوائي', 'تداخل', 'مضاد حيوي', 'مسكن', 'مضاد'],
    response: `💊 **معلومات دوائية مهمة**

**التداخلات الدوائية الخطيرة:**
1. **Warfarin + Aspirin**: ⚠️ خطر نزيف مرتفع جداً
2. **ACE Inhibitors + K-Sparing Diuretics**: فرط البوتاسيوم
3. **NSAIDs + Lithium**: سمية الليثيوم
4. **SSRIs + MAOIs**: 🚫 متلازمة السيروتونين!
5. **Metronidazole + Alcohol**: تأثير الديسلفيرام
6. **Statins + Macrolides**: مخزن العضلات (Rhabdomyolysis)

**تصنيف المضادات الحيوية:**
- **بنسلينات**: Amoxicillin, Ampicillin
- **سيفالوسبورينات**: Ceftriaxone, Cefuroxime
- **ماكروليدات**: Azithromycin, Clarithromycin
- **فلوروكينولونات**: Ciprofloxacin, Levofloxacin
- **أمينوغليكوزيدات**: Gentamicin, Amikacin

💡 **قواعد ذهبية:**
- تحقق من الحساسية الدوائية دائماً
- راجع قائمة أدوية المريض كاملة
- انتبه للجرعة عند مرضى الكلى/الكبد
- لا تتوقف عن المضاد الحيوي قبل انتهاء المدة

⚠️ هذه المعلومات تعليمية فقط!`
  },
  {
    keywords: ['سكر', 'diabetes', 'diabetic', 'أنسولين', 'insulin', 'غلوكوز', 'سكري', 'hypoglycemia', 'hyperglycemia'],
    response: `🩸 **مرض السكري (Diabetes Mellitus)**

**الأنواع:**
- **النوع 1**: مناعة ذاتية تدمر خلايا بيتا → لا أنسولين
- **النوع 2**: مقاومة أنسولين → نقص أنسولين تدريجي
- **سكري الحمل**: يظهر أثناء الحمل

**التشخيص:**
- HbA1c ≥ 6.5%
- صائم ≥ 126 mg/dL
- عشوائي ≥ 200 مع أعراض
- اختبار تحمل الجلوكوز ≥ 200

**علاج النوع 2 (حسب الخطوات):**
1. تعديل نمط الحياة + Metformin
2. إضافة: SGLT2i أو GLP-1 RA أو DPP-4i
3. أنسولين إذا HbA1c > 9% مع أعراض

**مضاعفات السكري:**
- **حاد**: حماض كيتوني (DKA)، فرط أسمولية (HHS)
- **مزمن**: اعتلال شبكية، اعتلال كلوي، اعتلال أعصاب، أمراض قلب

💡 الهدف: HbA1c < 7% لمعظم المرضى`
  },
  {
    keywords: ['ضغط', 'hypertension', 'blood pressure', 'bp', 'ضغط الدم', 'ارتفاع ضغط'],
    response: `🩺 **ارتفاع ضغط الدم (Hypertension)**

**التصنيف (ACC/AHA):**
- طبيعي: < 120/80 mmHg
- مرتفع: 120-129/<80
- مرحلة 1: 130-139/80-89
- مرحلة 2: ≥ 140/90
- أزمة ضغط: > 180/120

**الأسباب:**
- 90-95% أولي (Essential) - بدون سبب واضح
- 5-10% ثانوي: كلوي، كلوة فوق كلوية، أدوية، تضيق الشريان الكلوي

**العلاج الدوائي:**
- **الخط الأول**: ACEi/ARB أو CCB أو Thiazide
- **الخط الثاني**: إضافة من مجموعة أخرى
- **مقاوم**: 3 أدوية (بما فيها مدر) بجرعات كاملة

**نصائح لمرضى الضغط:**
- تقليل الملح < 5غ/يوم
- ممارسة الرياضة 150 دقيقة/أسبوع
- إنقاص الوزن
- الإقلاع عن التدخين
- المتابعة الدورية

💡 قس الضغط في وضعية الجلوس بعد 5 دقائق راحة`
  },
  {
    keywords: ['تنفس', 'respiratory', 'رئة', 'pulmonary', 'ربو', 'asthma', 'copd', 'التهاب رئة', 'pneumonia', 'سل'],
    response: `🫁 **أمراض الجهاز التنفسي**

**الربو (Asthma):**
- الأعراض: صفير، ضيق تنفس، سعال (أسوأ ليلاً)
- التشخيص: اختبار وظائف الرئة + قابلية عكس الانسداد (BD test >12%)
- العلاج: موسعات قصبات مستنشقة + كورتيكوستيرويد مستنشق

**COPD:**
- السبب الرئيسي: التدخين (90% من الحالات)
- الأعراض: ضيق تنفس تدريجي، سعال مع بلغم
- التصنيف: GOLD 1-4 حسب FEV1
- العلاج: LAMA + LABA + إعادة تأهيل رئوي

**الالتهاب الرئوي (Pneumonia):**
- الأعراض: حمى، سعال، ضيق تنفس، ألم صدري
- التشخيص: صورة صدر + CRP + زرع بلغم
- العلاج: مضاد حيوي حسب Severity (CURB-65)

**السل (Tuberculosis):**
- تشخيص: فحص بلغم AFB + زرع + GeneXpert
- العلاج: 6 أشهر (2HRZE/4HR)

⚠️ أي ضيق تنفس مفاجئ = تقييم طوارئ فوري!`
  },
  {
    keywords: ['دماغ', 'عصبي', 'neuro', 'brain', 'stroke', 'سكتة', 'صرع', 'seizure', 'epilepsy', 'صداع', 'migraine', 'meningitis'],
    response: `🧠 **أمراض الجهاز العصبي**

**السكتة الدماغية (Stroke):**
- ⏱️ "الوقت = الدماغ" - العلاج خلال 4.5 ساعات
- الإقفارية (85%): tPA أو thrombectomy
- النزفية (15%): تحكم الضغط + جراحة
- أعراض FAST: Face drooping, Arm weakness, Speech difficulty, Time to call

**الصرع (Epilepsy):**
- نوبات بؤرية: تبدأ في منطقة محددة من الدماغ
- نوبات معممة: تشمل الدماغ كله (Tonic-clonic, Absence)
- العلاج: مضادات الصرع (Levetiracetam, Valproate, Carbamazepine)

**الصداع النصفي (Migraine):**
- أعراض: صداع نابض أحادي، غثيان، حساسية ضوء/صوت
- قد يسبقه Aura (اضطرابات بصرية)
- العلاج: Triptans للنوبات + وقائي (Propranolol, Topiramate)

**التهاب السحايا (Meningitis):**
- علامات: حمى، صداع شديد، تيبس الرقبة، رهاب الضوء
- تشخيص: بذل قطني (Lumbar puncture)
- علاج طارئ: Ceftriaxone + Ampicillin (حسب العمر)

⚠️ أي أعراض عصبية مفاجئة = طوارئ فورية!`
  },
  {
    keywords: ['كلية', 'kidney', 'renal', 'فشل كلوي', 'diuresis', 'غسيل', 'dialysis', 'creatinine', 'كرياتينين'],
    response: `🫘 **أمراض الكلى**

**الفشل الكلوي الحاد (AKI):**
- التصنيف: قبل كلوي، كلوي، بعد كلوي
- الأسباب الشائعة: جفاف، إنتان، أدوية سامة للكلية
- التشخيص: ارتفاع Creatinine + نقص البول
- العلاج: معالجة السبب + توازن السوائل

**الفشل الكلوي المزمن (CKD):**
- المراحل: 1-5 حسب GFR (5 = <15 = غسيل)
- الأسباب: سكري، ضغط، التهاب كبيبات
- مضاعفات: فقر دم، هشاشة عظام، أمراض قلب
- العلاج: إبطاء التقدم (ACEi/ARB + تحكم الضغط والسكر)

**مؤشرات الغسيل الكلوي:**
1. فرط البوتاسيوم المقاوم
2. الحماض الأيضي الشديد
3. احتباس السوائل (وذمة رئوية)
4. اليوريميا (اعتلال دماغي، التهاب تامور)

💡 تابع وظائف الكلى دورياً خاصة مع أدوية NSAIDs و ACEi`
  },
  {
    keywords: ['اطفال', 'أطفال', 'pediatric', 'pediatrics', 'طفل', 'رضيع', 'حديث ولادة', 'تطعيم', 'لقاح', 'vaccin'],
    response: `👶 **طب الأطفال**

**التطعيمات الإلزامية:**
- عند الولادة: BCG + Hepatitis B
- شهر 2: DTaP + IPV + Hib + PCV + Rotavirus + HepB
- شهر 4: نفس الجرعة الثانية
- شهر 6: جرعة ثالثة
- سنة: MMR + Varicella + HepA + PCV booster

**حالات الأطفال الشائعة:**
- **حمى مجهولة السبب**: تقييم حسب العمر والعلامات الحيوية
- **إسهال**: تعويض سوائل (ORS) + زنك
- **التهاب أذن وسطى**: Amoxicillin الخط الأول
- **التهاب لوزات**: إذا بكتيري → Penicillin V

**علامات الخطر عند الأطفال:**
- حمى > 38°C عند حديث الولادة (< 3 أشهر) = طوارئ
- تنفس سريع أو صعوبة تنفس
- جفاف شديد (انخماص اليوافيخ)
- طفح جلدي لا يزول بالضغط (Petechiae)

💡 وزن الطفل = الدليل الأساسي لحساب الجرعات الدوائية`
  },
  {
    keywords: ['حمل', 'حامل', 'pregnancy', 'pregnant', 'ولادة', 'obstetric', 'نساء', 'توليد', 'إجهاض'],
    response: `🤰 **طب النساء والتوليد**

**متابعة الحمل الطبيعي:**
- الزيارة الأولى: تأكيد الحمل + فحوصات شاملة
- كل 4 أسابيع حتى 28 أسبوع
- كل أسبوعين حتى 36 أسبوع
- كل أسبوع حتى الولادة

**فحوصات أساسية:**
- تحاليل دم (CBC، فصيلة، سكر، وظائف كبد/كلية)
- فحص بول + زرع
- سونار في كل فصل
- فحص سكر الحمل (24-28 أسبوع)
- فحص Group B Strep (35-37 أسبوع)

**علامات الخطر أثناء الحمل:**
- نزيف مهبلي
- صداع شديد أو اضطراب بصر
- ألم بطني شديد
- ارتفاع ضغط الدم > 140/90
- حركة الجنين تقل أو تتوقف

⚠️ أي نزيف في الثلث الأول = استبعاد حمل خارج الرحم!`
  },
  {
    keywords: ['جراحة', 'surgery', 'عملية', 'appendicitis', 'زائدة', 'مرارة', 'gallbladder', 'فتق', 'hernia'],
    response: `🔪 **الجراحة العامة**

**الزائدة الدودية (Appendicitis):**
- الأعراض: ألم يبدأ حول السرة → ينتقل للفخذ الأيمن
- علامات: McBurney tenderness, Rovsing, Rebound
- التشخيص: USS (أطفال) أو CT (بالغين)
- العلاج: استئصال الزائدة (جراحة أو منظار)

**حصوات المرارة (Gallstones):**
- الأعراض: مغص مراري (ألم右上 بعد الأكل الدسم)
- مضاعفات: التهاب مرارة حاد، يرقان انسدادي، بنكرياس
- العلاج: استئصال المرارة بالمنظار (LC)

**الفتق (Hernia):**
- الإربي: الأكثر شيوعاً خاصة عند الرجال
- الفخذي: أكثر عند النساء
- خط الوسط: عند البدينين أو بعد العمليات
- خطر: الخنق (Strangulation) = طوارئ جراحية

💡 صيام قبل العملية: 6 ساعات صلب + 2 ساعة سائل صاف`
  },
  {
    keywords: ['اختبار', 'quiz', 'امتحان', 'أسئلة', 'test', 'مراجعة', 'دراسة', 'ذاكرة', 'flashcard'],
    response: `📝 **اختبار طبي سريع**

**اختبار أمراض القلب:**

1. ما هو العلاج الأولي لاحتشاء عضلة القلب الحاد؟
   أ) Beta-blocker | ب) Aspirin + Heparin + PCI | ج) Diuretic | د) ACE inhibitor
   ✅ الإجابة: ب) Aspirin + Heparin + فتح الشريان فوراً

2. ما هو مضاد التخثر المفضل في الرجفان الأذيني؟
   أ) Aspirin | ب) Warfarin فقط | ج) DOACs | د) Clopidogrel
   ✅ الإجابة: ج) DOACs (الأفضل حسب الإرشادات الحديثة)

3. ما هي الجرعة المناسبة من Adrenaline في الإنعاش؟
   أ) 0.1 mg | ب) 1 mg | ج) 5 mg | د) 10 mg
   ✅ الإجابة: ب) 1 mg IV كل 3-5 دقائق

4. علامة Kussmaul التنفسية تشير إلى:
   أ) نوبة هلع | ب) حماض كيتوني | ج) ربو | د) انصباب جنبي
   ✅ الإجابة: ب) حماض كيتوني-diabetic

5. ما هو أول خط علاجي لارتفاع الضغط؟
   أ) ACEi/ARB | ب) Beta-blocker | ج) Diuretic | د) حسب المريض
   ✅ الإجابة: د) يعتمد على العرق والعمر والأمراض المرافقة

💡 أرسل "اختبار" مع تخصص محدد لمزيد من الأسئلة!`
  },
  {
    keywords: ['تلخيص', 'summarize', 'ملخص', 'شرح', 'explain', 'مبسط', 'فهم', 'تعريف', 'ما هو', 'ما هي', 'ماذا'],
    response: `📚 **مرحباً بك في المساعد الطبي الذكي!**

يمكنني مساعدتك في عدة مجالات طبية:

🫀 **أمراض القلب**: احتشاء، فشل قلب، رجفان أذيني، ضغط
💊 **الأدوية**: تداخلات، تصنيفات، جرعات، مضادات حيوية
🚑 **الطوارئ**: CPR، حروق، نزيف، اختناق
🩸 **السكري**: تشخيص، علاج، مضاعفات
🫁 **التنفس**: ربو، COPD، التهاب رئة
🧠 **الأعصاب**: سكتة دماغية، صرع، صداع نصفي
🫘 **الكلى**: فشل كلوي حاد ومزمن
👶 **الأطفال**: تطعيمات، أمراض شائعة
🤰 **النساء**: متابعة حمل، مضاعفات
🔪 **الجراحة**: زائدة، مرارة، فتق

**أمثلة على الأسئلة:**
- "اشرح لي مرض السكري"
- "ما هي أعراض احتشاء القلب؟"
- "أعطني اختبار في أمراض القلب"
- "ما هي خطوات CPR؟"
- "ما هي تداخلات Warfarin؟"

⚠️ المعلومات للأغراض التعليمية فقط`
  },
]

function getSmartFallback(message: string): string {
  const lowerMsg = message?.toLowerCase() || ''

  // Check each medical topic
  for (const topic of MEDICAL_RESPONSES) {
    if (topic.keywords.some(kw => lowerMsg.includes(kw.toLowerCase()))) {
      return topic.response
    }
  }

  // Default - general help response
  return MEDICAL_RESPONSES[MEDICAL_RESPONSES.length - 1].response
}

// ─── Main API Route ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { message, context, history, userId, userName } = await req.json()

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'الرسالة مطلوبة' }, { status: 400 })
    }

    const trimmedMessage = message.trim().slice(0, 1000)

    // Fetch AI settings from DB
    let aiSettings: any = null
    try {
      const { db } = await connectToDatabase()
      aiSettings = await db.collection('ai_settings').findOne({ id: 'main' })
    } catch {}

    // Check if AI is disabled by admin
    if (aiSettings && aiSettings.enabled === false) {
      return NextResponse.json({
        response: '⚠️ المساعد الذكي معطل حالياً من قبل الإدارة.',
        source: 'disabled',
        timestamp: Date.now(),
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
            saveChatLog(userId, userName, trimmedMessage, cr.response, 'custom')
            return NextResponse.json({
              response: cr.response,
              source: 'custom',
              timestamp: Date.now(),
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

    // Try AI providers in order: Gemini → Groq → Fallback
    let aiResponse: string | null = null
    let source = 'fallback'

    // 1. Try Google Gemini
    const geminiResult = await callGemini(messages, systemPrompt, temperature, maxTokens)
    if (geminiResult.text) {
      aiResponse = geminiResult.text
      source = 'gemini'
    }

    // 2. Try Groq if Gemini failed
    if (!aiResponse) {
      const groqResult = await callGroq(messages, systemPrompt, temperature, maxTokens)
      if (groqResult.text) {
        aiResponse = groqResult.text
        source = 'groq'
      }
    }

    // 3. Smart fallback
    if (!aiResponse) {
      aiResponse = getSmartFallback(trimmedMessage)
      source = 'fallback'
    }

    saveChatLog(userId, userName, trimmedMessage, aiResponse, source)

    return NextResponse.json({
      response: aiResponse,
      source,
      timestamp: Date.now(),
    })

  } catch (error) {
    console.error('[AI] Route error:', error)
    return NextResponse.json({ error: 'حدث خطأ في معالجة الطلب' }, { status: 500 })
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
