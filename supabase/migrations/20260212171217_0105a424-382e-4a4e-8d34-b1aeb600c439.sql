
CREATE OR REPLACE FUNCTION public.vip_login_by_phone(lookup_phone text)
 RETURNS TABLE(card_uid text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT vc.card_code
  FROM public.vip_users vu
  JOIN public.vip_cards vc ON vc.customer_id = vu.id
  WHERE vu.phone = lookup_phone
    AND vc.status != 'banned'
  LIMIT 1;
END;
$function$;
