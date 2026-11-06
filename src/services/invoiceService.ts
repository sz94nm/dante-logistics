import Database from 'better-sqlite3';
import { Invoice, PaymentMethod, PaymentStatus } from '../models/types';

export interface UpdatePaymentInput {
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  amount_paid_usd: number;
}

export class InvoiceService {
  constructor(private db: Database.Database) {}

  public getInvoiceByPackageId(packageId: string): Invoice | null {
    const row = this.db.prepare('SELECT * FROM invoices WHERE package_id = ?').get(packageId) as any;
    if (!row) return null;
    return this.mapInvoice(row);
  }

  public getInvoicesByUserId(userId: string): Invoice[] {
    const rows = this.db
      .prepare('SELECT * FROM invoices WHERE user_id = ? ORDER BY created_at DESC')
      .all(userId) as any[];
    return rows.map(this.mapInvoice);
  }

  public getAllInvoices(): Array<
    Invoice & { customer_name: string; customer_code: string; tracking_code: string }
  > {
    const rows = this.db
      .prepare(`
      SELECT i.*, u.full_name as customer_name, u.personal_code as customer_code, p.internal_tracking_code as tracking_code
      FROM invoices i
      JOIN users u ON i.user_id = u.id
      JOIN packages p ON i.package_id = p.id
      ORDER BY i.created_at DESC
    `)
      .all() as any[];

    return rows.map((r) => ({
      ...this.mapInvoice(r),
      customer_name: r.customer_name,
      customer_code: r.customer_code,
      tracking_code: r.tracking_code,
    }));
  }

  public updatePayment(invoiceId: string, input: UpdatePaymentInput): Invoice {
    const current = this.db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId) as any;
    if (!current) {
      throw { status: 404, message: 'Invoice not found' };
    }

    const now = new Date().toISOString();
    const rate = Number(current.exchange_rate_iqd);
    const amountPaidIqd = Math.round((input.amount_paid_usd * rate) / 250) * 250;

    this.db
      .prepare(`
      UPDATE invoices SET
        payment_method = ?,
        payment_status = ?,
        amount_paid_usd = ?,
        amount_paid_iqd = ?,
        updated_at = ?
      WHERE id = ?
    `)
      .run(input.payment_method, input.payment_status, input.amount_paid_usd, amountPaidIqd, now, invoiceId);

    const updated = this.db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId) as any;
    return this.mapInvoice(updated);
  }

  public setGlobalExchangeRate(rate: number): void {
    if (rate <= 0) {
      throw { status: 400, message: 'Exchange rate must be positive' };
    }
    const now = new Date().toISOString();
    this.db
      .prepare("INSERT OR REPLACE INTO system_settings (key, value, updated_at) VALUES ('usd_iqd_rate', ?, ?)")
      .run(rate.toString(), now);
  }

  public getGlobalExchangeRate(): number {
    const row = this.db.prepare("SELECT value FROM system_settings WHERE key = 'usd_iqd_rate'").get() as any;
    return parseFloat(row?.value || '1500');
  }

  private mapInvoice(r: any): Invoice {
    return {
      id: r.id,
      package_id: r.package_id,
      user_id: r.user_id,
      shipping_cost_usd: Number(r.shipping_cost_usd),
      customs_tax_usd: Number(r.customs_tax_usd),
      extra_fees_usd: Number(r.extra_fees_usd),
      total_usd: Number(r.total_usd),
      exchange_rate_iqd: Number(r.exchange_rate_iqd),
      total_iqd: Number(r.total_iqd),
      amount_paid_usd: Number(r.amount_paid_usd),
      amount_paid_iqd: Number(r.amount_paid_iqd),
      payment_method: r.payment_method,
      payment_status: r.payment_status,
      created_at: r.created_at,
      updated_at: r.updated_at,
    };
  }
}
