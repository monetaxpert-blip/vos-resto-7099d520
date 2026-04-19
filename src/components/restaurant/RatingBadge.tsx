import { forwardRef, memo } from 'react';
import { Star } from 'lucide-react';

interface RatingBadgeProps {
  rating: number | null;
  count?: number;
  size?: 'sm' | 'md';
}

const RatingBadge = memo(
  forwardRef<HTMLDivElement, RatingBadgeProps>(({ rating, count, size = 'sm' }, ref) => {
    if (!rating) return null;

    return (
      <div
        ref={ref}
        className={`inline-flex items-center gap-1 rounded-full bg-foreground/90 text-background font-semibold
        ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'}`}
      >
        <Star size={size === 'sm' ? 10 : 13} fill="currentColor" className="text-yellow-400" />
        <span>{rating.toFixed(1)}</span>
        {count !== undefined && count > 0 && (
          <span className="text-background/60 font-normal">
            ({count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count})
          </span>
        )}
      </div>
    );
  })
);

RatingBadge.displayName = 'RatingBadge';
export default RatingBadge;
