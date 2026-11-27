import {
  SEED_COUPONS,
  SEED_PRODUCTS,
  SEED_SHIPPING_ZONES,
} from '@shared/catalog-seed';
import { GIFT_WRAP_FEE_BDT } from '@shared/constants';
import { calculateLineTotals, calculateOrderTotals } from '@shared/pricing';
import {
  hashPersonalization,
  validatePersonalizationAgainstConfig,
} from '@shared/schemas';
import type {
  AddressDTO,
  CartDTO,
  CartItemDTO,
  CouponDTO,
  OrderDTO,
  PersonalizationInput,
  ProfileDTO,
  WishlistItemDTO,
} from '@shared/types';

const KEYS = {
  cart: 'pb_demo_cart_v1',
  wishlist: 'pb_demo_wishlist_v1',
  addresses: 'pb_demo_addresses_v1',
  orders: 'pb_demo_orders_v1',
  profile: 'pb_demo_profile_v1',
} as const;

interface StoredCartState {
  items: Array<{
    id: string;
    productId: string;
    variantId: string;
    quantity: number;
    personalization: PersonalizationInput | null;
  }>;
  couponCode: string | null;
  zoneCode: string;
  giftWrap: boolean;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors in restricted sandboxes
  }
}

function getCartState(): StoredCartState {
  return readJson<StoredCartState>(KEYS.cart, {
    items: [],
    couponCode: null,
    zoneCode: 'dhaka_city',
    giftWrap: false,
  });
}

function findCoupon(code: string | null): CouponDTO | null {
  if (!code) return null;
  return SEED_COUPONS.find((c) => c.code.toUpperCase() === code.trim().toUpperCase()) ?? null;
}

export function buildDemoCartDTO(state = getCartState()): CartDTO {
  const mappedItems: CartItemDTO[] = [];

  for (const line of state.items) {
    const prod = SEED_PRODUCTS.find((p) => p.id === line.productId);
    const variant = prod?.variants.find((v) => v.id === line.variantId);
    if (!prod || !variant) continue;

    const unitPriceBdt = variant.priceOverrideBdt ?? prod.basePriceBdt;
    const hasPersonalization = Boolean(line.personalization?.text?.trim()) && prod.isCustomizable;
    const pFee = hasPersonalization ? prod.personalizationFeeBdt : 0;
    const totals = calculateLineTotals({
      unitPriceBdt,
      personalizationFeePerUnitBdt: pFee,
      hasPersonalization,
      quantity: line.quantity,
    });

    mappedItems.push({
      id: line.id,
      productId: prod.id,
      productSlug: prod.slug,
      productName: prod.name,
      variantId: variant.id,
      variantName: variant.name,
      sku: variant.sku,
      imageUrl: prod.images[0]?.url ?? '/images/products/notebook-linen.svg',
      imageAlt: prod.images[0]?.altText ?? prod.name,
      unitPriceBdt,
      personalizationFeePerUnitBdt: pFee,
      personalization: line.personalization,
      quantity: line.quantity,
      lineSubtotalBdt: totals.lineSubtotalBdt,
      linePersonalizationBdt: totals.linePersonalizationBdt,
      lineTotalBdt: totals.lineTotalBdt,
      stockQty: variant.stockQty,
      warnings: [],
    });
  }

  const zone =
    SEED_SHIPPING_ZONES.find((z) => z.code === state.zoneCode) ?? SEED_SHIPPING_ZONES[0]!;
  const coupon = findCoupon(state.couponCode);

  const pricing = calculateOrderTotals({
    lines: mappedItems.map((i) => ({
      unitPriceBdt: i.unitPriceBdt,
      personalizationFeePerUnitBdt: i.personalizationFeePerUnitBdt,
      hasPersonalization: Boolean(i.personalization?.text?.trim()),
      quantity: i.quantity,
    })),
    coupon,
    zone,
    giftWrap: state.giftWrap,
  });

  return {
    id: 'demo-cart',
    items: mappedItems,
    itemCount: mappedItems.reduce((sum, i) => sum + i.quantity, 0),
    couponCode: coupon?.code ?? null,
    couponDescription: coupon?.description ?? null,
    zoneCode: zone.code,
    giftWrap: state.giftWrap,
    pricing,
    warnings: [],
  };
}

export const demoStore = {
  getCart(): CartDTO {
    return buildDemoCartDTO();
  },

  addToCart(input: {
    productId: string;
    variantId: string;
    quantity: number;
    personalization?: PersonalizationInput | null;
  }): CartDTO {
    const prod = SEED_PRODUCTS.find((p) => p.id === input.productId);
    const variant = prod?.variants.find((v) => v.id === input.variantId);
    if (!prod || !variant) throw new Error('Selected product or variant was not found.');

    const check = validatePersonalizationAgainstConfig(
      input.personalization,
      prod.personalizationConfig,
      false,
    );
    if (!check.ok) throw new Error(check.message);

    const state = getCartState();
    const targetHash = hashPersonalization(check.value);
    const existing = state.items.find(
      (i) =>
        i.variantId === input.variantId &&
        hashPersonalization(i.personalization) === targetHash,
    );

    if (existing) {
      const nextQty = existing.quantity + input.quantity;
      if (nextQty > 20) throw new Error('Maximum 20 units per line.');
      if (nextQty > variant.stockQty) throw new Error(`Only ${variant.stockQty} available in stock.`);
      existing.quantity = nextQty;
    } else {
      if (input.quantity > variant.stockQty) {
        throw new Error(`Only ${variant.stockQty} available in stock.`);
      }
      state.items.push({
        id: crypto.randomUUID(),
        productId: prod.id,
        variantId: variant.id,
        quantity: input.quantity,
        personalization: check.value,
      });
    }

    writeJson(KEYS.cart, state);
    return buildDemoCartDTO(state);
  },

  updateCartItem(
    itemId: string,
    patch: { quantity?: number; personalization?: PersonalizationInput | null },
  ): CartDTO {
    const state = getCartState();
    const line = state.items.find((i) => i.id === itemId);
    if (!line) throw new Error('Cart item not found.');
    const prod = SEED_PRODUCTS.find((p) => p.id === line.productId);
    const variant = prod?.variants.find((v) => v.id === line.variantId);

    if (patch.quantity !== undefined) {
      if (patch.quantity < 1 || patch.quantity > 20) {
        throw new Error('Quantity must be between 1 and 20.');
      }
      if (variant && patch.quantity > variant.stockQty) {
        throw new Error(`Only ${variant.stockQty} left in stock.`);
      }
      line.quantity = patch.quantity;
    }

    if (patch.personalization !== undefined && prod) {
      const check = validatePersonalizationAgainstConfig(
        patch.personalization,
        prod.personalizationConfig,
        false,
      );
      if (!check.ok) throw new Error(check.message);
      line.personalization = check.value;
    }

    writeJson(KEYS.cart, state);
    return buildDemoCartDTO(state);
  },

  removeCartItem(itemId: string): CartDTO {
    const state = getCartState();
    state.items = state.items.filter((i) => i.id !== itemId);
    writeJson(KEYS.cart, state);
    return buildDemoCartDTO(state);
  },

  clearCart(): CartDTO {
    const state: StoredCartState = {
      items: [],
      couponCode: null,
      zoneCode: 'dhaka_city',
      giftWrap: false,
    };
    writeJson(KEYS.cart, state);
    return buildDemoCartDTO(state);
  },

  updateCartMeta(patch: { zoneCode?: string; giftWrap?: boolean }): CartDTO {
    const state = getCartState();
    if (patch.zoneCode) state.zoneCode = patch.zoneCode;
    if (patch.giftWrap !== undefined) state.giftWrap = patch.giftWrap;
    writeJson(KEYS.cart, state);
    return buildDemoCartDTO(state);
  },

  applyCoupon(code: string): CartDTO {
    const coupon = findCoupon(code);
    if (!coupon) throw new Error('That coupon code is invalid or expired.');
    const current = buildDemoCartDTO();
    if (current.pricing.merchandiseSubtotalBdt < coupon.minSubtotalBdt) {
      throw new Error(`Add at least ৳${coupon.minSubtotalBdt} in merchandise to apply ${coupon.code}.`);
    }
    const state = getCartState();
    state.couponCode = coupon.code;
    writeJson(KEYS.cart, state);
    return buildDemoCartDTO(state);
  },

  removeCoupon(): CartDTO {
    const state = getCartState();
    state.couponCode = null;
    writeJson(KEYS.cart, state);
    return buildDemoCartDTO(state);
  },

  getWishlist(): WishlistItemDTO[] {
    const ids = readJson<Array<{ id: string; productId: string; createdAt: string }>>(
      KEYS.wishlist,
      [],
    );
    return ids
      .map((entry) => {
        const product = SEED_PRODUCTS.find((p) => p.id === entry.productId);
        if (!product) return null;
        return { ...entry, product };
      })
      .filter((x): x is WishlistItemDTO => x !== null);
  },

  addToWishlist(productId: string): void {
    const list = readJson<Array<{ id: string; productId: string; createdAt: string }>>(
      KEYS.wishlist,
      [],
    );
    if (!list.some((x) => x.productId === productId)) {
      list.unshift({
        id: crypto.randomUUID(),
        productId,
        createdAt: new Date().toISOString(),
      });
      writeJson(KEYS.wishlist, list);
    }
  },

  removeFromWishlist(productId: string): void {
    const list = readJson<Array<{ id: string; productId: string; createdAt: string }>>(
      KEYS.wishlist,
      [],
    );
    writeJson(
      KEYS.wishlist,
      list.filter((x) => x.productId !== productId),
    );
  },

  moveWishlistToCart(productId: string): CartDTO {
    const prod = SEED_PRODUCTS.find((p) => p.id === productId);
    const variant = prod?.variants[0];
    if (!prod || !variant) throw new Error('Product not found.');
    const cart = this.addToCart({
      productId: prod.id,
      variantId: variant.id,
      quantity: 1,
      personalization: null,
    });
    this.removeFromWishlist(productId);
    return cart;
  },

  getProfile(): ProfileDTO {
    return readJson<ProfileDTO>(KEYS.profile, {
      id: 'demo-visitor',
      email: null,
      fullName: 'Demo Visitor',
      phone: '',
      isGuest: true,
      createdAt: new Date().toISOString(),
    });
  },

  updateProfile(input: { fullName: string; phone: string }): ProfileDTO {
    const current = this.getProfile();
    const updated = { ...current, fullName: input.fullName, phone: input.phone };
    writeJson(KEYS.profile, updated);
    return updated;
  },

  getAddresses(): AddressDTO[] {
    return readJson<AddressDTO[]>(KEYS.addresses, []);
  },

  saveAddress(input: Omit<AddressDTO, 'id'>): AddressDTO {
    let list = this.getAddresses();
    if (input.isDefault) {
      list = list.map((a) => ({ ...a, isDefault: false }));
    }
    const created: AddressDTO = { id: crypto.randomUUID(), ...input };
    list.unshift(created);
    writeJson(KEYS.addresses, list);
    return created;
  },

  updateAddress(id: string, patch: Partial<Omit<AddressDTO, 'id'>>): AddressDTO {
    let list = this.getAddresses();
    if (patch.isDefault) {
      list = list.map((a) => ({ ...a, isDefault: false }));
    }
    const idx = list.findIndex((a) => a.id === id);
    if (idx < 0) throw new Error('Address not found.');
    const updated: AddressDTO = { ...list[idx]!, ...patch };
    list[idx] = updated;
    writeJson(KEYS.addresses, list);
    return updated;
  },

  deleteAddress(id: string): void {
    const list = this.getAddresses().filter((a) => a.id !== id);
    writeJson(KEYS.addresses, list);
  },

  placeDemoOrder(input: {
    idempotencyKey: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    zoneCode: string;
    district: string;
    thana: string;
    addressLine: string;
    landmark?: string;
    postalCode?: string;
    paymentMethod: 'cod' | 'pickup';
    couponCode?: string | null;
    giftWrap: boolean;
    giftMessage?: string;
    customerNote?: string;
  }): OrderDTO {
    const existingOrders = readJson<OrderDTO[]>(KEYS.orders, []);
    const duplicate = existingOrders.find(
      (o) => (o as OrderDTO & { _idempotency?: string })._idempotency === input.idempotencyKey,
    );
    if (duplicate) return duplicate;

    const cart = buildDemoCartDTO();
    if (cart.items.length === 0) throw new Error('Your shopping bag is empty.');

    const zone =
      SEED_SHIPPING_ZONES.find((z) => z.code === input.zoneCode) ?? SEED_SHIPPING_ZONES[0]!;
    const coupon = findCoupon(input.couponCode ?? cart.couponCode);

    const pricing = calculateOrderTotals({
      lines: cart.items.map((i) => ({
        unitPriceBdt: i.unitPriceBdt,
        personalizationFeePerUnitBdt: i.personalizationFeePerUnitBdt,
        hasPersonalization: Boolean(i.personalization?.text?.trim()),
        quantity: i.quantity,
      })),
      coupon,
      zone,
      giftWrap: input.giftWrap,
      giftWrapFeeOverrideBdt: GIFT_WRAP_FEE_BDT,
    });

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const now = new Date();
    const yymmdd = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const orderNumber = `PB-${yymmdd}-${randomNum}`;

    const order: OrderDTO & { _idempotency?: string } = {
      id: crypto.randomUUID(),
      orderNumber,
      status: 'pending',
      paymentMethod: input.paymentMethod,
      paymentStatus: 'unpaid',
      isDemo: true,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      customerEmail: input.customerEmail || null,
      shippingAddress: {
        zoneCode: zone.code,
        zoneName: zone.name,
        district: input.district,
        thana: input.thana,
        addressLine: input.addressLine,
        landmark: input.landmark || '',
        postalCode: input.postalCode || '',
      },
      subtotalBdt: pricing.itemsSubtotalBdt,
      personalizationFeesBdt: pricing.personalizationTotalBdt,
      discountBdt: pricing.discountBdt,
      couponCode: coupon && pricing.discountBdt > 0 ? coupon.code : null,
      giftWrap: input.giftWrap,
      giftWrapFeeBdt: pricing.giftWrapFeeBdt,
      giftMessage: input.giftMessage || null,
      shippingFeeBdt: pricing.shippingFeeBdt,
      totalBdt: pricing.totalBdt,
      customerNote: input.customerNote || null,
      etaText: zone.etaText,
      items: cart.items.map((i) => ({
        id: crypto.randomUUID(),
        productId: i.productId,
        productSlug: i.productSlug,
        name: i.productName,
        variantName: i.variantName,
        sku: i.sku,
        imageUrl: i.imageUrl,
        unitPriceBdt: i.unitPriceBdt,
        personalizationFeeBdt: i.personalizationFeePerUnitBdt,
        personalization: i.personalization,
        quantity: i.quantity,
        lineTotalBdt: i.lineTotalBdt,
      })),
      createdAt: now.toISOString(),
      _idempotency: input.idempotencyKey,
    };

    existingOrders.unshift(order);
    writeJson(KEYS.orders, existingOrders);
    this.clearCart();
    return order;
  },

  getOrders(): OrderDTO[] {
    return readJson<OrderDTO[]>(KEYS.orders, []);
  },

  getOrderByNumber(orderNumber: string): OrderDTO | null {
    return this.getOrders().find((o) => o.orderNumber === orderNumber) ?? null;
  },

  getRawCartItemsForMerge() {
    return getCartState().items.map((i) => ({
      productId: i.productId,
      variantId: i.variantId,
      quantity: i.quantity,
      personalization: i.personalization,
    }));
  },
};
