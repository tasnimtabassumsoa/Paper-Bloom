-- ==============================================================================
-- PAPER BLOOM — 01_schema.sql
-- Run first in Supabase SQL Editor. Idempotent where safe.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Updated-at trigger helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 1. Profiles (mirrors auth.users, including anonymous guests)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  avatar_url text,
  is_guest boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. Categories (6 top-level families + subcategories)
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  parent_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  image text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_active_sort ON public.categories(is_active, sort_order);

DROP TRIGGER IF EXISTS trg_categories_updated_at ON public.categories;
CREATE TRIGGER trg_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Products (integer BDT prices only)
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  short_description text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  product_type text NOT NULL CHECK (product_type IN ('ready', 'customizable', 'bundle')),
  base_price_bdt integer NOT NULL CHECK (base_price_bdt >= 0),
  compare_at_price_bdt integer CHECK (compare_at_price_bdt IS NULL OR compare_at_price_bdt >= 0),
  badge text,
  is_customizable boolean NOT NULL DEFAULT false,
  personalization_fee_bdt integer NOT NULL DEFAULT 0 CHECK (personalization_fee_bdt >= 0),
  personalization_config jsonb,
  tags text[] NOT NULL DEFAULT '{}',
  specs jsonb NOT NULL DEFAULT '{}'::jsonb,
  popularity_score integer NOT NULL DEFAULT 0,
  is_featured boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  track_stock boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active_featured ON public.products(is_active, is_featured);
CREATE INDEX IF NOT EXISTS idx_products_active_price ON public.products(is_active, base_price_bdt);
CREATE INDEX IF NOT EXISTS idx_products_active_popularity ON public.products(is_active, popularity_score DESC);
CREATE INDEX IF NOT EXISTS idx_products_tags_gin ON public.products USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON public.products USING GIN(name gin_trgm_ops);

DROP TRIGGER IF EXISTS trg_products_updated_at ON public.products;
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. Product Images
CREATE TABLE IF NOT EXISTS public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url text NOT NULL,
  storage_path text,
  alt_text text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 1,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id, sort_order);

-- 5. Product Variants
CREATE TABLE IF NOT EXISTS public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku text NOT NULL UNIQUE,
  name text NOT NULL,
  options jsonb NOT NULL DEFAULT '{}'::jsonb,
  price_override_bdt integer CHECK (price_override_bdt IS NULL OR price_override_bdt >= 0),
  stock_qty integer NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);

DROP TRIGGER IF EXISTS trg_product_variants_updated_at ON public.product_variants;
CREATE TRIGGER trg_product_variants_updated_at
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. Shipping Zones
CREATE TABLE IF NOT EXISTS public.shipping_zones (
  code text PRIMARY KEY,
  name text NOT NULL,
  fee_bdt integer NOT NULL CHECK (fee_bdt >= 0),
  free_over_bdt integer CHECK (free_over_bdt IS NULL OR free_over_bdt >= 0),
  eta_text text NOT NULL,
  is_pickup boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0
);

-- 7. Coupons (server-only access)
CREATE TABLE IF NOT EXISTS public.coupons (
  code text PRIMARY KEY,
  description text NOT NULL DEFAULT '',
  percent_off integer CHECK (percent_off IS NULL OR (percent_off > 0 AND percent_off <= 90)),
  amount_off_bdt integer CHECK (amount_off_bdt IS NULL OR amount_off_bdt > 0),
  min_subtotal_bdt integer NOT NULL DEFAULT 0 CHECK (min_subtotal_bdt >= 0),
  max_discount_bdt integer CHECK (max_discount_bdt IS NULL OR max_discount_bdt >= 0),
  starts_at timestamptz,
  ends_at timestamptz,
  usage_limit integer CHECK (usage_limit IS NULL OR usage_limit > 0),
  used_count integer NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (percent_off IS NOT NULL OR amount_off_bdt IS NOT NULL)
);

-- 8. Carts & Cart Items
CREATE TABLE IF NOT EXISTS public.carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'converted', 'abandoned')),
  coupon_code text,
  zone_code text NOT NULL DEFAULT 'dhaka_city',
  gift_wrap boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_carts_one_active_per_user
  ON public.carts(user_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_carts_user_id ON public.carts(user_id);

DROP TRIGGER IF EXISTS trg_carts_updated_at ON public.carts;
CREATE TRIGGER trg_carts_updated_at
  BEFORE UPDATE ON public.carts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id uuid NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id uuid NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity BETWEEN 1 AND 20),
  personalization jsonb,
  personalization_hash text NOT NULL DEFAULT 'none',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cart_id, variant_id, personalization_hash)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON public.cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON public.cart_items(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_variant_id ON public.cart_items(variant_id);

DROP TRIGGER IF EXISTS trg_cart_items_updated_at ON public.cart_items;
CREATE TRIGGER trg_cart_items_updated_at
  BEFORE UPDATE ON public.cart_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 9. Wishlists
CREATE TABLE IF NOT EXISTS public.wishlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlist_items_user_id ON public.wishlist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_product_id ON public.wishlist_items(product_id);

-- 10. Addresses
CREATE TABLE IF NOT EXISTS public.addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT 'Home',
  recipient_name text NOT NULL,
  phone text NOT NULL,
  zone_code text NOT NULL DEFAULT 'dhaka_city',
  district text NOT NULL,
  thana text NOT NULL,
  address_line text NOT NULL,
  landmark text NOT NULL DEFAULT '',
  postal_code text NOT NULL DEFAULT '',
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_addresses_one_default_per_user
  ON public.addresses(user_id) WHERE is_default = true;

DROP TRIGGER IF EXISTS trg_addresses_updated_at ON public.addresses;
CREATE TRIGGER trg_addresses_updated_at
  BEFORE UPDATE ON public.addresses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 11. Orders & Order Items (writes via service-role place_order only)
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_method text NOT NULL CHECK (payment_method IN ('cod', 'pickup')),
  payment_status text NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid')),
  is_demo boolean NOT NULL DEFAULT true,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  shipping_address jsonb NOT NULL,
  zone_code text NOT NULL,
  subtotal_bdt integer NOT NULL CHECK (subtotal_bdt >= 0),
  personalization_fees_bdt integer NOT NULL DEFAULT 0 CHECK (personalization_fees_bdt >= 0),
  discount_bdt integer NOT NULL DEFAULT 0 CHECK (discount_bdt >= 0),
  coupon_code text,
  gift_wrap boolean NOT NULL DEFAULT false,
  gift_wrap_fee_bdt integer NOT NULL DEFAULT 0 CHECK (gift_wrap_fee_bdt >= 0),
  gift_message text,
  shipping_fee_bdt integer NOT NULL CHECK (shipping_fee_bdt >= 0),
  total_bdt integer NOT NULL CHECK (total_bdt >= 0),
  customer_note text,
  eta_text text NOT NULL DEFAULT '',
  idempotency_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id_created ON public.orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);

DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_slug text,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  name text NOT NULL,
  variant_name text NOT NULL,
  sku text NOT NULL,
  image_url text NOT NULL DEFAULT '',
  unit_price_bdt integer NOT NULL CHECK (unit_price_bdt >= 0),
  personalization_fee_bdt integer NOT NULL DEFAULT 0 CHECK (personalization_fee_bdt >= 0),
  personalization jsonb,
  quantity integer NOT NULL CHECK (quantity > 0),
  line_total_bdt integer NOT NULL CHECK (line_total_bdt >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- 12. Public Forms & Rate Limit State (server-only access)
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL DEFAULT '',
  subject text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rate_limits (
  key text PRIMARY KEY,
  hits integer NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now()
);
