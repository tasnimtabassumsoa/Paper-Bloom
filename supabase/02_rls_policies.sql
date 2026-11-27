-- ==============================================================================
-- PAPER BLOOM — 02_rls_policies.sql
-- Enable Row Level Security on EVERY table and grant minimal privileges.
-- ==============================================================================

-- 1. Enable RLS everywhere
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- 2. Revoke all direct permissions first, then grant explicitly
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;

-- Public catalog read-only grants
GRANT SELECT ON public.categories, public.products, public.product_images, public.product_variants, public.shipping_zones TO anon, authenticated;

-- User-owned tables (both anonymous guests & signed-in accounts are authenticated role in Supabase)
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.carts, public.cart_items, public.wishlist_items, public.addresses TO authenticated;
GRANT SELECT ON public.orders, public.order_items TO authenticated;

-- 3. Catalog Policies (active items only)
DROP POLICY IF EXISTS "Public read active categories" ON public.categories;
CREATE POLICY "Public read active categories"
  ON public.categories FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Public read active products" ON public.products;
CREATE POLICY "Public read active products"
  ON public.products FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Public read images of active products" ON public.product_images;
CREATE POLICY "Public read images of active products"
  ON public.product_images FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_images.product_id AND p.is_active = true
    )
  );

DROP POLICY IF EXISTS "Public read variants of active products" ON public.product_variants;
CREATE POLICY "Public read variants of active products"
  ON public.product_variants FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true AND EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_variants.product_id AND p.is_active = true
    )
  );

DROP POLICY IF EXISTS "Public read active shipping zones" ON public.shipping_zones;
CREATE POLICY "Public read active shipping zones"
  ON public.shipping_zones FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- 4. Profiles Policies
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
CREATE POLICY "Users read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 5. Carts & Cart Items Policies
DROP POLICY IF EXISTS "Users manage own carts" ON public.carts;
CREATE POLICY "Users manage own carts"
  ON public.carts FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own cart items" ON public.cart_items;
CREATE POLICY "Users manage own cart items"
  ON public.cart_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.carts c
      WHERE c.id = cart_items.cart_id AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.carts c
      WHERE c.id = cart_items.cart_id AND c.user_id = auth.uid()
    )
  );

-- 6. Wishlists Policies
DROP POLICY IF EXISTS "Users manage own wishlist" ON public.wishlist_items;
CREATE POLICY "Users manage own wishlist"
  ON public.wishlist_items FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 7. Addresses Policies
DROP POLICY IF EXISTS "Users manage own addresses" ON public.addresses;
CREATE POLICY "Users manage own addresses"
  ON public.addresses FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 8. Orders & Order Items Policies (SELECT own only; NO client insert/update/delete)
DROP POLICY IF EXISTS "Users read own orders" ON public.orders;
CREATE POLICY "Users read own orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own order items" ON public.order_items;
CREATE POLICY "Users read own order items"
  ON public.order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id AND o.user_id = auth.uid()
    )
  );

-- Note: coupons, contact_messages, newsletter_subscribers, and rate_limits have RLS enabled
-- and NO policies for anon/authenticated, making them exclusively accessible via service_role on the server.
