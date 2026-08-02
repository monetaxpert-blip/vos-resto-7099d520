import { memo, useMemo, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, MapPin, Plus, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import RestaurantCard from '@/components/restaurant/RestaurantCard';
import RestaurantCardSkeleton from '@/components/restaurant/RestaurantCardSkeleton';
import StaggerList from '@/components/animations/StaggerList';
import Footer from '@/components/layout/Footer';
import { TOP_CATEGORIES } from '@/data/types';
import { getCategoryIcon } from '@/lib/categoryIcons';
import { useDBRestaurants } from '@/hooks/useDBRestaurants';

const HeroSection = memo(() => {
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);

  return (
    <div ref={ref} className="relative h-[70vh] min-h-[460px] max-h-[720px] overflow-hidden">
      <motion.div style={{ y, scale }} className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1920&h=1080&fit=crop"
          alt="Table dressée dans un restaurant à Dakar"
          width={1920}
          height={1080}
          fetchPriority="high"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0" style={{ backgroundImage: 'var(--gradient-hero)' }} />
      </motion.div>

      <div className="relative z-10 mx-auto flex h-full max-w-5xl flex-col items-center justify-center px-6 text-center">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-ember/30 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold backdrop-blur-sm"
        >
          Marketplace des restaurants au Sénégal
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 180, damping: 22 }}
          className="mb-8 font-display text-4xl font-extrabold leading-[1.05] text-primary-foreground sm:text-6xl md:text-7xl"
        >
          Le goût du <span className="text-gold">Sénégal</span>,
          <br className="hidden sm:block" /> à votre table.
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35, type: 'spring', stiffness: 200, damping: 24 }}
          className="flex w-full max-w-2xl items-center gap-2 rounded-2xl border border-gold/20 bg-card/95 p-2 shadow-float backdrop-blur-md"
        >
          <button
            onClick={() => navigate('/search')}
            className="flex flex-1 items-center gap-3 rounded-xl px-4 py-3 text-left text-base text-muted-foreground transition-colors hover:bg-secondary"
          >
            <Search size={18} className="shrink-0 text-primary" />
            <span className="truncate">Quel restaurant cherchez-vous ?</span>
          </button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/search')}
            className="shrink-0 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-premium transition-colors hover:bg-ember sm:px-8 sm:text-base"
          >
            Rechercher
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
});
HeroSection.displayName = 'HeroSection';

const SectionTitle = ({ children, kicker }: { children: React.ReactNode; kicker?: string }) => (
  <div>
    <h2 className="border-l-4 border-gold pl-4 font-display text-2xl font-bold sm:text-3xl">{children}</h2>
    {kicker && <p className="mt-2 pl-5 text-muted-foreground">{kicker}</p>}
  </div>
);

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
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [list]);

  const quartierFillers = Math.max(0, 4 - quartiers.length);
  const cardFillers = loading ? 3 : Math.max(0, 3 - allSorted.length);

  return (
    <div className="min-h-screen bg-background pb-24">
      <Helmet>
        <title>Vos Resto — Guide des restaurants à Dakar, Sénégal</title>
        <meta name="description" content="Découvrez les meilleurs restaurants de Dakar : menus, réservations, itinéraires et offres. La marketplace des restaurants au Sénégal." />
        <link rel="canonical" href="https://vos-resto.lovable.app/" />
        <meta property="og:title" content="Vos Resto — Guide des restaurants à Dakar" />
        <meta property="og:description" content="Découvrez les meilleurs restaurants de Dakar : menus, réservations, itinéraires et offres." />
        <meta property="og:url" content="https://vos-resto.lovable.app/" />
      </Helmet>

      <HeroSection />

      <main id="main-content" className="relative z-20 mx-auto -mt-12 max-w-7xl space-y-16 px-5 pb-16 sm:px-6 sm:space-y-20">
        {/* Catégories */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.4 }}
          className="space-y-5"
        >
          <SectionTitle>Explorer par catégorie</SectionTitle>
          <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar sm:flex-wrap sm:overflow-visible">
            {TOP_CATEGORIES.map((category) => {
              const Icon = getCategoryIcon(category);
              return (
                <motion.button
                  key={category}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => navigate(`/search?category=${encodeURIComponent(category)}`)}
                  className="group flex flex-shrink-0 items-center gap-2 rounded-full border border-accent/20 bg-card px-5 py-3 text-sm font-semibold shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-card"
                >
                  <Icon size={18} className="text-accent transition-colors group-hover:text-primary" />
                  <span>{category}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.section>

        {/* Quartiers */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.4 }}
          className="space-y-6"
        >
          <SectionTitle>Quartiers populaires</SectionTitle>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {quartiers.map((quartier) => (
              <motion.button
                key={quartier.name}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(`/search?quartier=${encodeURIComponent(quartier.name)}`)}
                className="group relative h-36 overflow-hidden rounded-3xl shadow-card sm:h-48"
              >
                <div className="absolute inset-0 bg-gradient-ember transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-ember via-ember/20 to-transparent" />
                <div className="absolute bottom-5 left-5 text-left">
                  <h3 className="font-display text-lg font-bold text-primary-foreground sm:text-xl">{quartier.name}</h3>
                  <p className="flex items-center gap-1 text-sm font-semibold text-gold">
                    <MapPin size={12} />
                    {quartier.count} restaurant{quartier.count > 1 ? 's' : ''}
                  </p>
                </div>
              </motion.button>
            ))}
            {Array.from({ length: quartierFillers }).map((_, index) => (
              <div
                key={`quartier-filler-${index}`}
                className={`flex h-36 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-accent/25 bg-card/60 p-6 text-center sm:h-48 ${index > 0 ? 'opacity-40' : ''}`}
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-accent/20 bg-secondary">
                  <Plus size={20} className="text-accent" />
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">À venir</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Restaurants */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.4 }}
          className="space-y-8"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <SectionTitle kicker="Les meilleures saveurs sélectionnées pour vous">
              Restaurants à proximité
            </SectionTitle>
            <button
              onClick={() => navigate('/search')}
              className="group inline-flex items-center gap-2 self-start font-bold text-primary transition-colors hover:text-ember md:self-auto"
            >
              Voir tous les restaurants
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          {!loading && allSorted.length > 0 && (
            <StaggerList className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
              {allSorted.map((restaurant) => <RestaurantCard key={restaurant.id} restaurant={restaurant} />)}
            </StaggerList>
          )}


          {cardFillers > 0 && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
              {Array.from({ length: cardFillers }).map((_, index) => (
                <RestaurantCardSkeleton key={`skeleton-${index}`} dim={!loading && index > 0} />
              ))}
            </div>
          )}
        </motion.section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
