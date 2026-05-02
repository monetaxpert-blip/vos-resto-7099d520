-- Drop the stale full-uniqueness index that prevented re-booking after refusal/cancellation.
-- A partial unique index (status in pending/confirmed) already exists and is the correct rule.
DROP INDEX IF EXISTS public.reservations_user_restaurant_slot_key;
ALTER TABLE public.reservations DROP CONSTRAINT IF EXISTS reservations_user_restaurant_slot_key;