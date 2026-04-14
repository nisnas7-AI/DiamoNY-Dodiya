-- Add custom_json_ld column to blog_posts for custom structured data
ALTER TABLE public.blog_posts 
ADD COLUMN custom_json_ld jsonb NULL;