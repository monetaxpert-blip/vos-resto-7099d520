import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, ImagePlus, Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { CITY_OPTIONS, CUISINE_OPTIONS, DAYS, DEFAULT_OPENING_HOURS, QUARTIER_OPTIONS } from '@/lib/restaurant';
import LocationPicker from '@/components/restaurant/LocationPicker';
import { useRestaurantMenu } from '@/hooks/useRestaurantMenu';
import { useRestaurantPhotos } from '@/hooks/useRestaurantPhotos';
import { formatFCFA } from '@/lib/format';

type Step = 1 | 2 | 3 | 4 | 5 | 6;
const TOTAL = 6;

const RestaurantOnboarding = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [creating, setCreating] = useState(false);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', address: '', phone: '', city: 'Dakar', quartier: '',
    cuisine: 'Sénégalais', cuisineCustom: '', averagePrice: '', description: '',
  });
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [hours, setHours] = useState(DEFAULT_OPENING_HOURS);
  const [uploading, setUploading] = useState(false);
  const [menuDraft, setMenuDraft] = useState({ name: '', description: '', price: '', category: '' });

  const { data: photos = [], refetch: refetchPhotos } = useRestaurantPhotos(restaurantId ?? undefined);
  const { items: menuItems, create: createMenu, remove: removeMenu } = useRestaurantMenu(restaurantId ?? undefined);

  if (!authLoading && !user) {
    navigate('/auth?redirect=/restaurant/onboarding');
    return null;
  }

  const progress = useMemo(() => (step / TOTAL) * 100, [step]);

  const createRestaurant = async () => {
    if (creating || restaurantId) return true;
    setCreating(true);
    try {
      const cuisineLabel = form.cuisine === 'Autre' ? form.cuisineCustom.trim() : form.cuisine;
      const { data, error } = await supabase.rpc('create_restaurant_with_owner', {
        p_name: form.name.trim(),
        p_description: form.description.trim() || null,
        p_address: form.address.trim() || null,
        p_quartier: form.quartier || null,
        p_phone: form.phone.trim() || null,
        p_cuisine_type: cuisineLabel || null,
        p_average_price: form.averagePrice ? Number(form.averagePrice) : null,
      });
      if (error) throw new Error(error.message);
      const result = data as { success?: boolean; error?: string; restaurant_id?: string } | null;
      if (!result?.success || !result.restaurant_id) throw new Error(result?.error || 'Création échouée');
      setRestaurantId(result.restaurant_id);
      if (form.city && form.city !== 'Dakar') {
        await supabase.from('restaurants').update({ city: form.city } as never).eq('id', result.restaurant_id);
      }
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la création');
      return false;
    } finally {
      setCreating(false);
    }
  };

  const persistLocation = async () => {
    if (!restaurantId || !location) return;
    await supabase.from('restaurants').update({
      latitude: location.lat, longitude: location.lng, lat: location.lat, lng: location.lng,
    } as never).eq('id', restaurantId);
  };

  const persistHours = async () => {
    if (!restaurantId) return;
    await supabase.from('restaurants').update({ opening_hours: hours as unknown as Record<string, unknown> } as never).eq('id', restaurantId);
  };

  const uploadPhotos = async (files: FileList | null) => {
    if (!files || files.length === 0 || !restaurantId) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split('.').pop() || 'jpg';
        const path = `${restaurantId}/${crypto.randomUUID()}.${ext}`;
        const up = await supabase.storage.from('restaurant-photos').upload(path, file, { upsert: false });
        if (up.error) throw up.error;
        const url = supabase.storage.from('restaurant-photos').getPublicUrl(path).data.publicUrl;
        const ins = await supabase.from('restaurant_photos').insert({
          restaurant_id: restaurantId, storage_path: path, url,
          is_hero: photos.length === 0, uploaded_by: null, display_order: photos.length,
        });
        if (ins.error) throw ins.error;
      }
      toast.success('Photos ajoutées');
      await refetchPhotos();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload impossible');
    } finally {
      setUploading(false);
    }
  };

  const deletePhoto = async (id: string, path: string) => {
    await supabase.from('restaurant_photos').delete().eq('id', id);
    await supabase.storage.from('restaurant-photos').remove([path]);
    await refetchPhotos();
  };

  const canNext = () => {
    if (step === 1) {
      if (form.name.trim().length < 2) return false;
      if (form.cuisine === 'Autre' && form.cuisineCustom.trim().length < 2) return false;
      return true;
    }
    if (step === 2) return !!location;
    if (step === 4) return photos.length >= 1;
    if (step === 5) return menuItems.length >= 1;
    return true;
  };

  const next = async () => {
    if (!canNext()) {
      if (step === 1) toast.error('Nom (et type "Autre" précisé) requis');
      else if (step === 2) toast.error('Définissez la position GPS');
      else if (step === 4) toast.error('Ajoutez au moins une photo');
      else if (step === 5) toast.error('Ajoutez au moins un plat');
      return;
    }
    if (step === 1) {
      const ok = await createRestaurant();
      if (!ok) return;
    }
    if (step === 2) await persistLocation();
    if (step === 3) await persistHours();
    setStep((s) => Math.min(TOTAL, s + 1) as Step);
  };

  const prev = () => setStep((s) => Math.max(1, s - 1) as Step);

  const finish = () => {
    toast.success('🎉 Restaurant créé et publié !');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen pb-24 bg-background pt-14 px-5 max-w-lg mx-auto">
      <button onClick={() => (step === 1 ? navigate('/profile') : prev())} className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
        <ArrowLeft size={16} /> {step === 1 ? 'Retour' : 'Précédent'}
      </button>
      <h1 className="text-2xl font-extrabold mb-1">Créer mon restaurant</h1>
      <p className="text-xs text-muted-foreground mb-4">Étape {step} sur {TOTAL}</p>
      <Progress value={progress} className="mb-6 h-1.5" />

      {step === 1 && (
        <div className="space-y-3">
          <h2 className="font-bold text-lg">Informations de base</h2>
          <Input placeholder="Nom du restaurant *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input placeholder="Adresse" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <Input placeholder="Téléphone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <select value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            {CITY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={form.quartier} onChange={(e) => setForm({ ...form, quartier: e.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Quartier (optionnel)</option>
            {QUARTIER_OPTIONS.map((q) => <option key={q} value={q}>{q}</option>)}
          </select>
          <select value={form.cuisine} onChange={(e) => setForm({ ...form, cuisine: e.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            {CUISINE_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            <option value="Autre">Autre (préciser)</option>
          </select>
          {form.cuisine === 'Autre' && (
            <Input placeholder="Précisez le type de cuisine *" value={form.cuisineCustom} onChange={(e) => setForm({ ...form, cuisineCustom: e.target.value })} />
          )}
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Budget moyen par personne (FCFA)</label>
            <Input type="number" inputMode="numeric" placeholder="Ex : 5000" value={form.averagePrice} onChange={(e) => setForm({ ...form, averagePrice: e.target.value })} />
          </div>
          <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <h2 className="font-bold text-lg">Localisation GPS</h2>
          <p className="text-xs text-muted-foreground">Indispensable pour que les clients vous trouvent.</p>
          <LocationPicker value={location} onChange={setLocation} />
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <h2 className="font-bold text-lg">Horaires d'ouverture</h2>
          <div className="rounded-xl bg-secondary p-3 space-y-3">
            {DAYS.map(({ key, label }) => (
              <div key={key} className="grid grid-cols-[auto_auto_1fr_1fr] gap-2 items-center min-w-0">
                <span className="text-sm">{label}</span>
                <Switch checked={hours[key].open} onCheckedChange={(c) => setHours((p) => ({ ...p, [key]: { ...p[key], open: c } }))} />
                <Input className="min-w-0" type="time" value={hours[key].start} disabled={!hours[key].open} onChange={(e) => setHours((p) => ({ ...p, [key]: { ...p[key], start: e.target.value } }))} />
                <Input className="min-w-0" type="time" value={hours[key].end} disabled={!hours[key].open} onChange={(e) => setHours((p) => ({ ...p, [key]: { ...p[key], end: e.target.value } }))} />
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-3">
          <h2 className="font-bold text-lg">Photos</h2>
          <p className="text-xs text-muted-foreground">Ajoutez au moins 1 photo (3-4 recommandées).</p>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border p-6 text-sm font-semibold text-primary">
            <ImagePlus size={16} />
            {uploading ? 'Upload...' : 'Ajouter des photos'}
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => uploadPhotos(e.target.files)} />
          </label>
          {photos.length === 0 ? (
            <div className="rounded-xl bg-secondary p-6 text-center text-sm text-muted-foreground">
              <ImagePlus className="mx-auto mb-2 opacity-50" size={24} />
              Ajoutez vos photos
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {photos.map((p) => (
                <div key={p.id} className="rounded-xl overflow-hidden border border-border bg-secondary">
                  <img src={p.url} alt="" className="h-28 w-full object-cover" />
                  <button onClick={() => deletePhoto(p.id, p.storage_path)} className="w-full py-1.5 text-xs font-semibold text-destructive inline-flex items-center justify-center gap-1"><Trash2 size={12} /> Supprimer</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 5 && (
        <div className="space-y-3">
          <h2 className="font-bold text-lg">Menu</h2>
          <p className="text-xs text-muted-foreground">Ajoutez au moins 1 plat.</p>
          <div className="rounded-xl bg-secondary p-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Nom du plat *" value={menuDraft.name} onChange={(e) => setMenuDraft({ ...menuDraft, name: e.target.value })} />
              <Input placeholder="Catégorie" value={menuDraft.category} onChange={(e) => setMenuDraft({ ...menuDraft, category: e.target.value })} />
            </div>
            <Textarea placeholder="Description" value={menuDraft.description} onChange={(e) => setMenuDraft({ ...menuDraft, description: e.target.value })} />
            <div className="flex gap-2">
              <Input type="number" placeholder="Prix *" value={menuDraft.price} onChange={(e) => setMenuDraft({ ...menuDraft, price: e.target.value })} />
              <Button
                disabled={!menuDraft.name.trim() || !menuDraft.price || !restaurantId || createMenu.isPending}
                onClick={() => createMenu.mutate(
                  { restaurant_id: restaurantId!, name: menuDraft.name.trim(), description: menuDraft.description || null, price: Number(menuDraft.price), category: menuDraft.category || null },
                  { onSuccess: () => { setMenuDraft({ name: '', description: '', price: '', category: '' }); toast.success('Plat ajouté'); } }
                )}
              ><Plus size={14} /> Ajouter</Button>
            </div>
          </div>
          <div className="space-y-2">
            {menuItems.map((it) => (
              <div key={it.id} className="flex items-center justify-between gap-3 rounded-xl bg-card border border-border p-3">
                <div>
                  <p className="font-semibold text-sm">{it.name}</p>
                  <p className="text-xs text-muted-foreground">{it.category || 'Menu'} · {formatFCFA(it.price)}</p>
                </div>
                <button onClick={() => removeMenu.mutate(it.id)} className="text-xs font-semibold text-destructive">Supprimer</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 6 && (
        <div className="space-y-4">
          <h2 className="font-bold text-lg">Récapitulatif</h2>
          <div className="rounded-2xl bg-card border border-border p-4 space-y-2 text-sm">
            <Row label="Nom" value={form.name} />
            <Row label="Cuisine" value={form.cuisine === 'Autre' ? form.cuisineCustom : form.cuisine} />
            <Row label="Ville" value={form.city} />
            {form.quartier && <Row label="Quartier" value={form.quartier} />}
            {form.address && <Row label="Adresse" value={form.address} />}
            {form.phone && <Row label="Téléphone" value={form.phone} />}
            {form.averagePrice && <Row label="Budget moyen" value={formatFCFA(Number(form.averagePrice))} />}
            {location && <Row label="GPS" value={`${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`} />}
            <Row label="Horaires" value={`${DAYS.filter((d) => hours[d.key].open).length} jour(s) ouverts`} />
            <Row label="Photos" value={`${photos.length}`} />
            <Row label="Plats au menu" value={`${menuItems.length}`} />
          </div>
          <Button onClick={finish} className="w-full font-bold gap-2"><Check size={16} /> Terminer</Button>
        </div>
      )}

      {step < TOTAL && (
        <Button onClick={next} disabled={creating} className="w-full mt-6 gap-2 font-bold">
          {creating ? <Loader2 size={16} className="animate-spin" /> : <>Continuer <ArrowRight size={16} /></>}
        </Button>
      )}
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between gap-3">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-semibold text-right truncate">{value}</span>
  </div>
);

export default RestaurantOnboarding;
