
REVOKE ALL ON FUNCTION public.has_role(uuid, user_role) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.user_owns_restaurant(text) FROM PUBLIC, anon, authenticated;
