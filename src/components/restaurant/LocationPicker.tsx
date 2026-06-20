import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Loader2, MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const DefaultIcon = L.icon({
  iconUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const DEFAULT_CENTER: [number, number] = [14.6928, -17.4467]; // Dakar fallback

interface Props {
  value: { lat: number; lng: number } | null;
  onChange: (pos: { lat: number; lng: number }) => void;
  height?: number;
}

const LocationPicker = ({ value, onChange, height = 240 }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [loadingGeo, setLoadingGeo] = useState(false);
  const [loadingAddr, setLoadingAddr] = useState(false);

  const reverseGeocode = async (lat: number, lng: number) => {
    setLoadingAddr(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`, {
        headers: { 'Accept-Language': 'fr' },
      });
      const data = await res.json();
      setAddress(data?.display_name ?? null);
    } catch {
      setAddress(null);
    } finally {
      setLoadingAddr(false);
    }
  };

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const center: [number, number] = value ? [value.lat, value.lng] : DEFAULT_CENTER;
    const map = L.map(containerRef.current, { center, zoom: value ? 16 : 12, attributionControl: false });
    mapRef.current = map;
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);

    const marker = L.marker(center, { draggable: true, icon: DefaultIcon }).addTo(map);
    markerRef.current = marker;

    marker.on('dragend', () => {
      const ll = marker.getLatLng();
      onChange({ lat: ll.lat, lng: ll.lng });
      reverseGeocode(ll.lat, ll.lng);
    });
    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
      reverseGeocode(e.latlng.lat, e.latlng.lng);
    });

    if (value) reverseGeocode(value.lat, value.lng);

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external value changes (e.g. GPS button)
  useEffect(() => {
    if (!value || !mapRef.current || !markerRef.current) return;
    markerRef.current.setLatLng([value.lat, value.lng]);
    mapRef.current.setView([value.lat, value.lng], 16);
  }, [value?.lat, value?.lng]);

  const useMyLocation = () => {
    if (!('geolocation' in navigator)) {
      toast.error('Géolocalisation indisponible');
      return;
    }
    setLoadingGeo(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        onChange(p);
        reverseGeocode(p.lat, p.lng);
        setLoadingGeo(false);
      },
      (err) => {
        toast.error(err.message || 'Position introuvable');
        setLoadingGeo(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" onClick={useMyLocation} disabled={loadingGeo} className="w-full gap-2">
        {loadingGeo ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />}
        📍 Utiliser ma position actuelle
      </Button>
      <div ref={containerRef} className="w-full rounded-2xl overflow-hidden border border-border" style={{ height, zIndex: 0 }} />
      <p className="text-[11px] text-muted-foreground">Cliquez sur la carte ou déplacez le marqueur pour ajuster.</p>
      {value && (
        <div className="rounded-xl bg-secondary p-3 flex items-start gap-2">
          <MapPin size={14} className="text-primary mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            {loadingAddr ? 'Recherche de l\'adresse…' : (address ?? 'Position définie')}
          </p>
        </div>
      )}
    </div>
  );
};

export default LocationPicker;
