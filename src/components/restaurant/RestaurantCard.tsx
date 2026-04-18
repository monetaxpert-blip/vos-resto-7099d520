import { memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Wallet, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { Restaurant } from '@/data/types';
import RatingBadge from './RatingBadge';
import TiltCard from '@/components/animations/TiltCard';
import { deriveAveragePrice, formatFCFA } from '@/lib/format';
import { getRestaurantImage } from '@/lib/photos';
import { useFavorites } from '@/hooks/useFavorites';

interface RestaurantCardProps {
  restaurant: Restaurant;
  variant?: 'default' | 'compact' | 'featured';
  index?: number;
}

const RestaurantCard = memo(({ restaurant, variant = 'default', index = 0 }: RestaurantCardProps) => {
  const navigate = useNavigate();
  const { isFavorite, toggle } = useFavorites();
  const fav = isFavorite(restaurant.id);

  const avgPrice = useMemo(
    () => deriveAveragePrice(restaurant.priceLevel, restaurant.categories, restaurant.id),
    [restaurant.priceLevel, restaurant.categories, restaurant.id]
  );
  const imageUrl = useMemo(
    () => getRestaurantImage(restaurant.id, restaurant.categories, { width: 600, height: 400 }),
    [restaurant.id, restaurant.categories]
  );

  const handleFavClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggle(restaurant.id);
  };

  const FavButton = ({ className = '' }: { className?: string }) => (
    <motion.button
      whileTap={{ scale: 0.85 }}
      onClick={handleFavClick}
      className={`w-8 h-8 rounded-full bg-background/85 backdrop-blur-sm flex items-center justify-center ${className}`}
      aria-label={fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
    >
      <Heart
        size={14}
        className={fav ? 'text-primary fill-primary' : 'text-foreground'}
      />
    </motion.button>
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
              src={imageUrl}
              alt={restaurant.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute top-3 left-3">
              <RatingBadge rating={restaurant.rating} count={restaurant.ratingCount} />
            </div>
            <div className="absolute top-3 right-3 flex items-center gap-2">
              <div className="inline-flex items-center gap-1 bg-background/85 backdrop-blur-sm rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-foreground">
                <Wallet size={10} />
                {formatFCFA(avgPrice)}
              </div>
              <FavButton />
            </div>
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
          src={imageUrl}
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
          src={imageUrl}
          alt={restaurant.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute top-3 left-3">
          <RatingBadge rating={restaurant.rating} count={restaurant.ratingCount} />
        </div>
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <div className="inline-flex items-center gap-1 bg-background/85 backdrop-blur-sm rounded-full px-2.5 py-0.5 text-[11px] font-semibold">
            <Wallet size={10} />
            {formatFCFA(avgPrice)}
          </div>
          <FavButton />
        </div>
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
