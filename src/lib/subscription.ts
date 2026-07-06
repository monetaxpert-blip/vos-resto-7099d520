export type Plan = 'PRO' | 'ELITE';
export type SubStatus = 'trial' | 'active' | 'expired' | 'cancelled';

export const PLAN_RANK: Record<Plan, number> = { PRO: 1, ELITE: 2 };

export interface PlanInfo {
  id: Plan;
  name: string;
  price: number; // FCFA / mois
  tagline: string;
  features: string[];
  highlight?: boolean;
  color: string;
  wavePaymentUrl?: string;
}

export const PLANS: PlanInfo[] = [
  {
    id: 'PRO',
    name: 'Abonnement PRO',
    price: 10000,
    tagline: 'Tout inclus pour votre restaurant',
    color: 'from-primary to-orange-600',
    highlight: true,
    wavePaymentUrl: 'https://pay.wave.com/m/M_sn_UlFXA0KznC31/c/sn/?amount=10000',
    features: [
      'Fiche restaurant complète',
      'Réservations en ligne',
      'Commandes en ligne',
      'Statistiques de visite',
      'Offres et promotions',
      'Géolocalisation',
      'Tableau de bord restaurateur',
    ],
  },
  {
    id: 'ELITE',
    name: 'Abonnement ELITE',
    price: 25000,
    tagline: 'Visibilité maximale et support dédié',
    color: 'from-amber-500 to-yellow-600',
    wavePaymentUrl: 'https://pay.wave.com/m/M_sn_UlFXA0KznC31/c/sn/?amount=25000',
    features: [
      'Tout ce qui est inclus dans PRO',
      'Mise en avant prioritaire (top listing)',
      'Badge ELITE sur la fiche',
      'Support prioritaire dédié',
      'Statistiques avancées',
      'Campagnes marketing incluses',
    ],
  },
];

export function formatFCFA(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
}

export interface OwnershipRow {
  id: string;
  user_id: string;
  restaurant_id: string;
  restaurant_name: string;
  is_owned_listing: boolean;
  plan: Plan;
  status: SubStatus;
  trial_ends_at: string;
  subscription_started_at: string | null;
  subscription_ends_at: string | null;
  subscription_mode: string;
  payment_enabled: boolean;
}

export function trialDaysLeft(trialEndsAt: string): number {
  const ms = new Date(trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export function subscriptionDaysLeft(subscriptionEndsAt: string | null): number | null {
  if (!subscriptionEndsAt) return null;
  const ms = new Date(subscriptionEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export function isAccessActive(o: Pick<OwnershipRow, 'status' | 'trial_ends_at'>): boolean {
  if (o.status === 'active') return true;
  if (o.status === 'trial') return new Date(o.trial_ends_at).getTime() > Date.now();
  return false;
}
