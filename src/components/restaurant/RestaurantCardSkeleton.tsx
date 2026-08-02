const RestaurantCardSkeleton = ({ dim = false }: { dim?: boolean }) => (
  <div
    className={`overflow-hidden rounded-[2rem] border border-border bg-card ${dim ? 'opacity-40' : 'opacity-80'}`}
    aria-hidden="true"
  >
    <div className="shimmer aspect-video bg-muted" />
    <div className="space-y-3 p-5">
      <div className="shimmer h-6 w-2/3 rounded-lg bg-muted" />
      <div className="shimmer h-4 w-1/2 rounded-lg bg-muted" />
      <div className="shimmer h-4 w-3/4 rounded-lg bg-muted" />
    </div>
  </div>
);

export default RestaurantCardSkeleton;
