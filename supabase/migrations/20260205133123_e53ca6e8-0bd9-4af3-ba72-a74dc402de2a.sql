-- =============================================
-- Create Pages Table for CMS
-- =============================================

-- 1. Create the pages table
CREATE TABLE IF NOT EXISTS public.pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  seo_title TEXT,
  meta_description TEXT,
  h1_title TEXT,
  content_blocks JSONB DEFAULT '{"blocks": []}'::jsonb,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 2. Add unique constraint and index on slug for fast lookups
ALTER TABLE public.pages 
  ADD CONSTRAINT pages_slug_unique UNIQUE (slug);

CREATE INDEX IF NOT EXISTS pages_slug_idx ON public.pages (slug);
CREATE INDEX IF NOT EXISTS pages_is_published_idx ON public.pages (is_published);

-- 3. Add comment for documentation
COMMENT ON TABLE public.pages IS 'CMS pages - Source of Truth for all site pages';
COMMENT ON COLUMN public.pages.slug IS 'URL path for the page (e.g., "about-us", "services/design")';
COMMENT ON COLUMN public.pages.content_blocks IS 'Modular page content stored as JSONB blocks';

-- 4. Create updated_at trigger
CREATE TRIGGER update_pages_updated_at
  BEFORE UPDATE ON public.pages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Enable Row Level Security
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
-- Public can read only published pages
CREATE POLICY "Published pages are viewable by everyone"
  ON public.pages
  FOR SELECT
  USING (is_published = true);

-- Admins have full access
CREATE POLICY "Admins can manage pages"
  ON public.pages
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));