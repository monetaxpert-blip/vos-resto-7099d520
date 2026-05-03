import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Plus, Search, Store } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useDBRestaurants } from '@/hooks/useDBRestaurants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { buildWhatsAppLink, CUISINE_OPTIONS, QUARTIER_OPTIONS } from '@/lib/restaurant';

type Mode = 'choose' | 'claim' | 'create';

const RestaurantOnboarding = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { list } = useDBRestaurants();
  const [mode, setMode] = useState<Mode>('choose');
  const [query, setQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', address: '', quartier: '', phone: '', categories: 'Sénégalais', description: '' });

  if (!authLoading && !user) {
    navigate('/auth?redirect=/restaurant/onboarding');
    return null;
  }

  const matches = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.trim().toLowerCase();
    return list.filter((restaurant) => restaurant.name.toLowerCase().includes(q)).slice(0, 8);
  }, [list, query]);

  const claim = async (restaurantId: string, restaurantName: string) => {
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase.from('restaurant_owners').insert({ user_id: user.id, restaurant_id: restaurantId, restaurant_name: restaurantName, is_owned_listing: false });
    setSubmitting(false);
    if (error) return toast.error(error.code === '23505' ? 'Restaurant déjà lié à votre compte' : 'Réclamation impossible');
    toast.success('Restaurant relié à votre compte');
    navigate('/dashboard');
  };

  const createRestaurant = async () => {
    if (submitting) return;
    if (!user || !form.name.trim()) return toast.error('Le nom est requis');
    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('create_restaurant_with_owner', {
        p_name: form.name.trim(),
        p_description: form.description.trim() || null,
        p_address: form.address.trim() || null,
        p_quartier: form.quartier || null,
        p_phone: form.phone.trim() || null,
        p_cuisine_type: form.categories || null,
        p_average_price: null,
      });
      if (error) {
        console.error('[RPC create_restaurant_with_owner]', error);
        toast.error(error.message);
        return;
      }
      const result = data as { success?: boolean; restaurant_id?: string } | null;
      if (!result?.success) {
        toast.error('Création échouée');
        return;
      }
      toast.success('🎉 Restaurant créé avec succès !');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('[CREATE RESTAURANT]', err);
      toast.error(err?.message || 'Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pb-24 bg-background pt-14 px-5 max-w-lg mx-auto">
      <button onClick={() => (mode === 'choose' ? navigate('/profile') : setMode('choose'))} className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
        <ArrowLeft size={16} /> Retour
      </button>
      <h1 className="text-2xl font-extrabold mb-2">Je suis un restaurant</h1>
      <p className="text-sm text-muted-foreground mb-6">Créez votre espace de gestion et profitez de 30 jours d’essai.</p>

      {mode === 'choose' && (
        <div className="space-y-3">
          <motion.button whileTap={{ scale: 0.98 }} onClick={() => setMode('claim')} className="w-full rounded-2xl border border-border bg-card p-5 text-left flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><Store className="text-primary" size={20} /></div>
            <div><p className="font-bold">Réclamer un restaurant listé</p><p className="text-xs text-muted-foreground mt-1">Relier une fiche existante à votre compte.</p></div>
          </motion.button>
          <motion.button whileTap={{ scale: 0.98 }} onClick={() => setMode('create')} className="w-full rounded-2xl border border-border bg-card p-5 text-left flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><Plus className="text-primary" size={20} /></div>
            <div><p className="font-bold">Créer ma fiche restaurant</p><p className="text-xs text-muted-foreground mt-1">Ajoutez votre établissement à la marketplace.</p></div>
          </motion.button>
        </div>
      )}

      {mode === 'claim' && (
        <div className="space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input autoFocus placeholder="Rechercher votre restaurant" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
          </div>
          <div className="space-y-2">
            {matches.map((restaurant) => (
              <button key={restaurant.id} disabled={submitting} onClick={() => claim(restaurant.id, restaurant.name)} className="w-full text-left p-3 rounded-xl bg-card border border-border hover:border-primary transition-colors">
                <p className="font-semibold text-sm">{restaurant.name}</p>
                <p className="text-xs text-muted-foreground truncate">{restaurant.quartier || restaurant.city} · {restaurant.categories.slice(0, 2).join(', ')}</p>
              </button>
            ))}
            {query && matches.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Aucun résultat. Créez une nouvelle fiche.</p>}
          </div>
        </div>
      )}

      {mode === 'create' && (
        <div className="space-y-3">
          <Input placeholder="Nom du restaurant *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input placeholder="Adresse" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <Input placeholder="Téléphone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <select value={form.quartier} onChange={(e) => setForm({ ...form, quartier: e.target.value })} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Quartier</option>
            {QUARTIER_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select value={form.categories} onChange={(e) => setForm({ ...form, categories: e.target.value })} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            {CUISINE_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm" />
          <Button onClick={createRestaurant} disabled={submitting} className="w-full font-bold">{submitting && <Loader2 size={16} className="animate-spin" />}Créer mon restaurant</Button>
        </div>
      )}
    </div>
  );
};

export default RestaurantOnboarding;
