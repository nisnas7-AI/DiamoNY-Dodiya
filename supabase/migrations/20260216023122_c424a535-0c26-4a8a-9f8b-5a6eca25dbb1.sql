
-- Drop old FK to site_reviews
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_featured_review_id_fkey;

-- Add new FK to testimonials
ALTER TABLE public.products
  ADD CONSTRAINT products_featured_review_id_fkey
  FOREIGN KEY (featured_review_id) REFERENCES public.testimonials(id) ON DELETE SET NULL;
