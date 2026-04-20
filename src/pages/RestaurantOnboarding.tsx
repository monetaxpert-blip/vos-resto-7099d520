import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Store, Plus, Search, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { restaurants } from '@/data/restaurants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

type Mode = 'choose' | 'claim' | 'create';

const RestaurantOnboarding = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<Mode>('choose');
  const [query, setQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // create form
  const [form, setForm] = useState({
    name: '',
    address: '',
    quartier: '',
    phone: '',
    categories: '',
  });

  if (!authLoading && !user) {
    navigate('/auth?redirect=/restaurant/onboarding');
    return null;
  }

  const matches = query.trim()
    ? restaurants
        .filter((r) => r.name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 8)
    : [];

  const handleClaim = async (r: (typeof restaurants)[number]) => {
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase.from('restaurant_owners').insert({
      user_id: user.id,
      restaurant_id: r.id,
      restaurant_name: r.name,
      is_owned_listing: false,
    });
    setSubmitting(false);
    if (error) {
      if (error.code === '23505') toast.error('Vous gérez déjà ce restaurant');
      else toast.error("Erreur lors de l'inscription");
      return;
    }
    toast.success('Restaurant ajouté ! 30 jours d\'essai offerts 🎉');
    navigate('/restaurant/dashboard');
  };

  const handleCreate = async () => {
    if (!user || !form.name.trim()) {
      toast.error('Le nom est obligatoire');
      return;
    }
    setSubmitting(true);
    const { data: created, error } = await supabase
      .from('owned_restaurants')
      .insert({
        owner_id: user.id,
        name: form.name.trim(),
        address: form.address.trim() || null,
        quartier: form.quartier.trim() || null,
        phone: form.phone.trim() || null,
        categories: form.categories
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean),
      })
      .select()
      .single();
    if (error || !created) {
      setSubmitting(false);
      toast.error('Création impossible');
      return;
    }
    const { error: ownErr } = await supabase.from('restaurant_owners').insert({
      user_id: user.id,
      restaurant_id: created.id,
      restaurant_name: created.name,
      is_owned_listing: true,
    });
    setSubmitting(false);
    if (ownErr) {
      toast.error('Erreur lors de l\'enregistrement');
      return;
    }
    toast.success('Restaurant créé ! 30 jours d\'essai offerts 🎉');
    navigate('/restaurant/dashboard');
  };

  return (
    <div className="min-h-screen pb-24 bg-background pt-14 px-5 max-w-lg mx-auto">
      <button
        onClick={() => (mode === 'choose' ? navigate('/profile') : setMode('choose'))}
        className="flex items-center gap-1 text-sm text-muted-foreground mb-4"
      >
        <ArrowLeft size={16} /> Retour
      </button>

      <h1 className="text-2xl font-extrabold mb-2">Espace restaurateur</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Inscription gratuite avec <span className="font-bold text-primary">30 jours d'essai</span> offerts.
      </p>

      {mode === 'choose' && (
        <div className="space-y-3">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setMode('claim')}
            className="w-full rounded-2xl border border-border bg-card p-5 text-left flex items-start gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Store className="text-primary" size={20} />
            </div>
            <div>
              <p className="font-bold">J'ai déjà un restaurant listé</p>
              <p className="text-xs text-muted-foreground mt-1">
                Réclamer un restaurant existant dans Vos Resto.
              </p>
            </div>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setMode('create')}
            className="w-full rounded-2xl border border-border bg-card p-5 text-left flex items-start gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Plus className="text-primary" size={20} />
            </div>
            <div>
              <p className="font-bold">Ajouter un nouveau restaurant</p>
              <p className="text-xs text-muted-foreground mt-1">
                Créer une nouvelle fiche pour votre établissement.
              </p>
            </div>
          </motion.button>
        </div>
      )}

      {mode === 'claim' && (
        <div className="space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Rechercher votre restaurant..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="space-y-2">
            {matches.map((r) => (
              <button
                key={r.id}
                disabled={submitting}
                onClick={() => handleClaim(r)}
                className="w-full text-left p-3 rounded-xl bg-card border border-border hover:border-primary transition-colors"
              >
                <p className="font-semibold text-sm">{r.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {r.quartier || r.city} · {r.categories.slice(0, 2).join(', ')}
                </p>
              </button>
            ))}
            {query && matches.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">
                Aucun restaurant trouvé. Essayez de l'ajouter à la place.
              </p>
            )}
          </div>
        </div>
      )}

      {mode === 'create' && (
        <div className="space-y-3">
          <Input
            placeholder="Nom du restaurant *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            placeholder="Adresse"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <Input
            placeholder="Quartier (Almadies, Plateau...)"
            value={form.quartier}
            onChange={(e) => setForm({ ...form, quartier: e.target.value })}
          />
          <Input
            placeholder="Téléphone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <Input
            placeholder="Catégories (séparées par des virgules)"
            value={form.categories}
            onChange={(e) => setForm({ ...form, categories: e.target.value })}
          />
          <Button
            onClick={handleCreate}
            disabled={submitting}
            className="w-full font-bold"
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            Créer mon restaurant
          </Button>
        </div>
      )}
    </div>
  );
};

export default RestaurantOnboarding;
