import { useEffect, useMemo, useRef, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Phone, MapPin, Package, ShoppingBag, X } from 'lucide-react';
import { useOwnerOrders, useUpdateOrderStatus, type OrderStatus, type OrderWithItems } from '@/hooks/useOrders';
import { formatFCFA } from '@/lib/format';

type Filter = 'active' | 'delivered' | 'cancelled' | 'all';

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'En attente', confirmed: 'Confirmée', preparing: 'En préparation',
  ready: 'Prête', delivered: 'Livrée', cancelled: 'Annulée',
};
const STATUS_STYLE: Record<OrderStatus, string> = {
  pending: 'bg-orange-500/15 text-orange-600 border-orange-500/30',
  confirmed: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
  preparing: 'bg-violet-500/15 text-violet-600 border-violet-500/30',
  ready: 'bg-teal-500/15 text-teal-600 border-teal-500/30',
  delivered: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
  cancelled: 'bg-red-500/15 text-red-600 border-red-500/30',
};
const NEXT: Partial<Record<OrderStatus, { next: OrderStatus; label: string }>> = {
  pending: { next: 'confirmed', label: 'Confirmer' },
  confirmed: { next: 'preparing', label: 'En préparation' },
  preparing: { next: 'ready', label: 'Prête' },
  ready: { next: 'delivered', label: 'Marquer livrée' },
};

function playBeep() {
  try {
    const Ctor = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
    const ctx = new Ctor();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.value = 0.15;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
    setTimeout(() => ctx.close(), 300);
  } catch { /* noop */ }
}

export default function OwnerOrders({ restaurantId }: { restaurantId: string }) {
  const { data: orders = [], isLoading } = useOwnerOrders(restaurantId);
  const updateStatus = useUpdateOrderStatus();
  const [filter, setFilter] = useState<Filter>('active');
  const seenIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (orders.length === 0) return;
    const isFirstLoad = seenIds.current.size === 0;
    const fresh = orders.filter((o) => !seenIds.current.has(o.id));
    fresh.forEach((o) => seenIds.current.add(o.id));
    if (!isFirstLoad && fresh.some((o) => o.status === 'pending')) playBeep();
  }, [orders]);

  const filtered = useMemo(() => {
    if (filter === 'all') return orders;
    if (filter === 'delivered') return orders.filter((o) => o.status === 'delivered');
    if (filter === 'cancelled') return orders.filter((o) => o.status === 'cancelled');
    return orders.filter((o) => !['delivered', 'cancelled'].includes(o.status));
  }, [orders, filter]);

  const counts = useMemo(() => ({
    active: orders.filter((o) => !['delivered', 'cancelled'].includes(o.status)).length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
    all: orders.length,
  }), [orders]);

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'active', label: 'En cours' },
    { key: 'delivered', label: 'Livrées' },
    { key: 'cancelled', label: 'Annulées' },
    { key: 'all', label: 'Toutes' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto hide-scrollbar">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold ${filter === f.key ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'}`}
          >
            {f.label} ({counts[f.key]})
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement...</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <ShoppingBag size={28} className="mx-auto text-muted-foreground mb-2" />
          <p className="font-semibold">Aucune commande</p>
          <p className="text-xs text-muted-foreground mt-1">Les nouvelles commandes apparaîtront ici en temps réel.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((o: OrderWithItems) => {
            const next = NEXT[o.status];
            return (
              <div key={o.id} className="rounded-2xl bg-card border border-border p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-sm">#{o.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-xs text-muted-foreground">{format(parseISO(o.created_at), "EEE d MMM · HH:mm", { locale: fr })}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLE[o.status]}`}>{STATUS_LABEL[o.status]}</span>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold">{o.delivery_mode === 'delivery' ? 'Livraison' : o.delivery_mode === 'pickup' ? 'À emporter' : 'Sur place'}</span>
                  </div>
                </div>

                <ul className="text-xs text-muted-foreground space-y-0.5">
                  {o.items?.map((i) => (
                    <li key={i.id} className="flex justify-between gap-2">
                      <span className="truncate">{i.quantity}× {i.name}</span>
                      <span className="font-semibold text-foreground">{formatFCFA(i.unit_price * i.quantity)}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-extrabold">{formatFCFA(o.total_amount)}</span>
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  {o.customer_name && <p className="font-semibold text-foreground">{o.customer_name}</p>}
                  {o.customer_phone && (
                    <a href={`tel:${o.customer_phone}`} className="inline-flex items-center gap-1 text-primary font-semibold">
                      <Phone size={11} /> {o.customer_phone}
                    </a>
                  )}
                  {o.delivery_address && (
                    <p className="flex items-start gap-1"><MapPin size={11} className="mt-0.5 flex-shrink-0" /> {o.delivery_address}</p>
                  )}
                </div>

                {(next || o.status === 'pending') && (
                  <div className="flex gap-2 pt-1">
                    {next && (
                      <button
                        disabled={updateStatus.isPending}
                        onClick={() => updateStatus.mutate({ orderId: o.id, status: next.next })}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-2 text-xs font-bold disabled:opacity-60"
                      >
                        <Package size={12} /> {next.label}
                      </button>
                    )}
                    {o.status === 'pending' && (
                      <button
                        disabled={updateStatus.isPending}
                        onClick={() => updateStatus.mutate({ orderId: o.id, status: 'cancelled' })}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 text-white py-2 text-xs font-bold disabled:opacity-60"
                      >
                        <X size={12} /> Refuser
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
