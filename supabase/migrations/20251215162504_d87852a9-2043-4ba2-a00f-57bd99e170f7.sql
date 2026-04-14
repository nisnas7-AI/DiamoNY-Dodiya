-- Create homepage section settings table for design control
CREATE TABLE public.homepage_section_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key TEXT NOT NULL UNIQUE,
  section_name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  padding_top INTEGER DEFAULT 32,
  padding_bottom INTEGER DEFAULT 32,
  background_color TEXT DEFAULT 'transparent',
  background_opacity INTEGER DEFAULT 100,
  background_image_url TEXT,
  title TEXT,
  subtitle TEXT,
  content JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.homepage_section_settings ENABLE ROW LEVEL SECURITY;

-- Public can view settings
CREATE POLICY "Section settings are viewable by everyone"
ON public.homepage_section_settings
FOR SELECT
USING (true);

-- Admins can manage settings
CREATE POLICY "Admins can manage section settings"
ON public.homepage_section_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_homepage_section_settings_updated_at
BEFORE UPDATE ON public.homepage_section_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add banner_opacity to promotions table
ALTER TABLE public.promotions ADD COLUMN IF NOT EXISTS banner_opacity INTEGER DEFAULT 100;

-- Insert default section settings
INSERT INTO public.homepage_section_settings (section_key, section_name, display_order, padding_top, padding_bottom) VALUES
('promo_banner', 'סרגל פרומו עליון', 1, 0, 0),
('hero', 'באנר ראשי', 2, 0, 0),
('trust_indicators', 'אינדיקטורים', 3, 16, 16),
('categories', 'הקולקציות שלנו', 4, 32, 32),
('custom_process', 'מהסקיצה ועד התכשיט', 5, 32, 32),
('testimonials', 'לקוחות ממליצים', 6, 32, 32),
('featured_products', 'מוצרים מומלצים', 7, 32, 32),
('about', 'אודותינו', 8, 32, 32),
('blog_preview', 'מגזין התכשיטים', 9, 32, 32),
('footer', 'פוטר', 10, 32, 32);