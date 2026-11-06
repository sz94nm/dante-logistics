import { describe, it, expect } from 'vitest';
import {
  formatCustomerCode,
  generatePackageCode,
  generateContainerCode,
  isValidCustomerCode,
} from '../../src/utils/codeGenerator';

describe('Code Generator Unit Tests', () => {
  it('formats customer codes with IRQ prefix and 4-digit padding', () => {
    expect(formatCustomerCode(1)).toBe('IRQ-0001');
    expect(formatCustomerCode(42)).toBe('IRQ-0042');
    expect(formatCustomerCode(1050)).toBe('IRQ-1050');
    expect(formatCustomerCode(99999)).toBe('IRQ-99999');
  });

  it('throws error when non-positive integer is passed for customer code counter', () => {
    expect(() => formatCustomerCode(0)).toThrow();
    expect(() => formatCustomerCode(-5)).toThrow();
  });

  it('generates unique package codes matching PKG pattern', () => {
    const code1 = generatePackageCode();
    const code2 = generatePackageCode();

    expect(code1).toMatch(/^PKG-\d{4}-[A-F0-9]{6}$/);
    expect(code2).toMatch(/^PKG-\d{4}-[A-F0-9]{6}$/);
    expect(code1).not.toBe(code2);
  });

  it('generates container code for Air and Sea freight', () => {
    const fixedDate = new Date('2026-11-06');
    const airContainer = generateContainerCode('air', 4, fixedDate);
    const seaContainer = generateContainerCode('sea', 12, fixedDate);

    expect(airContainer).toBe('AIR-2026-004');
    expect(seaContainer).toBe('SEA-2026-012');
  });

  it('validates customer code format correctly', () => {
    expect(isValidCustomerCode('IRQ-1001')).toBe(true);
    expect(isValidCustomerCode('irq-9999')).toBe(true);
    expect(isValidCustomerCode('IRQ-100000')).toBe(true);

    expect(isValidCustomerCode('USA-1001')).toBe(false);
    expect(isValidCustomerCode('IRQ-12')).toBe(false);
    expect(isValidCustomerCode('INVALID')).toBe(false);
  });
});
