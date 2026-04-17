/**
 * Format prices in FCFA (XOF) using French locale.
 * Examples: 3500 -> "3 500 F", 10000 -> "10 000 F"
 */
const formatter = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 0,
  useGrouping: true,
});

export function formatFCFA(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '—';
  return `${formatter.format(Math.round(amount))} F`;
}

export function formatBudgetRange(min: number, max: number): string {
  return `Entre ${formatFCFA(min)} et ${formatFCFA(max)}`;
}

/**
 * Derive an indicative average price (FCFA) from priceLevel + categories.
 * Used as a deterministic fallback since the dataset has no exact prices.
 */
export function deriveAveragePrice(
  priceLevel: string | null,
  categories: string[],
  id: string
): number {
  // Base bands by Google price level
  const bands: Record<string, [number, number]> = {
    '€': [2000, 4000],
    '€€': [5000, 9000],
    '€€€': [12000, 20000],
    '€€€€': [25000, 45000],
    $: [2000, 4000],
    $$: [5000, 9000],
    $$$: [12000, 20000],
    $$$$: [25000, 45000],
  };
  let band: [number, number] = bands[priceLevel ?? ''] ?? [4000, 8000];

  // Cuisine-based adjustment
  const cats = categories.map((c) => c.toLowerCase()).join(' ');
  if (/(japonais|sushi|steakhouse|français|libanais|seafood)/.test(cats)) {
    band = [Math.max(band[0], 8000), Math.max(band[1], 18000)];
  } else if (/(fast food|burger|pizza|boulangerie|café)/.test(cats)) {
    band = [Math.min(band[0], 2500), Math.min(band[1], 6000)];
  }

  // Deterministic value within the band based on id
  const seed = parseInt(id, 10) || id.length;
  const ratio = ((seed * 9301 + 49297) % 233280) / 233280; // 0..1
  const raw = band[0] + ratio * (band[1] - band[0]);
  // Round to nearest 500 F for clean display
  return Math.round(raw / 500) * 500;
}

/**
 * Haversine distance in km between two coordinates.
 */
export function distanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export function estimateDriveMinutes(km: number): number {
  // ~25 km/h average urban Dakar
  return Math.max(1, Math.round((km / 25) * 60));
}
