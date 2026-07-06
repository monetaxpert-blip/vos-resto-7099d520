import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Info, Loader2, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PLANS, formatFCFA, type Plan } from '@/lib/subscription';
import PaymentMethodsRow from './PaymentMethodsRow';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import waveLogo from '@/assets/wave-logo.png.asset.json';

const WAVE_PAYMENT_URL = 'https://pay.wave.com/m/M_sn_UlFXA0KznC31/c/sn/?amount=10000';

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
  const [waveRef, setWaveRef] = useState('');
  const [confirming, setConfirming] = useState(false);

  const plan = PLANS.find((p) => p.id === selected);
  const activePlanInfo = PLANS.find((p) => p.id === (initialPlan ?? currentPlan));
  const wavePaymentUrl = plan?.wavePaymentUrl ?? WAVE_PAYMENT_URL;
  const displayPrice = plan?.price ?? 10000;

  if (!plan) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Plan non reconnu</DialogTitle>
            <DialogDescription>
              Le plan « {String(selected)} » n'est pas reconnu par l'application. Contactez le support pour finaliser votre renouvellement.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => onOpenChange(false)} className="w-full">Fermer</Button>
        </DialogContent>
      </Dialog>
    );
  }


  const handleActivateTest = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.rpc('activate_subscription_test', {
      p_ownership_id: ownershipId,
      p_plan: selected,
    });
    setLoading(false);
    const result = data as { success?: boolean; error?: string } | null;
    if (error || !result?.success) {
      toast.error(result?.error || "Impossible d'activer l'abonnement");
      return;
    }
    toast.success(`Plan ${selected} activé (mode test)`);
    onActivated?.();
    onOpenChange(false);
  };

  const handleConfirmWave = async () => {
    if (!user) return;
    const ref = waveRef.trim();
    if (!ref) {
      toast.error('Saisissez la référence Wave');
      return;
    }
    setConfirming(true);
    const { data: owner } = await supabase
      .from('restaurant_owners')
      .select('restaurant_id')
      .eq('id', ownershipId)
      .maybeSingle();
    if (!owner?.restaurant_id) {
      setConfirming(false);
      toast.error('Restaurant introuvable');
      return;
    }
    const { error } = await (supabase as any).from('subscriptions').insert({
      user_id: user.id,
      restaurant_id: owner.restaurant_id,
      plan: 'pro',
      price: 10000,
      status: 'pending',
      payment_method: 'wave',
      wave_reference: ref,
    });
    setConfirming(false);
    if (error) {
      toast.error("Impossible d'enregistrer la demande");
      return;
    }
    // Set restaurant to pending if not already active
    await supabase.from('restaurants')
      .update({ status: 'pending' } as any)
      .eq('id', owner.restaurant_id)
      .neq('status', 'active');
    toast.success('Demande envoyée, en attente de validation.');
    setWaveRef('');
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

        {/* Wave payment card */}
        <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-sky-50 to-white dark:from-sky-950/30 dark:to-transparent p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="font-extrabold text-sm">Passer au plan PRO</p>
              <p className="text-[11px] text-muted-foreground">10 000 FCFA/mois</p>
            </div>
            <img src={waveLogo.url} alt="Wave" className="h-8 w-auto" />
          </div>
          <ul className="space-y-1">
            {(PLANS.find(p => p.id === 'PRO')?.features ?? ['Visibilité illimitée', 'Support prioritaire', 'Stats avancées']).map((f) => (
              <li key={f} className="flex items-start gap-2 text-xs">
                <Check size={13} className="text-primary mt-0.5 shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <a
            href={WAVE_PAYMENT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-lg bg-[#00D3FF] hover:bg-[#00b8e0] text-black font-bold text-sm transition-colors"
          >
            <img src={waveLogo.url} alt="" className="h-5 w-auto" />
            Payer avec Wave
            <ExternalLink size={14} />
          </a>

          <div className="space-y-1.5 pt-1">
            <Label htmlFor="wave-ref" className="text-xs font-semibold">Référence de transaction Wave</Label>
            <Input
              id="wave-ref"
              value={waveRef}
              onChange={(e) => setWaveRef(e.target.value)}
              placeholder="Ex: TXN-XXXXXXXXXX (reçue par SMS après paiement)"
              className="h-9 text-sm"
            />
            <p className="text-[10px] text-muted-foreground">
              Vous trouverez cette référence dans le SMS de confirmation envoyé par Wave après votre paiement.
            </p>
            <Button
              onClick={handleConfirmWave}
              disabled={confirming || !waveRef.trim()}
              className="w-full font-bold mt-1"
            >
              {confirming && <Loader2 size={16} className="animate-spin" />}
              Confirmer le paiement
            </Button>
          </div>
        </div>

        <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-3 flex gap-2">
          <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-900 dark:text-amber-200">
            Vous pouvez aussi activer votre plan en mode test en attendant la validation.
          </p>
        </div>

        <div className="flex flex-col gap-2 mt-2">
          <Button
            onClick={handleActivateTest}
            disabled={loading}
            variant="outline"
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
