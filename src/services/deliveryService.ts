import Database from 'better-sqlite3';
import { PackageService } from './packageService';

export interface DeliveryManifestItem {
  package_id: string;
  tracking_code: string;
  customer_name: string;
  customer_phone: string;
  city: string;
  local_address: string;
  nearest_point: string;
  cod_amount_iqd: number;
  cod_amount_usd: number;
  payment_status: string;
  package_status: string;
  third_party_courier_name: string | null;
  third_party_tracking_number: string | null;
}

export class DeliveryService {
  constructor(private db: Database.Database, private packageService: PackageService) {}

  /**
   * Generates dispatch manifest grouped by Iraqi cities for 3rd party local delivery companies.
   */
  public getDispatchManifest(cityFilter?: string): Record<string, DeliveryManifestItem[]> {
    let sql = `
      SELECT
        p.id as package_id,
        p.internal_tracking_code as tracking_code,
        p.status as package_status,
        p.third_party_courier_name,
        p.third_party_tracking_number,
        u.full_name as customer_name,
        u.phone as customer_phone,
        u.city,
        u.local_address,
        u.nearest_point,
        COALESCE(i.total_iqd, 0) as cod_amount_iqd,
        COALESCE(i.total_usd, 0) as cod_amount_usd,
        COALESCE(i.payment_status, 'unpaid') as payment_status
      FROM packages p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN invoices i ON p.id = i.package_id
      WHERE p.status IN ('to_be_dispatched', 'out_for_delivery', 'delivered')
    `;

    const params: any[] = [];
    if (cityFilter) {
      sql += ' AND u.city = ?';
      params.push(cityFilter);
    }

    sql += ' ORDER BY u.city ASC, p.created_at ASC';

    const rows = this.db.prepare(sql).all(...params) as any[];

    // Group items by Iraqi City
    const grouped: Record<string, DeliveryManifestItem[]> = {};

    for (const r of rows) {
      const city = r.city;
      if (!grouped[city]) {
        grouped[city] = [];
      }
      grouped[city].push({
        package_id: r.package_id,
        tracking_code: r.tracking_code,
        customer_name: r.customer_name,
        customer_phone: r.customer_phone,
        city: r.city,
        local_address: r.local_address,
        nearest_point: r.nearest_point,
        cod_amount_iqd: Number(r.cod_amount_iqd),
        cod_amount_usd: Number(r.cod_amount_usd),
        payment_status: r.payment_status,
        package_status: r.package_status,
        third_party_courier_name: r.third_party_courier_name,
        third_party_tracking_number: r.third_party_tracking_number,
      });
    }

    return grouped;
  }

  /**
   * Updates delivery status: to_be_dispatched, out_for_delivery, delivered.
   */
  public updateDeliveryStatus(
    packageId: string,
    status: 'to_be_dispatched' | 'out_for_delivery' | 'delivered' | 'returned',
    courierName?: string | null,
    courierTracking?: string | null
  ): void {
    const pkg = this.packageService.getPackageById(packageId);
    if (!pkg) {
      throw { status: 404, message: 'Package not found' };
    }

    const now = new Date().toISOString();
    this.db
      .prepare(`
      UPDATE packages SET
        status = ?,
        third_party_courier_name = COALESCE(?, third_party_courier_name),
        third_party_tracking_number = COALESCE(?, third_party_tracking_number),
        updated_at = ?
      WHERE id = ?
    `)
      .run(status, courierName || null, courierTracking || null, now, packageId);

    if (status === 'out_for_delivery') {
      const courierText = courierName ? ` (${courierName})` : '';
      this.packageService.addTrackingEvent(
        packageId,
        'out_for_delivery',
        `Out for Delivery with Local Courier${courierText}`,
        `الشحنة مع مندوب التوصيل المحلي للتسليم إلى عنوانك${courierText}`,
        'Local City Courier',
        false
      );
    } else if (status === 'delivered') {
      this.packageService.addTrackingEvent(
        packageId,
        'delivered',
        'Delivered to Customer',
        'تم تسليم الشحنة للعميل بنجاح',
        'Customer Address',
        false
      );

      // If COD, mark invoice as paid upon delivery
      this.db
        .prepare(`
        UPDATE invoices SET
          payment_status = 'paid',
          amount_paid_usd = total_usd,
          amount_paid_iqd = total_iqd,
          updated_at = ?
        WHERE package_id = ? AND payment_status != 'paid'
      `)
        .run(now, packageId);
    }
  }
}
