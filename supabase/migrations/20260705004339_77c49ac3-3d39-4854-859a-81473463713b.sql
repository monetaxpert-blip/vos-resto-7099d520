
-- 1. Per-restaurant expiry check (called on dashboard load)
CREATE OR REPLACE FUNCTION public.expire_trial_if_due(p_restaurant_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If there is any active row for this restaurant, do nothing
  IF EXISTS (
    SELECT 1 FROM public.restaurant_owners
    WHERE restaurant_id = p_restaurant_id
      AND status = 'active'
      AND (subscription_ends_at IS NULL OR subscription_ends_at > now())
  ) THEN
    RETURN;
  END IF;

  UPDATE public.restaurant_owners
  SET status = 'expired', updated_at = now()
  WHERE restaurant_id = p_restaurant_id
    AND status = 'trial'
    AND trial_ends_at <= now();

  -- If no active row remains, hide the restaurant from public listing
  IF NOT EXISTS (
    SELECT 1 FROM public.restaurant_owners
    WHERE restaurant_id = p_restaurant_id
      AND status = 'active'
      AND (subscription_ends_at IS NULL OR subscription_ends_at > now())
  ) AND EXISTS (
    SELECT 1 FROM public.restaurant_owners
    WHERE restaurant_id = p_restaurant_id AND status IN ('expired','cancelled')
  ) THEN
    UPDATE public.restaurants
    SET is_active = false, updated_at = now()
    WHERE id = p_restaurant_id AND is_active = true;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.expire_trial_if_due(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.expire_trial_if_due(text) TO authenticated;

-- 2. Bulk expiry (safe to call by anyone; only expires overdue trials)
CREATE OR REPLACE FUNCTION public.check_and_expire_trials()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  WITH to_expire AS (
    SELECT ro.id, ro.restaurant_id
    FROM public.restaurant_owners ro
    WHERE ro.status = 'trial'
      AND ro.trial_ends_at <= now()
      AND NOT EXISTS (
        SELECT 1 FROM public.restaurant_owners ro2
        WHERE ro2.restaurant_id = ro.restaurant_id
          AND ro2.status = 'active'
          AND (ro2.subscription_ends_at IS NULL OR ro2.subscription_ends_at > now())
      )
  ),
  upd AS (
    UPDATE public.restaurant_owners ro
    SET status = 'expired', updated_at = now()
    FROM to_expire te
    WHERE ro.id = te.id
    RETURNING ro.restaurant_id
  )
  UPDATE public.restaurants r
  SET is_active = false, updated_at = now()
  WHERE r.id IN (SELECT restaurant_id FROM upd)
    AND r.is_active = true
    AND NOT EXISTS (
      SELECT 1 FROM public.restaurant_owners ro3
      WHERE ro3.restaurant_id = r.id
        AND ro3.status = 'active'
        AND (ro3.subscription_ends_at IS NULL OR ro3.subscription_ends_at > now())
    );

  SELECT count(*) INTO v_count FROM public.restaurant_owners
  WHERE status = 'expired' AND updated_at > now() - interval '5 seconds';
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.check_and_expire_trials() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_and_expire_trials() TO authenticated;

-- 3. Per-user expiry check
CREATE OR REPLACE FUNCTION public.expire_my_trials()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  FOR r IN
    SELECT restaurant_id FROM public.restaurant_owners
    WHERE user_id = auth.uid() AND status = 'trial' AND trial_ends_at <= now()
  LOOP
    PERFORM public.expire_trial_if_due(r.restaurant_id);
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.expire_my_trials() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.expire_my_trials() TO authenticated;

-- 4. Admin activation: sets everything atomically with proper dates
CREATE OR REPLACE FUNCTION public.admin_activate_subscription(p_restaurant_id text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL OR NOT public.has_role(v_uid, 'admin') THEN
    RETURN json_build_object('success', false, 'error', 'Non autorisé');
  END IF;

  UPDATE public.restaurants SET status = 'active', updated_at = now() WHERE id = p_restaurant_id;

  UPDATE public.restaurant_owners
  SET status = 'active',
      subscription_started_at = COALESCE(subscription_started_at, now()),
      subscription_ends_at = COALESCE(subscription_started_at, now()) + interval '30 days',
      subscription_mode = 'paid',
      payment_enabled = true,
      updated_at = now()
  WHERE restaurant_id = p_restaurant_id;

  UPDATE public.subscriptions
  SET status = 'active', validated_at = now()
  WHERE restaurant_id = p_restaurant_id AND status = 'pending';

  RETURN json_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_activate_subscription(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_activate_subscription(text) TO authenticated;

-- 5. Backfill existing active rows missing subscription dates
UPDATE public.restaurant_owners
SET subscription_started_at = COALESCE(subscription_started_at, updated_at, now()),
    subscription_ends_at = COALESCE(subscription_started_at, updated_at, now()) + interval '30 days',
    updated_at = now()
WHERE status = 'active' AND subscription_ends_at IS NULL;

-- 6. Trigger to reject orders on inactive restaurants
CREATE OR REPLACE FUNCTION public.enforce_restaurant_active_on_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_active boolean;
BEGIN
  SELECT is_active INTO v_active FROM public.restaurants WHERE id = NEW.restaurant_id;
  IF v_active IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Ce restaurant n''accepte plus de commandes actuellement';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_restaurant_active_on_order ON public.orders;
CREATE TRIGGER trg_enforce_restaurant_active_on_order
BEFORE INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.enforce_restaurant_active_on_order();

-- Run initial cleanup
SELECT public.check_and_expire_trials();
