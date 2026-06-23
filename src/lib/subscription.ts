export type Plan = 'PRO';
export type SubStatus = 'trial' | 'active' | 'expired' | 'cancelled';

export const PLAN_RANK: Record<Plan, number> = { PRO: 1 };

export interface PlanInfo {
  id: Plan;
  name: string;
  price: number; // FCFA / mois
  tagline: string;
  features: string[];
  highlight?: boolean;
  color: string;
}

export const PLANS: PlanInfo[] = [
  {
    id: 'PRO',
    name: 'Abonnement',
    price: 10000,
    tagline: 'Tout inclus pour votre restaurant',
    color: 'from-primary to-orange-600',
    highlight: true,
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
