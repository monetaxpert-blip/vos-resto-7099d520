import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Clock, Plus, TriangleAlert } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMyOwnerships } from '@/hooks/useOwnership';
import { useDBRestaurants } from '@/hooks/useDBRestaurants';
import { formatFCFA, isAccessActive, PLANS, trialDaysLeft, type Plan } from '@/lib/subscription';
import UpgradeModal from '@/components/subscription/UpgradeModal';
import { Button } from '@/components/ui/button';
import OwnerDashboardContent from '@/components/restaurant/OwnerDashboardContent';

const RestaurantDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { ownerships, loading, refresh } = useMyOwnerships();
  const { list, refresh: refreshRestaurants } = useDBRestaurants({ adminMode: true });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modal, setModal] = useState<{ ownershipKey: string; current: Plan; initial?: Plan } | null>(null);

  const ownedRestaurants = useMemo(
    () => ownerships.map((ownership) => ({ ownership, restaurant: list.find((item) => item.id === ownership.restaurant_id) })).filter((item) => item.restaurant),
    [list, ownerships]
  );

  const selected = ownedRestaurants.find((item) => item.ownership.restaurant_id === (selectedId ?? ownedRestaurants[0]?.ownership.restaurant_id)) ?? ownedRestaurants[0] ?? null;

  if (!authLoading && !user) {
    navigate('/auth?redirect=/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen pb-24 bg-background pt-14 px-5 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold">Dashboard restaurant</h1>
          <p className="text-sm text-muted-foreground">Gérez votre fiche, vos menus, vos photos et vos performances.</p>
        </div>
        <button onClick={() => navigate('/restaurant/onboarding')} className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center" aria-label="Ajouter">
          <Plus size={18} />
        </button>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Chargement...</p>}

      {!loading && ownerships.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <p className="font-semibold mb-1">Aucun restaurant lié</p>
          <p className="text-sm text-muted-foreground mb-4">Réclamez un restaurant ou créez votre établissement.</p>
          <Button onClick={() => navigate('/restaurant/onboarding')}>Commencer</Button>
        </div>
      )}

      {ownedRestaurants.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-4">
            {ownedRestaurants.map(({ ownership, restaurant }) => {
              if (!restaurant) return null;
              const active = isAccessActive(ownership);
              const inTrial = ownership.status === 'trial' && active;
              const isSelected = selected?.ownership.restaurant_id === ownership.restaurant_id;
              const daysLeft = trialDaysLeft(ownership.trial_ends_at);
              return (
                <button key={ownership.restaurant_id} onClick={() => setSelectedId(ownership.restaurant_id)} className={`w-full rounded-2xl border p-4 text-left ${isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-sm">{restaurant.name}</p>
                      <p className="text-xs text-muted-foreground">Plan {ownership.plan}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${active ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
                      {active ? 'Actif' : 'Lecture seule'}
                    </span>
                  </div>
                  {inTrial && <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-primary"><Clock size={12} /> Essai gratuit · {daysLeft} jours restants</p>}
                  {ownership.status === 'active' && <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-primary"><Check size={12} /> Abonnement actif en mode test</p>}
                  {!active && <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-destructive"><TriangleAlert size={12} /> Essai expiré</p>}
                  <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{restaurant.adminPlan}</span>
                    <span className="inline-flex items-center gap-1 text-primary font-semibold">Configurer <ArrowRight size={12} /></span>
                  </div>
                </button>
              );
            })}

            <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
              <h2 className="font-bold">Plans disponibles</h2>
              {PLANS.map((plan) => (
                <button key={plan.id} onClick={() => selected && setModal({ ownershipKey: selected.ownership.restaurant_id, current: selected.ownership.plan, initial: plan.id })} className="w-full text-left rounded-xl bg-secondary p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-sm">{plan.name}</span>
                    <span className="text-xs font-bold">{formatFCFA(plan.price)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{plan.features[0]}</p>
                </button>
              ))}
            </div>
          </aside>

          <main>
            {selected?.restaurant && <OwnerDashboardContent restaurant={selected.restaurant} onRefresh={async () => { await refresh(); await refreshRestaurants(); }} />}
          </main>
        </div>
      )}

      {modal && selected && (
        <UpgradeModal
          open
          onOpenChange={(value) => !value && setModal(null)}
          ownershipId={selected.ownership.id}
          currentPlan={modal.current}
          initialPlan={modal.initial}
          onActivated={async () => { await refresh(); await refreshRestaurants(); }}
        />
      )}
    </div>
  );
};

export default RestaurantDashboard;
