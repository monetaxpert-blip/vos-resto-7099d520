import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
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
import { formatFCFA } from '@/lib/format';

type Step = 1 | 2 | 3 | 4;

const RestaurantOnboarding = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '', address: '', phone: '', city: 'Dakar', quartier: '',
    cuisine: 'Sénégalais', averagePrice: '', description: '',
  });
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [hours, setHours] = useState(DEFAULT_OPENING_HOURS);

  if (!authLoading && !user) {
    navigate('/auth?redirect=/restaurant/onboarding');
    return null;
  }

  const progress = useMemo(() => (step / 4) * 100, [step]);

  const canNext = () => {
    if (step === 1) return form.name.trim().length >= 2;
    if (step === 2) return !!location;
    return true;
  };

  const next = () => {
    if (!canNext()) {
      if (step === 1) toast.error('Le nom du restaurant est requis');
      if (step === 2) toast.error('Définissez la position GPS');
      return;
    }
    setStep((s) => (Math.min(4, s + 1) as Step));
  };
  const prev = () => setStep((s) => (Math.max(1, s - 1) as Step));

  const submit = async () => {
    if (submitting || !user) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('create_restaurant_with_owner', {
        p_name: form.name.trim(),
        p_description: form.description.trim() || null,
        p_address: form.address.trim() || null,
        p_quartier: form.quartier || null,
        p_phone: form.phone.trim() || null,
        p_cuisine_type: form.cuisine || null,
        p_average_price: form.averagePrice ? Number(form.averagePrice) : null,
      });
      if (error) throw new Error(error.message);
      const result = data as { success?: boolean; error?: string; restaurant_id?: string } | null;
      if (!result?.success || !result.restaurant_id) throw new Error(result?.error || 'Création échouée');

      const updatePayload: Record<string, unknown> = {
        opening_hours: hours as unknown as Record<string, unknown>,
      };
      if (location) {
        updatePayload.latitude = location.lat;
        updatePayload.longitude = location.lng;
        updatePayload.lat = location.lat;
        updatePayload.lng = location.lng;
      }
      if (form.city && form.city !== 'Dakar') updatePayload.city = form.city;

      const { error: upErr } = await supabase.from('restaurants').update(updatePayload as never).eq('id', result.restaurant_id);
      if (upErr) console.warn('[POST-CREATE UPDATE]', upErr);

      toast.success('🎉 Restaurant créé et publié !');
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la création';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pb-24 bg-background pt-14 px-5 max-w-lg mx-auto">
      <button onClick={() => (step === 1 ? navigate('/profile') : prev())} className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
        <ArrowLeft size={16} /> {step === 1 ? 'Retour' : 'Précédent'}
      </button>
      <h1 className="text-2xl font-extrabold mb-1">Créer mon restaurant</h1>
      <p className="text-xs text-muted-foreground mb-4">Étape {step} sur 4</p>
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
          </select>
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
              <div key={key} className="grid grid-cols-[90px_50px_1fr_1fr] gap-2 items-center">
                <span className="text-sm">{label}</span>
                <Switch checked={hours[key].open} onCheckedChange={(checked) => setHours((p) => ({ ...p, [key]: { ...p[key], open: checked } }))} />
                <Input type="time" value={hours[key].start} disabled={!hours[key].open} onChange={(e) => setHours((p) => ({ ...p, [key]: { ...p[key], start: e.target.value } }))} />
                <Input type="time" value={hours[key].end} disabled={!hours[key].open} onChange={(e) => setHours((p) => ({ ...p, [key]: { ...p[key], end: e.target.value } }))} />
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <h2 className="font-bold text-lg">Récapitulatif</h2>
          <div className="rounded-2xl bg-card border border-border p-4 space-y-2 text-sm">
            <Row label="Nom" value={form.name} />
            <Row label="Cuisine" value={form.cuisine} />
            <Row label="Ville" value={form.city} />
            {form.quartier && <Row label="Quartier" value={form.quartier} />}
            {form.address && <Row label="Adresse" value={form.address} />}
            {form.phone && <Row label="Téléphone" value={form.phone} />}
            {form.averagePrice && <Row label="Budget moyen" value={formatFCFA(Number(form.averagePrice))} />}
            {location && <Row label="GPS" value={`${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`} />}
            <Row label="Horaires" value={`${DAYS.filter((d) => hours[d.key].open).length} jour(s) ouverts`} />
            {form.description && <p className="text-xs text-muted-foreground pt-2 border-t border-border">{form.description}</p>}
          </div>
          <Button onClick={submit} disabled={submitting} className="w-full font-bold gap-2">
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            {submitting ? 'Création...' : 'Publier mon restaurant'}
          </Button>
        </div>
      )}

      {step < 4 && (
        <Button onClick={next} className="w-full mt-6 gap-2 font-bold">
          Continuer <ArrowRight size={16} />
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
