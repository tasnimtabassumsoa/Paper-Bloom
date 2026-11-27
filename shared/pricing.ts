import { GIFT_WRAP_FEE_BDT } from './constants';
import type { CouponDTO, OrderPricingSummary, ShippingZoneDTO } from './types';

export interface PricedLineInput {
  unitPriceBdt: number;
  personalizationFeePerUnitBdt: number;
  hasPersonalization: boolean;
  quantity: number;
}

export interface LineTotals {
  lineSubtotalBdt: number;
  linePersonalizationBdt: number;
  lineTotalBdt: number;
}

export function calculateLineTotals(input: PricedLineInput): LineTotals {
  const qty = Math.max(0, Math.floor(input.quantity));
  const unit = Math.max(0, Math.round(input.unitPriceBdt));
  const pFee = input.hasPersonalization
    ? Math.max(0, Math.round(input.personalizationFeePerUnitBdt))
    : 0;

  const lineSubtotalBdt = unit * qty;
  const linePersonalizationBdt = pFee * qty;
  return {
    lineSubtotalBdt,
    linePersonalizationBdt,
    lineTotalBdt: lineSubtotalBdt + linePersonalizationBdt,
  };
}

export function calculateCouponDiscount(
  merchandiseSubtotalBdt: number,
  coupon: CouponDTO | null,
): number {
  if (!coupon || merchandiseSubtotalBdt <= 0) {
    return 0;
  }
  if (merchandiseSubtotalBdt < coupon.minSubtotalBdt) {
    return 0;
  }

  let discount = 0;
  if (coupon.percentOff && coupon.percentOff > 0) {
    discount = Math.round((merchandiseSubtotalBdt * coupon.percentOff) / 100);
  } else if (coupon.amountOffBdt && coupon.amountOffBdt > 0) {
    discount = Math.round(coupon.amountOffBdt);
  }

  if (coupon.maxDiscountBdt !== null && coupon.maxDiscountBdt > 0) {
    discount = Math.min(discount, coupon.maxDiscountBdt);
  }

  return Math.max(0, Math.min(discount, merchandiseSubtotalBdt));
}

export function calculateShippingFee(
  discountedSubtotalBdt: number,
  zone: ShippingZoneDTO | null,
  hasItems: boolean,
): { shippingFeeBdt: number; freeShippingApplied: boolean; amountToFreeShippingBdt: number | null } {
  if (!hasItems || !zone) {
    return {
      shippingFeeBdt: 0,
      freeShippingApplied: false,
      amountToFreeShippingBdt: null,
    };
  }

  if (zone.isPickup || zone.feeBdt <= 0) {
    return {
      shippingFeeBdt: 0,
      freeShippingApplied: false,
      amountToFreeShippingBdt: null,
    };
  }

  if (zone.freeOverBdt !== null && discountedSubtotalBdt >= zone.freeOverBdt) {
    return {
      shippingFeeBdt: 0,
      freeShippingApplied: true,
      amountToFreeShippingBdt: 0,
    };
  }

  const remaining =
    zone.freeOverBdt !== null ? Math.max(0, zone.freeOverBdt - discountedSubtotalBdt) : null;

  return {
    shippingFeeBdt: Math.max(0, Math.round(zone.feeBdt)),
    freeShippingApplied: false,
    amountToFreeShippingBdt: remaining,
  };
}

export function calculateOrderTotals(params: {
  lines: PricedLineInput[];
  coupon: CouponDTO | null;
  zone: ShippingZoneDTO | null;
  giftWrap: boolean;
  giftWrapFeeOverrideBdt?: number;
}): OrderPricingSummary {
  let itemsSubtotalBdt = 0;
  let personalizationTotalBdt = 0;
  let totalQty = 0;

  for (const line of params.lines) {
    const qty = Math.max(0, Math.floor(line.quantity));
    if (qty === 0) continue;
    totalQty += qty;
    const totals = calculateLineTotals(line);
    itemsSubtotalBdt += totals.lineSubtotalBdt;
    personalizationTotalBdt += totals.linePersonalizationBdt;
  }

  const merchandiseSubtotalBdt = itemsSubtotalBdt + personalizationTotalBdt;
  const discountBdt = calculateCouponDiscount(merchandiseSubtotalBdt, params.coupon);
  const discountedSubtotalBdt = Math.max(0, merchandiseSubtotalBdt - discountBdt);

  const hasItems = totalQty > 0;
  const giftWrapFee =
    hasItems && params.giftWrap
      ? Math.max(0, Math.round(params.giftWrapFeeOverrideBdt ?? GIFT_WRAP_FEE_BDT))
      : 0;

  const shipping = calculateShippingFee(discountedSubtotalBdt, params.zone, hasItems);
  const totalBdt = discountedSubtotalBdt + giftWrapFee + shipping.shippingFeeBdt;

  return {
    itemsSubtotalBdt,
    personalizationTotalBdt,
    merchandiseSubtotalBdt,
    discountBdt,
    discountedSubtotalBdt,
    giftWrapFeeBdt: giftWrapFee,
    shippingFeeBdt: shipping.shippingFeeBdt,
    totalBdt,
    freeShippingApplied: shipping.freeShippingApplied,
    amountToFreeShippingBdt: shipping.amountToFreeShippingBdt,
  };
}
