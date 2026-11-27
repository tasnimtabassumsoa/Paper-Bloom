import type { SupabaseClient } from '@supabase/supabase-js';
import { calculateLineTotals, calculateOrderTotals } from '../../shared/pricing';
import {
  hashPersonalization,
  validatePersonalizationAgainstConfig,
} from '../../shared/schemas';
import type {
  CartDTO,
  CartItemDTO,
  CartItemWarning,
  CouponDTO,
  PersonalizationConfig,
  PersonalizationInput,
  ShippingZoneDTO,
} from '../../shared/types';
import { getShippingZones } from './catalog-data';
import { HttpError } from './http';
import { createServiceSupabase, createUserSupabase } from './supabase';

interface DbCartRow {
  id: string;
  user_id: string;
  coupon_code: string | null;
  zone_code: string;
  gift_wrap: boolean;
}

interface DbCartItemRow {
  id: string;
  cart_id: string;
  product_id: string;
  variant_id: string;
  quantity: number;
  personalization: PersonalizationInput | null;
  personalization_hash: string;
  products: {
    id: string;
    slug: string;
    name: string;
    base_price_bdt: number;
    is_customizable: boolean;
    personalization_fee_bdt: number;
    personalization_config: PersonalizationConfig | null;
    is_active: boolean;
    product_images: Array<{ url: string; alt_text: string; sort_order: number; is_primary: boolean }>;
  };
  product_variants: {
    id: string;
    sku: string;
    name: string;
    price_override_bdt: number | null;
    stock_qty: number;
    is_active: boolean;
  };
}

export async function lookupCouponServer(code: string | null): Promise<CouponDTO | null> {
  if (!code || !code.trim()) return null;
  const service = createServiceSupabase();
  const normalized = code.trim().toUpperCase();
  const { data, error } = await service
    .from('coupons')
    .select('code, description, percent_off, amount_off_bdt, min_subtotal_bdt, max_discount_bdt, starts_at, ends_at, usage_limit, used_count, is_active')
    .eq('code', normalized)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !data) return null;
  const now = Date.now();
  if (data.starts_at && new Date(data.starts_at as string).getTime() > now) return null;
  if (data.ends_at && new Date(data.ends_at as string).getTime() < now) return null;
  if (data.usage_limit !== null && (data.used_count as number) >= (data.usage_limit as number)) return null;

  return {
    code: data.code as string,
    description: data.description as string,
    percentOff: (data.percent_off as number | null) ?? null,
    amountOffBdt: (data.amount_off_bdt as number | null) ?? null,
    minSubtotalBdt: data.min_subtotal_bdt as number,
    maxDiscountBdt: (data.max_discount_bdt as number | null) ?? null,
  };
}

export async function getOrCreateActiveCart(
  userClient: SupabaseClient,
  userId: string,
): Promise<DbCartRow> {
  const { data: existing, error: selErr } = await userClient
    .from('carts')
    .select('id, user_id, coupon_code, zone_code, gift_wrap')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (selErr) {
    throw new HttpError(500, 'CART_READ_ERROR', 'Unable to read your shopping bag.');
  }
  if (existing) return existing as DbCartRow;

  const { data: created, error: insErr } = await userClient
    .from('carts')
    .insert({ user_id: userId, status: 'active', zone_code: 'dhaka_city', gift_wrap: false })
    .select('id, user_id, coupon_code, zone_code, gift_wrap')
    .single();

  if (insErr || !created) {
    throw new HttpError(500, 'CART_CREATE_ERROR', 'Unable to initialize your shopping bag.');
  }
  return created as DbCartRow;
}

export async function buildCartDTO(
  accessToken: string,
  userId: string,
  overrides?: { zoneCode?: string; giftWrap?: boolean },
): Promise<CartDTO> {
  const userClient = createUserSupabase(accessToken);
  const cart = await getOrCreateActiveCart(userClient, userId);

  const [{ data: rawItems, error: itemsErr }, zones, coupon] = await Promise.all([
    userClient
      .from('cart_items')
      .select(
        `id, cart_id, product_id, variant_id, quantity, personalization, personalization_hash,
         products!inner(id, slug, name, base_price_bdt, is_customizable, personalization_fee_bdt, personalization_config, is_active,
           product_images(url, alt_text, sort_order, is_primary)),
         product_variants!inner(id, sku, name, price_override_bdt, stock_qty, is_active)`,
      )
      .eq('cart_id', cart.id)
      .order('created_at', { ascending: true }),
    getShippingZones(),
    lookupCouponServer(cart.coupon_code),
  ]);

  if (itemsErr) {
    throw new HttpError(500, 'CART_ITEMS_ERROR', 'Unable to load items in your shopping bag.');
  }

  const rows = (rawItems ?? []) as unknown as DbCartItemRow[];
  const warnings: string[] = [];

  const items: CartItemDTO[] = rows.map((row) => {
    const p = row.products;
    const v = row.product_variants;
    const unitPriceBdt = v.price_override_bdt ?? p.base_price_bdt;
    const hasPersonalization = Boolean(row.personalization?.text?.trim()) && p.is_customizable;
    const pFee = hasPersonalization ? p.personalization_fee_bdt : 0;
    const lineTotals = calculateLineTotals({
      unitPriceBdt,
      personalizationFeePerUnitBdt: pFee,
      hasPersonalization,
      quantity: row.quantity,
    });

    const itemWarnings: CartItemWarning[] = [];
    if (!p.is_active || !v.is_active) {
      itemWarnings.push({
        type: 'out_of_stock',
        message: 'This item is currently unavailable.',
      });
      warnings.push(`${p.name} is no longer available.`);
    } else if (v.stock_qty <= 0) {
      itemWarnings.push({
        type: 'out_of_stock',
        message: 'Out of stock.',
      });
      warnings.push(`${p.name} (${v.name}) is out of stock.`);
    } else if (v.stock_qty < row.quantity) {
      itemWarnings.push({
        type: 'low_stock',
        message: `Only ${v.stock_qty} left in stock.`,
      });
      warnings.push(`Only ${v.stock_qty} left for ${p.name}.`);
    }

    const sortedImgs = (p.product_images ?? [])
      .slice()
      .sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0) || a.sort_order - b.sort_order);

    return {
      id: row.id,
      productId: p.id,
      productSlug: p.slug,
      productName: p.name,
      variantId: v.id,
      variantName: v.name,
      sku: v.sku,
      imageUrl: sortedImgs[0]?.url ?? '/images/products/notebook-linen.svg',
      imageAlt: sortedImgs[0]?.alt_text ?? p.name,
      unitPriceBdt,
      personalizationFeePerUnitBdt: pFee,
      personalization: row.personalization,
      quantity: row.quantity,
      lineSubtotalBdt: lineTotals.lineSubtotalBdt,
      linePersonalizationBdt: lineTotals.linePersonalizationBdt,
      lineTotalBdt: lineTotals.lineTotalBdt,
      stockQty: v.stock_qty,
      warnings: itemWarnings,
    };
  });

  const activeZoneCode = overrides?.zoneCode ?? cart.zone_code ?? 'dhaka_city';
  const activeGiftWrap = overrides?.giftWrap ?? cart.gift_wrap ?? false;
  const zone: ShippingZoneDTO | null =
    zones.find((z) => z.code === activeZoneCode) ?? zones[0] ?? null;

  const pricing = calculateOrderTotals({
    lines: items.map((i) => ({
      unitPriceBdt: i.unitPriceBdt,
      personalizationFeePerUnitBdt: i.personalizationFeePerUnitBdt,
      hasPersonalization: Boolean(i.personalization?.text?.trim()),
      quantity: i.quantity,
    })),
    coupon,
    zone,
    giftWrap: activeGiftWrap,
  });

  if (cart.coupon_code && !coupon) {
    warnings.push(`Coupon "${cart.coupon_code}" is no longer valid.`);
  } else if (coupon && pricing.merchandiseSubtotalBdt > 0 && pricing.discountBdt === 0) {
    warnings.push(
      `Add ${coupon.minSubtotalBdt - pricing.merchandiseSubtotalBdt} BDT more to use ${coupon.code}.`,
    );
  }

  return {
    id: cart.id,
    items,
    itemCount: items.reduce((s, i) => s + i.quantity, 0),
    couponCode: coupon?.code ?? null,
    couponDescription: coupon?.description ?? null,
    zoneCode: zone?.code ?? 'dhaka_city',
    giftWrap: activeGiftWrap,
    pricing,
    warnings,
  };
}

export async function addOrIncrementCartItem(params: {
  accessToken: string;
  userId: string;
  productId: string;
  variantId: string;
  quantity: number;
  personalization: PersonalizationInput | null | undefined;
}): Promise<CartDTO> {
  const userClient = createUserSupabase(params.accessToken);
  const service = createServiceSupabase();

  const { data: variantRow, error: vErr } = await service
    .from('product_variants')
    .select(
      `id, product_id, stock_qty, is_active,
       products!inner(id, is_active, is_customizable, personalization_config)`,
    )
    .eq('id', params.variantId)
    .eq('product_id', params.productId)
    .maybeSingle();

  if (vErr || !variantRow) {
    throw new HttpError(404, 'PRODUCT_NOT_FOUND', 'Selected product variant was not found.');
  }

  const productData = variantRow.products as unknown as {
    id: string;
    is_active: boolean;
    is_customizable: boolean;
    personalization_config: PersonalizationConfig | null;
  };

  if (!productData.is_active || !variantRow.is_active) {
    throw new HttpError(400, 'ITEM_UNAVAILABLE', 'This item is currently unavailable.');
  }

  const persCheck = validatePersonalizationAgainstConfig(
    params.personalization,
    productData.personalization_config,
    false,
  );
  if (!persCheck.ok) {
    throw new HttpError(422, 'INVALID_PERSONALIZATION', persCheck.message);
  }

  const pHash = hashPersonalization(persCheck.value);
  const cart = await getOrCreateActiveCart(userClient, params.userId);

  const { data: existingLine } = await userClient
    .from('cart_items')
    .select('id, quantity')
    .eq('cart_id', cart.id)
    .eq('variant_id', params.variantId)
    .eq('personalization_hash', pHash)
    .maybeSingle();

  const nextQty = (existingLine?.quantity ?? 0) + params.quantity;
  if (nextQty > 20) {
    throw new HttpError(422, 'MAX_QUANTITY', 'You can order up to 20 units per line.');
  }
  if ((variantRow.stock_qty as number) < nextQty) {
    throw new HttpError(
      409,
      'INSUFFICIENT_STOCK',
      `Only ${variantRow.stock_qty} units currently available in stock.`,
    );
  }

  if (existingLine) {
    const { error: updErr } = await userClient
      .from('cart_items')
      .update({ quantity: nextQty })
      .eq('id', existingLine.id);
    if (updErr) {
      throw new HttpError(500, 'CART_UPDATE_ERROR', 'Unable to update item quantity.');
    }
  } else {
    const { error: insErr } = await userClient.from('cart_items').insert({
      cart_id: cart.id,
      product_id: params.productId,
      variant_id: params.variantId,
      quantity: params.quantity,
      personalization: persCheck.value,
      personalization_hash: pHash,
    });
    if (insErr) {
      throw new HttpError(500, 'CART_ADD_ERROR', 'Unable to add item to bag.');
    }
  }

  return buildCartDTO(params.accessToken, params.userId);
}
