import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  address: string | null;
  quartier: string | null;
  city: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  lat: number | null;
  lng: number | null;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  rating_count: number;
  categories: string[];
  price_level: string | null;
  hours: string | null;
  place_id: string | null;
  social_media: { facebook?: string | null; instagram?: string | null; twitter?: string | null; youtube?: string | null } | null;
  is_active: boolean;
  is_featured: boolean;
  is_pinned: boolean;
  display_order: number;
  badges: string[];
  admin_plan: 'Standard' | 'Premium' | 'Elite';
  profile_image: string | null;
  banner_image: string | null;
  description: string | null;
  whatsapp_number: string | null;
  whatsapp_link: string | null;
  average_price: number | null;
  price_range: string | null;
  cuisine_type: string | null;
  address_detail: string | null;
  opening_hours: Record<string, unknown> | null;
}

const mapRow = (r: RawRow): DBRestaurant => ({
  id: r.id,
  name: r.name,
  address: r.address,
  quartier: r.quartier,
  city: r.city,
  phone: r.phone,
  email: r.email,
  website: r.website,
  lat: r.latitude ?? r.lat,
  lng: r.longitude ?? r.lng,
  latitude: r.latitude ?? r.lat,
  longitude: r.longitude ?? r.lng,
  rating: r.rating,
  ratingCount: r.rating_count,
  categories: r.categories ?? [],
  priceLevel: r.price_level,
  hours: r.hours,
  placeId: r.place_id,
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
  heroPhotoUrl: null,
  description: r.description,
  whatsappNumber: r.whatsapp_number,
  whatsappLink: r.whatsapp_link,
  averagePrice: r.average_price,
  priceRange: r.price_range,
  cuisineType: r.cuisine_type,
  addressDetail: r.address_detail,
  openingHours: (r.opening_hours as unknown as import('@/data/types').OpeningHours) ?? undefined,
  isActive: r.is_active,
  isFeatured: r.is_featured,
  isPinned: r.is_pinned,
  displayOrder: r.display_order,
  badges: r.badges ?? [],
  adminPlan: r.admin_plan,
});

const attachHeroPhotos = async (restaurants: DBRestaurant[]): Promise<DBRestaurant[]> => {
  const ids = restaurants.map((r) => r.id);
  if (ids.length === 0) return restaurants;
  const { data, error } = await supabase
    .from('restaurant_photos')
    .select('restaurant_id, url, storage_path, is_hero, display_order')
    .in('restaurant_id', ids)
    .order('is_hero', { ascending: false })
    .order('display_order', { ascending: true });
  if (error) return restaurants;
  const map = new Map<string, string>();
  for (const p of (data ?? []) as Array<{ restaurant_id: string; url: string | null; storage_path: string }>) {
    if (map.has(p.restaurant_id)) continue;
    const url = p.url || supabase.storage.from('restaurant-photos').getPublicUrl(p.storage_path).data.publicUrl;
    if (url) map.set(p.restaurant_id, url);
  }
  return restaurants.map((r) => ({ ...r, heroPhotoUrl: map.get(r.id) ?? null }));
};

const fetchRestaurants = async (adminMode: boolean): Promise<DBRestaurant[]> => {
  if (!adminMode) {
    // Fire-and-forget: expire any due trials so the public listing never shows a restaurant
    // whose trial is actually over, even if the owner never comes back to their dashboard.
    await supabase.rpc('check_and_expire_trials' as any).then(() => {}, () => {});
  }
  let query = supabase.from('restaurants').select('*');
  if (!adminMode) query = query.eq('is_active', true);
  const { data, error } = await query
    .order('is_pinned', { ascending: false })
    .order('is_featured', { ascending: false })
    .order('display_order', { ascending: false })
    .order('rating_count', { ascending: false });
  if (error) throw error;
  const restaurants = (data ?? []).map((row) => mapRow(row as RawRow));
  return attachHeroPhotos(restaurants);
};

const fetchRestaurantById = async (id: string, adminMode: boolean): Promise<DBRestaurant | null> => {
  let q = supabase.from('restaurants').select('*').eq('id', id);
  if (!adminMode) q = q.eq('is_active', true);
  const { data, error } = await q.maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const [withHero] = await attachHeroPhotos([mapRow(data as RawRow)]);
  return withHero;
};

export const restaurantsKeys = {
  all: ['restaurants'] as const,
  list: (adminMode: boolean) => ['restaurants', 'list', { adminMode }] as const,
  detail: (id: string | undefined, adminMode: boolean) => ['restaurants', 'detail', id, { adminMode }] as const,
};

export function useDBRestaurants(opts: { adminMode?: boolean } = {}) {
  const adminMode = !!opts.adminMode;
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: restaurantsKeys.list(adminMode),
    queryFn: () => fetchRestaurants(adminMode),
  });

  const refresh = useCallback(async () => {
    await qc.invalidateQueries({ queryKey: restaurantsKeys.list(adminMode) });
  }, [qc, adminMode]);

  const list = useMemo(() => query.data ?? [], [query.data]);
  return {
    list,
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refresh,
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
