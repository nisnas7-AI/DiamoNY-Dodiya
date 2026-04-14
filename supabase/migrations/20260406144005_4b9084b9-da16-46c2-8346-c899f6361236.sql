
-- 1. Enable RLS on site_reviews (if present)
DO $$
BEGIN
  IF to_regclass('public.site_reviews') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.site_reviews ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

-- 2. Fix products INSERT policy (replace true with admin check)
DROP POLICY IF EXISTS "Admin can insert products" ON public.products;
CREATE POLICY "Admins insert products"
  ON public.products FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. Fix products UPDATE policy
DROP POLICY IF EXISTS "Admin can update products" ON public.products;
CREATE POLICY "Admins update products"
  ON public.products FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 4. Fix product_images INSERT policy
DROP POLICY IF EXISTS "Admin can insert product_images" ON public.product_images;
CREATE POLICY "Admins insert product_images"
  ON public.product_images FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 5. Fix product_aeo_specs INSERT policy (optional table)
DO $$
BEGIN
  IF to_regclass('public.product_aeo_specs') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admin can insert specs" ON public.product_aeo_specs';
    EXECUTE 'CREATE POLICY "Admins insert specs" ON public.product_aeo_specs FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), ''admin''::app_role))';
  END IF;
END $$;

-- 6. Fix product_aeo_specs UPDATE policy (optional table)
DO $$
BEGIN
  IF to_regclass('public.product_aeo_specs') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admin can update specs" ON public.product_aeo_specs';
    EXECUTE 'CREATE POLICY "Admins update specs" ON public.product_aeo_specs FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), ''admin''::app_role))';
  END IF;
END $$;

-- 7. Create server-side PIN verification function (avoids exposing plaintext PIN to client)
CREATE OR REPLACE FUNCTION public.verify_admin_pin(pin_attempt text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN false;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM public.admin_settings
    WHERE pin_code = pin_attempt
    LIMIT 1
  );
END;
$$;

-- Only authenticated users can call it
REVOKE EXECUTE ON FUNCTION public.verify_admin_pin(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.verify_admin_pin(text) TO authenticated;

-- 8. Revoke direct SELECT on admin_settings pin_code from non-service roles
-- We keep the existing admin SELECT policy but the RPC is the recommended path
