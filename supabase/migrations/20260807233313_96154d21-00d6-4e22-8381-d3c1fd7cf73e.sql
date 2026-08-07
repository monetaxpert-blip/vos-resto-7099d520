-- Option A: pg_cron scheduled expiry (no client RPC exposure, avoids anon DoS surface)
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  PERFORM cron.unschedule('expire-trials-every-15-min');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'expire-trials-every-15-min',
  '*/15 * * * *',
  $$SELECT public.check_and_expire_trials();$$
);

-- Harden subscriptions insert policy: constrain status/price/plan
DROP POLICY IF EXISTS "subs owner insert" ON public.subscriptions;
CREATE POLICY "subs owner insert"
ON public.subscriptions
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND public.user_owns_restaurant(restaurant_id)
  AND status = 'pending'
  AND price = 10000
  AND lower(plan) = 'pro'
);