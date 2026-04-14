import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// Fields returned to client — phone_key is NEVER included
const SAFE_COLUMNS =
  "id, full_name, credit_balance, gender_preference, is_active, marketing_consent, consent_date, email, login_count, pref_jewelry_type, pref_gold_color, pref_stone, is_confirmed, confirmed_at, consent_date";

/** Log errors to system_logs — fire-and-forget */
const logError = (
  supabaseAdmin: ReturnType<typeof createClient>,
  source: string,
  message: string,
  metadata: Record<string, unknown> = {}
) => {
  supabaseAdmin
    .from("system_logs")
    .insert({ level: "error", source, message, metadata })
    .then(() => {})
    .catch(() => {});
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, phone_key, member_id } = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ── LOGIN ──────────────────────────────────────────────
    if (action === "login") {
      if (!phone_key || typeof phone_key !== "string" || phone_key.length > 20) {
        return json({ error: "invalid_input" }, 400);
      }

      // Rate-limit check (before logging the attempt)
      const { data: allowed } = await supabaseAdmin.rpc(
        "check_vip_rate_limit",
        { p_phone: phone_key }
      );

      if (!allowed) {
        await supabaseAdmin
          .from("vip_login_attempts")
          .insert({ phone_key });
        return json({ error: "rate_limit" }, 429);
      }

      // Log the attempt
      await supabaseAdmin
        .from("vip_login_attempts")
        .insert({ phone_key });

      // Look up member (service role bypasses RLS)
      const { data: member, error } = await supabaseAdmin
        .from("vip_members")
        .select(SAFE_COLUMNS)
        .eq("phone_key", phone_key)
        .eq("is_active", true)
        .single();

      if (error || !member) {
        return json({ error: "teaser" }, 401);
      }

      // Phase 2: Server-side confirmation + increment login count
      const now = new Date().toISOString();
      const updatePayload: Record<string, unknown> = {
        login_count: (member.login_count || 0) + 1,
        is_confirmed: true,
        confirmed_at: member.confirmed_at || now,
        consent_date: now,
      };

      const { error: updateError } = await supabaseAdmin
        .from("vip_members")
        .update(updatePayload)
        .eq("id", member.id);

      // Phase 3: Log errors but don't block the login
      if (updateError) {
        logError(supabaseAdmin, "vip-auth/login", "Failed to update member confirmation", {
          member_id: member.id,
          error_message: updateError.message,
        });
      }

      // Return updated member data
      const returnMember = {
        ...member,
        login_count: (member.login_count || 0) + 1,
        is_confirmed: true,
        confirmed_at: member.confirmed_at || now,
        consent_date: now,
      };

      return json({ success: true, member: returnMember });
    }

    // ── VALIDATE (session restoration) ────────────────────
    if (action === "validate") {
      if (!member_id || typeof member_id !== "string") {
        return json({ error: "invalid_input" }, 400);
      }

      const { data: member, error } = await supabaseAdmin
        .from("vip_members")
        .select(SAFE_COLUMNS)
        .eq("id", member_id)
        .eq("is_active", true)
        .single();

      if (error || !member) {
        return json({ error: "invalid_session" }, 401);
      }

      return json({ success: true, member });
    }

    return json({ error: "invalid_action" }, 400);
  } catch (err) {
    console.error("vip-auth error:", err);
    return json({ error: "internal_error" }, 500);
  }
});
