import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CartItem } from '@/contexts/CartContext';

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

export interface OrderRow {
  id: string;
  user_id: string;
  restaurant_id: string;
  restaurant_name: string;
  status: OrderStatus;
  total_amount: number;
  currency: string;
  customer_name: string | null;
  customer_phone: string | null;
  delivery_mode: string;
  delivery_address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItemRow {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  name: string;
  unit_price: number;
  quantity: number;
  notes: string | null;
}

export interface OrderWithItems extends OrderRow {
  items: OrderItemRow[];
}

export const ordersKeys = {
  all: ['orders'] as const,
  mine: (userId: string | undefined) => ['orders', 'mine', userId ?? 'anon'] as const,
  owner: (restaurantId: string | undefined) => ['orders', 'owner', restaurantId ?? 'none'] as const,
  detail: (orderId: string) => ['orders', 'detail', orderId] as const,
};

async function fetchOrdersWithItems(filter: { user_id?: string; restaurant_id?: string }): Promise<OrderWithItems[]> {
  let query = supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .order('created_at', { ascending: false })
    .limit(100);
  if (filter.user_id) query = query.eq('user_id', filter.user_id);
  if (filter.restaurant_id) query = query.eq('restaurant_id', filter.restaurant_id);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as OrderWithItems[];
}

export function useMyOrders(userId: string | undefined) {
  return useQuery({
    queryKey: ordersKeys.mine(userId),
    queryFn: () => fetchOrdersWithItems({ user_id: userId! }),
    enabled: !!userId,
  });
}

export function useOwnerOrders(restaurantId: string | undefined) {
  return useQuery({
    queryKey: ordersKeys.owner(restaurantId),
    queryFn: () => fetchOrdersWithItems({ restaurant_id: restaurantId! }),
    enabled: !!restaurantId,
    refetchInterval: 30_000,
  });
}

export interface CreateOrderInput {
  userId: string;
  restaurantId: string;
  restaurantName: string;
  items: CartItem[];
  customerName?: string;
  customerPhone?: string;
  deliveryMode: 'pickup' | 'delivery' | 'dine_in';
  deliveryAddress?: string;
  notes?: string;
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateOrderInput) => {
      if (!input.items.length) throw new Error('Le panier est vide');
      const total = input.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .insert({
          user_id: input.userId,
          restaurant_id: input.restaurantId,
          restaurant_name: input.restaurantName,
          total_amount: total,
          customer_name: input.customerName ?? null,
          customer_phone: input.customerPhone ?? null,
          delivery_mode: input.deliveryMode,
          delivery_address: input.deliveryAddress ?? null,
          notes: input.notes ?? null,
        })
        .select('*')
        .single();
      if (orderErr) throw orderErr;
      const rows = input.items.map((i) => ({
        order_id: order.id,
        menu_item_id: i.menuItemId ?? null,
        name: i.name,
        unit_price: i.unitPrice,
        quantity: i.quantity,
        notes: i.notes ?? null,
      }));
      const { error: itemsErr } = await supabase.from('order_items').insert(rows);
      if (itemsErr) throw itemsErr;
      return order as OrderRow;
    },
    onSuccess: (order) => {
      qc.invalidateQueries({ queryKey: ordersKeys.mine(order.user_id) });
      qc.invalidateQueries({ queryKey: ordersKeys.owner(order.restaurant_id) });
    },
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: OrderStatus }) => {
      const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)
        .select('*')
        .single();
      if (error) throw error;
      return data as OrderRow;
    },
    onSuccess: (order) => {
      qc.invalidateQueries({ queryKey: ordersKeys.mine(order.user_id) });
      qc.invalidateQueries({ queryKey: ordersKeys.owner(order.restaurant_id) });
    },
  });
}

/** Client-side cancel of an own pending order — uses the cancel_order RPC
 *  so no direct UPDATE policy is required on public.orders. */
export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data, error } = await supabase.rpc('cancel_order', { p_order_id: orderId });
      if (error) throw error;
      const result = data as { success: boolean; error?: string };
      if (!result?.success) throw new Error(result?.error ?? 'Annulation impossible');
      return orderId;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ordersKeys.all });
    },
  });
}

