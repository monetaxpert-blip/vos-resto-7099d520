import { useEffect, useState } from 'react';
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
  lat: r.lat,
  lng: r.lng,
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
  isActive: r.is_active,
  isFeatured: r.is_featured,
  isPinned: r.is_pinned,
  displayOrder: r.display_order,
  badges: r.badges ?? [],
  adminPlan: r.admin_plan,
});

/** Hook : all active restaurants from DB, refreshed in real time via Supabase Realtime. */
export function useDBRestaurants(opts: { adminMode?: boolean } = {}) {
  const [list, setList] = useState<DBRestaurant[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    let q = supabase.from('restaurants').select('*');
    if (!opts.adminMode) q = q.eq('is_active', true);
    const { data } = await q.order('is_pinned', { ascending: false })
      .order('display_order', { ascending: false })
      .order('rating_count', { ascending: false });
    setList((data ?? []).map(mapRow as never));
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    const channel = supabase
      .channel('restaurants-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurants' }, () => {
        refresh();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.adminMode]);

  return { list, loading, refresh };
}
