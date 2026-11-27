import type { OrderStatus, PaymentMethod, ProductType } from './constants';

export interface PersonalizationConfig {
  enabled: boolean;
  label: string;
  placeholder: string;
  maxChars: number;
  supportsBangla: boolean;
  foilColors: string[];
  fontStyles: string[];
  allowNote: boolean;
  noteMaxChars: number;
  leadTimeText: string;
}

export interface PersonalizationInput {
  text: string;
  foilColor?: string;
  fontStyle?: string;
  note?: string;
}

export interface CategoryDTO {
  id: string;
  slug: string;
  name: string;
  description: string;
  parentId: string | null;
  image: string;
  sortOrder: number;
  productCount?: number;
  minPriceBdt?: number | null;
  children?: CategoryDTO[];
}

export interface ProductImageDTO {
  id: string;
  url: string;
  altText: string;
  sortOrder: number;
  isPrimary: boolean;
}

export interface ProductVariantDTO {
  id: string;
  sku: string;
  name: string;
  options: Record<string, string>;
  priceOverrideBdt: number | null;
  stockQty: number;
  isActive: boolean;
}

export interface ProductDTO {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  parentCategorySlug?: string;
  parentCategoryName?: string;
  productType: ProductType;
  basePriceBdt: number;
  compareAtPriceBdt: number | null;
  badge: string | null;
  isCustomizable: boolean;
  personalizationFeeBdt: number;
  personalizationConfig: PersonalizationConfig | null;
  tags: string[];
  specs: Record<string, string>;
  popularityScore: number;
  isFeatured: boolean;
  isActive: boolean;
  inStock: boolean;
  totalStock: number;
  images: ProductImageDTO[];
  variants: ProductVariantDTO[];
  createdAt: string;
}

export interface ShippingZoneDTO {
  code: string;
  name: string;
  feeBdt: number;
  freeOverBdt: number | null;
  etaText: string;
  isPickup: boolean;
}

export interface CouponDTO {
  code: string;
  description: string;
  percentOff: number | null;
  amountOffBdt: number | null;
  minSubtotalBdt: number;
  maxDiscountBdt: number | null;
}

export interface CartItemWarning {
  type: 'out_of_stock' | 'low_stock' | 'price_changed';
  message: string;
}

export interface CartItemDTO {
  id: string;
  productId: string;
  productSlug: string;
  productName: string;
  variantId: string;
  variantName: string;
  sku: string;
  imageUrl: string;
  imageAlt: string;
  unitPriceBdt: number;
  personalizationFeePerUnitBdt: number;
  personalization: PersonalizationInput | null;
  quantity: number;
  lineSubtotalBdt: number;
  linePersonalizationBdt: number;
  lineTotalBdt: number;
  stockQty: number;
  warnings: CartItemWarning[];
}

export interface OrderPricingSummary {
  itemsSubtotalBdt: number;
  personalizationTotalBdt: number;
  merchandiseSubtotalBdt: number;
  discountBdt: number;
  discountedSubtotalBdt: number;
  giftWrapFeeBdt: number;
  shippingFeeBdt: number;
  totalBdt: number;
  freeShippingApplied: boolean;
  amountToFreeShippingBdt: number | null;
}

export interface CartDTO {
  id: string;
  items: CartItemDTO[];
  itemCount: number;
  couponCode: string | null;
  couponDescription: string | null;
  zoneCode: string;
  giftWrap: boolean;
  pricing: OrderPricingSummary;
  warnings: string[];
}

export interface WishlistItemDTO {
  id: string;
  productId: string;
  createdAt: string;
  product: ProductDTO;
}

export interface ProfileDTO {
  id: string;
  email: string | null;
  fullName: string;
  phone: string;
  isGuest: boolean;
  createdAt: string;
}

export interface AddressDTO {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  zoneCode: string;
  district: string;
  thana: string;
  addressLine: string;
  landmark: string;
  postalCode: string;
  isDefault: boolean;
}

export interface OrderItemDTO {
  id: string;
  productId: string | null;
  productSlug: string | null;
  name: string;
  variantName: string;
  sku: string;
  imageUrl: string;
  unitPriceBdt: number;
  personalizationFeeBdt: number;
  personalization: PersonalizationInput | null;
  quantity: number;
  lineTotalBdt: number;
}

export interface OrderDTO {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: 'unpaid';
  isDemo: boolean;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  shippingAddress: {
    zoneCode: string;
    zoneName: string;
    district: string;
    thana: string;
    addressLine: string;
    landmark?: string;
    postalCode?: string;
  };
  subtotalBdt: number;
  personalizationFeesBdt: number;
  discountBdt: number;
  couponCode: string | null;
  giftWrap: boolean;
  giftWrapFeeBdt: number;
  giftMessage: string | null;
  shippingFeeBdt: number;
  totalBdt: number;
  customerNote: string | null;
  etaText: string;
  items: OrderItemDTO[];
  createdAt: string;
}

export interface HealthDTO {
  api: boolean;
  mode: 'connected' | 'demo';
  supabaseConfigured: boolean;
  dbReachable: boolean;
  timestamp: string;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export interface ApiMeta {
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
}

export type ApiResponse<T> =
  | {
      ok: true;
      data: T;
      meta?: ApiMeta;
    }
  | {
      ok: false;
      error: {
        code: string;
        message: string;
        details?: ApiErrorDetail[];
      };
    };
