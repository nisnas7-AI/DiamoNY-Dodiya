-- =====================================================
-- SECURITY FIX: Create Private Storage Bucket for Sensitive Files
-- =====================================================

-- 1. Create a private bucket for order and customer files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'private-files',
  'private-files', 
  false,  -- NOT public - requires authentication
  52428800,  -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'video/mp4', 'video/webm']
)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS Policies for the private bucket - Admin only access
CREATE POLICY "Only admins can view private files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'private-files' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Only admins can upload private files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'private-files' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Only admins can update private files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'private-files' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Only admins can delete private files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'private-files' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- =====================================================
-- SECURITY FIX: Add Input Validation to Leads Table
-- =====================================================

-- Create a validation function for leads insertion
CREATE OR REPLACE FUNCTION public.validate_lead_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate email format (basic check)
  IF NEW.email IS NULL OR NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Validate name is not empty and not too long
  IF NEW.name IS NULL OR LENGTH(TRIM(NEW.name)) < 2 OR LENGTH(NEW.name) > 100 THEN
    RAISE EXCEPTION 'Name must be between 2 and 100 characters';
  END IF;
  
  -- Validate message is not empty and not too long
  IF NEW.message IS NULL OR LENGTH(TRIM(NEW.message)) < 10 OR LENGTH(NEW.message) > 5000 THEN
    RAISE EXCEPTION 'Message must be between 10 and 5000 characters';
  END IF;
  
  -- Validate phone format if provided (optional field)
  IF NEW.phone IS NOT NULL AND NEW.phone != '' AND NEW.phone !~ '^[\+]?[0-9\s\-\(\)]{7,20}$' THEN
    RAISE EXCEPTION 'Invalid phone format';
  END IF;
  
  -- Sanitize and normalize email (lowercase)
  NEW.email := LOWER(TRIM(NEW.email));
  
  -- Sanitize name (trim whitespace)
  NEW.name := TRIM(NEW.name);
  
  -- Set default status
  IF NEW.status IS NULL THEN
    NEW.status := 'new';
  END IF;
  
  -- Ensure created_at is set
  IF NEW.created_at IS NULL THEN
    NEW.created_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for lead validation
DROP TRIGGER IF EXISTS validate_lead_before_insert ON public.leads;
CREATE TRIGGER validate_lead_before_insert
  BEFORE INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_lead_insert();

-- =====================================================
-- SECURITY FIX: Add Rate Limiting Function for Leads
-- =====================================================

-- Function to check if IP has exceeded rate limit
CREATE OR REPLACE FUNCTION public.check_lead_rate_limit(check_ip text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count integer;
BEGIN
  -- Count leads from this IP in the last hour
  SELECT COUNT(*) INTO recent_count
  FROM public.leads
  WHERE ip_address = check_ip
    AND created_at > NOW() - INTERVAL '1 hour';
  
  -- Allow max 5 submissions per hour per IP
  RETURN recent_count < 5;
END;
$$;

-- =====================================================
-- SECURITY ENHANCEMENT: Add Audit Columns to Sensitive Tables
-- =====================================================

-- Add last_accessed_at to customers for audit trail (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'last_accessed_at'
  ) THEN
    ALTER TABLE public.customers ADD COLUMN last_accessed_at timestamp with time zone;
  END IF;
END $$;

-- Add accessed_by to custom_orders for audit (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'custom_orders' AND column_name = 'last_modified_by'
  ) THEN
    ALTER TABLE public.custom_orders ADD COLUMN last_modified_by uuid;
  END IF;
END $$;