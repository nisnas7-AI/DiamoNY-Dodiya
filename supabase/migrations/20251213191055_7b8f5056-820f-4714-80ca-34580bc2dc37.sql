
-- Add super_admin to the existing app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';

-- Create homepage_sections table for managing hero and other sections
CREATE TABLE public.homepage_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    title TEXT,
    subtitle TEXT,
    content TEXT,
    image_url TEXT,
    cta_primary_text TEXT,
    cta_primary_url TEXT,
    cta_secondary_text TEXT,
    cta_secondary_url TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create homepage_categories table for editable category cards
CREATE TABLE public.homepage_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_en TEXT,
    image_url TEXT,
    link_url TEXT DEFAULT '/catalog',
    category_slug TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create promotions table for managing promotional banners and pages
CREATE TABLE public.promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    content TEXT,
    banner_image_url TEXT,
    banner_text TEXT,
    banner_text_color TEXT DEFAULT '#FFFFFF',
    banner_text_position TEXT DEFAULT 'center',
    discount_code TEXT,
    discount_percent INTEGER,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    show_on_homepage BOOLEAN DEFAULT false,
    slug TEXT NOT NULL UNIQUE,
    cta_text TEXT DEFAULT 'לצפייה במבצע',
    cta_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for homepage_sections
CREATE POLICY "Active sections are viewable by everyone"
ON public.homepage_sections
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage homepage sections"
ON public.homepage_sections
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for homepage_categories
CREATE POLICY "Active categories are viewable by everyone"
ON public.homepage_categories
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage homepage categories"
ON public.homepage_categories
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for promotions
CREATE POLICY "Active promotions are viewable by everyone"
ON public.promotions
FOR SELECT
USING (is_active = true AND (start_date IS NULL OR start_date <= now()) AND (end_date IS NULL OR end_date >= now()));

CREATE POLICY "Admins can manage promotions"
ON public.promotions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create triggers for updated_at
CREATE TRIGGER update_homepage_sections_updated_at
BEFORE UPDATE ON public.homepage_sections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_homepage_categories_updated_at
BEFORE UPDATE ON public.homepage_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_promotions_updated_at
BEFORE UPDATE ON public.promotions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default homepage sections
INSERT INTO public.homepage_sections (key, title, subtitle, cta_primary_text, cta_primary_url, cta_secondary_text, cta_secondary_url) VALUES
('hero', 'תכשיטים שמספרים את הסיפור שלך', 'עיצוב אישי | יהלומים טבעיים | אומנות ישראלית', 'לתיאום פגישת עיצוב', '/contact', 'לצפייה בקולקציה', '/catalog');

-- Insert default homepage categories
INSERT INTO public.homepage_categories (name, name_en, category_slug, display_order, image_url) VALUES
('טבעות', 'Rings', 'rings', 1, NULL),
('עגילים', 'Earrings', 'earrings', 2, NULL),
('תליונים', 'Pendants', 'pendants', 3, NULL),
('צמידים', 'Bracelets', 'bracelets', 4, NULL);
