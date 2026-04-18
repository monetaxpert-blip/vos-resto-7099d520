import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getAllReservations as getLocalReservations } from '@/lib/reservations';
import { toast } from 'sonner';

export interface DbReservation {
  id: string;
  restaurant_id: string;
  restaurant_name: string;
  reservation_date: string;
  reservation_time: string;
  guests: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
}

const LS_KEY = 'vosresto.reservations';

async function migrateLocalReservations(userId: string) {
  const local = getLocalReservations();
  if (local.length === 0) return;
  const rows = local.map((r) => ({
    user_id: userId,
    restaurant_id: r.restaurantId,
    restaurant_name: r.restaurantName,
    reservation_date: r.date,
    reservation_time: r.time,
    guests: r.guests,
    status: r.status,
  }));
  const { error } = await supabase
    .from('reservations')
    .upsert(rows, { onConflict: 'user_id,restaurant_id,reservation_date,reservation_time', ignoreDuplicates: true });
  if (!error) localStorage.removeItem(LS_KEY);
}

export const useReservations = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  useEffect(() => {
    if (user) migrateLocalReservations(user.id).then(() => qc.invalidateQueries({ queryKey: ['reservations'] }));
  }, [user, qc]);

  const query = useQuery({
    queryKey: ['reservations', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('user_id', user!.id)
        .order('reservation_date', { ascending: false })
        .order('reservation_time', { ascending: false });
      if (error) throw error;
      return data as DbReservation[];
    },
  });

  const create = useMutation({
    mutationFn: async (input: {
      restaurantId: string;
      restaurantName: string;
      date: string;
      time: string;
      guests: number;
    }) => {
      if (!user) throw new Error('Connectez-vous pour réserver');
      const { data, error } = await supabase
        .from('reservations')
        .insert({
          user_id: user.id,
          restaurant_id: input.restaurantId,
          restaurant_name: input.restaurantName,
          reservation_date: input.date,
          reservation_time: input.time,
          guests: input.guests,
          status: 'confirmed',
        })
        .select()
        .single();
      if (error) {
        if (error.code === '23505') throw new Error('Vous avez déjà une réservation à cet horaire.');
        throw error;
      }
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reservations', user?.id] }),
  });

  const cancel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('reservations')
        .update({ status: 'cancelled' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reservations', user?.id] }),
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Erreur'),
  });

  return {
    reservations: query.data ?? [],
    isLoading: query.isLoading,
    create,
    cancel,
    isAuthenticated: !!user,
  };
};
