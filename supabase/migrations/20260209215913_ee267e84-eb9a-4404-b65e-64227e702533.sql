
-- VIP global settings
CREATE TABLE public.vip_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  discount_percentage integer NOT NULL DEFAULT 10,
  global_vip_announcement text,
  is_locked boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.vip_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read vip settings" ON public.vip_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage vip settings" ON public.vip_settings FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Seed default row
INSERT INTO public.vip_settings (discount_percentage, is_locked) VALUES (10, false);

-- VIP pages config
CREATE TABLE public.vip_pages_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_slug text NOT NULL UNIQUE,
  page_name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  hero_image_url text,
  display_effect text DEFAULT 'none',
  gallery_layout text DEFAULT 'grid-3',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.vip_pages_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read vip pages config" ON public.vip_pages_config FOR SELECT USING (true);
CREATE POLICY "Admins can manage vip pages config" ON public.vip_pages_config FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Seed default pages
INSERT INTO public.vip_pages_config (page_slug, page_name, is_active, gallery_layout) VALUES
  ('collection', 'The Vault — קולקציה בלעדית', true, 'grid-3'),
  ('maintenance', 'Jewelry Spa — טיפול בתכשיטים', true, 'grid-2'),
  ('profile', 'My Legacy — הפרופיל שלי', true, 'grid-2');
