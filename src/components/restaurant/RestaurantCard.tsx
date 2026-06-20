import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MapPin, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Restaurant } from '@/data/types';
import RatingBadge from './RatingBadge';
import TiltCard from '@/components/animations/TiltCard';
import { getRestaurantImage } from '@/lib/photos';
import { useFavorites } from '@/hooks/useFavorites';
import { usePublicPlans } from '@/hooks/useOwnership';
import { track } from '@/lib/analytics';
import PlanBadge from './PlanBadge';
import { getOpenStatus } from '@/lib/restaurant';
import { deriveAveragePrice, formatFCFA } from '@/lib/format';

interface RestaurantCardProps {
  restaurant: Restaurant;
  variant?: 'default' | 'compact' | 'featured';
  index?: number;
}

const badgeClass = 'inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground';

const RestaurantCard = ({ restaurant, variant = 'default' }: RestaurantCardProps) => {
  const navigate = useNavigate();
  const { isFavorite, toggle } = useFavorites();
  const plans = usePublicPlans();
  const plan = plans[restaurant.id];
  const fav = isFavorite(restaurant.id);
  const openStatus = getOpenStatus(restaurant.openingHours);

  const imageUrl = useMemo(
    () => restaurant.profileImage || getRestaurantImage(restaurant.id, restaurant.categories, { width: 600, height: 400 }, restaurant.name, restaurant.quartier),
    [restaurant.categories, restaurant.id, restaurant.name, restaurant.profileImage, restaurant.quartier]
  );

  const go = () => {
    track('restaurant_click', { restaurantId: restaurant.id });
    navigate(`/restaurant/${restaurant.id}`);
  };

  const favBtn = (
    <motion.button
      whileTap={{ scale: 0.85 }}
      onClick={(event) => {
        event.stopPropagation();
        toggle(restaurant.id);
      }}
      className="w-8 h-8 rounded-full bg-background/85 backdrop-blur-sm flex items-center justify-center"
      aria-label={fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
    >
      <Heart size={14} className={fav ? 'text-primary fill-primary' : 'text-foreground'} />
    </motion.button>
  );

  const adminBadges = restaurant.badges ?? [];

  if (variant === 'featured') {
    return (
      <TiltCard intensity={6}>
        <motion.div whileTap={{ scale: 0.97 }} onClick={go} className="relative w-72 flex-shrink-0 rounded-2xl overflow-hidden cursor-pointer shadow-card group">
          <div className="aspect-[4/5] relative">
            <img src={imageUrl} alt={restaurant.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute top-3 left-3"><RatingBadge rating={restaurant.rating} count={restaurant.ratingCount} /></div>
            <div className="absolute top-3 right-3">{favBtn}</div>
            <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {plan && <PlanBadge plan={plan} />}
                {adminBadges.slice(0, 2).map((badge) => <span key={badge} className="inline-flex items-center rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">{badge}</span>)}
              </div>
              <h3 className="text-white font-bold text-lg leading-tight">{restaurant.name}</h3>
              <div className="flex items-center gap-1 text-white/80 text-xs"><MapPin size={12} /><span>{restaurant.quartier || restaurant.city}</span></div>
              <p className="text-white/70 text-xs">{openStatus.label}</p>
            </div>
          </div>
        </motion.div>
      </TiltCard>
    );
  }

  if (variant === 'compact') {
    return (
      <motion.div whileTap={{ scale: 0.98 }} onClick={go} className="flex items-center gap-3 p-3 rounded-2xl bg-card hover:bg-secondary/50 cursor-pointer transition-colors">
        <img src={imageUrl} alt={restaurant.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" loading="lazy" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="font-semibold text-sm truncate">{restaurant.name}</h3>
            {plan && <PlanBadge plan={plan} />}
          </div>
          <div className="flex items-center gap-1 text-muted-foreground text-xs mt-0.5"><MapPin size={10} /><span>{restaurant.quartier || restaurant.city}</span></div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{restaurant.categories.slice(0, 2).join(' · ')}</p>
        </div>
        <RatingBadge rating={restaurant.rating} />
      </motion.div>
    );
  }

  return (
    <motion.div whileTap={{ scale: 0.98 }} onClick={go} className="rounded-2xl overflow-hidden bg-card shadow-card cursor-pointer group">
      <div className="aspect-video relative overflow-hidden">
        <img src={imageUrl} alt={restaurant.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
        <div className="absolute top-3 left-3"><RatingBadge rating={restaurant.rating} count={restaurant.ratingCount} /></div>
        <div className="absolute top-3 right-3">{favBtn}</div>
        <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
          {plan && <PlanBadge plan={plan} />}
          {adminBadges.slice(0, 2).map((badge) => <span key={badge} className={badgeClass}>{badge}</span>)}
        </div>
      </div>
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-base truncate">{restaurant.name}</h3>
            <div className="flex items-center gap-1 text-muted-foreground text-xs mt-1"><MapPin size={12} /><span>{restaurant.quartier || restaurant.city}</span></div>
          </div>
          {restaurant.isFeatured && <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary"><Star size={10} className="fill-current" /> Featured</span>}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>Budget moyen {formatFCFA(typeof restaurant.averagePrice === 'number' && restaurant.averagePrice > 0 ? restaurant.averagePrice : deriveAveragePrice(restaurant.priceLevel, restaurant.categories, restaurant.id))}</span>
          <span>{openStatus.label}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default RestaurantCard;
