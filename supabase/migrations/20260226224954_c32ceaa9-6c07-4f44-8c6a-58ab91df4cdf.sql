
-- ====== vip_personalized_offers: remove leftover public policies ======
DROP POLICY IF EXISTS "Public can read personalized offers" ON public.vip_personalized_offers;
DROP POLICY IF EXISTS "Public can update is_read on offers" ON public.vip_personalized_offers;
DROP POLICY IF EXISTS "Admins can manage personalized offers" ON public.vip_personalized_offers;
-- Recreate admin-only with correct TO clause
DROP POLICY IF EXISTS "Admins can manage offers" ON public.vip_personalized_offers;
CREATE POLICY "Admins can manage offers"
ON public.vip_personalized_offers FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ====== vip_saved_items: remove leftover public policies ======
DROP POLICY IF EXISTS "Public can read saved items" ON public.vip_saved_items;
DROP POLICY IF EXISTS "Public can insert saved items" ON public.vip_saved_items;
DROP POLICY IF EXISTS "Public can delete saved items" ON public.vip_saved_items;

-- ====== vip_special_dates: remove leftover public policies + duplicate admin ======
DROP POLICY IF EXISTS "Public can read special dates" ON public.vip_special_dates;
DROP POLICY IF EXISTS "Public can insert special dates" ON public.vip_special_dates;
DROP POLICY IF EXISTS "Public can update special dates" ON public.vip_special_dates;
DROP POLICY IF EXISTS "Public can delete special dates" ON public.vip_special_dates;
DROP POLICY IF EXISTS "Admins can manage vip_special_dates" ON public.vip_special_dates;

-- ====== vip_login_attempts: fix old public policy with wrong role ======
DROP POLICY IF EXISTS "Public can insert login attempts" ON public.vip_login_attempts;

-- ====== vip_members: consolidate to granular policies ======
DROP POLICY IF EXISTS "Admins can manage vip_members" ON public.vip_members;
DROP POLICY IF EXISTS "Admins can read all vip_members" ON public.vip_members;
DROP POLICY IF EXISTS "Admins can insert vip_members" ON public.vip_members;
DROP POLICY IF EXISTS "Admins can update vip_members" ON public.vip_members;
DROP POLICY IF EXISTS "Admins can delete vip_members" ON public.vip_members;

CREATE POLICY "Admins manage vip_members"
ON public.vip_members FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ====== custom_orders: fix old policy names (Admins delete/insert/read/update orders) ======
DROP POLICY IF EXISTS "Admins delete orders" ON public.custom_orders;
DROP POLICY IF EXISTS "Admins insert orders" ON public.custom_orders;
DROP POLICY IF EXISTS "Admins read orders" ON public.custom_orders;
DROP POLICY IF EXISTS "Admins update orders" ON public.custom_orders;
