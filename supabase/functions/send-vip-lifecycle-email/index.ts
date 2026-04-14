import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const sanitize = (val: unknown, max = 200): string => {
  if (!val || typeof val !== "string") return "";
  return val.trim().slice(0, max).replace(/<[^>]*>/g, "").replace(/[<>&"']/g, "");
};

const validateEmail = (e: unknown): boolean => {
  if (!e || typeof e !== "string") return false;
  return e.length <= 255 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
};

const BASE_URL = "https://diamony.me";

function buildT21Html(customerName: string, eventName: string): string {
  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>מתנה אישית מ-DiamoNY</title>
  <style>
    body{font-family:'Heebo','Arial',sans-serif;line-height:1.8;color:#2d2d2d;background-color:#f8f7f5;margin:0;padding:0;direction:rtl}
    .container{max-width:600px;margin:0 auto;background:#fff}
    .header{text-align:center;padding:40px 30px;background:#1a1a1a}
    .logo{max-width:180px;height:auto}
    .content{padding:40px 30px}
    .greeting{font-size:20px;color:#1a1a1a;margin-bottom:24px}
    .paragraph{font-size:16px;color:#4a4a4a;margin-bottom:20px;line-height:1.8}
    .cta-button{display:inline-block;background:#c4a35a;color:#fff!important;text-decoration:none;padding:16px 40px;font-size:16px;font-weight:bold;margin:32px 0;border-radius:2px}
    .signature{margin-top:40px;padding-top:24px;border-top:1px solid #eee}
    .signature-name{font-weight:bold;color:#1a1a1a;margin-bottom:4px}
    .signature-title{color:#666;font-size:14px}
    .footer{text-align:center;padding:24px;font-size:12px;color:#999;background:#1a1a1a}
    .footer a{color:#c4a35a;text-decoration:none}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${BASE_URL}/diamony-logo-email-white.png" alt="DiamoNY" class="logo" />
    </div>
    <div class="content">
      <p class="greeting">שלום ${customerName},</p>
      <p class="paragraph">שמנו לב ש${eventName} שלך מתקרב. ב-DiamoNY אנחנו מאמינים שרגעים מיוחדים דורשים חותם נצחי.</p>
      <p class="paragraph">כחבר/ת VIP, הכנו עבורך הטבה בלעדית לקראת התאריך המרגש. נשמח לארח אותך בטרקלין שלנו או לסייע לך אישית בדיגיטל לבחירת התכשיט המושלם.</p>
      <div style="text-align:center">
        <a href="${BASE_URL}/catalog" class="cta-button">לצפייה בקולקציה ←</a>
      </div>
      <div class="signature">
        <p class="signature-name">יעקובי ניצן</p>
        <p class="signature-title">וצוות DiamoNY</p>
      </div>
    </div>
    <div class="footer">
      <p style="color:#999;margin:0 0 8px 0">© 2025 DiamoNY. כל הזכויות שמורות.</p>
      <p style="margin:0"><a href="${BASE_URL}/privacy-policy">מדיניות פרטיות</a></p>
    </div>
  </div>
</body>
</html>`;
}

function buildT14Html(customerName: string, eventName: string, storeCredit: number): string {
  const creditBlock = storeCredit > 0
    ? `<p class="paragraph" style="background:#f8f7f5;border-right:4px solid #c4a35a;padding:20px;margin:24px 0">בנוסף להטבה, עומד לרשותך קרדיט אישי על סך <strong style="color:#c4a35a">${storeCredit.toLocaleString("he-IL")} ש״ח</strong> למימוש בחנות.</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>תזכורת: ההטבה שלך מחכה</title>
  <style>
    body{font-family:'Heebo','Arial',sans-serif;line-height:1.8;color:#2d2d2d;background-color:#f8f7f5;margin:0;padding:0;direction:rtl}
    .container{max-width:600px;margin:0 auto;background:#fff}
    .header{text-align:center;padding:40px 30px;background:#1a1a1a}
    .logo{max-width:180px;height:auto}
    .content{padding:40px 30px}
    .greeting{font-size:20px;color:#1a1a1a;margin-bottom:24px}
    .paragraph{font-size:16px;color:#4a4a4a;margin-bottom:20px;line-height:1.8}
    .cta-button{display:inline-block;background:#c4a35a;color:#fff!important;text-decoration:none;padding:16px 40px;font-size:16px;font-weight:bold;margin:32px 0;border-radius:2px}
    .signature{margin-top:40px;padding-top:24px;border-top:1px solid #eee}
    .signature-name{font-weight:bold;color:#1a1a1a;margin-bottom:4px}
    .signature-title{color:#666;font-size:14px}
    .footer{text-align:center;padding:24px;font-size:12px;color:#999;background:#1a1a1a}
    .footer a{color:#c4a35a;text-decoration:none}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${BASE_URL}/diamony-logo-email-white.png" alt="DiamoNY" class="logo" />
    </div>
    <div class="content">
      <p class="greeting">היי ${customerName},</p>
      <p class="paragraph">רק רצינו להזכיר שההטבה האישית שלך לקראת ${eventName} זמינה למימוש.</p>
      ${creditBlock}
      <p class="paragraph">הקולקציות החדשות שלנו מחכות לך.</p>
      <div style="text-align:center">
        <a href="${BASE_URL}/catalog" class="cta-button">לצפייה בקולקציה ←</a>
      </div>
      <div class="signature">
        <p class="signature-name">יעקובי ניצן</p>
        <p class="signature-title">וצוות DiamoNY</p>
      </div>
    </div>
    <div class="footer">
      <p style="color:#999;margin:0 0 8px 0">© 2025 DiamoNY. כל הזכויות שמורות.</p>
      <p style="margin:0"><a href="${BASE_URL}/privacy-policy">מדיניות פרטיות</a></p>
    </div>
  </div>
</body>
</html>`;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate admin auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const userId = userData.user.id;

    // Check admin role using service role client
    const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: roleData } = await serviceClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
    }

    // Parse & validate input
    const body = await req.json();
    const { customerEmail, customerName, eventName, storeCredit, templateType } = body;

    if (!validateEmail(customerEmail)) {
      return new Response(JSON.stringify({ error: "Invalid email" }), { status: 400, headers: corsHeaders });
    }
    if (!templateType || !["t21", "t14"].includes(templateType)) {
      return new Response(JSON.stringify({ error: "Invalid templateType" }), { status: 400, headers: corsHeaders });
    }

    const safeName = sanitize(customerName, 100);
    const safeEvent = sanitize(eventName, 100);
    const safeCredit = typeof storeCredit === "number" ? Math.max(0, storeCredit) : 0;
    const email = (customerEmail as string).trim().toLowerCase();

    // Build email
    const isT21 = templateType === "t21";
    const subject = isT21
      ? `מתנה אישית מ-DiamoNY לקראת ${safeEvent} שלך`
      : `תזכורת: ההטבה שלך ל${safeEvent} מחכה`;

    const html = isT21
      ? buildT21Html(safeName, safeEvent)
      : buildT14Html(safeName, safeEvent, safeCredit);

    const emailResponse = await resend.emails.send({
      from: "DiamoNY <onboarding@resend.dev>",
      to: [email],
      subject,
      html,
    });

    console.log(`[VIP Lifecycle] ${templateType} email sent to ${email}:`, emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("[VIP Lifecycle] Error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
