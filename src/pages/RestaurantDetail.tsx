import { useParams, useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Phone, Globe, MapPin, Clock, ExternalLink, Wallet } from 'lucide-react';
import { getRestaurantById, getSimilarRestaurants } from '@/data/queries';
import { getMenuForRestaurant } from '@/data/menus';
import { deriveAveragePrice, formatFCFA } from '@/lib/format';
import RatingBadge from '@/components/restaurant/RatingBadge';
import RestaurantCard from '@/components/restaurant/RestaurantCard';
import StaggerList from '@/components/animations/StaggerList';
import RouteButton from '@/components/restaurant/RouteButton';
import ReservationSheet from '@/components/restaurant/ReservationSheet';
import MenuSection from '@/components/restaurant/MenuSection';

const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=500&fit=crop',
  'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&h=500&fit=crop',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=500&fit=crop',
  'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&h=500&fit=crop',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=500&fit=crop',
];

function getImage(id: string) {
  return PLACEHOLDER_IMAGES[parseInt(id) % PLACEHOLDER_IMAGES.length];
}

const RestaurantDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const restaurant = id ? getRestaurantById(id) : undefined;

  const menu = useMemo(
    () => (restaurant ? getMenuForRestaurant(restaurant.id, restaurant.categories) : []),
    [restaurant]
  );
  const avgPrice = useMemo(
    () => (restaurant ? deriveAveragePrice(restaurant.priceLevel, restaurant.categories, restaurant.id) : 0),
    [restaurant]
  );

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Restaurant introuvable</p>
          <button onClick={() => navigate('/')} className="mt-4 text-primary font-medium">
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  const similar = getSimilarRestaurants(restaurant, 4);

  return (
    <div className="min-h-screen pb-32 bg-background">
      {/* Hero */}
      <div className="relative h-72 overflow-hidden">
        <img src={getImage(restaurant.id)} alt={restaurant.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(-1)}
          className="absolute top-12 left-4 z-10 w-10 h-10 rounded-full glass flex items-center justify-center"
        >
          <ArrowLeft size={20} className="text-white" />
        </motion.button>
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <RatingBadge rating={restaurant.rating} count={restaurant.ratingCount} size="md" />
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-white text-2xl font-extrabold mt-2"
          >
            {restaurant.name}
          </motion.h1>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="px-5 pt-5"
      >
        {/* Categories + budget */}
        <div className="flex flex-wrap gap-2 mb-4">
          {restaurant.categories.map(cat => (
            <span key={cat} className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
              {cat}
            </span>
          ))}
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Wallet size={11} /> Budget moyen : {formatFCFA(avgPrice)}
          </span>
        </div>

        {/* Primary actions */}
        <div className="space-y-3 mb-5">
          <RouteButton restaurant={restaurant} />
          <ReservationSheet restaurant={restaurant} />
        </div>

        {/* Details card */}
        <div className="rounded-2xl bg-card shadow-card p-5 space-y-4">
          {restaurant.address && (
            <div className="flex items-start gap-3">
              <MapPin size={18} className="text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Adresse</p>
                <p className="text-xs text-muted-foreground">{restaurant.address}</p>
                {restaurant.quartier && <p className="text-xs text-muted-foreground mt-0.5">{restaurant.quartier}, {restaurant.city}</p>}
              </div>
            </div>
          )}

          {restaurant.phone && (
            <a href={`tel:${restaurant.phone}`} className="flex items-start gap-3 group">
              <Phone size={18} className="text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium group-hover:text-primary transition-colors">Téléphone</p>
                <p className="text-xs text-muted-foreground">{restaurant.phone}</p>
              </div>
            </a>
          )}

          {restaurant.hours && (
            <div className="flex items-start gap-3">
              <Clock size={18} className="text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Horaires</p>
                <p className="text-xs text-muted-foreground">{restaurant.hours}</p>
              </div>
            </div>
          )}

          {restaurant.website && (
            <a href={restaurant.website} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 group">
              <Globe size={18} className="text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium group-hover:text-primary transition-colors">Site web</p>
                <p className="text-xs text-muted-foreground truncate max-w-[240px]">{restaurant.website}</p>
              </div>
            </a>
          )}
        </div>

        {/* Social */}
        {restaurant.socialMedia && (
          <div className="mt-4 flex gap-3">
            {restaurant.socialMedia.facebook && (
              <a href={restaurant.socialMedia.facebook} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-full bg-secondary px-4 py-2 text-xs font-medium hover:bg-primary hover:text-primary-foreground transition-colors">
                <ExternalLink size={12} /> Facebook
              </a>
            )}
            {restaurant.socialMedia.instagram && (
              <a href={restaurant.socialMedia.instagram} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-full bg-secondary px-4 py-2 text-xs font-medium hover:bg-primary hover:text-primary-foreground transition-colors">
                <ExternalLink size={12} /> Instagram
              </a>
            )}
          </div>
        )}

        {/* Menu */}
        <MenuSection menu={menu} />

        {/* Similar */}
        {similar.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-bold mb-4">Restaurants similaires</h2>
            <StaggerList className="space-y-2">
              {similar.map(r => (
                <RestaurantCard key={r.id} restaurant={r} variant="compact" />
              ))}
            </StaggerList>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default RestaurantDetail;
