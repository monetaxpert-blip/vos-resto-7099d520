DROP POLICY IF EXISTS "Public can view active restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "public can view active restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Admins manage restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Anyone can read active restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Admins full access restaurants" ON public.restaurants;

CREATE POLICY "Anyone can read active restaurants"
  ON public.restaurants FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admins full access restaurants"
  ON public.restaurants FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT SELECT ON public.restaurants TO anon;