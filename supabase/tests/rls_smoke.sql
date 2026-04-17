-- Optional RLS smoke checks (run after migrations, e.g. supabase db push).
-- Adjust roles if your project uses different JWT setup for anon.

-- 1) Anonymous can read active products (policy: "Anyone can read active products")
-- set role anon;
-- select count(*)::int as active_products from public.products where is_active = true;

-- 2) Anonymous can read homepage sections (policy: "Anyone can read homepage sections")
-- select count(*)::int as homepage_sections from public.homepage_sections;

-- 3) brand_settings is readable without auth (policy: "Anyone can read brand settings")
-- select count(*)::int as brand_settings_rows from public.brand_settings;
