
-- 1) restaurant_owners : politique INSERT explicite restrictive (admin uniquement).
--    Les créations légitimes passent par la RPC SECURITY DEFINER create_restaurant_with_owner.
DROP POLICY IF EXISTS "ro insert admin only" ON public.restaurant_owners;
CREATE POLICY "ro insert admin only"
ON public.restaurant_owners
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::user_role));

-- 2) notifications : durcir l'INSERT pour interdire de cibler un autre utilisateur
DROP POLICY IF EXISTS "Owners and admins can insert notifications" ON public.notifications;
CREATE POLICY "Users insert own notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::user_role)
  OR (user_id IS NOT NULL AND user_id = auth.uid())
);
-- Les notifications sortantes vers d'autres utilisateurs sont produites par des triggers SECURITY DEFINER
-- qui contournent RLS et restent donc fonctionnels.

-- 3) Storage : retirer les politiques SELECT larges qui permettent de LISTER les buckets publics.
--    Les fichiers restent accessibles via getPublicUrl (les buckets sont publics).
DROP POLICY IF EXISTS "Avatars public read" ON storage.objects;
DROP POLICY IF EXISTS "Restaurant photos publicly readable" ON storage.objects;

-- 4) Révoquer EXECUTE sur les fonctions SECURITY DEFINER internes (triggers uniquement).
--    Les triggers appellent ces fonctions avec les privilèges du propriétaire, indépendamment des GRANT.
REVOKE ALL ON FUNCTION public.notify_client_on_order_status()      FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_owners_on_new_order()         FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_order_status_change()            FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_review_helpful_count()          FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ensure_restaurant_owner_role()       FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_review_aggregates()             FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_client_on_reservation_status() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_owners_on_new_reservation()   FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user()                    FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column()           FROM PUBLIC, anon, authenticated;

-- Les fonctions RPC légitimement appelables restent exécutables :
-- create_restaurant_with_owner, activate_subscription_test, get_public_plans,
-- has_role, user_owns_restaurant conservent leurs GRANT par défaut.
