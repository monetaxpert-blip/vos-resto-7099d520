import { memo, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Search, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getTrending, getTopRated, getQuartierCounts } from '@/data/queries';
import { TOP_CATEGORIES, CATEGORY_EMOJIS } from '@/data/types';
import RestaurantCard from '@/components/restaurant/RestaurantCard';
import StaggerList from '@/components/animations/StaggerList';
import { useSortByPlan } from '@/hooks/useOwnership';

const trendingRaw = getTrending(10);
const topRatedRaw = getTopRated(12);
const quartierCounts = getQuartierCounts();

const HeroSection = memo(() => {
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <div ref={ref} className="relative h-[420px] overflow-hidden">
      <motion.div style={{ y }} className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&h=800&fit=crop"
          alt="Cuisine"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-background" />
      </motion.div>
      <motion.div style={{ opacity }} className="relative z-10 flex flex-col items-center justify-end h-full pb-10 px-6">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="text-4xl font-extrabold text-white text-center tracking-tight mb-2"
        >
          Vos Resto
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="text-white/80 text-sm text-center mb-6 max-w-xs"
        >
          Découvrez les meilleurs restaurants de Dakar
        </motion.p>
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: 'spring' }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/search')}
          className="flex items-center gap-3 w-full max-w-sm glass rounded-2xl px-5 py-3.5 text-left text-sm text-white/70 shadow-xl"
        >
          <Search size={18} />
          <span>Rechercher un restaurant...</span>
        </motion.button>
      </motion.div>
    </div>
  );
});
HeroSection.displayName = 'HeroSection';

const CategoryPills = memo(() => {
  const navigate = useNavigate();
  return (
    <section className="px-5 -mt-2">
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
        {TOP_CATEGORIES.map((cat) => (
          <motion.button
            key={cat}
            whileTap={{ scale: 0.92 }}
            onClick={() => navigate(`/search?category=${encodeURIComponent(cat)}`)}
            className="flex items-center gap-1.5 flex-shrink-0 rounded-full bg-card shadow-card px-4 py-2.5 text-xs font-medium text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <span className="text-base">{CATEGORY_EMOJIS[cat] || '🍽️'}</span>
            <span>{cat}</span>
          </motion.button>
        ))}
      </div>
    </section>
  );
});
CategoryPills.displayName = 'CategoryPills';

const TrendingSection = memo(() => {
  const trending = useSortByPlan(trendingRaw);
  return (
    <section className="mt-8">
      <div className="px-5 flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Tendances 🔥</h2>
        <span className="text-xs text-muted-foreground">Les plus populaires</span>
      </div>
      <div className="flex gap-4 overflow-x-auto hide-scrollbar px-5 pb-2">
        {trending.map((r, i) => (
          <RestaurantCard key={r.id} restaurant={r} variant="featured" index={i} />
        ))}
      </div>
    </section>
  );
});
TrendingSection.displayName = 'TrendingSection';

const QuartierExplorer = memo(() => {
  const navigate = useNavigate();
  const colors = [
    'from-orange-400 to-red-500',
    'from-emerald-400 to-teal-500',
    'from-blue-400 to-indigo-500',
    'from-pink-400 to-rose-500',
    'from-amber-400 to-orange-500',
    'from-violet-400 to-purple-500',
    'from-cyan-400 to-blue-500',
    'from-lime-400 to-green-500',
  ];

  return (
    <section className="mt-10 px-5">
      <h2 className="text-xl font-bold mb-4">Explorer par quartier</h2>
      <div className="grid grid-cols-2 gap-3">
        {quartierCounts.slice(0, 8).map((q, i) => (
          <motion.button
            key={q.name}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(`/search?quartier=${encodeURIComponent(q.name)}`)}
            className={`relative rounded-2xl overflow-hidden h-24 bg-gradient-to-br ${colors[i % colors.length]} shadow-card`}
          >
            <div className="absolute inset-0 flex flex-col items-start justify-end p-4">
              <div className="flex items-center gap-1 text-white/80 text-xs mb-0.5">
                <MapPin size={10} />
                <span>{q.count} restos</span>
              </div>
              <span className="text-white font-bold text-sm">{q.name}</span>
            </div>
          </motion.button>
        ))}
      </div>
    </section>
  );
});
QuartierExplorer.displayName = 'QuartierExplorer';

const TopRatedSection = memo(() => {
  const topRated = useSortByPlan(topRatedRaw);
  return (
    <section className="mt-10 px-5">
      <h2 className="text-xl font-bold mb-4">Les mieux notés ⭐</h2>
      <StaggerList className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {topRated.map((r) => (
          <RestaurantCard key={r.id} restaurant={r} />
        ))}
      </StaggerList>
    </section>
  );
});
TopRatedSection.displayName = 'TopRatedSection';

import Footer from '@/components/layout/Footer';

const Index = () => (
  <div className="min-h-screen pb-24 bg-background">
    <HeroSection />
    <CategoryPills />
    <TrendingSection />
    <QuartierExplorer />
    <TopRatedSection />
    <Footer />
  </div>
);

export default Index;
