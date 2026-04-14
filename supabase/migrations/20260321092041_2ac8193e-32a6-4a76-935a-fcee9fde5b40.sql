
CREATE TABLE public.web_presence_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  favicon_original_url text,
  favicon_16 text,
  favicon_32 text,
  favicon_48 text,
  favicon_180 text,
  favicon_192 text,
  favicon_512 text,
  favicon_version bigint NOT NULL DEFAULT 0,
  theme_color text NOT NULL DEFAULT '#1a1a1a',
  og_image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.web_presence_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage web_presence"
  ON public.web_presence_settings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can read web_presence"
  ON public.web_presence_settings FOR SELECT
  TO public
  USING (true);

-- Insert default row
INSERT INTO public.web_presence_settings (theme_color) VALUES ('#1a1a1a');
