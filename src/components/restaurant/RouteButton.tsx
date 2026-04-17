import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Navigation, Loader2 } from 'lucide-react';
import { Restaurant } from '@/data/types';
import { distanceKm, formatDistance, estimateDriveMinutes } from '@/lib/format';
import { toast } from 'sonner';

interface RouteButtonProps {
  restaurant: Restaurant;
}

type GeoState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; lat: number; lng: number }
  | { status: 'denied' };

const RouteButton = ({ restaurant }: RouteButtonProps) => {
  const [geo, setGeo] = useState<GeoState>({ status: 'idle' });

  useEffect(() => {
    if (!restaurant.lat || !restaurant.lng) return;
    if (!('geolocation' in navigator)) return;
    setGeo({ status: 'loading' });
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setGeo({
          status: 'ready',
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      () => setGeo({ status: 'denied' }),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
    );
  }, [restaurant.lat, restaurant.lng]);

  if (!restaurant.lat || !restaurant.lng) return null;

  const openMaps = () => {
    const dest = `${restaurant.lat},${restaurant.lng}`;
    const isApple = /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent);
    const url = isApple
      ? `https://maps.apple.com/?daddr=${dest}&dirflg=d`
      : `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`;
    window.open(url, '_blank', 'noopener,noreferrer');
    toast.success('Itinéraire ouvert dans Maps');
  };

  let infoLine: string | null = null;
  if (geo.status === 'ready') {
    const km = distanceKm(geo.lat, geo.lng, restaurant.lat, restaurant.lng);
    infoLine = `${formatDistance(km)} · ~${estimateDriveMinutes(km)} min`;
  } else if (geo.status === 'loading') {
    infoLine = 'Calcul de la distance...';
  } else if (geo.status === 'denied') {
    infoLine = 'Position non disponible';
  }

  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={openMaps}
      className="w-full flex items-center justify-between gap-3 rounded-2xl bg-primary text-primary-foreground px-5 py-4 shadow-lg active:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary-foreground/15 flex items-center justify-center">
          {geo.status === 'loading' ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Navigation size={18} />
          )}
        </div>
        <div className="text-left">
          <p className="font-semibold text-sm">Itinéraire</p>
          {infoLine && <p className="text-xs opacity-80">{infoLine}</p>}
        </div>
      </div>
      <span className="text-xs font-medium opacity-90">Ouvrir Maps →</span>
    </motion.button>
  );
};

export default RouteButton;
