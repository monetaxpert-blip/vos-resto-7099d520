import type { OpeningHours, OpeningHoursDay, Restaurant } from '@/data/types';

export const DEFAULT_OPENING_HOURS: OpeningHours = {
  monday: { open: true, start: '12:00', end: '22:00' },
  tuesday: { open: true, start: '12:00', end: '22:00' },
  wednesday: { open: true, start: '12:00', end: '22:00' },
  thursday: { open: true, start: '12:00', end: '22:00' },
  friday: { open: true, start: '12:00', end: '23:00' },
  saturday: { open: true, start: '12:00', end: '23:00' },
  sunday: { open: true, start: '12:00', end: '22:00' },
};

export const DAYS: Array<{ key: keyof OpeningHours; label: string }> = [
  { key: 'monday', label: 'Lundi' },
  { key: 'tuesday', label: 'Mardi' },
  { key: 'wednesday', label: 'Mercredi' },
  { key: 'thursday', label: 'Jeudi' },
  { key: 'friday', label: 'Vendredi' },
  { key: 'saturday', label: 'Samedi' },
  { key: 'sunday', label: 'Dimanche' },
];

export const CUISINE_OPTIONS = [
  'Sénégalais',
  'Chinois',
  'Libanais',
  'Italien',
  'Mexicain',
  'Café',
  'Brunch',
  'Fast-food',
  'Grillades',
] as const;

export const QUARTIER_OPTIONS = [
  'Almadies',
  'Plateau',
  'Point E',
  'Mermoz',
  'Sacré-Cœur',
  'Liberté',
  'Yoff',
  'Ouakam',
] as const;

// Villes couvertes par la plateforme — pensé national, extensible.
export const CITY_OPTIONS = [
  'Dakar',
  'Thiès',
  'Saint-Louis',
  'Mbour',
  'Saly',
  'Kaolack',
  'Ziguinchor',
  'Touba',
  'Diourbel',
  'Rufisque',
  'Tambacounda',
  'Louga',
  'Fatick',
  'Kolda',
  'Matam',
  'Kédougou',
  'Sédhiou',
  'Kaffrine',
] as const;

export const PRICE_RANGE_OPTIONS = ['Économique', 'Standard', 'Premium', 'Luxe'] as const;

export function normalizePhone(phone?: string | null) {
  return phone ? phone.replace(/\D/g, '') : '';
}

export function buildWhatsAppLink(phone?: string | null, restaurantName?: string) {
  const number = normalizePhone(phone);
  if (!number) return '';
  const text = encodeURIComponent(`Bonjour je souhaite réserver chez ${restaurantName ?? 'votre restaurant'}`);
  return `https://wa.me/${number}?text=${text}`;
}

export function normalizeOpeningHours(value: unknown): OpeningHours {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return DEFAULT_OPENING_HOURS;
  const source = value as Record<string, Partial<OpeningHoursDay>>;
  const result = { ...DEFAULT_OPENING_HOURS } as OpeningHours;
  for (const day of DAYS) {
    const entry = source[day.key];
    if (entry && typeof entry === 'object') {
      result[day.key] = {
        open: typeof entry.open === 'boolean' ? entry.open : DEFAULT_OPENING_HOURS[day.key].open,
        start: typeof entry.start === 'string' && entry.start ? entry.start : DEFAULT_OPENING_HOURS[day.key].start,
        end: typeof entry.end === 'string' && entry.end ? entry.end : DEFAULT_OPENING_HOURS[day.key].end,
      };
    }
  }
  return result;
}

export function getRestaurantCoords(restaurant: Restaurant) {
  return {
    lat: restaurant.latitude ?? restaurant.lat ?? null,
    lng: restaurant.longitude ?? restaurant.lng ?? null,
  };
}

export function getOpenStatus(openingHours?: OpeningHours | null, now = new Date()) {
  const hours = normalizeOpeningHours(openingHours);
  const dayIndex = (now.getDay() + 6) % 7;
  const day = DAYS[dayIndex].key;
  const slot = hours[day];
  if (!slot.open) return { isOpen: false, label: 'Fermé aujourd’hui' };
  const current = now.getHours() * 60 + now.getMinutes();
  const [startH, startM] = slot.start.split(':').map(Number);
  const [endH, endM] = slot.end.split(':').map(Number);
  const start = startH * 60 + startM;
  const end = endH * 60 + endM;
  const isOpen = current >= start && current <= end;
  return {
    isOpen,
    label: isOpen ? `Ouvert maintenant · jusqu’à ${slot.end}` : `Fermé · ouvre à ${slot.start}`,
  };
}

export function formatOpeningHours(openingHours?: OpeningHours | null) {
  const hours = normalizeOpeningHours(openingHours);
  return DAYS.map(({ key, label }) => {
    const slot = hours[key];
    return `${label} · ${slot.open ? `${slot.start} - ${slot.end}` : 'Fermé'}`;
  });
}
