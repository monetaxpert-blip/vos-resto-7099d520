-- Revoke default PUBLIC EXECUTE from all SECURITY DEFINER functions in public schema
REVOKE EXECUTE ON FUNCTION public.notify_client_on_order_status() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_owners_on_new_order() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_order_status_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_review_helpful_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_restaurant_owner_role() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_review_aggregates() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_owners_on_new_reservation() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_client_on_reservation_status() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_restaurant_is_active() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.expire_trial_if_due(text) FROM PUBLIC, anon, authenticated;

-- RPCs / helpers callable from client
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, user_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, user_role) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.user_owns_restaurant(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_owns_restaurant(text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_public_plans() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_plans() TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.check_and_expire_trials() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_and_expire_trials() TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.create_restaurant_with_owner(text, text, text, text, text, text, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_restaurant_with_owner(text, text, text, text, text, text, numeric) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.activate_subscription_test(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.activate_subscription_test(uuid, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.cancel_order(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_order(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.expire_my_trials() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.expire_my_trials() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_activate_subscription(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_activate_subscription(text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.update_review(uuid, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_review(uuid, integer, text) TO authenticated;