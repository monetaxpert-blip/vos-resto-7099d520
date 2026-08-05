import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { ArrowRight, CalendarDays, Check, ChefHat, Clock3, Eye, MessageSquareText, ShoppingBag, Star, Store, TrendingUp, UtensilsCrossed, X as XIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOwnerOrders } from '@/hooks/useOrders';
import { useOwnerReservations } from '@/hooks/useOwnerReservations';
import { useRestaurantMenu } from '@/hooks/useRestaurantMenu';
import { useRestaurantStats } from '@/hooks/useRestaurantStats';
import { Button } from '@/components/ui/button';
import { formatFCFA } from '@/lib/format';
import type { DBRestaurant } from '@/hooks/useDBRestaurants';

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const STATUS_LABELS: Record<string, string> = { pending: 'À confirmer', confirmed: 'Confirmée', preparing: 'En cuisine', ready: 'Prête', delivered: 'Livrée', cancelled: 'Annulée' };
const STATUS_STYLES: Record<string, string> = {
  pending: 'border-primary/30 bg-primary/10 text-primary', confirmed: 'border-accent/30 bg-accent/10 text-foreground',
  preparing: 'border-gold/30 bg-gold/10 text-gold', ready: 'border-foreground/20 bg-foreground/10 text-foreground',
  delivered: 'border-foreground/20 bg-secondary text-foreground', cancelled: 'border-destructive/30 bg-destructive/10 text-destructive',
};

const sameDay = (value: string, date: Date) => {
  const candidate = new Date(value);
  return candidate.getFullYear() === date.getFullYear() && candidate.getMonth() === date.getMonth() && candidate.getDate() === date.getDate();
};

const Metric = ({ icon, label, value, detail, urgent = false }: { icon: React.ReactNode; label: string; value: string | number; detail: string; urgent?: boolean }) => (
  <div className={`min-h-32 border-l-2 px-4 py-3 sm:px-5 ${urgent ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
    <div className="mb-4 flex items-center justify-between text-muted-foreground"><span className="text-[11px] font-bold uppercase tracking-normal">{label}</span>{icon}</div>
    <p className={`font-display text-3xl font-bold leading-none ${urgent ? 'text-primary' : 'text-foreground'}`}>{value}</p>
    <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
  </div>
);

export default function OverviewTab({ restaurant, onNavigate }: { restaurant: DBRestaurant; onNavigate: (tab: string) => void }) {
  const { data: stats } = useRestaurantStats(restaurant.id);
  const { data: orders = [] } = useOwnerOrders(restaurant.id);
  const { reservations, updateStatus } = useOwnerReservations(restaurant.id);
  const { items: menuItems } = useRestaurantMenu(restaurant.id);

  const { data: dailyViews = [] } = useQuery({
    queryKey: ['overview-daily-events', restaurant.id], enabled: !!restaurant.id,
    queryFn: async () => {
      const start = new Date(); start.setDate(start.getDate() - 6); start.setHours(0, 0, 0, 0);
      const { data, error } = await supabase.from('analytics_events').select('created_at').eq('restaurant_id', restaurant.id).gte('created_at', start.toISOString());
      if (error) return [];
      const buckets = new Map<string, number>();
      for (let i = 6; i >= 0; i -= 1) { const day = new Date(); day.setDate(day.getDate() - i); buckets.set(day.toISOString().slice(0, 10), 0); }
      for (const row of data ?? []) { const key = new Date(row.created_at).toISOString().slice(0, 10); if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1); }
      return Array.from(buckets.entries()).map(([date, views]) => ({ label: DAY_LABELS[(new Date(date).getDay() + 6) % 7], views }));
    },
  });

  const now = new Date();
  const pendingOrders = orders.filter((order) => order.status === 'pending');
  const activeOrders = orders.filter((order) => ['confirmed', 'preparing', 'ready'].includes(order.status));
  const todayOrders = orders.filter((order) => sameDay(order.created_at, now));
  const todayRevenue = todayOrders.filter((order) => order.status !== 'cancelled').reduce((total, order) => total + Number(order.total_amount), 0);
  const todayReservations = reservations.filter((reservation) => reservation.reservation_date === now.toISOString().slice(0, 10));
  const pendingReservations = reservations.filter((reservation) => reservation.status === 'pending');
  const urgentCount = pendingOrders.length + pendingReservations.length;
  const recentOrders = useMemo(() => orders.slice(0, 5), [orders]);
  const upcomingReservations = useMemo(() => reservations.filter((r) => r.status !== 'cancelled').sort((a, b) => `${a.reservation_date}${a.reservation_time}`.localeCompare(`${b.reservation_date}${b.reservation_time}`)).slice(0, 4), [reservations]);

  return (
    <div className="space-y-7">
      <section aria-labelledby="today-title">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div><p className="text-xs font-bold uppercase text-primary">Opérations en direct</p><h2 id="today-title" className="mt-1 text-xl font-bold sm:text-2xl">Aujourd'hui</h2></div>
          <p className="text-xs capitalize text-muted-foreground">{now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <div className="grid grid-cols-2 overflow-hidden border border-border bg-card sm:grid-cols-4">
          <Metric icon={<Clock3 size={16} />} label="À confirmer" value={urgentCount} detail="actions requises" urgent={urgentCount > 0} />
          <Metric icon={<ShoppingBag size={16} />} label="Commandes" value={todayOrders.length} detail={`${activeOrders.length} en cours`} />
          <Metric icon={<CalendarDays size={16} />} label="Réservations" value={todayReservations.length} detail={`${pendingReservations.length} à valider`} />
          <Metric icon={<TrendingUp size={16} />} label="Chiffre d'affaires" value={formatFCFA(todayRevenue)} detail="commandes du jour" />
        </div>
      </section>

      {urgentCount > 0 && (
        <section className="border-y border-primary/20 bg-primary/5 py-5" aria-labelledby="actions-title">
          <div className="mb-4 flex items-center justify-between gap-3 px-4 sm:px-5">
            <div><p className="text-xs font-bold uppercase text-primary">Priorité</p><h2 id="actions-title" className="mt-1 text-lg font-bold">À faire maintenant</h2></div>
            <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-primary px-2 text-xs font-bold text-primary-foreground">{urgentCount}</span>
          </div>
          <div className="grid gap-px bg-primary/10 sm:grid-cols-2">
            {pendingOrders.slice(0, 2).map((order) => (
              <button key={order.id} onClick={() => onNavigate('orders')} className="flex min-h-20 items-center gap-3 bg-background px-4 py-3 text-left transition-colors hover:bg-secondary sm:px-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-primary/10 text-primary"><ChefHat size={18} /></span>
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">Commande #{order.id.slice(0, 6).toUpperCase()}</span><span className="block text-xs text-muted-foreground">{order.customer_name ?? 'Client'} · {formatFCFA(order.total_amount)}</span></span><ArrowRight size={16} className="shrink-0 text-primary" />
              </button>
            ))}
            {pendingReservations.slice(0, 2).map((reservation) => (
              <div key={reservation.id} className="flex min-h-20 items-center gap-3 bg-background px-4 py-3 sm:px-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-accent/10 text-accent"><CalendarDays size={18} /></span>
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{reservation.client_name ?? reservation.customer_name ?? 'Client'}</span><span className="block text-xs text-muted-foreground">{reservation.reservation_time.slice(0, 5)} · {reservation.guests} personnes</span></span>
                <span className="flex shrink-0 gap-1"><Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateStatus.mutate({ id: reservation.id, status: 'confirmed' })} aria-label="Confirmer"><Check size={14} /></Button><Button size="icon" variant="outline" className="h-8 w-8 text-destructive" onClick={() => updateStatus.mutate({ id: reservation.id, status: 'cancelled' })} aria-label="Refuser"><XIcon size={14} /></Button></span>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-7 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.8fr)]">
        <div className="space-y-7">
          <section className="border border-border bg-card" aria-labelledby="performance-title">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border px-4 py-4 sm:px-6">
              <div><p className="text-xs font-bold uppercase text-muted-foreground">Performance</p><h2 id="performance-title" className="mt-1 text-lg font-bold">Activité sur 7 jours</h2></div>
              <div className="flex gap-5 text-right"><div><p className="text-lg font-bold">{stats?.views ?? 0}</p><p className="text-[10px] uppercase text-muted-foreground">vues</p></div><div><p className="text-lg font-bold text-primary">{(restaurant.rating ?? 0).toFixed(1)}</p><p className="text-[10px] uppercase text-muted-foreground">note</p></div></div>
            </div>
            <div className="h-56 px-2 pb-3 pt-5 sm:px-5"><ResponsiveContainer width="100%" height="100%"><BarChart data={dailyViews} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}><CartesianGrid stroke="hsl(var(--border))" vertical={false} /><XAxis dataKey="label" axisLine={false} tickLine={false} fontSize={11} stroke="hsl(var(--muted-foreground))" /><Tooltip cursor={{ fill: 'hsl(var(--secondary))' }} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 4, fontSize: 12 }} /><Bar dataKey="views" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} maxBarSize={38} /></BarChart></ResponsiveContainer></div>
          </section>

          <section className="border border-border bg-card" aria-labelledby="orders-title">
            <div className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-6"><div><p className="text-xs font-bold uppercase text-muted-foreground">Service</p><h2 id="orders-title" className="mt-1 text-lg font-bold">Commandes récentes</h2></div><Button variant="ghost" size="sm" onClick={() => onNavigate('orders')} className="text-primary">Tout voir <ArrowRight size={14} /></Button></div>
            {recentOrders.length === 0 ? <p className="px-5 py-8 text-center text-sm text-muted-foreground">Aucune commande pour le moment</p> : <div className="divide-y divide-border">{recentOrders.map((order) => (
              <button key={order.id} onClick={() => onNavigate('orders')} className="grid w-full grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary sm:grid-cols-[110px_1fr_auto_auto] sm:px-6"><span className="font-mono text-xs font-bold">#{order.id.slice(0, 8).toUpperCase()}</span><span className="hidden min-w-0 sm:block"><span className="block truncate text-sm font-semibold">{order.customer_name ?? 'Client'}</span><span className="text-xs text-muted-foreground">{order.delivery_mode === 'delivery' ? 'Livraison' : 'Retrait'}</span></span><span className="text-sm font-bold">{formatFCFA(order.total_amount)}</span><span className={`col-span-2 w-fit border px-2 py-1 text-[10px] font-bold sm:col-span-1 ${STATUS_STYLES[order.status] ?? STATUS_STYLES.pending}`}>{STATUS_LABELS[order.status] ?? order.status}</span></button>
            ))}</div>}
          </section>
        </div>

        <aside className="space-y-5">
          <section className="border border-border bg-card" aria-labelledby="reservations-title">
            <div className="flex items-center justify-between border-b border-border px-4 py-4"><h2 id="reservations-title" className="text-base font-bold">Prochaines réservations</h2><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onNavigate('reservations')} aria-label="Voir les réservations"><ArrowRight size={15} /></Button></div>
            {upcomingReservations.length === 0 ? <p className="px-4 py-7 text-center text-xs text-muted-foreground">Aucune réservation à venir</p> : <div className="divide-y divide-border">{upcomingReservations.map((reservation) => <div key={reservation.id} className="flex gap-3 px-4 py-3"><div className="w-12 shrink-0 border-r border-border text-center"><p className="text-sm font-bold">{reservation.reservation_time.slice(0, 5)}</p><p className="text-[10px] text-muted-foreground">{reservation.guests} pers.</p></div><div className="min-w-0"><p className="truncate text-sm font-semibold">{reservation.client_name ?? reservation.customer_name ?? 'Client'}</p><p className="text-xs text-muted-foreground">{new Date(reservation.reservation_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</p></div></div>)}</div>}
          </section>

          <section className="border border-border bg-card px-4 py-4" aria-labelledby="shortcuts-title">
            <p className="text-xs font-bold uppercase text-muted-foreground">Restaurant</p><h2 id="shortcuts-title" className="mt-1 text-base font-bold">Accès rapides</h2>
            <div className="mt-4 divide-y divide-border border-y border-border">{[
              { id: 'menu', label: 'Gérer le menu', detail: `${menuItems.length} plat${menuItems.length > 1 ? 's' : ''}`, icon: UtensilsCrossed },
              { id: 'profile', label: 'Profil restaurant', detail: 'Informations et horaires', icon: Store },
              { id: 'stats', label: 'Avis clients', detail: `${restaurant.ratingCount ?? 0} avis`, icon: MessageSquareText },
            ].map((item) => { const Icon = item.icon; return <button key={item.id} onClick={() => onNavigate(item.id)} className="flex w-full items-center gap-3 py-3 text-left hover:text-primary"><Icon size={17} className="text-primary" /><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{item.label}</span><span className="block truncate text-[11px] text-muted-foreground">{item.detail}</span></span><ArrowRight size={14} /></button>; })}</div>
          </section>
          <section className="grid grid-cols-2 border border-border bg-card"><div className="border-r border-border p-4"><Eye size={16} className="text-primary" /><p className="mt-3 text-2xl font-bold">{stats?.views ?? 0}</p><p className="text-[11px] text-muted-foreground">Vues du profil</p></div><div className="p-4"><Star size={16} className="text-gold" /><p className="mt-3 text-2xl font-bold">{(restaurant.rating ?? 0).toFixed(1)}</p><p className="text-[11px] text-muted-foreground">{restaurant.ratingCount ?? 0} avis</p></div></section>
        </aside>
      </div>
    </div>
  );
}