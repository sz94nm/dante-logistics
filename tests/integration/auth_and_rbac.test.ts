import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import Database from 'better-sqlite3';
import { initializeSchema } from '../../src/database/schema';
import { AuthService } from '../../src/services/authService';
import { createApp } from '../../src/app';

describe('Auth & RBAC Integration Tests', () => {
  let db: Database.Database;
  let app: any;
  let authService: AuthService;

  beforeEach(async () => {
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    initializeSchema(db);

    authService = new AuthService(db);
    await authService.seedDefaultAccounts();

    app = createApp(db);
  });

  afterEach(() => {
    db.close();
  });

  it('registers a customer and assigns an IRQ personal tracking code', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        full_name: 'Mustafa Jalal',
        phone: '07709876543',
        email: 'mustafa@example.com',
        password: 'Password123!',
        city: 'Baghdad',
        local_address: 'Karrada, St 14',
        nearest_point: 'National Theatre',
      });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.personal_code).toMatch(/^IRQ-\d{4}$/);
    expect(res.body.user.role).toBe('customer');
  });

  it('rejects duplicate email or phone number', async () => {
    const payload = {
      full_name: 'Ali Hassan',
      phone: '07701112233',
      email: 'ali@example.com',
      password: 'Password123!',
      city: 'Najaf',
      local_address: 'Old City',
      nearest_point: 'Shrine',
    };

    const first = await request(app).post('/api/auth/register').send(payload);
    expect(first.status).toBe(201);

    const duplicate = await request(app).post('/api/auth/register').send(payload);
    expect(duplicate.status).toBe(409);
  });

  it('authenticates user by email, phone, and personal code', async () => {
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        full_name: 'Hussein',
        phone: '07802223344',
        email: 'hussein@example.com',
        password: 'MySecretPassword123!',
        city: 'Karbala',
        local_address: 'Al-Abbas Quarter',
        nearest_point: 'University',
      });

    const userCode = regRes.body.user.personal_code;

    // Login with email
    const loginEmail = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'hussein@example.com', password: 'MySecretPassword123!' });
    expect(loginEmail.status).toBe(200);

    // Login with phone
    const loginPhone = await request(app)
      .post('/api/auth/login')
      .send({ identifier: '07802223344', password: 'MySecretPassword123!' });
    expect(loginPhone.status).toBe(200);

    // Login with personal code
    const loginCode = await request(app)
      .post('/api/auth/login')
      .send({ identifier: userCode, password: 'MySecretPassword123!' });
    expect(loginCode.status).toBe(200);
  });

  it('strictly blocks customer from accessing staff or manager endpoints (RBAC)', async () => {
    // 1. Register customer
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        full_name: 'Regular Customer',
        phone: '07704445566',
        email: 'cust@example.com',
        password: 'Password123!',
        city: 'Baghdad',
        local_address: 'Mansour',
        nearest_point: 'Mall',
      });
    const customerToken = regRes.body.token;

    // 2. Customer tries to access Manager Container Creation
    const containerRes = await request(app)
      .post('/api/containers')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ shipping_type: 'sea' });

    expect(containerRes.status).toBe(403);
    expect(containerRes.body.error).toContain('Forbidden');

    // 3. Customer tries to access Warehouse Intake
    const intakeRes = await request(app)
      .post('/api/packages/intake')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        merchant_tracking_number: 'TEST-123',
        customer_code: regRes.body.user.personal_code,
        shipping_type: 'air',
        weight_kg: 1,
        length_cm: 10,
        width_cm: 10,
        height_cm: 10,
        package_type: 'Test',
      });

    expect(intakeRes.status).toBe(403);
  });

  it('allows customer to download their personalized Chinese supplier address PDF', async () => {
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        full_name: 'Omar Farouk',
        phone: '07705556677',
        email: 'omar@example.com',
        password: 'Password123!',
        city: 'Sulaymaniyah',
        local_address: 'Bakrajo',
        nearest_point: 'Park',
      });

    const token = regRes.body.token;

    const pdfRes = await request(app)
      .get('/api/auth/address-pdf')
      .set('Authorization', `Bearer ${token}`);

    expect(pdfRes.status).toBe(200);
    expect(pdfRes.header['content-type']).toBe('application/pdf');
    expect(pdfRes.body.length).toBeGreaterThan(500); // Valid PDF stream
  });
});
