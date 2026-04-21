DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'user_role'
  ) THEN
    CREATE TYPE public.user_role AS ENUM ('admin', 'user', 'restaurant_owner');
  END IF;
END $$;

ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'restaurant_owner';

ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS profile_image text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS whatsapp_number text,
  ADD COLUMN IF NOT EXISTS whatsapp_link text,
  ADD COLUMN IF NOT EXISTS average_price numeric,
  ADD COLUMN IF NOT EXISTS price_range text,
  ADD COLUMN IF NOT EXISTS cuisine_type text,
  ADD COLUMN IF NOT EXISTS address_detail text,
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS opening_hours jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS banner_image text;

UPDATE public.restaurants
SET
  latitude = COALESCE(latitude, lat::double precision),
  longitude = COALESCE(longitude, lng::double precision),
  average_price = COALESCE(average_price, NULL),
  cuisine_type = COALESCE(cuisine_type, categories[1]),
  address_detail = COALESCE(address_detail, address),
  whatsapp_number = COALESCE(whatsapp_number, regexp_replace(COALESCE(phone, ''), '[^0-9]', '', 'g')),
  whatsapp_link = COALESCE(
    whatsapp_link,
    CASE
      WHEN COALESCE(phone, '') <> '' THEN 'https://wa.me/' || regexp_replace(phone, '[^0-9]', '', 'g')
      ELSE NULL
    END
  )
WHERE TRUE;

ALTER TABLE public.restaurant_owners
  DROP CONSTRAINT IF EXISTS restaurant_owners_pkey;

ALTER TABLE public.restaurant_owners
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'restaurant_owners_pkey'
  ) THEN
    ALTER TABLE public.restaurant_owners
      ADD CONSTRAINT restaurant_owners_pkey PRIMARY KEY (user_id, restaurant_id);
  END IF;
END $$;

ALTER TABLE public.restaurant_photos
  ADD COLUMN IF NOT EXISTS url text,
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT now();

UPDATE public.restaurant_photos
SET url = COALESCE(
  url,
  CASE
    WHEN storage_path IS NOT NULL AND storage_path <> ''
      THEN CONCAT('/storage/v1/object/public/restaurant-photos/', storage_path)
    ELSE NULL
  END
)
WHERE TRUE;

CREATE TABLE IF NOT EXISTS public.restaurant_menu (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id text NOT NULL,
  name text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0,
  category text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.restaurant_menu ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id text NOT NULL,
  user_id uuid NOT NULL,
  rating integer NOT NULL,
  comment text,
  helpful_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.review_helpful_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(review_id, user_id)
);

ALTER TABLE public.review_helpful_votes ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id text NOT NULL,
  title text NOT NULL,
  description text,
  discount numeric,
  valid_until timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  restaurant_id text,
  audience text NOT NULL DEFAULT 'user',
  type text NOT NULL,
  title text NOT NULL,
  message text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.user_owns_restaurant(_restaurant_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.restaurant_owners ro
    WHERE ro.restaurant_id = _restaurant_id
      AND ro.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.sync_review_aggregates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.restaurants r
  SET
    rating = agg.avg_rating,
    rating_count = agg.review_count,
    updated_at = now()
  FROM (
    SELECT restaurant_id,
           COALESCE(AVG(rating)::numeric(3,2), 0) AS avg_rating,
           COUNT(*)::int AS review_count
    FROM public.reviews
    WHERE restaurant_id = COALESCE(NEW.restaurant_id, OLD.restaurant_id)
    GROUP BY restaurant_id
  ) agg
  WHERE r.id = agg.restaurant_id;

  IF NOT FOUND THEN
    UPDATE public.restaurants
    SET rating = NULL,
        rating_count = 0,
        updated_at = now()
    WHERE id = COALESCE(NEW.restaurant_id, OLD.restaurant_id);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_review_helpful_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.reviews
  SET helpful_count = (
    SELECT COUNT(*)::int
    FROM public.review_helpful_votes
    WHERE review_id = COALESCE(NEW.review_id, OLD.review_id)
  ),
  updated_at = now()
  WHERE id = COALESCE(NEW.review_id, OLD.review_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS update_restaurants_updated_at ON public.restaurants;
CREATE TRIGGER update_restaurants_updated_at
BEFORE UPDATE ON public.restaurants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_restaurant_owners_updated_at ON public.restaurant_owners;
CREATE TRIGGER update_restaurant_owners_updated_at
BEFORE UPDATE ON public.restaurant_owners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_restaurant_photos_updated_at ON public.restaurant_photos;
CREATE TRIGGER update_restaurant_photos_updated_at
BEFORE UPDATE ON public.restaurant_photos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_restaurant_menu_updated_at ON public.restaurant_menu;
CREATE TRIGGER update_restaurant_menu_updated_at
BEFORE UPDATE ON public.restaurant_menu
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_reviews_updated_at ON public.reviews;
CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_offers_updated_at ON public.offers;
CREATE TRIGGER update_offers_updated_at
BEFORE UPDATE ON public.offers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS reviews_sync_aggregates ON public.reviews;
CREATE TRIGGER reviews_sync_aggregates
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.sync_review_aggregates();

DROP TRIGGER IF EXISTS review_helpful_sync ON public.review_helpful_votes;
CREATE TRIGGER review_helpful_sync
AFTER INSERT OR DELETE ON public.review_helpful_votes
FOR EACH ROW
EXECUTE FUNCTION public.sync_review_helpful_count();

DROP POLICY IF EXISTS "Owners view own restaurants and admins" ON public.restaurant_owners;
CREATE POLICY "Owners view own restaurants and admins"
ON public.restaurant_owners
FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Owners insert own restaurant ownerships" ON public.restaurant_owners;
CREATE POLICY "Owners insert own restaurant ownerships"
ON public.restaurant_owners
FOR INSERT
WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Owners update own restaurant ownerships" ON public.restaurant_owners;
CREATE POLICY "Owners update own restaurant ownerships"
ON public.restaurant_owners
FOR UPDATE
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Owners delete own restaurant ownerships" ON public.restaurant_owners;
CREATE POLICY "Owners delete own restaurant ownerships"
ON public.restaurant_owners
FOR DELETE
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Owners manage own photos" ON public.restaurant_photos;
CREATE POLICY "Owners manage own photos"
ON public.restaurant_photos
FOR ALL
USING (public.user_owns_restaurant(restaurant_id) OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.user_owns_restaurant(restaurant_id) OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Public can view photos" ON public.restaurant_photos;
CREATE POLICY "Public can view photos"
ON public.restaurant_photos
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Public can view menu items" ON public.restaurant_menu;
CREATE POLICY "Public can view menu items"
ON public.restaurant_menu
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Owners and admins manage menu items" ON public.restaurant_menu;
CREATE POLICY "Owners and admins manage menu items"
ON public.restaurant_menu
FOR ALL
USING (public.user_owns_restaurant(restaurant_id) OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.user_owns_restaurant(restaurant_id) OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Public can view reviews" ON public.reviews;
CREATE POLICY "Public can view reviews"
ON public.reviews
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users insert own reviews" ON public.reviews;
CREATE POLICY "Users insert own reviews"
ON public.reviews
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own reviews" ON public.reviews;
CREATE POLICY "Users update own reviews"
ON public.reviews
FOR UPDATE
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users delete own reviews" ON public.reviews;
CREATE POLICY "Users delete own reviews"
ON public.reviews
FOR DELETE
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users view own helpful votes" ON public.review_helpful_votes;
CREATE POLICY "Users view own helpful votes"
ON public.review_helpful_votes
FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users insert own helpful votes" ON public.review_helpful_votes;
CREATE POLICY "Users insert own helpful votes"
ON public.review_helpful_votes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own helpful votes" ON public.review_helpful_votes;
CREATE POLICY "Users delete own helpful votes"
ON public.review_helpful_votes
FOR DELETE
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Public can view offers" ON public.offers;
CREATE POLICY "Public can view offers"
ON public.offers
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Owners and admins manage offers" ON public.offers;
CREATE POLICY "Owners and admins manage offers"
ON public.offers
FOR ALL
USING (public.user_owns_restaurant(restaurant_id) OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.user_owns_restaurant(restaurant_id) OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users view own notifications" ON public.notifications;
CREATE POLICY "Users view own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "Users update own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage notifications" ON public.notifications;
CREATE POLICY "Admins manage notifications"
ON public.notifications
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Restaurant owners read related reservations" ON public.reservations;
CREATE POLICY "Restaurant owners read related reservations"
ON public.reservations
FOR SELECT
USING (public.user_owns_restaurant(restaurant_id) OR public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Restaurant owners update related reservations" ON public.reservations;
CREATE POLICY "Restaurant owners update related reservations"
ON public.reservations
FOR UPDATE
USING (public.user_owns_restaurant(restaurant_id) OR public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id)
WITH CHECK (public.user_owns_restaurant(restaurant_id) OR public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.restaurants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.restaurant_photos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.restaurant_menu;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;
ALTER PUBLICATION supabase_realtime ADD TABLE public.offers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;