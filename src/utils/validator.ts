import { z } from 'zod';
import {
  IRAQI_CITIES,
  IraqiCity,
  USER_ROLES,
  SHIPPING_TYPES,
  PACKAGE_STATUSES,
  CONTAINER_STATUSES,
  PAYMENT_STATUSES,
  PAYMENT_METHODS,
} from '../config/constants';

// Phone regex allowing Iraqi and international numbers (+964 or 07xx)
const phoneRegex = /^(\+964|0)?7[3-9]\d{8}$/;

export const registerUserSchema = z.object({
  full_name: z.string().trim().min(3, 'Full name must be at least 3 characters').max(100),
  phone: z.string().trim().regex(phoneRegex, 'Invalid Iraqi phone number format (e.g. 07701234567 or +9647701234567)'),
  email: z.string().trim().email('Invalid email address').max(120),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  city: z.enum(IRAQI_CITIES as unknown as [string, ...string[]]) as z.ZodType<IraqiCity>,
  local_address: z.string().trim().min(3, 'Address must be at least 3 characters').max(200),
  nearest_point: z.string().trim().min(2, 'Nearest landmark is required').max(150),
  role: z.enum(USER_ROLES).optional().default('customer'),
  preferred_language: z.enum(['ar', 'en']).optional().default('ar'),
});

export const loginSchema = z.object({
  identifier: z.string().trim().min(3, 'Phone, email, or personal code is required'),
  password: z.string().min(1, 'Password is required'),
});

export const preAlertSchema = z.object({
  merchant_tracking_number: z.string().trim().min(3, 'Merchant tracking number is required').max(100),
  shipping_type: z.enum(['air', 'sea']),
  package_type: z.string().trim().max(100).optional().default('General Goods'),
  notes: z.string().trim().max(500).optional(),
});

export const warehouseIntakeSchema = z.object({
  merchant_tracking_number: z.string().trim().min(3, 'Tracking number required'),
  customer_code: z.string().trim().regex(/^IRQ-\d{4,6}$/i, 'Customer code must be like IRQ-1001'),
  shipping_type: z.enum(['air', 'sea']),
  weight_kg: z.number().positive('Weight must be positive').max(5000),
  length_cm: z.number().positive('Length must be positive').max(500),
  width_cm: z.number().positive('Width must be positive').max(500),
  height_cm: z.number().positive('Height must be positive').max(500),
  package_type: z.string().trim().min(1).max(100).default('General Goods'),
  photos: z.array(z.string()).optional().default([]),
  container_id: z.string().optional().nullable(),
});

export const createContainerSchema = z.object({
  shipping_type: z.enum(['air', 'sea']),
  cost_per_container_usd: z.number().nonnegative().default(0),
  cost_per_cbm_usd: z.number().nonnegative().default(0),
  cost_per_kg_usd: z.number().nonnegative().default(0),
  customs_tax_usd: z.number().nonnegative().default(0),
  max_cbm: z.number().positive().default(68),
  max_weight_kg: z.number().positive().default(25000),
  etd: z.string().nullable().optional(),
  eta: z.string().nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

export const updateContainerSchema = createContainerSchema.partial().extend({
  status: z.enum(CONTAINER_STATUSES).optional(),
});

export const updateExchangeRateSchema = z.object({
  exchange_rate_iqd: z.number().positive('Exchange rate must be positive'),
});

export const updateInvoicePaymentSchema = z.object({
  payment_method: z.enum(PAYMENT_METHODS),
  payment_status: z.enum(PAYMENT_STATUSES),
  amount_paid_usd: z.number().nonnegative(),
});

export const updateDeliveryStatusSchema = z.object({
  status: z.enum(['to_be_dispatched', 'out_for_delivery', 'delivered', 'returned']),
  third_party_courier_name: z.string().trim().max(100).optional().nullable(),
  third_party_tracking_number: z.string().trim().max(100).optional().nullable(),
});
