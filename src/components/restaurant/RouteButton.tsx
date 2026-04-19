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

  // Try to get the user's position passively for the distance/ETA hint.
  // Failures here NEVER block the "Open Maps" button.
  useEffect(() => {
    if (!restaurant.lat || !restaurant.lng) return;
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setGeo({ status: 'denied' });
      return;
    }
    setGeo({ status: 'loading' });
    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled) return;
        setGeo({
          status: 'ready',
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {
        if (cancelled) return;
        setGeo({ status: 'denied' });
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
    );
    return () => {
      cancelled = true;
    };
  }, [restaurant.lat, restaurant.lng]);

  // No coords at all → render a degraded button that searches by name in Maps.
  const hasCoords = !!(restaurant.lat && restaurant.lng);

  const openMaps = () => {
    const isApple = /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent);
    let url: string;

    if (hasCoords) {
      const dest = `${restaurant.lat},${restaurant.lng}`;
      url = isApple
        ? `https://maps.apple.com/?daddr=${dest}&dirflg=d`
        : `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`;
    } else {
      // Fallback: search by name + city
      const q = encodeURIComponent(`${restaurant.name} ${restaurant.city ?? ''}`.trim());
      url = isApple
        ? `https://maps.apple.com/?q=${q}`
        : `https://www.google.com/maps/search/?api=1&query=${q}`;
    }

    try {
      const win = window.open(url, '_blank', 'noopener,noreferrer');
      if (!win) {
        // Popup blocked → navigate the current tab so user always reaches Maps
        window.location.href = url;
      }
      toast.success('Itinéraire ouvert dans Maps');
    } catch {
      window.location.href = url;
    }
  };

  let infoLine: string | null = null;
  if (geo.status === 'ready' && hasCoords) {
    const km = distanceKm(geo.lat, geo.lng, restaurant.lat!, restaurant.lng!);
    infoLine = `${formatDistance(km)} · ~${estimateDriveMinutes(km)} min`;
  } else if (geo.status === 'loading') {
    infoLine = 'Calcul de la distance...';
  } else if (geo.status === 'denied' && hasCoords) {
    infoLine = "Active la géoloc pour voir la distance";
  } else if (!hasCoords) {
    infoLine = 'Recherche par nom dans Maps';
  }

  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={openMaps}
      type="button"
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
