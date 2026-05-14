# Vos Resto — Plan Production-Ready (Stabilité d'abord)

## Principe directeur
Aucune nouvelle feature tant que l'architecture n'est pas solide. On livre par **lots atomiques testables**, chacun vérifié avant le suivant. Pas de hack, pas de patch local — refactor à la racine.

---

## LOT 1 — Fondations stabilité (à faire MAINTENANT)
Objectif : zéro crash, zéro écran blanc, états cohérents partout.

**Couche données centralisée**
- Créer `src/lib/queryClient.ts` avec retry (2x, backoff), staleTime 30s, timeout 10s
- Migrer `useDBRestaurants` + `useRestaurantById` vers React Query (`useQuery`) → cache, retry, dedup automatiques
- Idem pour `useRestaurantMenu`, `useRestaurantPhotos`, `useRestaurantReviews`, `useFavorites`, `useNotifications`, `useReservations`, `useOwnerReservations`, `useRestaurantStats`, `useRestaurantOffers`, `useOwnership`
- Supprimer tout `setState` manuel + `useEffect` de fetch dans les hooks

**UI states standardisés**
- `src/components/ui/QueryState.tsx` : composant `<QueryState loading error empty>` réutilisable (skeleton, message d'erreur + retry, empty state)
- Appliquer sur Index, Search, RestaurantDetail, Favorites, Dashboard, Admin*

**Erreurs visibles**
- ErrorBoundary déjà en place → ajouter logging structuré (`console.error('[scope]', err)`) + bouton retry
- Toast d'erreur Supabase systématique (jamais d'erreur silencieuse)

**Nettoyage**
- Supprimer `src/data/restaurants.ts` (statique) si plus utilisé après migration
- Supprimer realtime restant non critique
- Auditer tous les `useEffect` à dépendances suspectes (boucles, fetch non-mémoïsés)

## LOT 2 — RBAC durcissement
- Audit `RoleRouter` : couvrir toutes les routes, gérer cas `loading` proprement (éviter flash)
- `OwnerGuard` + nouveau `ClientGuard` (bloque owners sur routes client)
- Vérifier RLS Supabase via linter, corriger warnings
- Tests manuels matrice : client / owner / admin × chaque route

## LOT 3 — Onboarding restaurateur (Wizard + autosave)
- Refacto `RestaurantOnboarding` → wizard 5 étapes : Infos → Localisation → Menus → Photos → Preview
- Persistance brouillon : `localStorage` clé `onboarding-draft-{userId}` à chaque changement
- Reprise automatique au retour
- Validation Zod par étape, navigation bloquée tant qu'invalide
- Publication finale via RPC existante `create_restaurant_with_owner` étendue (logo, banner, hours)

## LOT 4 — Recherche & filtres propres
- Sticky filter bar avec `z-index` correct, pas d'overlap
- Filtres : quartier, cuisine, budget, note, proximité (proximité = lot 6)
- Mobile-first, scroll clean
- Composant `BudgetFilter` déjà existant → intégrer

## LOT 5 — Commandes (orders)
- Migration : `orders`, `order_items` + RLS (client voit ses commandes, owner voit celles de ses restos)
- Cart context client + checkout
- Dashboard owner : liste + statuts (pending → accepted → preparing → ready → delivered / refused)
- Notification trigger sur nouvelle commande

## LOT 6 — GPS & cartes (après stabilité)
- `useGeolocation` propre, "Autour de moi", distances Haversine, fallback safe

## LOT 7 — Performance
- Lazy loading routes (`React.lazy`), images (`loading="lazy"`), pagination listes longues, SEO/meta

## LOT 8 — Sécurité finale
- Validation Zod systématique sur tous les forms, rate limiting RPC, audit RLS final, upload sécurisé (taille/type)

---

## Détails techniques clés

**Pourquoi React Query partout**
- Retry + backoff natifs → règle "fetch instables" + "loading infinis"
- Cache + dedup → règle "états incohérents" + perfs
- `isLoading` / `isError` / `data` standardisés → règle "loading states propres"
- `invalidateQueries` après mutation → règle "données cohérentes" sans realtime

**Pourquoi pas tout d'un coup**
Lot 1 seul touche ~15 fichiers (hooks + pages). Tout livrer d'un bloc = exactement le risque que tu veux éviter. Chaque lot est indépendamment testable et déployable.

---

## Démarrage proposé
**Lot 1 maintenant** (fondations React Query + QueryState + nettoyage hooks). C'est le socle de tout le reste — sans ça, les lots suivants resteraient fragiles.

Confirme et je démarre le Lot 1, ou indique si tu veux réordonner (ex: "lot 3 d'abord car onboarding bloque mes restaurateurs pilotes").