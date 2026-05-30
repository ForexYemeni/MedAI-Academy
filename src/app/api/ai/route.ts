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
- إذا سُئلت عن شيء خارج التخصص الطبي، وجّه للمجال الصحيح بلطف

تنسيق Markdown:
- استخدم **للعريض** للتأكيد على المصطلحات
- استخدم القوائم المرقمة للخطوات
- استخدم العناوين الفرعية للتنظيم
- أضف ⚠️ للتحذيرات و 💡 للنصائح و 🎯 للنقاط المهمة

تذكر: أنت مساعد تعليمي، لا تغني عن الاستشارة الطبية المتخصصة.`

// Call Google Gemini API directly
async function callGemini(
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string,
  temperature: number = 0.7,
  maxTokens: number = 2000,
): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('GEMINI_API_KEY not set')
    return null
  }

  // Convert messages to Gemini format
  const geminiContents: Array<{ role: string; parts: Array<{ text: string }> }> = []

  for (const msg of messages) {
    if (msg.role === 'system') continue
    geminiContents.push({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    })
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }]
          },
          contents: geminiContents,
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
            topP: 0.95,
            topK: 40,
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
          ]
        }),
      }
    )

    if (!response.ok) {
      const errText = await response.text()
      console.error('Gemini API error:', response.status, errText)
      return null
    }

    const data = await response.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text

    if (text && typeof text === 'string' && text.trim().length > 0) {
      return text.trim()
    }

    console.error('Gemini empty response:', JSON.stringify(data).slice(0, 500))
    return null
  } catch (error: any) {
    console.error('Gemini fetch error:', error?.message || error)
    return null
  }
}

// Fallback responses when AI is unavailable
const FALLBACK_RESPONSES: Record<string, string> = {
  'default': 'مرحباً! أنا مساعدك الطبي الذكي. يمكنني مساعدتك في شرح المفاهيم الطبية، توليد حالات سريرية، اختبارات سريعة، والمزيد. كيف يمكنني مساعدتك؟',
  'heart': '🫀 **أمراض القلب**\n\nأمراض القلب تشمل مجموعة واسعة من الحالات:\n\n1. **احتشاء عضلة القلب (MI)**: يحدث بسبب انسداد الشريان التاجي\n2. **فشل القلب**: عدم قدرة القلب على ضخ الدم بشكل كافٍ\n3. **الرجفان الأذيني**: اضطراب نظم شائع\n\n⚠️ دائماً راجع طبيبك قبل اتخاذ أي قرار علاجي!',
  'cpr': '🚑 **خطوات الإنعاش القلبي الرئوي (CPR)**\n\n1. **تأكد من السلامة** - تأمين مكان الحادث\n2. **تحقق من الاستجابة** - هز المريض واهتف بصوت عالٍ\n3. **اتصل بالإسعاف** - أو اطلب من شخص آخر الاتصال\n4. **ابدأ الضغط الصدري**:\n   - 30 ضغطة صدرية (معدل 100-120/دقيقة)\n   - عمق 5-6 سم\n5. **نفختان تنفسيتان** بنسبة 30:2\n\n⏱️ كل دقيقة مهمة - ابدأ فوراً!',
  'drug': '💊 **التداخلات الدوائية المهمة**\n\n1. **Warfarin + Aspirin**: ⚠️ خطر نزيف مرتفع جداً\n2. **ACE Inhibitors + K-Sparing Diuretics**: فرط البوتاسيوم\n3. **NSAIDs + Lithium**: سمية الليثيوم\n4. **SSRIs + MAOIs**: 🚫 متلازمة السيروتونين!\n5. **Metronidazole + Alcohol**: تأثير الديسلفيرام\n\n💡 دائماً راجع قائمة أدوية المريض كاملة!',
}

function getFallbackResponse(message: string): string {
  const lowerMsg = message?.toLowerCase() || ''
  if (lowerMsg.includes('قلب') || lowerMsg.includes('heart') || lowerMsg.includes('cardiac')) return FALLBACK_RESPONSES['heart']
  if (lowerMsg.includes('cpr') || lowerMsg.includes('إنعاش') || lowerMsg.includes('انعاش')) return FALLBACK_RESPONSES['cpr']
  if (lowerMsg.includes('دواء') || lowerMsg.includes('أدوية') || lowerMsg.includes('drug')) return FALLBACK_RESPONSES['drug']
  return FALLBACK_RESPONSES['default']
}

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
            // Log and return custom response
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

    // Try Google Gemini API
    const aiResponse = await callGemini(messages, systemPrompt, temperature, maxTokens)

    if (aiResponse) {
      saveChatLog(userId, userName, trimmedMessage, aiResponse, 'gemini')
      return NextResponse.json({
        response: aiResponse,
        source: 'gemini',
        timestamp: Date.now(),
      })
    }

    // Fallback to static responses
    const fallbackResponse = getFallbackResponse(trimmedMessage)
    saveChatLog(userId, userName, trimmedMessage, fallbackResponse, 'fallback')

    return NextResponse.json({
      response: fallbackResponse,
      source: 'fallback',
      timestamp: Date.now(),
    })

  } catch (error) {
    console.error('AI route error:', error)
    return NextResponse.json({ error: 'حدث خطأ في معالجة الطلب' }, { status: 500 })
  }
}

// Save chat log to DB (non-blocking)
function saveChatLog(userId: string | undefined, userName: string | undefined, userMessage: string, aiResponse: string, source: string) {
  // Don't await - fire and forget
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
