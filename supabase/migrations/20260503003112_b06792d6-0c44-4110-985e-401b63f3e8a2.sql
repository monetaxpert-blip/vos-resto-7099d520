
CREATE OR REPLACE FUNCTION public.create_restaurant_with_owner(
  p_name text,
  p_description text DEFAULT NULL,
  p_address text DEFAULT NULL,
  p_quartier text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_cuisine_type text DEFAULT NULL,
  p_average_price numeric DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_restaurant_id text;
  v_whatsapp_number text;
  v_whatsapp_link text;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Vous devez être connecté');
  END IF;

  IF p_name IS NULL OR trim(p_name) = '' THEN
    RETURN json_build_object('success', false, 'error', 'Le nom du restaurant est requis');
  END IF;

  v_restaurant_id := gen_random_uuid()::text;
  v_whatsapp_number := NULLIF(regexp_replace(COALESCE(p_phone, ''), '\D', '', 'g'), '');
  IF v_whatsapp_number IS NOT NULL THEN
    v_whatsapp_link := 'https://wa.me/' || v_whatsapp_number;
  END IF;

  INSERT INTO public.restaurants (
    id, name, description, address, address_detail, quartier, city,
    phone, categories, cuisine_type, average_price,
    whatsapp_number, whatsapp_link, is_active
  ) VALUES (
    v_restaurant_id,
    trim(p_name),
    NULLIF(trim(COALESCE(p_description, '')), ''),
    NULLIF(trim(COALESCE(p_address, '')), ''),
    NULLIF(trim(COALESCE(p_address, '')), ''),
    NULLIF(p_quartier, ''),
    'Dakar',
    NULLIF(trim(COALESCE(p_phone, '')), ''),
    CASE WHEN p_cuisine_type IS NOT NULL AND length(trim(p_cuisine_type)) > 0
         THEN ARRAY[p_cuisine_type] ELSE '{}'::text[] END,
    NULLIF(p_cuisine_type, ''),
    p_average_price,
    v_whatsapp_number,
    v_whatsapp_link,
    true
  );

  INSERT INTO public.restaurant_owners (
    user_id, restaurant_id, restaurant_name, is_owned_listing
  ) VALUES (
    v_user_id, v_restaurant_id, trim(p_name), true
  );

  RETURN json_build_object('success', true, 'restaurant_id', v_restaurant_id);

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_restaurant_with_owner(text, text, text, text, text, text, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_restaurant_with_owner(text, text, text, text, text, text, numeric) TO authenticated;
