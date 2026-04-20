-- ============ ROLES ============
CREATE TYPE public.user_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role public.user_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.user_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users see own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins see all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ PROFILES extension ============
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male','female','unspecified'));

-- Admins can read all profiles (for users dashboard)
CREATE POLICY "Admins view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- ============ RESTAURANTS (DB) ============
CREATE TYPE public.admin_plan AS ENUM ('Standard','Premium','Elite');

CREATE TABLE public.restaurants (
  id TEXT NOT NULL PRIMARY KEY, -- garde compatibilité avec l'id du dataset existant
  name TEXT NOT NULL,
  address TEXT,
  quartier TEXT,
  city TEXT NOT NULL DEFAULT 'Dakar',
  phone TEXT,
  email TEXT,
  website TEXT,
  lat NUMERIC,
  lng NUMERIC,
  rating NUMERIC,
  rating_count INTEGER NOT NULL DEFAULT 0,
  categories TEXT[] NOT NULL DEFAULT '{}',
  price_level TEXT,
  hours TEXT,
  place_id TEXT,
  social_media JSONB,
  -- admin flags
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  badges TEXT[] NOT NULL DEFAULT '{}', -- Recommandé / Populaire / Top
  admin_plan public.admin_plan NOT NULL DEFAULT 'Standard',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active restaurants"
  ON public.restaurants FOR SELECT USING (is_active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage restaurants"
  ON public.restaurants FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_restaurants_updated
  BEFORE UPDATE ON public.restaurants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_restaurants_active ON public.restaurants(is_active);
CREATE INDEX idx_restaurants_featured ON public.restaurants(is_featured) WHERE is_featured = true;
CREATE INDEX idx_restaurants_pinned ON public.restaurants(is_pinned) WHERE is_pinned = true;
CREATE INDEX idx_restaurants_quartier ON public.restaurants(quartier);

-- ============ ANALYTICS EVENTS ============
CREATE TYPE public.event_type AS ENUM (
  'restaurant_view',
  'restaurant_click',
  'whatsapp_click',
  'direction_click',
  'search_event'
);

CREATE TABLE public.analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  restaurant_id TEXT,
  event_type public.event_type NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Anyone (auth or anon) can insert events
CREATE POLICY "Anyone can insert events"
  ON public.analytics_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins read events"
  ON public.analytics_events FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_events_restaurant ON public.analytics_events(restaurant_id);
CREATE INDEX idx_events_type ON public.analytics_events(event_type);
CREATE INDEX idx_events_created ON public.analytics_events(created_at DESC);
CREATE INDEX idx_events_user ON public.analytics_events(user_id);

-- ============ Make handle_new_user populate avatar/gender defaults ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, first_name, last_name, phone, gender, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'gender', 'unspecified'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  -- Default role: user
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

-- Make sure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();