
-- ====== vip_saved_items (fix collision) ======
DROP POLICY IF EXISTS "Admins can manage saved items" ON public.vip_saved_items;

CREATE POLICY "Admins can manage saved items"
ON public.vip_saved_items FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ====== vip_special_dates ======
DROP POLICY IF EXISTS "Admins can manage special dates" ON public.vip_special_dates;

CREATE POLICY "Admins can manage special dates"
ON public.vip_special_dates FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
