
-- 1) restaurant_owners self-insert lockdown
DROP POLICY IF EXISTS "Owners insert own restaurant ownerships" ON public.restaurant_owners;

-- 2) realtime.messages: remove open Broadcast/Presence access
DROP POLICY IF EXISTS "auth read messages" ON realtime.messages;
DROP POLICY IF EXISTS "auth write messages" ON realtime.messages;

-- 3) restaurants: hide email from anon (phone stays public for tel: link)
REVOKE SELECT (email) ON public.restaurants FROM anon;

-- 4) Drop SECURITY DEFINER views (unused)
DROP VIEW IF EXISTS public.owned_restaurants_public;
DROP VIEW IF EXISTS public.restaurant_plan_public;

-- 5) Storage: remove broad SELECT policies that enable listing
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Restaurant photos publicly readable" ON storage.objects;

-- 6) Revoke EXECUTE on internal trigger/helper functions from API roles
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_restaurant_owner_role() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_client_on_order_status() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_client_on_reservation_status() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_owners_on_new_order() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_owners_on_new_reservation() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_order_status_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_review_aggregates() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_review_helpful_count() FROM PUBLIC, anon, authenticated;

-- has_role / user_owns_restaurant: keep authenticated EXECUTE (required for RLS evaluation),
-- but ensure anon cannot call them at all.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.user_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.user_owns_restaurant(text) FROM PUBLIC, anon;

-- get_public_plans: only authenticated app users need it
REVOKE EXECUTE ON FUNCTION public.get_public_plans() FROM PUBLIC, anon;
