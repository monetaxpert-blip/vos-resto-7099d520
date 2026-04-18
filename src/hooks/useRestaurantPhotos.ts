import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PhotoRow {
  id: string;
  storage_path: string;
  is_hero: boolean;
  display_order: number;
}

/**
 * Fetch user-uploaded photos for a restaurant from the DB.
 * Returns empty array if none exist — caller falls back to curated Unsplash.
 */
export const useRestaurantPhotos = (restaurantId: string | undefined) => {
  return useQuery({
    queryKey: ['restaurant-photos', restaurantId],
    enabled: !!restaurantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurant_photos')
        .select('id, storage_path, is_hero, display_order')
        .eq('restaurant_id', restaurantId!)
        .order('display_order', { ascending: true });
      if (error) throw error;
      const rows = (data ?? []) as PhotoRow[];
      return rows.map((r) => ({
        ...r,
        url: supabase.storage.from('restaurant-photos').getPublicUrl(r.storage_path).data.publicUrl,
      }));
    },
  });
};
