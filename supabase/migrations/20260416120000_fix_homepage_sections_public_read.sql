-- Restore public homepage_sections reads for the default tenant without requiring is_active = true.
-- Previous white-label policy used COALESCE(is_active, true), which still hides rows where is_active = false
-- (unlike the earlier "Anyone can read homepage sections" USING (true) policy).

DROP POLICY IF EXISTS "Public reads homepage sections default brand" ON public.homepage_sections;

CREATE POLICY "Public reads homepage sections default brand"
  ON public.homepage_sections FOR SELECT
  USING (brand_id = public.default_brand_id());
