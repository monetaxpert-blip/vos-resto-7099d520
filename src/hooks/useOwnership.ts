import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { OwnershipRow, Plan } from '@/lib/subscription';

export function useMyOwnerships() {
  const { user } = useAuth();
  const [rows, setRows] = useState<OwnershipRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('restaurant_owners')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setRows((data ?? []) as OwnershipRow[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ownerships: rows, loading, refresh };
}

/** Public hook: returns a map restaurant_id -> plan, for badges & ranking. */
export function usePublicPlans() {
  const [plans, setPlans] = useState<Record<string, Plan>>({});

  useEffect(() => {
    let active = true;
    supabase
      .from('restaurant_owners')
      .select('restaurant_id, plan, status, trial_ends_at')
      .then(({ data }) => {
        if (!active || !data) return;
        const map: Record<string, Plan> = {};
        for (const r of data) {
          const isActive =
            r.status === 'active' ||
            (r.status === 'trial' && new Date(r.trial_ends_at).getTime() > Date.now());
          if (isActive) map[r.restaurant_id] = r.plan as Plan;
        }
        setPlans(map);
      });
    return () => {
      active = false;
    };
  }, []);

  return plans;
}
