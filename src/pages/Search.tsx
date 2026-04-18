import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search as SearchIcon, X, SlidersHorizontal, Map as MapIcon } from 'lucide-react';
import { restaurants } from '@/data/restaurants';
import { searchRestaurants } from '@/data/queries';
import { QUARTIERS, TOP_CATEGORIES } from '@/data/types';
import { deriveAveragePrice } from '@/lib/format';
import RestaurantCard from '@/components/restaurant/RestaurantCard';
import CategoryTag from '@/components/restaurant/CategoryTag';
import BudgetFilter from '@/components/search/BudgetFilter';

const BUDGET_BOUNDS: [number, number] = [1000, 30000];

const SearchPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [selectedQuartier, setSelectedQuartier] = useState<string | null>(searchParams.get('quartier'));
  const [selectedCategory, setSelectedCategory] = useState<string | null>(searchParams.get('category'));
  const [budget, setBudget] = useState<[number, number]>(BUDGET_BOUNDS);
  const [showFilters, setShowFilters] = useState(!!searchParams.get('quartier') || !!searchParams.get('category'));

  useEffect(() => {
    const q = searchParams.get('quartier');
    const c = searchParams.get('category');
    if (q) { setSelectedQuartier(q); setShowFilters(true); }
    if (c) { setSelectedCategory(c); setShowFilters(true); }
  }, [searchParams]);

  // Pre-compute average prices once for performance
  const priceMap = useMemo(() => {
    const map = new Map<string, number>();
    restaurants.forEach(r => map.set(r.id, deriveAveragePrice(r.priceLevel, r.categories, r.id)));
    return map;
  }, []);

  const budgetActive = budget[0] !== BUDGET_BOUNDS[0] || budget[1] !== BUDGET_BOUNDS[1];

  const results = useMemo(() => {
    let list = restaurants;

    if (query.trim()) list = searchRestaurants(query);
    if (selectedQuartier) list = list.filter(r => r.quartier === selectedQuartier);
    if (selectedCategory) {
      list = list.filter(r =>
        r.categories.some(c => c.toLowerCase().includes(selectedCategory!.toLowerCase()))
      );
    }
    if (budgetActive) {
      list = list.filter(r => {
        const p = priceMap.get(r.id) ?? 0;
        return p >= budget[0] && p <= budget[1];
      });
    }

    return list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }, [query, selectedQuartier, selectedCategory, budget, priceMap, budgetActive]);

  const clearFilters = () => {
    setSelectedQuartier(null);
    setSelectedCategory(null);
    setBudget(BUDGET_BOUNDS);
    setQuery('');
  };

  const hasFilters = selectedQuartier || selectedCategory || query || budgetActive;

  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Search header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50 px-5 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <SearchIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Restaurant, cuisine, quartier..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full h-11 rounded-xl bg-secondary pl-10 pr-10 text-sm font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X size={16} className="text-muted-foreground" />
              </button>
            )}
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowFilters(!showFilters)}
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors
              ${showFilters ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'}`}
          >
            <SlidersHorizontal size={18} />
          </motion.button>
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="overflow-hidden"
            >
              <div className="pt-4 space-y-4">
                <BudgetFilter
                  min={budget[0]}
                  max={budget[1]}
                  bounds={BUDGET_BOUNDS}
                  onChange={setBudget}
                />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Quartier</p>
                  <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                    {QUARTIERS.map(q => (
                      <CategoryTag
                        key={q}
                        category={q}
                        active={selectedQuartier === q}
                        onClick={() => setSelectedQuartier(selectedQuartier === q ? null : q)}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Cuisine</p>
                  <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                    {TOP_CATEGORIES.map(c => (
                      <CategoryTag
                        key={c}
                        category={c}
                        active={selectedCategory === c}
                        onClick={() => setSelectedCategory(selectedCategory === c ? null : c)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Results */}
      <div className="px-5 pt-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            <motion.span
              key={results.length}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-block font-semibold text-foreground"
            >
              {results.length}
            </motion.span>{' '}
            {budgetActive ? 'restaurants selon ton budget' : `restaurant${results.length !== 1 ? 's' : ''}`}
            {hasFilters && (
              <button onClick={clearFilters} className="ml-2 text-primary text-xs font-medium">
                Effacer
              </button>
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {results.map((r, i) => (
              <motion.div
                key={r.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: Math.min(i * 0.02, 0.25) }}
              >
                <RestaurantCard restaurant={r} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {results.length === 0 && (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">🍽️</p>
            <p className="text-muted-foreground font-medium">Aucun restaurant trouvé</p>
            <p className="text-xs text-muted-foreground mt-1">Essayez d'élargir votre budget ou vos filtres</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
