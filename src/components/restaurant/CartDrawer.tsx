import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCart } from '@/contexts/CartContext';
import { useCreateOrder } from '@/hooks/useOrders';
import { useAuth } from '@/contexts/AuthContext';
import { formatFCFA } from '@/lib/format';
import { ShoppingBag, Minus, Plus, Trash2, MapPin, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const CartDrawer = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const cart = useCart();
  const createOrder = useCreateOrder();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'pickup' | 'delivery'>('pickup');
  const [address, setAddress] = useState('');
  const [name, setName] = useState((user?.user_metadata?.display_name as string) ?? '');
  const [phone, setPhone] = useState('');
  const [confirmedId, setConfirmedId] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  if (cart.items.length === 0 && !open) return null;

  const useMyLocation = () => {
    if (!('geolocation' in navigator)) return toast.error('Géolocalisation indisponible');
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`, { headers: { 'Accept-Language': 'fr' } });
          const data = await r.json();
          setAddress(data?.display_name ?? `${pos.coords.latitude}, ${pos.coords.longitude}`);
        } catch {
          setAddress(`${pos.coords.latitude}, ${pos.coords.longitude}`);
        }
        setGeoLoading(false);
      },
      (err) => { toast.error(err.message); setGeoLoading(false); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const submit = () => {
    if (!user) {
      toast.error('Connectez-vous pour commander');
      setOpen(false);
      navigate('/auth?redirect=/');
      return;
    }
    if (!cart.restaurantId || !cart.restaurantName) return;
    if (!name.trim() || !phone.trim()) return toast.error('Nom et téléphone requis');
    if (mode === 'delivery' && !address.trim()) return toast.error('Adresse de livraison requise');

    createOrder.mutate(
      {
        userId: user.id,
        restaurantId: cart.restaurantId,
        restaurantName: cart.restaurantName,
        items: cart.items,
        customerName: name.trim(),
        customerPhone: phone.trim(),
        deliveryMode: mode,
        deliveryAddress: mode === 'delivery' ? address.trim() : undefined,
      },
      {
        onSuccess: (order) => {
          setConfirmedId(order.id);
          cart.clear();
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : 'Erreur'),
      },
    );
  };

  const closeAll = () => {
    setOpen(false);
    setTimeout(() => setConfirmedId(null), 300);
  };

  return (
    <>
      {cart.items.length > 0 && !confirmedId && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 rounded-full bg-primary text-primary-foreground px-5 py-3 shadow-lg flex items-center gap-3 font-bold text-sm"
        >
          <ShoppingBag size={18} />
          <span>{cart.totalItems} article{cart.totalItems > 1 ? 's' : ''}</span>
          <span className="opacity-80">·</span>
          <span>{formatFCFA(cart.totalAmount)}</span>
        </button>
      )}

      <Drawer open={open} onOpenChange={(v) => { if (!v) closeAll(); else setOpen(true); }}>
        <DrawerContent className="max-h-[92vh]">
          <DrawerHeader>
            <DrawerTitle>{confirmedId ? 'Commande envoyée ✅' : `Panier — ${cart.restaurantName ?? ''}`}</DrawerTitle>
          </DrawerHeader>

          {confirmedId ? (
            <div className="px-5 pb-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/15 flex items-center justify-center">
                <Check size={28} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Numéro de commande</p>
                <p className="text-2xl font-extrabold tracking-wider">#{confirmedId.slice(0, 8).toUpperCase()}</p>
              </div>
              <p className="text-sm">Temps estimé : <span className="font-bold">30–45 min</span></p>
              <Button className="w-full" onClick={() => { closeAll(); navigate('/orders'); }}>Voir mes commandes</Button>
            </div>
          ) : (
            <div className="px-5 pb-6 space-y-4 overflow-y-auto">
              {/* Items */}
              <div className="space-y-2">
                {cart.items.map((line) => (
                  <div key={line.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{line.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFCFA(line.unitPrice)}</p>
                    </div>
                    <div className="inline-flex items-center gap-1">
                      <button onClick={() => cart.updateQuantity(line.id, line.quantity - 1)} className="w-7 h-7 rounded-full bg-background flex items-center justify-center"><Minus size={12} /></button>
                      <span className="min-w-[20px] text-center text-sm font-bold">{line.quantity}</span>
                      <button onClick={() => cart.updateQuantity(line.id, line.quantity + 1)} className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center"><Plus size={12} /></button>
                    </div>
                    <button onClick={() => cart.removeItem(line.id)} className="text-destructive" aria-label="Supprimer"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>

              {/* Mode */}
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setMode('pickup')} className={`rounded-xl py-2.5 text-sm font-bold ${mode === 'pickup' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>À emporter</button>
                <button onClick={() => setMode('delivery')} className={`rounded-xl py-2.5 text-sm font-bold ${mode === 'delivery' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>Livraison</button>
              </div>

              {mode === 'delivery' && (
                <div className="space-y-2">
                  <Button type="button" variant="outline" onClick={useMyLocation} disabled={geoLoading} className="w-full gap-2">
                    {geoLoading ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}
                    📍 Utiliser ma position
                  </Button>
                  <Textarea placeholder="Adresse de livraison" value={address} onChange={(e) => setAddress(e.target.value)} />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Nom" value={name} onChange={(e) => setName(e.target.value)} />
                <Input placeholder="Téléphone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>

              <p className="text-[11px] text-muted-foreground text-center">Paiement à la livraison/retrait — Mobile Money bientôt</p>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="text-xl font-extrabold">{formatFCFA(cart.totalAmount)}</span>
              </div>

              <Button onClick={submit} disabled={createOrder.isPending} className="w-full gap-2">
                {createOrder.isPending && <Loader2 size={14} className="animate-spin" />}
                Commander
              </Button>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default CartDrawer;
