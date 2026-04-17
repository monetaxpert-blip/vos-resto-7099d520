import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, Clock, Users, Check, X, Loader2 } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Restaurant } from '@/data/types';
import { createReservation } from '@/lib/reservations';
import { toast } from 'sonner';

interface ReservationSheetProps {
  restaurant: Restaurant;
}

const TIMES = ['12:00', '12:30', '13:00', '13:30', '14:00', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'];

const ReservationSheet = ({ restaurant }: ReservationSheetProps) => {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date>(addDays(new Date(), 1));
  const [time, setTime] = useState('20:00');
  const [guests, setGuests] = useState(2);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const days = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i));

  const reset = () => {
    setSuccess(false);
    setSubmitting(false);
    setDate(addDays(new Date(), 1));
    setTime('20:00');
    setGuests(2);
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      // Simulate small async confirmation for native feel
      await new Promise((r) => setTimeout(r, 600));
      createReservation({
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        date: format(date, 'yyyy-MM-dd'),
        time,
        guests,
      });
      setSuccess(true);
      setTimeout(() => {
        setOpen(false);
        setTimeout(reset, 300);
      }, 1400);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur');
      setSubmitting(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DrawerTrigger asChild>
        <motion.button
          whileTap={{ scale: 0.97 }}
          className="w-full rounded-2xl bg-card border border-border px-5 py-4 flex items-center justify-between shadow-card"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <CalendarIcon size={18} className="text-primary" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-sm">Réserver une table</p>
              <p className="text-xs text-muted-foreground">Confirmation immédiate</p>
            </div>
          </div>
          <span className="text-primary text-xs font-semibold">Réserver →</span>
        </motion.button>
      </DrawerTrigger>

      <DrawerContent className="max-h-[92vh]">
        <DrawerHeader>
          <DrawerTitle>{restaurant.name}</DrawerTitle>
          <p className="text-xs text-muted-foreground">Choisissez vos préférences</p>
        </DrawerHeader>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="px-5 pb-10 pt-6 flex flex-col items-center text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                className="w-20 h-20 rounded-full bg-primary flex items-center justify-center mb-4"
              >
                <Check size={36} className="text-primary-foreground" strokeWidth={3} />
              </motion.div>
              <h3 className="text-lg font-bold">Réservation confirmée !</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {format(date, 'EEEE d MMMM', { locale: fr })} à {time}
              </p>
              <p className="text-sm text-muted-foreground">
                {guests} {guests > 1 ? 'personnes' : 'personne'}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-5 pb-8 space-y-5 overflow-y-auto"
            >
              {/* Date picker */}
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                  <CalendarIcon size={12} /> Date
                </label>
                <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                  {days.map((d) => {
                    const active = format(d, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
                    return (
                      <motion.button
                        key={d.toISOString()}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => setDate(d)}
                        className={`flex-shrink-0 w-14 h-16 rounded-2xl flex flex-col items-center justify-center transition-colors ${
                          active
                            ? 'bg-primary text-primary-foreground shadow-md'
                            : 'bg-secondary text-foreground'
                        }`}
                      >
                        <span className="text-[10px] uppercase font-medium">
                          {format(d, 'EEE', { locale: fr })}
                        </span>
                        <span className="text-lg font-bold leading-none">{format(d, 'd')}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Time picker */}
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                  <Clock size={12} /> Heure
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {TIMES.map((t) => (
                    <motion.button
                      key={t}
                      whileTap={{ scale: 0.94 }}
                      onClick={() => setTime(t)}
                      className={`py-2 rounded-xl text-sm font-semibold transition-colors ${
                        time === t
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-foreground'
                      }`}
                    >
                      {t}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Guests */}
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                  <Users size={12} /> Personnes
                </label>
                <div className="flex items-center justify-between bg-secondary rounded-2xl p-2">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setGuests(Math.max(1, guests - 1))}
                    className="w-10 h-10 rounded-xl bg-background flex items-center justify-center font-bold text-lg disabled:opacity-40"
                    disabled={guests <= 1}
                  >
                    −
                  </motion.button>
                  <span className="font-bold text-lg">
                    {guests} {guests > 1 ? 'personnes' : 'personne'}
                  </span>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setGuests(Math.min(20, guests + 1))}
                    className="w-10 h-10 rounded-xl bg-background flex items-center justify-center font-bold text-lg disabled:opacity-40"
                    disabled={guests >= 20}
                  >
                    +
                  </motion.button>
                </div>
              </div>

              {/* CTA */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={submit}
                disabled={submitting}
                className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Confirmation...
                  </>
                ) : (
                  'Réserver maintenant'
                )}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </DrawerContent>
    </Drawer>
  );
};

export default ReservationSheet;
