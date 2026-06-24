import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { Eye, ShoppingBag, Calendar, Star, Bike, Store, Check, X as XIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOwnerOrders } from '@/hooks/useOrders';
import { useOwnerReservations } from '@/hooks/useOwnerReservations';
import { useRestaurantMenu } from '@/hooks/useRestaurantMenu';
import { useRestaurantStats } from '@/hooks/useRestaurantStats';
import { formatFCFA } from '@/lib/format';
import type { DBRestaurant } from '@/hooks/useDBRestaurants';

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 border-amber-300',
  confirmed: 'bg-blue-100 text-blue-700 border-blue-300',
  preparing: 'bg-indigo-100 text-indigo-700 border-indigo-300',
  ready: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  delivered: 'bg-green-100 text-green-700 border-green-300',
  cancelled: 'bg-red-100 text-red-700 border-red-300',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  preparing: 'En cuisine',
  ready: 'Prête',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

const initialsColor = (name: string) => {
  const palette = ['bg-rose-100 text-rose-700', 'bg-amber-100 text-amber-700', 'bg-emerald-100 text-emerald-700', 'bg-sky-100 text-sky-700', 'bg-violet-100 text-violet-700', 'bg-orange-100 text-orange-700'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i)) % palette.length;
  return palette[h];
};

interface KpiProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtitle: React.ReactNode;
  iconBg: string;
  iconColor: string;
}
const KpiCard = ({ icon, label, value, subtitle, iconBg, iconColor }: KpiProps) => (
  <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg} ${iconColor} mb-3`}>{icon}</div>
    <p className="text-3xl font-bold tracking-tight">{value}</p>
    <p className="text-sm font-semibold mt-1">{label}</p>
    <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
  </div>
);

export default function OverviewTab({ restaurant, onNavigate }: { restaurant: DBRestaurant; onNavigate: (tab: string) => void }) {
  const { data: stats } = useRestaurantStats(restaurant.id);
  const { data: orders = [] } = useOwnerOrders(restaurant.id);
  const { reservations, updateStatus } = useOwnerReservations(restaurant.id);
  const { items: menuItems } = useRestaurantMenu(restaurant.id);

  // 7-day activity series via direct analytics_events query (no existing hook modified)
  const { data: dailyData = [] } = useQuery({
    queryKey: ['overview-daily-events', restaurant.id],
    enabled: !!restaurant.id,
    queryFn: async () => {
      const sevenAgo = new Date();
      sevenAgo.setDate(sevenAgo.getDate() - 6);
      sevenAgo.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from('analytics_events')
        .select('created_at')
        .eq('restaurant_id', restaurant.id)
        .gte('created_at', sevenAgo.toISOString());
      if (error) return [];
      const buckets = new Map<string, number>();
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        buckets.set(d.toISOString().slice(0, 10), 0);
      }
      for (const row of data ?? []) {
        const key = new Date(row.created_at).toISOString().slice(0, 10);
        if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
      }
      return Array.from(buckets.entries()).map(([date, count]) => {
        const d = new Date(date);
        const idx = (d.getDay() + 6) % 7;
        return { label: DAY_LABELS[idx], count };
      });
    },
  });

  const pendingOrders = useMemo(() => orders.filter((o) => o.status === 'pending').length, [orders]);
  const pendingReservations = useMemo(() => reservations.filter((r) => r.status === 'pending').length, [reservations]);
  const recentOrders = useMemo(() => orders.slice(0, 5), [orders]);
  const upcomingReservations = useMemo(
    () =>
      reservations
        .filter((r) => r.status !== 'cancelled')
        .sort((a, b) => (a.reservation_date + a.reservation_time).localeCompare(b.reservation_date + b.reservation_time))
        .slice(0, 4),
    [reservations]
  );

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          icon={<Eye size={18} />} label="Vues" value={stats?.views ?? 0}
          subtitle="Total des visites"
          iconBg="bg-amber-100" iconColor="text-amber-600"
        />
        <KpiCard
          icon={<ShoppingBag size={18} />} label="Commandes" value={orders.length}
          subtitle={<span className={pendingOrders > 0 ? 'text-orange-600 font-semibold' : ''}>{pendingOrders} en attente</span>}
          iconBg="bg-emerald-100" iconColor="text-emerald-600"
        />
        <KpiCard
          icon={<Calendar size={18} />} label="Réservations" value={reservations.length}
          subtitle={<span className={pendingReservations > 0 ? 'text-orange-600 font-semibold' : ''}>{pendingReservations} en attente</span>}
          iconBg="bg-sky-100" iconColor="text-sky-600"
        />
        <KpiCard
          icon={<Star size={18} />} label="Note" value={(restaurant.rating ?? 0).toFixed(1)}
          subtitle={`${restaurant.ratingCount ?? 0} avis`}
          iconBg="bg-violet-100" iconColor="text-violet-600"
        />
      </div>

      {/* Chart + recent orders */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Activité</h3>
              <p className="text-base font-bold mt-0.5">7 derniers jours</p>
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="overviewLine" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d85a30" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#d85a30" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }} />
                <Line type="monotone" dataKey="count" stroke="#d85a30" strokeWidth={2.5} dot={{ r: 3, fill: '#d85a30' }} fill="url(#overviewLine)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-2 bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Commandes récentes</h3>
            <button onClick={() => onNavigate('orders')} className="text-xs font-semibold text-primary">Voir tout →</button>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Aucune commande</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((o) => (
                <div key={o.id} className="flex items-center gap-3 text-sm">
                  <span className="font-mono text-[11px] text-muted-foreground">#{o.id.slice(0, 8).toUpperCase()}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{o.customer_name ?? 'Client'}</p>
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                      {o.delivery_mode === 'delivery' ? <Bike size={11} /> : <Store size={11} />}
                      {o.total_amount.toLocaleString('fr-FR')} F
                    </span>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${STATUS_COLORS[o.status] ?? STATUS_COLORS.pending}`}>
                    {STATUS_LABELS[o.status] ?? o.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reservations + menu preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Réservations à venir</h3>
            <button onClick={() => onNavigate('reservations')} className="text-xs font-semibold text-primary">Voir tout →</button>
          </div>
          {upcomingReservations.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Aucune réservation</p>
          ) : (
            <div className="space-y-3">
              {upcomingReservations.map((r) => {
                const name = r.client_name ?? r.customer_name ?? 'Client';
                const initials = name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
                return (
                  <div key={r.id} className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${initialsColor(name)}`}>{initials}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(r.reservation_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} · {r.reservation_time.slice(0, 5)} · {r.guests} pers.
                      </p>
                    </div>
                    {r.status === 'pending' ? (
                      <div className="flex gap-1">
                        <button onClick={() => updateStatus.mutate({ id: r.id, status: 'confirmed' })} aria-label="Confirmer" className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center hover:bg-emerald-200"><Check size={14} /></button>
                        <button onClick={() => updateStatus.mutate({ id: r.id, status: 'cancelled' })} aria-label="Refuser" className="w-7 h-7 rounded-full bg-red-100 text-red-700 flex items-center justify-center hover:bg-red-200"><XIcon size={14} /></button>
                      </div>
                    ) : (
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${STATUS_COLORS[r.status] ?? STATUS_COLORS.confirmed}`}>{STATUS_LABELS[r.status] ?? r.status}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Menu</h3>
            <button onClick={() => onNavigate('menu')} className="text-xs font-semibold text-primary">Gérer le menu →</button>
          </div>
          {menuItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4 text-center">
              <p className="text-sm font-semibold">Votre menu est vide</p>
              <p className="text-xs text-muted-foreground mt-1">Ajoutez vos premiers plats pour activer les commandes en ligne.</p>
              <button onClick={() => onNavigate('menu')} className="mt-3 inline-flex rounded-full bg-primary text-primary-foreground px-3 py-1.5 text-xs font-bold">Ajouter un plat</button>
            </div>
          ) : (
            <div className="space-y-2">
              {menuItems.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center gap-3 text-sm">
                  {item.category && <span className="rounded-full bg-secondary text-[10px] px-2 py-0.5">{item.category}</span>}
                  <p className="flex-1 font-medium truncate">{item.name}</p>
                  <p className="font-semibold text-xs">{formatFCFA(item.price)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
