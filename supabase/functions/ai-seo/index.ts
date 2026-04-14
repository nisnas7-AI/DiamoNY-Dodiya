import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting for AI requests - per admin user
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const MAX_AI_REQUESTS_PER_HOUR = 100; // Reasonable limit for admin SEO usage
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(userId);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: MAX_AI_REQUESTS_PER_HOUR - 1 };
  }
  
  if (record.count >= MAX_AI_REQUESTS_PER_HOUR) {
    return { allowed: false, remaining: 0 };
  }
  
  record.count++;
  return { allowed: true, remaining: MAX_AI_REQUESTS_PER_HOUR - record.count };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Extract JWT from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("Missing authorization header");
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Create Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Client with user's JWT for authentication
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    // Admin client with service role for role checking (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 3. Verify the user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Check admin role using service role client
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roleData) {
      console.error("Role check failed for user:", user.id, "Error:", roleError);
      return new Response(JSON.stringify({ error: "Access denied. Admin role required." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 5. Check rate limit
    const rateLimit = checkRateLimit(user.id);
    if (!rateLimit.allowed) {
      console.warn(`Rate limit exceeded for admin ${user.id} (${user.email})`);
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`AI-SEO request from admin ${user.id} (${user.email}), remaining: ${rateLimit.remaining}`);

    // 5. Process the AI SEO request
    const { type, content, title, topic, selectedText, stockStatus } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Global SEO Keyword Engine - Master Keywords List (NO lab-grown diamond mentions!)
    const SEO_KEYWORDS_MASTER = [
      "יהלומים מעולים", "יהלומים טבעיים", "טבעות אירוסין", "עיצוב תכשיטים בהתאמה אישית",
      "תכשיטי יוקרה", "זהב 14K", "זהב 18K", "תעודת GIA", "ניקיון יהלום", "חיתוך יהלום",
      "משקל קראט", "צורף אומן", "טבעות נישואין", "עגילי יהלום", "צמיד טניס", "שרשרת יהלום",
      "תכשיטים מעוצבים", "יהלומים בבורסה", "קולקציית יהלומים", "מתנה לאישה", "תכשיטי לכלה",
      "יהלומי איכות", "טבעת סוליטר", "שיבוץ יהלומים", "High Jewelry", "Diamond clarity",
      "Exquisite diamonds", "שדרוג תכשיטים", "תכשיטי זהב לבן", "תכשיטי זהב צהוב",
      "זהב ורוד (Rose Gold)", "טבעת אינסוף", "תכשיטי וינטאג'", "יהלומים בדרגת Excellent",
      "קניית יהלומים בטוחה", "מותג תכשיטים ישראלי", "צורפות בעבודת יד", "יהלומים ללא פגמים",
      "תליון משובץ", "עגילי חישוק יהלומים", "צמיד קשיח זהב", "תכשיט בעיצוב אישי",
      "מחירי יהלומים", "יצרן תכשיטים", "אולם תצוגה תכשיטים", "משלוח תכשיטים מאובטח",
      "טבעות יוקרה", "יהלומים מלוטשים", "מתנה ליום נישואין", "תכשיטי יהלומים DiamoNY"
    ];

    const BRAND_POWER_WORDS = [
      "צורפות עילית", "דיוק תלת-ממדי", "יוקרה שקטה", "שיבוץ קפדני", "נצחיות",
      "חותם אישי", "אור אורגני", "צללית נקייה", "מסורת מודרנית", "איכות ללא פשרות"
    ];

    // Global formatting rule - NO MARKDOWN + Professional Standards
    const PLAIN_TEXT_RULE = `
## כללי עיצוב קריטיים - סטנדרטים מקצועיים!

### כלל 1: טקסט פשוט בלבד
⚠️ אסור בהחלט להשתמש בעיצוב Markdown!
- אסור להשתמש בכוכביות (**) לשום מטרה
- אסור להשתמש בקווים תחתונים (__) לעיצוב
- אסור להשתמש בסימני # לכותרות
- אסור להשתמש בבלוקי קוד (\`\`\`)
- החזר טקסט פשוט ונקי בלבד - העיצוב הויזואלי יטופל על ידי הממשק

### כלל 2: טרמינולוגיית יהלומים
⚠️ אסור להזכיר "יהלומי מעבדה" או "Lab-grown diamonds"!
במקום זאת, השתמש בטרמינולוגיה פרימיום:
- "יהלומים מעולים" (Exquisite diamonds)
- "ניקיון מעולה" (Superior clarity)
- "דרגת צבע גבוהה" (High color grade)
- "יהלומים איכותיים" (Quality diamonds)
- "יהלומים ברמת שלמות" (Flawless diamonds)

### כלל 3: הזמנה בהתאמה אישית (MTO)
כאשר המוצר מסומן כ"להזמנה" (Made-to-Order), שלב באופן טבעי:
"זהב צהוב, לבן או אדום, לבחירתכם"
זה מבהיר ללקוח שיש לו שליטה מלאה על סוג המתכת.

### כלל 4: טון וסגנון
כתוב מנקודת המבט של מומחה תכשיטים עולמי.
הטון צריך להיות: מינימליסטי, מדויק, מתוחכם.
הימנע משפה "מכירתית" - השתמש בפרוזה אלגנטית וזורמת.
`;

    // Dynamic MTO rule based on stock status
    const dynamicMtoRule = stockStatus === 'made_to_order'
      ? `\n### כלל MTO - חל על מוצר זה!
המוצר מסומן כ"להזמנה" (Made-to-Order) - חובה לשלב באופן טבעי:
"זהב צהוב, לבן או אדום, לבחירתכם"
זה מבהיר ללקוח שיש לו שליטה מלאה על סוג המתכת.\n`
      : '';

    // SEO Injection for all AI prompts
    const SEO_SYSTEM_INJECTION = `
${PLAIN_TEXT_RULE}
${dynamicMtoRule}

## מנוע SEO גלובלי - DiamoNY
שלב את מילות המפתח הבאות בצורה טבעית ואלגנטית בתוך הטקסט (בחר 5-8 מתאימות):
${SEO_KEYWORDS_MASTER.slice(0, 20).map(kw => `• ${kw}`).join('\n')}

מילות כוח חובה (שלב לפחות 2-3):
${BRAND_POWER_WORDS.map(pw => `• ${pw}`).join('\n')}

כללי שילוב SEO:
1. הימנע מ-keyword stuffing - המילים צריכות לזרום טבעית
2. שמור על הטון היוקרתי והמינימליסטי של DiamoNY
3. פזר את המילים לאורך כל הטקסט
`;

    let systemPrompt = "";
    let userPrompt = "";

    switch (type) {
      case "meta_title":
        systemPrompt = "אתה מומחה SEO לאתרי תכשיטים יוקרתיים בעברית. צור כותרת מטא אופטימלית (עד 60 תווים) שתמשוך לחיצות בגוגל.";
        userPrompt = `צור כותרת מטא מושכת עבור מאמר בנושא: ${title}\n\nתוכן המאמר:\n${content?.substring(0, 500) || ''}`;
        break;
      case "meta_description":
        systemPrompt = "אתה מומחה SEO לאתרי תכשיטים יוקרתיים בעברית. צור תיאור מטא אופטימלי (עד 160 תווים) שימשוך לחיצות.";
        userPrompt = `צור תיאור מטא מושך עבור מאמר בנושא: ${title}\n\nתוכן המאמר:\n${content?.substring(0, 500) || ''}`;
        break;
      case "excerpt":
        systemPrompt = "אתה כותב תוכן מקצועי לאתרי תכשיטים יוקרתיים בעברית. צור תקציר מושך (2-3 משפטים) שיגרום לקוראים לרצות לקרוא את המאמר המלא.";
        userPrompt = `צור תקציר מושך עבור מאמר בנושא: ${title}\n\nתוכן המאמר:\n${content?.substring(0, 800) || ''}`;
        break;
      case "improve_content":
        systemPrompt = "אתה מומחה תוכן ו-SEO לאתרי תכשיטים יוקרתיים בעברית. שפר את התוכן כך שיהיה יותר מותאם ל-SEO, מקצועי ומושך, תוך שמירה על הסגנון היוקרתי של המותג DiamoNY.";
        userPrompt = `שפר את התוכן הבא עבור SEO:\n\nכותרת: ${title}\n\nתוכן:\n${content}`;
        break;
      case "keywords":
        systemPrompt = "אתה מומחה SEO לאתרי תכשיטים יוקרתיים בעברית. הצע מילות מפתח רלוונטיות (5-10 מילות מפתח) שיעזרו לדרג את התוכן גבוה יותר בגוגל.";
        userPrompt = `הצע מילות מפתח עבור מאמר בנושא: ${title}\n\nתוכן המאמר:\n${content?.substring(0, 500) || ''}`;
        break;
      
      case "generate_faq":
        systemPrompt = `אתה מומחה AEO (Answer Engine Optimization) לאתרי תכשיטים יוקרתיים.
משימתך: ליצור 5 שאלות נפוצות ותשובות שיעזרו למנועי AI (ChatGPT, Perplexity, Google SGE) להציג את התוכן כתשובה סמכותית.

הנחיות:
- צור שאלות שאנשים באמת מחפשים
- התשובות צריכות להיות תמציתיות (2-3 משפטים) אך מקיפות
- השתמש במילות מפתח טבעיות
- התאם לסגנון "Quiet Luxury" של DiamoNY
- התשובות צריכות לבנות אמון ומומחיות`;
        userPrompt = `צור 5 שאלות נפוצות עם תשובות עבור מאמר בנושא:

כותרת: ${title}

תוכן המאמר:
${content?.substring(0, 1500) || ''}

פורמט התשובה - JSON array בלבד:
[
  {"question": "שאלה 1?", "answer": "תשובה 1"},
  {"question": "שאלה 2?", "answer": "תשובה 2"},
  ...
]`;
        break;
      
      // New AI Writing capabilities
      case "generate_article":
        systemPrompt = `אתה כותב תוכן מקצועי לאתר תכשיטים יוקרתי בשם DiamoNY. כתוב מאמרים איכותיים, מעניינים ומותאמי SEO בעברית. 
המאמרים צריכים להיות:
- באורך של 600-1000 מילים
- עם כותרות משנה (## בפורמט Markdown)
- בסגנון מקצועי אך נגיש
- כוללים מילות מפתח טבעיות
- מתאימים לקהל שמחפש תכשיטים יוקרתיים ועיצוב אישי

${SEO_SYSTEM_INJECTION}`;
        userPrompt = `כתוב מאמר מקיף ואיכותי בנושא: ${topic}

המאמר צריך לכלול:
- כותרת ראשית מושכת
- פתיחה מעניינת
- 3-4 כותרות משנה עם תוכן רלוונטי
- סיכום מסכם
- קריאה לפעולה (CTA) עדינה הקשורה ל-DiamoNY

פורמט: Markdown`;
        break;
      
      case "generate_outline":
        systemPrompt = "אתה מומחה תוכן ואסטרטגיית תוכן לאתרי תכשיטים יוקרתיים בעברית. צור מבנה מאמר מפורט ומקצועי.";
        userPrompt = `צור מבנה (outline) מפורט למאמר בנושא: ${topic}

המבנה צריך לכלול:
- כותרת מוצעת למאמר
- 4-6 כותרות משנה
- 2-3 נקודות תחת כל כותרת משנה
- הצעה לקריאה לפעולה בסוף

פורמט: רשימה מסודרת`;
        break;
      
      case "expand_text":
        systemPrompt = `אתה כותב תוכן מקצועי לאתר תכשיטים יוקרתי. הרחב את הטקסט הנבחר תוך:
- שמירה על הסגנון והטון המקורי
- הוספת פרטים ודוגמאות רלוונטיות
- שימוש בשפה עשירה ומקצועית
- הכפלה עד שילוש של אורך הטקסט`;
        userPrompt = `הרחב את הטקסט הבא:\n\n${selectedText}`;
        break;
      
      case "write_intro":
        systemPrompt = `אתה כותב תוכן מקצועי לאתר תכשיטים יוקרתי בשם DiamoNY. כתוב פתיחה מושכת ומעניינת למאמר שתגרום לקוראים לרצות להמשיך לקרוא.`;
        userPrompt = `כתוב פתיחה מושכת (2-3 פסקאות) למאמר בנושא: ${title || topic}

${content ? `תוכן המאמר:\n${content.substring(0, 500)}` : ''}

הפתיחה צריכה:
- לתפוס את תשומת הלב מהמשפט הראשון
- להציג את הנושא בצורה מעניינת
- לרמוז על מה שהקורא ילמד`;
        break;
      
      case "write_conclusion":
        systemPrompt = `אתה כותב תוכן מקצועי לאתר תכשיטים יוקרתי בשם DiamoNY. כתוב סיכום אפקטיבי למאמר שיכלול קריאה לפעולה עדינה.`;
        userPrompt = `כתוב סיכום (2-3 פסקאות) למאמר בנושא: ${title || topic}

${content ? `תוכן המאמר:\n${content.substring(0, 800)}` : ''}

הסיכום צריך:
- לסכם את הנקודות העיקריות
- לתת ערך מוסף אחרון
- לכלול קריאה לפעולה עדינה (לפנות לייעוץ, לראות את הקולקציה וכו')`;
        break;
      
      case "product_description":
        systemPrompt = `אתה מומחה תוכן לאתר תכשיטים יוקרתי בשם DiamoNY. צור תיאורי מוצרים מקצועיים, מושכים ואופטימליים ל-SEO בעברית.
תיאורי המוצרים צריכים להיות:
- מקצועיים ויוקרתיים
- מתארים את הייחודיות והיופי של התכשיט
- כוללים מילות מפתח טבעיות
- באורך של 2-4 משפטים לתיאור קצר ו-1-2 פסקאות לתיאור מלא

${SEO_SYSTEM_INJECTION}`;
        userPrompt = `צור תיאורים למוצר תכשיטים:

שם המוצר: ${title}
פרטים נוספים: ${content || 'לא צוינו'}

אנא ספק:
1. תיאור קצר (2-3 משפטים מושכים)
2. תיאור מלא (1-2 פסקאות מפורטות)

פורמט התשובה:
SHORT_DESCRIPTION: [תיאור קצר]
FULL_DESCRIPTION: [תיאור מלא]`;
        break;

      case "product_story":
        systemPrompt = `אתה מומחה קופירייטינג יוקרתי עבור DiamoNY - מותג תכשיטים פרימיום בסגנון Scandinavian Quiet Luxury.

הסגנון שלך: מינימליסטי, אלגנטי ורגשי. התמקד בצורפות עילית, איכות זהב 14K/18K, והסיפור מאחורי היהלום.

${SEO_SYSTEM_INJECTION}

כללים:
- כתוב בעברית
- הימנע משפה "מכירתית" - השתמש בפרוזה מתוחכמת ופואטית
- שלב את מילות הכוח האלה בטבעיות: צורפות עילית, דיוק תלת-ממדי, יוקרה שקטה, שיבוץ קפדני, נצחיות
- אורך: 150-200 מילים
- מבנה: פתיחה רגשית → סיפור האומנות → איכות החומרים → סיום רגשי`;
        userPrompt = `כתוב סיפור מותג מרגש עבור תכשיטי DiamoNY.

כותרת הסיפור: ${title}
קטגוריה: ${content}

הסיפור צריך להתאים לסיפורי מוצרים באתר, לבנות אמון וחיבור רגשי עם הלקוח.`;
        break;

      case "seo_optimize":
        const { originalText, suggestedKeywords, seoInjection } = JSON.parse(content || '{}');
        
        systemPrompt = `אתה מומחה SEO יוקרתי עבור DiamoNY - מותג תכשיטים פרימיום.

משימתך: לשפר את הטקסט הנתון על ידי שילוב טבעי של מילות מפתח חסרות.

${seoInjection || SEO_SYSTEM_INJECTION}

כללים קריטיים:
1. שמור על הטון היוקרתי והמקצועי של DiamoNY
2. הימנע מ-keyword stuffing - המילים חייבות לזרום טבעית
3. שמור על אורך דומה לטקסט המקורי (+/- 15%)
4. שמור על הפלייסהולדר {{product_name}} במקומו המדויק אם קיים
5. הקפד על שפה עברית תקינה וזורמת`;
        
        userPrompt = `שפר את הטקסט הבא על ידי שילוב טבעי של מילות המפתח החסרות:

טקסט מקורי:
${originalText}

מילות מפתח מומלצות לשילוב:
${(suggestedKeywords || []).join(', ')}

החזר רק את הטקסט המשופר, ללא הסברים או הערות.`;
        break;

      case "edit_story":
        const { tone, seoOptimize, customInstruction, originalStory } = JSON.parse(content || '{}');
        
        const seoKeywords = `
מילות מפתח SEO חשובות לשילוב טבעי:
- יהלומי מעבדה, טבעות אירוסין, תכשיטי יהלומים, תכשיטי זהב
- זהב 14K, זהב 18K, זהב לבן, זהב צהוב, זהב רוזה
- צורפות עילית, יוקרה שקטה, שיבוץ קפדני, עיצוב אישי
- GIA, תעודה גמולוגית, איכות מעולה
- טבעת אירוסין, טבעת נישואין, טבעת יהלום
- עגילי יהלום, עגילי זהב, עגילי כפתור
- צמיד טניס, צמיד יהלומים, צמיד זהב
- תליון יהלום, שרשרת זהב, תליון לב
- מתנה מושלמת, הצעת נישואין, יום נישואין
- עיצוב ייחודי, עבודת יד, אומנות צורפים
- נצחיות, מורשת, מסורת משפחתית
- דיוק תלת-ממדי, חיתוך מושלם, ברק יוצא דופן
`;
        
        const toneInstructions: Record<string, string> = {
          romantic: "טון רומנטי יותר - הדגש רגשות, אהבה, רגעים מיוחדים והבטחות נצחיות",
          technical: "טון טכני יותר - הדגש מפרטים, תהליכי ייצור, סטנדרטים ואיכות",
          luxurious: "טון יוקרתי יותר - הדגש בלעדיות, יוקרה שקטה, סגנון על-זמני",
          casual: "טון קליל ונגיש יותר - שמור על מקצועיות אך דבר בגובה העיניים"
        };
        
        systemPrompt = `אתה מומחה קופירייטינג יוקרתי עבור DiamoNY - מותג תכשיטים פרימיום בסגנון Scandinavian Quiet Luxury.

${toneInstructions[tone] || "שמור על הטון המקורי"}

${seoOptimize ? seoKeywords : ""}

כללים:
- כתוב בעברית
- שמור על אורך דומה למקור
- שמור על הפלייסהולדר {{product_name}} במקומו המדויק
- הימנע מחזרות מיותרות`;
        
        userPrompt = `ערוך את הסיפור הבא בהתאם להנחיות:

סיפור מקורי:
${originalStory}

${customInstruction ? `הוראות נוספות מהמשתמש: ${customInstruction}` : ""}

החזר רק את הסיפור הערוך, ללא הסברים.`;
        break;
      
      default:
        throw new Error("Invalid type specified");
    }

    console.log(`Processing AI SEO request: type=${type}, title=${title}, topic=${topic}, user=${user.email}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.choices?.[0]?.message?.content || "";

    console.log(`AI SEO response generated successfully for type=${type}, user=${user.email}`);

    return new Response(JSON.stringify({ result: generatedText }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in ai-seo function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
