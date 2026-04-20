import { useState } from 'react';
import { Star, Pin, Search, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useDBRestaurants, type DBRestaurant } from '@/hooks/useDBRestaurants';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const ALL_BADGES = ['Recommandé', 'Populaire', 'Top'];
const PLANS = ['Standard', 'Premium', 'Elite'] as const;

const AdminRestaurants = () => {
  const { list, loading, refresh } = useDBRestaurants({ adminMode: true });
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<DBRestaurant | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const filtered = q.trim()
    ? list.filter((r) => r.name.toLowerCase().includes(q.toLowerCase()))
    : list;

  const update = async (id: string, patch: Partial<Record<string, unknown>>) => {
    setSavingId(id);
    const { error } = await supabase.from('restaurants').update(patch).eq('id', id);
    setSavingId(null);
    if (error) {
      toast.error('Erreur de sauvegarde');
      return;
    }
    refresh();
  };

  const remove = async (id: string) => {
    if (!confirm('Supprimer définitivement ce restaurant ?')) return;
    const { error } = await supabase.from('restaurants').delete().eq('id', id);
    if (error) {
      toast.error('Suppression impossible');
      return;
    }
    toast.success('Restaurant supprimé');
    refresh();
  };

  const toggleBadge = (r: DBRestaurant, badge: string) => {
    const next = r.badges.includes(badge)
      ? r.badges.filter((b) => b !== badge)
      : [...r.badges, badge];
    update(r.id, { badges: next });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher..." className="pl-9 h-10" />
        </div>
        <Button size="sm" onClick={() => setEditing({} as DBRestaurant)}>+ Ajouter</Button>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Chargement...</p>}

      <div className="space-y-2">
        {filtered.map((r) => (
          <div key={r.id} className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-sm truncate">{r.name}</p>
                  {r.isPinned && <Pin size={12} className="text-primary" />}
                  {r.isFeatured && <Star size={12} className="text-amber-500 fill-amber-500" />}
                  {savingId === r.id && <Loader2 size={12} className="animate-spin text-muted-foreground" />}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {r.quartier || r.city} · {r.categories.slice(0, 2).join(', ')}
                </p>
              </div>
              <button
                onClick={() => update(r.id, { is_active: !r.isActive })}
                className={`text-[10px] px-2 py-1 rounded-full font-bold ${
                  r.isActive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-destructive/10 text-destructive'
                }`}
              >
                {r.isActive ? 'Actif' : 'Inactif'}
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-2">
              {ALL_BADGES.map((b) => (
                <button
                  key={b}
                  onClick={() => toggleBadge(r, b)}
                  className={`text-[10px] px-2 py-1 rounded-full font-semibold border ${
                    r.badges.includes(b)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-muted-foreground border-border'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <select
                value={r.adminPlan}
                onChange={(e) => update(r.id, { admin_plan: e.target.value })}
                className="text-[11px] h-7 rounded-md border border-border bg-background px-2"
              >
                {PLANS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <button
                onClick={() => update(r.id, { is_featured: !r.isFeatured })}
                className="text-[10px] px-2 py-1 rounded-md border border-border"
              >
                {r.isFeatured ? '★ Featured' : '☆ Featured'}
              </button>
              <button
                onClick={() => update(r.id, { is_pinned: !r.isPinned })}
                className="text-[10px] px-2 py-1 rounded-md border border-border"
              >
                {r.isPinned ? '📌 Épinglé' : 'Épingler'}
              </button>
              <input
                type="number"
                defaultValue={r.displayOrder}
                onBlur={(e) => {
                  const v = parseInt(e.target.value, 10) || 0;
                  if (v !== r.displayOrder) update(r.id, { display_order: v });
                }}
                className="text-[11px] h-7 w-16 rounded-md border border-border bg-background px-2"
                title="Ordre"
              />
              <button onClick={() => setEditing(r)} className="text-[10px] text-primary font-semibold ml-auto">
                Éditer
              </button>
              <button onClick={() => remove(r.id)} className="text-[10px] text-destructive font-semibold">
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && <EditModal r={editing} onClose={() => { setEditing(null); refresh(); }} />}
    </div>
  );
};

const EditModal = ({ r, onClose }: { r: DBRestaurant; onClose: () => void }) => {
  const isNew = !r.id;
  const [form, setForm] = useState({
    id: r.id || '',
    name: r.name || '',
    address: r.address || '',
    quartier: r.quartier || '',
    city: r.city || 'Dakar',
    phone: r.phone || '',
    website: r.website || '',
    categories: (r.categories || []).join(', '),
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.name.trim()) {
      toast.error('Nom requis');
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      address: form.address.trim() || null,
      quartier: form.quartier.trim() || null,
      city: form.city.trim() || 'Dakar',
      phone: form.phone.trim() || null,
      website: form.website.trim() || null,
      categories: form.categories.split(',').map((s) => s.trim()).filter(Boolean),
    };
    const { error } = isNew
      ? await supabase.from('restaurants').insert({ ...payload, id: form.id || crypto.randomUUID() })
      : await supabase.from('restaurants').update(payload).eq('id', r.id);
    setSaving(false);
    if (error) {
      toast.error('Erreur');
      return;
    }
    toast.success('Sauvegardé');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-background rounded-2xl w-full max-w-md p-5 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-bold mb-3">{isNew ? 'Nouveau restaurant' : 'Modifier'}</h3>
        <div className="space-y-2">
          <Input placeholder="Nom *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input placeholder="Adresse" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <Input placeholder="Quartier" value={form.quartier} onChange={(e) => setForm({ ...form, quartier: e.target.value })} />
          <Input placeholder="Ville" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <Input placeholder="Téléphone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input placeholder="Site / WhatsApp" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
          <Input placeholder="Catégories (séparées par virgule)" value={form.categories} onChange={(e) => setForm({ ...form, categories: e.target.value })} />
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Annuler</Button>
          <Button className="flex-1" onClick={save} disabled={saving}>
            {saving && <Loader2 size={14} className="animate-spin" />} Sauvegarder
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminRestaurants;
