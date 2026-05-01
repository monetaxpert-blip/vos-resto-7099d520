import { useMemo, useState } from 'react';
import { Check, X, Clock, Phone, Users, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useOwnerReservations, type OwnerReservation } from '@/hooks/useOwnerReservations';

type Filter = 'all' | 'pending' | 'confirmed' | 'cancelled';

const STATUS_STYLE: Record<OwnerReservation['status'], { label: string; className: string }> = {
  pending: { label: 'En attente', className: 'bg-orange-500/15 text-orange-600 border-orange-500/30' },
  confirmed: { label: 'Confirmée', className: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30' },
  cancelled: { label: 'Annulée', className: 'bg-red-500/15 text-red-600 border-red-500/30' },
};

export default function OwnerReservations({ restaurantId }: { restaurantId: string }) {
  const { reservations, isLoading, updateStatus } = useOwnerReservations(restaurantId);
  const [filter, setFilter] = useState<Filter>('pending');

  const counts = useMemo(() => {
    return {
      all: reservations.length,
      pending: reservations.filter((r) => r.status === 'pending').length,
      confirmed: reservations.filter((r) => r.status === 'confirmed').length,
      cancelled: reservations.filter((r) => r.status === 'cancelled').length,
    };
  }, [reservations]);

  const filtered = useMemo(
    () => (filter === 'all' ? reservations : reservations.filter((r) => r.status === filter)),
    [reservations, filter]
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto hide-scrollbar">
        {(['pending', 'confirmed', 'cancelled', 'all'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
              filter === f ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'
            }`}
          >
            {f === 'pending' ? 'En attente' : f === 'confirmed' ? 'Confirmées' : f === 'cancelled' ? 'Annulées' : 'Toutes'} ({counts[f]})
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement...</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <Calendar size={28} className="mx-auto text-muted-foreground mb-2" />
          <p className="font-semibold">Aucune réservation</p>
          <p className="text-xs text-muted-foreground mt-1">Les nouvelles demandes apparaîtront ici en temps réel.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const style = STATUS_STYLE[r.status];
            return (
              <div key={r.id} className="rounded-2xl bg-card border border-border p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-sm">
                      {r.client_name || 'Client'}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {format(parseISO(r.reservation_date), 'EEE d MMM', { locale: fr })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {r.reservation_time}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={12} /> {r.guests} pers.
                      </span>
                      {r.client_phone && (
                        <a href={`tel:${r.client_phone}`} className="flex items-center gap-1 text-primary font-semibold">
                          <Phone size={12} /> {r.client_phone}
                        </a>
                      )}
                    </div>
                  </div>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${style.className}`}>
                    {style.label}
                  </span>
                </div>

                {r.status === 'pending' && (
                  <div className="flex gap-2 pt-1">
                    <button
                      disabled={updateStatus.isPending}
                      onClick={() => updateStatus.mutate({ id: r.id, status: 'confirmed' })}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white py-2 text-xs font-bold disabled:opacity-60"
                    >
                      <Check size={14} /> Accepter
                    </button>
                    <button
                      disabled={updateStatus.isPending}
                      onClick={() => updateStatus.mutate({ id: r.id, status: 'cancelled' })}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 text-white py-2 text-xs font-bold disabled:opacity-60"
                    >
                      <X size={14} /> Refuser
                    </button>
                  </div>
                )}
                {r.status === 'confirmed' && (
                  <button
                    disabled={updateStatus.isPending}
                    onClick={() => updateStatus.mutate({ id: r.id, status: 'cancelled' })}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-secondary py-2 text-xs font-semibold"
                  >
                    Annuler
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
