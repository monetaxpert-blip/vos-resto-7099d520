import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useVisibleInterval } from '@/hooks/useVisiblePolling';

export interface RestaurantStats {
  views: number;
  clicks: number;
  whatsapp: number;
  directions: number;
  searches: number;
  conversionRate: number;
  trafficByHour: Array<{ hour: string; count: number }>;
}

export function useRestaurantStats(restaurantId?: string) {
  const refetchInterval = useVisibleInterval(120_000);

  return useQuery({
    queryKey: ['restaurant-stats', restaurantId],
    enabled: !!restaurantId,
    refetchInterval,
    refetchIntervalInBackground: false,
    queryFn: async (): Promise<RestaurantStats> => {
      const { data, error } = await supabase
        .from('analytics_events')
        .select('event_type, created_at')
        .eq('restaurant_id', restaurantId!);
      if (error) throw error;
      const rows = data ?? [];
      const trafficMap = new Map<string, number>();
      let views = 0, clicks = 0, whatsapp = 0, directions = 0, searches = 0;
      for (const row of rows) {
        const hour = new Date(row.created_at).getHours().toString().padStart(2, '0') + 'h';
        trafficMap.set(hour, (trafficMap.get(hour) ?? 0) + 1);
        if (row.event_type === 'restaurant_view') views += 1;
        if (row.event_type === 'restaurant_click') clicks += 1;
        if (row.event_type === 'whatsapp_click') whatsapp += 1;
        if (row.event_type === 'direction_click') directions += 1;
        if (row.event_type === 'search_event') searches += 1;
      }
      const actions = clicks + whatsapp + directions;
      const trafficByHour = Array.from(trafficMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([hour, count]) => ({ hour, count }));
      return { views, clicks, whatsapp, directions, searches, conversionRate: views > 0 ? (actions / views) * 100 : 0, trafficByHour };
    },
  });
}

