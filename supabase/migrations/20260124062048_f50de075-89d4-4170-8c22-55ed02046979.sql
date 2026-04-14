-- Add media_type column to blog_posts for featured media type
ALTER TABLE public.blog_posts 
ADD COLUMN IF NOT EXISTS featured_media_type text DEFAULT 'image';

-- Add a comment for clarity
COMMENT ON COLUMN public.blog_posts.featured_media_type IS 'Type of featured media: image or video';

-- Create blog-media storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'blog-media', 
  'blog-media', 
  true, 
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for blog-media bucket
CREATE POLICY "Blog media is publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'blog-media');

CREATE POLICY "Admins can upload blog media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'blog-media' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update blog media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'blog-media' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete blog media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'blog-media' 
  AND has_role(auth.uid(), 'admin'::app_role)
);