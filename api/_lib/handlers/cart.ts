import { z } from 'zod';
import {
  addCartItemSchema,
  applyCouponSchema,
  hashPersonalization,
  updateCartItemSchema,
  validatePersonalizationAgainstConfig,
} from '../../../shared/schemas';
import type { PersonalizationConfig } from '../../../shared/types';
import {
  addOrIncrementCartItem,
  buildCartDTO,
  getOrCreateActiveCart,
  lookupCouponServer,
} from '../cart-service';
import { HttpError, readJsonBody, sendOk, withApiHandler } from '../http';
import { createServiceSupabase, createUserSupabase, requireAuth } from '../supabase';

const updateCartMetaSchema = z.object({
  zoneCode: z.string().trim().min(2).max(40).optional(),
  giftWrap: z.boolean().optional(),
});

const mergeCartSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        variantId: z.string().uuid(),
        quantity: z.number().int().min(1).max(20),
        personalization: z
          .object({
            text: z.string().max(60),
            foilColor: z.string().max(40).optional(),
            fontStyle: z.string().max(40).optional(),
            note: z.string().max(200).optional(),
          })
          .nullable()
          .optional(),
      }),
    )
    .max(30),
});

export const cartHandler = withApiHandler(async (req, res) => {
  const user = await requireAuth(req);
  const method = (req.method || 'GET').toUpperCase();
  const pathname = (req.url || '/').split('?')[0] || '/';
  const userClient = createUserSupabase(user.accessToken);

  if (pathname === '/api/cart' && method === 'GET') {
    const cart = await buildCartDTO(user.accessToken, user.userId);
    sendOk(res, cart);
    return;
  }

  if (pathname === '/api/cart' && method === 'PATCH') {
    const body = updateCartMetaSchema.parse(await readJsonBody(req));
    const cart = await getOrCreateActiveCart(userClient, user.userId);
    const updates: Record<string, unknown> = {};
    if (body.zoneCode !== undefined) updates.zone_code = body.zoneCode;
    if (body.giftWrap !== undefined) updates.gift_wrap = body.giftWrap;
    if (Object.keys(updates).length > 0) {
      await userClient.from('carts').update(updates).eq('id', cart.id);
    }
    const updated = await buildCartDTO(user.accessToken, user.userId);
    sendOk(res, updated);
    return;
  }

  if (pathname === '/api/cart' && method === 'DELETE') {
    const cart = await getOrCreateActiveCart(userClient, user.userId);
    await userClient.from('cart_items').delete().eq('cart_id', cart.id);
    await userClient.from('carts').update({ coupon_code: null, gift_wrap: false }).eq('id', cart.id);
    const cleared = await buildCartDTO(user.accessToken, user.userId);
    sendOk(res, cleared);
    return;
  }

  if (pathname === '/api/cart/items' && method === 'POST') {
    const body = addCartItemSchema.parse(await readJsonBody(req));
    const updated = await addOrIncrementCartItem({
      accessToken: user.accessToken,
      userId: user.userId,
      productId: body.productId,
      variantId: body.variantId,
      quantity: body.quantity,
      personalization: body.personalization,
    });
    sendOk(res, updated, 201);
    return;
  }

  if (pathname === '/api/cart/coupon' && method === 'POST') {
    const body = applyCouponSchema.parse(await readJsonBody(req));
    const coupon = await lookupCouponServer(body.code);
    if (!coupon) {
      throw new HttpError(404, 'COUPON_INVALID', 'That coupon code is invalid or expired.');
    }
    const currentCart = await buildCartDTO(user.accessToken, user.userId);
    if (currentCart.pricing.merchandiseSubtotalBdt < coupon.minSubtotalBdt) {
      throw new HttpError(
        422,
        'COUPON_MIN_SUBTOTAL',
        `Add at least ৳${coupon.minSubtotalBdt} in merchandise to apply ${coupon.code}.`,
      );
    }
    await userClient
      .from('carts')
      .update({ coupon_code: coupon.code })
      .eq('id', currentCart.id);
    const updated = await buildCartDTO(user.accessToken, user.userId);
    sendOk(res, updated);
    return;
  }

  if (pathname === '/api/cart/coupon' && method === 'DELETE') {
    const cart = await getOrCreateActiveCart(userClient, user.userId);
    await userClient.from('carts').update({ coupon_code: null }).eq('id', cart.id);
    const updated = await buildCartDTO(user.accessToken, user.userId);
    sendOk(res, updated);
    return;
  }

  if (pathname === '/api/cart/merge' && method === 'POST') {
    const body = mergeCartSchema.parse(await readJsonBody(req));
    for (const item of body.items) {
      try {
        await addOrIncrementCartItem({
          accessToken: user.accessToken,
          userId: user.userId,
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          personalization: item.personalization,
        });
      } catch {
        // Ignore unavailable lines during guest cart merge
      }
    }
    const merged = await buildCartDTO(user.accessToken, user.userId);
    sendOk(res, merged);
    return;
  }

  const itemMatch = pathname.match(/^\/api\/cart\/items\/([^/]+)$/);
  if (itemMatch && itemMatch[1]) {
    const itemId = z.string().uuid().parse(itemMatch[1]);
    const cart = await getOrCreateActiveCart(userClient, user.userId);

    if (method === 'DELETE') {
      const { error } = await userClient
        .from('cart_items')
        .delete()
        .eq('id', itemId)
        .eq('cart_id', cart.id);
      if (error) {
        throw new HttpError(500, 'CART_DELETE_ERROR', 'Unable to remove item.');
      }
      const updated = await buildCartDTO(user.accessToken, user.userId);
      sendOk(res, updated);
      return;
    }

    if (method === 'PATCH') {
      const body = updateCartItemSchema.parse(await readJsonBody(req));
      const { data: existing } = await userClient
        .from('cart_items')
        .select('id, product_id, variant_id, quantity, personalization')
        .eq('id', itemId)
        .eq('cart_id', cart.id)
        .maybeSingle();

      if (!existing) {
        throw new HttpError(404, 'CART_ITEM_NOT_FOUND', 'Cart item not found.');
      }

      const service = createServiceSupabase();
      const { data: variantRow } = await service
        .from('product_variants')
        .select('stock_qty, products!inner(personalization_config)')
        .eq('id', existing.variant_id)
        .maybeSingle();

      const nextQty = body.quantity ?? (existing.quantity as number);
      if (variantRow && (variantRow.stock_qty as number) < nextQty) {
        throw new HttpError(
          409,
          'INSUFFICIENT_STOCK',
          `Only ${variantRow.stock_qty} units available in stock.`,
        );
      }

      const updates: Record<string, unknown> = {};
      if (body.quantity !== undefined) updates.quantity = body.quantity;
      if (body.personalization !== undefined) {
        const cfg = (variantRow?.products as unknown as { personalization_config: PersonalizationConfig | null })
          ?.personalization_config ?? null;
        const persCheck = validatePersonalizationAgainstConfig(body.personalization, cfg, false);
        if (!persCheck.ok) {
          throw new HttpError(422, 'INVALID_PERSONALIZATION', persCheck.message);
        }
        updates.personalization = persCheck.value;
        updates.personalization_hash = hashPersonalization(persCheck.value);
      }

      const { error: updErr } = await userClient
        .from('cart_items')
        .update(updates)
        .eq('id', itemId)
        .eq('cart_id', cart.id);

      if (updErr) {
        throw new HttpError(409, 'CART_UPDATE_CONFLICT', 'Could not update cart line.');
      }

      const updated = await buildCartDTO(user.accessToken, user.userId);
      sendOk(res, updated);
      return;
    }
  }

  throw new HttpError(405, 'METHOD_NOT_ALLOWED', 'Unsupported cart operation.');
});
