export const BD_PHONE_REGEX = /^(?:\+?88)?01[3-9]\d{8}$/;

export const GIFT_WRAP_FEE_BDT = 40;

export const FREE_DHAKA_DELIVERY_THRESHOLD_BDT = 1500;

export const BD_DISTRICTS = [
  'Bagerhat',
  'Bandarban',
  'Barguna',
  'Barishal',
  'Bhola',
  'Bogura',
  'Brahmanbaria',
  'Chandpur',
  'Chapainawabganj',
  'Chattogram',
  'Chuadanga',
  'Cox\'s Bazar',
  'Cumilla',
  'Dhaka',
  'Dinajpur',
  'Faridpur',
  'Feni',
  'Gaibandha',
  'Gazipur',
  'Gopalganj',
  'Habiganj',
  'Jamalpur',
  'Jashore',
  'Jhalokati',
  'Jhenaidah',
  'Joypurhat',
  'Khagrachhari',
  'Khulna',
  'Kishoreganj',
  'Kurigram',
  'Kushtia',
  'Lakshmipur',
  'Lalmonirhat',
  'Madaripur',
  'Magura',
  'Manikganj',
  'Meherpur',
  'Moulvibazar',
  'Munshiganj',
  'Mymensingh',
  'Naogaon',
  'Narail',
  'Narayanganj',
  'Narsingdi',
  'Natore',
  'Netrokona',
  'Nilphamari',
  'Noakhali',
  'Pabna',
  'Panchagarh',
  'Patuakhali',
  'Pirojpur',
  'Rajbari',
  'Rajshahi',
  'Rangamati',
  'Rangpur',
  'Satkhira',
  'Shariatpur',
  'Sherpur',
  'Sirajganj',
  'Sunamganj',
  'Sylhet',
  'Tangail',
  'Thakurgaon',
] as const;

export type BdDistrict = (typeof BD_DISTRICTS)[number];

export const PRODUCT_TYPES = ['ready', 'customizable', 'bundle'] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];

export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_METHODS = ['cod', 'pickup'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const SORT_OPTIONS = [
  'featured',
  'popular',
  'newest',
  'price_asc',
  'price_desc',
] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];
