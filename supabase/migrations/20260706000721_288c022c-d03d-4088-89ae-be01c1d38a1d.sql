
-- 1) Update enforce_restaurant_active_on_order to run per-restaurant trial expiration first
CREATE OR REPLACE FUNCTION public.enforce_restaurant_active_on_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_active boolean;
BEGIN
  -- First: expire any due trial for this restaurant so is_active reflects reality
  PERFORM public.expire_trial_if_due(NEW.restaurant_id);

  SELECT is_active INTO v_active FROM public.restaurants WHERE id = NEW.restaurant_id;
  IF v_active IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Ce restaurant n''accepte plus de commandes actuellement';
  END IF;
  RETURN NEW;
END;
$function$;

-- 2) Allow anonymous/authenticated clients to trigger bulk expiration before the public listing loads
REVOKE ALL ON FUNCTION public.check_and_expire_trials() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_and_expire_trials() TO anon, authenticated;
