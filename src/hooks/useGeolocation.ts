import { useEffect, useState } from 'react';

export interface GeoPosition {
  lat: number;
  lng: number;
  accuracy?: number;
}

interface GeoState {
  position: GeoPosition | null;
  loading: boolean;
  error: string | null;
  unsupported: boolean;
}

/**
 * Browser geolocation with safe fallback. Never throws.
 * Caller can pass `enabled=false` to defer the prompt.
 */
export function useGeolocation(enabled = true): GeoState & { request: () => void } {
  const [state, setState] = useState<GeoState>({
    position: null,
    loading: false,
    error: null,
    unsupported: typeof navigator === 'undefined' || !('geolocation' in navigator),
  });

  const request = () => {
    if (state.unsupported) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    navigator.geolocation.getCurrentPosition(
      (pos) => setState({
        position: { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy },
        loading: false,
        error: null,
        unsupported: false,
      }),
      (err) => setState((s) => ({ ...s, loading: false, error: err.message })),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  };

  useEffect(() => {
    if (enabled && !state.position && !state.loading && !state.unsupported) request();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return { ...state, request };
}

const EARTH_KM = 6371;
export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.sqrt(x));
}

export function googleMapsDirectionsUrl(dest: { lat: number; lng: number }, origin?: { lat: number; lng: number }) {
  const d = `${dest.lat},${dest.lng}`;
  const o = origin ? `&origin=${origin.lat},${origin.lng}` : '';
  return `https://www.google.com/maps/dir/?api=1&destination=${d}${o}&travelmode=driving`;
}
