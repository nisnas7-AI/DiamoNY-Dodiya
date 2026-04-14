-- ============================================================================
-- page_views: Add rate limiting and input validation for public INSERT
-- This prevents analytics data manipulation and abuse
-- ============================================================================

-- Create a rate limiting function for page_views
-- Allows max 100 inserts per visitor_id per hour
CREATE OR REPLACE FUNCTION public.check_page_view_rate_limit(check_visitor_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*) < 100
  FROM public.page_views
  WHERE visitor_id = check_visitor_id
    AND created_at > NOW() - INTERVAL '1 hour';
$$;

-- Create validation trigger function for page_views
CREATE OR REPLACE FUNCTION public.validate_page_view_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate visitor_id format (should be UUID-like or reasonable length)
  IF NEW.visitor_id IS NULL OR LENGTH(NEW.visitor_id) < 10 OR LENGTH(NEW.visitor_id) > 100 THEN
    RAISE EXCEPTION 'Invalid visitor_id format';
  END IF;

  -- Validate page_path (should start with / and be reasonable length)
  IF NEW.page_path IS NULL OR LENGTH(NEW.page_path) < 1 OR LENGTH(NEW.page_path) > 500 THEN
    RAISE EXCEPTION 'Invalid page_path';
  END IF;
  
  -- Sanitize page_path - remove potential script injections
  IF NEW.page_path ~ '<script|javascript:|data:' THEN
    RAISE EXCEPTION 'Invalid characters in page_path';
  END IF;

  -- Validate optional fields length
  IF NEW.page_title IS NOT NULL AND LENGTH(NEW.page_title) > 500 THEN
    NEW.page_title := LEFT(NEW.page_title, 500);
  END IF;

  IF NEW.utm_source IS NOT NULL AND LENGTH(NEW.utm_source) > 100 THEN
    NEW.utm_source := LEFT(NEW.utm_source, 100);
  END IF;

  IF NEW.utm_medium IS NOT NULL AND LENGTH(NEW.utm_medium) > 100 THEN
    NEW.utm_medium := LEFT(NEW.utm_medium, 100);
  END IF;

  IF NEW.utm_campaign IS NOT NULL AND LENGTH(NEW.utm_campaign) > 100 THEN
    NEW.utm_campaign := LEFT(NEW.utm_campaign, 100);
  END IF;

  -- Enforce rate limiting
  IF NOT public.check_page_view_rate_limit(NEW.visitor_id) THEN
    RAISE EXCEPTION 'Rate limit exceeded for visitor';
  END IF;

  -- Prevent linking to customer/lead unless authenticated (future use)
  -- For now, ensure these are always NULL for public inserts
  NEW.customer_id := NULL;
  NEW.lead_id := NULL;

  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS validate_page_view_before_insert ON public.page_views;
CREATE TRIGGER validate_page_view_before_insert
  BEFORE INSERT ON public.page_views
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_page_view_insert();

-- Add an index to improve rate limit query performance
CREATE INDEX IF NOT EXISTS idx_page_views_visitor_created 
  ON public.page_views (visitor_id, created_at DESC);

-- Update the RLS policy to be more explicit
DROP POLICY IF EXISTS "Anyone can insert page views" ON public.page_views;
CREATE POLICY "Rate-limited anonymous page view tracking"
  ON public.page_views
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);  -- Validation happens in trigger

-- Ensure admins can still read all data
DROP POLICY IF EXISTS "Admins can view all page views" ON public.page_views;
CREATE POLICY "Admins can view all page views"
  ON public.page_views
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));