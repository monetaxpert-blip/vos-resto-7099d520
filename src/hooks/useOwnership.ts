import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PLAN_RANK, type OwnershipRow, type Plan } from '@/lib/subscription';
import type { Restaurant } from '@/data/types';

const ownershipKeys = {
  mine: (uid: string | undefined) => ['ownerships', 'mine', uid] as const,
  publicPlans: () => ['ownerships', 'public-plans'] as const,
};

export function useMyOwnerships() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ownershipKeys.mine(user?.id),
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurant_owners')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('[useMyOwnerships]', error);
        throw error;
      }
      return (data ?? []) as OwnershipRow[];
    },
  });

  return {
    ownerships: query.data ?? [],
    loading: query.isLoading,
    error: query.error,
    refresh: () => qc.invalidateQueries({ queryKey: ownershipKeys.mine(user?.id) }),
  };
}

/** Public hook: returns a map restaurant_id -> plan, for badges & ranking. */
export function usePublicPlans() {
  const query = useQuery({
    queryKey: ownershipKeys.publicPlans(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurant_owners')
        .select('restaurant_id, plan, status, trial_ends_at');
      if (error) {
        console.error('[usePublicPlans]', error);
        throw error;
      }
      const map: Record<string, Plan> = {};
      for (const r of data ?? []) {
        const isActive =
          r.status === 'active' ||
          (r.status === 'trial' && r.trial_ends_at && new Date(r.trial_ends_at).getTime() > Date.now());
        if (isActive) map[r.restaurant_id] = r.plan as Plan;
      }
      return map;
    },
    staleTime: 60_000,
  });

  return query.data ?? {};
}

/** Sort restaurants ELITE > PREMIUM > standard, preserving original order within each tier. */
export function useSortByPlan(list: Restaurant[]): Restaurant[] {
  const plans = usePublicPlans();
  return useMemo(() => {
    const ranked = list.map((r, i) => ({
      r,
      i,
      rank: plans[r.id] ? PLAN_RANK[plans[r.id]] : 0,
    }));
    ranked.sort((a, b) => (b.rank - a.rank) || (a.i - b.i));
    return ranked.map((x) => x.r);
  }, [list, plans]);
}
