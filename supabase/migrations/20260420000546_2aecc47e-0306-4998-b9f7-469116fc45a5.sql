-- Enum pour les plans d'abonnement
CREATE TYPE public.subscription_plan AS ENUM ('PRO', 'PREMIUM', 'ELITE');
CREATE TYPE public.subscription_status AS ENUM ('trial', 'active', 'expired', 'cancelled');

-- Table des restaurants créés par les restaurateurs (en plus du dataset statique)
CREATE TABLE public.owned_restaurants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  quartier TEXT,
  city TEXT NOT NULL DEFAULT 'Dakar',
  phone TEXT,
  email TEXT,
  website TEXT,
  categories TEXT[] NOT NULL DEFAULT '{}',
  price_level TEXT,
  hours TEXT,
  lat NUMERIC,
  lng NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.owned_restaurants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owned restaurants publicly viewable"
  ON public.owned_restaurants FOR SELECT USING (true);
CREATE POLICY "Owners insert own restaurants"
  ON public.owned_restaurants FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners update own restaurants"
  ON public.owned_restaurants FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owners delete own restaurants"
  ON public.owned_restaurants FOR DELETE USING (auth.uid() = owner_id);

CREATE TRIGGER trg_owned_restaurants_updated
  BEFORE UPDATE ON public.owned_restaurants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Table principale : lien entre un user et un restaurant qu'il gère, avec abonnement
CREATE TABLE public.restaurant_owners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  -- restaurant_id : soit l'id d'un resto du dataset (text), soit un owned_restaurants.id (uuid en text)
  restaurant_id TEXT NOT NULL,
  restaurant_name TEXT NOT NULL,
  is_owned_listing BOOLEAN NOT NULL DEFAULT false,
  plan public.subscription_plan NOT NULL DEFAULT 'PRO',
  status public.subscription_status NOT NULL DEFAULT 'trial',
  trial_ends_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  subscription_started_at TIMESTAMPTZ,
  subscription_ends_at TIMESTAMPTZ,
  subscription_mode TEXT NOT NULL DEFAULT 'test',
  payment_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, restaurant_id)
);

ALTER TABLE public.restaurant_owners ENABLE ROW LEVEL SECURITY;

-- Public peut voir le plan/status (pour le tri & badges côté liste publique)
CREATE POLICY "Public can read plan info"
  ON public.restaurant_owners FOR SELECT USING (true);
CREATE POLICY "Users insert own ownership"
  ON public.restaurant_owners FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own ownership"
  ON public.restaurant_owners FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own ownership"
  ON public.restaurant_owners FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_restaurant_owners_updated
  BEFORE UPDATE ON public.restaurant_owners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_restaurant_owners_user ON public.restaurant_owners(user_id);
CREATE INDEX idx_restaurant_owners_restaurant ON public.restaurant_owners(restaurant_id);