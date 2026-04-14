
-- Create a secure function for VIP login by phone lookup
-- Returns only the card UID, never exposes user data directly
CREATE OR REPLACE FUNCTION public.vip_login_by_phone(lookup_phone text)
RETURNS TABLE(card_uid text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT vc.uid
  FROM public.vip_users vu
  JOIN public.vip_cards vc ON vc.user_id = vu.id
  WHERE vu.phone = lookup_phone
    AND vc.status = 'active'
  LIMIT 1;
END;
$$;

-- Create a secure function for VIP profile read by user_id
-- Only returns fields needed for the profile page
CREATE OR REPLACE FUNCTION public.vip_get_profile(p_user_id uuid)
RETURNS TABLE(
  id uuid,
  name text,
  phone text,
  wallet_balance numeric,
  dates_json jsonb,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT vu.id, vu.name, vu.phone, vu.wallet_balance, vu.dates_json, vu.created_at
  FROM public.vip_users vu
  WHERE vu.id = p_user_id;
END;
$$;

-- Create a secure function for VIP profile updates
CREATE OR REPLACE FUNCTION public.vip_update_profile(
  p_user_id uuid,
  p_phone text DEFAULT NULL,
  p_dates_json jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate user exists
  IF NOT EXISTS (SELECT 1 FROM public.vip_users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'VIP user not found';
  END IF;
  
  -- Validate phone format if provided
  IF p_phone IS NOT NULL AND p_phone != '' AND p_phone !~ '^[\+]?[0-9\s\-\(\)]{7,20}$' THEN
    RAISE EXCEPTION 'Invalid phone format';
  END IF;

  IF p_phone IS NOT NULL THEN
    UPDATE public.vip_users SET phone = p_phone, updated_at = now() WHERE id = p_user_id;
  END IF;

  IF p_dates_json IS NOT NULL THEN
    UPDATE public.vip_users SET dates_json = p_dates_json, updated_at = now() WHERE id = p_user_id;
  END IF;
END;
$$;
