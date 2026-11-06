import { describe, it, expect } from 'vitest';
import {
  registerUserSchema,
  loginSchema,
  warehouseIntakeSchema,
  preAlertSchema,
  createContainerSchema,
} from '../../src/utils/validator';

describe('Zod Validation Schemas Unit Tests', () => {
  it('accepts valid Iraqi registration payload', () => {
    const valid = {
      full_name: 'Ahmed Al-Iraqi',
      phone: '07701234567',
      email: 'ahmed@example.com',
      password: 'SecurePassword123!',
      city: 'Baghdad',
      local_address: 'Mansour, Street 14',
      nearest_point: 'Near Mansour Mall',
      role: 'customer',
      preferred_language: 'ar',
    };

    const parsed = registerUserSchema.parse(valid);
    expect(parsed.full_name).toBe('Ahmed Al-Iraqi');
    expect(parsed.city).toBe('Baghdad');
  });

  it('rejects registration with invalid Iraqi phone number', () => {
    const invalidPhone = {
      full_name: 'Ahmed',
      phone: '12345',
      email: 'ahmed@example.com',
      password: 'SecurePassword123!',
      city: 'Baghdad',
      local_address: 'Mansour',
      nearest_point: 'Near Mall',
    };

    expect(() => registerUserSchema.parse(invalidPhone)).toThrow();
  });

  it('rejects registration with non-Iraqi city', () => {
    const invalidCity = {
      full_name: 'Ahmed',
      phone: '07701234567',
      email: 'ahmed@example.com',
      password: 'SecurePassword123!',
      city: 'Paris', // Not in Iraqi cities list
      local_address: 'Mansour',
      nearest_point: 'Near Mall',
    };

    expect(() => registerUserSchema.parse(invalidCity)).toThrow();
  });

  it('validates warehouse intake schema with customer code and positive dimensions', () => {
    const intake = {
      merchant_tracking_number: 'SF1409281048',
      customer_code: 'IRQ-1049',
      shipping_type: 'air',
      weight_kg: 4.5,
      length_cm: 30,
      width_cm: 20,
      height_cm: 15,
      package_type: 'Electronics',
      photos: ['https://example.com/photo1.jpg'],
    };

    const parsed = warehouseIntakeSchema.parse(intake);
    expect(parsed.customer_code).toBe('IRQ-1049');
    expect(parsed.weight_kg).toBe(4.5);
  });

  it('rejects warehouse intake with negative weight or invalid customer code', () => {
    expect(() =>
      warehouseIntakeSchema.parse({
        merchant_tracking_number: 'SF123',
        customer_code: 'NOT_A_CODE',
        shipping_type: 'air',
        weight_kg: -5,
        length_cm: 10,
        width_cm: 10,
        height_cm: 10,
        package_type: 'General',
      })
    ).toThrow();
  });
});
