import { GIFT_WRAP_FEE_BDT } from '../../../shared/constants';
import { calculateOrderTotals } from '../../../shared/pricing';
import { checkoutQuoteSchema, placeOrderSchema } from '../../../shared/schemas';
import type { OrderDTO, OrderItemDTO, PersonalizationInput } from '../../../shared/types';
import { buildCartDTO, lookupCouponServer } from '../cart-service';
import { getShippingZones } from '../catalog-data';
import { getHeader, HttpError, readJsonBody, sendOk, withApiHandler } from '../http';
import { enforceRateLimit } from '../rate-limit';
import { createServiceSupabase, createUserSupabase, requireAuth } from '../supabase';

function mapOrderRow(
  o: Record<string, unknown>,
  rawItems: Array<Record<string, unknown>>,
): OrderDTO {
  const items: OrderItemDTO[] = rawItems.map((i) => ({
    id: i.id as string,
    productId: (i.product_id as string | null) ?? null,
    productSlug: (i.product_slug as string | null) ?? null,
    name: i.name as string,
    variantName: i.variant_name as string,
    sku: i.sku as string,
    imageUrl: (i.image_url as string) ?? '',
    unitPriceBdt: i.unit_price_bdt as number,
    personalizationFeeBdt: (i.personalization_fee_bdt as number) ?? 0,
    personalization: (i.personalization as PersonalizationInput | null) ?? null,
    quantity: i.quantity as number,
    lineTotalBdt: i.line_total_bdt as number,
  }));

  return {
    id: o.id as string,
    orderNumber: o.order_number as string,
    status: o.status as OrderDTO['status'],
    paymentMethod: o.payment_method as OrderDTO['paymentMethod'],
    paymentStatus: 'unpaid',
    isDemo: Boolean(o.is_demo),
    customerName: o.customer_name as string,
    customerPhone: o.customer_phone as string,
    customerEmail: (o.customer_email as string | null) ?? null,
    shippingAddress: o.shipping_address as OrderDTO['shippingAddress'],
    subtotalBdt: o.subtotal_bdt as number,
    personalizationFeesBdt: (o.personalization_fees_bdt as number) ?? 0,
    discountBdt: (o.discount_bdt as number) ?? 0,
    couponCode: (o.coupon_code as string | null) ?? null,
    giftWrap: Boolean(o.gift_wrap),
    giftWrapFeeBdt: (o.gift_wrap_fee_bdt as number) ?? 0,
    giftMessage: (o.gift_message as string | null) ?? null,
    shippingFeeBdt: o.shipping_fee_bdt as number,
    totalBdt: o.total_bdt as number,
    customerNote: (o.customer_note as string | null) ?? null,
    etaText: (o.eta_text as string) ?? '',
    items,
    createdAt: o.created_at as string,
  };
}

export const ordersHandler = withApiHandler(async (req, res) => {
  const user = await requireAuth(req);
  const method = (req.method || 'GET').toUpperCase();
  const pathname = (req.url || '/').split('?')[0] || '/';
  const userClient = createUserSupabase(user.accessToken);

  if (pathname === '/api/checkout/quote' && method === 'POST') {
    const body = checkoutQuoteSchema.parse(await readJsonBody(req));
    const [cart, zones, coupon] = await Promise.all([
      buildCartDTO(user.accessToken, user.userId),
      getShippingZones(),
      lookupCouponServer(body.couponCode ?? null),
    ]);

    const zone = zones.find((z) => z.code === body.zoneCode);
    if (!zone) {
      throw new HttpError(422, 'INVALID_ZONE', 'Please select a valid delivery zone.');
    }

    const effectiveCoupon = coupon ?? (cart.couponCode ? await lookupCouponServer(cart.couponCode) : null);
    const pricing = calculateOrderTotals({
      lines: cart.items.map((i) => ({
        unitPriceBdt: i.unitPriceBdt,
        personalizationFeePerUnitBdt: i.personalizationFeePerUnitBdt,
        hasPersonalization: Boolean(i.personalization?.text?.trim()),
        quantity: i.quantity,
      })),
      coupon: effectiveCoupon,
      zone,
      giftWrap: body.giftWrap,
    });

    sendOk(res, {
      zone,
      couponCode: effectiveCoupon?.code ?? null,
      pricing,
    });
    return;
  }

  if (pathname === '/api/orders' && method === 'POST') {
    await enforceRateLimit(req, 'place_order', 10, 60);

    const idempotencyKey = getHeader(req, 'idempotency-key').trim();
    if (!idempotencyKey || idempotencyKey.length < 8 || idempotencyKey.length > 100) {
      throw new HttpError(
        400,
        'IDEMPOTENCY_KEY_REQUIRED',
        'A valid Idempotency-Key header is required to prevent duplicate orders.',
      );
    }

    const body = placeOrderSchema.parse(await readJsonBody(req));
    const service = createServiceSupabase();

    const { data, error } = await service.rpc('place_order', {
      p_user_id: user.userId,
      p_idempotency_key: idempotencyKey,
      p_customer_name: body.customerName,
      p_customer_phone: body.customerPhone,
      p_customer_email: body.customerEmail ?? '',
      p_zone_code: body.zoneCode,
      p_district: body.district,
      p_thana: body.thana,
      p_address_line: body.addressLine,
      p_landmark: body.landmark ?? '',
      p_postal_code: body.postalCode ?? '',
      p_payment_method: body.paymentMethod,
      p_coupon_code: body.couponCode ?? '',
      p_gift_wrap: body.giftWrap,
      p_gift_message: body.giftMessage ?? '',
      p_customer_note: body.customerNote ?? '',
      p_gift_wrap_fee_bdt: GIFT_WRAP_FEE_BDT,
    });

    if (error) {
      const msg = error.message || '';
      if (msg.includes('CART_EMPTY')) {
        throw new HttpError(400, 'CART_EMPTY', 'Your shopping bag is empty.');
      }
      if (msg.includes('OUT_OF_STOCK') || msg.includes('ITEM_UNAVAILABLE')) {
        throw new HttpError(409, 'ORDER_STOCK_ERROR', msg.split(':').slice(1).join(':').trim() || msg);
      }
      if (msg.includes('INVALID_ZONE') || msg.includes('INVALID_PAYMENT')) {
        throw new HttpError(422, 'INVALID_CHECKOUT', msg.split(':').slice(1).join(':').trim() || msg);
      }
      throw new HttpError(500, 'ORDER_FAILED', 'Unable to place demo order right now.');
    }

    const result = data as {
      order: Record<string, unknown>;
      items: Array<Record<string, unknown>>;
    };
    sendOk(res, mapOrderRow(result.order, result.items), 201);
    return;
  }

  if (pathname === '/api/orders' && method === 'GET') {
    const { data, error } = await userClient
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', user.userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new HttpError(500, 'ORDERS_READ_ERROR', 'Unable to load your orders.');
    }

    const orders = (data ?? []).map((row) =>
      mapOrderRow(
        row as Record<string, unknown>,
        ((row as Record<string, unknown>).order_items as Array<Record<string, unknown>>) ?? [],
      ),
    );
    sendOk(res, orders);
    return;
  }

  const orderMatch = pathname.match(/^\/api\/orders\/([^/]+)$/);
  if (orderMatch && orderMatch[1] && method === 'GET') {
    const orderNumber = decodeURIComponent(orderMatch[1]).trim();
    const { data, error } = await userClient
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', user.userId)
      .eq('order_number', orderNumber)
      .maybeSingle();

    if (error) {
      throw new HttpError(500, 'ORDER_READ_ERROR', 'Unable to load order details.');
    }
    if (!data) {
      throw new HttpError(404, 'ORDER_NOT_FOUND', 'Order not found.');
    }

    sendOk(
      res,
      mapOrderRow(
        data as Record<string, unknown>,
        ((data as Record<string, unknown>).order_items as Array<Record<string, unknown>>) ?? [],
      ),
    );
    return;
  }

  throw new HttpError(405, 'METHOD_NOT_ALLOWED', 'Unsupported order operation.');
});
