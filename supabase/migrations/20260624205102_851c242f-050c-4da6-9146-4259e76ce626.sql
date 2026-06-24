GRANT SELECT ON public.restaurants TO anon;

DROP POLICY IF EXISTS "Restaurant photos publicly readable" ON storage.objects;
CREATE POLICY "Restaurant photos publicly readable"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'restaurant-photos');