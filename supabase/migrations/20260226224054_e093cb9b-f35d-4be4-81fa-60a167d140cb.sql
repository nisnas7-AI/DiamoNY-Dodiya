
-- Fix leads table: drop restrictive policies and recreate as proper PERMISSIVE policies
DROP POLICY IF EXISTS "Admins can delete leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can read leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can update leads" ON public.leads;
DROP POLICY IF EXISTS "Public can insert leads" ON public.leads;

-- Recreate as PERMISSIVE (default) policies
CREATE POLICY "Admins can read leads"
ON public.leads FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update leads"
ON public.leads FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete leads"
ON public.leads FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can insert leads"
ON public.leads FOR INSERT
TO anon, authenticated
WITH CHECK (true);
