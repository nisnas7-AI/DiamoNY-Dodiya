-- Add media_type column to product_variant_images table
ALTER TABLE public.product_variant_images 
ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'image';

-- Add a comment for clarity
COMMENT ON COLUMN public.product_variant_images.media_type IS 'Type of media: image or video';