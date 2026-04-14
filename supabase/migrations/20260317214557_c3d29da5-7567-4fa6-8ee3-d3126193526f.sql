
-- Remove the overly-permissive policy
DROP POLICY IF EXISTS "Anyone can read settings" ON public.site_settings;

-- Add narrow public SELECT for non-sensitive keys only
DROP POLICY IF EXISTS "Public can view non-sensitive settings" ON public.site_settings;
CREATE POLICY "Public can view non-sensitive settings"
  ON public.site_settings FOR SELECT
  TO public
  USING (key IN ('email_forms_enabled', 'sticky_social_bar'));
