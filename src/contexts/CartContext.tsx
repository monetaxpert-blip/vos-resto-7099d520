import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

/**
 * Cart is intentionally scoped to ONE restaurant at a time.
 * Adding an item from a different restaurant prompts a reset.
 * Persisted in localStorage so the user never loses the cart on refresh.
 */
export interface CartItem {
  id: string;            // line id (uuid generated client-side)
  menuItemId?: string;
  name: string;
  unitPrice: number;
  quantity: number;
  notes?: string;
}

export interface CartState {
  restaurantId: string | null;
  restaurantName: string | null;
  items: CartItem[];
}

interface CartContextValue extends CartState {
  totalAmount: number;
  totalItems: number;
  addItem: (params: { restaurantId: string; restaurantName: string; item: Omit<CartItem, 'id' | 'quantity'> & { quantity?: number } }) => { switched: boolean };
  updateQuantity: (lineId: string, quantity: number) => void;
  removeItem: (lineId: string) => void;
  clear: () => void;
}

const STORAGE_KEY = 'vosresto.cart.v1';
const EMPTY: CartState = { restaurantId: null, restaurantName: null, items: [] };

const CartContext = createContext<CartContextValue | undefined>(undefined);

function loadFromStorage(): CartState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.items)) return EMPTY;
    return { restaurantId: parsed.restaurantId ?? null, restaurantName: parsed.restaurantName ?? null, items: parsed.items };
  } catch {
    return EMPTY;
  }
}

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<CartState>(EMPTY);

  // Hydrate on mount only (avoid SSR mismatch / first-paint flicker)
  useEffect(() => { setState(loadFromStorage()); }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* quota — ignore */ }
  }, [state]);

  const addItem: CartContextValue['addItem'] = useCallback(({ restaurantId, restaurantName, item }) => {
    let switched = false;
    setState((prev) => {
      if (prev.restaurantId && prev.restaurantId !== restaurantId) {
        switched = true;
        return {
          restaurantId,
          restaurantName,
          items: [{ ...item, id: crypto.randomUUID(), quantity: item.quantity ?? 1 }],
        };
      }
      const existingIdx = prev.items.findIndex((i) => i.menuItemId && i.menuItemId === item.menuItemId);
      if (existingIdx >= 0) {
        const next = [...prev.items];
        next[existingIdx] = { ...next[existingIdx], quantity: next[existingIdx].quantity + (item.quantity ?? 1) };
        return { restaurantId, restaurantName, items: next };
      }
      return {
        restaurantId,
        restaurantName,
        items: [...prev.items, { ...item, id: crypto.randomUUID(), quantity: item.quantity ?? 1 }],
      };
    });
    return { switched };
  }, []);

  const updateQuantity = useCallback((lineId: string, quantity: number) => {
    setState((prev) => ({
      ...prev,
      items: prev.items
        .map((i) => (i.id === lineId ? { ...i, quantity: Math.max(0, quantity) } : i))
        .filter((i) => i.quantity > 0),
    }));
  }, []);

  const removeItem = useCallback((lineId: string) => {
    setState((prev) => ({ ...prev, items: prev.items.filter((i) => i.id !== lineId) }));
  }, []);

  const clear = useCallback(() => setState(EMPTY), []);

  const value = useMemo<CartContextValue>(() => {
    const totalAmount = state.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    const totalItems = state.items.reduce((sum, i) => sum + i.quantity, 0);
    return { ...state, totalAmount, totalItems, addItem, updateQuantity, removeItem, clear };
  }, [state, addItem, updateQuantity, removeItem, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
