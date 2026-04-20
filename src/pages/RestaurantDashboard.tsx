import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Crown, Sparkles, Clock, ArrowRight, AlertTriangle, Check, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMyOwnerships } from '@/hooks/useOwnership';
import { PLANS, formatFCFA, trialDaysLeft, isAccessActive, type Plan } from '@/lib/subscription';
import UpgradeModal from '@/components/subscription/UpgradeModal';
import { Button } from '@/components/ui/button';

const planIcon = (p: Plan) => {
  if (p === 'ELITE') return <Crown size={16} className="text-amber-500" />;
  if (p === 'PREMIUM') return <Sparkles size={16} className="text-primary" />;
  return null;
};

const RestaurantDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { ownerships, loading, refresh } = useMyOwnerships();
  const [modal, setModal] = useState<{ id: string; current: Plan; initial?: Plan } | null>(null);

  if (!authLoading && !user) {
    navigate('/auth?redirect=/restaurant/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen pb-24 bg-background pt-14 px-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold">Mes restaurants</h1>
        <button
          onClick={() => navigate('/restaurant/onboarding')}
          className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
          aria-label="Ajouter"
        >
          <Plus size={18} />
        </button>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Chargement...</p>}

      {!loading && ownerships.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <p className="font-semibold mb-1">Aucun restaurant</p>
          <p className="text-sm text-muted-foreground mb-4">
            Inscrivez votre établissement et profitez de 30 jours d'essai gratuits.
          </p>
          <Button onClick={() => navigate('/restaurant/onboarding')}>
            Commencer
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {ownerships.map((o) => {
          const active = isAccessActive(o);
          const inTrial = o.status === 'trial' && active;
          const daysLeft = trialDaysLeft(o.trial_ends_at);
          const expired = !active;

          return (
            <div key={o.id} className="rounded-2xl bg-card border border-border overflow-hidden">
              <div className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  {planIcon(o.plan)}
                  <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    Plan {o.plan}
                  </span>
                </div>
                <p className="font-extrabold text-base mb-2">{o.restaurant_name}</p>

                {inTrial && (
                  <div className="flex items-center gap-2 rounded-lg bg-primary/10 text-primary px-3 py-2 text-xs font-semibold">
                    <Clock size={14} />
                    Essai gratuit — {daysLeft} jour{daysLeft > 1 ? 's' : ''} restant{daysLeft > 1 ? 's' : ''}
                  </div>
                )}
                {o.status === 'active' && (
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 text-emerald-600 px-3 py-2 text-xs font-semibold">
                    <Check size={14} /> Abonnement actif (mode test)
                  </div>
                )}
                {expired && (
                  <div className="flex items-center gap-2 rounded-lg bg-destructive/10 text-destructive px-3 py-2 text-xs font-semibold">
                    <AlertTriangle size={14} /> Essai expiré — accès en lecture seule
                  </div>
                )}
              </div>

              <div className="border-t border-border p-3 flex gap-2">
                <Button
                  size="sm"
                  variant={expired ? 'default' : 'secondary'}
                  className="flex-1"
                  onClick={() => setModal({ id: o.id, current: o.plan })}
                >
                  {o.status === 'active' ? 'Changer de plan' : 'Choisir un plan'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparatif */}
      <h2 className="text-lg font-bold mt-10 mb-3">Comparatif des offres</h2>
      <div className="space-y-3">
        {PLANS.map((p) => (
          <motion.div
            key={p.id}
            whileTap={{ scale: 0.99 }}
            className={`rounded-2xl p-4 border ${
              p.highlight ? 'border-primary bg-primary/5' : 'border-border bg-card'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-extrabold">{p.name}</span>
                {p.highlight && (
                  <span className="text-[10px] font-bold uppercase bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                    Populaire
                  </span>
                )}
              </div>
              <span className="text-sm font-extrabold">{formatFCFA(p.price)}<span className="text-[10px] text-muted-foreground font-normal">/mois</span></span>
            </div>
            <ul className="space-y-1">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-xs">
                  <Check size={12} className="text-primary mt-0.5 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            {ownerships[0] && (
              <button
                onClick={() => setModal({ id: ownerships[0].id, current: ownerships[0].plan, initial: p.id })}
                className="mt-3 text-xs font-semibold text-primary inline-flex items-center gap-1"
              >
                Choisir {p.name} <ArrowRight size={12} />
              </button>
            )}
          </motion.div>
        ))}
      </div>

      {modal && (
        <UpgradeModal
          open
          onOpenChange={(v) => !v && setModal(null)}
          ownershipId={modal.id}
          currentPlan={modal.current}
          initialPlan={modal.initial}
          onActivated={refresh}
        />
      )}
    </div>
  );
};

export default RestaurantDashboard;
