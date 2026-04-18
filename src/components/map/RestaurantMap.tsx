import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Restaurant } from '@/data/types';

// Fix default marker icon paths (Leaflet + bundlers)
const DefaultIcon = L.icon({
  iconUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface RestaurantMapProps {
  restaurant: Restaurant;
  height?: number | string;
}

/**
 * Single-restaurant map (used in detail page).
 */
const RestaurantMap = ({ restaurant, height = 220 }: RestaurantMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || !restaurant.lat || !restaurant.lng) return;
    if (mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [restaurant.lat, restaurant.lng],
      zoom: 16,
      zoomControl: true,
      attributionControl: false,
    });
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    }).addTo(map);

    L.marker([restaurant.lat, restaurant.lng])
      .addTo(map)
      .bindPopup(`<b>${restaurant.name}</b><br/>${restaurant.quartier ?? ''}`);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [restaurant.id, restaurant.lat, restaurant.lng, restaurant.name, restaurant.quartier]);

  if (!restaurant.lat || !restaurant.lng) return null;

  return (
    <div
      ref={containerRef}
      className="w-full rounded-2xl overflow-hidden shadow-card border border-border"
      style={{ height, zIndex: 0 }}
      aria-label={`Carte de ${restaurant.name}`}
    />
  );
};

export default RestaurantMap;
