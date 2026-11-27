-- ==============================================================================
-- PAPER BLOOM — 05_verify.sql
-- Run after 01-04 to confirm RLS is enabled on every table & seed data is loaded.
-- ==============================================================================

-- 1. Verify RLS is enabled on ALL public tables (rowsecurity MUST be true for every row)
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. List all active RLS policies
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. Verify seeded counts
SELECT
  (SELECT count(*) FROM public.categories WHERE is_active = true) AS active_categories,
  (SELECT count(*) FROM public.products WHERE is_active = true) AS active_products,
  (SELECT count(*) FROM public.products WHERE is_customizable = true) AS customizable_products,
  (SELECT count(*) FROM public.product_variants WHERE is_active = true) AS active_variants,
  (SELECT count(*) FROM public.shipping_zones WHERE is_active = true) AS shipping_zones,
  (SELECT count(*) FROM public.coupons WHERE is_active = true) AS active_coupons;
