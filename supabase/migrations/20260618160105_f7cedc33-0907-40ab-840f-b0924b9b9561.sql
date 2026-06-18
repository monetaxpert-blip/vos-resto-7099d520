
-- =========================================================
-- SAFE SHIP : onboarding drafts + commandes + index géo
-- 100% additif, aucune suppression, aucun breaking change
-- =========================================================

-- ---------- 1. ONBOARDING DRAFTS ----------
CREATE TABLE IF NOT EXISTS public.restaurant_onboarding_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step int NOT NULL DEFAULT 0,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.restaurant_onboarding_drafts TO authenticated;
GRANT ALL ON public.restaurant_onboarding_drafts TO service_role;

ALTER TABLE public.restaurant_onboarding_drafts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "own draft select" ON public.restaurant_onboarding_drafts
    FOR SELECT TO authenticated USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "own draft insert" ON public.restaurant_onboarding_drafts
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "own draft update" ON public.restaurant_onboarding_drafts
    FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "own draft delete" ON public.restaurant_onboarding_drafts
    FOR DELETE TO authenticated USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DROP TRIGGER IF EXISTS trg_drafts_updated_at ON public.restaurant_onboarding_drafts;
CREATE TRIGGER trg_drafts_updated_at
  BEFORE UPDATE ON public.restaurant_onboarding_drafts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- 2. ORDERS ----------
DO $$ BEGIN
  CREATE TYPE public.order_status AS ENUM (
    'pending','confirmed','preparing','ready','delivered','cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id text NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  restaurant_name text NOT NULL,
  status public.order_status NOT NULL DEFAULT 'pending',
  total_amount numeric(12,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'XOF',
  customer_name text,
  customer_phone text,
  delivery_mode text NOT NULL DEFAULT 'pickup', -- pickup | delivery | dine_in
  delivery_address text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "orders client select" ON public.orders
    FOR SELECT TO authenticated USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "orders owner select" ON public.orders
    FOR SELECT TO authenticated USING (public.user_owns_restaurant(restaurant_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "orders admin select" ON public.orders
    FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "orders client insert" ON public.orders
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "orders client cancel" ON public.orders
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id AND status = 'pending')
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "orders owner update" ON public.orders
    FOR UPDATE TO authenticated
    USING (public.user_owns_restaurant(restaurant_id))
    WITH CHECK (public.user_owns_restaurant(restaurant_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant ON public.orders(restaurant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- ---------- 3. ORDER ITEMS ----------
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id uuid,
  name text NOT NULL,
  unit_price numeric(12,2) NOT NULL DEFAULT 0,
  quantity int NOT NULL DEFAULT 1 CHECK (quantity > 0),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "items select via order" ON public.order_items
    FOR SELECT TO authenticated USING (
      EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = order_items.order_id
          AND (
            o.user_id = auth.uid()
            OR public.user_owns_restaurant(o.restaurant_id)
            OR public.has_role(auth.uid(), 'admin')
          )
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "items insert by client" ON public.order_items
    FOR INSERT TO authenticated WITH CHECK (
      EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

-- ---------- 4. ORDER STATUS HISTORY ----------
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status public.order_status NOT NULL,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.order_status_history TO authenticated;
GRANT ALL ON public.order_status_history TO service_role;

ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "history select via order" ON public.order_status_history
    FOR SELECT TO authenticated USING (
      EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = order_status_history.order_id
          AND (
            o.user_id = auth.uid()
            OR public.user_owns_restaurant(o.restaurant_id)
            OR public.has_role(auth.uid(), 'admin')
          )
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_history_order ON public.order_status_history(order_id, created_at DESC);

-- Trigger: log every status change automatically
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') OR (NEW.status IS DISTINCT FROM OLD.status) THEN
    INSERT INTO public.order_status_history (order_id, status, changed_by)
    VALUES (NEW.id, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_status_log ON public.orders;
CREATE TRIGGER trg_orders_status_log
  AFTER INSERT OR UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.log_order_status_change();

-- Notify restaurant owners on new order
CREATE OR REPLACE FUNCTION public.notify_owners_on_new_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owner_record RECORD;
BEGIN
  FOR owner_record IN
    SELECT user_id FROM public.restaurant_owners WHERE restaurant_id = NEW.restaurant_id
  LOOP
    INSERT INTO public.notifications (audience, type, title, message, restaurant_id, user_id)
    VALUES (
      'restaurant',
      'order_new',
      'Nouvelle commande 🧾',
      'Commande de ' || NEW.total_amount || ' ' || NEW.currency,
      NEW.restaurant_id,
      owner_record.user_id
    );
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_notify_owners ON public.orders;
CREATE TRIGGER trg_orders_notify_owners
  AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.notify_owners_on_new_order();

-- Notify client on status change
CREATE OR REPLACE FUNCTION public.notify_client_on_order_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.notifications (audience, type, title, message, restaurant_id, user_id)
    VALUES (
      'user',
      'order_status',
      'Mise à jour commande',
      'Votre commande chez ' || NEW.restaurant_name || ' : ' || NEW.status,
      NEW.restaurant_id,
      NEW.user_id
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_notify_client ON public.orders;
CREATE TRIGGER trg_orders_notify_client
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.notify_client_on_order_status();

-- ---------- 5. INDEX GÉO POUR PERFORMANCE ----------
CREATE INDEX IF NOT EXISTS idx_restaurants_lat_lng
  ON public.restaurants (latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_restaurants_city
  ON public.restaurants (city) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_restaurants_active
  ON public.restaurants (is_active, rating DESC NULLS LAST);
