
-- Fix 1: Remove overly permissive public SELECT on vip_users
DROP POLICY IF EXISTS "Anyone can read vip users" ON public.vip_users;

-- Create a public view with ONLY non-sensitive fields needed by VIP-facing pages
CREATE OR REPLACE VIEW public.vip_users_safe
WITH (security_invoker = on) AS
  SELECT id, name, wallet_balance
  FROM public.vip_users;

-- Grant access to the view for anon/authenticated
GRANT SELECT ON public.vip_users_safe TO anon, authenticated;

-- Add a restricted SELECT policy: only admins can read from the base table directly
-- (The existing "Admins manage vip users" ALL policy already covers admin access,
--  but we add an explicit one for clarity)
CREATE POLICY "Only admins can read vip_users"
  ON public.vip_users FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));
