-- Add video_url field to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Add media_type to product_images to support both images and videos
ALTER TABLE public.product_images ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'image';

COMMENT ON COLUMN public.products.video_url IS 'Main product video URL (YouTube, Vimeo, or direct link)';
COMMENT ON COLUMN public.product_images.media_type IS 'Type of media: image or video';