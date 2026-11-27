-- ==============================================================================
-- PAPER BLOOM — 03_functions.sql
-- Profile sync trigger, rate limiter RPC, and atomic place_order function.
-- ==============================================================================

-- 1. Auto-create profile when a user (or anonymous guest) signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, is_guest)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.is_anonymous, false)
  )
  ON CONFLICT (id) DO UPDATE
    SET is_guest = COALESCE(NEW.is_anonymous, false),
        updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE OF is_anonymous ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Lightweight Postgres-backed sliding-window rate limit check (service_role only)
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key text,
  p_max_hits integer,
  p_window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.rate_limits%ROWTYPE;
BEGIN
  SELECT * INTO v_row FROM public.rate_limits WHERE key = p_key FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO public.rate_limits (key, hits, window_start)
    VALUES (p_key, 1, now());
    RETURN true;
  END IF;

  IF v_row.window_start + make_interval(secs => p_window_seconds) < now() THEN
    UPDATE public.rate_limits
      SET hits = 1, window_start = now()
      WHERE key = p_key;
    RETURN true;
  END IF;

  IF v_row.hits >= p_max_hits THEN
    RETURN false;
  END IF;

  UPDATE public.rate_limits
    SET hits = hits + 1
    WHERE key = p_key;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.check_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, integer, integer) TO service_role;

-- 3. Atomic transactional order placement (service_role only)
CREATE OR REPLACE FUNCTION public.place_order(
  p_user_id uuid,
  p_idempotency_key text,
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_zone_code text,
  p_district text,
  p_thana text,
  p_address_line text,
  p_landmark text,
  p_postal_code text,
  p_payment_method text,
  p_coupon_code text,
  p_gift_wrap boolean,
  p_gift_message text,
  p_customer_note text,
  p_gift_wrap_fee_bdt integer DEFAULT 40
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_order public.orders%ROWTYPE;
  v_cart public.carts%ROWTYPE;
  v_zone public.shipping_zones%ROWTYPE;
  v_coupon public.coupons%ROWTYPE;
  v_has_coupon boolean := false;
  v_item record;
  v_unit_price integer;
  v_pers_fee integer;
  v_has_pers boolean;
  v_line_total integer;
  v_subtotal integer := 0;
  v_pers_total integer := 0;
  v_merchandise integer := 0;
  v_discount integer := 0;
  v_discounted integer := 0;
  v_gift_fee integer := 0;
  v_shipping_fee integer := 0;
  v_total integer := 0;
  v_order_id uuid;
  v_order_number text;
  v_item_count integer := 0;
  v_order_items jsonb;
BEGIN
  -- 1. Idempotency check
  SELECT * INTO v_existing_order
  FROM public.orders
  WHERE user_id = p_user_id AND idempotency_key = p_idempotency_key;

  IF FOUND THEN
    SELECT jsonb_agg(to_jsonb(oi)) INTO v_order_items
    FROM public.order_items oi
    WHERE oi.order_id = v_existing_order.id;

    RETURN jsonb_build_object(
      'order', to_jsonb(v_existing_order),
      'items', COALESCE(v_order_items, '[]'::jsonb),
      'idempotent_replay', true
    );
  END IF;

  -- 2. Lock active cart
  SELECT * INTO v_cart
  FROM public.carts
  WHERE user_id = p_user_id AND status = 'active'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'CART_EMPTY: Your shopping bag is empty.' USING ERRCODE = 'P0001';
  END IF;

  -- 3. Verify shipping zone
  SELECT * INTO v_zone
  FROM public.shipping_zones
  WHERE code = p_zone_code AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'INVALID_ZONE: Selected delivery zone is not available.' USING ERRCODE = 'P0002';
  END IF;

  IF p_payment_method = 'pickup' AND NOT v_zone.is_pickup THEN
    RAISE EXCEPTION 'INVALID_PAYMENT: Pay at pickup requires the Self-Pickup zone.' USING ERRCODE = 'P0003';
  END IF;

  -- 4. Lock & validate every cart line against live products + variants
  FOR v_item IN
    SELECT
      ci.id AS cart_item_id,
      ci.quantity,
      ci.personalization,
      p.id AS product_id,
      p.slug AS product_slug,
      p.name AS product_name,
      p.base_price_bdt,
      p.is_active AS product_active,
      p.is_customizable,
      p.personalization_fee_bdt,
      p.track_stock,
      pv.id AS variant_id,
      pv.sku,
      pv.name AS variant_name,
      pv.price_override_bdt,
      pv.stock_qty,
      pv.is_active AS variant_active,
      COALESCE(
        (SELECT pi.url FROM public.product_images pi WHERE pi.product_id = p.id ORDER BY pi.is_primary DESC, pi.sort_order ASC LIMIT 1),
        ''
      ) AS image_url
    FROM public.cart_items ci
    JOIN public.products p ON p.id = ci.product_id
    JOIN public.product_variants pv ON pv.id = ci.variant_id
    WHERE ci.cart_id = v_cart.id
    ORDER BY ci.created_at ASC
    FOR UPDATE OF pv
  LOOP
    v_item_count := v_item_count + 1;

    IF NOT v_item.product_active OR NOT v_item.variant_active THEN
      RAISE EXCEPTION 'ITEM_UNAVAILABLE: "%" is no longer available.', v_item.product_name USING ERRCODE = 'P0004';
    END IF;

    IF v_item.track_stock AND v_item.stock_qty < v_item.quantity THEN
      RAISE EXCEPTION 'OUT_OF_STOCK: Only % left for "%" (%).', v_item.stock_qty, v_item.product_name, v_item.variant_name USING ERRCODE = 'P0005';
    END IF;

    v_unit_price := COALESCE(v_item.price_override_bdt, v_item.base_price_bdt);
    v_has_pers := v_item.personalization IS NOT NULL AND COALESCE(trim(v_item.personalization->>'text'), '') <> '';
    v_pers_fee := CASE WHEN v_has_pers AND v_item.is_customizable THEN v_item.personalization_fee_bdt ELSE 0 END;

    v_subtotal := v_subtotal + (v_unit_price * v_item.quantity);
    v_pers_total := v_pers_total + (v_pers_fee * v_item.quantity);
  END LOOP;

  IF v_item_count = 0 THEN
    RAISE EXCEPTION 'CART_EMPTY: Your shopping bag is empty.' USING ERRCODE = 'P0001';
  END IF;

  v_merchandise := v_subtotal + v_pers_total;

  -- 5. Validate optional coupon on server
  IF p_coupon_code IS NOT NULL AND trim(p_coupon_code) <> '' THEN
    SELECT * INTO v_coupon
    FROM public.coupons
    WHERE code = upper(trim(p_coupon_code))
      AND is_active = true
      AND (starts_at IS NULL OR starts_at <= now())
      AND (ends_at IS NULL OR ends_at >= now())
      AND (usage_limit IS NULL OR used_count < usage_limit)
    FOR UPDATE;

    IF FOUND AND v_merchandise >= v_coupon.min_subtotal_bdt THEN
      v_has_coupon := true;
      IF v_coupon.percent_off IS NOT NULL AND v_coupon.percent_off > 0 THEN
        v_discount := round((v_merchandise::numeric * v_coupon.percent_off) / 100.0)::integer;
      ELSIF v_coupon.amount_off_bdt IS NOT NULL THEN
        v_discount := v_coupon.amount_off_bdt;
      END IF;

      IF v_coupon.max_discount_bdt IS NOT NULL AND v_coupon.max_discount_bdt > 0 THEN
        v_discount := least(v_discount, v_coupon.max_discount_bdt);
      END IF;
      v_discount := greatest(0, least(v_discount, v_merchandise));
    END IF;
  END IF;

  v_discounted := greatest(0, v_merchandise - v_discount);
  v_gift_fee := CASE WHEN p_gift_wrap THEN greatest(0, p_gift_wrap_fee_bdt) ELSE 0 END;

  IF v_zone.is_pickup OR v_zone.fee_bdt <= 0 THEN
    v_shipping_fee := 0;
  ELSIF v_zone.free_over_bdt IS NOT NULL AND v_discounted >= v_zone.free_over_bdt THEN
    v_shipping_fee := 0;
  ELSE
    v_shipping_fee := v_zone.fee_bdt;
  END IF;

  v_total := v_discounted + v_gift_fee + v_shipping_fee;

  -- 6. Generate human-friendly unique order number
  v_order_number := 'PB-' || to_char(now() AT TIME ZONE 'Asia/Dhaka', 'YYMMDD') || '-' ||
    lpad((floor(random() * 9000) + 1000)::int::text, 4, '0');

  INSERT INTO public.orders (
    order_number,
    user_id,
    status,
    payment_method,
    payment_status,
    is_demo,
    customer_name,
    customer_phone,
    customer_email,
    shipping_address,
    zone_code,
    subtotal_bdt,
    personalization_fees_bdt,
    discount_bdt,
    coupon_code,
    gift_wrap,
    gift_wrap_fee_bdt,
    gift_message,
    shipping_fee_bdt,
    total_bdt,
    customer_note,
    eta_text,
    idempotency_key
  ) VALUES (
    v_order_number,
    p_user_id,
    'pending',
    p_payment_method,
    'unpaid',
    true,
    p_customer_name,
    p_customer_phone,
    NULLIF(trim(COALESCE(p_customer_email, '')), ''),
    jsonb_build_object(
      'zoneCode', v_zone.code,
      'zoneName', v_zone.name,
      'district', p_district,
      'thana', p_thana,
      'addressLine', p_address_line,
      'landmark', COALESCE(p_landmark, ''),
      'postalCode', COALESCE(p_postal_code, '')
    ),
    v_zone.code,
    v_subtotal,
    v_pers_total,
    v_discount,
    CASE WHEN v_has_coupon THEN v_coupon.code ELSE NULL END,
    p_gift_wrap,
    v_gift_fee,
    NULLIF(trim(COALESCE(p_gift_message, '')), ''),
    v_shipping_fee,
    v_total,
    NULLIF(trim(COALESCE(p_customer_note, '')), ''),
    v_zone.eta_text,
    p_idempotency_key
  )
  RETURNING id INTO v_order_id;

  -- 7. Snapshot order items & decrement stock
  FOR v_item IN
    SELECT
      ci.quantity,
      ci.personalization,
      p.id AS product_id,
      p.slug AS product_slug,
      p.name AS product_name,
      p.base_price_bdt,
      p.is_customizable,
      p.personalization_fee_bdt,
      p.track_stock,
      pv.id AS variant_id,
      pv.sku,
      pv.name AS variant_name,
      pv.price_override_bdt,
      COALESCE(
        (SELECT pi.url FROM public.product_images pi WHERE pi.product_id = p.id ORDER BY pi.is_primary DESC, pi.sort_order ASC LIMIT 1),
        ''
      ) AS image_url
    FROM public.cart_items ci
    JOIN public.products p ON p.id = ci.product_id
    JOIN public.product_variants pv ON pv.id = ci.variant_id
    WHERE ci.cart_id = v_cart.id
  LOOP
    v_unit_price := COALESCE(v_item.price_override_bdt, v_item.base_price_bdt);
    v_has_pers := v_item.personalization IS NOT NULL AND COALESCE(trim(v_item.personalization->>'text'), '') <> '';
    v_pers_fee := CASE WHEN v_has_pers AND v_item.is_customizable THEN v_item.personalization_fee_bdt ELSE 0 END;
    v_line_total := (v_unit_price + v_pers_fee) * v_item.quantity;

    INSERT INTO public.order_items (
      order_id,
      product_id,
      product_slug,
      variant_id,
      name,
      variant_name,
      sku,
      image_url,
      unit_price_bdt,
      personalization_fee_bdt,
      personalization,
      quantity,
      line_total_bdt
    ) VALUES (
      v_order_id,
      v_item.product_id,
      v_item.product_slug,
      v_item.variant_id,
      v_item.product_name,
      v_item.variant_name,
      v_item.sku,
      v_item.image_url,
      v_unit_price,
      v_pers_fee,
      v_item.personalization,
      v_item.quantity,
      v_line_total
    );

    IF v_item.track_stock THEN
      UPDATE public.product_variants
      SET stock_qty = stock_qty - v_item.quantity
      WHERE id = v_item.variant_id;
    END IF;
  END LOOP;

  -- 8. Increment coupon usage if applied
  IF v_has_coupon THEN
    UPDATE public.coupons
    SET used_count = used_count + 1
    WHERE code = v_coupon.code;
  END IF;

  -- 9. Clear cart items and reset cart coupon
  DELETE FROM public.cart_items WHERE cart_id = v_cart.id;
  UPDATE public.carts
  SET coupon_code = NULL, gift_wrap = false, updated_at = now()
  WHERE id = v_cart.id;

  SELECT * INTO v_existing_order FROM public.orders WHERE id = v_order_id;
  SELECT jsonb_agg(to_jsonb(oi)) INTO v_order_items
  FROM public.order_items oi
  WHERE oi.order_id = v_order_id;

  RETURN jsonb_build_object(
    'order', to_jsonb(v_existing_order),
    'items', COALESCE(v_order_items, '[]'::jsonb),
    'idempotent_replay', false
  );
END;
$$;

REVOKE ALL ON FUNCTION public.place_order(
  uuid, text, text, text, text, text, text, text, text, text, text, text, text, boolean, text, text, integer
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.place_order(
  uuid, text, text, text, text, text, text, text, text, text, text, text, text, boolean, text, text, integer
) TO service_role;
