export interface SocialMedia {
  facebook: string | null;
  instagram: string | null;
  twitter: string | null;
  youtube: string | null;
}

export interface Restaurant {
  id: string;
  name: string;
  address: string | null;
  quartier: string | null;
  city: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  lat: number | null;
  lng: number | null;
  rating: number | null;
  ratingCount: number;
  categories: string[];
  priceLevel: string | null;
  hours: string | null;
  placeId: string | null;
  socialMedia: SocialMedia | null;
}

export const QUARTIERS = [
  'Almadies', 'Corniche', 'Fann', 'Gorée', 'Guédiawaye', 'HLM',
  'Keur Gorgui', 'Liberté', 'Mamelles', 'Mermoz', 'Médina', 'Ngor',
  'Ouakam', 'Parcelles Assainies', 'Pikine', 'Plateau', 'Point E',
  'Sacré-Cœur', 'Yoff'
] as const;

export const TOP_CATEGORIES = [
  'Sénégalais', 'Italien', 'Fast Food', 'Français', 'Seafood',
  'Libanais', 'Asiatique', 'Burgers', 'Pizza', 'Africain',
  'Grillades', 'Café/Restaurant', 'Japonais', 'Chinois', 'Mexicain'
] as const;

export const CATEGORY_EMOJIS: Record<string, string> = {
  'Sénégalais': '🇸🇳',
  'Italien': '🇮🇹',
  'Fast Food': '🍔',
  'Français': '🇫🇷',
  'Seafood': '🦐',
  'Libanais': '🇱🇧',
  'Asiatique': '🥢',
  'Burgers': '🍔',
  'Pizza': '🍕',
  'Africain': '🌍',
  'Grillades': '🔥',
  'Café/Restaurant': '☕',
  'Japonais': '🇯🇵',
  'Chinois': '🥟',
  'Mexicain': '🌮',
  'Pizzeria': '🍕',
  'Boulangerie': '🥖',
  'Indien': '🇮🇳',
  'Steakhouse': '🥩',
  'Plage': '🏖️',
};
