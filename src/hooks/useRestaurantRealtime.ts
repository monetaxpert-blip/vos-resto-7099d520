import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Abonnements Realtime partagés (commandes, avis, fiche restaurant).
 * Un seul canal par restaurant, nettoyé au démontage pour éviter les fuites.
 */
export function useRestaurantRealtime(restaurantId: string | null | undefined) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!restaurantId) return;

    const invalidate = (keys: unknown[][]) => {
      keys.forEach((queryKey) => qc.invalidateQueries({ queryKey }));
    };

    const channel = supabase
      .channel(`resto-live-${restaurantId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurantId}` },
        () => invalidate([['orders']])
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reviews', filter: `restaurant_id=eq.${restaurantId}` },
        () =>
          invalidate([
            ['restaurant-reviews', restaurantId],
            ['restaurants'],
            ['restaurant-stats', restaurantId],
          ])
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'restaurants', filter: `id=eq.${restaurantId}` },
        () => invalidate([['restaurants']])
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, qc]);
}
