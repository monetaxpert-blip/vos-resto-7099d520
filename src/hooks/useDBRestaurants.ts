import { useEffect, useMemo, useState } from 'react';
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

export function useDBRestaurants(opts: { adminMode?: boolean } = {}) {
  const [list, setList] = useState<DBRestaurant[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    let query = supabase.from('restaurants').select('*');
    if (!opts.adminMode) query = query.eq('is_active', true);
    const { data } = await query
      .order('is_pinned', { ascending: false })
      .order('is_featured', { ascending: false })
      .order('display_order', { ascending: false })
      .order('rating_count', { ascending: false });
    setList((data ?? []).map((row) => mapRow(row as RawRow)));
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    const channel = supabase
      .channel(`restaurants-changes-${opts.adminMode ? 'admin' : 'public'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurants' }, refresh)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [opts.adminMode]);

  return { list, loading, refresh };
}

export function useRestaurantById(id?: string, opts: { adminMode?: boolean } = {}) {
  const { list, loading, refresh } = useDBRestaurants(opts);
  const restaurant = useMemo(() => list.find((item) => item.id === id), [id, list]);
  return { restaurant, list, loading, refresh };
}
