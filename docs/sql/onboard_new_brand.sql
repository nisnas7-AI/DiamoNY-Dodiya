-- Onboard a new white-label brand (run in Supabase SQL editor or via migration).
-- Replace placeholders before executing.

-- 1) Insert tenant (slug must be unique)
-- INSERT INTO public.brands (slug, display_name, is_default)
-- VALUES ('acme-jewelry', 'Acme Jewelry', false)
-- RETURNING id;

-- 2) Copy reference data from default tenant (optional pattern — adjust table list)
-- WITH src AS (SELECT id FROM public.brands WHERE slug = 'diamony' LIMIT 1),
--      dst AS (SELECT '00000000-0000-0000-0000-000000000000'::uuid AS id)  -- paste new brand id
-- INSERT INTO public.categories (brand_id, name, slug, /* ...other columns */)
-- SELECT dst.id, c.name, c.slug /* ... */
-- FROM public.categories c, src
-- WHERE c.brand_id = src.id;

-- 3) Minimal brand_settings row for the new tenant
-- INSERT INTO public.brand_settings (brand_id, brand_name, logo_url, footer_about_text, support_email, whatsapp_number, site_url)
-- VALUES (
--   '00000000-0000-0000-0000-000000000000',
--   'Acme Jewelry',
--   '/logo.png',
--   'About text',
--   'hello@example.com',
--   '972500000000',
--   'https://acme.example'
-- );

-- 4) Deploy the app with VITE_BRAND_ID matching the new row's id.
