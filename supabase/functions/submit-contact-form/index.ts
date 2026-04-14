import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// reCAPTCHA verification
const RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";
const RECAPTCHA_THRESHOLD = 0.5; // Minimum score to pass for public contact forms

async function verifyRecaptcha(token: string, clientIP: string): Promise<{ success: boolean; score?: number; errorCodes?: string[] }> {
  const secretKey = Deno.env.get("RECAPTCHA_SECRET_KEY");
  if (!secretKey) {
    console.error("[reCAPTCHA] RECAPTCHA_SECRET_KEY not configured");
    return { success: false };
  }

  try {
    const response = await fetch(RECAPTCHA_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${secretKey}&response=${token}`,
    });

    const data = await response.json();
    const passed = data.success && data.score >= RECAPTCHA_THRESHOLD;
    
    // Enhanced logging with all relevant details
    console.log(`[reCAPTCHA] Contact form verification:
  - IP: ${clientIP}
  - Success: ${data.success}
  - Score: ${data.score}
  - Threshold: ${RECAPTCHA_THRESHOLD}
  - Passed: ${passed}
  - Action: ${data.action || "unknown"}
  - Hostname: ${data.hostname || "unknown"}`);
    
    if (!data.success) {
      console.error(`[reCAPTCHA FAILED] IP: ${clientIP}, Error codes: ${data["error-codes"]?.join(", ")}`);
      return { success: false, errorCodes: data["error-codes"] };
    }

    if (!passed) {
      console.warn(`[reCAPTCHA BLOCKED] IP: ${clientIP}, Score: ${data.score} < Threshold: ${RECAPTCHA_THRESHOLD}`);
    }
    
    // v3 returns a score between 0.0 and 1.0
    return { success: passed, score: data.score };
  } catch (error) {
    console.error("[reCAPTCHA] Verification exception:", error);
    return { success: false };
  }
}

// In-memory rate limiting (per IP, resets on function cold start)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const MAX_REQUESTS_PER_HOUR = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  
  if (record.count >= MAX_REQUESTS_PER_HOUR) {
    return false;
  }
  
  record.count++;
  return true;
}

// Honeypot validation - bots will fill hidden fields
function isHoneypotTriggered(honeypot_website?: string, honeypot_fax?: string): boolean {
  // If either honeypot field has a value, it's a bot
  if (honeypot_website && honeypot_website.trim().length > 0) {
    return true;
  }
  if (honeypot_fax && honeypot_fax.trim().length > 0) {
    return true;
  }
  return false;
}

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone validation - only digits and common phone chars
const phoneRegex = /^[\d\-\+\s\(\)]*$/;

// Allowed values for jewelry fields
const ALLOWED_JEWELRY_TYPES = ['engagement_ring', 'wedding_ring', 'bracelet', 'earrings', 'necklace', 'pendant', 'custom_design', 'other'];
const ALLOWED_METAL_TYPES = ['yellow_14k', 'yellow_18k', 'white_14k', 'white_18k', 'rose_14k', 'rose_18k', 'platinum'];
const ALLOWED_BUDGET_RANGES = ['under_5k', '5k_10k', '10k_20k', '20k_50k', 'over_50k'];

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP for rate limiting
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("cf-connecting-ip") || 
                     "unknown";

    console.log(`Contact form submission from IP: ${clientIP}`);

    // Check rate limit
    if (!checkRateLimit(clientIP)) {
      console.log(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: "יותר מדי ניסיונות. נסו שוב מאוחר יותר." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { 
      name, 
      email, 
      phone, 
      message, 
      privacyConsent, 
      marketingConsent,
      source, // Source field to identify exit_popup vs contact_form
      // Honeypot fields (should be empty for real users)
      honeypot_website,
      honeypot_fax,
      // UTM fields
      utm_source,
      utm_campaign,
      utm_medium,
      referral_source,
      landing_page,
      // Jewelry preference fields
      jewelry_interest_type,
      estimated_budget,
      metal_preference,
      ring_size,
      event_target_date,
    } = body;

    // Extract reCAPTCHA token
    const recaptchaToken = body.recaptchaToken;
    
    // Verify reCAPTCHA if token provided
    if (recaptchaToken) {
      const recaptchaResult = await verifyRecaptcha(recaptchaToken, clientIP);
      if (!recaptchaResult.success) {
        return new Response(
          JSON.stringify({ error: "אימות האבטחה נכשל. נא לנסות שוב." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      // Log warning but don't block - for backwards compatibility
      console.warn(`[reCAPTCHA] No token provided from IP: ${clientIP}`);
    }

    // Check honeypot fields - if filled, silently reject (bot detected)
    if (isHoneypotTriggered(honeypot_website, honeypot_fax)) {
      console.log(`Bot detected via honeypot from IP: ${clientIP}`);
      // Return success to not alert the bot, but don't store anything
      return new Response(
        JSON.stringify({ success: true, message: "ההודעה נשלחה בהצלחה" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine if this is from exit popup (relaxed validation for message)
    const isExitPopup = source === "exit_popup";

    // Server-side validation
    // Name validation
    if (!name || typeof name !== "string") {
      return new Response(
        JSON.stringify({ error: "שם הוא שדה חובה" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 100) {
      return new Response(
        JSON.stringify({ error: "שם חייב להכיל בין 2 ל-100 תווים" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Email validation
    if (!email || typeof email !== "string") {
      return new Response(
        JSON.stringify({ error: "אימייל הוא שדה חובה" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const trimmedEmail = email.trim().toLowerCase();
    if (!emailRegex.test(trimmedEmail) || trimmedEmail.length > 255) {
      return new Response(
        JSON.stringify({ error: "כתובת אימייל לא תקינה" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Phone validation (optional)
    let sanitizedPhone: string | null = null;
    if (phone && typeof phone === "string") {
      const trimmedPhone = phone.trim();
      if (trimmedPhone.length > 0) {
        if (!phoneRegex.test(trimmedPhone) || trimmedPhone.length > 20) {
          return new Response(
            JSON.stringify({ error: "מספר טלפון לא תקין" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        sanitizedPhone = trimmedPhone.substring(0, 20);
      }
    }

    // Message validation - relaxed for exit popup (auto-generated message)
    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "הודעה היא שדה חובה" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const trimmedMessage = message.trim();
    const minMessageLength = isExitPopup ? 1 : 10; // Relaxed for exit popup
    if (trimmedMessage.length < minMessageLength || trimmedMessage.length > 2000) {
      return new Response(
        JSON.stringify({ error: isExitPopup ? "הודעה לא תקינה" : "הודעה חייבת להכיל בין 10 ל-2000 תווים" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Privacy consent validation
    if (privacyConsent !== true) {
      return new Response(
        JSON.stringify({ error: "יש לאשר את מדיניות הפרטיות" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sanitize optional jewelry fields
    const sanitizedJewelryType = jewelry_interest_type && ALLOWED_JEWELRY_TYPES.includes(jewelry_interest_type) 
      ? jewelry_interest_type : null;
    const sanitizedMetalType = metal_preference && ALLOWED_METAL_TYPES.includes(metal_preference)
      ? metal_preference : null;
    const sanitizedBudget = estimated_budget && ALLOWED_BUDGET_RANGES.includes(estimated_budget)
      ? estimated_budget : null;
    const sanitizedRingSize = ring_size && typeof ring_size === "string" 
      ? ring_size.trim().substring(0, 10) : null;
    
    // Validate event target date if provided
    let sanitizedEventDate: string | null = null;
    if (event_target_date && typeof event_target_date === "string") {
      const dateMatch = event_target_date.match(/^\d{4}-\d{2}-\d{2}$/);
      if (dateMatch) {
        sanitizedEventDate = event_target_date;
      }
    }

    // Sanitize UTM fields (max 255 chars each)
    const sanitizedUtmSource = utm_source && typeof utm_source === "string" 
      ? utm_source.substring(0, 255) : null;
    const sanitizedUtmCampaign = utm_campaign && typeof utm_campaign === "string" 
      ? utm_campaign.substring(0, 255) : null;
    const sanitizedUtmMedium = utm_medium && typeof utm_medium === "string" 
      ? utm_medium.substring(0, 255) : null;
    const sanitizedReferralSource = referral_source && typeof referral_source === "string" 
      ? referral_source.substring(0, 500) : null;
    const sanitizedLandingPage = landing_page && typeof landing_page === "string" 
      ? landing_page.substring(0, 255) : null;

    // Create Supabase client with service role for inserting
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date().toISOString();
    const isMarketingConsent = marketingConsent === true;

    // Insert lead with sanitized data including new fields
    const { data, error } = await supabase.from("leads").insert({
      name: trimmedName.substring(0, 100),
      email: trimmedEmail.substring(0, 255),
      phone: sanitizedPhone,
      message: trimmedMessage.substring(0, 2000),
      consent_privacy_policy: true,
      consent_privacy_timestamp: now,
      consent_marketing_timestamp: isMarketingConsent ? now : null,
      ip_address: clientIP !== "unknown" ? clientIP : null,
      // UTM tracking fields
      utm_source: sanitizedUtmSource,
      utm_campaign: sanitizedUtmCampaign,
      utm_medium: sanitizedUtmMedium,
      referral_source: sanitizedReferralSource,
      landing_page: sanitizedLandingPage,
      // Jewelry preference fields
      jewelry_interest_type: sanitizedJewelryType,
      estimated_budget: sanitizedBudget,
      metal_preference: sanitizedMetalType,
      ring_size: sanitizedRingSize,
      event_target_date: sanitizedEventDate,
      // Source tracking - use provided source or default to contact_form
      source: isExitPopup ? "exit_popup" : "contact_form",
      form_completed_at: now,
    }).select();

    if (error) {
      console.error("Database insert error:", error);
      return new Response(
        JSON.stringify({ error: "שגיאה בשמירת ההודעה" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Lead created successfully for email: ${trimmedEmail}, source: contact_form, utm_source: ${sanitizedUtmSource}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "ההודעה נשלחה בהצלחה",
        marketingConsent: isMarketingConsent 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "שגיאה בלתי צפויה" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
