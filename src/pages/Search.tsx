import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Map as MapIcon, Search as SearchIcon, SlidersHorizontal, Wallet, X } from 'lucide-react';
import RestaurantCard from '@/components/restaurant/RestaurantCard';
import CategoryTag from '@/components/restaurant/CategoryTag';
import BudgetFilter from '@/components/search/BudgetFilter';
import { QUARTIERS, TOP_CATEGORIES } from '@/data/types';
import { parseBudgetFromQuery, formatFCFA, deriveAveragePrice } from '@/lib/format';
import { track } from '@/lib/analytics';
import { useDBRestaurants } from '@/hooks/useDBRestaurants';
import { useSortByPlan } from '@/hooks/useOwnership';

const SearchPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { list } = useDBRestaurants();
  const ranked = useSortByPlan(list);
  const [query, setQuery] = useState('');
  const [selectedQuartier, setSelectedQuartier] = useState<string | null>(searchParams.get('quartier'));
  const [selectedCategory, setSelectedCategory] = useState<string | null>(searchParams.get('category'));
  const [budgetMax, setBudgetMax] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(!!searchParams.get('quartier') || !!searchParams.get('category'));

  useEffect(() => {
    const quartier = searchParams.get('quartier');
    const category = searchParams.get('category');
    if (quartier) setSelectedQuartier(quartier);
    if (category) setSelectedCategory(category);
  }, [searchParams]);

  const inlineBudget = useMemo(() => parseBudgetFromQuery(query), [query]);
  const effectiveBudgetMax = inlineBudget !== null ? (budgetMax !== null ? Math.min(inlineBudget, budgetMax) : inlineBudget) : budgetMax;
  const budgetActive = effectiveBudgetMax !== null && effectiveBudgetMax > 0;

  const results = useMemo(() => {
    const textQuery = inlineBudget !== null ? query.replace(/(\d[\d\s.,]*)|fcfa|f\b|budget|moins de|max|\bk\b|<|>/gi, '').trim().toLowerCase() : query.trim().toLowerCase();
    return ranked.filter((restaurant) => {
      const matchesText = !textQuery || restaurant.name.toLowerCase().includes(textQuery) || restaurant.categories.some((category) => category.toLowerCase().includes(textQuery)) || (restaurant.quartier || '').toLowerCase().includes(textQuery) || (restaurant.description || '').toLowerCase().includes(textQuery);
      const matchesQuartier = !selectedQuartier || restaurant.quartier === selectedQuartier;
      const matchesCategory = !selectedCategory || restaurant.categories.some((category) => category.toLowerCase().includes(selectedCategory.toLowerCase())) || (restaurant.cuisineType || '').toLowerCase().includes(selectedCategory.toLowerCase());
      const price = typeof restaurant.averagePrice === 'number' && !isNaN(restaurant.averagePrice) && restaurant.averagePrice > 0
        ? restaurant.averagePrice
        : deriveAveragePrice(restaurant.priceLevel, restaurant.categories, restaurant.id);
      const matchesBudget = !budgetActive || (price > 0 && price <= effectiveBudgetMax!);
      return matchesText && matchesQuartier && matchesCategory && matchesBudget;
    });
  }, [budgetActive, effectiveBudgetMax, inlineBudget, query, ranked, selectedCategory, selectedQuartier]);

  useEffect(() => {
    if (!query.trim() && !selectedQuartier && !selectedCategory && !budgetActive) return;
    const timeout = setTimeout(() => {
      track('search_event', {
        metadata: {
          query: query.trim() || null,
          quartier: selectedQuartier,
          category: selectedCategory,
          budget: budgetActive ? effectiveBudgetMax : null,
          results_count: results.length,
        },
      });
    }, 800);
    return () => clearTimeout(timeout);
  }, [budgetActive, effectiveBudgetMax, query, results.length, selectedCategory, selectedQuartier]);

  const clearFilters = () => {
    setSelectedQuartier(null);
    setSelectedCategory(null);
    setBudgetMax(null);
    setQuery('');
  };

  const hasFilters = !!selectedQuartier || !!selectedCategory || !!query || budgetActive;

  return (
    <div className="min-h-screen pb-24 bg-background">
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50 px-5 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <SearchIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" inputMode="search" placeholder="Resto, cuisine, quartier ou budget" value={query} onChange={(event) => setQuery(event.target.value)} className="w-full h-11 rounded-xl bg-secondary pl-10 pr-10 text-sm font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            {query && <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2" aria-label="Effacer la recherche"><X size={16} className="text-muted-foreground" /></button>}
          </div>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('/map')} className="w-11 h-11 rounded-xl flex items-center justify-center bg-secondary text-foreground" aria-label="Voir la carte"><MapIcon size={18} /></motion.button>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowFilters(!showFilters)} className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${showFilters || hasFilters ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'}`} aria-label="Filtres"><SlidersHorizontal size={18} /></motion.button>
        </div>

        {inlineBudget !== null && <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1.5 text-xs font-semibold"><Wallet size={12} /> Budget détecté : ≤ {formatFCFA(inlineBudget)}</motion.div>}

        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="overflow-hidden">
              <div className="pt-4 space-y-4">
                <BudgetFilter value={budgetMax} onChange={setBudgetMax} />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Quartier</p>
                  <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">{QUARTIERS.map((quartier) => <CategoryTag key={quartier} category={quartier} active={selectedQuartier === quartier} onClick={() => setSelectedQuartier(selectedQuartier === quartier ? null : quartier)} />)}</div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Cuisine</p>
                  <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">{TOP_CATEGORIES.map((category) => <CategoryTag key={category} category={category} active={selectedCategory === category} onClick={() => setSelectedCategory(selectedCategory === category ? null : category)} />)}</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="px-5 pt-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground"><motion.span key={results.length} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="inline-block font-semibold text-foreground">{results.length}</motion.span> restaurant{results.length !== 1 ? 's' : ''}{hasFilters && <button onClick={clearFilters} className="ml-2 text-primary text-xs font-medium">Effacer</button>}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {results.map((restaurant, index) => (
              <motion.div key={restaurant.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: Math.min(index * 0.02, 0.25) }}>
                <RestaurantCard restaurant={restaurant} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        {results.length === 0 && <div className="text-center py-20"><p className="text-4xl mb-3">🍽️</p><p className="text-muted-foreground font-medium">Aucun restaurant trouvé</p><p className="text-xs text-muted-foreground mt-1">Essaie d'élargir tes filtres</p></div>}
      </div>
    </div>
  );
};

export default SearchPage;
