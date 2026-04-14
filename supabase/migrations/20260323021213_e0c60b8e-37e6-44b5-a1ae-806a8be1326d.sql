ALTER TABLE public.blog_posts
ADD COLUMN IF NOT EXISTS faq_data jsonb;

COMMENT ON COLUMN public.blog_posts.faq_data IS 'Per-post FAQ items used for AEO/SEO and JSON-LD injection. Structure: [{"question": "...", "answer": "..."}]';