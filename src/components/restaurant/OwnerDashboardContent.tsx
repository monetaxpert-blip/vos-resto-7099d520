import { useMemo, useState } from 'react';
import { ImagePlus, Link as LinkIcon, MapPin, MessageCircle, Plus, Sparkles, Store, Trash2 } from 'lucide-react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useRestaurantMenu } from '@/hooks/useRestaurantMenu';
import { useRestaurantOffers } from '@/hooks/useRestaurantOffers';
import { useRestaurantPhotos } from '@/hooks/useRestaurantPhotos';
import { useRestaurantStats } from '@/hooks/useRestaurantStats';
import { buildWhatsAppLink, CUISINE_OPTIONS, DAYS, DEFAULT_OPENING_HOURS, normalizeOpeningHours, PRICE_RANGE_OPTIONS, QUARTIER_OPTIONS } from '@/lib/restaurant';
import type { DBRestaurant } from '@/hooks/useDBRestaurants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import OwnerReservations from '@/components/restaurant/OwnerReservations';
import OwnerOrders from '@/components/restaurant/OwnerOrders';
import LocationPicker from '@/components/restaurant/LocationPicker';
import { formatFCFA } from '@/lib/format';

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1500).optional().or(z.literal('')),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  whatsapp_number: z.string().trim().max(30).optional().or(z.literal('')),
  average_price: z.coerce.number().min(0).max(500000).nullable(),
  website: z.string().trim().max(255).optional().or(z.literal('')),
  quartier: z.string().trim().max(80).optional().or(z.literal('')),
  cuisine_type: z.string().trim().max(80).optional().or(z.literal('')),
  address: z.string().trim().max(255).optional().or(z.literal('')),
  address_detail: z.string().trim().max(255).optional().or(z.literal('')),
  profile_image: z.string().trim().max(500).optional().or(z.literal('')),
  banner_image: z.string().trim().max(500).optional().or(z.literal('')),
  latitude: z.coerce.number().min(-90).max(90).nullable(),
  longitude: z.coerce.number().min(-180).max(180).nullable(),
});

export default function OwnerDashboardContent({ restaurant, onRefresh }: { restaurant: DBRestaurant; onRefresh: () => Promise<void> | void }) {
  const [form, setForm] = useState({
    name: restaurant.name,
    description: restaurant.description ?? '',
    phone: restaurant.phone ?? '',
    whatsapp_number: restaurant.whatsappNumber ?? '',
    website: restaurant.website ?? '',
    average_price: restaurant.averagePrice ? String(restaurant.averagePrice) : '',
    price_range: restaurant.priceRange ?? 'Standard',
    cuisine_type: restaurant.cuisineType ?? restaurant.categories[0] ?? '',
    quartier: restaurant.quartier ?? '',
    address: restaurant.address ?? '',
    address_detail: restaurant.addressDetail ?? restaurant.address ?? '',
    profile_image: restaurant.profileImage ?? '',
    banner_image: restaurant.bannerImage ?? '',
    latitude: restaurant.latitude ? String(restaurant.latitude) : restaurant.lat ? String(restaurant.lat) : '',
    longitude: restaurant.longitude ? String(restaurant.longitude) : restaurant.lng ? String(restaurant.lng) : '',
  });
  const [hours, setHours] = useState(normalizeOpeningHours(restaurant.openingHours ?? DEFAULT_OPENING_HOURS));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [menuDraft, setMenuDraft] = useState({ name: '', description: '', price: '', category: '' });
  const [offerDraft, setOfferDraft] = useState({ title: '', description: '', discount: '', valid_until: '' });
  const { items, create: createMenu, remove: removeMenu } = useRestaurantMenu(restaurant.id);
  const { offers, create: createOffer, remove: removeOffer } = useRestaurantOffers(restaurant.id);
  const { data: photos = [], refetch: refetchPhotos } = useRestaurantPhotos(restaurant.id);
  const { data: stats } = useRestaurantStats(restaurant.id);

  const whatsappLink = useMemo(() => buildWhatsAppLink(form.whatsapp_number || form.phone, form.name), [form.whatsapp_number, form.phone, form.name]);

  const persistRestaurant = async () => {
    const parsed = schema.safeParse({
      ...form,
      average_price: form.average_price ? Number(form.average_price) : null,
      latitude: form.latitude ? Number(form.latitude) : null,
      longitude: form.longitude ? Number(form.longitude) : null,
    });
    if (!parsed.success) {
      toast.error('Vérifiez les champs du profil');
      return;
    }
    setSaving(true);
    const payload = {
      ...parsed.data,
      price_range: form.price_range,
      whatsapp_link: whatsappLink || null,
      opening_hours: hours as unknown as Record<string, unknown>,
      categories: restaurant.categories,
    };
    const { error } = await supabase.from('restaurants').update(payload as never).eq('id', restaurant.id);
    setSaving(false);
    if (error) {
      toast.error('Sauvegarde impossible');
      return;
    }
    toast.success('Profil restaurant mis à jour');
    await onRefresh();
  };

  const uploadPhotos = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop() || 'jpg';
        const path = `${restaurant.id}/${crypto.randomUUID()}.${fileExt}`;
        const upload = await supabase.storage.from('restaurant-photos').upload(path, file, { upsert: false });
        if (upload.error) throw upload.error;
        const url = supabase.storage.from('restaurant-photos').getPublicUrl(path).data.publicUrl;
        const insert = await supabase.from('restaurant_photos').insert({
          restaurant_id: restaurant.id,
          storage_path: path,
          url,
          is_hero: photos.length === 0,
          uploaded_by: null,
          display_order: photos.length,
        });
        if (insert.error) throw insert.error;
      }
      toast.success('Photos ajoutées');
      await refetchPhotos();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload impossible');
    } finally {
      setUploading(false);
    }
  };

  const deletePhoto = async (id: string, storagePath: string) => {
    const { error } = await supabase.from('restaurant_photos').delete().eq('id', id);
    if (error) return toast.error('Suppression impossible');
    await supabase.storage.from('restaurant-photos').remove([storagePath]);
    toast.success('Photo supprimée');
    await refetchPhotos();
  };

  return (
    <Tabs defaultValue="profile" className="space-y-4">
      <TabsList className="grid grid-cols-7 w-full h-auto bg-secondary rounded-2xl p-1">
        <TabsTrigger value="profile">Profil</TabsTrigger>
        <TabsTrigger value="reservations">Résa</TabsTrigger>
        <TabsTrigger value="orders">Commandes</TabsTrigger>
        <TabsTrigger value="photos">Photos</TabsTrigger>
        <TabsTrigger value="menu">Menu</TabsTrigger>
        <TabsTrigger value="offers">Offres</TabsTrigger>
        <TabsTrigger value="stats">Stats</TabsTrigger>
      </TabsList>

      <TabsContent value="reservations">
        <OwnerReservations restaurantId={restaurant.id} />
      </TabsContent>

      <TabsContent value="orders">
        <OwnerOrders restaurantId={restaurant.id} />
      </TabsContent>

      <TabsContent value="profile" className="space-y-4">
        <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} placeholder="Nom du restaurant" />
            <Select value={form.cuisine_type} onValueChange={(value) => setForm((s) => ({ ...s, cuisine_type: value }))}>
              <SelectTrigger><SelectValue placeholder="Type de cuisine" /></SelectTrigger>
              <SelectContent>{CUISINE_OPTIONS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Textarea value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} placeholder="Description longue" />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input value={form.phone} onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))} placeholder="Téléphone" />
            <Input value={form.whatsapp_number} onChange={(e) => setForm((s) => ({ ...s, whatsapp_number: e.target.value }))} placeholder="Numéro WhatsApp" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input value={form.average_price} onChange={(e) => setForm((s) => ({ ...s, average_price: e.target.value }))} placeholder="Budget moyen" type="number" />
            <Select value={form.price_range} onValueChange={(value) => setForm((s) => ({ ...s, price_range: value }))}>
              <SelectTrigger><SelectValue placeholder="Gamme de prix" /></SelectTrigger>
              <SelectContent>{PRICE_RANGE_OPTIONS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Select value={form.quartier} onValueChange={(value) => setForm((s) => ({ ...s, quartier: value }))}>
              <SelectTrigger><SelectValue placeholder="Quartier" /></SelectTrigger>
              <SelectContent>{QUARTIER_OPTIONS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
            </Select>
            <Input value={form.website} onChange={(e) => setForm((s) => ({ ...s, website: e.target.value }))} placeholder="Site web" />
          </div>
          <Input value={form.address} onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))} placeholder="Adresse" />
          <Input value={form.address_detail} onChange={(e) => setForm((s) => ({ ...s, address_detail: e.target.value }))} placeholder="Adresse détaillée" />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input value={form.profile_image} onChange={(e) => setForm((s) => ({ ...s, profile_image: e.target.value }))} placeholder="Image principale URL" />
            <Input value={form.banner_image} onChange={(e) => setForm((s) => ({ ...s, banner_image: e.target.value }))} placeholder="Bannière URL" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input value={form.latitude} onChange={(e) => setForm((s) => ({ ...s, latitude: e.target.value }))} placeholder="Latitude" type="number" step="any" />
            <Input value={form.longitude} onChange={(e) => setForm((s) => ({ ...s, longitude: e.target.value }))} placeholder="Longitude" type="number" step="any" />
          </div>
          <div className="rounded-xl bg-secondary p-3 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold"><MessageCircle size={14} className="text-primary" /> WhatsApp</div>
            <Input value={whatsappLink} readOnly />
            <a href={whatsappLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-primary"><LinkIcon size={14} /> Tester le lien</a>
          </div>
          <div className="rounded-xl bg-secondary p-3 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold"><Store size={14} className="text-primary" /> Horaires</div>
            {DAYS.map(({ key, label }) => (
              <div key={key} className="grid grid-cols-[120px_60px_1fr_1fr] gap-2 items-center">
                <span className="text-sm">{label}</span>
                <Switch checked={hours[key].open} onCheckedChange={(checked) => setHours((prev) => ({ ...prev, [key]: { ...prev[key], open: checked } }))} />
                <Input type="time" value={hours[key].start} onChange={(e) => setHours((prev) => ({ ...prev, [key]: { ...prev[key], start: e.target.value } }))} />
                <Input type="time" value={hours[key].end} onChange={(e) => setHours((prev) => ({ ...prev, [key]: { ...prev[key], end: e.target.value } }))} />
              </div>
            ))}
          </div>
          <Button onClick={persistRestaurant} disabled={saving}>{saving ? 'Sauvegarde...' : 'Enregistrer le profil'}</Button>
        </div>
      </TabsContent>

      <TabsContent value="photos" className="space-y-4">
        <div className="rounded-2xl bg-card border border-border p-4 space-y-4">
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border p-6 text-sm font-semibold text-primary">
            <ImagePlus size={16} />
            {uploading ? 'Upload...' : 'Ajouter des photos'}
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => uploadPhotos(e.target.files)} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            {photos.map((photo) => (
              <div key={photo.id} className="rounded-2xl overflow-hidden border border-border bg-secondary">
                <img src={photo.url} alt="Restaurant" className="h-32 w-full object-cover" />
                <button onClick={() => deletePhoto(photo.id, photo.storage_path)} className="w-full inline-flex items-center justify-center gap-2 py-2 text-xs font-semibold text-destructive"><Trash2 size={12} /> Supprimer</button>
              </div>
            ))}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="menu" className="space-y-4">
        <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input value={menuDraft.name} onChange={(e) => setMenuDraft((s) => ({ ...s, name: e.target.value }))} placeholder="Nom du plat" />
            <Input value={menuDraft.category} onChange={(e) => setMenuDraft((s) => ({ ...s, category: e.target.value }))} placeholder="Catégorie" />
          </div>
          <Textarea value={menuDraft.description} onChange={(e) => setMenuDraft((s) => ({ ...s, description: e.target.value }))} placeholder="Description" />
          <div className="flex gap-3">
            <Input value={menuDraft.price} onChange={(e) => setMenuDraft((s) => ({ ...s, price: e.target.value }))} placeholder="Prix" type="number" />
            <Button onClick={() => createMenu.mutate({ restaurant_id: restaurant.id, name: menuDraft.name, description: menuDraft.description || null, price: Number(menuDraft.price || 0), category: menuDraft.category || null }, { onSuccess: () => setMenuDraft({ name: '', description: '', price: '', category: '' }) })}><Plus size={14} /> Ajouter</Button>
          </div>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-secondary p-3">
                <div>
                  <p className="font-semibold text-sm">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.category || 'Menu'} · {formatFCFA(item.price)}</p>
                </div>
                <button onClick={() => removeMenu.mutate(item.id)} className="text-xs font-semibold text-destructive">Supprimer</button>
              </div>
            ))}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="offers" className="space-y-4">
        <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input value={offerDraft.title} onChange={(e) => setOfferDraft((s) => ({ ...s, title: e.target.value }))} placeholder="Titre de l'offre" />
            <Input value={offerDraft.discount} onChange={(e) => setOfferDraft((s) => ({ ...s, discount: e.target.value }))} placeholder="Remise %" type="number" />
          </div>
          <Textarea value={offerDraft.description} onChange={(e) => setOfferDraft((s) => ({ ...s, description: e.target.value }))} placeholder="Description" />
          <div className="flex gap-3">
            <Input value={offerDraft.valid_until} onChange={(e) => setOfferDraft((s) => ({ ...s, valid_until: e.target.value }))} type="date" />
            <Button onClick={() => createOffer.mutate({ restaurant_id: restaurant.id, title: offerDraft.title, description: offerDraft.description || null, discount: offerDraft.discount ? Number(offerDraft.discount) : null, valid_until: offerDraft.valid_until ? new Date(offerDraft.valid_until).toISOString() : null }, { onSuccess: () => setOfferDraft({ title: '', description: '', discount: '', valid_until: '' }) })}><Sparkles size={14} /> Publier</Button>
          </div>
          <div className="space-y-2">
            {offers.map((offer) => (
              <div key={offer.id} className="flex items-center justify-between gap-3 rounded-xl bg-secondary p-3">
                <div>
                  <p className="font-semibold text-sm">{offer.title}</p>
                  <p className="text-xs text-muted-foreground">{offer.discount ? `-${offer.discount}%` : 'Offre'} · {offer.valid_until ? new Date(offer.valid_until).toLocaleDateString('fr-FR') : 'Sans date'}</p>
                </div>
                <button onClick={() => removeOffer.mutate(offer.id)} className="text-xs font-semibold text-destructive">Supprimer</button>
              </div>
            ))}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="stats" className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[
            ['Vues', stats?.views ?? 0],
            ['Clics', stats?.clicks ?? 0],
            ['WhatsApp', stats?.whatsapp ?? 0],
            ['Itinéraires', stats?.directions ?? 0],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-card border border-border p-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-2xl font-extrabold mt-1">{value}</p>
            </div>
          ))}
        </div>
        <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-semibold">Conversion</p>
            <p className="text-sm font-bold text-primary">{(stats?.conversionRate ?? 0).toFixed(1)}%</p>
          </div>
          <div className="space-y-2">
            {(stats?.trafficByHour ?? []).map((slot) => (
              <div key={slot.hour} className="flex items-center gap-3 text-sm">
                <span className="w-10 text-muted-foreground">{slot.hour}</span>
                <div className="h-2 flex-1 rounded-full bg-secondary overflow-hidden"><div className="h-full bg-primary" style={{ width: `${Math.min(100, slot.count * 12)}%` }} /></div>
                <span className="w-6 text-right font-semibold">{slot.count}</span>
              </div>
            ))}
            {(stats?.trafficByHour ?? []).length === 0 && <p className="text-sm text-muted-foreground">Pas encore assez de données.</p>}
          </div>
          <div className="rounded-xl bg-secondary p-3 text-xs text-muted-foreground inline-flex items-center gap-2"><MapPin size={12} /> Le bouton itinéraire reste traqué automatiquement.</div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
