
ALTER TABLE public.reservations ALTER COLUMN status SET DEFAULT 'pending'::reservation_status;

ALTER TABLE public.reservations DROP CONSTRAINT IF EXISTS reservations_user_id_restaurant_id_reservation_date_reserva_key;
CREATE UNIQUE INDEX IF NOT EXISTS reservations_unique_active
  ON public.reservations (user_id, restaurant_id, reservation_date, reservation_time)
  WHERE status IN ('pending', 'confirmed');

DROP POLICY IF EXISTS "Owners and admins can insert notifications" ON public.notifications;
CREATE POLICY "Owners and admins can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::user_role)
  OR (restaurant_id IS NOT NULL AND user_owns_restaurant(restaurant_id))
  OR auth.uid() = user_id
);

CREATE OR REPLACE FUNCTION public.notify_owners_on_new_reservation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owner_record RECORD;
BEGIN
  FOR owner_record IN
    SELECT user_id FROM public.restaurant_owners WHERE restaurant_id = NEW.restaurant_id
  LOOP
    INSERT INTO public.notifications (audience, type, title, message, restaurant_id, user_id)
    VALUES (
      'restaurant',
      'reservation_new',
      'Nouvelle demande de réservation',
      'Réservation pour ' || NEW.guests || ' personne(s) le ' || NEW.reservation_date || ' à ' || NEW.reservation_time,
      NEW.restaurant_id,
      owner_record.user_id
    );
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_owners_new_reservation ON public.reservations;
CREATE TRIGGER trg_notify_owners_new_reservation
AFTER INSERT ON public.reservations
FOR EACH ROW
EXECUTE FUNCTION public.notify_owners_on_new_reservation();

CREATE OR REPLACE FUNCTION public.notify_client_on_reservation_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title TEXT;
  v_msg TEXT;
BEGIN
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;
  IF NEW.status = 'confirmed' THEN
    v_title := 'Réservation confirmée ✅';
    v_msg := NEW.restaurant_name || ' a confirmé votre réservation du ' || NEW.reservation_date || ' à ' || NEW.reservation_time;
  ELSIF NEW.status = 'cancelled' THEN
    v_title := 'Réservation annulée';
    v_msg := 'Votre réservation chez ' || NEW.restaurant_name || ' a été annulée.';
  ELSE
    RETURN NEW;
  END IF;
  INSERT INTO public.notifications (audience, type, title, message, restaurant_id, user_id)
  VALUES ('user', 'reservation_status', v_title, v_msg, NEW.restaurant_id, NEW.user_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_client_reservation_status ON public.reservations;
CREATE TRIGGER trg_notify_client_reservation_status
AFTER UPDATE ON public.reservations
FOR EACH ROW
EXECUTE FUNCTION public.notify_client_on_reservation_status();

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='reservations'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations';
  END IF;
END $$;
