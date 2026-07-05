import { useState, type ReactNode } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Loader2, Lock, LogOut, UserCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMyOwnerships } from '@/hooks/useOwnership';
import { isAccessActive } from '@/lib/subscription';
import UpgradeModal from '@/components/subscription/UpgradeModal';
import { Button } from '@/components/ui/button';

const SubscriptionRequiredScreen = () => {
  const { ownerships, refresh } = useMyOwnerships();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [modalOwnershipId, setModalOwnershipId] = useState<string | null>(null);

  const blocked = ownerships.filter((o) => !isAccessActive(o));
  const primary = blocked[0] ?? ownerships[0];

  return (
    <div className="min-h-screen bg-muted/30 pt-14 flex items-center justify-center px-5">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-14 h-14 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
            <Lock size={22} />
          </div>
          <h1 className="text-lg font-bold">Abonnement requis</h1>
          <p className="text-sm text-muted-foreground">
            Votre période d'essai est terminée. Souscrivez à un abonnement pour
            réactiver l'accès à votre tableau de bord et rendre votre restaurant
            à nouveau visible sur VosResto.
          </p>
        </div>

        {blocked.length > 0 && (
          <div className="rounded-xl bg-muted/50 p-3 space-y-1.5">
            {blocked.map((o) => (
              <div key={o.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="font-semibold truncate">{o.restaurant_name}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                  {o.status === 'trial' ? 'Essai expiré' : o.status}
                </span>
              </div>
            ))}
          </div>
        )}

        {primary && (
          <Button
            className="w-full"
            onClick={() => setModalOwnershipId(primary.id)}
          >
            S'abonner maintenant
          </Button>
        )}

        <div className="flex flex-col gap-2 pt-2 border-t border-border">
          <Button variant="outline" size="sm" onClick={() => navigate('/profile')}>
            <UserCircle2 size={14} /> Accéder à mon profil
          </Button>
          <Button variant="ghost" size="sm" onClick={async () => { await signOut(); navigate('/'); }}>
            <LogOut size={14} /> Se déconnecter
          </Button>
          <a
            href="mailto:support@vosresto.com"
            className="text-center text-xs text-muted-foreground hover:text-foreground"
          >
            Contacter le support
          </a>
        </div>
      </div>

      {modalOwnershipId && primary && (
        <UpgradeModal
          open
          onOpenChange={(v) => !v && setModalOwnershipId(null)}
          ownershipId={modalOwnershipId}
          currentPlan={primary.plan}
          initialPlan="PRO"
          onActivated={async () => { await refresh(); setModalOwnershipId(null); }}
        />
      )}
    </div>
  );
};

const OwnerGuard = ({ children }: { children: ReactNode }) => {
  const { user, loading, isRestaurantOwner, isAdmin } = useAuth();
  const { ownerships, loading: ownLoading } = useMyOwnerships();

  if (loading || (user && ownLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth?redirect=/dashboard" replace />;
  if (isAdmin) return <>{children}</>;
  if (!isRestaurantOwner) return <Navigate to="/restaurant/onboarding" replace />;

  // Block if no ownership grants active access
  const hasActiveAccess = ownerships.some((o) => isAccessActive(o));
  if (ownerships.length > 0 && !hasActiveAccess) {
    return <SubscriptionRequiredScreen />;
  }

  return <>{children}</>;
};

export default OwnerGuard;
