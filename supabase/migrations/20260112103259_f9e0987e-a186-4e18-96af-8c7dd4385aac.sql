-- Add video_url column to product_variants table for variant-specific videos
ALTER TABLE public.product_variants 
ADD COLUMN video_url TEXT DEFAULT NULL;