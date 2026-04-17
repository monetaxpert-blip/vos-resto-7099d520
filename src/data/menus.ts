/**
 * Indicative menu generator. Phase 1: deterministic mock menus per restaurant
 * based on cuisine categories. Prices in FCFA (integers).
 */
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  items: MenuItem[];
}

const TEMPLATES: Record<string, MenuCategory[]> = {
  Sénégalais: [
    {
      id: 'plats',
      name: 'Plats traditionnels',
      items: [
        { id: 'thieb', name: 'Thiéboudienne', description: 'Riz au poisson, légumes du jour, sauce tomate', price: 4500 },
        { id: 'yassa', name: 'Yassa Poulet', description: 'Poulet mariné aux oignons et citron, riz blanc', price: 4000 },
        { id: 'mafe', name: 'Mafé Bœuf', description: 'Sauce arachide onctueuse, viande tendre, riz', price: 4500 },
        { id: 'domoda', name: 'Domoda', description: 'Ragoût d\'arachide, viande, légumes', price: 4000 },
      ],
    },
    {
      id: 'grillades',
      name: 'Grillades',
      items: [
        { id: 'dibi', name: 'Dibi Mouton', description: 'Mouton grillé au feu de bois, oignons, moutarde', price: 6000 },
        { id: 'poisson', name: 'Poisson braisé', description: 'Daurade entière, attiéké, sauce piquante', price: 7500 },
      ],
    },
    {
      id: 'boissons',
      name: 'Boissons',
      items: [
        { id: 'bissap', name: 'Bissap', description: 'Hibiscus glacé, menthe fraîche', price: 1000 },
        { id: 'gingembre', name: 'Jus de gingembre', description: 'Gingembre frais pressé', price: 1500 },
      ],
    },
  ],
  Italien: [
    {
      id: 'pizzas',
      name: 'Pizzas',
      items: [
        { id: 'margherita', name: 'Margherita', description: 'Tomate San Marzano, mozzarella, basilic', price: 5500 },
        { id: 'parma', name: 'Parma', description: 'Jambon de Parme, roquette, parmesan', price: 8500 },
        { id: 'diavola', name: 'Diavola', description: 'Salami piquant, mozzarella, piment', price: 7000 },
      ],
    },
    {
      id: 'pates',
      name: 'Pâtes',
      items: [
        { id: 'carbo', name: 'Spaghetti Carbonara', description: 'Guanciale, pecorino, jaune d\'œuf', price: 6500 },
        { id: 'pesto', name: 'Linguine al Pesto', description: 'Basilic genovese, pignons, parmesan', price: 6000 },
      ],
    },
  ],
  Burgers: [
    {
      id: 'burgers',
      name: 'Burgers signature',
      items: [
        { id: 'classic', name: 'Classic Cheese', description: 'Steak 150g, cheddar, salade, tomate', price: 4500 },
        { id: 'bbq', name: 'BBQ Bacon', description: 'Steak, bacon, oignons frits, sauce BBQ', price: 5500 },
        { id: 'chicken', name: 'Crispy Chicken', description: 'Poulet pané, sauce épicée, coleslaw', price: 4000 },
      ],
    },
    {
      id: 'sides',
      name: 'Accompagnements',
      items: [
        { id: 'fries', name: 'Frites maison', description: 'Pommes fraîches, sel de mer', price: 2000 },
        { id: 'rings', name: 'Onion Rings', description: 'Beignets d\'oignons croustillants', price: 2500 },
      ],
    },
  ],
  Pizza: [
    {
      id: 'pizzas',
      name: 'Nos pizzas',
      items: [
        { id: 'reine', name: 'Reine', description: 'Tomate, mozzarella, jambon, champignons', price: 5500 },
        { id: '4f', name: '4 Fromages', description: 'Mozzarella, gorgonzola, chèvre, parmesan', price: 6500 },
        { id: 'fruits', name: 'Fruits de mer', description: 'Crevettes, calamars, moules, ail', price: 8500 },
      ],
    },
  ],
  Seafood: [
    {
      id: 'mer',
      name: 'Fruits de mer',
      items: [
        { id: 'plateau', name: 'Plateau royal', description: 'Huîtres, crevettes, langouste, citron', price: 25000 },
        { id: 'gambas', name: 'Gambas grillées', description: 'Gambas XL, ail, persil, riz pilaf', price: 12000 },
        { id: 'thiof', name: 'Thiof entier', description: 'Mérou local grillé, légumes vapeur', price: 9500 },
      ],
    },
  ],
  Libanais: [
    {
      id: 'mezze',
      name: 'Mezze',
      items: [
        { id: 'houmous', name: 'Houmous', description: 'Pois chiches, tahini, huile d\'olive', price: 2500 },
        { id: 'taboule', name: 'Taboulé', description: 'Persil, boulgour, tomate, citron', price: 2500 },
        { id: 'kebbe', name: 'Kebbé', description: 'Boulettes de boulgour farcies à la viande', price: 4500 },
      ],
    },
    {
      id: 'plats',
      name: 'Plats',
      items: [
        { id: 'chich', name: 'Chich Taouk', description: 'Brochettes de poulet mariné, riz, salade', price: 6500 },
        { id: 'mixed', name: 'Grill mixte', description: 'Assortiment de viandes grillées', price: 9500 },
      ],
    },
  ],
  Default: [
    {
      id: 'entrees',
      name: 'Entrées',
      items: [
        { id: 'salade', name: 'Salade du chef', description: 'Légumes frais, vinaigrette maison', price: 3000 },
        { id: 'soupe', name: 'Soupe du jour', description: 'Préparée chaque matin', price: 2500 },
      ],
    },
    {
      id: 'plats',
      name: 'Plats principaux',
      items: [
        { id: 'plat1', name: 'Plat du chef', description: 'Création du jour, à découvrir', price: 6500 },
        { id: 'plat2', name: 'Poisson grillé', description: 'Poisson frais, légumes de saison', price: 7500 },
        { id: 'plat3', name: 'Viande braisée', description: 'Viande tendre, sauce maison, riz', price: 6000 },
      ],
    },
    {
      id: 'desserts',
      name: 'Desserts',
      items: [
        { id: 'fruits', name: 'Salade de fruits', description: 'Fruits frais de saison', price: 2000 },
        { id: 'glace', name: 'Glace artisanale', description: 'Vanille, chocolat ou fraise', price: 2500 },
      ],
    },
  ],
};

export function getMenuForRestaurant(
  id: string,
  categories: string[]
): MenuCategory[] {
  const key = categories.find((c) => TEMPLATES[c]) ?? 'Default';
  const base = TEMPLATES[key] ?? TEMPLATES.Default;
  // Namespace ids per restaurant to avoid React key collisions
  return base.map((cat) => ({
    ...cat,
    id: `${id}-${cat.id}`,
    items: cat.items.map((it) => ({ ...it, id: `${id}-${cat.id}-${it.id}` })),
  }));
}
