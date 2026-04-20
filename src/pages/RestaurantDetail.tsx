import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Phone, Globe, MapPin, Clock, ExternalLink, Wallet, Heart, Map as MapIcon } from 'lucide-react';
import { getRestaurantById, getSimilarRestaurants } from '@/data/queries';
import { getMenuForRestaurant } from '@/data/menus';
import { deriveAveragePrice, formatFCFA } from '@/lib/format';
import { getRestaurantGallery, getRestaurantImage } from '@/lib/photos';
import { useFavorites } from '@/hooks/useFavorites';
import { useRestaurantPhotos } from '@/hooks/useRestaurantPhotos';
import RatingBadge from '@/components/restaurant/RatingBadge';
import RestaurantCard from '@/components/restaurant/RestaurantCard';
import StaggerList from '@/components/animations/StaggerList';
import RouteButton from '@/components/restaurant/RouteButton';
import ReservationSheet from '@/components/restaurant/ReservationSheet';
import MenuSection from '@/components/restaurant/MenuSection';
import RestaurantMap from '@/components/map/RestaurantMap';
import { track } from '@/lib/analytics';

const RestaurantDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const restaurant = id ? getRestaurantById(id) : undefined;
  const { isFavorite, toggle } = useFavorites();
  const { data: dbPhotos } = useRestaurantPhotos(restaurant?.id);
  const [activeImg, setActiveImg] = useState(0);

  const menu = useMemo(
    () => (restaurant ? getMenuForRestaurant(restaurant.id, restaurant.categories) : []),
    [restaurant]
  );
  const avgPrice = useMemo(
    () => (restaurant ? deriveAveragePrice(restaurant.priceLevel, restaurant.categories, restaurant.id) : 0),
    [restaurant]
  );
  const gallery = useMemo(() => {
    if (!restaurant) return [];
    if (dbPhotos && dbPhotos.length > 0) {
      const sorted = [...dbPhotos].sort((a, b) => Number(b.is_hero) - Number(a.is_hero));
      const urls = sorted.map((p) => p.url);
      if (urls.length >= 4) return urls.slice(0, 4);
      const fallback = getRestaurantGallery(
        restaurant.id,
        restaurant.categories,
        4,
        restaurant.name,
        restaurant.quartier
      );
      return [...urls, ...fallback].slice(0, 4);
    }
    return getRestaurantGallery(
      restaurant.id,
      restaurant.categories,
      4,
      restaurant.name,
      restaurant.quartier
    );
  }, [restaurant, dbPhotos]);

  useEffect(() => {
    if (restaurant?.id) track('restaurant_view', { restaurantId: restaurant.id });
  }, [restaurant?.id]);


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
  const fav = isFavorite(restaurant.id);

  return (
    <div className="min-h-screen pb-32 bg-background">
      {/* Hero gallery */}
      <div className="relative h-72 overflow-hidden bg-secondary">
        <AnimatePresence mode="wait">
          <motion.img
            key={gallery[activeImg]}
            src={gallery[activeImg] ?? getRestaurantImage(restaurant.id, restaurant.categories, undefined, restaurant.name, restaurant.quartier)}
            alt={restaurant.name}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />

        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(-1)}
          className="absolute top-12 left-4 z-10 w-10 h-10 rounded-full glass flex items-center justify-center"
          aria-label="Retour"
        >
          <ArrowLeft size={20} className="text-white" />
        </motion.button>

        <motion.button
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          whileTap={{ scale: 0.85 }}
          onClick={() => toggle(restaurant.id)}
          className="absolute top-12 right-4 z-10 w-10 h-10 rounded-full glass flex items-center justify-center"
          aria-label={fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <Heart size={20} className={fav ? 'text-primary fill-primary' : 'text-white'} />
        </motion.button>

        {/* Gallery thumbs */}
        {gallery.length > 1 && (
          <div className="absolute bottom-16 left-0 right-0 px-5 flex gap-1.5 justify-center">
            {gallery.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveImg(i)}
                aria-label={`Photo ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === activeImg ? 'bg-white w-8' : 'bg-white/50 w-1.5'
                }`}
              />
            ))}
          </div>
        )}

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
          {restaurant.categories.map((cat) => (
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

        {/* Map */}
        {restaurant.lat && restaurant.lng && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                <MapIcon size={14} /> Localisation
              </h2>
              <button
                onClick={() => navigate('/map')}
                className="text-xs text-primary font-semibold"
              >
                Vue globale →
              </button>
            </div>
            <RestaurantMap restaurant={restaurant} height={200} />
          </div>
        )}

        {/* Details card */}
        <div className="rounded-2xl bg-card shadow-card p-5 space-y-4">
          {restaurant.address && (
            <div className="flex items-start gap-3">
              <MapPin size={18} className="text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Adresse</p>
                <p className="text-xs text-muted-foreground">{restaurant.address}</p>
                {restaurant.quartier && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {restaurant.quartier}, {restaurant.city}
                  </p>
                )}
              </div>
            </div>
          )}

          {restaurant.phone && (
            <a
              href={restaurant.website?.includes('wa.me') ? restaurant.website : `tel:${restaurant.phone}`}
              target={restaurant.website?.includes('wa.me') ? '_blank' : undefined}
              rel="noopener noreferrer"
              onClick={() => track(restaurant.website?.includes('wa.me') ? 'whatsapp_click' : 'restaurant_click', { restaurantId: restaurant.id, metadata: { action: 'phone' } })}
              className="flex items-start gap-3 group"
            >
              <Phone size={18} className="text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium group-hover:text-primary transition-colors">{restaurant.website?.includes('wa.me') ? 'WhatsApp' : 'Téléphone'}</p>
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
              <a
                href={restaurant.socialMedia.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-full bg-secondary px-4 py-2 text-xs font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <ExternalLink size={12} /> Facebook
              </a>
            )}
            {restaurant.socialMedia.instagram && (
              <a
                href={restaurant.socialMedia.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-full bg-secondary px-4 py-2 text-xs font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
              >
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
              {similar.map((r) => (
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
