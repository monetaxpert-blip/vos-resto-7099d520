import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface OwnerReservation {
  id: string;
  user_id: string;
  restaurant_id: string;
  restaurant_name: string;
  reservation_date: string;
  reservation_time: string;
  guests: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
  customer_name?: string | null;
  client_name?: string | null;
  client_phone?: string | null;
}

export function useOwnerReservations(restaurantId: string | null | undefined) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['owner-reservations', restaurantId],
    enabled: !!restaurantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('restaurant_id', restaurantId!)
        .order('reservation_date', { ascending: false })
        .order('reservation_time', { ascending: false });
      if (error) throw error;

      const userIds = Array.from(new Set((data ?? []).map((r) => r.user_id)));
      let profilesMap = new Map<string, { display_name: string | null; phone: string | null }>();
      if (userIds.length) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name, phone')
          .in('id', userIds);
        profilesMap = new Map((profiles ?? []).map((p) => [p.id, { display_name: p.display_name, phone: p.phone }]));
      }
      return (data ?? []).map((r) => ({
        ...r,
        client_name: profilesMap.get(r.user_id)?.display_name ?? null,
        client_phone: profilesMap.get(r.user_id)?.phone ?? null,
      })) as OwnerReservation[];
    },
  });

  useEffect(() => {
    if (!restaurantId) return;
    const channel = supabase
      .channel(`owner-reservations-${restaurantId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reservations', filter: `restaurant_id=eq.${restaurantId}` },
        () => qc.invalidateQueries({ queryKey: ['owner-reservations', restaurantId] })
      )
     .subscribe((status, err) => {
        if (err) console.warn('[realtime:reservations]', status, err);
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, qc]);

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'confirmed' | 'cancelled' }) => {
      const { error } = await supabase.from('reservations').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      toast.success(vars.status === 'confirmed' ? 'Réservation acceptée' : 'Réservation refusée');
      qc.invalidateQueries({ queryKey: ['owner-reservations', restaurantId] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Erreur'),
  });

  return {
    reservations: query.data ?? [],
    isLoading: query.isLoading,
    updateStatus,
  };
}
