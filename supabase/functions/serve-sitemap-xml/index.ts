import { createClient } from "jsr:@supabase/supabase-js@2";

const BASE_URL = Deno.env.get('SITE_BASE_URL') || 'https://diamony.me';

// Cache storage (in-memory for Edge Function)
let cachedSitemap: string | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 3600 * 1000; // 1 hour

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// XML helper - escapes special characters
const escapeXml = (str: string | null | undefined): string => {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

// Format date to ISO string for lastmod
const formatDate = (date: string | null): string => {
  if (!date) return new Date().toISOString().split('T')[0];
  try {
    return new Date(date).toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check cache validity
    const now = Date.now();
    if (cachedSitemap && (now - cacheTimestamp) < CACHE_TTL_MS) {
      console.log('[Sitemap] Serving from cache');
      return new Response(cachedSitemap, {
        status: 200,
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'public, max-age=3600',
          'X-Sitemap-Cache': 'HIT',
          ...corsHeaders,
        },
      });
    }

    console.log('[Sitemap] Generating fresh sitemap');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Parallel fetch all content types
    const [productsRes, categoriesRes, blogRes, pagesRes] = await Promise.all([
      supabase.from('products').select('slug, updated_at, name, main_image_url, short_description').eq('is_active', true),
      supabase.from('categories').select('slug, updated_at, name, image_url').eq('is_active', true),
      supabase.from('blog_posts').select('slug, updated_at, title, featured_image_url').eq('is_published', true),
      supabase.from('pages').select('slug, updated_at').eq('is_published', true),
    ]);

    const products = productsRes.data || [];
    const categories = categoriesRes.data || [];
    const blogPosts = blogRes.data || [];
    const cmsPages = pagesRes.data || [];

    console.log(`[Sitemap] Found: ${products.length} products, ${categories.length} categories, ${blogPosts.length} blog posts, ${cmsPages.length} pages`);

    // Static pages list
    const staticPages = [
      { path: '/', priority: '1.0', changefreq: 'daily' },
      { path: '/catalog', priority: '0.8', changefreq: 'daily' },
      { path: '/contact', priority: '0.6', changefreq: 'monthly' },
      { path: '/blog', priority: '0.7', changefreq: 'weekly' },
      { path: '/gold-buying', priority: '0.5', changefreq: 'monthly' },
      { path: '/returns-policy', priority: '0.3', changefreq: 'monthly' },
      { path: '/terms', priority: '0.3', changefreq: 'monthly' },
      { path: '/privacy-policy', priority: '0.3', changefreq: 'monthly' },
      { path: '/accessibility', priority: '0.3', changefreq: 'monthly' },
    ];

    // Build XML with image namespace
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`;

    // Static pages
    for (const page of staticPages) {
      xml += `  <url>
    <loc>${BASE_URL}${page.path}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
    }

    // Products with images
    for (const product of products) {
      if (!product.slug) continue;
      xml += `  <url>
    <loc>${BASE_URL}/product/${escapeXml(product.slug)}</loc>
    <lastmod>${formatDate(product.updated_at)}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>`;
      
      if (product.main_image_url) {
        xml += `
    <image:image>
      <image:loc>${escapeXml(product.main_image_url)}</image:loc>
      <image:title>${escapeXml(product.name)}</image:title>${product.short_description ? `
      <image:caption>${escapeXml(product.short_description)}</image:caption>` : ''}
    </image:image>`;
      }
      xml += `
  </url>
`;
    }

    // Categories with images
    for (const category of categories) {
      if (!category.slug) continue;
      xml += `  <url>
    <loc>${BASE_URL}/catalog/${escapeXml(category.slug)}</loc>
    <lastmod>${formatDate(category.updated_at)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>`;
      
      if (category.image_url) {
        xml += `
    <image:image>
      <image:loc>${escapeXml(category.image_url)}</image:loc>
      <image:title>${escapeXml(category.name)}</image:title>
    </image:image>`;
      }
      xml += `
  </url>
`;
    }

    // Blog posts with featured images
    for (const post of blogPosts) {
      if (!post.slug) continue;
      xml += `  <url>
    <loc>${BASE_URL}/blog/${escapeXml(post.slug)}</loc>
    <lastmod>${formatDate(post.updated_at)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>`;
      
      if (post.featured_image_url) {
        xml += `
    <image:image>
      <image:loc>${escapeXml(post.featured_image_url)}</image:loc>
      <image:title>${escapeXml(post.title)}</image:title>
    </image:image>`;
      }
      xml += `
  </url>
`;
    }

    // CMS Pages
    for (const page of cmsPages) {
      if (!page.slug) continue;
      xml += `  <url>
    <loc>${BASE_URL}/page/${escapeXml(page.slug)}</loc>
    <lastmod>${formatDate(page.updated_at)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
`;
    }

    xml += `</urlset>`;

    // Update cache
    cachedSitemap = xml;
    cacheTimestamp = now;

    const totalUrls = staticPages.length + products.length + categories.length + blogPosts.length + cmsPages.length;
    console.log(`[Sitemap] Generated ${totalUrls} URLs`);

    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
        'X-Sitemap-Cache': 'MISS',
        'X-Sitemap-Total-Urls': totalUrls.toString(),
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error('[Sitemap] Error generating sitemap:', error);
    
    // Fallback minimal sitemap - always return 200 for bots
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE_URL}/</loc>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${BASE_URL}/catalog</loc>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${BASE_URL}/contact</loc>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${BASE_URL}/blog</loc>
    <priority>0.7</priority>
  </url>
</urlset>`;

    return new Response(fallbackXml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'X-Sitemap-Cache': 'FALLBACK',
        ...corsHeaders,
      },
    });
  }
});
