import { memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import { Restaurant } from '@/data/types';
import RatingBadge from './RatingBadge';
import TiltCard from '@/components/animations/TiltCard';
import { deriveAveragePrice, formatFCFA } from '@/lib/format';

interface RestaurantCardProps {
  restaurant: Restaurant;
  variant?: 'default' | 'compact' | 'featured';
  index?: number;
}

const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1544148103-0773bf10d330?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1578474846511-04ba529f0b88?w=600&h=400&fit=crop',
];

function getImage(id: string) {
  return PLACEHOLDER_IMAGES[parseInt(id) % PLACEHOLDER_IMAGES.length];
}

const RestaurantCard = memo(({ restaurant, variant = 'default', index = 0 }: RestaurantCardProps) => {
  const navigate = useNavigate();
  const avgPrice = useMemo(
    () => deriveAveragePrice(restaurant.priceLevel, restaurant.categories, restaurant.id),
    [restaurant.priceLevel, restaurant.categories, restaurant.id]
  );

  if (variant === 'featured') {
    return (
      <TiltCard intensity={6}>
        <motion.div
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate(`/restaurant/${restaurant.id}`)}
          className="relative w-72 flex-shrink-0 rounded-2xl overflow-hidden cursor-pointer shadow-card group"
        >
          <div className="aspect-[4/5] relative">
            <img
              src={getImage(restaurant.id)}
              alt={restaurant.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute top-3 left-3">
              <RatingBadge rating={restaurant.rating} count={restaurant.ratingCount} />
            </div>
            {restaurant.priceLevel && (
              <div className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm rounded-full px-2 py-0.5 text-xs font-medium text-foreground">
                {restaurant.priceLevel}
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="text-white font-bold text-lg leading-tight mb-1">{restaurant.name}</h3>
              <div className="flex items-center gap-1 text-white/80 text-xs">
                <MapPin size={12} />
                <span>{restaurant.quartier || restaurant.city}</span>
              </div>
              {restaurant.categories.length > 0 && (
                <p className="text-white/60 text-xs mt-1 truncate">{restaurant.categories.slice(0, 2).join(' · ')}</p>
              )}
            </div>
          </div>
        </motion.div>
      </TiltCard>
    );
  }

  if (variant === 'compact') {
    return (
      <motion.div
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate(`/restaurant/${restaurant.id}`)}
        className="flex items-center gap-3 p-3 rounded-2xl bg-card hover:bg-secondary/50 cursor-pointer transition-colors"
      >
        <img
          src={getImage(restaurant.id)}
          alt={restaurant.name}
          className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
          loading="lazy"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate">{restaurant.name}</h3>
          <div className="flex items-center gap-1 text-muted-foreground text-xs mt-0.5">
            <MapPin size={10} />
            <span>{restaurant.quartier || restaurant.city}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{restaurant.categories.slice(0, 2).join(' · ')}</p>
        </div>
        <RatingBadge rating={restaurant.rating} />
      </motion.div>
    );
  }

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/restaurant/${restaurant.id}`)}
      className="rounded-2xl overflow-hidden bg-card shadow-card cursor-pointer group"
    >
      <div className="aspect-video relative overflow-hidden">
        <img
          src={getImage(restaurant.id)}
          alt={restaurant.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute top-3 left-3">
          <RatingBadge rating={restaurant.rating} count={restaurant.ratingCount} />
        </div>
        {restaurant.priceLevel && (
          <div className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm rounded-full px-2 py-0.5 text-xs font-medium">
            {restaurant.priceLevel}
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-base truncate">{restaurant.name}</h3>
        <div className="flex items-center gap-1 text-muted-foreground text-xs mt-1">
          <MapPin size={12} />
          <span>{restaurant.quartier || restaurant.city}</span>
          {restaurant.categories.length > 0 && (
            <>
              <span className="mx-1">·</span>
              <span className="truncate">{restaurant.categories.slice(0, 2).join(', ')}</span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
});

RestaurantCard.displayName = 'RestaurantCard';
export default RestaurantCard;
