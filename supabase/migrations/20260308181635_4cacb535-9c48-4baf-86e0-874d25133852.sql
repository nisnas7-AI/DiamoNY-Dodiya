
-- Single-row brand configuration table
CREATE TABLE public.brand_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name text NOT NULL DEFAULT 'DiamoNY',
  logo_url text NOT NULL DEFAULT '/lovable-uploads/083379c4-874c-46e2-949d-4b7023e62bc4.png',
  footer_about_text text NOT NULL DEFAULT 'צורפות עילית בעיצוב אישי. תכשיטי יוקרה בהתאמה אישית וקולקציות ייחודיות מאז 2010.',
  support_email text NOT NULL DEFAULT 'info@diamony.co.il',
  whatsapp_number text NOT NULL DEFAULT '972546290534',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed default row
INSERT INTO public.brand_settings (brand_name) VALUES ('DiamoNY');

-- RLS
ALTER TABLE public.brand_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read brand settings"
  ON public.brand_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can update brand settings"
  ON public.brand_settings FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert brand settings"
  ON public.brand_settings FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
