import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Clock, Plus, TriangleAlert } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMyOwnerships } from '@/hooks/useOwnership';
import { useDBRestaurants } from '@/hooks/useDBRestaurants';
import { formatFCFA, isAccessActive, PLANS, subscriptionDaysLeft, trialDaysLeft, type Plan } from '@/lib/subscription';
import UpgradeModal from '@/components/subscription/UpgradeModal';
import { Button } from '@/components/ui/button';
import OwnerDashboardContent from '@/components/restaurant/OwnerDashboardContent';

const RestaurantDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { ownerships, loading, refresh } = useMyOwnerships();
  const { list, refresh: refreshRestaurants } = useDBRestaurants({ adminMode: true });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const dashboardRef = useRef<HTMLElement>(null);
  const [modal, setModal] = useState<{ ownershipKey: string; current: Plan; initial?: Plan } | null>(null);

  const ownedRestaurants = useMemo(
    () => ownerships.map((ownership) => ({ ownership, restaurant: list.find((item) => item.id === ownership.restaurant_id) })).filter((item) => item.restaurant),
    [list, ownerships]
  );

  const isMulti = ownedRestaurants.length > 1;
  const selected = ownedRestaurants.find((item) => item.ownership.restaurant_id === (selectedId ?? ownedRestaurants[0]?.ownership.restaurant_id)) ?? ownedRestaurants[0] ?? null;

  if (!authLoading && !user) {
    navigate('/auth?redirect=/dashboard');
    return null;
  }

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setTimeout(() => dashboardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const renderStatusBlock = (ownership: typeof ownedRestaurants[number]['ownership']) => {
    const active = isAccessActive(ownership);
    const inTrial = ownership.status === 'trial' && active;
    const daysLeft = trialDaysLeft(ownership.trial_ends_at);
    const subDays = subscriptionDaysLeft(ownership.subscription_ends_at);
    const trialEndingSoon = inTrial && daysLeft <= 7;
    const subEndingSoon = ownership.status === 'active' && subDays !== null && subDays <= 7;
    return (
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="font-semibold text-sm">
            {ownership.status === 'active' ? 'Abonnement actif' : inTrial ? 'Essai gratuit' : 'Accès expiré'}
          </p>
          <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-full ${active ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
            {active ? 'Actif' : 'Lecture seule'}
          </span>
        </div>
        {inTrial && !trialEndingSoon && (
          <p className="flex items-center gap-2 text-xs font-semibold text-primary"><Clock size={12} /> Essai gratuit · {daysLeft} jour(s) restant(s)</p>
        )}
        {ownership.status === 'active' && !subEndingSoon && (
          <p className="flex items-center gap-2 text-xs font-semibold text-primary"><Check size={12} /> Abonnement actif{subDays !== null ? ` · ${subDays} jour(s)` : ''}</p>
        )}
        {trialEndingSoon && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-2 space-y-2">
            <p className="flex items-center gap-2 text-xs font-bold text-destructive"><TriangleAlert size={12} /> Votre essai gratuit se termine dans {daysLeft} jour(s)</p>
            <button onClick={() => setModal({ ownershipKey: ownership.restaurant_id, current: ownership.plan, initial: 'PRO' })} className="w-full rounded-md bg-destructive text-destructive-foreground px-3 py-1.5 text-[11px] font-bold">S'abonner</button>
          </div>
        )}
        {subEndingSoon && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-2 space-y-2">
            <p className="flex items-center gap-2 text-xs font-bold text-destructive"><TriangleAlert size={12} /> Votre abonnement expire dans {subDays} jour(s)</p>
            <button onClick={() => setModal({ ownershipKey: ownership.restaurant_id, current: ownership.plan, initial: ownership.plan })} className="w-full rounded-md bg-destructive text-destructive-foreground px-3 py-1.5 text-[11px] font-bold">Renouveler</button>
          </div>
        )}
        {!active && <p className="flex items-center gap-2 text-xs font-semibold text-destructive"><TriangleAlert size={12} /> Essai expiré</p>}
        {ownership.status !== 'active' && PLANS[0] && (
          <button onClick={() => setModal({ ownershipKey: ownership.restaurant_id, current: ownership.plan, initial: 'PRO' })} className="w-full rounded-xl bg-secondary p-3 text-left">
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold text-sm">{PLANS[0].name}</span>
              <span className="text-xs font-bold">{formatFCFA(PLANS[0].price)}/mois</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{PLANS[0].features[0]}</p>
          </button>
        )}
      </div>
    );
  };

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

      {ownedRestaurants.length === 1 && selected?.restaurant && (
        <div className="space-y-5">
          {renderStatusBlock(selected.ownership)}
          <main ref={dashboardRef}>
            <OwnerDashboardContent restaurant={selected.restaurant} onRefresh={async () => { await refresh(); await refreshRestaurants(); }} />
          </main>
        </div>
      )}

      {isMulti && (
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-[320px_1fr] min-w-0">
          <aside className="space-y-4 min-w-0">
            <h2 className="font-bold text-sm uppercase tracking-wide text-muted-foreground">Mes restaurants</h2>
            {ownedRestaurants.map(({ ownership, restaurant }) => {
              if (!restaurant) return null;
              const active = isAccessActive(ownership);
              const isSelected = selected?.ownership.restaurant_id === ownership.restaurant_id;
              return (
                <button key={ownership.restaurant_id} onClick={() => handleSelect(ownership.restaurant_id)} className={`w-full rounded-2xl border p-4 text-left min-w-0 ${isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
                  <div className="flex items-center justify-between gap-3 min-w-0">
                    <p className="font-bold text-sm truncate flex-1">{restaurant.name}</p>
                    <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-full ${active ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
                      {active ? 'Actif' : 'Expiré'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-1">{restaurant.quartier || restaurant.city}</p>
                </button>
              );
            })}
            {selected && renderStatusBlock(selected.ownership)}
          </aside>
          <main ref={dashboardRef}>
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
