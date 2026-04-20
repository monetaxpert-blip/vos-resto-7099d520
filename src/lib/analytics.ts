import { supabase } from '@/integrations/supabase/client';

export type EventType =
  | 'restaurant_view'
  | 'restaurant_click'
  | 'whatsapp_click'
  | 'direction_click'
  | 'search_event';

interface TrackParams {
  restaurantId?: string | null;
  metadata?: Record<string, unknown>;
}

/** Fire-and-forget event tracker. Never throws, never blocks UI. */
export async function track(eventType: EventType, params: TrackParams = {}): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const payload = {
      event_type: eventType,
      user_id: user?.id ?? null,
      restaurant_id: params.restaurantId ?? null,
      metadata: (params.metadata ?? null) as never,
    };
    await supabase.from('analytics_events').insert(payload);
  } catch {
    // silent
  }
}
