import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';
import { restaurants } from '@/data/restaurants';
import RestaurantCard from '@/components/restaurant/RestaurantCard';

const Favorites = () => {
  // Phase 1: no persistence, just show empty state
  return (
    <div className="min-h-screen pb-24 bg-background pt-14 px-5">
      <h1 className="text-2xl font-extrabold mb-6">Favoris</h1>
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Heart size={32} className="text-primary" />
        </div>
        <p className="font-semibold text-lg">Pas encore de favoris</p>
        <p className="text-sm text-muted-foreground mt-1 text-center max-w-xs">
          Explorez les restaurants et ajoutez vos préférés ici
        </p>
      </div>
    </div>
  );
};

export default Favorites;
