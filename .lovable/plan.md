## Vos Resto — Stabilization & Demo-Ready Plan

This is a large, multi-area request (13 phases). Rather than touching everything blindly and risking breakage, I propose to ship it in **focused, verifiable batches**. Each batch is independently testable so we never regress between sessions.

### Batch A — Stability & "Restaurant introuvable" (PHASE 1, 2, 11)
- Remove non-critical realtime in `useDBRestaurants` → manual fetch + `refresh()` exposed.
- New dedicated hook `useRestaurantById(id)` doing a **single targeted query** (`.eq('id', id).maybeSingle()`) with `loading` / `error` / `retry` — no list dependency.
- `RestaurantDetail.tsx`: drop static fallbacks (`getStaticRestaurantById`, `getStaticSimilar`), add proper Loading skeleton + "Restaurant indisponible" empty state.
- Add global `<ErrorBoundary>` in `App.tsx`.
- Audit `useEffect` deps in Home/Search/Detail/Dashboard/Onboarding for loops.

### Batch B — Owner isolation (PHASE 8)
- Promote `OwnerGuard` logic into a top-level `RoleRouter` that, when `isRestaurantOwner && !isAdmin`, force-redirects `/`, `/search`, `/favorites`, `/restaurant/:id` → `/restaurant/dashboard`.
- Remove "Réclamer un restaurant" mode from `RestaurantOnboarding`.

### Batch C — Search UX + Budget filter (PHASE 3, 4)
- Rebuild Search filter bar: sticky, proper `z-index`, spacing, no overlap with cards.
- Add Budget filter (`<3000`, `3–7k`, `7–15k`, `15k+`) wired to `average_price` on Home, Search, "Around me".

### Batch D — Geolocation & "Autour de moi" & GPS premium (PHASE 5, 7, 13)
- New `useGeolocation` hook (`enableHighAccuracy`, timeout 10s, refusal handling).
- "📍 Autour de moi" button + Haversine sort + distance labels ("1.2 km", "500 m").
- Onboarding: remove manual lat/lng inputs (already absent in form, but ensure DB-level `latitude`/`longitude` are set via "Use my position" + reverse geocoding using free Nominatim).
- Premium route button already exists (`RouteButton.tsx`) — polish info line + ensure it works without coords (search-by-name fallback already in place).
- Map view: ensure user position marker + auto-zoom + smooth route line.

### Batch E — Simplified onboarding (PHASE 6)
- Multi-step guided wizard: Account → Restaurant basics → Logo/banner/photos → Menu → Hours → WhatsApp → Categories → Avg price.

### Batch F — Order system (PHASE 9)
- Migration: `orders`, `order_items` tables with proper RLS (client owns their orders, restaurant owner sees orders for their restaurants).
- Client cart context, "Add to cart", "Order via WhatsApp" + order record.
- Owner dashboard: orders list with accept/refuse/preparing/ready/delivered statuses.

### Batch G — Auth hardening (PHASE 10)
- Anti double-submit guards, retry on transient signup errors, real toast messages, auto-login confirmed.

---

### Why batches
Phases 6, 9, 13 alone each represent multi-file, schema-touching features (~10+ files each). Cramming all 13 into one response risks introducing the exact bugs you're asking me to fix. Each batch above is ~2–4 files plus optional migration, fully testable, and won't break existing flows.

### My proposal
**Start with Batch A + B + the realtime removal** in this turn — these are the actual blockers ("écran blanc", "Restaurant introuvable", owners seeing public pages, React crashes). Then we ship C → G in subsequent turns.

If you confirm, I'll execute Batch A + B immediately. Otherwise tell me which batch to prioritize (e.g. "skip to orders" or "do GPS premium first") and I'll reorder.
