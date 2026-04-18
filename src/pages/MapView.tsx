import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { restaurants } from '@/data/restaurants';
import { TOP_CATEGORIES } from '@/data/types';
import AllRestaurantsMap from '@/components/map/AllRestaurantsMap';
import CategoryTag from '@/components/restaurant/CategoryTag';

const MapView = () => {
  const navigate = useNavigate();
  const [category, setCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!category) return restaurants;
    return restaurants.filter((r) =>
      r.categories.some((c) => c.toLowerCase().includes(category.toLowerCase()))
    );
  }, [category]);

  const withCoords = filtered.filter((r) => r.lat && r.lng).length;

  return (
    <div className="fixed inset-0 bg-background flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-12 pb-3 bg-background/95 backdrop-blur-md border-b border-border z-10">
        <div className="flex items-center gap-3 mb-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
            aria-label="Retour"
          >
            <ArrowLeft size={20} />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-lg font-extrabold leading-tight">Carte</h1>
            <p className="text-xs text-muted-foreground">
              {withCoords} restaurant{withCoords > 1 ? 's' : ''} géolocalisé{withCoords > 1 ? 's' : ''}
            </p>
          </div>
          {category && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setCategory(null)}
              className="rounded-full bg-secondary px-3 py-1.5 text-xs font-medium flex items-center gap-1"
            >
              <X size={12} /> {category}
            </motion.button>
          )}
        </div>
        <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-1 px-1 pb-1">
          {TOP_CATEGORIES.slice(0, 10).map((c) => (
            <CategoryTag
              key={c}
              category={c}
              active={category === c}
              onClick={() => setCategory(category === c ? null : c)}
            />
          ))}
        </div>
      </div>

      {/* Map fills remaining space */}
      <div className="flex-1 relative">
        <AllRestaurantsMap restaurants={filtered} />
      </div>
    </div>
  );
};

export default MapView;
