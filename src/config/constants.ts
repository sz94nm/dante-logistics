export const IRAQI_CITIES = [
  'Baghdad',
  'Erbil',
  'Basra',
  'Sulaymaniyah',
  'Najaf',
  'Karbala',
  'Duhok',
  'Kirkuk',
  'Nineveh (Mosul)',
  'Anbar (Ramadi/Fallujah)',
  'Babil (Hillah)',
  'Diyala (Baqubah)',
  'Wasit (Kut)',
  'Maysan (Amarah)',
  'Dhi Qar (Nasiriyah)',
  'Muthanna (Samawah)',
  'Qadisiyyah (Diwaniyah)',
  'Salah al-Din (Tikrit)',
] as const;

export type IraqiCity = (typeof IRAQI_CITIES)[number];

export const USER_ROLES = ['customer', 'staff', 'manager'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const SHIPPING_TYPES = ['air', 'sea', 'hybrid'] as const;
export type ShippingType = (typeof SHIPPING_TYPES)[number];

export const PACKAGE_STATUSES = [
  'pre_alert',           // User announced incoming package
  'received_origin',     // Arrived at Guangzhou/Istanbul warehouse
  'in_container',        // Packed into container/pallet
  'in_transit',          // On vessel / flight
  'customs_processing',  // Arrived at port/airport customs
  'customs_cleared',     // Cleared customs into local warehouse
  'to_be_dispatched',    // Ready for 3rd-party delivery handover
  'out_for_delivery',    // 3rd-party courier is delivering to address
  'delivered',           // Completed handover
  'returned',            // Delivery failed/returned
] as const;
export type PackageStatus = (typeof PACKAGE_STATUSES)[number];

export const CONTAINER_STATUSES = [
  'loading',             // Open for packing packages
  'sealed',              // Finalized packing
  'in_transit',          // On ship / flight
  'customs',             // At destination customs
  'arrived_unpacked',    // Unpacked at local warehouse
] as const;
export type ContainerStatus = (typeof CONTAINER_STATUSES)[number];

export const PAYMENT_STATUSES = ['unpaid', 'down_payment', 'paid'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_METHODS = ['cash_on_delivery', 'zain_cash', 'qi_card'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
