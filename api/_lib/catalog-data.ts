import { createClient } from '@supabase/supabase-js';
import {
  SEED_CATEGORIES,
  SEED_PRODUCTS,
  SEED_SHIPPING_ZONES,
} from '../../shared/catalog-seed';
import type { ProductQueryInput } from './types-helper';
import type {
  CategoryDTO,
  ProductDTO,
  ProductImageDTO,
  ProductVariantDTO,
  ShippingZoneDTO,
} from '../../shared/types';
import { getServerEnv } from './env';

function getAnonSupabase() {
  const env = getServerEnv();
  if (!env.supabaseConfigured) return null;
  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

interface DbCategoryRow {
  id: string;
  slug: string;
  name: string;
  description: string;
  parent_id: string | null;
  image: string;
  sort_order: number;
}

interface DbProductRow {
  id: string;
  slug: string;
  name: string;
  short_description: string;
  description: string;
  category_id: string;
  product_type: 'ready' | 'customizable' | 'bundle';
  base_price_bdt: number;
  compare_at_price_bdt: number | null;
  badge: string | null;
  is_customizable: boolean;
  personalization_fee_bdt: number;
  personalization_config: ProductDTO['personalizationConfig'];
  tags: string[];
  specs: Record<string, string>;
  popularity_score: number;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  product_images: Array<{
    id: string;
    url: string;
    alt_text: string;
    sort_order: number;
    is_primary: boolean;
  }>;
  product_variants: Array<{
    id: string;
    sku: string;
    name: string;
    options: Record<string, string>;
    price_override_bdt: number | null;
    stock_qty: number;
    is_active: boolean;
  }>;
}

function mapDbProducts(
  rows: DbProductRow[],
  categoriesById: Map<string, DbCategoryRow>,
): ProductDTO[] {
  return rows.map((r) => {
    const cat = categoriesById.get(r.category_id);
    const parent = cat?.parent_id ? categoriesById.get(cat.parent_id) : undefined;
    const images: ProductImageDTO[] = (r.product_images ?? [])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((img) => ({
        id: img.id,
        url: img.url,
        altText: img.alt_text,
        sortOrder: img.sort_order,
        isPrimary: img.is_primary,
      }));

    const variants: ProductVariantDTO[] = (r.product_variants ?? [])
      .filter((v) => v.is_active)
      .map((v) => ({
        id: v.id,
        sku: v.sku,
        name: v.name,
        options: v.options ?? {},
        priceOverrideBdt: v.price_override_bdt,
        stockQty: v.stock_qty,
        isActive: v.is_active,
      }));

    const totalStock = variants.reduce((sum, v) => sum + v.stockQty, 0);

    return {
      id: r.id,
      slug: r.slug,
      name: r.name,
      shortDescription: r.short_description,
      description: r.description,
      categoryId: r.category_id,
      categorySlug: cat?.slug ?? '',
      categoryName: cat?.name ?? '',
      parentCategorySlug: parent?.slug ?? cat?.slug ?? '',
      parentCategoryName: parent?.name ?? cat?.name ?? '',
      productType: r.product_type,
      basePriceBdt: r.base_price_bdt,
      compareAtPriceBdt: r.compare_at_price_bdt,
      badge: r.badge,
      isCustomizable: r.is_customizable,
      personalizationFeeBdt: r.personalization_fee_bdt,
      personalizationConfig: r.personalization_config,
      tags: r.tags ?? [],
      specs: r.specs ?? {},
      popularityScore: r.popularity_score,
      isFeatured: r.is_featured,
      isActive: r.is_active,
      inStock: totalStock > 0,
      totalStock,
      images,
      variants,
      createdAt: r.created_at,
    };
  });
}

async function fetchAllActiveCatalog(): Promise<{
  categories: CategoryDTO[];
  products: ProductDTO[];
}> {
  const client = getAnonSupabase();
  if (!client) {
    return {
      categories: SEED_CATEGORIES,
      products: SEED_PRODUCTS,
    };
  }

  const [{ data: catRows, error: catErr }, { data: prodRows, error: prodErr }] =
    await Promise.all([
      client
        .from('categories')
        .select('id, slug, name, description, parent_id, image, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      client
        .from('products')
        .select(
          `id, slug, name, short_description, description, category_id, product_type,
           base_price_bdt, compare_at_price_bdt, badge, is_customizable,
           personalization_fee_bdt, personalization_config, tags, specs,
           popularity_score, is_featured, is_active, created_at,
           product_images (id, url, alt_text, sort_order, is_primary),
           product_variants (id, sku, name, options, price_override_bdt, stock_qty, is_active)`,
        )
        .eq('is_active', true),
    ]);

  if (catErr || prodErr || !catRows || !prodRows) {
    throw new Error(catErr?.message || prodErr?.message || 'Failed to load catalog');
  }

  const catMap = new Map((catRows as DbCategoryRow[]).map((c) => [c.id, c]));
  const categories: CategoryDTO[] = (catRows as DbCategoryRow[]).map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    description: c.description,
    parentId: c.parent_id,
    image: c.image,
    sortOrder: c.sort_order,
  }));
  const products = mapDbProducts(prodRows as DbProductRow[], catMap);

  return { categories, products };
}

export async function queryProducts(query: ProductQueryInput): Promise<{
  items: ProductDTO[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const { categories, products } = await fetchAllActiveCatalog();
  let list = products.slice();

  if (query.category) {
    const targetCat = categories.find((c) => c.slug === query.category);
    if (!targetCat) {
      list = [];
    } else {
      const childIds = new Set(
        categories.filter((c) => c.parentId === targetCat.id).map((c) => c.id),
      );
      childIds.add(targetCat.id);
      list = list.filter((p) => childIds.has(p.categoryId));
    }
  }

  if (query.type) {
    list = list.filter((p) => p.productType === query.type);
  }

  if (query.customizable !== undefined) {
    list = list.filter((p) => p.isCustomizable === query.customizable);
  }

  if (query.inStock) {
    list = list.filter((p) => p.inStock);
  }

  if (query.tag) {
    const tagLower = query.tag.toLowerCase();
    list = list.filter((p) => p.tags.some((t) => t.toLowerCase() === tagLower));
  }

  if (query.minPrice !== undefined) {
    list = list.filter((p) => p.basePriceBdt >= query.minPrice!);
  }

  if (query.maxPrice !== undefined) {
    list = list.filter((p) => p.basePriceBdt <= query.maxPrice!);
  }

  if (query.q) {
    const q = query.q.toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.shortDescription.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q) ||
        (p.parentCategoryName ?? '').toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }

  switch (query.sort) {
    case 'price_asc':
      list.sort((a, b) => a.basePriceBdt - b.basePriceBdt);
      break;
    case 'price_desc':
      list.sort((a, b) => b.basePriceBdt - a.basePriceBdt);
      break;
    case 'popular':
      list.sort((a, b) => b.popularityScore - a.popularityScore);
      break;
    case 'newest':
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      break;
    case 'featured':
    default:
      list.sort((a, b) => {
        if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
        return b.popularityScore - a.popularityScore;
      });
      break;
  }

  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
  const page = Math.min(query.page, totalPages);
  const start = (page - 1) * query.pageSize;
  const items = list.slice(start, start + query.pageSize);

  return {
    items,
    total,
    page,
    pageSize: query.pageSize,
    totalPages,
  };
}

export async function getProductBySlug(slug: string): Promise<{
  product: ProductDTO;
  related: ProductDTO[];
} | null> {
  const { products } = await fetchAllActiveCatalog();
  const product = products.find((p) => p.slug === slug);
  if (!product) return null;

  const related = products
    .filter(
      (p) =>
        p.id !== product.id &&
        (p.categoryId === product.categoryId ||
          p.parentCategorySlug === product.parentCategorySlug),
    )
    .sort((a, b) => b.popularityScore - a.popularityScore)
    .slice(0, 4);

  return { product, related };
}

export async function getCategoriesTree(): Promise<CategoryDTO[]> {
  const { categories, products } = await fetchAllActiveCatalog();
  const byParent = new Map<string | null, CategoryDTO[]>();

  for (const c of categories) {
    const list = byParent.get(c.parentId) ?? [];
    list.push({ ...c });
    byParent.set(c.parentId, list);
  }

  const tops = byParent.get(null) ?? [];
  return tops.map((parent) => {
    const children = (byParent.get(parent.id) ?? []).map((child) => {
      const childProducts = products.filter((p) => p.categoryId === child.id);
      const minPriceBdt =
        childProducts.length > 0
          ? Math.min(...childProducts.map((p) => p.basePriceBdt))
          : null;
      return {
        ...child,
        productCount: childProducts.length,
        minPriceBdt,
      };
    });

    const catIds = new Set([parent.id, ...children.map((c) => c.id)]);
    const familyProducts = products.filter((p) => catIds.has(p.categoryId));
    const minPriceBdt =
      familyProducts.length > 0
        ? Math.min(...familyProducts.map((p) => p.basePriceBdt))
        : null;

    return {
      ...parent,
      productCount: familyProducts.length,
      minPriceBdt,
      children,
    };
  });
}

export async function getSearchSuggestions(q: string): Promise<
  Array<{
    slug: string;
    name: string;
    categoryName: string;
    basePriceBdt: number;
    imageUrl: string;
  }>
> {
  const trimmed = q.trim().toLowerCase();
  if (trimmed.length < 2) return [];
  const { products } = await fetchAllActiveCatalog();
  return products
    .filter(
      (p) =>
        p.name.toLowerCase().includes(trimmed) ||
        p.categoryName.toLowerCase().includes(trimmed) ||
        p.tags.some((t) => t.toLowerCase().includes(trimmed)),
    )
    .sort((a, b) => b.popularityScore - a.popularityScore)
    .slice(0, 6)
    .map((p) => ({
      slug: p.slug,
      name: p.name,
      categoryName: p.categoryName,
      basePriceBdt: p.basePriceBdt,
      imageUrl: p.images[0]?.url ?? '',
    }));
}

export async function getShippingZones(): Promise<ShippingZoneDTO[]> {
  const client = getAnonSupabase();
  if (!client) {
    return SEED_SHIPPING_ZONES;
  }

  const { data, error } = await client
    .from('shipping_zones')
    .select('code, name, fee_bdt, free_over_bdt, eta_text, is_pickup')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error || !data) {
    throw new Error(error?.message || 'Failed to load shipping zones');
  }

  return data.map((z) => ({
    code: z.code as string,
    name: z.name as string,
    feeBdt: z.fee_bdt as number,
    freeOverBdt: (z.free_over_bdt as number | null) ?? null,
    etaText: z.eta_text as string,
    isPickup: Boolean(z.is_pickup),
  }));
}

export async function getFeaturedData(): Promise<{
  bestsellers: ProductDTO[];
  personalized: ProductDTO[];
  newArrivals: ProductDTO[];
  categories: CategoryDTO[];
}> {
  const [{ products }, categories] = await Promise.all([
    fetchAllActiveCatalog(),
    getCategoriesTree(),
  ]);

  const bestsellers = products
    .filter((p) => p.isFeatured)
    .sort((a, b) => b.popularityScore - a.popularityScore)
    .slice(0, 8);

  const personalized = products
    .filter((p) => p.isCustomizable)
    .sort((a, b) => b.popularityScore - a.popularityScore)
    .slice(0, 8);

  const newArrivals = products
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 8);

  return {
    bestsellers,
    personalized,
    newArrivals,
    categories,
  };
}
