import { restaurants } from './restaurants';
import { Restaurant } from './types';

export function getTopRated(limit = 10): Restaurant[] {
  return [...restaurants]
    .filter(r => r.rating !== null && r.ratingCount >= 10)
    .sort((a, b) => (b.rating! * Math.log(b.ratingCount + 1)) - (a.rating! * Math.log(a.ratingCount + 1)))
    .slice(0, limit);
}

export function getTrending(limit = 10): Restaurant[] {
  return [...restaurants]
    .filter(r => r.ratingCount >= 50)
    .sort((a, b) => b.ratingCount - a.ratingCount)
    .slice(0, limit);
}

export function getByQuartier(quartier: string): Restaurant[] {
  return restaurants.filter(r => r.quartier === quartier);
}

export function getByCategory(category: string): Restaurant[] {
  return restaurants.filter(r =>
    r.categories.some(c => c.toLowerCase().includes(category.toLowerCase()))
  );
}

export function searchRestaurants(query: string): Restaurant[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return restaurants.filter(r =>
    r.name.toLowerCase().includes(q) ||
    r.categories.some(c => c.toLowerCase().includes(q)) ||
    (r.quartier && r.quartier.toLowerCase().includes(q)) ||
    (r.address && r.address.toLowerCase().includes(q))
  );
}

export function getRestaurantById(id: string): Restaurant | undefined {
  return restaurants.find(r => r.id === id);
}

export function getSimilarRestaurants(restaurant: Restaurant, limit = 6): Restaurant[] {
  return restaurants
    .filter(r => r.id !== restaurant.id)
    .map(r => {
      let score = 0;
      if (r.quartier && r.quartier === restaurant.quartier) score += 3;
      const sharedCats = r.categories.filter(c => restaurant.categories.includes(c));
      score += sharedCats.length * 2;
      if (r.priceLevel === restaurant.priceLevel) score += 1;
      return { restaurant: r, score };
    })
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(r => r.restaurant);
}

export function getQuartierCounts(): { name: string; count: number }[] {
  const counts: Record<string, number> = {};
  restaurants.forEach(r => {
    if (r.quartier) {
      counts[r.quartier] = (counts[r.quartier] || 0) + 1;
    }
  });
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}
