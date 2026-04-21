CREATE OR REPLACE FUNCTION public.ensure_restaurant_owner_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.user_id, 'restaurant_owner')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_restaurant_owner_role_trigger ON public.restaurant_owners;
CREATE TRIGGER ensure_restaurant_owner_role_trigger
AFTER INSERT ON public.restaurant_owners
FOR EACH ROW
EXECUTE FUNCTION public.ensure_restaurant_owner_role();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'reservations_user_restaurant_slot_key'
  ) THEN
    CREATE UNIQUE INDEX reservations_user_restaurant_slot_key
      ON public.reservations (user_id, restaurant_id, reservation_date, reservation_time);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'reviews_rating_range'
  ) THEN
    ALTER TABLE public.reviews
      ADD CONSTRAINT reviews_rating_range CHECK (rating BETWEEN 1 AND 5);
  END IF;
END $$;