import { Skeleton } from '@/components/ui/skeleton';

export const RestaurantCardSkeleton = () => (
  <div className="rounded-2xl overflow-hidden bg-card shadow-card">
    <Skeleton className="aspect-video w-full rounded-none" />
    <div className="p-4 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  </div>
);

export const FeaturedCardSkeleton = () => (
  <div className="w-72 flex-shrink-0 rounded-2xl overflow-hidden">
    <Skeleton className="aspect-[4/5] w-full" />
  </div>
);
