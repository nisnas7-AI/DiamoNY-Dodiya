-- Revert white-label: remove public.brands, brand_id columns, default_brand_id(), and restore
-- pre-tenant RLS patterns (public catalog reads without tenant scoping).
--
-- Intended for databases that applied `20260415180000_white_label_brands_tenant_rls.sql`.
-- If you never applied white-label, skip this migration or expect no-op drops; the CREATE POLICY
-- section drops legacy policy names first to avoid duplicates when upgrading mixed states.

-- ---------------------------------------------------------------------------
-- 0) Dedupe rows that would violate global uniqueness after brand_id is dropped
-- ---------------------------------------------------------------------------
DELETE FROM public.site_content sc
WHERE sc.id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY key ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST) AS rn
    FROM public.site_content
  ) t
  WHERE t.rn > 1
);

DELETE FROM public.homepage_sections hs
WHERE hs.id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY key ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST) AS rn
    FROM public.homepage_sections
  ) t
  WHERE t.rn > 1
);

DELETE FROM public.products p
WHERE p.id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY slug ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST) AS rn
    FROM public.products
  ) t
  WHERE t.rn > 1
);

DELETE FROM public.categories c
WHERE c.id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY slug ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST) AS rn
    FROM public.categories
  ) t
  WHERE t.rn > 1
);

DELETE FROM public.brand_settings bs
WHERE (SELECT COUNT(*) FROM public.brand_settings) > 1
  AND bs.id NOT IN (
    SELECT id FROM public.brand_settings
    ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST
    LIMIT 1
  );

-- ---------------------------------------------------------------------------
-- 1) Drop tenant-scoped policies (depend on brand_id / default_brand_id)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.brands') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "brands_select_public" ON public.brands';
    EXECUTE 'DROP POLICY IF EXISTS "brands_admin_all" ON public.brands';
  END IF;
END $$;

DROP POLICY IF EXISTS "Public reads active products default brand" ON public.products;
DROP POLICY IF EXISTS "Admins select all products" ON public.products;
DROP POLICY IF EXISTS "Admins insert products" ON public.products;
DROP POLICY IF EXISTS "Admins update products" ON public.products;
DROP POLICY IF EXISTS "Admins delete products" ON public.products;

DROP POLICY IF EXISTS "Public reads active categories default brand" ON public.categories;
DROP POLICY IF EXISTS "Admins manage categories" ON public.categories;

DROP POLICY IF EXISTS "Public reads active site_content default brand" ON public.site_content;
DROP POLICY IF EXISTS "Admins insert site_content" ON public.site_content;
DROP POLICY IF EXISTS "Admins update site_content" ON public.site_content;
DROP POLICY IF EXISTS "Admins delete site_content" ON public.site_content;

DROP POLICY IF EXISTS "Public reads homepage sections default brand" ON public.homepage_sections;
DROP POLICY IF EXISTS "Admins insert homepage sections" ON public.homepage_sections;
DROP POLICY IF EXISTS "Admins update homepage sections" ON public.homepage_sections;
DROP POLICY IF EXISTS "Admins delete homepage sections" ON public.homepage_sections;

DROP POLICY IF EXISTS "Public reads active nfc cards default brand" ON public.nfc_catalog_cards;
DROP POLICY IF EXISTS "Admins manage nfc cards" ON public.nfc_catalog_cards;

DROP POLICY IF EXISTS "Anyone inserts orders default brand" ON public.orders;
DROP POLICY IF EXISTS "Users can read own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins manage orders" ON public.orders;

DROP POLICY IF EXISTS "Public reads brand settings default brand" ON public.brand_settings;
DROP POLICY IF EXISTS "Admins update brand settings" ON public.brand_settings;
DROP POLICY IF EXISTS "Admins insert brand settings" ON public.brand_settings;

DROP POLICY IF EXISTS "Public reads product images default brand" ON public.product_images;
DROP POLICY IF EXISTS "Admins manage product images" ON public.product_images;

-- ---------------------------------------------------------------------------
-- 2) Drop helper (no longer referenced by policies)
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.default_brand_id();

-- ---------------------------------------------------------------------------
-- 3) Drop tenant indexes and brand_id columns
-- ---------------------------------------------------------------------------
DROP INDEX IF EXISTS public.products_brand_slug_unique;
DROP INDEX IF EXISTS public.categories_brand_slug_unique;
DROP INDEX IF EXISTS public.site_content_brand_key_unique;
DROP INDEX IF EXISTS public.homepage_sections_brand_key_unique;
DROP INDEX IF EXISTS public.brand_settings_brand_unique;

DROP INDEX IF EXISTS public.idx_products_brand_active;
DROP INDEX IF EXISTS public.idx_categories_brand_active;
DROP INDEX IF EXISTS public.idx_site_content_brand;
DROP INDEX IF EXISTS public.idx_homepage_sections_brand;
DROP INDEX IF EXISTS public.idx_nfc_cards_brand;
DROP INDEX IF EXISTS public.idx_orders_brand;

ALTER TABLE public.products DROP COLUMN IF EXISTS brand_id;
ALTER TABLE public.categories DROP COLUMN IF EXISTS brand_id;
ALTER TABLE public.site_content DROP COLUMN IF EXISTS brand_id;
ALTER TABLE public.homepage_sections DROP COLUMN IF EXISTS brand_id;
ALTER TABLE public.nfc_catalog_cards DROP COLUMN IF EXISTS brand_id;
ALTER TABLE public.orders DROP COLUMN IF EXISTS brand_id;
ALTER TABLE public.brand_settings DROP COLUMN IF EXISTS brand_id;

DROP TABLE IF EXISTS public.brands;

-- ---------------------------------------------------------------------------
-- 4) Restore global uniqueness (matches pre–white-label migrations)
-- ---------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS products_slug_key ON public.products (slug);
CREATE UNIQUE INDEX IF NOT EXISTS categories_slug_key ON public.categories (slug);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'site_content_key_unique'
  ) THEN
    CREATE UNIQUE INDEX site_content_key_unique ON public.site_content (key);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'homepage_sections_key_key'
  ) THEN
    ALTER TABLE public.homepage_sections ADD CONSTRAINT homepage_sections_key_key UNIQUE (key);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 5) RLS policies (anon-friendly catalog + admin split, no tenant column)
-- ---------------------------------------------------------------------------

-- PRODUCTS (drop legacy + white-label names so CREATE does not collide)
DROP POLICY IF EXISTS "Active products are viewable by everyone" ON public.products;
DROP POLICY IF EXISTS "Anyone can read active products" ON public.products;
DROP POLICY IF EXISTS "Admins read all products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;

-- CATEGORIES
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.categories;
DROP POLICY IF EXISTS "Anyone can read active categories" ON public.categories;
DROP POLICY IF EXISTS "Admins read all categories" ON public.categories;
DROP POLICY IF EXISTS "Admins insert categories" ON public.categories;
DROP POLICY IF EXISTS "Admins update categories" ON public.categories;
DROP POLICY IF EXISTS "Admins delete categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;

-- SITE_CONTENT
DROP POLICY IF EXISTS "Active content is viewable by everyone" ON public.site_content;
DROP POLICY IF EXISTS "Anyone can read content" ON public.site_content;
DROP POLICY IF EXISTS "Admins can manage site content" ON public.site_content;
DROP POLICY IF EXISTS "Admins insert content" ON public.site_content;
DROP POLICY IF EXISTS "Admins update content" ON public.site_content;
DROP POLICY IF EXISTS "Admins delete content" ON public.site_content;

-- HOMEPAGE_SECTIONS
DROP POLICY IF EXISTS "Active sections are viewable by everyone" ON public.homepage_sections;
DROP POLICY IF EXISTS "Anyone can read homepage sections" ON public.homepage_sections;
DROP POLICY IF EXISTS "Admins can manage homepage sections" ON public.homepage_sections;
DROP POLICY IF EXISTS "Admins insert homepage sections" ON public.homepage_sections;
DROP POLICY IF EXISTS "Admins update homepage sections" ON public.homepage_sections;
DROP POLICY IF EXISTS "Admins delete homepage sections" ON public.homepage_sections;

-- NFC
DROP POLICY IF EXISTS "Anyone can read active nfc cards" ON public.nfc_catalog_cards;
DROP POLICY IF EXISTS "Admins can manage nfc cards" ON public.nfc_catalog_cards;

-- ORDERS
DROP POLICY IF EXISTS "Anyone can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Users can read own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can manage orders" ON public.orders;

-- BRAND_SETTINGS
DROP POLICY IF EXISTS "Anyone can read brand settings" ON public.brand_settings;
DROP POLICY IF EXISTS "Admins can update brand settings" ON public.brand_settings;
DROP POLICY IF EXISTS "Admins can insert brand settings" ON public.brand_settings;

-- PRODUCT_IMAGES
DROP POLICY IF EXISTS "Product images are viewable by everyone" ON public.product_images;
DROP POLICY IF EXISTS "Anyone can read product images" ON public.product_images;
DROP POLICY IF EXISTS "Admins can manage product images" ON public.product_images;
DROP POLICY IF EXISTS "Admins insert product_images" ON public.product_images;
DROP POLICY IF EXISTS "Admins update product images" ON public.product_images;
DROP POLICY IF EXISTS "Admins delete product images" ON public.product_images;

-- PRODUCTS
CREATE POLICY "Anyone can read active products"
  ON public.products FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins read all products"
  ON public.products FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins insert products"
  ON public.products FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins update products"
  ON public.products FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins delete products"
  ON public.products FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- CATEGORIES
CREATE POLICY "Anyone can read active categories"
  ON public.categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins read all categories"
  ON public.categories FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins insert categories"
  ON public.categories FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins update categories"
  ON public.categories FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins delete categories"
  ON public.categories FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- SITE_CONTENT
CREATE POLICY "Anyone can read content"
  ON public.site_content FOR SELECT
  USING (true);

CREATE POLICY "Admins insert content"
  ON public.site_content FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins update content"
  ON public.site_content FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins delete content"
  ON public.site_content FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- HOMEPAGE_SECTIONS
CREATE POLICY "Anyone can read homepage sections"
  ON public.homepage_sections FOR SELECT
  USING (true);

CREATE POLICY "Admins insert homepage sections"
  ON public.homepage_sections FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins update homepage sections"
  ON public.homepage_sections FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins delete homepage sections"
  ON public.homepage_sections FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- NFC_CATALOG_CARDS
CREATE POLICY "Anyone can read active nfc cards"
  ON public.nfc_catalog_cards FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage nfc cards"
  ON public.nfc_catalog_cards FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ORDERS
CREATE POLICY "Anyone can insert orders"
  ON public.orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can read own orders"
  ON public.orders FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage orders"
  ON public.orders FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- BRAND_SETTINGS (single-row style)
CREATE POLICY "Anyone can read brand settings"
  ON public.brand_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can update brand settings"
  ON public.brand_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can insert brand settings"
  ON public.brand_settings FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- PRODUCT_IMAGES
CREATE POLICY "Anyone can read product images"
  ON public.product_images FOR SELECT
  USING (true);

CREATE POLICY "Admins insert product_images"
  ON public.product_images FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins update product images"
  ON public.product_images FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins delete product images"
  ON public.product_images FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
