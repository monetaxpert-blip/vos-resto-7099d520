import { useEffect, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const LS_KEY = 'vosresto.favorites';

function readLocal(): string[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}
function writeLocal(ids: string[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(ids));
}

/**
 * Migrate localStorage favorites once after login.
 */
async function migrateLocalToDb(userId: string) {
  const local = readLocal();
  if (local.length === 0) return;
  const rows = local.map((restaurant_id) => ({ user_id: userId, restaurant_id }));
  const { error } = await supabase
    .from('favorites')
    .upsert(rows, { onConflict: 'user_id,restaurant_id', ignoreDuplicates: true });
  if (!error) {
    localStorage.removeItem(LS_KEY);
  }
}

export const useFavorites = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [localIds, setLocalIds] = useState<string[]>(() => readLocal());

  // One-shot migration on login
  useEffect(() => {
    if (user) migrateLocalToDb(user.id).then(() => qc.invalidateQueries({ queryKey: ['favorites'] }));
  }, [user, qc]);

  const { data: dbIds = [] } = useQuery({
    queryKey: ['favorites', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('favorites')
        .select('restaurant_id')
        .eq('user_id', user!.id);
      if (error) throw error;
      return data.map((r) => r.restaurant_id);
    },
  });

  const ids = user ? dbIds : localIds;
  const idSet = new Set(ids);

  const toggle = useMutation({
    mutationFn: async (restaurantId: string) => {
      if (!user) {
        const next = idSet.has(restaurantId)
          ? localIds.filter((x) => x !== restaurantId)
          : [...localIds, restaurantId];
        writeLocal(next);
        setLocalIds(next);
        return next;
      }
      if (idSet.has(restaurantId)) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('restaurant_id', restaurantId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({ user_id: user.id, restaurant_id: restaurantId });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favorites', user?.id] }),
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Erreur'),
  });

  const isFavorite = useCallback((id: string) => idSet.has(id), [idSet]);

  return {
    ids,
    isFavorite,
    toggle: (id: string) => toggle.mutate(id),
    isPending: toggle.isPending,
    isAuthenticated: !!user,
  };
};
