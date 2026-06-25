-- Fix 1: Add reservations to realtime publication if missing
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'reservations'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations';
  END IF;
END $$;

-- Fix 2: Separate anon/auth policies on restaurants (no has_role in anon path)
DROP POLICY IF EXISTS "Public can view active restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Anyone can read active restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Admins full access restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Admins manage restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Restaurants are viewable by everyone" ON public.restaurants;
DROP POLICY IF EXISTS "anon_read_active_restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "auth_read_active_restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "admin_full_access_restaurants" ON public.restaurants;

CREATE POLICY "anon_read_active_restaurants"
  ON public.restaurants FOR SELECT
  TO anon
  USING (is_active = true);

CREATE POLICY "auth_read_active_restaurants"
  ON public.restaurants FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "admin_full_access_restaurants"
  ON public.restaurants FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Fix 3: Grant read access to anon
GRANT SELECT ON public.restaurants TO anon;
GRANT SELECT ON public.restaurant_photos TO anon;
