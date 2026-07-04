
-- =========================================================
-- 1. reviews_rating_range: verify + idempotent recreate
-- =========================================================
UPDATE public.reviews SET rating = LEAST(GREATEST(rating, 1), 5)
WHERE rating < 1 OR rating > 5;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_rating_range') THEN
    ALTER TABLE public.reviews ADD CONSTRAINT reviews_rating_range CHECK (rating BETWEEN 1 AND 5);
  END IF;
END $$;

-- =========================================================
-- 2. Server-side price enforcement on order_items
-- =========================================================
CREATE OR REPLACE FUNCTION public.enforce_order_item_price()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_price numeric;
  v_menu_restaurant text;
  v_order_restaurant text;
BEGIN
  IF NEW.menu_item_id IS NULL THEN
    RAISE EXCEPTION 'menu_item_id est requis pour un article de commande';
  END IF;

  SELECT rm.price, rm.restaurant_id INTO v_price, v_menu_restaurant
  FROM public.restaurant_menu rm
  WHERE rm.id = NEW.menu_item_id;

  IF v_price IS NULL THEN
    RAISE EXCEPTION 'Article de menu introuvable: %', NEW.menu_item_id;
  END IF;

  SELECT o.restaurant_id INTO v_order_restaurant
  FROM public.orders o
  WHERE o.id = NEW.order_id;

  IF v_order_restaurant IS DISTINCT FROM v_menu_restaurant THEN
    RAISE EXCEPTION 'Article de menu (%) n''appartient pas au restaurant de la commande (%)', v_menu_restaurant, v_order_restaurant;
  END IF;

  NEW.unit_price := v_price;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_order_item_price ON public.order_items;
CREATE TRIGGER trg_enforce_order_item_price
BEFORE INSERT OR UPDATE OF unit_price, menu_item_id, quantity ON public.order_items
FOR EACH ROW EXECUTE FUNCTION public.enforce_order_item_price();

CREATE OR REPLACE FUNCTION public.recompute_order_total()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
  v_total numeric;
BEGIN
  v_order_id := COALESCE(NEW.order_id, OLD.order_id);
  SELECT COALESCE(SUM(unit_price * quantity), 0) INTO v_total
  FROM public.order_items WHERE order_id = v_order_id;
  UPDATE public.orders SET total_amount = v_total, updated_at = now() WHERE id = v_order_id;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_recompute_order_total ON public.order_items;
CREATE TRIGGER trg_recompute_order_total
AFTER INSERT OR UPDATE OR DELETE ON public.order_items
FOR EACH ROW EXECUTE FUNCTION public.recompute_order_total();

-- =========================================================
-- 3. Replace "orders client cancel" policy with cancel_order RPC
-- =========================================================
DROP POLICY IF EXISTS "orders client cancel" ON public.orders;

CREATE OR REPLACE FUNCTION public.cancel_order(p_order_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
  v_owner uuid;
  v_status public.order_status;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Non authentifié');
  END IF;

  SELECT user_id, status INTO v_owner, v_status FROM public.orders WHERE id = p_order_id;
  IF v_owner IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Commande introuvable');
  END IF;
  IF v_owner <> v_uid THEN
    RETURN json_build_object('success', false, 'error', 'Non autorisé');
  END IF;
  IF v_status <> 'pending' THEN
    RETURN json_build_object('success', false, 'error', 'Cette commande ne peut plus être annulée');
  END IF;

  UPDATE public.orders
  SET status = 'cancelled', updated_at = now()
  WHERE id = p_order_id;

  RETURN json_build_object('success', true);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.cancel_order(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_order(uuid) TO authenticated;

-- =========================================================
-- 4. Replace "Users update own reviews" policy with update_review RPC
-- =========================================================
DROP POLICY IF EXISTS "Users update own reviews" ON public.reviews;

-- Keep an admin-only update policy for moderation
CREATE POLICY "Admins update reviews"
ON public.reviews FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::user_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::user_role));

CREATE OR REPLACE FUNCTION public.update_review(p_review_id uuid, p_rating int, p_comment text)
RETURNS json
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
  IF p_rating IS NULL OR p_rating < 1 OR p_rating > 5 THEN
    RETURN json_build_object('success', false, 'error', 'Note invalide (1 à 5)');
  END IF;
  IF p_comment IS NOT NULL AND length(p_comment) > 500 THEN
    RETURN json_build_object('success', false, 'error', 'Commentaire trop long');
  END IF;

  SELECT user_id INTO v_owner FROM public.reviews WHERE id = p_review_id;
  IF v_owner IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Avis introuvable');
  END IF;
  IF v_owner <> v_uid THEN
    RETURN json_build_object('success', false, 'error', 'Non autorisé');
  END IF;

  UPDATE public.reviews
  SET rating = p_rating,
      comment = NULLIF(trim(COALESCE(p_comment, '')), ''),
      updated_at = now()
  WHERE id = p_review_id;

  RETURN json_build_object('success', true);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_review(uuid, int, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_review(uuid, int, text) TO authenticated;

-- =========================================================
-- 5. Re-affirm safe grants on security definer functions
--    (revoke PUBLIC then explicit grant to needed roles)
-- =========================================================
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, user_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, user_role) TO authenticated, anon;

REVOKE EXECUTE ON FUNCTION public.user_owns_restaurant(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_owns_restaurant(text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_public_plans() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_plans() TO authenticated, anon;
