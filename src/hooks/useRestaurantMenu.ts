import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RestaurantMenuItem {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  created_at: string;
}

export function useRestaurantMenu(restaurantId?: string) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['restaurant-menu', restaurantId],
    enabled: !!restaurantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurant_menu')
        .select('*')
        .eq('restaurant_id', restaurantId!)
        .order('category', { ascending: true })
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as RestaurantMenuItem[];
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['restaurant-menu', restaurantId] });

  const create = useMutation({
    mutationFn: async (payload: Omit<RestaurantMenuItem, 'id' | 'created_at'>) => {
      const { error } = await supabase.from('restaurant_menu').insert(payload);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Erreur menu'),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...payload }: Partial<RestaurantMenuItem> & { id: string }) => {
      const { error } = await supabase.from('restaurant_menu').update(payload).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Erreur menu'),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('restaurant_menu').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Erreur menu'),
  });

  return {
    items: query.data ?? [],
    isLoading: query.isLoading,
    create,
    update,
    remove,
  };
}
