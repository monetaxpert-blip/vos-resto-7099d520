-- 1. Remove the overly permissive INSERT policy on restaurants.
DROP POLICY IF EXISTS "Authenticated users can create restaurants" ON public.restaurants;

-- Admins keep full access through the existing "Admins full access restaurants" policy.
-- Everyone else must go through the controlled SECURITY DEFINER RPC below.

-- 2. Harden the onboarding RPC so it can never create a privileged/active listing.
CREATE OR REPLACE FUNCTION public.create_restaurant_with_owner(p_name text, p_description text DEFAULT NULL::text, p_address text DEFAULT NULL::text, p_quartier text DEFAULT NULL::text, p_phone text DEFAULT NULL::text, p_cuisine_type text DEFAULT NULL::text, p_average_price numeric DEFAULT NULL::numeric)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid; v_restaurant_id text;
  v_whatsapp_number text; v_whatsapp_link text;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN json_build_object('success', false, 'error', 'Vous devez être connecté'); END IF;
  IF p_name IS NULL OR trim(p_name) = '' THEN RETURN json_build_object('success', false, 'error', 'Le nom du restaurant est requis'); END IF;
  IF length(trim(p_name)) > 120 THEN RETURN json_build_object('success', false, 'error', 'Nom trop long'); END IF;

  v_restaurant_id := gen_random_uuid()::text;
  v_whatsapp_number := NULLIF(regexp_replace(COALESCE(p_phone, ''), '\D', '', 'g'), '');
  IF v_whatsapp_number IS NOT NULL THEN v_whatsapp_link := 'https://wa.me/' || v_whatsapp_number; END IF;

  INSERT INTO public.restaurants (
    id, name, description, address, address_detail, quartier, city,
    phone, categories, cuisine_type, average_price,
    whatsapp_number, whatsapp_link, status,
    is_featured, is_pinned, display_order, badges, admin_plan
  ) VALUES (
    v_restaurant_id, trim(p_name),
    NULLIF(trim(COALESCE(p_description, '')), ''),
    NULLIF(trim(COALESCE(p_address, '')), ''),
    NULLIF(trim(COALESCE(p_address, '')), ''),
    NULLIF(p_quartier, ''), 'Dakar',
    NULLIF(trim(COALESCE(p_phone, '')), ''),
    CASE WHEN p_cuisine_type IS NOT NULL AND length(trim(p_cuisine_type)) > 0
         THEN ARRAY[p_cuisine_type] ELSE '{}'::text[] END,
    NULLIF(p_cuisine_type, ''), p_average_price,
    v_whatsapp_number, v_whatsapp_link, 'pending',
    false, false, 0, '{}'::text[], 'Standard'
  );

  INSERT INTO public.restaurant_owners (user_id, restaurant_id, restaurant_name, is_owned_listing)
  VALUES (v_user_id, v_restaurant_id, trim(p_name), true);

  RETURN json_build_object('success', true, 'restaurant_id', v_restaurant_id);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', 'Création impossible');
END;
$function$;

REVOKE ALL ON FUNCTION public.create_restaurant_with_owner(text, text, text, text, text, text, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_restaurant_with_owner(text, text, text, text, text, text, numeric) TO authenticated, service_role;

-- 3. Keep SECURITY DEFINER surface minimal: internal/trigger + maintenance functions
--    must never be callable from the API roles.
REVOKE ALL ON FUNCTION public.check_and_expire_trials() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.expire_trial_if_due(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.user_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.user_owns_restaurant(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_public_plans() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.activate_subscription_test(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_activate_subscription(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.cancel_order(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.update_review(uuid, integer, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.expire_my_trials() FROM PUBLIC, anon;

-- Re-assert only the grants the app actually needs.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.user_role) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.user_owns_restaurant(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_public_plans() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.activate_subscription_test(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_activate_subscription(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.cancel_order(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_review(uuid, integer, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.expire_my_trials() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_and_expire_trials() TO service_role;
GRANT EXECUTE ON FUNCTION public.expire_trial_if_due(text) TO service_role;