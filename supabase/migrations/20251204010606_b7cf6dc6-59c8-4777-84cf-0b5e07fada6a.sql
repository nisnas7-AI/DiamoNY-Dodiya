-- Create storage bucket for media uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'catalog-media', 
  'catalog-media', 
  true, 
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for catalog-media bucket
CREATE POLICY "Anyone can view catalog media"
ON storage.objects FOR SELECT
USING (bucket_id = 'catalog-media');

CREATE POLICY "Admins can upload catalog media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'catalog-media' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update catalog media"
ON storage.objects FOR UPDATE
USING (bucket_id = 'catalog-media' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete catalog media"
ON storage.objects FOR DELETE
USING (bucket_id = 'catalog-media' AND has_role(auth.uid(), 'admin'::app_role));

-- Create stock status enum
DO $$ BEGIN
  CREATE TYPE stock_status AS ENUM ('in_stock', 'made_to_order', 'out_of_stock');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add inventory fields to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS sku text,
ADD COLUMN IF NOT EXISTS stock_status stock_status DEFAULT 'made_to_order',
ADD COLUMN IF NOT EXISTS is_customizable boolean DEFAULT true;

-- Add AI-generated SEO fields to media table
ALTER TABLE public.media
ADD COLUMN IF NOT EXISTS ai_description text,
ADD COLUMN IF NOT EXISTS ai_tags text[];

-- Create index for SKU lookups
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);

-- Update products RLS to allow admin full access
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
CREATE POLICY "Admins can manage products" ON public.products
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Update categories RLS to allow admin full access  
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins can manage categories" ON public.categories
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Update media RLS to allow admin full access
DROP POLICY IF EXISTS "Admins can manage media" ON public.media;
CREATE POLICY "Admins can manage media" ON public.media
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));