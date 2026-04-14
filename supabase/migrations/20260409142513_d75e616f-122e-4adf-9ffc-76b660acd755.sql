
ALTER TABLE public.digital_card_settings
  ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '#0A3B2C',
  ADD COLUMN IF NOT EXISTS accent_color text DEFAULT '#D4AF37',
  ADD COLUMN IF NOT EXISTS text_color text DEFAULT '#0A3B2C',
  ADD COLUMN IF NOT EXISTS bg_color text DEFAULT '#FFFFFF',
  ADD COLUMN IF NOT EXISTS font_family text DEFAULT 'Assistant',
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS icon_phone_url text,
  ADD COLUMN IF NOT EXISTS icon_whatsapp_url text,
  ADD COLUMN IF NOT EXISTS icon_email_url text,
  ADD COLUMN IF NOT EXISTS icon_facebook_url text,
  ADD COLUMN IF NOT EXISTS icon_instagram_url text,
  ADD COLUMN IF NOT EXISTS icon_catalog_url text;
