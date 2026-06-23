CREATE OR REPLACE FUNCTION public.get_public_plans()
 RETURNS TABLE(restaurant_id text, plan text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT ro.restaurant_id, ro.plan::text
  FROM public.restaurant_owners ro
  WHERE ro.status = 'active'
    AND (ro.subscription_ends_at IS NULL OR ro.subscription_ends_at > now());
$function$;