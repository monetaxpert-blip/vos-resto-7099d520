
-- =========================================================
-- PART A.1 — restaurant_owners: lock down self-service writes
-- =========================================================
DROP POLICY IF EXISTS "Users insert own ownership" ON public.restaurant_owners;
DROP POLICY IF EXISTS "Users update own ownership" ON public.restaurant_owners;
DROP POLICY IF EXISTS "Users delete own ownership" ON public.restaurant_owners;
DROP POLICY IF EXISTS "Public can read plan info" ON public.restaurant_owners;

-- Owner can read their own ownership; admin can read all.
DROP POLICY IF EXISTS "Owner reads own ownership" ON public.restaurant_owners;
CREATE POLICY "Owner reads own ownership"
ON public.restaurant_owners
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin manages ownership" ON public.restaurant_owners;
CREATE POLICY "Admin manages ownership"
ON public.restaurant_owners
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- PART A.1b — Public plan view for badges
-- =========================================================
CREATE OR REPLACE VIEW public.restaurant_plan_public
WITH (security_invoker = true) AS
SELECT
  ro.restaurant_id,
  ro.plan
FROM public.restaurant_owners ro
WHERE ro.status = 'active'
   OR (ro.status = 'trial' AND ro.trial_ends_at > now());

-- The view is security_invoker, but base table RLS blocks anon.
-- We need a SECURITY DEFINER function to expose this safely.
CREATE OR REPLACE FUNCTION public.get_public_plans()
RETURNS TABLE(restaurant_id text, plan text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ro.restaurant_id, ro.plan::text
  FROM public.restaurant_owners ro
  WHERE ro.status = 'active'
     OR (ro.status = 'trial' AND ro.trial_ends_at > now());
$$;

REVOKE ALL ON FUNCTION public.get_public_plans() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_plans() TO anon, authenticated;

-- =========================================================
-- PART A.1c — Activate subscription via SECURITY DEFINER fn
-- =========================================================
CREATE OR REPLACE FUNCTION public.activate_subscription_test(
  p_ownership_id uuid,
  p_plan text
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
  v_owner uuid;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Non authentifié');
  END IF;
  IF p_plan NOT IN ('PRO', 'PREMIUM', 'ELITE') THEN
    RETURN json_build_object('success', false, 'error', 'Plan invalide');
  END IF;

  SELECT user_id INTO v_owner FROM public.restaurant_owners WHERE id = p_ownership_id;
  IF v_owner IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Abonnement introuvable');
  END IF;
  IF v_owner <> v_uid AND NOT public.has_role(v_uid, 'admin') THEN
    RETURN json_build_object('success', false, 'error', 'Non autorisé');
  END IF;

  UPDATE public.restaurant_owners
  SET plan = p_plan,
      status = 'active',
      subscription_started_at = now(),
      subscription_ends_at = now() + interval '30 days',
      subscription_mode = 'test',
      payment_enabled = false,
      updated_at = now()
  WHERE id = p_ownership_id;

  RETURN json_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION public.activate_subscription_test(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.activate_subscription_test(uuid, text) TO authenticated;

-- =========================================================
-- PART A.2 — owned_restaurants: hide sensitive columns
-- =========================================================
DROP POLICY IF EXISTS "Owned restaurants publicly viewable" ON public.owned_restaurants;
DROP POLICY IF EXISTS "Owner reads own listing" ON public.owned_restaurants;
DROP POLICY IF EXISTS "Owner manages own listing" ON public.owned_restaurants;
DROP POLICY IF EXISTS "Admin manages owned listings" ON public.owned_restaurants;

CREATE POLICY "Owner reads own listing"
ON public.owned_restaurants
FOR SELECT
TO authenticated
USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owner manages own listing"
ON public.owned_restaurants
FOR ALL
TO authenticated
USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE VIEW public.owned_restaurants_public
WITH (security_invoker = false) AS
SELECT
  id, name, address, quartier, city, categories, price_level, hours, created_at
FROM public.owned_restaurants;

REVOKE ALL ON public.owned_restaurants_public FROM PUBLIC;
GRANT SELECT ON public.owned_restaurants_public TO anon, authenticated;

-- =========================================================
-- PART A.4 — realtime.messages: deny anon, allow authenticated
-- =========================================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'realtime' AND tablename = 'messages') THEN
    EXECUTE 'ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY';

    -- Drop any prior helper policies we may have created
    EXECUTE 'DROP POLICY IF EXISTS "auth read messages" ON realtime.messages';
    EXECUTE 'DROP POLICY IF EXISTS "auth write messages" ON realtime.messages';

    EXECUTE $p$
      CREATE POLICY "auth read messages"
      ON realtime.messages
      FOR SELECT
      TO authenticated
      USING (true)
    $p$;

    EXECUTE $p$
      CREATE POLICY "auth write messages"
      ON realtime.messages
      FOR INSERT
      TO authenticated
      WITH CHECK (true)
    $p$;
  END IF;
END $$;

-- =========================================================
-- PART A.5 — Tighten SECURITY DEFINER function execute grants
-- =========================================================
REVOKE ALL ON FUNCTION public.has_role(uuid, public.user_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.user_role) TO authenticated;

REVOKE ALL ON FUNCTION public.user_owns_restaurant(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.user_owns_restaurant(text) TO authenticated;
