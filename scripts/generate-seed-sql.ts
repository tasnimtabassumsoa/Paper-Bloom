import fs from 'node:fs';
import path from 'node:path';
import {
  SEED_CATEGORIES,
  SEED_COUPONS,
  SEED_PRODUCTS,
  SEED_SHIPPING_ZONES,
} from '../shared/catalog-seed';

function sqlStr(val: string | null | undefined): string {
  if (val === null || val === undefined) return 'NULL';
  return `'${val.replace(/'/g, "''")}'`;
}

function sqlJson(val: unknown): string {
  if (val === null || val === undefined) return 'NULL';
  return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
}

function sqlTextArray(arr: string[]): string {
  if (!arr.length) return `'{}'::text[]`;
  return `ARRAY[${arr.map((s) => sqlStr(s)).join(', ')}]::text[]`;
}

const lines: string[] = [
  '-- ==============================================================================',
  '-- PAPER BLOOM — 04_seed.sql (Idempotent seed data)',
  '-- Generated from shared/catalog-seed.ts so Demo Mode & Supabase match 100%.',
  '-- ==============================================================================',
  '',
  '-- 1. Shipping Zones',
];

SEED_SHIPPING_ZONES.forEach((z, idx) => {
  lines.push(
    `INSERT INTO public.shipping_zones (code, name, fee_bdt, free_over_bdt, eta_text, is_pickup, is_active, sort_order) VALUES (${sqlStr(z.code)}, ${sqlStr(z.name)}, ${z.feeBdt}, ${z.freeOverBdt ?? 'NULL'}, ${sqlStr(z.etaText)}, ${z.isPickup}, true, ${idx + 1}) ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, fee_bdt = EXCLUDED.fee_bdt, free_over_bdt = EXCLUDED.free_over_bdt, eta_text = EXCLUDED.eta_text, is_pickup = EXCLUDED.is_pickup, is_active = true, sort_order = EXCLUDED.sort_order;`,
  );
});

lines.push('', '-- 2. Coupons');
for (const c of SEED_COUPONS) {
  lines.push(
    `INSERT INTO public.coupons (code, description, percent_off, amount_off_bdt, min_subtotal_bdt, max_discount_bdt, is_active) VALUES (${sqlStr(c.code)}, ${sqlStr(c.description)}, ${c.percentOff ?? 'NULL'}, ${c.amountOffBdt ?? 'NULL'}, ${c.minSubtotalBdt}, ${c.maxDiscountBdt ?? 'NULL'}, true) ON CONFLICT (code) DO UPDATE SET description = EXCLUDED.description, percent_off = EXCLUDED.percent_off, amount_off_bdt = EXCLUDED.amount_off_bdt, min_subtotal_bdt = EXCLUDED.min_subtotal_bdt, max_discount_bdt = EXCLUDED.max_discount_bdt, is_active = true;`,
  );
}

lines.push('', '-- 3. Categories (6 top-level families + 14 subcategories)');
for (const cat of SEED_CATEGORIES) {
  lines.push(
    `INSERT INTO public.categories (id, slug, name, description, parent_id, image, sort_order, is_active) VALUES (${sqlStr(cat.id)}::uuid, ${sqlStr(cat.slug)}, ${sqlStr(cat.name)}, ${sqlStr(cat.description)}, ${cat.parentId ? `${sqlStr(cat.parentId)}::uuid` : 'NULL'}, ${sqlStr(cat.image)}, ${cat.sortOrder}, true) ON CONFLICT (id) DO UPDATE SET slug = EXCLUDED.slug, name = EXCLUDED.name, description = EXCLUDED.description, parent_id = EXCLUDED.parent_id, image = EXCLUDED.image, sort_order = EXCLUDED.sort_order, is_active = true;`,
  );
}

lines.push('', '-- 4. Products (48 active products), Images & Variants');
for (const p of SEED_PRODUCTS) {
  lines.push(
    `INSERT INTO public.products (id, slug, name, short_description, description, category_id, product_type, base_price_bdt, compare_at_price_bdt, badge, is_customizable, personalization_fee_bdt, personalization_config, tags, specs, popularity_score, is_featured, is_active, track_stock) VALUES (${sqlStr(p.id)}::uuid, ${sqlStr(p.slug)}, ${sqlStr(p.name)}, ${sqlStr(p.shortDescription)}, ${sqlStr(p.description)}, ${sqlStr(p.categoryId)}::uuid, ${sqlStr(p.productType)}, ${p.basePriceBdt}, ${p.compareAtPriceBdt ?? 'NULL'}, ${sqlStr(p.badge)}, ${p.isCustomizable}, ${p.personalizationFeeBdt}, ${sqlJson(p.personalizationConfig)}, ${sqlTextArray(p.tags)}, ${sqlJson(p.specs)}, ${p.popularityScore}, ${p.isFeatured}, true, true) ON CONFLICT (id) DO UPDATE SET slug = EXCLUDED.slug, name = EXCLUDED.name, short_description = EXCLUDED.short_description, description = EXCLUDED.description, category_id = EXCLUDED.category_id, product_type = EXCLUDED.product_type, base_price_bdt = EXCLUDED.base_price_bdt, compare_at_price_bdt = EXCLUDED.compare_at_price_bdt, badge = EXCLUDED.badge, is_customizable = EXCLUDED.is_customizable, personalization_fee_bdt = EXCLUDED.personalization_fee_bdt, personalization_config = EXCLUDED.personalization_config, tags = EXCLUDED.tags, specs = EXCLUDED.specs, popularity_score = EXCLUDED.popularity_score, is_featured = EXCLUDED.is_featured, is_active = true;`,
  );

  for (const img of p.images) {
    lines.push(
      `INSERT INTO public.product_images (id, product_id, url, alt_text, sort_order, is_primary) VALUES (${sqlStr(img.id)}::uuid, ${sqlStr(p.id)}::uuid, ${sqlStr(img.url)}, ${sqlStr(img.altText)}, ${img.sortOrder}, ${img.isPrimary}) ON CONFLICT (id) DO UPDATE SET url = EXCLUDED.url, alt_text = EXCLUDED.alt_text, sort_order = EXCLUDED.sort_order, is_primary = EXCLUDED.is_primary;`,
    );
  }

  for (const v of p.variants) {
    lines.push(
      `INSERT INTO public.product_variants (id, product_id, sku, name, options, price_override_bdt, stock_qty, is_active) VALUES (${sqlStr(v.id)}::uuid, ${sqlStr(p.id)}::uuid, ${sqlStr(v.sku)}, ${sqlStr(v.name)}, ${sqlJson(v.options)}, ${v.priceOverrideBdt ?? 'NULL'}, ${v.stockQty}, true) ON CONFLICT (id) DO UPDATE SET sku = EXCLUDED.sku, name = EXCLUDED.name, options = EXCLUDED.options, price_override_bdt = EXCLUDED.price_override_bdt, is_active = true;`,
    );
  }
}

const outPath = path.resolve(process.cwd(), 'supabase/04_seed.sql');
fs.writeFileSync(outPath, lines.join('\n') + '\n', 'utf8');
console.log(`Wrote ${SEED_PRODUCTS.length} products and ${SEED_CATEGORIES.length} categories to supabase/04_seed.sql`);
