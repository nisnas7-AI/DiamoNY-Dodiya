-- White-label: brands (tenants), brand_id scoping, default brand helper, and RLS tightening.
-- Safe on re-run: uses IF NOT EXISTS / DROP POLICY IF EXISTS where possible.

-- ---------------------------------------------------------------------------
-- 1) brands registry
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  display_name text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.brands IS 'White-label tenants. Public anon reads are scoped to default_brand_id().';

ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "brands_select_public" ON public.brands;
CREATE POLICY "brands_select_public"
  ON public.brands FOR SELECT
  USING (is_default = true);

DROP POLICY IF EXISTS "brands_admin_all" ON public.brands;
CREATE POLICY "brands_admin_all"
  ON public.brands FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Stable default tenant for DiamoNY (matches frontend SEEDED_DEFAULT_BRAND_ID)
INSERT INTO public.brands (id, slug, display_name, is_default)
VALUES (
  'b0000000-0000-4000-8000-000000000001',
  'diamony',
  'DiamoNY',
  true
)
ON CONFLICT (slug) DO UPDATE
SET display_name = EXCLUDED.display_name,
    is_default = EXCLUDED.is_default;

-- ---------------------------------------------------------------------------
-- 2) Helper: default brand for anon / unscoped traffic
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.default_brand_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id
  FROM public.brands
  WHERE is_default = true
  ORDER BY created_at
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.default_brand_id() IS 'Returns the tenant used for public catalog/content when JWT has no brand claim.';

-- ---------------------------------------------------------------------------
-- 3) Add brand_id + backfill + defaults (NOT NULL)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  bid uuid := public.default_brand_id();
BEGIN
  IF bid IS NULL THEN
    RAISE EXCEPTION 'default_brand_id() is null; brands seed failed';
  END IF;

  -- products
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'brand_id'
  ) THEN
    ALTER TABLE public.products ADD COLUMN brand_id uuid REFERENCES public.brands(id) ON DELETE RESTRICT;
  END IF;
  UPDATE public.products SET brand_id = bid WHERE brand_id IS NULL;
  ALTER TABLE public.products ALTER COLUMN brand_id SET DEFAULT public.default_brand_id();
  ALTER TABLE public.products ALTER COLUMN brand_id SET NOT NULL;

  -- categories
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'categories' AND column_name = 'brand_id'
  ) THEN
    ALTER TABLE public.categories ADD COLUMN brand_id uuid REFERENCES public.brands(id) ON DELETE RESTRICT;
  END IF;
  UPDATE public.categories SET brand_id = bid WHERE brand_id IS NULL;
  ALTER TABLE public.categories ALTER COLUMN brand_id SET DEFAULT public.default_brand_id();
  ALTER TABLE public.categories ALTER COLUMN brand_id SET NOT NULL;

  -- site_content: relax global unique on key → (brand_id, key)
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'site_content_key_key'
  ) THEN
    ALTER TABLE public.site_content DROP CONSTRAINT site_content_key_key;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'site_content' AND column_name = 'brand_id'
  ) THEN
    ALTER TABLE public.site_content ADD COLUMN brand_id uuid REFERENCES public.brands(id) ON DELETE RESTRICT;
  END IF;
  UPDATE public.site_content SET brand_id = bid WHERE brand_id IS NULL;
  ALTER TABLE public.site_content ALTER COLUMN brand_id SET DEFAULT public.default_brand_id();
  ALTER TABLE public.site_content ALTER COLUMN brand_id SET NOT NULL;
  CREATE UNIQUE INDEX IF NOT EXISTS site_content_brand_key_unique ON public.site_content (brand_id, key);

  -- homepage_sections
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'homepage_sections_key_key'
  ) THEN
    ALTER TABLE public.homepage_sections DROP CONSTRAINT homepage_sections_key_key;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'homepage_sections' AND column_name = 'brand_id'
  ) THEN
    ALTER TABLE public.homepage_sections ADD COLUMN brand_id uuid REFERENCES public.brands(id) ON DELETE RESTRICT;
  END IF;
  UPDATE public.homepage_sections SET brand_id = bid WHERE brand_id IS NULL;
  ALTER TABLE public.homepage_sections ALTER COLUMN brand_id SET DEFAULT public.default_brand_id();
  ALTER TABLE public.homepage_sections ALTER COLUMN brand_id SET NOT NULL;
  CREATE UNIQUE INDEX IF NOT EXISTS homepage_sections_brand_key_unique ON public.homepage_sections (brand_id, key);

  -- nfc_catalog_cards
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'nfc_catalog_cards' AND column_name = 'brand_id'
  ) THEN
    ALTER TABLE public.nfc_catalog_cards ADD COLUMN brand_id uuid REFERENCES public.brands(id) ON DELETE RESTRICT;
  END IF;
  UPDATE public.nfc_catalog_cards SET brand_id = bid WHERE brand_id IS NULL;
  ALTER TABLE public.nfc_catalog_cards ALTER COLUMN brand_id SET DEFAULT public.default_brand_id();
  ALTER TABLE public.nfc_catalog_cards ALTER COLUMN brand_id SET NOT NULL;

  -- orders
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'brand_id'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN brand_id uuid REFERENCES public.brands(id) ON DELETE RESTRICT;
  END IF;
  UPDATE public.orders SET brand_id = bid WHERE brand_id IS NULL;
  ALTER TABLE public.orders ALTER COLUMN brand_id SET DEFAULT public.default_brand_id();
  ALTER TABLE public.orders ALTER COLUMN brand_id SET NOT NULL;

  -- brand_settings (one row per brand)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'brand_settings' AND column_name = 'brand_id'
  ) THEN
    ALTER TABLE public.brand_settings ADD COLUMN brand_id uuid REFERENCES public.brands(id) ON DELETE CASCADE;
  END IF;
  UPDATE public.brand_settings SET brand_id = bid WHERE brand_id IS NULL;
  ALTER TABLE public.brand_settings ALTER COLUMN brand_id SET DEFAULT public.default_brand_id();
  ALTER TABLE public.brand_settings ALTER COLUMN brand_id SET NOT NULL;
  CREATE UNIQUE INDEX IF NOT EXISTS brand_settings_brand_unique ON public.brand_settings (brand_id);
END $$;

-- Product/category slug uniqueness per brand
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_slug_key;
CREATE UNIQUE INDEX IF NOT EXISTS products_brand_slug_unique ON public.products (brand_id, slug);

ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_slug_key;
CREATE UNIQUE INDEX IF NOT EXISTS categories_brand_slug_unique ON public.categories (brand_id, slug);

CREATE INDEX IF NOT EXISTS idx_products_brand_active ON public.products (brand_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_categories_brand_active ON public.categories (brand_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_site_content_brand ON public.site_content (brand_id);
CREATE INDEX IF NOT EXISTS idx_homepage_sections_brand ON public.homepage_sections (brand_id);
CREATE INDEX IF NOT EXISTS idx_nfc_cards_brand ON public.nfc_catalog_cards (brand_id);
CREATE INDEX IF NOT EXISTS idx_orders_brand ON public.orders (brand_id);

-- ---------------------------------------------------------------------------
-- 4) RLS: public reads scoped to default brand; admins bypass via role policies
-- ---------------------------------------------------------------------------

-- PRODUCTS
DROP POLICY IF EXISTS "Active products are viewable by everyone" ON public.products;
DROP POLICY IF EXISTS "Anyone can read active products" ON public.products;
DROP POLICY IF EXISTS "Admins read all products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
DROP POLICY IF EXISTS "Admin can insert products" ON public.products;
DROP POLICY IF EXISTS "Admin can update products" ON public.products;
DROP POLICY IF EXISTS "Admins delete products" ON public.products;

CREATE POLICY "Public reads active products default brand"
  ON public.products FOR SELECT
  USING (is_active = true AND brand_id = public.default_brand_id());

CREATE POLICY "Admins select all products"
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
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Anyone can read active categories" ON public.categories;
DROP POLICY IF EXISTS "Admins read all categories" ON public.categories;
DROP POLICY IF EXISTS "Admins insert categories" ON public.categories;
DROP POLICY IF EXISTS "Admins update categories" ON public.categories;
DROP POLICY IF EXISTS "Admins delete categories" ON public.categories;

CREATE POLICY "Public reads active categories default brand"
  ON public.categories FOR SELECT
  USING (is_active = true AND brand_id = public.default_brand_id());

CREATE POLICY "Admins manage categories"
  ON public.categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- SITE_CONTENT
DROP POLICY IF EXISTS "Active content is viewable by everyone" ON public.site_content;
DROP POLICY IF EXISTS "Anyone can read content" ON public.site_content;
DROP POLICY IF EXISTS "Admins can manage site content" ON public.site_content;
DROP POLICY IF EXISTS "Admins insert content" ON public.site_content;
DROP POLICY IF EXISTS "Admins update content" ON public.site_content;
DROP POLICY IF EXISTS "Admins delete content" ON public.site_content;

CREATE POLICY "Public reads active site_content default brand"
  ON public.site_content FOR SELECT
  USING (COALESCE(is_active, true) AND brand_id = public.default_brand_id());

CREATE POLICY "Admins insert site_content"
  ON public.site_content FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins update site_content"
  ON public.site_content FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins delete site_content"
  ON public.site_content FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- HOMEPAGE_SECTIONS
DROP POLICY IF EXISTS "Active sections are viewable by everyone" ON public.homepage_sections;
DROP POLICY IF EXISTS "Admins can manage homepage sections" ON public.homepage_sections;
DROP POLICY IF EXISTS "Anyone can read homepage sections" ON public.homepage_sections;
DROP POLICY IF EXISTS "Admins insert homepage sections" ON public.homepage_sections;
DROP POLICY IF EXISTS "Admins update homepage sections" ON public.homepage_sections;
DROP POLICY IF EXISTS "Admins delete homepage sections" ON public.homepage_sections;

CREATE POLICY "Public reads homepage sections default brand"
  ON public.homepage_sections FOR SELECT
  USING (COALESCE(is_active, true) AND brand_id = public.default_brand_id());

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
DROP POLICY IF EXISTS "Anyone can read active nfc cards" ON public.nfc_catalog_cards;
DROP POLICY IF EXISTS "Admins can manage nfc cards" ON public.nfc_catalog_cards;

CREATE POLICY "Public reads active nfc cards default brand"
  ON public.nfc_catalog_cards FOR SELECT
  USING (is_active = true AND brand_id = public.default_brand_id());

CREATE POLICY "Admins manage nfc cards"
  ON public.nfc_catalog_cards FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ORDERS (keep user self-read; tighten inserts to default brand)
DROP POLICY IF EXISTS "Anyone can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Users can read own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can manage orders" ON public.orders;

CREATE POLICY "Anyone inserts orders default brand"
  ON public.orders FOR INSERT
  WITH CHECK (brand_id = public.default_brand_id());

CREATE POLICY "Users can read own orders"
  ON public.orders FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins manage orders"
  ON public.orders FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- BRAND_SETTINGS
DROP POLICY IF EXISTS "Anyone can read brand settings" ON public.brand_settings;
DROP POLICY IF EXISTS "Admins can update brand settings" ON public.brand_settings;
DROP POLICY IF EXISTS "Admins can insert brand settings" ON public.brand_settings;

CREATE POLICY "Public reads brand settings default brand"
  ON public.brand_settings FOR SELECT
  USING (brand_id = public.default_brand_id());

CREATE POLICY "Admins update brand settings"
  ON public.brand_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins insert brand settings"
  ON public.brand_settings FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- PRODUCT_IMAGES: scope reads to products in default brand (no new column)
DROP POLICY IF EXISTS "Product images are viewable by everyone" ON public.product_images;
DROP POLICY IF EXISTS "Anyone can read product images" ON public.product_images;
DROP POLICY IF EXISTS "Admins can manage product images" ON public.product_images;
DROP POLICY IF EXISTS "Admins insert product_images" ON public.product_images;
DROP POLICY IF EXISTS "Admins update product images" ON public.product_images;
DROP POLICY IF EXISTS "Admins delete product images" ON public.product_images;

CREATE POLICY "Public reads product images default brand"
  ON public.product_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_images.product_id
        AND p.brand_id = public.default_brand_id()
    )
  );

CREATE POLICY "Admins manage product images"
  ON public.product_images FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
