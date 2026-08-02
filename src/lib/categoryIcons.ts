import {
  Beef,
  Beer,
  Cake,
  ChefHat,
  Coffee,
  Croissant,
  Drumstick,
  Fish,
  Flame,
  Globe,
  Pizza,
  Salad,
  Sandwich,
  Soup,
  UtensilsCrossed,
  Wheat,
  type LucideIcon,
} from 'lucide-react';

/**
 * Icônes vectorielles par catégorie.
 * Remplace les emojis drapeaux qui s'affichaient en carrés "tofu" sur Windows/Android.
 */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'Sénégalais': Soup,
  'Italien': Pizza,
  'Fast Food': Sandwich,
  'Français': ChefHat,
  'Seafood': Fish,
  'Libanais': Salad,
  'Asiatique': Wheat,
  'Burgers': Sandwich,
  'Pizza': Pizza,
  'Pizzeria': Pizza,
  'Africain': Globe,
  'Grillades': Flame,
  'Café/Restaurant': Coffee,
  'Japonais': Fish,
  'Chinois': Soup,
  'Mexicain': Drumstick,
  'Boulangerie': Croissant,
  'Indien': Soup,
  'Steakhouse': Beef,
  'Plage': Beer,
  'Pâtisserie': Cake,
};

export const getCategoryIcon = (category: string): LucideIcon =>
  CATEGORY_ICONS[category] ?? UtensilsCrossed;
