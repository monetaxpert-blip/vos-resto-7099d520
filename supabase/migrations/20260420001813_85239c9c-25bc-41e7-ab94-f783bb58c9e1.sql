DROP POLICY IF EXISTS "Anyone can insert events" ON public.analytics_events;
CREATE POLICY "Insert own or anonymous events"
  ON public.analytics_events FOR INSERT
  WITH CHECK (user_id IS NULL OR auth.uid() = user_id);