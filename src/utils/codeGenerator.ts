import crypto from 'crypto';

/**
 * Generates formatted, collision-resistant codes for customers, packages, and containers.
 */

/**
 * Generates an easy-to-read customer mailbox code like 'IRQ-1024' or 'IRQ-8951'.
 */
export function formatCustomerCode(counterNumber: number, prefix: string = 'IRQ'): string {
  if (counterNumber <= 0) {
    throw new Error('Counter number must be a positive integer');
  }
  const padded = counterNumber.toString().padStart(4, '0');
  return `${prefix}-${padded}`;
}

/**
 * Generates an internal package tracking code like 'PKG-2611-AB3F9'.
 */
export function generatePackageCode(date: Date = new Date()): string {
  const yy = date.getFullYear().toString().slice(-2);
  const mm = (date.getMonth() + 1).toString().padStart(2, '0');
  const randHex = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 chars
  return `PKG-${yy}${mm}-${randHex}`;
}

/**
 * Generates a container code like 'SEA-2026-004' or 'AIR-2026-012'.
 */
export function generateContainerCode(type: 'air' | 'sea', sequenceNumber: number, date: Date = new Date()): string {
  const year = date.getFullYear();
  const prefix = type === 'air' ? 'AIR' : 'SEA';
  const padded = sequenceNumber.toString().padStart(3, '0');
  return `${prefix}-${year}-${padded}`;
}

/**
 * Validates a customer code format (e.g. IRQ-1001 to IRQ-99999).
 */
export function isValidCustomerCode(code: string): boolean {
  return /^IRQ-\d{4,6}$/i.test(code.trim());
}
