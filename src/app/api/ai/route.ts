import { NextRequest, NextResponse } from 'next/server'

const MEDICAL_SYSTEM_PROMPT = `أنت مساعد طبي ذكي متخصص في التعليم الطبي لمنصة أكاديمية نبض. أنت تتحدث العربية بشكل أساسي.

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
    const { message, context, history } = await req.json()

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'الرسالة مطلوبة' },
        { status: 400 }
      )
    }

    // Limit message length for safety
    const trimmedMessage = message.trim().slice(0, 1000)

    // Build messages array for the AI
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: MEDICAL_SYSTEM_PROMPT }
    ]

    // Add conversation history if provided (last 10 messages max)
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

    // Add context if provided
    if (context) {
      messages.push({
        role: 'user',
        content: `السياق: ${String(context).slice(0, 500)}`
      })
      messages.push({
        role: 'assistant',
        content: 'فهمت السياق. أنا مستعد لمساعدتك بناءً على هذه المعلومات.'
      })
    }

    // Add the current user message
    messages.push({ role: 'user', content: trimmedMessage })

    // Try to use z-ai-web-dev-sdk
    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default
      const zai = await ZAI.create()
      
      const completion = await zai.chat.completions.create({
        messages,
        temperature: 0.7,
        max_tokens: 1500,
      })

      const aiResponse = completion?.choices?.[0]?.message?.content

      if (aiResponse && typeof aiResponse === 'string' && aiResponse.trim().length > 0) {
        return NextResponse.json({
          response: aiResponse.trim(),
          source: 'ai',
          timestamp: Date.now(),
        })
      }
    } catch (aiError: any) {
      console.error('AI SDK error, falling back to static responses:', aiError?.message || aiError)
    }

    // Fallback to static responses
    const fallbackResponse = getFallbackResponse(trimmedMessage)

    return NextResponse.json({
      response: fallbackResponse,
      source: 'fallback',
      timestamp: Date.now(),
    })

  } catch (error) {
    console.error('AI route error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في معالجة الطلب' },
      { status: 500 }
    )
  }
}
