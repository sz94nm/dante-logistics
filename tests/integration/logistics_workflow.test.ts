import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import Database from 'better-sqlite3';
import { initializeSchema } from '../../src/database/schema';
import { AuthService } from '../../src/services/authService';
import { createApp } from '../../src/app';

describe('Complete Logistics Lifecycle Integration Tests', () => {
  let db: Database.Database;
  let app: any;
  let authService: AuthService;

  let customerToken: string;
  let customerCode: string;
  let staffToken: string;
  let managerToken: string;

  beforeEach(async () => {
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    initializeSchema(db);

    authService = new AuthService(db);
    await authService.seedDefaultAccounts();

    app = createApp(db);

    // Login default staff
    const staffLogin = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'staff@dante.com', password: 'Staff@2026!' });
    staffToken = staffLogin.body.token;

    // Login default manager
    const managerLogin = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'manager@dante.com', password: 'Admin@2026!' });
    managerToken = managerLogin.body.token;

    // Register test customer in Basra
    const custReg = await request(app)
      .post('/api/auth/register')
      .send({
        full_name: 'Hayder Al-Basrawi',
        phone: '07801122334',
        email: 'hayder@example.com',
        password: 'Password123!',
        city: 'Basra',
        local_address: 'Al-Jazair Street',
        nearest_point: 'Near Basra Sports City',
      });
    customerToken = custReg.body.token;
    customerCode = custReg.body.user.personal_code;
  });

  afterEach(() => {
    db.close();
  });

  it('runs complete lifecycle from pre-alert to container shipping, customs, and final delivery', async () => {
    // 1. Customer creates Pre-alert
    const preAlertRes = await request(app)
      .post('/api/packages/pre-alert')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        merchant_tracking_number: 'SF987654321CN',
        shipping_type: 'sea',
        package_type: 'Home Appliance',
      });

    expect(preAlertRes.status).toBe(201);
    const internalTrackingCode = preAlertRes.body.package.internal_tracking_code;
    const packageId = preAlertRes.body.package.id;
    expect(preAlertRes.body.package.status).toBe('pre_alert');

    // 2. Warehouse staff intakes package (measures, weighs, photos)
    const intakeRes = await request(app)
      .post('/api/packages/intake')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        merchant_tracking_number: 'SF987654321CN',
        customer_code: customerCode,
        shipping_type: 'sea',
        weight_kg: 35.0,
        length_cm: 60,
        width_cm: 50,
        height_cm: 40, // 0.12 CBM
        package_type: 'Home Appliance',
        photos: ['https://example.com/box1.jpg'],
      });

    expect(intakeRes.status).toBe(201);
    expect(intakeRes.body.package.cbm).toBe(0.12);
    expect(intakeRes.body.package.status).toBe('received_origin');

    // 3. Customer checks their package list (verifying container_id is hidden/null)
    const myPackagesRes = await request(app)
      .get('/api/packages/my')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(myPackagesRes.status).toBe(200);
    expect(myPackagesRes.body.packages.length).toBe(1);
    expect(myPackagesRes.body.packages[0].container_id).toBeNull(); // Privacy guaranteed

    // 4. Verify Invoice was automatically generated in USD and converted to IQD
    const invoiceRes = await request(app)
      .get(`/api/invoices/package/${packageId}`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(invoiceRes.status).toBe(200);
    expect(invoiceRes.body.invoice.total_usd).toBeGreaterThan(0);
    expect(invoiceRes.body.invoice.total_iqd).toBeGreaterThan(0);
    expect(invoiceRes.body.invoice.payment_status).toBe('unpaid');

    // 5. Manager creates a Sea Container
    const createContainerRes = await request(app)
      .post('/api/containers')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        shipping_type: 'sea',
        cost_per_cbm_usd: 220,
        max_cbm: 68,
        etd: '2026-11-15',
        eta: '2026-12-10',
        notes: 'Voyage 402 - Guangzhou to Umm Qasr Port',
      });

    expect(createContainerRes.status).toBe(201);
    const containerId = createContainerRes.body.container.id;
    const containerNumber = createContainerRes.body.container.container_number;
    expect(containerNumber).toMatch(/^SEA-\d{4}-\d{3}$/);

    // 6. Staff assigns package to Container
    const assignRes = await request(app)
      .post(`/api/containers/${containerId}/assign`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ package_ids: [packageId] });

    expect(assignRes.status).toBe(200);

    // 7. Manager departs container (in_transit)
    const departRes = await request(app)
      .patch(`/api/containers/${containerId}`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ status: 'in_transit' });

    expect(departRes.status).toBe(200);

    // Verify package cascaded to in_transit
    const pkgCheck1 = await request(app)
      .get(`/api/packages/${packageId}`)
      .set('Authorization', `Bearer ${staffToken}`);
    expect(pkgCheck1.body.package.status).toBe('in_transit');

    // 8. Container arrives at destination customs -> unpacked
    await request(app)
      .patch(`/api/containers/${containerId}`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ status: 'arrived_unpacked' });

    // Verify package cascaded to to_be_dispatched
    const pkgCheck2 = await request(app)
      .get(`/api/packages/${packageId}`)
      .set('Authorization', `Bearer ${staffToken}`);
    expect(pkgCheck2.body.package.status).toBe('to_be_dispatched');

    // 9. Local 3rd-party delivery manifest grouped by Iraqi City (Basra)
    const manifestRes = await request(app)
      .get('/api/delivery/manifest')
      .set('Authorization', `Bearer ${managerToken}`);

    expect(manifestRes.status).toBe(200);
    expect(manifestRes.body.manifest['Basra']).toBeDefined();
    expect(manifestRes.body.manifest['Basra'][0].customer_name).toBe('Hayder Al-Basrawi');
    expect(manifestRes.body.manifest['Basra'][0].nearest_point).toBe('Near Basra Sports City');

    // 10. Update delivery to out_for_delivery with local 3rd-party courier
    const outRes = await request(app)
      .patch(`/api/delivery/${packageId}/status`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        status: 'out_for_delivery',
        third_party_courier_name: 'Wasel Logistics Iraq',
        third_party_tracking_number: 'WAS-88310',
      });
    expect(outRes.status).toBe(200);

    // 11. Courier delivers package -> marked delivered and invoice marked paid
    const deliveredRes = await request(app)
      .patch(`/api/delivery/${packageId}/status`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        status: 'delivered',
      });
    expect(deliveredRes.status).toBe(200);

    // Check invoice is now marked paid
    const finalInvoiceRes = await request(app)
      .get(`/api/invoices/package/${packageId}`)
      .set('Authorization', `Bearer ${customerToken}`);
    expect(finalInvoiceRes.body.invoice.payment_status).toBe('paid');

    // Check customer tracking timeline
    const trackingRes = await request(app)
      .get(`/api/tracking/${internalTrackingCode}`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(trackingRes.status).toBe(200);
    expect(trackingRes.body.events.length).toBeGreaterThanOrEqual(4);
    const lastEvent = trackingRes.body.events[trackingRes.body.events.length - 1];
    expect(lastEvent.status).toBe('delivered');
  });

  it('allows manager to edit container financials like tax, transit cost, CBM rate, dates and notes', async () => {
    // 1. Create initial container
    const createRes = await request(app)
      .post('/api/containers')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        shipping_type: 'sea',
        cost_per_container_usd: 4500,
        cost_per_cbm_usd: 210,
        customs_tax_usd: 600,
        max_cbm: 68,
        etd: '2026-11-20',
        eta: '2026-12-15',
        notes: 'Initial Vessel A',
      });

    const containerId = createRes.body.container.id;

    // 2. Manager edits container financials, tax, transit cost, and dates
    const editRes = await request(app)
      .patch(`/api/containers/${containerId}`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        cost_per_container_usd: 5200,
        cost_per_cbm_usd: 240,
        cost_per_kg_usd: 0,
        customs_tax_usd: 850,
        max_cbm: 72,
        etd: '2026-11-25',
        eta: '2026-12-22',
        notes: 'Updated to Evergreen Marine Express Voyage 809',
      });

    expect(editRes.status).toBe(200);
    expect(editRes.body.container.cost_per_container_usd).toBe(5200);
    expect(editRes.body.container.cost_per_cbm_usd).toBe(240);
    expect(editRes.body.container.customs_tax_usd).toBe(850);
    expect(editRes.body.container.max_cbm).toBe(72);
    expect(editRes.body.container.etd).toBe('2026-11-25');
    expect(editRes.body.container.eta).toBe('2026-12-22');
    expect(editRes.body.container.notes).toBe('Updated to Evergreen Marine Express Voyage 809');

    // 3. Fetch container by ID to ensure persistence and stats
    const fetchRes = await request(app)
      .get(`/api/containers/${containerId}`)
      .set('Authorization', `Bearer ${managerToken}`);

    expect(fetchRes.status).toBe(200);
    expect(fetchRes.body.container.cost_per_container_usd).toBe(5200);
    expect(fetchRes.body.container.customs_tax_usd).toBe(850);
    expect(fetchRes.body.container.packages).toBeDefined();
  });
});
