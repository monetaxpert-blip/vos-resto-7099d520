import { memo, useMemo, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { MapPin, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RestaurantCard from '@/components/restaurant/RestaurantCard';
import StaggerList from '@/components/animations/StaggerList';
import Footer from '@/components/layout/Footer';
import { CATEGORY_EMOJIS, TOP_CATEGORIES } from '@/data/types';
import { useDBRestaurants } from '@/hooks/useDBRestaurants';
import { useSortByPlan } from '@/hooks/useOwnership';

const HeroSection = memo(() => {
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <div ref={ref} className="relative h-[420px] overflow-hidden">
      <motion.div style={{ y }} className="absolute inset-0">
        <img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&h=800&fit=crop" alt="Vos Resto" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-background" />
      </motion.div>
      <motion.div style={{ opacity }} className="relative z-10 flex flex-col items-center justify-end h-full pb-10 px-6">
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }} className="text-4xl font-extrabold text-white text-center tracking-tight mb-2">Vos Resto</motion.h1>
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="text-white/80 text-sm text-center mb-6 max-w-xs">Marketplace restaurants à Dakar : menus, réservations, itinéraires et offres.</motion.p>
        <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5, type: 'spring' }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/search')} className="flex items-center gap-3 w-full max-w-sm glass rounded-2xl px-5 py-3.5 text-left text-sm text-white/70 shadow-xl"><Search size={18} /><span>Rechercher un restaurant...</span></motion.button>
      </motion.div>
    </div>
  );
});
HeroSection.displayName = 'HeroSection';

const Index = () => {
  const navigate = useNavigate();
  const { list, loading } = useDBRestaurants();
  const ranked = useSortByPlan(list);
  const featured = useMemo(() => ranked.filter((item) => item.isFeatured || item.adminPlan === 'Elite').slice(0, 10), [ranked]);
  const topRated = useMemo(() => [...ranked].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 12), [ranked]);
  const quartiers = useMemo(() => {
    const counts = new Map<string, number>();
    list.forEach((restaurant) => {
      const key = restaurant.quartier || restaurant.city;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return Array.from(counts.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [list]);

  return (
    <div className="min-h-screen pb-24 bg-background">
      <HeroSection />

      <section className="px-5 -mt-2">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
          {TOP_CATEGORIES.map((category) => (
            <motion.button key={category} whileTap={{ scale: 0.92 }} onClick={() => navigate(`/search?category=${encodeURIComponent(category)}`)} className="flex items-center gap-1.5 flex-shrink-0 rounded-full bg-card shadow-card px-4 py-2.5 text-xs font-medium text-foreground hover:bg-primary hover:text-primary-foreground transition-colors">
              <span className="text-base">{CATEGORY_EMOJIS[category] || '🍽️'}</span>
              <span>{category}</span>
            </motion.button>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <div className="px-5 flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">En vedette</h2>
          <span className="text-xs text-muted-foreground">Premium & Elite</span>
        </div>
        {loading ? <p className="px-5 text-sm text-muted-foreground">Chargement...</p> : <div className="flex gap-4 overflow-x-auto hide-scrollbar px-5 pb-2">{featured.map((restaurant, index) => <RestaurantCard key={restaurant.id} restaurant={restaurant} variant="featured" index={index} />)}</div>}
      </section>

      <section className="mt-10 px-5">
        <h2 className="text-xl font-bold mb-4">Explorer par quartier</h2>
        <div className="grid grid-cols-2 gap-3">
          {quartiers.map((quartier, index) => (
            <motion.button key={quartier.name} whileTap={{ scale: 0.95 }} onClick={() => navigate(`/search?quartier=${encodeURIComponent(quartier.name)}`)} className="relative rounded-2xl overflow-hidden h-24 bg-card border border-border shadow-card">
              <div className="absolute inset-0 flex flex-col items-start justify-end p-4 bg-gradient-to-br from-primary/10 via-background to-secondary">
                <div className="flex items-center gap-1 text-muted-foreground text-xs mb-0.5"><MapPin size={10} /><span>{quartier.count} restos</span></div>
                <span className="font-bold text-sm">{quartier.name}</span>
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      <section className="mt-10 px-5">
        <h2 className="text-xl font-bold mb-4">Les mieux notés</h2>
        <StaggerList className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {topRated.map((restaurant) => <RestaurantCard key={restaurant.id} restaurant={restaurant} />)}
        </StaggerList>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
