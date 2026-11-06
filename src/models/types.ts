import {
  IraqiCity,
  UserRole,
  ShippingType,
  PackageStatus,
  ContainerStatus,
  PaymentStatus,
  PaymentMethod,
} from '../config/constants';

export {
  IraqiCity,
  UserRole,
  ShippingType,
  PackageStatus,
  ContainerStatus,
  PaymentStatus,
  PaymentMethod,
};

export interface User {
  id: string;
  personal_code: string; // e.g. "IRQ-1042"
  full_name: string;
  phone: string;
  email: string;
  password_hash: string;
  city: IraqiCity;
  local_address: string;
  nearest_point: string;
  role: UserRole;
  preferred_language: 'ar' | 'en';
  created_at: string;
  updated_at: string;
}

export interface UserPublicProfile {
  id: string;
  personal_code: string;
  full_name: string;
  phone: string;
  email: string;
  city: IraqiCity;
  local_address: string;
  nearest_point: string;
  role: UserRole;
  preferred_language: 'ar' | 'en';
  created_at: string;
}

export interface Container {
  id: string;
  container_number: string; // e.g. "SEA-2026-001" or "AIR-2026-004"
  shipping_type: 'air' | 'sea';
  cost_per_container_usd: number;
  cost_per_cbm_usd: number;
  cost_per_kg_usd: number;
  customs_tax_usd: number;
  max_cbm: number;
  max_weight_kg: number;
  status: ContainerStatus;
  etd: string | null; // Estimated Departure
  eta: string | null; // Estimated Arrival
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Package {
  id: string;
  internal_tracking_code: string; // e.g. "PKG-982104"
  merchant_tracking_number: string; // From Chinese/merchant carrier, e.g. SF Express / FedEx
  user_id: string;
  container_id: string | null;
  shipping_type: 'air' | 'sea';
  weight_kg: number;
  length_cm: number;
  width_cm: number;
  height_cm: number;
  cbm: number;
  volumetric_weight_kg: number;
  chargeable_weight_kg: number;
  package_type: string; // "Electronics", "Clothes", etc.
  photos: string[]; // URLs or base64 / paths
  status: PackageStatus;
  third_party_courier_name: string | null;
  third_party_tracking_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  package_id: string;
  user_id: string;
  shipping_cost_usd: number;
  customs_tax_usd: number;
  extra_fees_usd: number;
  total_usd: number;
  exchange_rate_iqd: number;
  total_iqd: number;
  amount_paid_usd: number;
  amount_paid_iqd: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  created_at: string;
  updated_at: string;
}

export interface TrackingEvent {
  id: string;
  package_id: string;
  status: PackageStatus;
  title_en: string;
  title_ar: string;
  location: string;
  is_internal_only: boolean; // Hidden from customer if true
  timestamp: string;
}

export interface WarehouseInfo {
  id: string;
  name: string;
  address_en: string;
  address_zh: string;
  phone: string;
  instructions_en: string;
  instructions_zh: string;
}
