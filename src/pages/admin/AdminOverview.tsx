import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Eye, MousePointerClick, MessageCircle, Navigation, Search, Store } from 'lucide-react';

interface Stat {
  label: string;
  value: number;
  icon: typeof Eye;
  color: string;
}

const Stats = () => {
  const [stats, setStats] = useState<Stat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const types = [
        { type: 'restaurant_view', label: 'Vues', icon: Eye, color: 'text-blue-500' },
        { type: 'restaurant_click', label: 'Clics resto', icon: MousePointerClick, color: 'text-purple-500' },
        { type: 'whatsapp_click', label: 'WhatsApp', icon: MessageCircle, color: 'text-green-500' },
        { type: 'direction_click', label: 'Itinéraires', icon: Navigation, color: 'text-orange-500' },
        { type: 'search_event', label: 'Recherches', icon: Search, color: 'text-pink-500' },
      ] as const;

      const counts = await Promise.all(
        types.map((t) =>
          supabase
            .from('analytics_events')
            .select('*', { count: 'exact', head: true })
            .eq('event_type', t.type)
            .then((r) => r.count ?? 0)
        )
      );
      const restoCount = await supabase
        .from('restaurants')
        .select('*', { count: 'exact', head: true })
        .then((r) => r.count ?? 0);

      const result: Stat[] = types.map((t, i) => ({
        label: t.label,
        value: counts[i],
        icon: t.icon,
        color: t.color,
      }));
      result.unshift({ label: 'Restaurants', value: restoCount, icon: Store, color: 'text-primary' });
      setStats(result);
      setLoading(false);
    })();
  }, []);

  if (loading) return <p className="text-sm text-muted-foreground">Chargement...</p>;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {stats.map((s) => (
        <div key={s.label} className="rounded-2xl bg-card border border-border p-4">
          <s.icon size={18} className={`${s.color} mb-2`} />
          <p className="text-2xl font-extrabold leading-none">{s.value.toLocaleString('fr-FR')}</p>
          <p className="text-[11px] text-muted-foreground mt-1">{s.label}</p>
        </div>
      ))}
    </div>
  );
};

const AdminOverview = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold mb-3">Vue d'ensemble</h2>
        <Stats />
      </div>
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-orange-500/10 border border-primary/20 p-4">
        <p className="text-sm font-semibold mb-1">Bienvenue sur l'espace admin</p>
        <p className="text-xs text-muted-foreground">
          Gérez vos restaurants, suivez les performances et contrôlez la visibilité de l'app en temps réel.
        </p>
      </div>
    </div>
  );
};

export default AdminOverview;
