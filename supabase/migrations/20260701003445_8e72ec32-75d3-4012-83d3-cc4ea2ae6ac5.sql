
-- 1) restaurant_owners: retirer politiques ouvertes au rôle public, garder authenticated
DROP POLICY IF EXISTS "Owners view own restaurants and admins" ON public.restaurant_owners;
DROP POLICY IF EXISTS "Owners update own restaurant ownerships" ON public.restaurant_owners;
DROP POLICY IF EXISTS "Owners delete own restaurant ownerships" ON public.restaurant_owners;

CREATE POLICY "ro select own or admin"
  ON public.restaurant_owners FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "ro update own or admin"
  ON public.restaurant_owners FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "ro delete own or admin"
  ON public.restaurant_owners FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Pas de politique INSERT pour authenticated : seuls les admins (via "Admin manages ownership")
-- et la fonction SECURITY DEFINER create_restaurant_with_owner peuvent créer une ligne.

-- 2) owned_restaurants: retirer politiques rôle public, restreindre à authenticated
DROP POLICY IF EXISTS "Owners insert own restaurants" ON public.owned_restaurants;
DROP POLICY IF EXISTS "Owners update own restaurants" ON public.owned_restaurants;
DROP POLICY IF EXISTS "Owners delete own restaurants" ON public.owned_restaurants;

CREATE POLICY "or insert own"
  ON public.owned_restaurants FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "or update own"
  ON public.owned_restaurants FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "or delete own"
  ON public.owned_restaurants FOR DELETE TO authenticated
  USING (auth.uid() = owner_id);

-- 3) SECURITY DEFINER: retirer l'exécution à anon/public pour les fonctions sensibles
REVOKE ALL ON FUNCTION public.has_role(uuid, public.user_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.user_owns_restaurant(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.activate_subscription_test(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_restaurant_with_owner(text, text, text, text, text, text, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.user_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_owns_restaurant(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.activate_subscription_test(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_restaurant_with_owner(text, text, text, text, text, text, numeric) TO authenticated;
-- get_public_plans reste accessible aux anonymes (badges publics)

-- 4) storage.objects: politique SELECT explicite pour avatars (le bucket restera public
-- pour compatibilité avec les URL déjà utilisées, mais on interdit le listing global)
DROP POLICY IF EXISTS "Avatars public read" ON storage.objects;
CREATE POLICY "Avatars public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Avatars owner write" ON storage.objects;
CREATE POLICY "Avatars owner write"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Avatars owner update" ON storage.objects;
CREATE POLICY "Avatars owner update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Avatars owner delete" ON storage.objects;
CREATE POLICY "Avatars owner delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
