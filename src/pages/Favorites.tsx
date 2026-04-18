import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Users, Clock, X, Heart, LogIn, MapPin } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useReservations } from '@/hooks/useReservations';
import { useFavorites } from '@/hooks/useFavorites';
import { getRestaurantById } from '@/data/queries';
import { getRestaurantImage } from '@/lib/photos';
import { toast } from 'sonner';

const Favorites = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'favorites' ? 'favorites' : 'reservations';
  const [tab, setTab] = useState<'reservations' | 'favorites'>(initialTab);
  const { reservations, cancel, isLoading } = useReservations();
  const { ids: favIds, toggle } = useFavorites();

  const setActiveTab = (t: 'reservations' | 'favorites') => {
    setTab(t);
    setSearchParams(t === 'favorites' ? { tab: 'favorites' } : {});
  };

  const handleCancel = (id: string) => {
    cancel.mutate(id, {
      onSuccess: () => toast.success('Réservation annulée'),
    });
  };

  const active = reservations.filter((r) => r.status !== 'cancelled');
  const favRestos = favIds.map((id) => getRestaurantById(id)).filter(Boolean);

  if (!user) {
    return (
      <div className="min-h-screen pb-24 bg-background pt-14 px-5">
        <h1 className="text-2xl font-extrabold mb-6">Mes réservations</h1>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <LogIn size={32} className="text-primary" />
          </div>
          <p className="font-semibold text-lg">Connectez-vous</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            Pour voir vos réservations et favoris synchronisés sur tous vos appareils
          </p>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate('/auth')}
            className="mt-6 rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm font-semibold"
          >
            Se connecter
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 bg-background pt-14 px-5">
      <h1 className="text-2xl font-extrabold mb-4">Mon espace</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 bg-secondary/60 rounded-2xl p-1">
        {(['reservations', 'favorites'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
              tab === t ? 'bg-background shadow text-foreground' : 'text-muted-foreground'
            }`}
          >
            {t === 'reservations' ? `Réservations (${active.length})` : `Favoris (${favRestos.length})`}
          </button>
        ))}
      </div>

      {tab === 'reservations' ? (
        <>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Chargement...</p>
          ) : active.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Calendar size={32} className="text-primary" />
              </div>
              <p className="font-semibold text-lg">Aucune réservation</p>
              <p className="text-sm text-muted-foreground mt-1 text-center max-w-xs">
                Réservez une table depuis la fiche d'un restaurant
              </p>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate('/search')}
                className="mt-6 rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm font-semibold"
              >
                Explorer les restaurants
              </motion.button>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {active.map((r) => (
                  <motion.div
                    key={r.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="rounded-2xl bg-card shadow-card p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <button
                        onClick={() => navigate(`/restaurant/${r.restaurant_id}`)}
                        className="flex-1 text-left"
                      >
                        <p className="font-bold text-base">{r.restaurant_name}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {format(parseISO(r.reservation_date), 'EEE d MMM', { locale: fr })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {r.reservation_time}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users size={12} />
                            {r.guests} pers.
                          </span>
                        </div>
                        <span className="inline-block mt-2 rounded-full bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide">
                          Confirmée
                        </span>
                      </button>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleCancel(r.id)}
                        className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"
                        aria-label="Annuler"
                      >
                        <X size={14} className="text-muted-foreground" />
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </>
      ) : (
        <>
          {favRestos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Heart size={32} className="text-primary" />
              </div>
              <p className="font-semibold text-lg">Aucun favori</p>
              <p className="text-sm text-muted-foreground mt-1 text-center max-w-xs">
                Touchez le ❤️ sur une fiche pour ajouter un restaurant ici
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {favRestos.map(
                  (r) =>
                    r && (
                      <motion.div
                        key={r.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        onClick={() => navigate(`/restaurant/${r.id}`)}
                        className="flex items-center gap-3 p-3 rounded-2xl bg-card shadow-card cursor-pointer"
                      >
                        <img
                          src={getRestaurantImage(r.id, r.categories, { width: 200, height: 200 })}
                          alt={r.name}
                          loading="lazy"
                          className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate">{r.name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin size={10} />
                            {r.quartier ?? r.city}
                          </p>
                        </div>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggle(r.id);
                          }}
                          className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"
                          aria-label="Retirer"
                        >
                          <Heart size={14} className="text-primary fill-primary" />
                        </motion.button>
                      </motion.div>
                    )
                )}
              </AnimatePresence>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Favorites;
