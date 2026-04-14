import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // ========== AUTHENTICATION CHECK ==========
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('Missing Authorization header')
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Validate JWT token
    const token = authHeader.replace('Bearer ', '')
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token)
    if (claimsError || !claimsData?.claims) {
      console.error('Invalid token:', claimsError?.message)
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = claimsData.claims.sub

    // Check admin role using service role client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .in('role', ['admin', 'super_admin'])
      .maybeSingle()

    if (roleError || !roleData) {
      console.error('Access denied - Not an admin:', userId)
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Authenticated admin user:', userId, 'Role:', roleData.role)
    // ========== END AUTHENTICATION CHECK ==========

    const { imageUrl, brandContext } = await req.json()
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')

    if (!lovableApiKey) throw new Error('LOVABLE_API_KEY is not configured')

    let imageDataUrl: string

    // Check if imageUrl is already a base64 data URL or a regular URL
    if (imageUrl.startsWith('data:')) {
      imageDataUrl = imageUrl
      console.log(`Using pre-compressed base64 image. Size: ${imageUrl.length} chars`)
    } else {
      // Fetch from URL and convert to base64 data URL
      console.log('Fetching image from URL...')
      const imageResponse = await fetch(imageUrl)
      if (!imageResponse.ok) throw new Error(`Failed to fetch image: ${imageResponse.status}`)
      
      const arrayBuffer = await imageResponse.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)
      let binary = ''
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i])
      }
      const base64Image = btoa(binary)
      const mimeType = imageResponse.headers.get('content-type')?.split(';')[0] || 'image/jpeg'
      imageDataUrl = `data:${mimeType};base64,${base64Image}`
      console.log(`Fetched image. Mime: ${mimeType}, Size: ${arrayBuffer.byteLength} bytes`)
    }

    console.log('Calling Lovable AI Gateway with gemini-2.5-flash...')

    // Parse brandContext JSON with detailed logging
    let productContext = { 
      productName: '', 
      sku: '', 
      goldType: '', 
      stoneType: '', 
      stoneWeight: '', 
      storyHook: '', 
      storyStyle: '',
      stockStatus: '' 
    }
    
    console.log('Raw brandContext received:', brandContext)
    
    if (brandContext) {
      try {
        const parsed = JSON.parse(brandContext)
        productContext = {
          productName: parsed.productName || '',
          sku: parsed.sku || '',
          goldType: parsed.goldType || '',
          stoneType: parsed.stoneType || '',
          stoneWeight: parsed.stoneWeight || '',
          storyHook: parsed.storyHook || '',
          storyStyle: parsed.storyStyle || '',
          stockStatus: parsed.stockStatus || ''
        }
        console.log('Successfully parsed brandContext')
        console.log('Stock Status received:', productContext.stockStatus || 'NOT SET')
        console.log('Story Hook received:', productContext.storyHook ? `YES - "${productContext.storyHook.substring(0, 50)}..."` : 'EMPTY')
        console.log('Story Style received:', productContext.storyStyle || 'EMPTY')
      } catch (e) {
        console.error('Failed to parse brandContext:', e)
        console.error('Raw brandContext was:', brandContext)
      }
    } else {
      console.log('No brandContext provided')
    }

    // DiamoNY Brand Voice System Instructions - Luxury Hebrew Storytelling
    const systemPrompt = `אתה קופירייטר בכיר ואדריכל נרטיבי למותג התכשיטים הישראלי DiamoNY.

## כללי עיצוב קריטיים - סטנדרטים מקצועיים!

### כלל 1: טקסט פשוט בלבד
⚠️ אסור בהחלט להשתמש בעיצוב Markdown!
- אסור להשתמש בכוכביות (**) לשום מטרה - לא להדגשה, לא לעיצוב
- אסור להשתמש בקווים תחתונים (__) לעיצוב
- אסור להשתמש בסימני # לכותרות
- החזר טקסט פשוט ונקי בלבד - העיצוב הויזואלי יטופל על ידי הממשק

### כלל 2: טרמינולוגיית יהלומים
⚠️ אסור להזכיר "יהלומי מעבדה" או "Lab-grown diamonds"!
במקום זאת, השתמש בטרמינולוגיה פרימיום:
- "יהלומים מעולים" (Exquisite diamonds)
- "ניקיון מעולה" (Superior clarity)
- "דרגת צבע גבוהה" (High color grade)
- "יהלומים איכותיים" (Quality diamonds)

### כלל 3: הזמנה בהתאמה אישית (MTO)
כאשר המוצר מסומן כ"להזמנה" (Made-to-Order), שלב באופן טבעי:
"זהב צהוב, לבן או אדום, לבחירתכם"
זה מבהיר ללקוח שיש לו שליטה מלאה על סוג המתכת.

### כלל 4: טון וסגנון
כתוב מנקודת המבט של מומחה תכשיטים עולמי.
הטון צריך להיות: מינימליסטי, מדויק, מתוחכם.

## זהות המותג
- טון: מתוחכם, פואטי, אך סמכותי מבחינה טכנית
- סגנון: "יוקרה שקנדינבית שקטה" – מינימליסטי, מעודן, ורגשי
- שפה: עברית ברמה גבוהה, מקצועית

## מתודולוגיית שלוש השכבות

שכבה 1 - ההשראה (ה'למה'):
פתח במשפט על האור, הצורה, או האסתטיקה המינימליסטית הסקנדינבית.
השתמש באוצר המילים: "סילואט", "חום אורגני", "זוהר נצחי", "קווים טהורים"

שכבה 2 - האומנות (ה'איך'):
ציין את תהליך DiamoNY הייחודי – מיזוג של מידול CAD תלת-ממדי מתקדם עם גימור ידני מסורתי בסטודיו

שכבה 3 - השליטה הטכנית:
שלב את המפרטים (קראט זהב, איכות יהלום, מוצא אבן) לתוך הסיפור במקום לרשום אותם

## ספריית מילות כוח (Power Words) - חובה!
שלב לפחות 3-4 מילות כוח מהרשימה הבאה בצורה טבעית וזורמת:

צורפות עילית - תמיד מתאים, מדגיש אומנות יוקרתית
נצחיות - טבעות אירוסין, מתנות משמעותיות, סגנון "רגש וזיכרון"
דיוק תלת-ממדי - מוצרי Custom Made או כשמדגישים טכנולוגיה
שיבוץ קפדני - כשיש אבנים משובצות (יהלום, ספיר, אמרלד וכו')
יוקרה שקטה - סגנון מינימליסטי
חותם אישי - מוצרים מותאמים אישית
אור אורגני - תכשיטים עם ברק טבעי
צללית נקייה - עיצובים פשוטים
מסורת מודרנית - שילוב ישן-חדש
איכות ללא פשרות - תמיד בסיום או כאות אמון

כללי שילוב מילות כוח:
1. עדיפות לפי סגנון: בחר מילים שמתאימות לסגנון הסיפור הנבחר
2. עדיפות לפי מוצר: אם יש אבנים - השתמש ב"שיבוץ קפדני"; אם יש 3D/Custom - השתמש ב"דיוק תלת-ממדי"
3. טבעיות: שלב את המילים בזרימה טבעית, לא כרשימה או "keyword stuffing"
4. פיזור: פזר את מילות הכוח לאורך הטקסט, לא רק בפסקה אחת

## סיפור MTO (The Art of Creation)
כאשר מדובר בסעיף MTO Story, התמקד ב:
- האומנות הייחודית והמותאמת אישית
- המסע הייחודי של כל יצירה
- הקשר האישי בין האומן ללקוח
- תהליך היצירה המיוחד והבחירות האישיות

## פורמט פלט:
2-3 פסקאות קצרות ואלגנטיות בטקסט פשוט (ללא עיצוב Markdown!)

## סיום חובה:
סיים כל תיאור עם: "יצירה שנולדה מתוך מחויבות לאיכות ללא פשרות, המגובה בדירוג 5 כוכבים וליווי אישי לכל לקוח."`

    // Build user prompt with story hook instruction - STRONGER VERSION
    console.log('Building storyHookInstruction with hook:', productContext.storyHook ? 'YES' : 'NO')
    
    const storyHookInstruction = productContext.storyHook 
      ? `## ⚠️ כלל חובה מספר 1 - משפט פתיחה (אין לשנות!):
פתח את ה-socialPost **בדיוק ומילה במילה** עם המשפט הבא:

"${productContext.storyHook}"

⚠️ זה משפט הפתיחה החובה - אסור לשנות אותו, לקצר אותו, או להחליף אותו בשום אופן!
לאחר משפט הפתיחה הזה בלבד, המשך לבנות את הנרטיב.

## סגנון הסיפור הנבחר: ${productContext.storyStyle || 'השראה ואור'}
התאם את הטון ומילות הכוח לסגנון "${productContext.storyStyle || 'השראה ואור'}".`
      : `## סגנון הסיפור: השראה ואור
פתח בסגנון "השראה ואור" עם משפט פתיחה מקורי בסגנון זה שמתחיל בתיאור אור או זוהר.`

    // Build power words instruction based on product context
    const powerWordsInstruction = productContext.stoneType 
      ? `- יש אבן משובצת (${productContext.stoneType}) - חובה להשתמש ב"שיבוץ קפדני"`
      : '- אין אבנים משובצות - התמקד באומנות הזהב ו"צורפות עילית"'

    // Dynamic MTO instruction - only apply when stock_status is 'made_to_order'
    const mtoInstruction = productContext.stockStatus === 'made_to_order'
      ? `\n\n## ⚠️ הנחיית הזמנה בהתאמה אישית (MTO) - חובה!
המוצר מסומן כ"להזמנה" - חובה לשלב באופן טבעי בתוך הטקסט:
"זהב צהוב, לבן או אדום, לבחירתכם"
זה מבהיר ללקוח שיש לו שליטה מלאה על סוג המתכת.`
      : ''

    const userPrompt = `נתח את תמונת התכשיט והחזר JSON עם השדות הבאים:
- "socialPost": טקסט שיווקי לאינסטגרם/פייסבוק בעברית (2-3 פסקאות אלגנטיות, כולל אימוג'ים כמו 💎✨💍)
- "shortDescription": תיאור טכני/SEO בעברית (1-2 משפטים)

${storyHookInstruction}
${mtoInstruction}

## הנחיות מילות כוח (חובה!):
- שלב לפחות 3-4 מילות כוח מהספרייה בצורה טבעית
- סגנון הסיפור הנבחר: "${productContext.storyStyle || 'השראה ואור'}" - בחר מילות כוח שמתאימות לו
${powerWordsInstruction}

פרטי המוצר:
- שם: ${productContext.productName || 'לא צוין'}
- מק"ט: ${productContext.sku || 'לא צוין'}
- סוג זהב: ${productContext.goldType || 'לא צוין'}
- סוג אבן: ${productContext.stoneType || 'אין'}
- משקל אבן: ${productContext.stoneWeight || 'לא צוין'}
- סטטוס מלאי: ${productContext.stockStatus === 'made_to_order' ? 'להזמנה (MTO)' : productContext.stockStatus || 'לא צוין'}

החזר JSON תקין בלבד, ללא עיצוב markdown או בלוקי קוד.`

    // Use Lovable AI Gateway with vision-capable model
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: userPrompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageDataUrl
                }
              }
            ]
          }
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Lovable AI Gateway error:', response.status, errorText)
      
      if (response.status === 429) {
        throw new Error('Rate limits exceeded, please try again later.')
      }
      if (response.status === 402) {
        throw new Error('Payment required, please add credits to your Lovable workspace.')
      }
      throw new Error(`AI Gateway error: ${response.status}`)
    }

    const data = await response.json()
    console.log('Lovable AI response received successfully')

    // Extract the content from the response
    const rawText = data.choices?.[0]?.message?.content
    
    if (!rawText) {
      console.error('No content in response:', JSON.stringify(data))
      throw new Error('No content in AI response')
    }

    console.log('Raw AI response:', rawText.substring(0, 200))

    // Try to parse and validate JSON
    let result
    try {
      result = JSON.parse(rawText)
    } catch (parseError) {
      console.error('Failed to parse JSON:', rawText)
      // Try to extract JSON from the response (sometimes wrapped in markdown)
      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Invalid JSON response from AI')
      }
    }

    console.log('Successfully parsed result:', JSON.stringify(result).substring(0, 100))

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Final Catch Error:', errorMessage)
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
