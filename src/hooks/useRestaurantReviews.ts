import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RestaurantReview {
  id: string;
  restaurant_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  helpful_count: number;
  created_at: string;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export function useRestaurantReviews(restaurantId?: string) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['restaurant-reviews', restaurantId],
    enabled: !!restaurantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('id, restaurant_id, user_id, rating, comment, helpful_count, created_at')
        .eq('restaurant_id', restaurantId!)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const rows = (data ?? []) as RestaurantReview[];
      const ids = [...new Set(rows.map((row) => row.user_id))];
      let profiles = new Map<string, { display_name: string | null; avatar_url: string | null }>();

      if (ids.length > 0) {
        const { data: profileRows } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url')
          .in('id', ids);
        profiles = new Map((profileRows ?? []).map((profile) => [profile.id, { display_name: profile.display_name, avatar_url: profile.avatar_url }]));
      }

      return rows.map((row) => ({ ...row, profile: profiles.get(row.user_id) ?? null }));
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['restaurant-reviews', restaurantId] });

  const create = useMutation({
    mutationFn: async (payload: { restaurant_id: string; user_id: string; rating: number; comment: string }) => {
      const { error } = await supabase.from('reviews').insert(payload);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Erreur avis'),
  });

  const markHelpful = useMutation({
    mutationFn: async (payload: { review_id: string; user_id: string }) => {
      const { error } = await supabase.from('review_helpful_votes').insert(payload);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Erreur avis utile'),
  });

  return {
    reviews: query.data ?? [],
    isLoading: query.isLoading,
    create,
    markHelpful,
  };
}
