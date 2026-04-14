-- Run in the NEW Supabase SQL Editor AFTER `public.products` and related tables exist.
--
-- If you see "skipped (table does not exist)", your new project has no app schema yet.
-- Fix that first:
--   1) Link CLI: `supabase link --project-ref <your_new_ref>`
--   2) Push migrations: `supabase db push`
--   OR paste/run each file in `supabase/migrations/` in chronological order in SQL Editor.
--
-- Edit old_base / new_base if your hosts differ.

DO $$
DECLARE
  old_base constant text := 'https://quinaskuaahkkxhdckas.supabase.co';
  new_base constant text := 'https://prkkufqduzvpfonzsvie.supabase.co';
BEGIN
  IF to_regclass('public.products') IS NOT NULL THEN
    UPDATE public.products
    SET main_image_url = replace(main_image_url, old_base, new_base)
    WHERE main_image_url LIKE old_base || '%';
    RAISE NOTICE 'public.products: updated';
  ELSE
    RAISE NOTICE 'public.products: skipped (table does not exist — apply migrations first)';
  END IF;

  IF to_regclass('public.product_images') IS NOT NULL THEN
    UPDATE public.product_images
    SET image_url = replace(image_url, old_base, new_base)
    WHERE image_url LIKE old_base || '%';
    RAISE NOTICE 'public.product_images: updated';
  ELSE
    RAISE NOTICE 'public.product_images: skipped';
  END IF;

  IF to_regclass('public.blog_posts') IS NOT NULL THEN
    UPDATE public.blog_posts
    SET featured_image_url = replace(featured_image_url, old_base, new_base)
    WHERE featured_image_url LIKE old_base || '%';
    RAISE NOTICE 'public.blog_posts: updated';
  ELSE
    RAISE NOTICE 'public.blog_posts: skipped';
  END IF;

  IF to_regclass('public.categories') IS NOT NULL THEN
    UPDATE public.categories
    SET image_url = replace(image_url, old_base, new_base)
    WHERE image_url LIKE old_base || '%';
    RAISE NOTICE 'public.categories: updated';
  ELSE
    RAISE NOTICE 'public.categories: skipped';
  END IF;

  IF to_regclass('public.testimonials') IS NOT NULL THEN
    UPDATE public.testimonials
    SET image_url = replace(image_url, old_base, new_base)
    WHERE image_url LIKE old_base || '%';
    UPDATE public.testimonials
    SET product_image_url = replace(product_image_url, old_base, new_base)
    WHERE product_image_url LIKE old_base || '%';
    RAISE NOTICE 'public.testimonials: updated';
  ELSE
    RAISE NOTICE 'public.testimonials: skipped';
  END IF;

  IF to_regclass('public.certificates') IS NOT NULL THEN
    UPDATE public.certificates
    SET image_url = replace(image_url, old_base, new_base)
    WHERE image_url LIKE old_base || '%';
    RAISE NOTICE 'public.certificates: updated';
  ELSE
    RAISE NOTICE 'public.certificates: skipped';
  END IF;

  IF to_regclass('public.promo_banners') IS NOT NULL THEN
    UPDATE public.promo_banners
    SET banner_image_url = replace(banner_image_url, old_base, new_base)
    WHERE banner_image_url LIKE old_base || '%';
    RAISE NOTICE 'public.promo_banners: updated';
  ELSE
    RAISE NOTICE 'public.promo_banners: skipped';
  END IF;
END $$;
