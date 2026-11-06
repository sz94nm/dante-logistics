/**
 * Logistics calculations for Air and Sea Freight.
 */

export interface Dimensions {
  length_cm: number;
  width_cm: number;
  height_cm: number;
}

/**
 * Calculates volume in Cubic Meters (CBM).
 * Formula: (L * W * H) / 1,000,000
 */
export function calculateCBM(dim: Dimensions): number {
  if (dim.length_cm <= 0 || dim.width_cm <= 0 || dim.height_cm <= 0) {
    return 0;
  }
  const cbm = (dim.length_cm * dim.width_cm * dim.height_cm) / 1_000_000;
  return Number(cbm.toFixed(4));
}

/**
 * Calculates volumetric weight for Air Freight.
 * Standard IATA divisor: 5000 (cm³/kg) or 6000. Divisor 5000 is standard international.
 */
export function calculateVolumetricWeight(dim: Dimensions, divisor: number = 5000): number {
  if (dim.length_cm <= 0 || dim.width_cm <= 0 || dim.height_cm <= 0) {
    return 0;
  }
  const volWeight = (dim.length_cm * dim.width_cm * dim.height_cm) / divisor;
  return Number(volWeight.toFixed(2));
}

/**
 * Chargeable weight is the greater of actual gross weight and volumetric weight.
 */
export function calculateChargeableWeight(actualWeightKg: number, volumetricWeightKg: number): number {
  const chargeable = Math.max(actualWeightKg, volumetricWeightKg);
  return Number(chargeable.toFixed(2));
}

export interface ShippingCostInput {
  shipping_type: 'air' | 'sea';
  weight_kg: number;
  cbm: number;
  volumetric_weight_kg: number;
  rate_per_kg_usd?: number;
  rate_per_cbm_usd?: number;
  customs_tax_usd?: number;
  extra_fees_usd?: number;
  exchange_rate_iqd: number;
}

export interface CalculatedInvoiceTotals {
  shipping_cost_usd: number;
  customs_tax_usd: number;
  extra_fees_usd: number;
  total_usd: number;
  exchange_rate_iqd: number;
  total_iqd: number;
}

/**
 * Computes complete invoice breakdown in USD and IQD.
 */
export function calculateInvoice(input: ShippingCostInput): CalculatedInvoiceTotals {
  const customs = input.customs_tax_usd || 0;
  const extra = input.extra_fees_usd || 0;
  let shippingCost = 0;

  if (input.shipping_type === 'air') {
    const ratePerKg = input.rate_per_kg_usd ?? 7.5;
    const chargeable = calculateChargeableWeight(input.weight_kg, input.volumetric_weight_kg);
    // minimum chargeable weight 0.5 kg
    const effectiveWeight = Math.max(0.5, chargeable);
    shippingCost = effectiveWeight * ratePerKg;
  } else {
    // sea freight by CBM
    const ratePerCbm = input.rate_per_cbm_usd ?? 220;
    // minimum CBM 0.02
    const effectiveCbm = Math.max(0.02, input.cbm);
    shippingCost = effectiveCbm * ratePerCbm;
  }

  const shippingCostUsd = Number(shippingCost.toFixed(2));
  const customsTaxUsd = Number(customs.toFixed(2));
  const extraFeesUsd = Number(extra.toFixed(2));
  const totalUsd = Number((shippingCostUsd + customsTaxUsd + extraFeesUsd).toFixed(2));

  // In Iraq, currency notes are usually in 250 IQD multiples
  const rawIqd = totalUsd * input.exchange_rate_iqd;
  const totalIqd = Math.round(rawIqd / 250) * 250;

  return {
    shipping_cost_usd: shippingCostUsd,
    customs_tax_usd: customsTaxUsd,
    extra_fees_usd: extraFeesUsd,
    total_usd: totalUsd,
    exchange_rate_iqd: input.exchange_rate_iqd,
    total_iqd: totalIqd,
  };
}
