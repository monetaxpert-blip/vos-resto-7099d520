import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PhotoRow {
  id: string;
  storage_path: string;
  is_hero: boolean;
  display_order: number;
  url: string | null;
}

export const useRestaurantPhotos = (restaurantId: string | undefined) => {
  return useQuery({
    queryKey: ['restaurant-photos', restaurantId],
    enabled: !!restaurantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurant_photos')
        .select('id, storage_path, is_hero, display_order, url')
        .eq('restaurant_id', restaurantId!)
        .order('display_order', { ascending: true });
      if (error) throw error;
      const rows = (data ?? []) as PhotoRow[];
      return rows.map((row) => ({
        ...row,
        url: row.url || supabase.storage.from('restaurant-photos').getPublicUrl(row.storage_path).data.publicUrl,
      }));
    },
  });
};
