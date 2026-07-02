
-- 1. STATUS column on restaurants
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='restaurants' AND column_name='status') THEN
    ALTER TABLE public.restaurants ADD COLUMN status text NOT NULL DEFAULT 'pending'
      CHECK (status IN ('pending','active','refused','suspended'));
  END IF;
END $$;

-- Backfill
UPDATE public.restaurants SET status = CASE WHEN is_active THEN 'active' ELSE 'pending' END
  WHERE status IS NULL OR status NOT IN ('pending','active','refused','suspended');

-- Trigger to keep is_active synced with status
CREATE OR REPLACE FUNCTION public.sync_restaurant_is_active()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.is_active := (NEW.status = 'active');
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_sync_restaurant_is_active ON public.restaurants;
CREATE TRIGGER trg_sync_restaurant_is_active
  BEFORE INSERT OR UPDATE OF status ON public.restaurants
  FOR EACH ROW EXECUTE FUNCTION public.sync_restaurant_is_active();

-- 2. Update create_restaurant_with_owner: new signups = pending
CREATE OR REPLACE FUNCTION public.create_restaurant_with_owner(
  p_name text, p_description text DEFAULT NULL::text, p_address text DEFAULT NULL::text,
  p_quartier text DEFAULT NULL::text, p_phone text DEFAULT NULL::text,
  p_cuisine_type text DEFAULT NULL::text, p_average_price numeric DEFAULT NULL::numeric)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $function$
DECLARE
  v_user_id uuid; v_restaurant_id text;
  v_whatsapp_number text; v_whatsapp_link text;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN json_build_object('success', false, 'error', 'Vous devez être connecté'); END IF;
  IF p_name IS NULL OR trim(p_name) = '' THEN RETURN json_build_object('success', false, 'error', 'Le nom du restaurant est requis'); END IF;

  v_restaurant_id := gen_random_uuid()::text;
  v_whatsapp_number := NULLIF(regexp_replace(COALESCE(p_phone, ''), '\D', '', 'g'), '');
  IF v_whatsapp_number IS NOT NULL THEN v_whatsapp_link := 'https://wa.me/' || v_whatsapp_number; END IF;

  INSERT INTO public.restaurants (
    id, name, description, address, address_detail, quartier, city,
    phone, categories, cuisine_type, average_price,
    whatsapp_number, whatsapp_link, status
  ) VALUES (
    v_restaurant_id, trim(p_name),
    NULLIF(trim(COALESCE(p_description, '')), ''),
    NULLIF(trim(COALESCE(p_address, '')), ''),
    NULLIF(trim(COALESCE(p_address, '')), ''),
    NULLIF(p_quartier, ''), 'Dakar',
    NULLIF(trim(COALESCE(p_phone, '')), ''),
    CASE WHEN p_cuisine_type IS NOT NULL AND length(trim(p_cuisine_type)) > 0
         THEN ARRAY[p_cuisine_type] ELSE '{}'::text[] END,
    NULLIF(p_cuisine_type, ''), p_average_price,
    v_whatsapp_number, v_whatsapp_link, 'pending'
  );

  INSERT INTO public.restaurant_owners (user_id, restaurant_id, restaurant_name, is_owned_listing)
  VALUES (v_user_id, v_restaurant_id, trim(p_name), true);

  RETURN json_build_object('success', true, 'restaurant_id', v_restaurant_id);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$function$;

-- 3. subscriptions table (Wave payment requests)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id text NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'pro',
  price numeric NOT NULL DEFAULT 10000,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','refused','cancelled')),
  payment_method text NOT NULL DEFAULT 'wave',
  wave_reference text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  validated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subs_restaurant ON public.subscriptions(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_subs_status ON public.subscriptions(status);

GRANT SELECT, INSERT, UPDATE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subs owner read" ON public.subscriptions;
CREATE POLICY "subs owner read" ON public.subscriptions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "subs owner insert" ON public.subscriptions;
CREATE POLICY "subs owner insert" ON public.subscriptions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND user_owns_restaurant(restaurant_id));

DROP POLICY IF EXISTS "subs admin update" ON public.subscriptions;
CREATE POLICY "subs admin update" ON public.subscriptions FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

DROP TRIGGER IF EXISTS trg_subs_updated ON public.subscriptions;
CREATE TRIGGER trg_subs_updated BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
