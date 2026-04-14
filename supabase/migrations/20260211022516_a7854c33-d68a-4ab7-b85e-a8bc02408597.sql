
DROP FUNCTION IF EXISTS public.public_get_deal_preview(uuid);

CREATE OR REPLACE FUNCTION public.public_get_deal_preview(p_deal_id uuid)
RETURNS TABLE(id uuid, title text, stone_details jsonb, customer_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT d.id, d.title, d.stone_details, c.full_name as customer_name
  FROM deals d
  LEFT JOIN customers c ON c.id = d.customer_id
  WHERE d.id = p_deal_id;
END;
$$;
