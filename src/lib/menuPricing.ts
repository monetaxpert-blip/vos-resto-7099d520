import { restaurants } from '@/data/restaurants';
import { getMenuForRestaurant } from '@/data/menus';

/**
 * Cheapest main item across the restaurant's menu (FCFA).
 * Used to know if a restaurant fits within a user's stated budget.
 * Memoized per restaurant id.
 */
const cheapestCache = new Map<string, number>();

export function getCheapestItemPrice(restaurantId: string): number {
  if (cheapestCache.has(restaurantId)) return cheapestCache.get(restaurantId)!;
  const r = restaurants.find((x) => x.id === restaurantId);
  if (!r) return 0;
  const menu = getMenuForRestaurant(r.id, r.categories);
  let min = Infinity;
  for (const cat of menu) {
    for (const item of cat.items) {
      if (item.price < min) min = item.price;
    }
  }
  const value = isFinite(min) ? min : 0;
  cheapestCache.set(restaurantId, value);
  return value;
}

/**
 * Most expensive main item across the restaurant's menu (FCFA).
 */
const maxCache = new Map<string, number>();

export function getMaxItemPrice(restaurantId: string): number {
  if (maxCache.has(restaurantId)) return maxCache.get(restaurantId)!;
  const r = restaurants.find((x) => x.id === restaurantId);
  if (!r) return 0;
  const menu = getMenuForRestaurant(r.id, r.categories);
  let max = 0;
  for (const cat of menu) {
    for (const item of cat.items) {
      if (item.price > max) max = item.price;
    }
  }
  maxCache.set(restaurantId, max);
  return max;
}

/**
 * "Fits in budget" means: the user's budget is enough for at least one main course.
 * We compare against the cheapest item to be inclusive (a 5000 F budget can eat at
 * a 5500 F average resto if a 4000 F dish exists).
 */
export function restaurantFitsBudget(restaurantId: string, budget: number): boolean {
  return getCheapestItemPrice(restaurantId) <= budget;
}
