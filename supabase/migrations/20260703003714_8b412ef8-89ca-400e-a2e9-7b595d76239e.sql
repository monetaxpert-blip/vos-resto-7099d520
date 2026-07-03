
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.user_role) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.user_owns_restaurant(text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_public_plans() TO authenticated, anon;

UPDATE public.restaurants SET status = CASE WHEN is_active THEN 'active' ELSE 'pending' END;
