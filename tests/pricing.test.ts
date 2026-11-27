import { describe, expect, it } from 'vitest';
import { SEED_COUPONS, SEED_PRODUCTS, SEED_SHIPPING_ZONES } from '../shared/catalog-seed';
import { formatBdt, formatDiscountPercent } from '../shared/format';
import {
  calculateCouponDiscount,
  calculateLineTotals,
  calculateOrderTotals,
  calculateShippingFee,
} from '../shared/pricing';
import { bdPhoneSchema, validatePersonalizationAgainstConfig } from '../shared/schemas';

describe('formatters & phone validation', () => {
  it('formats BDT currency flush with thousands separators', () => {
    expect(formatBdt(1450)).toBe('৳1,450');
    expect(formatBdt(60)).toBe('৳60');
    expect(formatBdt(0)).toBe('৳0');
    expect(formatBdt(-50)).toBe('-৳50');
  });

  it('computes discount percentages accurately', () => {
    expect(formatDiscountPercent(890, 1050)).toBe(15);
    expect(formatDiscountPercent(200, 200)).toBeNull();
    expect(formatDiscountPercent(200, null)).toBeNull();
  });

  it('validates Bangladesh mobile numbers', () => {
    expect(bdPhoneSchema.safeParse('01712345678').success).toBe(true);
    expect(bdPhoneSchema.safeParse('+8801812345678').success).toBe(true);
    expect(bdPhoneSchema.safeParse('8801912345678').success).toBe(true);
    expect(bdPhoneSchema.safeParse('01212345678').success).toBe(false);
    expect(bdPhoneSchema.safeParse('0171234').success).toBe(false);
  });
});

describe('pricing engine (integer BDT)', () => {
  const dhaka = SEED_SHIPPING_ZONES.find((z) => z.code === 'dhaka_city')!;
  const pickup = SEED_SHIPPING_ZONES.find((z) => z.code === 'self_pickup')!;
  const bloom10 = SEED_COUPONS.find((c) => c.code === 'BLOOM10')!;
  const welcome50 = SEED_COUPONS.find((c) => c.code === 'WELCOME50')!;

  it('computes line totals with per-unit personalization fee', () => {
    const line = calculateLineTotals({
      unitPriceBdt: 890,
      personalizationFeePerUnitBdt: 120,
      hasPersonalization: true,
      quantity: 2,
    });
    expect(line.lineSubtotalBdt).toBe(1780);
    expect(line.linePersonalizationBdt).toBe(240);
    expect(line.lineTotalBdt).toBe(2020);
  });

  it('ignores personalization fee when personalization is absent', () => {
    const line = calculateLineTotals({
      unitPriceBdt: 890,
      personalizationFeePerUnitBdt: 120,
      hasPersonalization: false,
      quantity: 2,
    });
    expect(line.linePersonalizationBdt).toBe(0);
    expect(line.lineTotalBdt).toBe(1780);
  });

  it('respects coupon minimum subtotal and max discount cap', () => {
    expect(calculateCouponDiscount(400, bloom10)).toBe(0);
    expect(calculateCouponDiscount(1000, bloom10)).toBe(100);
    expect(calculateCouponDiscount(8000, bloom10)).toBe(500);
    expect(calculateCouponDiscount(400, welcome50)).toBe(50);
  });

  it('checks free Dhaka shipping on discounted subtotal >= 1500', () => {
    // 1600 - 10% (160) = 1440 -> below 1500 threshold, so 60 BDT shipping applies
    const orderBelow = calculateOrderTotals({
      lines: [
        {
          unitPriceBdt: 800,
          personalizationFeePerUnitBdt: 0,
          hasPersonalization: false,
          quantity: 2,
        },
      ],
      coupon: bloom10,
      zone: dhaka,
      giftWrap: false,
    });
    expect(orderBelow.discountedSubtotalBdt).toBe(1440);
    expect(orderBelow.freeShippingApplied).toBe(false);
    expect(orderBelow.shippingFeeBdt).toBe(60);
    expect(orderBelow.amountToFreeShippingBdt).toBe(60);
    expect(orderBelow.totalBdt).toBe(1500);

    // 1700 - 10% (170) = 1530 -> >= 1500, free Dhaka shipping unlocked
    const orderAbove = calculateOrderTotals({
      lines: [
        {
          unitPriceBdt: 850,
          personalizationFeePerUnitBdt: 0,
          hasPersonalization: false,
          quantity: 2,
        },
      ],
      coupon: bloom10,
      zone: dhaka,
      giftWrap: true,
    });
    expect(orderAbove.discountedSubtotalBdt).toBe(1530);
    expect(orderAbove.freeShippingApplied).toBe(true);
    expect(orderAbove.shippingFeeBdt).toBe(0);
    expect(orderAbove.giftWrapFeeBdt).toBe(40);
    expect(orderAbove.totalBdt).toBe(1570);
  });

  it('handles empty carts and self-pickup cleanly', () => {
    const empty = calculateOrderTotals({
      lines: [],
      coupon: bloom10,
      zone: dhaka,
      giftWrap: true,
    });
    expect(empty.totalBdt).toBe(0);
    expect(empty.giftWrapFeeBdt).toBe(0);

    const ship = calculateShippingFee(500, pickup, true);
    expect(ship.shippingFeeBdt).toBe(0);
  });
});

describe('personalization validation (English + Bangla)', () => {
  const customJournal = SEED_PRODUCTS.find((p) => p.slug === 'personalized-vegan-leather-journal')!;

  it('accepts mixed English and Bangla Unicode text', () => {
    const res = validatePersonalizationAgainstConfig(
      {
        text: 'তাসনিম · 2026',
        foilColor: 'Warm Gold',
        fontStyle: 'Classic Serif',
      },
      customJournal.personalizationConfig,
      true,
    );
    expect(res.ok).toBe(true);
  });

  it('rejects overly long text, invalid foil, or missing required text', () => {
    const missing = validatePersonalizationAgainstConfig(
      { text: '   ' },
      customJournal.personalizationConfig,
      true,
    );
    expect(missing.ok).toBe(false);

    const tooLong = validatePersonalizationAgainstConfig(
      { text: 'A very long journal personalization line exceeding limits' },
      customJournal.personalizationConfig,
      true,
    );
    expect(tooLong.ok).toBe(false);

    const badFoil = validatePersonalizationAgainstConfig(
      { text: 'Tasnim', foilColor: 'Neon Green' },
      customJournal.personalizationConfig,
      true,
    );
    expect(badFoil.ok).toBe(false);
  });
});
