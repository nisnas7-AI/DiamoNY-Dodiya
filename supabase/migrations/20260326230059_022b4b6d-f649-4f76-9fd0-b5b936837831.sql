ALTER TABLE public.site_reviews
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS product_image_url text,
  ADD COLUMN IF NOT EXISTS jewelry_item_name text,
  ADD COLUMN IF NOT EXISTS product_link text,
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS seo_keywords text[] DEFAULT '{}';

-- Backfill from testimonials
UPDATE public.site_reviews sr
SET
  image_url = t.image_url,
  product_image_url = t.product_image_url,
  jewelry_item_name = t.jewelry_item_name,
  product_link = t.product_link,
  is_featured = COALESCE(t.is_featured, false),
  seo_keywords = COALESCE(t.seo_keywords, '{}')
FROM public.testimonials t
WHERE sr.id = t.id;