import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Known crawler User-Agents
const BOT_USER_AGENTS = [
  'googlebot',
  'bingbot',
  'slurp',       // Yahoo
  'duckduckbot',
  'baiduspider',
  'yandexbot',
  'sogou',
  'exabot',
  'facebot',
  'facebookexternalhit',
  'twitterbot',
  'rogerbot',
  'linkedinbot',
  'embedly',
  'quora link preview',
  'showyoubot',
  'outbrain',
  'pinterest',
  'applebot',
  'semrushbot',
  'ahrefsbot',
  'mj12bot',
  'dotbot',
  'petalbot',
];

function isBot(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return BOT_USER_AGENTS.some(bot => ua.includes(bot));
}

function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(price);
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get('slug');
    const userAgent = req.headers.get('user-agent') || '';
    
    // Check if this is a bot request
    const isBotRequest = isBot(userAgent) || url.searchParams.get('_bot') === 'true';

    if (!slug) {
      return new Response(
        JSON.stringify({ error: 'Missing slug parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If not a bot, return minimal response indicating SPA should render
    if (!isBotRequest) {
      return new Response(
        JSON.stringify({ prerender: false, message: 'Not a bot request' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    console.log('ENV check - URL:', supabaseUrl ? 'SET' : 'MISSING', 'KEY:', supabaseKey ? 'SET' : 'MISSING');
    console.log('Fetching product with slug:', slug);
    
    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: 'Missing Supabase configuration', prerender: false }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch product data
    const { data: product, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        name_en,
        slug,
        sku,
        description,
        short_description,
        price,
        original_price,
        is_on_sale,
        gold_type,
        stone_type,
        stone_weight,
        main_image_url,
        is_diamond_jewelry,
        mto_story,
        marketing_copy,
        categories(id, name, slug),
        product_stories(id, title, content_body)
      `)
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    console.log('Query result - data:', product ? 'FOUND' : 'NULL', 'error:', error ? JSON.stringify(error) : 'NONE');

    if (error) {
      console.error('Supabase query error:', JSON.stringify(error));
      return new Response(
        JSON.stringify({ error: 'Database query error', details: error.message, prerender: false }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!product) {
      return new Response(
        JSON.stringify({ error: 'Product not found', prerender: false }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build technical specifications
    const specs: { label: string; value: string }[] = [];
    
    if (product.gold_type) {
      specs.push({ label: 'סוג זהב', value: product.gold_type });
    }
    if (product.stone_type) {
      specs.push({ label: 'סוג אבן', value: product.stone_type });
    }
    if (product.stone_weight) {
      const weightDisplay = product.is_diamond_jewelry 
        ? `החל מ-${product.stone_weight} קראט`
        : `${product.stone_weight} קראט`;
      specs.push({ label: 'משקל האבן', value: weightDisplay });
    }
    if (product.sku) {
      specs.push({ label: 'מק״ט', value: product.sku });
    }

    // Build price display
    const pricePrefix = product.is_diamond_jewelry ? 'החל מ-' : '';
    const priceDisplay = product.is_on_sale && product.original_price
      ? `${pricePrefix}${formatPrice(product.price)} (במקום ${formatPrice(product.original_price)})`
      : `${pricePrefix}${formatPrice(product.price)}`;

    // Meta description
    const metaDescription = product.short_description 
      ? product.short_description.substring(0, 160)
      : `${product.name} - תכשיט יוקרתי בעיצוב אישי מבית DiamoNY. ${product.stone_type || 'יהלומים'} איכותיים בעבודת יד.`;

    // Category info
    const category = product.categories as { name: string; slug: string } | null;

    // Canonical URL
    const canonicalUrl = `https://diamony.me/product/${product.slug}`;

    // Build JSON-LD Product Schema
    const productSchema = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": product.name,
      "description": product.description || product.short_description,
      "image": product.main_image_url,
      "sku": product.sku,
      "brand": {
        "@type": "Brand",
        "name": "DiamoNY"
      },
      "offers": {
        "@type": "Offer",
        "priceCurrency": "ILS",
        "price": product.price,
        "availability": "https://schema.org/InStock",
        "url": canonicalUrl
      }
    };

    // Build Breadcrumb Schema
    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "דף הבית", "item": "https://diamony.me/" },
        { "@type": "ListItem", "position": 2, "name": "קולקציות", "item": "https://diamony.me/catalog" },
        ...(category ? [{ "@type": "ListItem", "position": 3, "name": category.name, "item": `https://diamony.me/catalog/${category.slug}` }] : []),
        { "@type": "ListItem", "position": category ? 4 : 3, "name": product.name, "item": canonicalUrl }
      ]
    };

    // Build pre-rendered HTML
    const html = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(product.name)} | DiamoNY</title>
  <meta name="description" content="${escapeHtml(metaDescription)}">
  <link rel="canonical" href="${canonicalUrl}">
  
  <!-- Google Search Console Verification -->
  <meta name="google-site-verification" content="google347c81d92d4f37c4.html">
  
  <!-- Open Graph -->
  <meta property="og:type" content="product">
  <meta property="og:title" content="${escapeHtml(product.name)} | DiamoNY">
  <meta property="og:description" content="${escapeHtml(metaDescription)}">
  <meta property="og:url" content="${canonicalUrl}">
  ${product.main_image_url ? `<meta property="og:image" content="${escapeHtml(product.main_image_url)}">` : ''}
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(product.name)} | DiamoNY">
  <meta name="twitter:description" content="${escapeHtml(metaDescription)}">
  ${product.main_image_url ? `<meta name="twitter:image" content="${escapeHtml(product.main_image_url)}">` : ''}
  
  <!-- Structured Data -->
  <script type="application/ld+json">${JSON.stringify(productSchema)}</script>
  <script type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>
  
  <style>
    body { font-family: system-ui, sans-serif; direction: rtl; text-align: right; margin: 0; padding: 20px; background: #F9F7F2; color: #1A1A1A; }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { font-size: 2rem; font-weight: 300; margin-bottom: 1rem; letter-spacing: 0.05em; }
    h2 { font-size: 1.25rem; font-weight: 500; margin: 1.5rem 0 1rem; color: #333; }
    h3 { font-size: 1rem; font-weight: 500; margin: 1rem 0 0.5rem; color: #555; }
    .price { font-size: 1.5rem; color: #A68966; font-weight: 500; margin: 1rem 0; }
    .description { line-height: 1.8; color: #555; margin-bottom: 1.5rem; }
    .specs { background: #fff; padding: 1.5rem; border-radius: 8px; margin: 1.5rem 0; }
    .specs dl { margin: 0; }
    .specs dt { color: #888; font-size: 0.875rem; margin-top: 0.75rem; }
    .specs dd { margin: 0.25rem 0 0; font-weight: 500; }
    .breadcrumb { font-size: 0.75rem; color: #888; margin-bottom: 1rem; }
    .breadcrumb a { color: #A68966; text-decoration: none; }
    .story { background: #fff; padding: 2rem; border-radius: 8px; margin: 2rem 0; }
    .story h2 { margin-top: 0; }
    img { max-width: 100%; height: auto; border-radius: 8px; }
    .sku { font-size: 0.75rem; color: #999; font-family: monospace; margin-top: 1rem; }
  </style>
</head>
<body>
  <div class="container">
    <!-- Breadcrumb Navigation -->
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="/">דף הבית</a> &rsaquo; 
      <a href="/catalog">קולקציות</a>${category ? ` &rsaquo; <a href="/catalog/${escapeHtml(category.slug)}">${escapeHtml(category.name)}</a>` : ''} &rsaquo; 
      <span>${escapeHtml(product.name)}</span>
    </nav>

    <!-- Product Main Content -->
    <article itemscope itemtype="https://schema.org/Product">
      ${product.main_image_url ? `<img src="${escapeHtml(product.main_image_url)}" alt="${escapeHtml(product.name)}" itemprop="image" loading="eager">` : ''}
      
      <!-- H1: Product Title -->
      <h1 itemprop="name">${escapeHtml(product.name)}</h1>
      
      <!-- Price -->
      <div class="price" itemprop="offers" itemscope itemtype="https://schema.org/Offer">
        <span itemprop="priceCurrency" content="ILS">₪</span>
        <span itemprop="price" content="${product.price}">${priceDisplay}</span>
        <link itemprop="availability" href="https://schema.org/InStock">
      </div>

      <!-- H2: Product Description Section -->
      <section aria-labelledby="product-description">
        <h2 id="product-description">תיאור המוצר</h2>
        ${product.short_description ? `<p class="description" itemprop="description">${escapeHtml(product.short_description)}</p>` : ''}
        ${product.description && product.description !== product.short_description ? `<p class="description">${escapeHtml(product.description)}</p>` : ''}
      </section>

      <!-- H2: Technical Specifications -->
      ${specs.length > 0 ? `
      <section class="specs" aria-labelledby="product-specifications">
        <h2 id="product-specifications">מפרט טכני</h2>
        <dl>
          ${specs.map(spec => `
          <dt>${escapeHtml(spec.label)}</dt>
          <dd>${escapeHtml(spec.value)}</dd>
          `).join('')}
        </dl>
      </section>
      ` : ''}

      <!-- H2: MTO Story (The Art of Creation) -->
      ${product.mto_story ? `
      <section class="story" aria-labelledby="mto-story">
        <h2 id="mto-story">אמנות היצירה</h2>
        <p>${escapeHtml(product.mto_story)}</p>
      </section>
      ` : ''}

      <!-- H2: Product Story -->
      ${product.product_stories?.content_body ? `
      <section class="story" aria-labelledby="product-story">
        <h2 id="product-story">${product.product_stories.title ? escapeHtml(product.product_stories.title) : 'הסיפור שלנו'}</h2>
        <p>${escapeHtml(product.product_stories.content_body)}</p>
      </section>
      ` : ''}

      <!-- SKU Reference -->
      ${product.sku ? `<div class="sku" itemprop="sku">מק״ט: ${escapeHtml(product.sku)}</div>` : ''}
    </article>

    <!-- SEO Footer Content -->
    <footer>
      <p>DiamoNY - צורפות עילית בעיצוב אישי. תכשיטי יוקרה בהתאמה אישית וקולקציות ייחודיות.</p>
      <p><a href="/contact">צור קשר</a> | <a href="/catalog">קטלוג מלא</a></p>
    </footer>
  </div>
  
  <!-- Redirect regular users to SPA -->
  <script>
    // If this is a regular browser (not a bot), redirect to the SPA
    var ua = navigator.userAgent.toLowerCase();
    var isBot = ${JSON.stringify(BOT_USER_AGENTS)}.some(function(bot) { return ua.indexOf(bot) !== -1; });
    if (!isBot && !window.location.search.includes('_bot=true')) {
      window.location.replace('https://diamony.me/product/${escapeHtml(product.slug)}');
    }
  </script>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        'X-Prerender': 'true',
      },
    });

  } catch (error) {
    console.error('Prerender error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
