import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from 'react-router-dom';
import { Restaurant } from '@/data/types';

interface Props {
  restaurants: Restaurant[];
}

// Dakar fallback center
const DAKAR_CENTER: [number, number] = [14.7167, -17.4677];

const AllRestaurantsMap = ({ restaurants }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const navigate = useNavigate();

  // init once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: DAKAR_CENTER,
      zoom: 12,
      zoomControl: true,
      attributionControl: false,
    });
    mapRef.current = map;
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  // markers update
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();

    const valid = restaurants.filter((r) => r.lat && r.lng);
    if (valid.length === 0) return;

    valid.forEach((r) => {
      const m = L.circleMarker([r.lat!, r.lng!], {
        radius: 7,
        color: 'hsl(24 95% 45%)',
        fillColor: 'hsl(24 95% 53%)',
        fillOpacity: 0.9,
        weight: 2,
      })
        .bindPopup(
          `<div style="min-width:160px"><b>${r.name}</b><br/><span style="color:#666;font-size:11px">${
            r.quartier ?? r.city
          }</span><br/><a href="/restaurant/${r.id}" style="color:hsl(24 95% 53%);font-weight:600;font-size:12px">Voir le resto →</a></div>`
        )
        .on('popupopen', (e) => {
          const link = (e.popup.getElement() as HTMLElement | null)?.querySelector('a');
          link?.addEventListener('click', (ev) => {
            ev.preventDefault();
            navigate(`/restaurant/${r.id}`);
          });
        });
      layer.addLayer(m);
    });

    const bounds = L.latLngBounds(valid.map((r) => [r.lat!, r.lng!]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }, [restaurants, navigate]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ zIndex: 0 }}
      aria-label="Carte de tous les restaurants"
    />
  );
};

export default AllRestaurantsMap;
