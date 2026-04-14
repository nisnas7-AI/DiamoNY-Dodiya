
CREATE TABLE public.digital_card_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text DEFAULT '',
  whatsapp text DEFAULT '',
  email text DEFAULT '',
  facebook_url text DEFAULT '',
  instagram_url text DEFAULT '',
  about_text text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.digital_card_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read digital card settings"
  ON public.digital_card_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert digital card settings"
  ON public.digital_card_settings FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update digital card settings"
  ON public.digital_card_settings FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Seed a single row
INSERT INTO public.digital_card_settings (phone, whatsapp, email, facebook_url, instagram_url, about_text)
VALUES ('', '972546290534', 'info@diamony.me', '', '', '');
