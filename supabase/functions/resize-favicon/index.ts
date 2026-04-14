import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SIZES = [16, 32, 48, 180, 192, 512];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Verify admin
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { source_url } = await req.json();
    if (!source_url) {
      return new Response(JSON.stringify({ error: "source_url required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if it's an SVG — SVGs don't need resizing, just sanitize & store
    const isSvg = source_url.toLowerCase().includes(".svg");

    if (isSvg) {
      // Fetch, sanitize, and store
      const svgResp = await fetch(source_url);
      let svgText = await svgResp.text();

      // Strip script tags and event handlers from SVG
      svgText = svgText.replace(/<script[\s\S]*?<\/script>/gi, "");
      svgText = svgText.replace(/\son\w+\s*=\s*"[^"]*"/gi, "");
      svgText = svgText.replace(/\son\w+\s*=\s*'[^']*'/gi, "");
      svgText = svgText.replace(/javascript:/gi, "");

      const svgPath = `favicon/favicon-sanitized.svg`;
      const svgBlob = new Blob([svgText], { type: "image/svg+xml" });
      await supabase.storage
        .from("vip-assets")
        .upload(svgPath, svgBlob, { upsert: true, contentType: "image/svg+xml" });

      const { data: svgUrlData } = supabase.storage.from("vip-assets").getPublicUrl(svgPath);

      // Update DB
      const version = Date.now();
      await supabase
        .from("web_presence_settings")
        .update({
          favicon_original_url: svgUrlData.publicUrl,
          favicon_version: version,
          updated_at: new Date().toISOString(),
        })
        .eq("id", (await supabase.from("web_presence_settings").select("id").limit(1).single()).data!.id);

      return new Response(
        JSON.stringify({
          success: true,
          svg: true,
          favicon_original_url: svgUrlData.publicUrl,
          version,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For raster images: use Supabase Storage image transformations
    // Supabase provides on-the-fly resize via ?width=X&height=X
    const results: Record<string, string> = {};
    const version = Date.now();

    // Store original
    const origResp = await fetch(source_url);
    const origBlob = await origResp.blob();
    const ext = source_url.split(".").pop()?.split("?")[0] || "png";
    const origPath = `favicon/favicon-original.${ext}`;
    await supabase.storage
      .from("vip-assets")
      .upload(origPath, origBlob, { upsert: true, contentType: origBlob.type });

    const { data: origUrlData } = supabase.storage.from("vip-assets").getPublicUrl(origPath);
    results["original"] = origUrlData.publicUrl;

    // Generate resized versions using Supabase Storage transform API
    for (const size of SIZES) {
      const { data: resizedUrl } = supabase.storage
        .from("vip-assets")
        .getPublicUrl(origPath, {
          transform: { width: size, height: size, resize: "contain" },
        });
      results[`favicon_${size}`] = resizedUrl.publicUrl;
    }

    // Update the single settings row
    const { data: settingsRow } = await supabase
      .from("web_presence_settings")
      .select("id")
      .limit(1)
      .single();

    await supabase
      .from("web_presence_settings")
      .update({
        favicon_original_url: results.original,
        favicon_16: results.favicon_16,
        favicon_32: results.favicon_32,
        favicon_48: results.favicon_48,
        favicon_180: results.favicon_180,
        favicon_192: results.favicon_192,
        favicon_512: results.favicon_512,
        favicon_version: version,
        updated_at: new Date().toISOString(),
      })
      .eq("id", settingsRow!.id);

    return new Response(
      JSON.stringify({ success: true, ...results, version }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
