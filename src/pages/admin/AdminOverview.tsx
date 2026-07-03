import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Users, TrendingUp, Activity, Coins, UserPlus, AlertTriangle,
  Download, Store, CreditCard, ArrowUpRight, ArrowDownRight,
  CheckCircle2, Check, X, MapPin, Phone, Loader2, Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const PRO_PRICE = 10000;

// ---------------- Utils ----------------
const fmtNum = (n: number) => n.toLocaleString('fr-FR');
const fmtFCFA = (n: number) => `${n.toLocaleString('fr-FR')} FCFA`;
const initials = (name?: string | null) => {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('') || '?';
};
const fmtDate = (iso?: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
};

const downloadCSV = (rows: Record<string, unknown>[], filename: string) => {
  if (rows.length === 0) {
    toast.info('Aucune donnée à exporter');
    return;
  }
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    if (v === null || v === undefined) return '';
    const s = String(v).replace(/"/g, '""');
    return /[",\n;]/.test(s) ? `"${s}"` : s;
  };
  const csv = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(',')),
  ].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

// ---------------- Data queries ----------------
const useAdminMetrics = () => {
  return useQuery({
    queryKey: ['admin', 'metrics'],
    queryFn: async () => {
      const now = new Date();
      const d7 = new Date(now.getTime() - 7 * 24 * 3600 * 1000).toISOString();
      const d30 = new Date(now.getTime() - 30 * 24 * 3600 * 1000).toISOString();
      const d14 = new Date(now.getTime() - 14 * 24 * 3600 * 1000).toISOString();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // MAU / WAU via analytics_events (user_id NOT NULL)
      const [events30, events7, eventsPrev7] = await Promise.all([
        supabase.from('analytics_events').select('user_id, created_at').gte('created_at', d30).not('user_id', 'is', null),
        supabase.from('analytics_events').select('user_id').gte('created_at', d7).not('user_id', 'is', null),
        supabase.from('analytics_events').select('user_id').gte('created_at', d14).lt('created_at', d7).not('user_id', 'is', null),
      ]);
      const mau = new Set((events30.data ?? []).map((r) => r.user_id)).size;
      const wau = new Set((events7.data ?? []).map((r) => r.user_id)).size;
      const wauPrev = new Set((eventsPrev7.data ?? []).map((r) => r.user_id)).size;
      const wauDelta = wauPrev > 0 ? ((wau - wauPrev) / wauPrev) * 100 : null;

      // Nouveaux J7 restos
      const { count: newRestos7 } = await supabase
        .from('restaurants').select('*', { count: 'exact', head: true }).gte('created_at', d7);
      const { count: newRestosPrev7 } = await supabase
        .from('restaurants').select('*', { count: 'exact', head: true })
        .gte('created_at', d14).lt('created_at', d7);
      const newDelta = (newRestosPrev7 ?? 0) > 0
        ? (((newRestos7 ?? 0) - (newRestosPrev7 ?? 0)) / (newRestosPrev7 ?? 1)) * 100
        : null;

      // À valider : union restaurants(status='pending') ∪ subscriptions(status='pending')
      const [pendingRestos, pendingSubs] = await Promise.all([
        supabase.from('restaurants').select('id').eq('status', 'pending'),
        (supabase as any).from('subscriptions').select('restaurant_id').eq('status', 'pending'),
      ]);
      const pendingSet = new Set<string>();
      for (const r of (pendingRestos.data ?? []) as Array<{ id: string }>) pendingSet.add(r.id);
      for (const s of (pendingSubs.data ?? []) as Array<{ restaurant_id: string }>) pendingSet.add(s.restaurant_id);
      const pendingCount = pendingSet.size;

      // MRR : union restaurant_owners(status='active') ∪ subscriptions(status='active'), dédupliqué par restaurant_id
      const [ownersActive, subsActive] = await Promise.all([
        supabase.from('restaurant_owners').select('restaurant_id').eq('status', 'active'),
        (supabase as any).from('subscriptions').select('restaurant_id').eq('status', 'active'),
      ]);
      const activeSet = new Set<string>();
      for (const o of (ownersActive.data ?? []) as Array<{ restaurant_id: string }>) if (o.restaurant_id) activeSet.add(o.restaurant_id);
      for (const s of (subsActive.data ?? []) as Array<{ restaurant_id: string }>) if (s.restaurant_id) activeSet.add(s.restaurant_id);
      const mrr = activeSet.size * PRO_PRICE;
      void monthStart; // conservé pour compat éventuelle

      return {
        mau,
        wau,
        wauDelta,
        newRestos7: newRestos7 ?? 0,
        newDelta,
        pendingCount,
        mrr,
      };
    },
    refetchInterval: 60000,
  });
};

interface PendingRow {
  id: string;
  name: string;
  city: string | null;
  phone: string | null;
  profile_image: string | null;
  created_at: string;
  ownerName: string | null;
  ownerAvatar: string | null;
  waveReference: string | null;
}

const usePendingRestaurants = () => {
  return useQuery({
    queryKey: ['admin', 'pending-restaurants'],
    queryFn: async (): Promise<PendingRow[]> => {
      const { data: restos, error } = await supabase
        .from('restaurants')
        .select('id, name, city, phone, profile_image, created_at')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      const rows = (restos ?? []);
      if (rows.length === 0) return [];

      const ids = rows.map((r) => r.id);
      const { data: owners } = await supabase
        .from('restaurant_owners')
        .select('restaurant_id, user_id')
        .in('restaurant_id', ids);
      const ownerByResto = new Map<string, string>();
      for (const o of owners ?? []) ownerByResto.set(o.restaurant_id, o.user_id);

      // Latest pending wave reference per restaurant
      const { data: subs } = await (supabase as any)
        .from('subscriptions')
        .select('restaurant_id, wave_reference, requested_at, status')
        .in('restaurant_id', ids)
        .order('requested_at', { ascending: false });
      const waveByResto = new Map<string, string>();
      for (const s of (subs ?? []) as Array<{ restaurant_id: string; wave_reference: string | null }>) {
        if (!waveByResto.has(s.restaurant_id) && s.wave_reference) {
          waveByResto.set(s.restaurant_id, s.wave_reference);
        }
      }

      const userIds = Array.from(new Set([...ownerByResto.values()]));
      let profiles: Array<{ id: string; display_name: string | null; avatar_url: string | null }> = [];
      if (userIds.length > 0) {
        const { data } = await supabase
          .from('profiles').select('id, display_name, avatar_url').in('id', userIds);
        profiles = data ?? [];
      }
      const profById = new Map(profiles.map((p) => [p.id, p]));

      return rows.map((r) => {
        const uid = ownerByResto.get(r.id);
        const prof = uid ? profById.get(uid) : undefined;
        return {
          id: r.id,
          name: r.name,
          city: r.city,
          phone: r.phone,
          profile_image: r.profile_image,
          created_at: r.created_at,
          ownerName: prof?.display_name ?? null,
          ownerAvatar: prof?.avatar_url ?? null,
          waveReference: waveByResto.get(r.id) ?? null,
        };
      });
    },
  });
};

// ---------------- Sub-components ----------------
interface KpiProps {
  label: string;
  value: string;
  icon: typeof Users;
  delta?: number | null;
  subtitle?: string;
  urgent?: boolean;
}
const KpiCard = ({ label, value, icon: Icon, delta, subtitle, urgent }: KpiProps) => {
  const positive = delta !== null && delta !== undefined && delta >= 0;
  return (
    <div
      className={[
        'relative rounded-xl border p-4 bg-card shadow-sm',
        urgent ? 'border-red-300 bg-red-50 animate-pulse' : 'border-border',
      ].join(' ')}
    >
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <Icon size={16} className={urgent ? 'text-red-500' : 'text-muted-foreground'} />
      </div>
      <p className={['mt-2 text-[24px] font-medium leading-none', urgent ? 'text-red-600' : 'text-foreground'].join(' ')}>
        {value}
      </p>
      <div className="mt-2 text-[11px] flex items-center gap-1">
        {delta !== null && delta !== undefined ? (
          <span className={['inline-flex items-center gap-0.5 font-semibold', positive ? 'text-emerald-600' : 'text-red-500'].join(' ')}>
            {positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {positive ? '+' : ''}{delta.toFixed(1)}%
          </span>
        ) : subtitle ? (
          <span className="text-muted-foreground">{subtitle}</span>
        ) : null}
      </div>
    </div>
  );
};

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
      <CheckCircle2 size={22} className="text-emerald-600" />
    </div>
    <p className="text-sm font-semibold">Aucune inscription en attente</p>
    <p className="text-xs text-muted-foreground mt-1">Tous les restaurants sont validés.</p>
  </div>
);

const PendingRestaurantsTable = () => {
  const qc = useQueryClient();
  const { data: rows = [], isLoading } = usePendingRestaurants();

  const refetchAll = () => {
    qc.invalidateQueries({ queryKey: ['admin', 'pending-restaurants'] });
    qc.invalidateQueries({ queryKey: ['admin', 'metrics'] });
    qc.invalidateQueries({ queryKey: ['restaurants'] });
  };

  const validate = async (id: string, name: string) => {
    const { error } = await supabase.from('restaurants').update({ status: 'active' } as any).eq('id', id);
    if (error) { toast.error('Erreur validation'); return; }
    // Mark related pending subscription as active
    await (supabase as any).from('subscriptions')
      .update({ status: 'active', validated_at: new Date().toISOString() })
      .eq('restaurant_id', id).eq('status', 'pending');
    toast.success(`Restaurant validé : ${name}`);
    refetchAll();
  };

  const refuse = async (id: string, name: string) => {
    if (!confirm(`Refuser l'inscription de « ${name} » ? Le restaurant sera masqué mais conservé.`)) return;
    const { error } = await supabase.from('restaurants').update({ status: 'refused' } as any).eq('id', id);
    if (error) { toast.error('Erreur refus'); return; }
    await (supabase as any).from('subscriptions')
      .update({ status: 'refused' }).eq('restaurant_id', id).eq('status', 'pending');
    toast.success(`Restaurant refusé : ${name}`);
    refetchAll();
  };

  const copyRef = async (ref: string) => {
    try {
      await navigator.clipboard.writeText(ref);
      toast.success('Référence copiée');
    } catch {
      toast.error('Impossible de copier');
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-sm">Inscriptions restaurants à valider</h3>
          {rows.length > 0 && (
            <Badge className="bg-red-500 hover:bg-red-500 text-white h-5 px-2 text-[10px]">
              {rows.length} en attente
            </Badge>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-muted-foreground" size={18} /></div>
      ) : rows.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-muted-foreground border-b border-border">
                <th className="text-left font-semibold px-4 py-2.5">Date</th>
                <th className="text-left font-semibold px-4 py-2.5">Restaurant</th>
                <th className="text-left font-semibold px-4 py-2.5">Gérant</th>
                <th className="text-left font-semibold px-4 py-2.5">Tél</th>
                <th className="text-left font-semibold px-4 py-2.5">Ville</th>
                <th className="text-left font-semibold px-4 py-2.5">Réf. Wave</th>
                <th className="text-right font-semibold px-4 py-2.5">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{fmtDate(r.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center overflow-hidden shrink-0">
                        {r.profile_image ? (
                          <img src={r.profile_image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Store size={14} className="text-muted-foreground" />
                        )}
                      </div>
                      <span className="font-semibold text-xs truncate max-w-[160px]">{r.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                        {r.ownerAvatar ? (
                          <img src={r.ownerAvatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px] font-bold text-primary">{initials(r.ownerName)}</span>
                        )}
                      </div>
                      <span className="text-xs truncate max-w-[120px]">{r.ownerName ?? '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap">
                    {r.phone ? (
                      <span className="inline-flex items-center gap-1 text-muted-foreground"><Phone size={11} />{r.phone}</span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className="inline-flex items-center gap-1 text-muted-foreground"><MapPin size={11} />{r.city ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {r.waveReference ? (
                      <button
                        onClick={() => copyRef(r.waveReference!)}
                        className="inline-flex items-center gap-1 font-mono text-[11px] px-2 py-1 rounded bg-muted hover:bg-muted/70 transition-colors"
                        title="Copier la référence"
                      >
                        <Copy size={11} />
                        <span className="truncate max-w-[110px]">{r.waveReference}</span>
                      </button>
                    ) : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => validate(r.id, r.name)}
                        className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-semibold transition-colors"
                      >
                        <Check size={12} /> Valider
                      </button>
                      <button
                        onClick={() => refuse(r.id, r.name)}
                        className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md bg-red-500 hover:bg-red-600 text-white text-[11px] font-semibold transition-colors"
                      >
                        <X size={12} /> Refuser
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ---------------- Exports bar ----------------
const ExportBar = () => {
  const exportRestos = async () => {
    const { data } = await supabase.from('restaurants').select('id, name, city, quartier, phone, email, is_active, rating, rating_count, created_at');
    downloadCSV(data ?? [], `restaurants_${new Date().toISOString().slice(0, 10)}.csv`);
  };
  const exportClients = async () => {
    const { data } = await supabase.from('profiles').select('id, display_name, first_name, last_name, phone, gender, created_at');
    downloadCSV(data ?? [], `clients_${new Date().toISOString().slice(0, 10)}.csv`);
  };
  const exportMrr = async () => {
    const { data } = await supabase
      .from('restaurant_owners')
      .select('restaurant_id, restaurant_name, plan, status, subscription_started_at, subscription_ends_at');
    const rows = (data ?? []).map((r) => ({ ...r, prix_fcfa: r.status === 'active' ? PRO_PRICE : 0 }));
    downloadCSV(rows, `mrr_${new Date().toISOString().slice(0, 10)}.csv`);
  };
  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" onClick={exportRestos} className="gap-1.5">
        <Download size={13} /> <Store size={13} /> Export Restos
      </Button>
      <Button size="sm" variant="outline" onClick={exportClients} className="gap-1.5">
        <Download size={13} /> <Users size={13} /> Export Clients
      </Button>
      <Button size="sm" variant="outline" onClick={exportMrr} className="gap-1.5">
        <Download size={13} /> <CreditCard size={13} /> Export MRR
      </Button>
    </div>
  );
};

// ---------------- Main ----------------
const AdminOverview = () => {
  const { data: m, isLoading } = useAdminMetrics();

  const kpis = useMemo(() => ([
    { label: 'MAU', value: isLoading ? '…' : fmtNum(m?.mau ?? 0), icon: Users, subtitle: '30 derniers jours' },
    { label: 'WAU', value: isLoading ? '…' : fmtNum(m?.wau ?? 0), icon: Activity, delta: m?.wauDelta ?? null, subtitle: 'vs 7j précédents' },
    { label: 'Rétention J30', value: 'N/A', icon: TrendingUp, subtitle: 'tracking à ajouter' },
    { label: 'MRR', value: isLoading ? '…' : fmtFCFA(m?.mrr ?? 0), icon: Coins, subtitle: 'mois en cours' },
    { label: 'Nouveaux J7', value: isLoading ? '…' : fmtNum(m?.newRestos7 ?? 0), icon: UserPlus, delta: m?.newDelta ?? null, subtitle: 'vs 7j précédents' },
    { label: 'À Valider', value: isLoading ? '…' : fmtNum(m?.pendingCount ?? 0), icon: AlertTriangle, urgent: (m?.pendingCount ?? 0) > 0, subtitle: 'restaurants en attente' },
  ]), [m, isLoading]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Vue d'ensemble</h2>
          <p className="text-xs text-muted-foreground">Pilotage en temps réel · Vos Resto</p>
        </div>
        <ExportBar />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((k) => (
          <KpiCard key={k.label} {...k} />
        ))}
      </div>

      <PendingRestaurantsTable />
    </div>
  );
};

export default AdminOverview;
