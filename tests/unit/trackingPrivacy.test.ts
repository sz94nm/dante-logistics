import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { initializeSchema } from '../../src/database/schema';
import { PackageService } from '../../src/services/packageService';
import { TrackingService } from '../../src/services/trackingService';
import { AuthService } from '../../src/services/authService';

describe('Tracking Privacy and Scrubbing Unit Tests', () => {
  let db: Database.Database;
  let authService: AuthService;
  let packageService: PackageService;
  let trackingService: TrackingService;

  beforeEach(async () => {
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    initializeSchema(db);

    authService = new AuthService(db);
    packageService = new PackageService(db);
    trackingService = new TrackingService(db);
  });

  afterEach(() => {
    db.close();
  });

  it('guarantees container_id is scrubbed when customer views packages', async () => {
    const { user } = await authService.register({
      full_name: 'Zaid Ali',
      phone: '07801234567',
      email: 'zaid@example.com',
      password: 'Password123!',
      city: 'Basra',
      local_address: 'Ashar',
      nearest_point: 'Bridge',
    });

    // Create a dummy container
    db.prepare(`
      INSERT INTO containers (id, container_number, shipping_type, status, created_at, updated_at)
      VALUES ('c-123', 'SEA-2026-999', 'sea', 'loading', datetime('now'), datetime('now'))
    `).run();

    // Intake package directly linked to that container
    const { package: pkg } = packageService.warehouseIntake({
      merchant_tracking_number: 'TEST-TRACK-99',
      customer_code: user.personal_code,
      shipping_type: 'sea',
      weight_kg: 10,
      length_cm: 20,
      width_cm: 20,
      height_cm: 20,
      package_type: 'Books',
      container_id: 'c-123',
    });

    expect(pkg.container_id).toBe('c-123'); // Staff/internal object has container_id

    // Customer query
    const customerPackages = packageService.getCustomerPackages(user.id);
    expect(customerPackages.length).toBe(1);
    expect(customerPackages[0].container_id).toBeNull(); // Redacted for customer privacy!
  });

  it('filters out internal-only tracking milestones from customer timeline', async () => {
    const { user } = await authService.register({
      full_name: 'Karim',
      phone: '07901234567',
      email: 'karim@example.com',
      password: 'Password123!',
      city: 'Erbil',
      local_address: 'Ankawa',
      nearest_point: 'Church',
    });

    const { package: pkg } = packageService.warehouseIntake({
      merchant_tracking_number: 'TRACK-PRIVACY',
      customer_code: user.personal_code,
      shipping_type: 'air',
      weight_kg: 2,
      length_cm: 10,
      width_cm: 10,
      height_cm: 10,
      package_type: 'Clothes',
    });

    // Add public event
    packageService.addTrackingEvent(pkg.id, 'in_transit', 'Departed Origin', 'غادرت المنشأ', 'Airport', false);

    // Add internal-only event (e.g. customs inspection fee hold or container seal number)
    packageService.addTrackingEvent(
      pkg.id,
      'customs_processing',
      'Internal note: Container #SEA-88 Customs Bond pending',
      'ملاحظة داخلية: تأمين الحاوية معلق',
      'Internal Ops',
      true // isInternalOnly
    );

    // Customer timeline
    const customerTimeline = trackingService.getPackageTimeline(pkg.id, true);
    const internalEventsInCustomerView = customerTimeline.events.filter((e) => e.is_internal_only);
    expect(internalEventsInCustomerView.length).toBe(0);

    // Manager / Staff timeline
    const staffTimeline = trackingService.getPackageTimeline(pkg.id, false);
    const internalEventsInStaffView = staffTimeline.events.filter((e) => e.is_internal_only);
    expect(internalEventsInStaffView.length).toBe(1);
  });
});
