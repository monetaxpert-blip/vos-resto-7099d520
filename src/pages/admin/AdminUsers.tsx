import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { avatarFor, type Gender } from '@/lib/avatar';

interface UserRow {
  id: string;
  display_name: string | null;
  first_name: string | null;
  phone: string | null;
  gender: Gender | null;
  created_at: string;
  events_count: number;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, first_name, phone, gender, created_at')
        .order('created_at', { ascending: false });

      // count events per user (one query, group client-side)
      const { data: events } = await supabase
        .from('analytics_events')
        .select('user_id')
        .not('user_id', 'is', null);

      const counts: Record<string, number> = {};
      (events ?? []).forEach((e) => {
        const uid = e.user_id as string;
        counts[uid] = (counts[uid] ?? 0) + 1;
      });

      const result: UserRow[] = (profiles ?? []).map((p) => ({
        id: p.id,
        display_name: p.display_name,
        first_name: p.first_name,
        phone: p.phone,
        gender: (p.gender as Gender) ?? 'unspecified',
        created_at: p.created_at,
        events_count: counts[p.id] ?? 0,
      }));
      result.sort((a, b) => b.events_count - a.events_count);
      setUsers(result);
      setLoading(false);
    })();
  }, []);

  if (loading) return <p className="text-sm text-muted-foreground">Chargement...</p>;

  return (
    <div className="space-y-2">
      <h2 className="font-bold mb-1">Utilisateurs ({users.length})</h2>
      {users.length === 0 && <p className="text-sm text-muted-foreground">Aucun utilisateur.</p>}
      {users.map((u) => (
        <div key={u.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
          <img
            src={avatarFor(u.display_name || u.id, u.gender || 'unspecified')}
            alt=""
            className="w-10 h-10 rounded-full bg-muted"
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
    </div>
  );
};

export default AdminUsers;
