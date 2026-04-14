import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

// Route-based thresholds
const RECAPTCHA_THRESHOLD_DEFAULT = 0.3;
const RECAPTCHA_THRESHOLD_ADMIN = 0.3;

/**
 * Check if the request is from an authenticated admin user
 * If so, bypass reCAPTCHA verification entirely
 */
async function isAuthenticatedAdmin(authHeader: string | null): Promise<{ isAdmin: boolean; userId?: string }> {
  if (!authHeader?.startsWith("Bearer ")) {
    return { isAdmin: false };
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify the JWT and get claims
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims?.sub) {
      console.log("Admin bypass check: Invalid JWT");
      return { isAdmin: false };
    }

    const userId = claimsData.claims.sub;

    // Check if user has admin role using service role client
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: roleData, error: roleError } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError) {
      console.log("Admin bypass check: Role lookup error", roleError.message);
      return { isAdmin: false };
    }

    const isAdmin = !!roleData;
    console.log(`Admin bypass check: userId=${userId}, isAdmin=${isAdmin}`);
    
    return { isAdmin, userId };
  } catch (error) {
    console.error("Admin bypass check error:", error);
    return { isAdmin: false };
  }
}

/**
 * Determine the appropriate threshold based on action type
 */
function getThresholdForAction(action?: string): { threshold: number; isAdminRoute: boolean } {
  // Admin routes use lower threshold
  if (action?.startsWith("admin_") || action === "admin_login" || action === "admin_action") {
    return { threshold: RECAPTCHA_THRESHOLD_ADMIN, isAdminRoute: true };
  }
  return { threshold: RECAPTCHA_THRESHOLD_DEFAULT, isAdminRoute: false };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("cf-connecting-ip") || 
                     "unknown";

    const { token, action } = await req.json();

    // Check for authenticated admin bypass
    const { isAdmin, userId } = await isAuthenticatedAdmin(authHeader);
    
    if (isAdmin) {
      console.log(`[reCAPTCHA BYPASS] Authenticated admin user: ${userId}`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          score: 1.0,
          action: action || "admin_bypass",
          bypass: true,
          reason: "authenticated_admin"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const secretKey = Deno.env.get("RECAPTCHA_SECRET_KEY");

    if (!secretKey) {
      console.error("RECAPTCHA_SECRET_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Token is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify token with Google
    const verificationResponse = await fetch(RECAPTCHA_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${secretKey}&response=${token}`,
    });

    const verificationData = await verificationResponse.json();
    
    // Get appropriate threshold
    const { threshold, isAdminRoute } = getThresholdForAction(verificationData.action || action);
    
    // Enhanced logging for debugging
    console.log(`[reCAPTCHA] Verification result:
  - IP: ${clientIP}
  - Success: ${verificationData.success}
  - Score: ${verificationData.score}
  - Action: ${verificationData.action || action || "unknown"}
  - Threshold: ${threshold} (${isAdminRoute ? "admin" : "public"})
  - Passed: ${verificationData.success && verificationData.score >= threshold}`);

    if (!verificationData.success) {
      console.error(`[reCAPTCHA FAILED] IP: ${clientIP}, Error codes: ${verificationData["error-codes"]?.join(", ")}`);
      return new Response(
        JSON.stringify({ error: "אימות נכשל", success: false }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check score threshold
    if (verificationData.score < threshold) {
      console.warn(`[reCAPTCHA BLOCKED] Suspicious activity:
  - IP: ${clientIP}
  - Score: ${verificationData.score}
  - Threshold: ${threshold} (${isAdminRoute ? "admin route" : "public route"})
  - Action: ${verificationData.action || action || "unknown"}
  - Admin bypass: false`);
      return new Response(
        JSON.stringify({ 
          error: "פעילות חשודה", 
          success: false, 
          score: verificationData.score,
          threshold: threshold,
          route_type: isAdminRoute ? "admin" : "public"
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verification successful
    console.log(`[reCAPTCHA SUCCESS] IP: ${clientIP}, Score: ${verificationData.score}, Action: ${verificationData.action || action}`);
    return new Response(
      JSON.stringify({ 
        success: true, 
        score: verificationData.score,
        action: verificationData.action,
        threshold: threshold,
        route_type: isAdminRoute ? "admin" : "public"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error processing reCAPTCHA verification:", error);
    return new Response(
      JSON.stringify({ error: "שגיאה פנימית בשרת" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
