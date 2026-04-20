import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp } from 'lucide-react';

interface Row {
  restaurant_id: string;
  name: string;
  views: number;
  clicks: number;
  whatsapp: number;
  directions: number;
  conversion: number;
}

const AdminAnalytics = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: events } = await supabase
        .from('analytics_events')
        .select('event_type, restaurant_id')
        .not('restaurant_id', 'is', null);

      const { data: restos } = await supabase.from('restaurants').select('id, name');

      const nameById: Record<string, string> = {};
      (restos ?? []).forEach((r) => { nameById[r.id] = r.name; });

      const agg: Record<string, Omit<Row, 'name' | 'conversion'>> = {};
      (events ?? []).forEach((e) => {
        const rid = e.restaurant_id as string;
        if (!agg[rid]) agg[rid] = { restaurant_id: rid, views: 0, clicks: 0, whatsapp: 0, directions: 0 };
        if (e.event_type === 'restaurant_view') agg[rid].views++;
        else if (e.event_type === 'restaurant_click') agg[rid].clicks++;
        else if (e.event_type === 'whatsapp_click') agg[rid].whatsapp++;
        else if (e.event_type === 'direction_click') agg[rid].directions++;
      });

      const result: Row[] = Object.values(agg).map((a) => {
        const actions = a.whatsapp + a.directions;
        return {
          ...a,
          name: nameById[a.restaurant_id] ?? a.restaurant_id,
          conversion: a.views > 0 ? (actions / a.views) * 100 : 0,
        };
      });
      result.sort((a, b) => b.views + b.clicks - (a.views + a.clicks));
      setRows(result);
      setLoading(false);
    })();
  }, []);

  if (loading) return <p className="text-sm text-muted-foreground">Chargement...</p>;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <TrendingUp size={16} className="text-primary" />
        <h2 className="font-bold">Top performances</h2>
      </div>
      {rows.length === 0 && (
        <p className="text-sm text-muted-foreground">Aucun événement encore enregistré.</p>
      )}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-xs">
          <thead className="bg-secondary text-muted-foreground">
            <tr>
              <th className="text-left p-2 font-semibold">#</th>
              <th className="text-left p-2 font-semibold">Restaurant</th>
              <th className="text-right p-2 font-semibold">Vues</th>
              <th className="text-right p-2 font-semibold">Clics</th>
              <th className="text-right p-2 font-semibold">WA</th>
              <th className="text-right p-2 font-semibold">Itin.</th>
              <th className="text-right p-2 font-semibold">Conv.</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.restaurant_id} className="border-t border-border">
                <td className="p-2 text-muted-foreground">{i + 1}</td>
                <td className="p-2 font-medium truncate max-w-[160px]">{r.name}</td>
                <td className="p-2 text-right">{r.views}</td>
                <td className="p-2 text-right">{r.clicks}</td>
                <td className="p-2 text-right text-emerald-600">{r.whatsapp}</td>
                <td className="p-2 text-right text-orange-600">{r.directions}</td>
                <td className="p-2 text-right font-semibold">{r.conversion.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminAnalytics;
