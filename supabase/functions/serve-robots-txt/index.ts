import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

// Dynamic base URL from environment or default to production domain
const getBaseUrl = (): string => {
  // Check for custom domain setting first
  const customDomain = Deno.env.get('SITE_BASE_URL');
  if (customDomain) return customDomain;
  
  // Default to the published domain
  return 'https://diamony.me';
};

// Build fallback with dynamic sitemap URL
const buildFallbackRobots = (baseUrl: string): string => `User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: facebookexternalhit
Allow: /

User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const baseUrl = getBaseUrl();
  const FALLBACK_ROBOTS = buildFallbackRobots(baseUrl);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'robots_txt')
      .single();

    let content = FALLBACK_ROBOTS;

    if (!error && data?.value?.content) {
      content = data.value.content;
    }

    return new Response(content, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error('Error serving robots.txt:', error);
    return new Response(FALLBACK_ROBOTS, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        ...corsHeaders,
      },
    });
  }
});
