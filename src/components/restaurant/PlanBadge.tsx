import { Check } from 'lucide-react';
import type { Plan } from '@/lib/subscription';

interface Props {
  plan?: Plan;
  size?: 'sm' | 'md';
}

// Unified "Abonné" badge — shown only when a restaurant has an active paid subscription.
// Tier-based PRO/PREMIUM/ELITE chips were removed (single-plan pricing model).
const PlanBadge = ({ size = 'sm' }: Props) => {
  const cls =
    size === 'sm'
      ? 'text-[10px] px-2 py-0.5 gap-1'
      : 'text-xs px-2.5 py-1 gap-1.5';
  return (
    <span
      className={`inline-flex items-center rounded-full bg-primary text-primary-foreground font-semibold shadow-sm ${cls}`}
    >
      <Check size={size === 'sm' ? 10 : 12} />
      Abonné
    </span>
  );
};

export default PlanBadge;
