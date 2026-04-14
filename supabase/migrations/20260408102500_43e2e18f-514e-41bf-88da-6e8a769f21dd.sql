
-- 1. Fix storage policies: scope to admin role
DROP POLICY IF EXISTS "Admin can insert storage objects" ON storage.objects;
DROP POLICY IF EXISTS "Admin can update storage objects" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete storage objects" ON storage.objects;

-- Also fix the vip-assets authenticated policy
DROP POLICY IF EXISTS "Authenticated users can update vip assets" ON storage.objects;

-- Also fix reviews bucket policies that use authenticated without admin check
DROP POLICY IF EXISTS "Authenticated manage reviews" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update reviews" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload reviews" ON storage.objects;

-- Create admin-only storage write policies
CREATE POLICY "Admins can insert storage objects"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update storage objects"
  ON storage.objects FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete storage objects"
  ON storage.objects FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Fix social_settings: restrict SELECT to admin, create safe public view
DROP POLICY IF EXISTS "Anyone can read social" ON public.social_settings;

CREATE POLICY "Admins can read social settings"
  ON public.social_settings FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create a public view that strips access tokens
CREATE OR REPLACE VIEW public.social_settings_public AS
  SELECT
    id,
    platform,
    is_enabled,
    config - 'access_token' AS config,
    created_at,
    updated_at
  FROM public.social_settings;

GRANT SELECT ON public.social_settings_public TO anon, authenticated;

-- 3. Fix order price manipulation: add CHECK constraints via triggers
CREATE OR REPLACE FUNCTION public.validate_order_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.total_amount < 0 THEN
    RAISE EXCEPTION 'Order total must be non-negative';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_order_before_insert
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_order_insert();

CREATE OR REPLACE FUNCTION public.validate_order_item_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.price_at_purchase < 0 THEN
    RAISE EXCEPTION 'Price must be non-negative';
  END IF;
  IF NEW.quantity < 1 THEN
    RAISE EXCEPTION 'Quantity must be at least 1';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_order_item_before_insert
  BEFORE INSERT ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_order_item_insert();
