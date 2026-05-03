-- Allow authenticated users to create restaurants (they'll be linked via restaurant_owners right after)
DROP POLICY IF EXISTS "Authenticated users can create restaurants" ON public.restaurants;
CREATE POLICY "Authenticated users can create restaurants"
ON public.restaurants
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow owners to update their own restaurants
DROP POLICY IF EXISTS "Owners update own restaurants" ON public.restaurants;
CREATE POLICY "Owners update own restaurants"
ON public.restaurants
FOR UPDATE
TO authenticated
USING (public.user_owns_restaurant(id) OR public.has_role(auth.uid(), 'admin'::user_role))
WITH CHECK (public.user_owns_restaurant(id) OR public.has_role(auth.uid(), 'admin'::user_role));

-- Allow owners to delete their own restaurants
DROP POLICY IF EXISTS "Owners delete own restaurants" ON public.restaurants;
CREATE POLICY "Owners delete own restaurants"
ON public.restaurants
FOR DELETE
TO authenticated
USING (public.user_owns_restaurant(id) OR public.has_role(auth.uid(), 'admin'::user_role));