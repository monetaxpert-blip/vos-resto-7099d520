-- === Palier 0 : index manquants ===
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_restaurant_menu_restaurant
  ON public.restaurant_menu (restaurant_id);

CREATE INDEX IF NOT EXISTS idx_analytics_events_restaurant_created
  ON public.analytics_events (restaurant_id, created_at DESC);

-- === Palier 1 : index composite pour le tri de l'accueil ===
CREATE INDEX IF NOT EXISTS idx_restaurants_public_sort
  ON public.restaurants (is_pinned DESC, is_featured DESC, display_order DESC, rating_count DESC)
  WHERE is_active;

CREATE INDEX IF NOT EXISTS idx_restaurant_photos_restaurant
  ON public.restaurant_photos (restaurant_id, is_hero DESC, display_order ASC);

-- === Palier 1 : dénormalisation de la photo principale ===
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS hero_photo_url text;

CREATE OR REPLACE FUNCTION public.sync_restaurant_hero_photo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_restaurant_id text;
  v_url text;
BEGIN
  v_restaurant_id := COALESCE(NEW.restaurant_id, OLD.restaurant_id);

  SELECT COALESCE(
           rp.url,
           'https://kjdvtphiotpdrrfgikeh.supabase.co/storage/v1/object/public/restaurant-photos/' || rp.storage_path
         )
    INTO v_url
  FROM public.restaurant_photos rp
  WHERE rp.restaurant_id = v_restaurant_id
  ORDER BY rp.is_hero DESC, rp.display_order ASC, rp.created_at ASC
  LIMIT 1;

  UPDATE public.restaurants
  SET hero_photo_url = v_url
  WHERE id = v_restaurant_id
    AND hero_photo_url IS DISTINCT FROM v_url;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_restaurant_hero_photo ON public.restaurant_photos;
CREATE TRIGGER trg_sync_restaurant_hero_photo
AFTER INSERT OR UPDATE OR DELETE ON public.restaurant_photos
FOR EACH ROW EXECUTE FUNCTION public.sync_restaurant_hero_photo();

-- Backfill
UPDATE public.restaurants r
SET hero_photo_url = sub.url
FROM (
  SELECT DISTINCT ON (rp.restaurant_id)
         rp.restaurant_id,
         COALESCE(
           rp.url,
           'https://kjdvtphiotpdrrfgikeh.supabase.co/storage/v1/object/public/restaurant-photos/' || rp.storage_path
         ) AS url
  FROM public.restaurant_photos rp
  ORDER BY rp.restaurant_id, rp.is_hero DESC, rp.display_order ASC, rp.created_at ASC
) sub
WHERE r.id = sub.restaurant_id
  AND r.hero_photo_url IS DISTINCT FROM sub.url;

REVOKE ALL ON FUNCTION public.sync_restaurant_hero_photo() FROM PUBLIC, anon, authenticated;