import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CITY_OPTIONS, CUISINE_OPTIONS, QUARTIER_OPTIONS } from '@/lib/restaurant';

const RestaurantOnboarding = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', address: '', city: 'Dakar', quartier: '', phone: '', categories: 'Sénégalais', description: '' });

  if (!authLoading && !user) {
    navigate('/auth?redirect=/restaurant/onboarding');
    return null;
  }

  const createRestaurant = async () => {
    if (submitting) return;
    if (!user) {
      toast.error('Vous devez être connecté');
      return;
    }
    if (!form.name.trim()) {
      setError('Le nom du restaurant est requis');
      toast.error('Le nom du restaurant est requis');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        p_name: form.name.trim(),
        p_description: form.description.trim() || null,
        p_address: form.address.trim() || null,
        p_quartier: form.quartier || null,
        p_phone: form.phone.trim() || null,
        p_cuisine_type: form.categories || null,
        p_average_price: null,
      };
      console.log('[CREATE RESTO PAYLOAD]', payload);
      const { data, error: rpcError } = await supabase.rpc('create_restaurant_with_owner', payload);
      if (rpcError) {
        console.error('[RPC ERROR]', rpcError);
        throw new Error(rpcError.message);
      }
      const result = data as { success?: boolean; error?: string; restaurant_id?: string } | null;
      if (!result?.success) {
        throw new Error(result?.error || 'Création échouée');
      }
      // Update city if non-default (RPC defaults to 'Dakar')
      if (result.restaurant_id && form.city && form.city !== 'Dakar') {
        const { error: cityErr } = await supabase
          .from('restaurants')
          .update({ city: form.city })
          .eq('id', result.restaurant_id);
        if (cityErr) console.warn('[CITY UPDATE]', cityErr);
      }
      toast.success('🎉 Restaurant créé !');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('[CREATE RESTAURANT]', err);
      const msg = err?.message || 'Erreur lors de la création';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pb-24 bg-background pt-14 px-5 max-w-lg mx-auto">
      <button onClick={() => navigate('/profile')} className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
        <ArrowLeft size={16} /> Retour
      </button>
      <h1 className="text-2xl font-extrabold mb-2">Créer mon restaurant</h1>
      <p className="text-sm text-muted-foreground mb-6">Ajoutez votre établissement à la marketplace. 30 jours d'essai offerts.</p>

      <fieldset disabled={submitting} className="space-y-3 disabled:opacity-70">
        <Input placeholder="Nom du restaurant *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input placeholder="Adresse" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <Input placeholder="Téléphone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <select value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
          {CITY_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select value={form.quartier} onChange={(e) => setForm({ ...form, quartier: e.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
          <option value="">Quartier (optionnel)</option>
          {QUARTIER_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select value={form.categories} onChange={(e) => setForm({ ...form, categories: e.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
          {CUISINE_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
        <Button type="button" onClick={createRestaurant} disabled={submitting} className="w-full font-bold gap-2">
          {submitting && <Loader2 size={16} className="animate-spin" />}
          {submitting ? 'Création en cours...' : 'Créer mon restaurant'}
        </Button>
        {error && <p className="text-sm text-destructive text-center">{error}</p>}
      </fieldset>
    </div>
  );
};

export default RestaurantOnboarding;
