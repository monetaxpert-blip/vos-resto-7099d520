import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { avatarFor, type Gender } from '@/lib/avatar';
import { Button } from '@/components/ui/button';

interface UserRow {
  id: string;
  display_name: string | null;
  first_name: string | null;
  phone: string | null;
  gender: Gender | null;
  created_at: string;
  events_count: number;
}

const PAGE_SIZE = 30;

const AdminUsers = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadPage = useCallback(async (offset: number) => {
    const { data: profiles, count } = await supabase
      .from('profiles')
      .select('id, display_name, first_name, phone, gender, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    const ids = (profiles ?? []).map((p) => p.id);

    // Only count events for the users on this page (bounded query).
    const counts: Record<string, number> = {};
    if (ids.length) {
      const { data: events } = await supabase
        .from('analytics_events')
        .select('user_id')
        .in('user_id', ids);
      (events ?? []).forEach((e) => {
        const uid = e.user_id as string;
        counts[uid] = (counts[uid] ?? 0) + 1;
      });
    }

    const rows: UserRow[] = (profiles ?? []).map((p) => ({
      id: p.id,
      display_name: p.display_name,
      first_name: p.first_name,
      phone: p.phone,
      gender: (p.gender as Gender) ?? 'unspecified',
      created_at: p.created_at,
      events_count: counts[p.id] ?? 0,
    }));

    setTotal(count ?? null);
    setUsers((prev) => (offset === 0 ? rows : [...prev, ...rows]));
  }, []);

  useEffect(() => {
    (async () => {
      await loadPage(0);
      setLoading(false);
    })();
  }, [loadPage]);

  const hasMore = total !== null && users.length < total;

  if (loading) return <p className="text-sm text-muted-foreground">Chargement...</p>;

  return (
    <div className="space-y-2">
      <h2 className="font-bold mb-1">
        Utilisateurs ({users.length}{total !== null ? ` / ${total}` : ''})
      </h2>
      {users.length === 0 && <p className="text-sm text-muted-foreground">Aucun utilisateur.</p>}
      {users.map((u) => (
        <div key={u.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
          <img
            src={avatarFor(u.display_name || u.id, u.gender || 'unspecified')}
            alt=""
            className="w-10 h-10 rounded-full bg-muted"
            loading="lazy"
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{u.display_name || u.first_name || 'Anonyme'}</p>
            <p className="text-[11px] text-muted-foreground truncate">
              {u.phone || '—'} · inscrit le {new Date(u.created_at).toLocaleDateString('fr-FR')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-extrabold">{u.events_count}</p>
            <p className="text-[10px] text-muted-foreground">actions</p>
          </div>
        </div>
      ))}

      {hasMore && (
        <Button
          variant="secondary"
          className="w-full"
          disabled={loadingMore}
          onClick={async () => {
            setLoadingMore(true);
            await loadPage(users.length);
            setLoadingMore(false);
          }}
        >
          Charger {PAGE_SIZE} de plus
        </Button>
      )}
    </div>
  );
};

export default AdminUsers;
