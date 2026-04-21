import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RestaurantOffer {
  id: string;
  restaurant_id: string;
  title: string;
  description: string | null;
  discount: number | null;
  valid_until: string | null;
  created_at: string;
}

export function useRestaurantOffers(restaurantId?: string) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['restaurant-offers', restaurantId],
    enabled: !!restaurantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq('restaurant_id', restaurantId!)
        .order('valid_until', { ascending: true });
      if (error) throw error;
      return (data ?? []) as RestaurantOffer[];
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['restaurant-offers', restaurantId] });

  const create = useMutation({
    mutationFn: async (payload: Omit<RestaurantOffer, 'id' | 'created_at'>) => {
      const { error } = await supabase.from('offers').insert(payload);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Erreur offre'),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('offers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Erreur offre'),
  });

  return {
    offers: query.data ?? [],
    isLoading: query.isLoading,
    create,
    remove,
  };
}
