-- Admin-only RPC: never needed by anonymous visitors
REVOKE EXECUTE ON FUNCTION public.admin_activate_subscription(text) FROM anon;

-- Requires an authenticated user (auth.uid()) to do anything
REVOKE EXECUTE ON FUNCTION public.cancel_order(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_review(uuid, integer, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.expire_my_trials() FROM anon;

-- Maintenance job: backend/system only
REVOKE EXECUTE ON FUNCTION public.check_and_expire_trials() FROM anon;
REVOKE EXECUTE ON FUNCTION public.check_and_expire_trials() FROM authenticated;