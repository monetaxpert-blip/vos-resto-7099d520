REVOKE EXECUTE ON FUNCTION public.enforce_order_item_price() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_restaurant_active_on_order() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recompute_order_total() FROM PUBLIC, anon, authenticated;