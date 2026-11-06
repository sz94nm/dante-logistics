import { describe, it, expect } from 'vitest';
import {
  calculateCBM,
  calculateVolumetricWeight,
  calculateChargeableWeight,
  calculateInvoice,
} from '../../src/utils/calculations';

describe('Logistics Calculations Unit Tests', () => {
  it('correctly calculates CBM for given box dimensions', () => {
    // 50cm x 40cm x 30cm = 60,000 cm³ = 0.0600 CBM
    const cbm = calculateCBM({ length_cm: 50, width_cm: 40, height_cm: 30 });
    expect(cbm).toBe(0.06);
  });

  it('handles zero or negative dimensions safely by returning 0', () => {
    expect(calculateCBM({ length_cm: 0, width_cm: 40, height_cm: 30 })).toBe(0);
    expect(calculateCBM({ length_cm: -10, width_cm: 40, height_cm: 30 })).toBe(0);
  });

  it('correctly calculates volumetric weight with standard 5000 divisor', () => {
    // 50 x 40 x 30 / 5000 = 60000 / 5000 = 12.00 kg
    const volWeight = calculateVolumetricWeight({ length_cm: 50, width_cm: 40, height_cm: 30 });
    expect(volWeight).toBe(12.0);
  });

  it('determines chargeable weight as max of actual and volumetric weight', () => {
    // Actual 5kg, Volumetric 12kg -> Chargeable 12kg
    expect(calculateChargeableWeight(5.0, 12.0)).toBe(12.0);

    // Actual 15kg, Volumetric 12kg -> Chargeable 15kg
    expect(calculateChargeableWeight(15.0, 12.0)).toBe(15.0);
  });

  it('calculates Air freight invoice with chargeable weight and IQD rounding', () => {
    const invoice = calculateInvoice({
      shipping_type: 'air',
      weight_kg: 8.0,
      volumetric_weight_kg: 10.0, // chargeable is 10.0
      cbm: 0.05,
      rate_per_kg_usd: 8.0, // 10 * 8 = $80.00
      customs_tax_usd: 5.0,
      extra_fees_usd: 2.5,
      exchange_rate_iqd: 1520,
    });

    expect(invoice.shipping_cost_usd).toBe(80.0);
    expect(invoice.customs_tax_usd).toBe(5.0);
    expect(invoice.extra_fees_usd).toBe(2.5);
    expect(invoice.total_usd).toBe(87.5);

    // 87.5 * 1520 = 133,000 IQD (already multiple of 250)
    expect(invoice.total_iqd).toBe(133000);
  });

  it('calculates Sea freight invoice based on CBM with minimum volume rule', () => {
    const invoice = calculateInvoice({
      shipping_type: 'sea',
      weight_kg: 50.0,
      volumetric_weight_kg: 40.0,
      cbm: 0.25, // 0.25 * 200 = $50.00
      rate_per_cbm_usd: 200,
      customs_tax_usd: 10.0,
      extra_fees_usd: 0,
      exchange_rate_iqd: 1500,
    });

    expect(invoice.shipping_cost_usd).toBe(50.0);
    expect(invoice.customs_tax_usd).toBe(10.0);
    expect(invoice.total_usd).toBe(60.0);
    expect(invoice.total_iqd).toBe(90000); // 60 * 1500
  });

  it('enforces minimum CBM floor for tiny sea packages', () => {
    const invoice = calculateInvoice({
      shipping_type: 'sea',
      weight_kg: 1.0,
      volumetric_weight_kg: 1.0,
      cbm: 0.005, // Below 0.02 min CBM floor
      rate_per_cbm_usd: 250, // 0.02 * 250 = $5.00
      customs_tax_usd: 0,
      exchange_rate_iqd: 1500,
    });

    expect(invoice.shipping_cost_usd).toBe(5.0);
  });
});
