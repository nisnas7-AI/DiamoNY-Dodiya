
-- custom_orders: recreate admin-only policy
CREATE POLICY "Admins manage custom_orders"
ON public.custom_orders FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
