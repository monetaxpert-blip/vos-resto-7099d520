import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['restaurant-stats', restaurantId],
    enabled: !!restaurantId,
    queryFn: async (): Promise<RestaurantStats> => {
      const { data, error } = await supabase
        .from('analytics_events')
        .select('event_type, created_at')
        .eq('restaurant_id', restaurantId!);
      if (error) throw error;
      const rows = data ?? [];
      const trafficMap = new Map<string, number>();
      let views = 0;
      let clicks = 0;
      let whatsapp = 0;
      let directions = 0;
      let searches = 0;
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
      return {
        views,
        clicks,
        whatsapp,
        directions,
        searches,
        conversionRate: views > 0 ? (actions / views) * 100 : 0,
        trafficByHour,
      };
    },
  });

  useEffect(() => {
    if (!restaurantId) return;
    const channel = supabase
      .channel(`analytics-events-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'analytics_events',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        () => qc.invalidateQueries({ queryKey: ['restaurant-stats', restaurantId] })
      )
     .subscribe((status, err) => {
        if (err) console.warn('[realtime:analytics]', status, err);
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, qc]);

  return query;
}
