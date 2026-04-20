export type Plan = 'PRO' | 'PREMIUM' | 'ELITE';
export type SubStatus = 'trial' | 'active' | 'expired' | 'cancelled';

export const PLAN_RANK: Record<Plan, number> = { PRO: 1, PREMIUM: 2, ELITE: 3 };

export interface PlanInfo {
  id: Plan;
  name: string;
  price: number; // FCFA / mois
  tagline: string;
  features: string[];
  highlight?: boolean;
  color: string; // tailwind gradient classes
}

export const PLANS: PlanInfo[] = [
  {
    id: 'PRO',
    name: 'PRO',
    price: 10000,
    tagline: 'Pour démarrer',
    color: 'from-slate-500 to-slate-700',
    features: [
      'Gestion du profil restaurant',
      'Ajout menu et photos',
      'Gestion des réservations',
      'Visibilité standard',
    ],
  },
  {
    id: 'PREMIUM',
    name: 'PREMIUM',
    price: 15000,
    tagline: 'Le plus populaire',
    color: 'from-primary to-orange-600',
    highlight: true,
    features: [
      'Tout du plan PRO',
      'Mise en avant dans les résultats',
      'Statistiques (vues, réservations)',
      'Notifications clients basiques',
    ],
  },
  {
    id: 'ELITE',
    name: 'ELITE',
    price: 20000,
    tagline: 'Visibilité maximale',
    color: 'from-amber-500 to-yellow-600',
    features: [
      'Tout du plan PREMIUM',
      'Mise en avant prioritaire (homepage)',
      'Push notifications marketing',
      'Badge restaurant recommandé',
      'Analytics avancés',
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

export function isAccessActive(o: Pick<OwnershipRow, 'status' | 'trial_ends_at'>): boolean {
  if (o.status === 'active') return true;
  if (o.status === 'trial') return new Date(o.trial_ends_at).getTime() > Date.now();
  return false;
}
