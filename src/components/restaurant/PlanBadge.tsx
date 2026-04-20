import { Crown, Sparkles } from 'lucide-react';
import type { Plan } from '@/lib/subscription';

interface Props {
  plan: Plan;
  size?: 'sm' | 'md';
}

const PlanBadge = ({ plan, size = 'sm' }: Props) => {
  if (plan === 'PRO') return null;
  const isElite = plan === 'ELITE';
  const cls =
    size === 'sm'
      ? 'text-[10px] px-2 py-0.5 gap-1'
      : 'text-xs px-2.5 py-1 gap-1.5';

  if (isElite) {
    return (
      <span
        className={`inline-flex items-center rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-bold shadow-md ${cls}`}
      >
        <Crown size={size === 'sm' ? 10 : 12} />
        Recommandé
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center rounded-full bg-gradient-to-r from-primary to-orange-600 text-white font-bold shadow-md ${cls}`}
    >
      <Sparkles size={size === 'sm' ? 10 : 12} />
      Premium
    </span>
  );
};

export default PlanBadge;
