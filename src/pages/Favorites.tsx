import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Users, Clock, X, Heart } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { getAllReservations, cancelReservation, Reservation } from '@/lib/reservations';
import { toast } from 'sonner';

const Favorites = () => {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<Reservation[]>([]);

  const refresh = () => setReservations(getAllReservations());

  useEffect(() => {
    refresh();
  }, []);

  const handleCancel = (id: string) => {
    cancelReservation(id);
    toast.success('Réservation annulée');
    refresh();
  };

  const active = reservations.filter(r => r.status !== 'cancelled');

  return (
    <div className="min-h-screen pb-24 bg-background pt-14 px-5">
      <h1 className="text-2xl font-extrabold mb-6">Mes réservations</h1>

      {active.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Heart size={32} className="text-primary" />
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
                    onClick={() => navigate(`/restaurant/${r.restaurantId}`)}
                    className="flex-1 text-left"
                  >
                    <p className="font-bold text-base">{r.restaurantName}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {format(parseISO(r.date), 'EEE d MMM', { locale: fr })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {r.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={12} />
                        {r.guests} {r.guests > 1 ? 'pers.' : 'pers.'}
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
    </div>
  );
};

export default Favorites;
