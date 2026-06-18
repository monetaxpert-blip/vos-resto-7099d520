import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMyOrders, type OrderStatus } from '@/hooks/useOrders';
import QueryState from '@/components/ui/QueryState';
import { Button } from '@/components/ui/button';

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  preparing: 'En préparation',
  ready: 'Prête',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-blue-100 text-blue-800',
  preparing: 'bg-indigo-100 text-indigo-800',
  ready: 'bg-emerald-100 text-emerald-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-rose-100 text-rose-800',
};

const MyOrders = () => {
  const navigate = useNavigate();
  const { user, isReady } = useAuth();
  const { data: orders, isLoading, error, refetch } = useMyOrders(user?.id);

  if (isReady && !user) {
    navigate('/auth?redirect=/orders');
    return null;
  }

  const isEmpty = !isLoading && !error && (!orders || orders.length === 0);

  return (
    <div className="min-h-screen pb-24 bg-background pt-14 px-5 max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
        <ArrowLeft size={16} /> Retour
      </button>
      <h1 className="text-2xl font-extrabold mb-4">Mes commandes</h1>

      <QueryState
        loading={isLoading}
        error={error as Error | null}
        isEmpty={isEmpty}
        onRetry={() => refetch()}
        emptyTitle="Aucune commande"
        emptyMessage="Vos commandes apparaîtront ici."
      >
        <ul className="space-y-3">
          {(orders ?? []).map((o) => (
            <li key={o.id} className="rounded-xl border bg-card p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="font-bold">{o.restaurant_name}</p>
                  <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString('fr-FR')}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLOR[o.status]}`}>
                  {STATUS_LABEL[o.status]}
                </span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-0.5 mb-2">
                {o.items.map((it) => (
                  <li key={it.id}>{it.quantity}× {it.name}</li>
                ))}
              </ul>
              <div className="flex justify-between items-center text-sm font-semibold">
                <span>Total</span>
                <span>{o.total_amount.toLocaleString('fr-FR')} {o.currency}</span>
              </div>
            </li>
          ))}
        </ul>
      </QueryState>

      {isEmpty && (
        <div className="text-center mt-4">
          <Button onClick={() => navigate('/search')}>Découvrir des restaurants</Button>
        </div>
      )}
    </div>
  );
};

export default MyOrders;
