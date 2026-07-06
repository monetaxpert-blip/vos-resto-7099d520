import { memo, useMemo, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { MapPin, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import RestaurantCard from '@/components/restaurant/RestaurantCard';
import StaggerList from '@/components/animations/StaggerList';
import Footer from '@/components/layout/Footer';
import { CATEGORY_EMOJIS, TOP_CATEGORIES } from '@/data/types';
import { useDBRestaurants } from '@/hooks/useDBRestaurants';

const HeroSection = memo(() => {
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <div ref={ref} className="relative h-[420px] overflow-hidden">
      <motion.div style={{ y }} className="absolute inset-0">
        <img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&h=800&fit=crop" alt="Table dressée dans un restaurant à Dakar" width={1200} height={800} fetchPriority="high" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-background" />
      </motion.div>
      <motion.div style={{ opacity }} className="relative z-10 flex flex-col items-center justify-end h-full pb-10 px-6">
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }} className="text-4xl font-extrabold text-white text-center tracking-tight mb-2">Vos Resto</motion.h1>
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="text-white/80 text-sm text-center mb-6 max-w-xs">La marketplace des restaurants au Sénégal : menus, réservations, itinéraires et offres.</motion.p>
        <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5, type: 'spring' }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/search')} className="flex items-center gap-3 w-full max-w-sm glass rounded-2xl px-5 py-3.5 text-left text-sm text-white/70 shadow-xl"><Search size={18} /><span>Rechercher un restaurant...</span></motion.button>
      </motion.div>
    </div>
  );
});
HeroSection.displayName = 'HeroSection';

const Index = () => {
  const navigate = useNavigate();
  const { list, loading } = useDBRestaurants();
  const allSorted = useMemo(() => [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0)), [list]);
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
      <Helmet>
        <title>Vos Resto — Guide des restaurants à Dakar, Sénégal</title>
        <meta name="description" content="Découvrez les meilleurs restaurants de Dakar : menus, réservations, itinéraires et offres. La marketplace des restaurants au Sénégal." />
        <link rel="canonical" href="https://vos-resto.lovable.app/" />
        <meta property="og:title" content="Vos Resto — Guide des restaurants à Dakar" />
        <meta property="og:description" content="Découvrez les meilleurs restaurants de Dakar : menus, réservations, itinéraires et offres." />
        <meta property="og:url" content="https://vos-resto.lovable.app/" />
      </Helmet>
      <HeroSection />

      <main id="main-content">
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

      <section className="mt-10 px-5">
        <h2 className="text-xl font-bold mb-4">Explorer par quartier</h2>
        <div className="grid grid-cols-2 gap-3">
          {quartiers.map((quartier) => (
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
        <h2 className="text-xl font-bold mb-4">Les restaurants</h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">Chargement...</p>
        ) : (
          <StaggerList className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {allSorted.map((restaurant) => <RestaurantCard key={restaurant.id} restaurant={restaurant} />)}
          </StaggerList>
        )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
