import { z } from 'zod';
import {
  BD_DISTRICTS,
  BD_PHONE_REGEX,
  PAYMENT_METHODS,
  PRODUCT_TYPES,
  SORT_OPTIONS,
} from './constants';
import type { PersonalizationConfig, PersonalizationInput } from './types';

export const bdPhoneSchema = z
  .string()
  .trim()
  .regex(BD_PHONE_REGEX, 'Enter a valid Bangladesh mobile number (e.g. 01712345678)');

export const personalizationInputSchema = z.object({
  text: z.string().trim().min(1, 'Personalization text is required').max(60),
  foilColor: z.string().trim().max(40).optional(),
  fontStyle: z.string().trim().max(40).optional(),
  note: z.string().trim().max(200).optional(),
});

export function validatePersonalizationAgainstConfig(
  input: PersonalizationInput | null | undefined,
  config: PersonalizationConfig | null,
  isRequired: boolean,
): { ok: true; value: PersonalizationInput | null } | { ok: false; message: string } {
  if (!input || !input.text.trim()) {
    if (isRequired && config?.enabled) {
      return { ok: false, message: `${config.label || 'Personalization text'} is required.` };
    }
    return { ok: true, value: null };
  }

  if (!config || !config.enabled) {
    return { ok: false, message: 'This item does not support personalization.' };
  }

  const trimmedText = input.text.trim();
  const textChars = Array.from(trimmedText);
  if (textChars.length > config.maxChars) {
    return {
      ok: false,
      message: `Personalization text must be ${config.maxChars} characters or fewer.`,
    };
  }

  // Allow Latin, Bengali block (\u0980-\u09FF), digits, spaces, and common punctuation.
  const hasBengali = /[\u0980-\u09FF]/.test(trimmedText);
  if (hasBengali && !config.supportsBangla) {
    return { ok: false, message: 'This item only supports English characters.' };
  }

  const allowedPattern = /^[\p{L}\p{N}\p{M}\s.,'"&!?()\-/+:·।\u2014]+$/u;
  if (!allowedPattern.test(trimmedText)) {
    return { ok: false, message: 'Please avoid unsupported symbols or emojis in engraving text.' };
  }

  const foilColor = input.foilColor?.trim() || config.foilColors[0];
  if (config.foilColors.length > 0 && foilColor && !config.foilColors.includes(foilColor)) {
    return { ok: false, message: 'Selected foil or ink finish is not available for this item.' };
  }

  const fontStyle = input.fontStyle?.trim() || config.fontStyles[0];
  if (config.fontStyles.length > 0 && fontStyle && !config.fontStyles.includes(fontStyle)) {
    return { ok: false, message: 'Selected typography style is not available for this item.' };
  }

  const note = input.note?.trim() ?? '';
  if (note && !config.allowNote) {
    return { ok: false, message: 'Additional studio notes are not enabled for this item.' };
  }
  if (Array.from(note).length > config.noteMaxChars) {
    return {
      ok: false,
      message: `Studio note must be ${config.noteMaxChars} characters or fewer.`,
    };
  }

  return {
    ok: true,
    value: {
      text: trimmedText,
      foilColor,
      fontStyle,
      ...(note ? { note } : {}),
    },
  };
}

export function hashPersonalization(input: PersonalizationInput | null): string {
  if (!input || !input.text.trim()) return 'none';
  return [
    input.text.trim(),
    input.foilColor?.trim() ?? '',
    input.fontStyle?.trim() ?? '',
    input.note?.trim() ?? '',
  ].join('|');
}

export const addCartItemSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid(),
  quantity: z.number().int().min(1).max(20),
  personalization: personalizationInputSchema.nullable().optional(),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1).max(20).optional(),
  personalization: personalizationInputSchema.nullable().optional(),
});

export const applyCouponSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, 'Enter a coupon code')
    .max(32)
    .transform((v) => v.toUpperCase()),
});

export const addressSchema = z.object({
  label: z.string().trim().min(1, 'Label is required').max(40),
  recipientName: z.string().trim().min(2, 'Recipient name is required').max(100),
  phone: bdPhoneSchema,
  zoneCode: z.string().trim().min(2, 'Delivery zone is required').max(40),
  district: z.enum(BD_DISTRICTS, {
    message: 'Select a valid Bangladesh district',
  }),
  thana: z.string().trim().min(2, 'Area / Thana is required').max(80),
  addressLine: z.string().trim().min(5, 'Full street/house address is required').max(250),
  landmark: z.string().trim().max(120),
  postalCode: z
    .string()
    .trim()
    .regex(/^(?:\d{4})?$/, 'Postal code must be 4 digits'),
  isDefault: z.boolean(),
});

export const checkoutQuoteSchema = z.object({
  zoneCode: z.string().trim().min(2).max(40),
  couponCode: z.string().trim().max(32).nullable().optional(),
  giftWrap: z.boolean(),
});

export const placeOrderSchema = z.object({
  customerName: z.string().trim().min(2, 'Full name is required').max(100),
  customerPhone: bdPhoneSchema,
  customerEmail: z
    .string()
    .trim()
    .email('Enter a valid email address')
    .max(120)
    .optional()
    .or(z.literal('')),
  zoneCode: z.string().trim().min(2, 'Select a delivery zone').max(40),
  district: z.enum(BD_DISTRICTS, {
    message: 'Select a valid district',
  }),
  thana: z.string().trim().min(2, 'Area or Thana is required').max(80),
  addressLine: z.string().trim().min(5, 'House, road, and flat details are required').max(250),
  landmark: z.string().trim().max(120),
  postalCode: z
    .string()
    .trim()
    .regex(/^(?:\d{4})?$/, 'Postal code must be 4 digits'),
  paymentMethod: z.enum(PAYMENT_METHODS),
  couponCode: z.string().trim().max(32).nullable().optional(),
  giftWrap: z.boolean(),
  giftMessage: z.string().trim().max(200),
  customerNote: z.string().trim().max(300),
  acceptedDemoTerms: z.boolean().refine((v) => v === true, {
    message: 'Please acknowledge the demo store terms before placing your order',
  }),
});

export const profileUpdateSchema = z.object({
  fullName: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  phone: bdPhoneSchema.or(z.literal('')),
});

export const contactFormSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(100),
  email: z.string().trim().email('Valid email is required').max(120),
  phone: bdPhoneSchema.or(z.literal('')),
  subject: z.string().trim().min(3, 'Subject is required').max(150),
  message: z.string().trim().min(10, 'Please enter at least 10 characters').max(2000),
  website: z.string().max(100), // honeypot
});

export const newsletterSchema = z.object({
  email: z.string().trim().email('Enter a valid email address').max(120),
  website: z.string().max(100).optional().default(''), // honeypot
});

export const productQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  category: z.string().trim().max(80).optional(),
  type: z.enum(PRODUCT_TYPES).optional(),
  minPrice: z.coerce.number().int().min(0).max(100000).optional(),
  maxPrice: z.coerce.number().int().min(0).max(100000).optional(),
  customizable: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  inStock: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  tag: z.string().trim().max(50).optional(),
  sort: z.enum(SORT_OPTIONS).optional().default('featured'),
  page: z.coerce.number().int().min(1).max(200).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(60).optional().default(12),
});
