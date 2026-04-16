

# Vos Resto — Premium Restaurant Discovery Web App (Phase 1)

## Overview
Build a stunning, mobile-first PWA for discovering restaurants in Dakar, Senegal. The uploaded Excel data (~190 restaurants) will be used as the initial dataset, embedded as static JSON data. The UI will match the premium Apple/Uber Eats aesthetic described in your brief.

## Data
- **Restaurants.xlsx**: 10 restaurants (detailed, with social media)
- **Restaurants_Dakar.xlsx**: 104 restaurants (by quartier: Almadies, Plateau, Mamelles, etc.)
- **Nouveaux_Restaurants_Dakar.xlsx**: 77 new restaurants (Plateau, Almadies, Gorée, etc.)
- Fields: name, address, city, quartier, lat/lng, phone, email, url, rating, rating_count, categories, social links

## What Gets Built (Phase 1 — Customer-Facing UI)

### 1. Data Layer
- Parse all 3 Excel files into a single typed JSON dataset
- Create TypeScript interfaces for Restaurant data
- Store as static data in `src/data/restaurants.ts`

### 2. Design System Update
- Premium color palette: warm neutrals + vibrant orange accent (matching your logo tones)
- Inter font family
- Custom CSS variables for glassmorphism, shadows, spacing
- Animation keyframes: fade-in, slide-up, scale, stagger, parallax, 3D tilt

### 3. Pages & Components

**Home Page (Immersive)**
- Hero section with parallax background, search bar with glassmorphism
- "Trending" horizontal scroll cards with 3D tilt on hover
- Category pills (Sénégalais, Italien, Fast Food, etc.) from real data
- "Top Rated" section with staggered fade-in
- Quartier explorer (Almadies, Plateau, Mamelles, etc.)

**Restaurant Detail Page**
- Full-width header with gradient overlay
- Rating badge, category tags, contact info
- Interactive map placeholder (lat/lng ready)
- Social media links
- Similar restaurants section

**Search & Filter Page**
- Autocomplete search
- Filter by: quartier, category, rating
- Animated result list with stagger

**Navigation**
- Bottom tab bar (mobile-first)
- Smooth page transitions

### 4. Premium Animations
- Spring-physics button interactions
- 3D card tilt on hover/scroll (CSS perspective transforms)
- Staggered list reveals
- Parallax hero scrolling
- Glassmorphism blur effects
- Skeleton loading states

### 5. Performance
- Memoized components
- Lazy image loading
- Virtualized lists for 190+ items
- 60fps CSS-only animations where possible

## Technical Approach
- React + Vite + TypeScript (existing stack)
- React Router for navigation
- TanStack Query for data layer (ready for future API)
- Tailwind CSS + custom animations
- Framer Motion for complex animations
- @react-three/fiber for 3D hero element (optional enhancement)
- No backend needed yet — static data from Excel files

## File Structure
```text
src/
  data/
    restaurants.ts          # Parsed restaurant data
    types.ts                # TypeScript interfaces
  pages/
    Index.tsx               # Home page
    RestaurantDetail.tsx    # Detail page
    Search.tsx              # Search + filters
  components/
    layout/
      BottomNav.tsx
      Header.tsx
    home/
      HeroSection.tsx
      TrendingCards.tsx
      CategoryPills.tsx
      TopRated.tsx
      QuartierExplorer.tsx
    restaurant/
      RestaurantCard.tsx    # 3D tilt card
      RatingBadge.tsx
      CategoryTag.tsx
    search/
      SearchBar.tsx
      FilterPanel.tsx
    animations/
      ParallaxWrapper.tsx
      StaggerList.tsx
      TiltCard.tsx
```

## Not Included in Phase 1
- Backend/database (future: Supabase)
- Authentication
- Reservations
- Admin dashboard
- Payment integration
- Push notifications

These will be added in subsequent phases once the UI foundation is solid.

