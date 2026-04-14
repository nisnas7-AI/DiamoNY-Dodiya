import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  name: string;
  email: string;
}

// Input validation helpers
const sanitizeName = (name: string | undefined | null): string => {
  if (!name || typeof name !== 'string') return '';
  // Trim whitespace, limit to 100 characters, remove HTML tags and special chars
  return name
    .trim()
    .slice(0, 100)
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>&"']/g, ''); // Remove potentially dangerous characters
};

const validateEmail = (email: string | undefined | null): boolean => {
  if (!email || typeof email !== 'string') return false;
  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return email.length <= 255 && emailRegex.test(email.trim());
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const body = await req.json();
    const rawEmail = body?.email;
    const rawName = body?.name;

    // Validate email
    if (!validateEmail(rawEmail)) {
      throw new Error("Valid email is required");
    }

    // Sanitize inputs
    const email = rawEmail.trim().toLowerCase();
    const name = sanitizeName(rawName);

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch email settings from database
    const { data: settings } = await supabase
      .from("welcome_email_settings")
      .select("*")
      .eq("is_active", true)
      .limit(1)
      .single();

    // Use defaults if no settings found
    const emailSettings = settings || {
      subject_line: "ברוכים הבאים ל-DiamoNY ✨ | העיצוב הבא שלך מתחיל כאן",
      greeting_template: "היי {{name}},",
      greeting_fallback: "שלום רב,",
      intro_text: "תודה שבחרת להצטרף למועדון הלקוחות של DiamoNY. עבורי, תכשיט הוא הרבה יותר מזהב ויהלומים – הוא ביטוי אישי, זיכרון שנשמר לנצח, ויצירת אומנות שמספרת את הסיפור שלך.",
      designer_message: "כמעצב, המטרה שלי היא להביא לך את השילוב המדויק שבין עיצוב על-זמני לבין הטרנדים הכי חמים בעולם התכשיטנות.",
      benefits_title: "מה מחכה לך כאן?",
      benefits_text: "כחלק מהקהילה שלנו, תהיו הראשונים להיחשף לקולקציות חדשות, לקבל השראה לעיצובים מיוחדים, וליהנות מהטבות השמורות לחברים בלבד.",
      privacy_note: "אני מכבד את הזמן והפרטיות שלך (בדיוק כפי שהתחייבתי באתר), ולכן אדאג לשלוח לך רק תוכן בעל ערך, יופי והשראה.",
      gift_title: "מתנה קטנה להתחלה נוצצת",
      gift_text: "כדי לחגוג את הצטרפותך, אני מזמין אותך ליהנות מ-10% הנחה ברכישה הראשונה שלך.",
      coupon_code: "WELCOME10",
      cta_button_text: "לצפייה בקולקציה החדשה",
      cta_button_url: "/catalog",
      signature_name: "יעקובי ניצן",
      signature_title: "וצוות DiamoNY",
      instagram_url: "https://instagram.com",
      facebook_url: "https://facebook.com",
    };

    // Build personalized greeting
    const greeting = name && name.trim() 
      ? emailSettings.greeting_template.replace("{{name}}", name.trim())
      : emailSettings.greeting_fallback;

    // Build full URL for CTA
    const baseUrl = "https://diamony.me";
    const ctaUrl = emailSettings.cta_button_url.startsWith("http") 
      ? emailSettings.cta_button_url 
      : `${baseUrl}${emailSettings.cta_button_url}`;

    // Generate HTML email
    const htmlEmail = `
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${emailSettings.subject_line}</title>
  <style>
    body {
      font-family: 'Heebo', 'Arial', sans-serif;
      line-height: 1.8;
      color: #2d2d2d;
      background-color: #f8f7f5;
      margin: 0;
      padding: 0;
      direction: rtl;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      text-align: center;
      padding: 40px 30px;
      background-color: #1a1a1a;
    }
    .logo {
      max-width: 180px;
      height: auto;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 20px;
      color: #1a1a1a;
      margin-bottom: 24px;
    }
    .paragraph {
      font-size: 16px;
      color: #4a4a4a;
      margin-bottom: 20px;
      line-height: 1.8;
    }
    .section-title {
      font-size: 18px;
      font-weight: bold;
      color: #1a1a1a;
      margin-top: 32px;
      margin-bottom: 12px;
    }
    .gift-box {
      background-color: #f8f7f5;
      border-right: 4px solid #c4a35a;
      padding: 24px;
      margin: 32px 0;
    }
    .coupon-code {
      display: inline-block;
      background-color: #1a1a1a;
      color: #c4a35a;
      padding: 12px 24px;
      font-size: 18px;
      font-weight: bold;
      letter-spacing: 2px;
      margin-top: 12px;
    }
    .cta-button {
      display: inline-block;
      background-color: #c4a35a;
      color: #ffffff;
      text-decoration: none;
      padding: 16px 40px;
      font-size: 16px;
      font-weight: bold;
      margin: 32px 0;
      border-radius: 2px;
    }
    .cta-button:hover {
      background-color: #b39349;
    }
    .signature {
      margin-top: 40px;
      padding-top: 24px;
      border-top: 1px solid #eee;
    }
    .signature-name {
      font-weight: bold;
      color: #1a1a1a;
      margin-bottom: 4px;
    }
    .signature-title {
      color: #666;
      font-size: 14px;
    }
    .social-links {
      text-align: center;
      padding: 24px;
      background-color: #f8f7f5;
    }
    .social-links a {
      display: inline-block;
      margin: 0 8px;
    }
    .social-icon {
      width: 32px;
      height: 32px;
    }
    .footer {
      text-align: center;
      padding: 24px;
      font-size: 12px;
      color: #999;
      background-color: #1a1a1a;
    }
    .footer a {
      color: #c4a35a;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header with Logo -->
    <div class="header">
      <img src="https://diamony.me/diamony-logo-email-white.png" alt="DiamoNY" class="logo" />
    </div>

    <!-- Main Content -->
    <div class="content">
      <p class="greeting">${greeting}</p>
      
      <p class="paragraph">${emailSettings.intro_text}</p>
      
      <p class="paragraph">${emailSettings.designer_message}</p>

      <p class="section-title">${emailSettings.benefits_title}</p>
      <p class="paragraph">${emailSettings.benefits_text}</p>
      
      <p class="paragraph">${emailSettings.privacy_note}</p>

      <!-- Gift Section -->
      <div class="gift-box">
        <p class="section-title" style="margin-top: 0;">${emailSettings.gift_title}</p>
        <p class="paragraph" style="margin-bottom: 12px;">${emailSettings.gift_text}</p>
        ${emailSettings.coupon_code ? `<span class="coupon-code">${emailSettings.coupon_code}</span>` : ''}
      </div>

      <!-- CTA Button -->
      <div style="text-align: center;">
        <a href="${ctaUrl}" class="cta-button">${emailSettings.cta_button_text} ←</a>
      </div>

      <!-- Signature -->
      <div class="signature">
        <p class="signature-name">${emailSettings.signature_name}</p>
        <p class="signature-title">${emailSettings.signature_title}</p>
      </div>
    </div>

    <!-- Social Links -->
    <div class="social-links">
      <p style="margin: 0 0 12px 0; color: #666; font-size: 14px;">עקבו אחרינו לעוד השראות</p>
      <a href="${emailSettings.instagram_url}" target="_blank">
        <svg class="social-icon" viewBox="0 0 24 24" fill="#1a1a1a">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      </a>
      <a href="${emailSettings.facebook_url}" target="_blank">
        <svg class="social-icon" viewBox="0 0 24 24" fill="#1a1a1a">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      </a>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p style="color: #999; margin: 0 0 8px 0;">© 2025 DiamoNY. כל הזכויות שמורות.</p>
      <p style="margin: 0;">
        <a href="${baseUrl}/privacy-policy">מדיניות פרטיות</a> | 
        <a href="mailto:nisnas7@gmail.com">הסרה מרשימת הדיוור</a>
      </p>
    </div>
  </div>
</body>
</html>
    `;

    // Send the email
    const emailResponse = await resend.emails.send({
      from: "DiamoNY <onboarding@resend.dev>",
      to: [email],
      subject: emailSettings.subject_line,
      html: htmlEmail,
    });

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error in send-welcome-email function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
