/**
 * Photo resolution per restaurant:
 * 1. If a hero image exists in DB (restaurant_photos), use it (resolved by hook).
 * 2. Otherwise, deterministic Unsplash photo matched by:
 *    - explicit name override (curated for known venues),
 *    - cuisine category,
 *    - quartier hint (Almadies/Ngor → seaside, etc.).
 */

const POOLS: Record<string, string[]> = {
  senegalais: [
    'photo-1565299507177-b0ac66763828',
    'photo-1547592180-85f173990554',
    'photo-1604908176997-125f25cc6f3d',
  ],
  italien: [
    'photo-1481931098730-318b6f776db0',
    'photo-1574071318508-1cdbab80d002',
    'photo-1571997478779-2adcbbe9ab2f',
    'photo-1593504049359-74330189a345',
  ],
  pizza: [
    'photo-1574071318508-1cdbab80d002',
    'photo-1593504049359-74330189a345',
    'photo-1565299624946-b28f40a0ae38',
  ],
  japonais: [
    'photo-1579871494447-9811cf80d66c',
    'photo-1553621042-f6e147245754',
    'photo-1617196034796-73dfa7b1fd56',
  ],
  asiatique: [
    'photo-1525755662778-989d0524087e',
    'photo-1617196034796-73dfa7b1fd56',
    'photo-1582450871972-ab5ca641643d',
  ],
  chinois: [
    'photo-1582450871972-ab5ca641643d',
    'photo-1525755662778-989d0524087e',
  ],
  libanais: [
    'photo-1544025162-d76694265947',
    'photo-1559847844-5315695dadae',
    'photo-1540202404-1b927e27fa8b',
  ],
  francais: [
    'photo-1414235077428-338989a2e8c0',
    'photo-1559339352-11d035aa65de',
    'photo-1466978913421-dad2ebd01d17',
  ],
  seafood: [
    'photo-1559737558-2f5a35f4523b',
    'photo-1565680018434-b513d5e5fd47',
    'photo-1535140728325-a4d3707eee94',
  ],
  // NEW: oceanfront / beach restaurants (Almadies, Ngor, Lagon...)
  oceanfront: [
    'photo-1414235077428-338989a2e8c0', // beach terrace
    'photo-1507525428034-b723cf961d3e', // beach
    'photo-1519046904884-53103b34b206', // sea
    'photo-1535941339077-2dd1c7963098', // dock restaurant
    'photo-1502602898657-3e91760cbb34', // sea view
  ],
  burger: [
    'photo-1568901346375-23c9450c58cd',
    'photo-1571091718767-18b5b1457add',
    'photo-1550547660-d9450f859349',
  ],
  fastfood: [
    'photo-1550547660-d9450f859349',
    'photo-1568901346375-23c9450c58cd',
    'photo-1561758033-d89a9ad46330',
  ],
  grillade: [
    'photo-1544025162-d76694265947',
    'photo-1558030006-450675393462',
    'photo-1555939594-58d7cb561ad1',
  ],
  cafe: [
    'photo-1554118811-1e0d58224f24',
    'photo-1559925393-8be0ec4767c8',
    'photo-1453614512568-c4024d13c247',
  ],
  boulangerie: [
    'photo-1509440159596-0249088772ff',
    'photo-1567945716310-4745a6b7844b',
  ],
  africain: [
    'photo-1547592180-85f173990554',
    'photo-1604908176997-125f25cc6f3d',
    'photo-1559847844-5315695dadae',
  ],
  mexicain: [
    'photo-1565299585323-38d6b0865b47',
    'photo-1551504734-5ee1c4a1479b',
  ],
  indien: [
    'photo-1631452180519-c014fe946bc7',
    'photo-1585937421612-70a008356fbe',
  ],
  steakhouse: [
    'photo-1546964124-0cce460f38ef',
    'photo-1558030006-450675393462',
  ],
  // Fishing club / harbor vibe
  fishingclub: [
    'photo-1535941339077-2dd1c7963098',
    'photo-1559737558-2f5a35f4523b',
    'photo-1502602898657-3e91760cbb34',
  ],
  default: [
    'photo-1517248135467-4c7edcad34c4',
    'photo-1552566626-52f8b828add9',
    'photo-1414235077428-338989a2e8c0',
    'photo-1466978913421-dad2ebd01d17',
    'photo-1555396273-367ea4eb4db5',
  ],
};

/**
 * Hand-curated overrides for venues whose name implies a specific ambiance.
 * Matched as a case-insensitive substring on the restaurant name.
 */
const NAME_OVERRIDES: Array<{ match: RegExp; pool: keyof typeof POOLS }> = [
  { match: /pointe des almadies/i, pool: 'oceanfront' },
  { match: /lagon/i, pool: 'oceanfront' },
  { match: /\ble sud\b/i, pool: 'seafood' },
  { match: /club de p[eê]che|fishing/i, pool: 'fishingclub' },
  { match: /phare/i, pool: 'oceanfront' },
  { match: /plage|beach/i, pool: 'oceanfront' },
  { match: /sushi/i, pool: 'japonais' },
  { match: /pizz/i, pool: 'pizza' },
  { match: /burger/i, pool: 'burger' },
];

function pickPool(name: string, categories: string[], quartier?: string | null): string[] {
  // 1. Name override wins
  for (const { match, pool } of NAME_OVERRIDES) {
    if (match.test(name)) return POOLS[pool];
  }

  const text = categories.join(' ').toLowerCase();
  if (/sénégal|senegal|africain|thiéb|yassa/.test(text)) return POOLS.senegalais;
  if (/pizz/.test(text)) return POOLS.pizza;
  if (/itali/.test(text)) return POOLS.italien;
  if (/japon|sushi/.test(text)) return POOLS.japonais;
  if (/chinois/.test(text)) return POOLS.chinois;
  if (/asiatique|thai|viet/.test(text)) return POOLS.asiatique;
  if (/liban|moyen-orient/.test(text)) return POOLS.libanais;
  if (/français|francais|french/.test(text)) return POOLS.francais;
  if (/seafood|poisson|crustac|fruits de mer/.test(text)) return POOLS.seafood;
  if (/burger/.test(text)) return POOLS.burger;
  if (/fast/.test(text)) return POOLS.fastfood;
  if (/grill|barbec|braai/.test(text)) return POOLS.grillade;
  if (/café|cafe/.test(text)) return POOLS.cafe;
  if (/boulang/.test(text)) return POOLS.boulangerie;
  if (/mexic/.test(text)) return POOLS.mexicain;
  if (/indien|india/.test(text)) return POOLS.indien;
  if (/steak/.test(text)) return POOLS.steakhouse;

  // 2. Quartier hint (oceanfront neighborhoods)
  if (quartier && /almadies|ngor|yoff|virage|mamelle/i.test(quartier)) {
    return POOLS.oceanfront;
  }

  return POOLS.default;
}

function hash(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

export interface PhotoOptions {
  width?: number;
  height?: number;
}

/**
 * Deterministic, context-matched fallback image for a restaurant.
 * Backwards-compatible: if name/quartier are not supplied, falls back to category-only matching.
 */
export function getRestaurantImage(
  id: string,
  categories: string[],
  opts: PhotoOptions = {},
  name = '',
  quartier: string | null = null
): string {
  const pool = pickPool(name, categories, quartier);
  const photoId = pool[hash(id) % pool.length];
  const w = opts.width ?? 800;
  const h = opts.height ?? 500;
  return `https://images.unsplash.com/${photoId}?w=${w}&h=${h}&fit=crop&auto=format&q=75`;
}

/**
 * Build a small gallery (4 distinct images) for a restaurant detail view.
 */
export function getRestaurantGallery(
  id: string,
  categories: string[],
  count = 4,
  name = '',
  quartier: string | null = null
): string[] {
  const pool = pickPool(name, categories, quartier);
  const fallback = POOLS.default;
  const seen = new Set<string>();
  const result: string[] = [];
  let i = 0;
  const start = hash(id);
  while (result.length < count && i < 20) {
    const src = pool[(start + i) % pool.length] ?? fallback[(start + i) % fallback.length];
    if (!seen.has(src)) {
      seen.add(src);
      result.push(`https://images.unsplash.com/${src}?w=800&h=500&fit=crop&auto=format&q=75`);
    }
    i++;
  }
  let j = 0;
  while (result.length < count) {
    const src = fallback[(start + j) % fallback.length];
    if (!seen.has(src)) {
      seen.add(src);
      result.push(`https://images.unsplash.com/${src}?w=800&h=500&fit=crop&auto=format&q=75`);
    }
    j++;
  }
  return result;
}
