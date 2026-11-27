/**
 * Central business identity configuration for Paper Bloom.
 * NOTE: Items marked [Placeholder] must be replaced with your verified business
 * details before launching to real customers (see README -> "Replace before launch").
 */
export const SITE_CONFIG = {
  brandName: 'Paper Bloom',
  tagline: 'Thoughtful Stationery & Creative Supplies',
  city: 'Dhaka, Bangladesh',
  foundingYear: 2026, // [Placeholder] Update with your actual launch year

  // [Placeholder] Replace with your verified studio/pickup address, phone, and email
  contact: {
    email: 'hello@paperbloom.example',
    phone: '+880 1700-000000',
    pickupAddress: 'Dhaka Collection Point (exact address confirmed upon pickup booking)',
    hours: 'Saturday – Thursday, 10:00 AM – 7:00 PM (Asia/Dhaka)',
  },

  // [Placeholder] Replace with your real store social links (leave empty string to hide)
  socials: {
    instagram: 'https://instagram.com',
    facebook: 'https://facebook.com',
  },

  announcement: {
    text: 'Free delivery inside Dhaka City on orders of ৳1,500 or more',
    secondaryText: 'Cash on Delivery across 64 districts · Custom English & Bangla foil',
  },

  pricing: {
    freeDhakaOverBdt: 1500,
    giftWrapFeeBdt: 40,
  },

  demoNotice:
    'Demo store: placing an order creates a demonstration order. No payment is taken and no goods will be shipped.',
  demoPreviewBanner:
    'DEMO PREVIEW — sample data only. Not connected to a database. Carts, wishlists and orders are stored in this browser only and are not real.',
} as const;
