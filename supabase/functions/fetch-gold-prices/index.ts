import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GoldPrices {
  gold_14k_per_gram: number;
  gold_18k_per_gram: number;
  gold_24k_per_gram: number;
  platinum_per_gram: number;
  currency: string;
  timestamp: string;
  source: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // === AUTHENTICATION & AUTHORIZATION ===
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Missing or invalid authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Create client with user's auth token
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Validate JWT and get claims
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;

    // Check admin role using service role client (bypasses RLS)
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roleData, error: roleError } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .in('role', ['admin', 'super_admin'])
      .maybeSingle();

    if (roleError || !roleData) {
      console.log('Admin check failed for user:', userId, roleError);
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Admin user ${userId} (role: ${roleData.role}) fetching gold prices`);

    // === BUSINESS LOGIC ===
    const { api_key, provider } = await req.json();
    
    let prices: GoldPrices;

    if (provider === 'goldapi' && api_key) {
      // GoldAPI.io - Real API
      console.log('Fetching from GoldAPI.io...');
      
      const response = await fetch('https://www.goldapi.io/api/XAU/ILS', {
        headers: {
          'x-access-token': api_key,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`GoldAPI error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('GoldAPI response:', data);

      // XAU is price per troy ounce, convert to grams (1 troy oz = 31.1035 grams)
      const gold24kPerGram = data.price / 31.1035;
      
      prices = {
        gold_24k_per_gram: Math.round(gold24kPerGram * 100) / 100,
        gold_18k_per_gram: Math.round((gold24kPerGram * 0.75) * 100) / 100, // 18K = 75% pure
        gold_14k_per_gram: Math.round((gold24kPerGram * 0.585) * 100) / 100, // 14K = 58.5% pure
        platinum_per_gram: 0, // GoldAPI doesn't provide platinum in same call
        currency: 'ILS',
        timestamp: new Date().toISOString(),
        source: 'goldapi.io'
      };

      // Try to fetch platinum separately
      try {
        const platResponse = await fetch('https://www.goldapi.io/api/XPT/ILS', {
          headers: {
            'x-access-token': api_key,
            'Content-Type': 'application/json'
          }
        });
        if (platResponse.ok) {
          const platData = await platResponse.json();
          prices.platinum_per_gram = Math.round((platData.price / 31.1035) * 100) / 100;
        }
      } catch (e) {
        console.log('Could not fetch platinum price:', e);
      }

    } else if (provider === 'metals_dev' && api_key) {
      // Metals.dev API
      console.log('Fetching from Metals.dev...');
      
      const response = await fetch(`https://api.metals.dev/v1/latest?api_key=${api_key}&currency=ILS&unit=gram`);

      if (!response.ok) {
        throw new Error(`Metals.dev error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Metals.dev response:', data);

      const gold24kPerGram = data.metals.gold;
      
      prices = {
        gold_24k_per_gram: Math.round(gold24kPerGram * 100) / 100,
        gold_18k_per_gram: Math.round((gold24kPerGram * 0.75) * 100) / 100,
        gold_14k_per_gram: Math.round((gold24kPerGram * 0.585) * 100) / 100,
        platinum_per_gram: Math.round(data.metals.platinum * 100) / 100,
        currency: 'ILS',
        timestamp: new Date().toISOString(),
        source: 'metals.dev'
      };

    } else {
      // Demo mode - return sample prices for testing
      console.log('No API key provided, returning demo prices...');
      
      // Approximate real-world prices in ILS per gram (as of 2024)
      prices = {
        gold_24k_per_gram: 285,
        gold_18k_per_gram: 214,
        gold_14k_per_gram: 167,
        platinum_per_gram: 115,
        currency: 'ILS',
        timestamp: new Date().toISOString(),
        source: 'demo'
      };
    }

    console.log('Returning prices:', prices);

    return new Response(JSON.stringify(prices), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching gold prices:', error);
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: 'Failed to fetch gold prices from API'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
