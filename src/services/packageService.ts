import Database from 'better-sqlite3';
import crypto from 'crypto';
import { Package, PackageStatus, User } from '../models/types';
import { generatePackageCode } from '../utils/codeGenerator';
import {
  calculateCBM,
  calculateVolumetricWeight,
  calculateChargeableWeight,
  calculateInvoice,
} from '../utils/calculations';

export interface PreAlertInput {
  merchant_tracking_number: string;
  shipping_type: 'air' | 'sea';
  package_type?: string;
  notes?: string;
}

export interface WarehouseIntakeInput {
  merchant_tracking_number: string;
  customer_code: string;
  shipping_type: 'air' | 'sea';
  weight_kg: number;
  length_cm: number;
  width_cm: number;
  height_cm: number;
  package_type: string;
  photos?: string[];
  container_id?: string | null;
}

export class PackageService {
  constructor(private db: Database.Database) {}

  /**
   * Customer registers a pre-alert before the package arrives at the warehouse.
   */
  public createPreAlert(userId: string, input: PreAlertInput): Package {
    const existing = this.db
      .prepare('SELECT * FROM packages WHERE merchant_tracking_number = ? AND user_id = ?')
      .get(input.merchant_tracking_number.trim(), userId) as any;

    if (existing) {
      throw { status: 409, message: 'A package with this merchant tracking number is already registered in your account.' };
    }

    const id = crypto.randomUUID();
    const internal_tracking_code = generatePackageCode();
    const now = new Date().toISOString();

    const insert = this.db.prepare(`
      INSERT INTO packages (
        id, internal_tracking_code, merchant_tracking_number, user_id, container_id,
        shipping_type, weight_kg, length_cm, width_cm, height_cm, cbm,
        volumetric_weight_kg, chargeable_weight_kg, package_type, photos_json,
        status, third_party_courier_name, third_party_tracking_number,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insert.run(
      id,
      internal_tracking_code,
      input.merchant_tracking_number.trim(),
      userId,
      null,
      input.shipping_type,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      input.package_type || 'General Goods',
      '[]',
      'pre_alert',
      null,
      null,
      now,
      now
    );

    this.addTrackingEvent(
      id,
      'pre_alert',
      'Pre-Alert Registered',
      'تم تسجيل تفاصيل الشحنة المتوقعة من قبل العميل',
      'Online System',
      false
    );

    return this.getPackageById(id)!;
  }

  /**
   * Warehouse staff scans and intakes the package: weighs, measures, assigns container & generates invoice.
   */
  public warehouseIntake(input: WarehouseIntakeInput): { package: Package; invoiceId: string } {
    const customer = this.db
      .prepare('SELECT id, personal_code FROM users WHERE UPPER(personal_code) = ?')
      .get(input.customer_code.trim().toUpperCase()) as User | undefined;

    if (!customer) {
      throw { status: 404, message: `Customer with code ${input.customer_code} was not found.` };
    }

    const cbm = calculateCBM({
      length_cm: input.length_cm,
      width_cm: input.width_cm,
      height_cm: input.height_cm,
    });
    const volWeight = calculateVolumetricWeight({
      length_cm: input.length_cm,
      width_cm: input.width_cm,
      height_cm: input.height_cm,
    });
    const chargeableWeight = calculateChargeableWeight(input.weight_kg, volWeight);
    const photosJson = JSON.stringify(input.photos || []);
    const now = new Date().toISOString();
    const status: PackageStatus = input.container_id ? 'in_container' : 'received_origin';

    // Check if there is an existing pre-alert for this tracking number & customer
    const existing = this.db
      .prepare('SELECT id FROM packages WHERE merchant_tracking_number = ? AND user_id = ?')
      .get(input.merchant_tracking_number.trim(), customer.id) as { id: string } | undefined;

    let packageId: string;
    let internalCode: string;

    if (existing) {
      packageId = existing.id;
      const update = this.db.prepare(`
        UPDATE packages SET
          container_id = ?,
          shipping_type = ?,
          weight_kg = ?,
          length_cm = ?,
          width_cm = ?,
          height_cm = ?,
          cbm = ?,
          volumetric_weight_kg = ?,
          chargeable_weight_kg = ?,
          package_type = ?,
          photos_json = ?,
          status = ?,
          updated_at = ?
        WHERE id = ?
      `);
      update.run(
        input.container_id || null,
        input.shipping_type,
        input.weight_kg,
        input.length_cm,
        input.width_cm,
        input.height_cm,
        cbm,
        volWeight,
        chargeableWeight,
        input.package_type,
        photosJson,
        status,
        now,
        packageId
      );
      const pkg = this.getPackageById(packageId)!;
      internalCode = pkg.internal_tracking_code;
    } else {
      packageId = crypto.randomUUID();
      internalCode = generatePackageCode();
      const insert = this.db.prepare(`
        INSERT INTO packages (
          id, internal_tracking_code, merchant_tracking_number, user_id, container_id,
          shipping_type, weight_kg, length_cm, width_cm, height_cm, cbm,
          volumetric_weight_kg, chargeable_weight_kg, package_type, photos_json,
          status, third_party_courier_name, third_party_tracking_number,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insert.run(
        packageId,
        internalCode,
        input.merchant_tracking_number.trim(),
        customer.id,
        input.container_id || null,
        input.shipping_type,
        input.weight_kg,
        input.length_cm,
        input.width_cm,
        input.height_cm,
        cbm,
        volWeight,
        chargeableWeight,
        input.package_type,
        photosJson,
        status,
        null,
        null,
        now,
        now
      );
    }

    // Add tracking event
    this.addTrackingEvent(
      packageId,
      'received_origin',
      'Received & Measured at Origin Warehouse',
      'تم استلام الطرد وقياس أبعاده ووزنه في مستودع المنشأ',
      'Guangzhou Hub',
      false
    );

    if (input.container_id) {
      this.addTrackingEvent(
        packageId,
        'in_container',
        'Packed into Container',
        'تم تجهيز الطرد ووضعه في حاوية الشحن',
        'Origin Logistics Center',
        false
      );
    }

    // Auto-generate or update Invoice
    const invoiceId = this.generateOrUpdateInvoice(packageId, customer.id, {
      shipping_type: input.shipping_type,
      weight_kg: input.weight_kg,
      cbm,
      volumetric_weight_kg: volWeight,
    });

    return {
      package: this.getPackageById(packageId)!,
      invoiceId,
    };
  }

  /**
   * Generates or refreshes the invoice for a package.
   */
  public generateOrUpdateInvoice(
    packageId: string,
    userId: string,
    params: { shipping_type: 'air' | 'sea'; weight_kg: number; cbm: number; volumetric_weight_kg: number }
  ): string {
    const rateSetting = this.db.prepare("SELECT value FROM system_settings WHERE key = 'usd_iqd_rate'").get() as any;
    const airRateSetting = this.db.prepare("SELECT value FROM system_settings WHERE key = 'default_air_rate_kg'").get() as any;
    const seaRateSetting = this.db.prepare("SELECT value FROM system_settings WHERE key = 'default_sea_rate_cbm'").get() as any;

    const exchangeRate = parseFloat(rateSetting?.value || '1500');
    const airRate = parseFloat(airRateSetting?.value || '7.5');
    const seaRate = parseFloat(seaRateSetting?.value || '220');

    const calculated = calculateInvoice({
      shipping_type: params.shipping_type,
      weight_kg: params.weight_kg,
      cbm: params.cbm,
      volumetric_weight_kg: params.volumetric_weight_kg,
      rate_per_kg_usd: airRate,
      rate_per_cbm_usd: seaRate,
      exchange_rate_iqd: exchangeRate,
    });

    const existingInvoice = this.db.prepare('SELECT id FROM invoices WHERE package_id = ?').get(packageId) as any;
    const now = new Date().toISOString();

    if (existingInvoice) {
      this.db
        .prepare(`
        UPDATE invoices SET
          shipping_cost_usd = ?,
          customs_tax_usd = ?,
          extra_fees_usd = ?,
          total_usd = ?,
          exchange_rate_iqd = ?,
          total_iqd = ?,
          updated_at = ?
        WHERE id = ?
      `)
        .run(
          calculated.shipping_cost_usd,
          calculated.customs_tax_usd,
          calculated.extra_fees_usd,
          calculated.total_usd,
          calculated.exchange_rate_iqd,
          calculated.total_iqd,
          now,
          existingInvoice.id
        );
      return existingInvoice.id;
    } else {
      const invoiceId = crypto.randomUUID();
      this.db
        .prepare(`
        INSERT INTO invoices (
          id, package_id, user_id, shipping_cost_usd, customs_tax_usd, extra_fees_usd,
          total_usd, exchange_rate_iqd, total_iqd, amount_paid_usd, amount_paid_iqd,
          payment_method, payment_status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
        .run(
          invoiceId,
          packageId,
          userId,
          calculated.shipping_cost_usd,
          calculated.customs_tax_usd,
          calculated.extra_fees_usd,
          calculated.total_usd,
          calculated.exchange_rate_iqd,
          calculated.total_iqd,
          0,
          0,
          'cash_on_delivery',
          'unpaid',
          now,
          now
        );
      return invoiceId;
    }
  }

  /**
   * Adds a tracking timeline event.
   */
  public addTrackingEvent(
    packageId: string,
    status: PackageStatus,
    titleEn: string,
    titleAr: string,
    location: string,
    isInternalOnly: boolean = false
  ): void {
    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    this.db
      .prepare(`
      INSERT INTO tracking_events (
        id, package_id, status, title_en, title_ar, location, is_internal_only, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
      .run(id, packageId, status, titleEn, titleAr, location, isInternalOnly ? 1 : 0, timestamp);
  }

  /**
   * Gets a package by internal ID.
   */
  public getPackageById(id: string): Package | null {
    const row = this.db.prepare('SELECT * FROM packages WHERE id = ?').get(id) as any;
    if (!row) return null;
    return this.mapPackageRow(row);
  }

  /**
   * Gets packages for a customer with privacy redactions (no container IDs or internal notes).
   */
  public getCustomerPackages(userId: string): Array<Omit<Package, 'container_id'> & { container_id: null }> {
    const rows = this.db
      .prepare('SELECT * FROM packages WHERE user_id = ? ORDER BY created_at DESC')
      .all(userId) as any[];

    return rows.map((r) => {
      const pkg = this.mapPackageRow(r);
      return {
        ...pkg,
        container_id: null, // Strict privacy filter
      };
    });
  }

  /**
   * Gets all packages (for staff/managers) with search and filters.
   */
  public getAllPackages(filters?: {
    status?: string;
    container_id?: string;
    search?: string;
  }): Array<Package & { customer_name: string; customer_code: string; customer_phone: string }> {
    let sql = `
      SELECT p.*, u.full_name as customer_name, u.personal_code as customer_code, u.phone as customer_phone
      FROM packages p
      JOIN users u ON p.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters?.status) {
      sql += ' AND p.status = ?';
      params.push(filters.status);
    }

    if (filters?.container_id) {
      sql += ' AND p.container_id = ?';
      params.push(filters.container_id);
    }

    if (filters?.search) {
      sql += ` AND (
        p.internal_tracking_code LIKE ? OR
        p.merchant_tracking_number LIKE ? OR
        u.personal_code LIKE ? OR
        u.phone LIKE ?
      )`;
      const s = `%${filters.search.trim()}%`;
      params.push(s, s, s, s);
    }

    sql += ' ORDER BY p.created_at DESC';

    const rows = this.db.prepare(sql).all(...params) as any[];
    return rows.map((r) => ({
      ...this.mapPackageRow(r),
      customer_name: r.customer_name,
      customer_code: r.customer_code,
      customer_phone: r.customer_phone,
    }));
  }

  private mapPackageRow(row: any): Package {
    return {
      id: row.id,
      internal_tracking_code: row.internal_tracking_code,
      merchant_tracking_number: row.merchant_tracking_number,
      user_id: row.user_id,
      container_id: row.container_id,
      shipping_type: row.shipping_type,
      weight_kg: Number(row.weight_kg),
      length_cm: Number(row.length_cm),
      width_cm: Number(row.width_cm),
      height_cm: Number(row.height_cm),
      cbm: Number(row.cbm),
      volumetric_weight_kg: Number(row.volumetric_weight_kg),
      chargeable_weight_kg: Number(row.chargeable_weight_kg),
      package_type: row.package_type,
      photos: JSON.parse(row.photos_json || '[]'),
      status: row.status,
      third_party_courier_name: row.third_party_courier_name,
      third_party_tracking_number: row.third_party_tracking_number,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}
