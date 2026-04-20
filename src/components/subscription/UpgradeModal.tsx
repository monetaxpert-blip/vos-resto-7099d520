import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Info, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PLANS, formatFCFA, type Plan } from '@/lib/subscription';
import PaymentMethodsRow from './PaymentMethodsRow';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  ownershipId: string;
  currentPlan: Plan;
  initialPlan?: Plan;
  onActivated?: () => void;
}

const UpgradeModal = ({
  open,
  onOpenChange,
  ownershipId,
  currentPlan,
  initialPlan,
  onActivated,
}: Props) => {
  const { user } = useAuth();
  const [selected, setSelected] = useState<Plan>(initialPlan ?? currentPlan);
  const [loading, setLoading] = useState(false);

  const plan = PLANS.find((p) => p.id === selected)!;

  const handleActivateTest = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase
      .from('restaurant_owners')
      .update({
        plan: selected,
        status: 'active',
        subscription_started_at: new Date().toISOString(),
        subscription_mode: 'test',
        payment_enabled: false,
      })
      .eq('id', ownershipId);
    setLoading(false);
    if (error) {
      toast.error("Impossible d'activer l'abonnement");
      return;
    }
    toast.success(`Plan ${selected} activé (mode test)`);
    onActivated?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Choisir un plan</DialogTitle>
          <DialogDescription>
            Sélectionnez un abonnement pour votre restaurant.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          {PLANS.map((p) => {
            const isSelected = selected === p.id;
            const isCurrent = currentPlan === p.id;
            return (
              <motion.button
                key={p.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelected(p.id)}
                className={`w-full text-left rounded-2xl p-4 border-2 transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-base">{p.name}</span>
                      {p.highlight && (
                        <span className="text-[10px] font-bold uppercase bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                          Populaire
                        </span>
                      )}
                      {isCurrent && (
                        <span className="text-[10px] font-bold uppercase bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                          Actuel
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{p.tagline}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold">{formatFCFA(p.price)}</p>
                    <p className="text-[10px] text-muted-foreground">/mois</p>
                  </div>
                </div>
                {isSelected && (
                  <ul className="mt-3 space-y-1.5">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs">
                        <Check size={14} className="text-primary mt-0.5 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </motion.button>
            );
          })}
        </div>

        <div className="mt-4 rounded-xl bg-muted/50 p-3">
          <p className="text-[11px] font-semibold text-muted-foreground mb-1 text-center">
            Moyens de paiement disponibles
          </p>
          <PaymentMethodsRow />
        </div>

        <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-3 flex gap-2">
          <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-900 dark:text-amber-200">
            Les paiements ne sont pas encore activés. Cette fonctionnalité sera
            bientôt disponible. En attendant, vous pouvez activer votre plan en
            mode test.
          </p>
        </div>

        <div className="flex flex-col gap-2 mt-2">
          <Button
            onClick={handleActivateTest}
            disabled={loading}
            className="w-full font-bold"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Activer {plan.name} — {formatFCFA(plan.price)} (mode test)
          </Button>
          <button
            onClick={() => onOpenChange(false)}
            className="text-xs text-muted-foreground hover:text-foreground py-2"
          >
            Annuler
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeModal;
