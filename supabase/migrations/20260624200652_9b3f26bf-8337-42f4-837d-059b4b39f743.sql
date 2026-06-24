DROP POLICY IF EXISTS "Public can view active restaurants" ON public.restaurants;

CREATE POLICY "Public can view active restaurants"
  ON public.restaurants FOR SELECT
  USING (
    is_active = true
    OR (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'))
  );