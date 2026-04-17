import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { MenuCategory } from '@/data/menus';
import { formatFCFA } from '@/lib/format';

interface MenuSectionProps {
  menu: MenuCategory[];
}

const MenuSection = ({ menu }: MenuSectionProps) => {
  const categoryIds = useMemo(() => menu.map((c) => c.id), [menu]);

  if (menu.length === 0) return null;

  const scrollTo = (id: string) => {
    const el = document.getElementById(`menu-cat-${id}`);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  return (
    <section className="mt-8">
      <h2 className="text-lg font-bold mb-3">Menu</h2>

      {/* Horizontal category nav */}
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
            <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3">
              {cat.name}
            </h3>
            <div className="space-y-2">
              {cat.items.map((item, i) => (
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
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                  <span className="font-bold text-sm text-primary whitespace-nowrap">
                    {formatFCFA(item.price)}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
        <p className="text-[10px] text-muted-foreground text-center pt-2">
          Prix indicatifs — peuvent varier
        </p>
      </div>
      {/* anchor list to keep ids referenced */}
      <span className="hidden">{categoryIds.join(',')}</span>
    </section>
  );
};

export default MenuSection;
