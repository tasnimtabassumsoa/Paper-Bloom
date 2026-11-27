import { SEED_COUPONS, SEED_SHIPPING_ZONES } from '@shared/catalog-seed';
import { calculateOrderTotals } from '@shared/pricing';
import type {
  AddressDTO,
  ApiMeta,
  ApiResponse,
  CartDTO,
  CategoryDTO,
  HealthDTO,
  OrderDTO,
  OrderPricingSummary,
  PersonalizationInput,
  ProductDTO,
  ProfileDTO,
  ShippingZoneDTO,
  WishlistItemDTO,
} from '@shared/types';
import { demoStore } from '@/demo/demoStore';
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';

export class ApiClientError extends Error {
  code: string;
  status: number;

  constructor(message: string, code = 'API_ERROR', status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function getAccessToken(lazyGuestSignIn = false): Promise<string | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data } = await supabase.auth.getSession();
  if (data.session?.access_token) {
    return data.session.access_token;
  }

  if (lazyGuestSignIn) {
    const { data: anonData, error } = await supabase.auth.signInAnonymously();
    if (error || !anonData.session?.access_token) {
      throw new ApiClientError(
        error?.message || 'Unable to start guest session. Ensure Anonymous sign-ins are enabled in Supabase.',
        'AUTH_REQUIRED',
        401,
      );
    }
    return anonData.session.access_token;
  }

  return null;
}

async function requestApi<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    auth?: 'none' | 'optional' | 'required' | 'lazy-guest';
    headers?: Record<string, string>;
  } = {},
): Promise<{ data: T; meta?: ApiMeta }> {
  const method = options.method ?? 'GET';
  const headers: Record<string, string> = {
    ...(options.headers ?? {}),
  };

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.auth && options.auth !== 'none') {
    const token = await getAccessToken(options.auth === 'lazy-guest');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    } else if (options.auth === 'required') {
      throw new ApiClientError('Please sign in or continue as guest.', 'UNAUTHORIZED', 401);
    }
  }

  const res = await fetch(path, {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const json = (await res.json()) as ApiResponse<T>;
  if (!json.ok) {
    throw new ApiClientError(json.error.message, json.error.code, res.status);
  }
  return { data: json.data, meta: json.meta };
}

export const apiClient = {
  async getHealth(): Promise<HealthDTO> {
    const { data } = await requestApi<HealthDTO>('/api/health');
    return data;
  },

  async getFeatured(): Promise<{
    bestsellers: ProductDTO[];
    personalized: ProductDTO[];
    newArrivals: ProductDTO[];
    categories: CategoryDTO[];
  }> {
    const { data } = await requestApi<{
      bestsellers: ProductDTO[];
      personalized: ProductDTO[];
      newArrivals: ProductDTO[];
      categories: CategoryDTO[];
    }>('/api/featured');
    return data;
  },

  async getCategories(): Promise<CategoryDTO[]> {
    const { data } = await requestApi<CategoryDTO[]>('/api/categories');
    return data;
  },

  async getShippingZones(): Promise<ShippingZoneDTO[]> {
    const { data } = await requestApi<ShippingZoneDTO[]>('/api/shipping-zones');
    return data;
  },

  async getProducts(params: Record<string, string | number | boolean | undefined>): Promise<{
    items: ProductDTO[];
    meta: ApiMeta;
  }> {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== '') qs.set(k, String(v));
    }
    const { data, meta } = await requestApi<ProductDTO[]>(`/api/products?${qs.toString()}`);
    return { items: data, meta: meta ?? {} };
  },

  async getProductBySlug(slug: string): Promise<{ product: ProductDTO; related: ProductDTO[] }> {
    const { data } = await requestApi<{ product: ProductDTO; related: ProductDTO[] }>(
      `/api/products/${encodeURIComponent(slug)}`,
    );
    return data;
  },

  async getSearchSuggestions(q: string): Promise<
    Array<{
      slug: string;
      name: string;
      categoryName: string;
      basePriceBdt: number;
      imageUrl: string;
    }>
  > {
    const { data } = await requestApi<
      Array<{
        slug: string;
        name: string;
        categoryName: string;
        basePriceBdt: number;
        imageUrl: string;
      }>
    >(`/api/search/suggest?q=${encodeURIComponent(q)}`);
    return data;
  },

  // Cart
  async getCart(): Promise<CartDTO> {
    if (!isSupabaseConfigured()) return demoStore.getCart();
    const token = await getAccessToken(false);
    if (!token) {
      return {
        id: 'empty',
        items: [],
        itemCount: 0,
        couponCode: null,
        couponDescription: null,
        zoneCode: 'dhaka_city',
        giftWrap: false,
        pricing: {
          itemsSubtotalBdt: 0,
          personalizationTotalBdt: 0,
          merchandiseSubtotalBdt: 0,
          discountBdt: 0,
          discountedSubtotalBdt: 0,
          giftWrapFeeBdt: 0,
          shippingFeeBdt: 0,
          totalBdt: 0,
          freeShippingApplied: false,
          amountToFreeShippingBdt: null,
        },
        warnings: [],
      };
    }
    const { data } = await requestApi<CartDTO>('/api/cart', { auth: 'required' });
    return data;
  },

  async addToCart(input: {
    productId: string;
    variantId: string;
    quantity: number;
    personalization?: PersonalizationInput | null;
  }): Promise<CartDTO> {
    if (!isSupabaseConfigured()) return demoStore.addToCart(input);
    const { data } = await requestApi<CartDTO>('/api/cart/items', {
      method: 'POST',
      body: input,
      auth: 'lazy-guest',
    });
    return data;
  },

  async updateCartItem(
    id: string,
    patch: { quantity?: number; personalization?: PersonalizationInput | null },
  ): Promise<CartDTO> {
    if (!isSupabaseConfigured()) return demoStore.updateCartItem(id, patch);
    const { data } = await requestApi<CartDTO>(`/api/cart/items/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: patch,
      auth: 'required',
    });
    return data;
  },

  async removeCartItem(id: string): Promise<CartDTO> {
    if (!isSupabaseConfigured()) return demoStore.removeCartItem(id);
    const { data } = await requestApi<CartDTO>(`/api/cart/items/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      auth: 'required',
    });
    return data;
  },

  async updateCartMeta(patch: { zoneCode?: string; giftWrap?: boolean }): Promise<CartDTO> {
    if (!isSupabaseConfigured()) return demoStore.updateCartMeta(patch);
    const { data } = await requestApi<CartDTO>('/api/cart', {
      method: 'PATCH',
      body: patch,
      auth: 'lazy-guest',
    });
    return data;
  },

  async applyCoupon(code: string): Promise<CartDTO> {
    if (!isSupabaseConfigured()) return demoStore.applyCoupon(code);
    const { data } = await requestApi<CartDTO>('/api/cart/coupon', {
      method: 'POST',
      body: { code },
      auth: 'lazy-guest',
    });
    return data;
  },

  async removeCoupon(): Promise<CartDTO> {
    if (!isSupabaseConfigured()) return demoStore.removeCoupon();
    const { data } = await requestApi<CartDTO>('/api/cart/coupon', {
      method: 'DELETE',
      auth: 'required',
    });
    return data;
  },

  async mergeGuestCart(
    items: Array<{
      productId: string;
      variantId: string;
      quantity: number;
      personalization?: PersonalizationInput | null;
    }>,
  ): Promise<CartDTO> {
    if (!isSupabaseConfigured()) return demoStore.getCart();
    const { data } = await requestApi<CartDTO>('/api/cart/merge', {
      method: 'POST',
      body: { items },
      auth: 'required',
    });
    return data;
  },

  // Wishlist
  async getWishlist(): Promise<WishlistItemDTO[]> {
    if (!isSupabaseConfigured()) return demoStore.getWishlist();
    const token = await getAccessToken(false);
    if (!token) return [];
    const { data } = await requestApi<WishlistItemDTO[]>('/api/wishlist', { auth: 'required' });
    return data;
  },

  async addToWishlist(productId: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      demoStore.addToWishlist(productId);
      return;
    }
    await requestApi(`/api/wishlist/${encodeURIComponent(productId)}`, {
      method: 'POST',
      auth: 'lazy-guest',
    });
  },

  async removeFromWishlist(productId: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      demoStore.removeFromWishlist(productId);
      return;
    }
    await requestApi(`/api/wishlist/${encodeURIComponent(productId)}`, {
      method: 'DELETE',
      auth: 'required',
    });
  },

  async moveWishlistToCart(productId: string): Promise<CartDTO> {
    if (!isSupabaseConfigured()) return demoStore.moveWishlistToCart(productId);
    const { data } = await requestApi<{ cart: CartDTO }>(
      `/api/wishlist/${encodeURIComponent(productId)}/move-to-cart`,
      { method: 'POST', auth: 'lazy-guest' },
    );
    return data.cart;
  },

  // Profile & Addresses
  async getProfile(): Promise<ProfileDTO> {
    if (!isSupabaseConfigured()) return demoStore.getProfile();
    const { data } = await requestApi<ProfileDTO>('/api/me', { auth: 'required' });
    return data;
  },

  async updateProfile(input: { fullName: string; phone: string }): Promise<ProfileDTO> {
    if (!isSupabaseConfigured()) return demoStore.updateProfile(input);
    const { data } = await requestApi<ProfileDTO>('/api/me', {
      method: 'PATCH',
      body: input,
      auth: 'required',
    });
    return data;
  },

  async getAddresses(): Promise<AddressDTO[]> {
    if (!isSupabaseConfigured()) return demoStore.getAddresses();
    const token = await getAccessToken(false);
    if (!token) return [];
    const { data } = await requestApi<AddressDTO[]>('/api/me/addresses', { auth: 'required' });
    return data;
  },

  async createAddress(input: Omit<AddressDTO, 'id'>): Promise<AddressDTO> {
    if (!isSupabaseConfigured()) return demoStore.saveAddress(input);
    const { data } = await requestApi<AddressDTO>('/api/me/addresses', {
      method: 'POST',
      body: input,
      auth: 'required',
    });
    return data;
  },

  async updateAddress(id: string, patch: Partial<Omit<AddressDTO, 'id'>>): Promise<AddressDTO> {
    if (!isSupabaseConfigured()) return demoStore.updateAddress(id, patch);
    const { data } = await requestApi<AddressDTO>(`/api/me/addresses/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: patch,
      auth: 'required',
    });
    return data;
  },

  async deleteAddress(id: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      demoStore.deleteAddress(id);
      return;
    }
    await requestApi(`/api/me/addresses/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      auth: 'required',
    });
  },

  // Checkout & Orders
  async getCheckoutQuote(input: {
    zoneCode: string;
    couponCode?: string | null;
    giftWrap: boolean;
  }): Promise<{ zone: ShippingZoneDTO; couponCode: string | null; pricing: OrderPricingSummary }> {
    if (!isSupabaseConfigured()) {
      const cart = demoStore.getCart();
      const zone =
        SEED_SHIPPING_ZONES.find((z) => z.code === input.zoneCode) ?? SEED_SHIPPING_ZONES[0]!;
      const targetCode = input.couponCode ?? cart.couponCode;
      const coupon =
        (targetCode
          ? SEED_COUPONS.find((c) => c.code.toUpperCase() === targetCode.toUpperCase())
          : null) ?? null;
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
      });
      return { zone, couponCode: coupon?.code ?? null, pricing };
    }

    const { data } = await requestApi<{
      zone: ShippingZoneDTO;
      couponCode: string | null;
      pricing: OrderPricingSummary;
    }>('/api/checkout/quote', {
      method: 'POST',
      body: input,
      auth: 'lazy-guest',
    });
    return data;
  },

  async placeOrder(
    idempotencyKey: string,
    input: {
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
      acceptedDemoTerms: true;
    },
  ): Promise<OrderDTO> {
    if (!isSupabaseConfigured()) {
      return demoStore.placeDemoOrder({ ...input, idempotencyKey });
    }
    const { data } = await requestApi<OrderDTO>('/api/orders', {
      method: 'POST',
      body: input,
      headers: { 'Idempotency-Key': idempotencyKey },
      auth: 'lazy-guest',
    });
    return data;
  },

  async getOrders(): Promise<OrderDTO[]> {
    if (!isSupabaseConfigured()) return demoStore.getOrders();
    const token = await getAccessToken(false);
    if (!token) return [];
    const { data } = await requestApi<OrderDTO[]>('/api/orders', { auth: 'required' });
    return data;
  },

  async getOrderByNumber(orderNumber: string): Promise<OrderDTO | null> {
    if (!isSupabaseConfigured()) return demoStore.getOrderByNumber(orderNumber);
    const { data } = await requestApi<OrderDTO>(
      `/api/orders/${encodeURIComponent(orderNumber)}`,
      { auth: 'required' },
    );
    return data;
  },

  // Public forms
  async submitContact(input: {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
    website?: string;
  }): Promise<{ received: boolean; mode: string; message?: string }> {
    const { data } = await requestApi<{ received: boolean; mode: string; message?: string }>(
      '/api/contact',
      { method: 'POST', body: input },
    );
    return data;
  },

  async subscribeNewsletter(input: {
    email: string;
    website?: string;
  }): Promise<{ subscribed: boolean; mode: string; message?: string }> {
    const { data } = await requestApi<{ subscribed: boolean; mode: string; message?: string }>(
      '/api/newsletter',
      { method: 'POST', body: input },
    );
    return data;
  },
};
