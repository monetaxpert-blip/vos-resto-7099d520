import { useCallback, useMemo } from 'react';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Restaurant } from '@/data/types';

export interface DBRestaurant extends Restaurant {
  isActive: boolean;
  isFeatured: boolean;
  isPinned: boolean;
  displayOrder: number;
  badges: string[];
  adminPlan: 'Standard' | 'Premium' | 'Elite';
}

interface RawRow {
  id: string;
  name: string;
  address?: string | null;
  quartier: string | null;
  city: string;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  lat?: number | null;
  lng?: number | null;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  rating_count: number;
  categories: string[];
  price_level: string | null;
  hours?: string | null;
  place_id?: string | null;
  social_media?: { facebook?: string | null; instagram?: string | null; twitter?: string | null; youtube?: string | null } | null;
  is_active: boolean;
  is_featured: boolean;
  is_pinned: boolean;
  display_order: number;
  badges: string[];
  admin_plan: 'Standard' | 'Premium' | 'Elite';
  profile_image: string | null;
  banner_image: string | null;
  hero_photo_url?: string | null;
  description: string | null;
  whatsapp_number: string | null;
  whatsapp_link: string | null;
  average_price: number | null;
  price_range: string | null;
  cuisine_type: string | null;
  address_detail?: string | null;
  opening_hours: Record<string, unknown> | null;
}

/**
 * Columns needed to render a restaurant card / search filter / map pin.
 * Heavy or detail-only columns (social_media, hours, place_id, timestamps…)
 * are intentionally excluded from list queries.
 */
const LIST_COLUMNS = [
  'id', 'name', 'address', 'quartier', 'city', 'phone',
  'latitude', 'longitude', 'lat', 'lng',
  'rating', 'rating_count', 'categories', 'price_level',
  'is_active', 'is_featured', 'is_pinned', 'display_order', 'badges', 'admin_plan',
  'profile_image', 'banner_image', 'hero_photo_url', 'description',
  'whatsapp_number', 'whatsapp_link', 'average_price', 'price_range', 'cuisine_type',
  'opening_hours',
].join(', ');

const mapRow = (r: RawRow): DBRestaurant => ({
  id: r.id,
  name: r.name,
  address: r.address ?? null,
  quartier: r.quartier,
  city: r.city,
  phone: r.phone ?? null,
  email: r.email ?? null,
  website: r.website ?? null,
  lat: r.latitude ?? r.lat ?? null,
  lng: r.longitude ?? r.lng ?? null,
  latitude: r.latitude ?? r.lat ?? null,
  longitude: r.longitude ?? r.lng ?? null,
  rating: r.rating,
  ratingCount: r.rating_count,
  categories: r.categories ?? [],
  priceLevel: r.price_level,
  hours: r.hours ?? null,
  placeId: r.place_id ?? null,
  socialMedia: r.social_media
    ? {
        facebook: r.social_media.facebook ?? null,
        instagram: r.social_media.instagram ?? null,
        twitter: r.social_media.twitter ?? null,
        youtube: r.social_media.youtube ?? null,
      }
    : null,
  profileImage: r.profile_image,
  bannerImage: r.banner_image,
  heroPhotoUrl: r.hero_photo_url ?? null,
  description: r.description,
  whatsappNumber: r.whatsapp_number,
  whatsappLink: r.whatsapp_link,
  averagePrice: r.average_price,
  priceRange: r.price_range,
  cuisineType: r.cuisine_type,
  addressDetail: r.address_detail ?? null,
  openingHours: (r.opening_hours as unknown as import('@/data/types').OpeningHours) ?? undefined,
  isActive: r.is_active,
  isFeatured: r.is_featured,
  isPinned: r.is_pinned,
  displayOrder: r.display_order,
  badges: r.badges ?? [],
  adminPlan: r.admin_plan,
});

/** Same ordering as before — now backed by idx_restaurants_public_sort. */
const applySort = <T>(q: T): T =>
  (q as never as {
    order: (c: string, o: { ascending: boolean }) => T;
  })
    .order('is_pinned', { ascending: false })
    .order('is_featured', { ascending: false })
    .order('display_order', { ascending: false })
    .order('rating_count', { ascending: false })
    .order('id', { ascending: true } as never) as T;

const fetchRestaurantsPage = async (
  adminMode: boolean,
  pageSize: number,
  pageParam: number
): Promise<{ rows: DBRestaurant[]; total: number | null; nextOffset: number | null }> => {
  // Trial expiry runs server-side via a scheduled job (pg_cron, every 15 min).
  let query = supabase
    .from('restaurants')
    .select(adminMode ? '*' : LIST_COLUMNS, { count: 'exact' });
  if (!adminMode) query = query.eq('is_active', true) as typeof query;
  const { data, error, count } = await applySort(query).range(pageParam, pageParam + pageSize - 1);
  if (error) throw error;
  const rows = ((data ?? []) as unknown as RawRow[]).map(mapRow);
  const nextOffset = rows.length < pageSize ? null : pageParam + pageSize;
  return { rows, total: count ?? null, nextOffset };
};

const fetchRestaurantById = async (id: string, adminMode: boolean): Promise<DBRestaurant | null> => {
  let q = supabase.from('restaurants').select('*').eq('id', id);
  if (!adminMode) q = q.eq('is_active', true);
  const { data, error } = await q.maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return mapRow(data as unknown as RawRow);
};

export const restaurantsKeys = {
  all: ['restaurants'] as const,
  list: (adminMode: boolean, pageSize: number) => ['restaurants', 'list', { adminMode, pageSize }] as const,
  detail: (id: string | undefined, adminMode: boolean) => ['restaurants', 'detail', id, { adminMode }] as const,
};

export function useDBRestaurants(opts: { adminMode?: boolean; pageSize?: number } = {}) {
  const adminMode = !!opts.adminMode;
  const pageSize = opts.pageSize ?? 20;
  const qc = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: restaurantsKeys.list(adminMode, pageSize),
    initialPageParam: 0,
    queryFn: ({ pageParam }) => fetchRestaurantsPage(adminMode, pageSize, pageParam as number),
    getNextPageParam: (lastPage) => lastPage.nextOffset,
  });

  const refresh = useCallback(async () => {
    await qc.invalidateQueries({ queryKey: restaurantsKeys.all });
  }, [qc]);

  const list = useMemo(
    () => (query.data?.pages ?? []).flatMap((p) => p.rows),
    [query.data]
  );
  const total = query.data?.pages?.[0]?.total ?? null;

  return {
    list,
    total,
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refresh,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: !!query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  };
}

export function useRestaurantById(id?: string, opts: { adminMode?: boolean } = {}) {
  const adminMode = !!opts.adminMode;
  const query = useQuery({
    queryKey: restaurantsKeys.detail(id, adminMode),
    queryFn: () => fetchRestaurantById(id as string, adminMode),
    enabled: !!id,
  });

  return {
    restaurant: query.data ?? null,
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    retry: () => query.refetch(),
  };
}
