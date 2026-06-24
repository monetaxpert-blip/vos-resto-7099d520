import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, Calendar, UtensilsCrossed, Image as ImageIcon,
  Tag, BarChart3, Settings, Bell, Plus, TriangleAlert, Clock, Check,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMyOwnerships } from '@/hooks/useOwnership';
import { useDBRestaurants } from '@/hooks/useDBRestaurants';
import { useOwnerOrders } from '@/hooks/useOrders';
import { useOwnerReservations } from '@/hooks/useOwnerReservations';
import { formatFCFA, isAccessActive, PLANS, subscriptionDaysLeft, trialDaysLeft, type Plan } from '@/lib/subscription';
import UpgradeModal from '@/components/subscription/UpgradeModal';
import { Button } from '@/components/ui/button';
import OwnerDashboardContent from '@/components/restaurant/OwnerDashboardContent';

const NAV_ITEMS = [
  { id: 'overview', label: "Vue d'ensemble", title: "Vue d'ensemble", icon: LayoutDashboard },
  { id: 'orders', label: 'Commandes', title: 'Commandes', icon: ShoppingBag },
  { id: 'reservations', label: 'Réservations', title: 'Réservations', icon: Calendar },
  { id: 'menu', label: 'Menu', title: 'Gestion du menu', icon: UtensilsCrossed },
  { id: 'photos', label: 'Photos', title: 'Galerie photos', icon: ImageIcon },
  { id: 'offers', label: 'Offres', title: 'Offres & promotions', icon: Tag },
  { id: 'stats', label: 'Statistiques', title: 'Statistiques', icon: BarChart3 },
  { id: 'profile', label: 'Profil & infos', title: 'Profil & infos', icon: Settings },
] as const;

const MOBILE_NAV = ['overview', 'orders', 'reservations', 'menu', 'profile'] as const;

const RestaurantDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { ownerships, loading, refresh } = useMyOwnerships();
  const { list, refresh: refreshRestaurants } = useDBRestaurants({ adminMode: true });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [modal, setModal] = useState<{ ownershipKey: string; current: Plan; initial?: Plan } | null>(null);

  const ownedRestaurants = useMemo(
    () => ownerships.map((o) => ({ ownership: o, restaurant: list.find((r) => r.id === o.restaurant_id) })).filter((i) => i.restaurant),
    [list, ownerships]
  );

  const selected =
    ownedRestaurants.find((i) => i.ownership.restaurant_id === (selectedId ?? ownedRestaurants[0]?.ownership.restaurant_id)) ??
    ownedRestaurants[0] ?? null;

  const restaurantId = selected?.restaurant?.id;
  const { data: orders = [] } = useOwnerOrders(restaurantId);
  const { reservations } = useOwnerReservations(restaurantId);

  const pendingOrders = orders.filter((o) => o.status === 'pending').length;
  const pendingReservations = reservations.filter((r) => r.status === 'pending').length;

  if (!authLoading && !user) {
    navigate('/auth?redirect=/dashboard');
    return null;
  }

  const greetingName = (user?.user_metadata?.display_name as string | undefined) || user?.email?.split('@')[0] || '';
  const userInitials = greetingName ? greetingName.slice(0, 2).toUpperCase() : 'U';
  const currentNav = NAV_ITEMS.find((n) => n.id === activeTab) ?? NAV_ITEMS[0];

  const badgeFor = (id: string): number => {
    if (id === 'orders') return pendingOrders;
    if (id === 'reservations') return pendingReservations;
    return 0;
  };

  const renderStatusBlock = () => {
    if (!selected) return null;
    const ownership = selected.ownership;
    const active = isAccessActive(ownership);
    const inTrial = ownership.status === 'trial' && active;
    const daysLeft = trialDaysLeft(ownership.trial_ends_at);
    const subDays = subscriptionDaysLeft(ownership.subscription_ends_at);
    const trialEndingSoon = inTrial && daysLeft <= 7;
    const subEndingSoon = ownership.status === 'active' && subDays !== null && subDays <= 7;
    return (
      <div className="rounded-2xl border border-border/60 bg-card p-4 space-y-2 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {ownership.status === 'active' ? 'Abonnement' : inTrial ? 'Essai' : 'Accès'}
          </p>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
            {active ? ownership.plan : 'Expiré'}
          </span>
        </div>
        {inTrial && (
          <p className="flex items-center gap-1.5 text-xs font-semibold text-primary"><Clock size={11} /> {daysLeft} j d'essai</p>
        )}
        {ownership.status === 'active' && subDays !== null && (
          <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700"><Check size={11} /> {subDays} j restants</p>
        )}
        {trialEndingSoon && (
          <button onClick={() => setModal({ ownershipKey: ownership.restaurant_id, current: ownership.plan, initial: 'PRO' })} className="w-full rounded-lg bg-destructive text-destructive-foreground px-3 py-1.5 text-[11px] font-bold flex items-center justify-center gap-1">
            <TriangleAlert size={11} /> S'abonner
          </button>
        )}
        {subEndingSoon && (
          <button onClick={() => setModal({ ownershipKey: ownership.restaurant_id, current: ownership.plan, initial: ownership.plan })} className="w-full rounded-lg bg-destructive text-destructive-foreground px-3 py-1.5 text-[11px] font-bold flex items-center justify-center gap-1">
            <TriangleAlert size={11} /> Renouveler
          </button>
        )}
        {!active && ownership.status !== 'active' && PLANS[0] && (
          <button onClick={() => setModal({ ownershipKey: ownership.restaurant_id, current: ownership.plan, initial: 'PRO' })} className="w-full rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-[11px] font-bold">
            {PLANS[0].name} · {formatFCFA(PLANS[0].price)}/mois
          </button>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <p className="text-sm text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (ownerships.length === 0) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center px-5">
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center max-w-md">
          <p className="font-semibold mb-1">Aucun restaurant lié</p>
          <p className="text-sm text-muted-foreground mb-4">Réclamez un restaurant ou créez votre établissement.</p>
          <Button onClick={() => navigate('/restaurant/onboarding')}>Commencer</Button>
        </div>
      </div>
    );
  }

  const heroUrl = selected?.restaurant?.heroPhotoUrl ?? selected?.restaurant?.profileImage;
  const restoInitials = (selected?.restaurant?.name ?? '?').slice(0, 2).toUpperCase();
  const restoActive = selected ? isAccessActive(selected.ownership) : false;
  const statusPill = !selected ? null
    : restoActive
      ? selected.ownership.status === 'trial'
        ? { label: 'Essai', cls: 'bg-amber-100 text-amber-700' }
        : { label: 'Actif', cls: 'bg-emerald-100 text-emerald-700' }
      : { label: 'Expiré', cls: 'bg-red-100 text-red-700' };

  return (
    <div className="min-h-screen bg-muted/30 pt-14 md:pt-14">
      <div className="flex">
        {/* Sidebar — desktop */}
        <aside className="hidden md:flex flex-col w-[220px] shrink-0 border-r border-border bg-card min-h-[calc(100vh-3.5rem)] sticky top-14 p-4 gap-4">
          {/* Identity */}
          {selected?.restaurant && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {heroUrl ? (
                  <img src={heroUrl} alt="" className="w-12 h-12 rounded-xl object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">{restoInitials}</div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm truncate">{selected.restaurant.name}</p>
                  {statusPill && (
                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${statusPill.cls}`}>{statusPill.label}</span>
                  )}
                </div>
              </div>
              {ownedRestaurants.length > 1 && (
                <div className="flex flex-wrap gap-1">
                  {ownedRestaurants.map(({ ownership, restaurant }) => restaurant && (
                    <button
                      key={ownership.restaurant_id}
                      onClick={() => setSelectedId(ownership.restaurant_id)}
                      className={`text-[10px] font-semibold px-2 py-1 rounded-full border ${
                        ownership.restaurant_id === selected?.ownership.restaurant_id
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-secondary text-foreground border-transparent hover:bg-secondary/70'
                      }`}
                    >
                      {restaurant.name.length > 10 ? restaurant.name.slice(0, 10) + '…' : restaurant.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Nav */}
          <nav className="flex-1 flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              const badge = badgeFor(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
                    active ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  <Icon size={16} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {badge > 0 && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${active ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-orange-100 text-orange-700'}`}>{badge}</span>
                  )}
                </button>
              );
            })}
          </nav>

          {renderStatusBlock()}
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0 pb-24 md:pb-6">
          {/* Top bar */}
          <div className="px-4 md:px-8 py-5 flex items-center justify-between gap-3 border-b border-border/60 bg-card/40 backdrop-blur-sm">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Bonjour, {greetingName} 👋</p>
              <h1 className="text-xl md:text-2xl font-bold truncate">{currentNav.title}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/restaurant/onboarding')}
                className="hidden md:inline-flex"
              >
                <Plus size={14} /> Ajouter un restaurant
              </Button>
              <button onClick={() => navigate('/notifications')} aria-label="Notifications" className="w-9 h-9 rounded-full bg-secondary text-foreground flex items-center justify-center hover:bg-secondary/70">
                <Bell size={16} />
              </button>
              {user?.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url as string} alt="" className="w-9 h-9 rounded-full object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">{userInitials}</div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-4 md:p-8">
            {selected?.restaurant && (
              <OwnerDashboardContent
                restaurant={selected.restaurant}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onRefresh={async () => { await refresh(); await refreshRestaurants(); }}
              />
            )}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card border-t border-border flex items-center justify-around px-2 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        {MOBILE_NAV.map((id) => {
          const item = NAV_ITEMS.find((n) => n.id === id)!;
          const Icon = item.icon;
          const active = activeTab === id;
          const badge = badgeFor(id);
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg ${active ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <Icon size={20} />
              <span className="text-[10px] font-semibold">{item.label.split(' ')[0]}</span>
              {badge > 0 && (
                <span className="absolute -top-0.5 right-1 text-[9px] font-bold bg-orange-500 text-white rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">{badge}</span>
              )}
            </button>
          );
        })}
      </nav>

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
