import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Minus, Plus } from 'lucide-react';
import { formatFCFA } from '@/lib/format';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';

export interface MenuSectionItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
}

export interface MenuSectionCategory {
  id: string;
  name: string;
  items: MenuSectionItem[];
}

interface MenuSectionProps {
  menu: MenuSectionCategory[];
  orderable?: boolean;
  restaurantId?: string;
  restaurantName?: string;
}

const MenuSection = ({ menu, orderable = false, restaurantId, restaurantName }: MenuSectionProps) => {
  const categoryIds = useMemo(() => menu.map((c) => c.id), [menu]);
  const cart = useCart();

  if (menu.length === 0) return null;

  const scrollTo = (id: string) => {
    const el = document.getElementById(`menu-cat-${id}`);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  const findLine = (menuItemId: string) =>
    cart.restaurantId === restaurantId ? cart.items.find((i) => i.menuItemId === menuItemId) : undefined;

  const handleAdd = (item: MenuSectionItem) => {
    if (!orderable || !restaurantId || !restaurantName) return;
    const { switched } = cart.addItem({
      restaurantId,
      restaurantName,
      item: { menuItemId: item.id, name: item.name, unitPrice: item.price },
    });
    if (switched) toast.info(`Panier réinitialisé pour ${restaurantName}`);
  };

  return (
    <section className="mt-8">
      <h2 className="text-lg font-bold mb-3">Menu</h2>
      <div className="sticky top-0 z-20 -mx-5 px-5 py-2 bg-background/85 backdrop-blur-md border-b border-border/40">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
          {menu.map((cat) => (
            <motion.button
              key={cat.id}
              whileTap={{ scale: 0.94 }}
              onClick={() => scrollTo(cat.id)}
              className="flex-shrink-0 rounded-full bg-secondary px-4 py-1.5 text-xs font-semibold text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              {cat.name}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-6">
        {menu.map((cat, ci) => (
          <div key={cat.id} id={`menu-cat-${cat.id}`} className="scroll-mt-24">
            <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3">{cat.name}</h3>
            <div className="space-y-2">
              {cat.items.map((item, i) => {
                const line = orderable ? findLine(item.id) : undefined;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ delay: Math.min((ci + i) * 0.03, 0.25) }}
                    className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-card shadow-card"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{item.name}</p>
                      {item.description && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.description}</p>}
                      <span className="font-bold text-sm text-primary whitespace-nowrap mt-1 inline-block">{formatFCFA(item.price)}</span>
                    </div>
                    {orderable && (
                      <div className="flex-shrink-0">
                        {line ? (
                          <div className="inline-flex items-center gap-1 rounded-full bg-secondary p-1">
                            <button
                              onClick={() => cart.updateQuantity(line.id, line.quantity - 1)}
                              className="w-7 h-7 rounded-full bg-background flex items-center justify-center"
                              aria-label="Retirer"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="min-w-[20px] text-center text-sm font-bold">{line.quantity}</span>
                            <button
                              onClick={() => cart.updateQuantity(line.id, line.quantity + 1)}
                              className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
                              aria-label="Ajouter"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleAdd(item)}
                            className="inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground px-3 py-1.5 text-xs font-bold"
                          >
                            <Plus size={12} /> Ajouter
                          </button>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
        {!orderable && <p className="text-[10px] text-muted-foreground text-center pt-2">Prix indicatifs — peuvent varier</p>}
      </div>
      <span className="hidden">{categoryIds.join(',')}</span>
    </section>
  );
};

export default MenuSection;
