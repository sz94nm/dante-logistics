import Database from 'better-sqlite3';
import crypto from 'crypto';
import { Container, ContainerStatus } from '../models/types';
import { generateContainerCode } from '../utils/codeGenerator';
import { PackageService } from './packageService';

export interface CreateContainerInput {
  shipping_type: 'air' | 'sea';
  cost_per_container_usd?: number;
  cost_per_cbm_usd?: number;
  cost_per_kg_usd?: number;
  customs_tax_usd?: number;
  max_cbm?: number;
  max_weight_kg?: number;
  etd?: string | null;
  eta?: string | null;
  notes?: string | null;
}

export interface ContainerWithStats extends Container {
  package_count: number;
  total_cbm_used: number;
  total_weight_used: number;
  cbm_utilization_percent: number;
}

export class ContainerService {
  constructor(private db: Database.Database, private packageService: PackageService) {}

  private getNextContainerCode(type: 'air' | 'sea'): string {
    const seqName = type === 'air' ? 'container_air' : 'container_sea';
    const update = this.db.prepare(
      `UPDATE sequence_counters SET current_value = current_value + 1 WHERE name = ? RETURNING current_value`
    );
    const row = update.get(seqName) as { current_value: number };
    return generateContainerCode(type, row.current_value);
  }

  public createContainer(input: CreateContainerInput): Container {
    const id = crypto.randomUUID();
    const container_number = this.getNextContainerCode(input.shipping_type);
    const now = new Date().toISOString();

    const insert = this.db.prepare(`
      INSERT INTO containers (
        id, container_number, shipping_type, cost_per_container_usd,
        cost_per_cbm_usd, cost_per_kg_usd, customs_tax_usd, max_cbm,
        max_weight_kg, status, etd, eta, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insert.run(
      id,
      container_number,
      input.shipping_type,
      input.cost_per_container_usd || 0,
      input.cost_per_cbm_usd || (input.shipping_type === 'sea' ? 220 : 0),
      input.cost_per_kg_usd || (input.shipping_type === 'air' ? 7.5 : 0),
      input.customs_tax_usd || 0,
      input.max_cbm || (input.shipping_type === 'sea' ? 68.0 : 15.0),
      input.max_weight_kg || (input.shipping_type === 'sea' ? 26000.0 : 3500.0),
      'loading',
      input.etd || null,
      input.eta || null,
      input.notes || null,
      now,
      now
    );

    return this.getContainerById(id)!;
  }

  public getContainers(): ContainerWithStats[] {
    const rows = this.db
      .prepare(`
      SELECT c.*,
        COUNT(p.id) as package_count,
        COALESCE(SUM(p.cbm), 0) as total_cbm_used,
        COALESCE(SUM(p.weight_kg), 0) as total_weight_used
      FROM containers c
      LEFT JOIN packages p ON c.id = p.container_id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `)
      .all() as any[];

    return rows.map((r) => {
      const maxCbm = Number(r.max_cbm);
      const cbmUsed = Number(r.total_cbm_used);
      const utilization = maxCbm > 0 ? (cbmUsed / maxCbm) * 100 : 0;

      return {
        id: r.id,
        container_number: r.container_number,
        shipping_type: r.shipping_type,
        cost_per_container_usd: Number(r.cost_per_container_usd),
        cost_per_cbm_usd: Number(r.cost_per_cbm_usd),
        cost_per_kg_usd: Number(r.cost_per_kg_usd),
        customs_tax_usd: Number(r.customs_tax_usd),
        max_cbm: maxCbm,
        max_weight_kg: Number(r.max_weight_kg),
        status: r.status,
        etd: r.etd,
        eta: r.eta,
        notes: r.notes,
        created_at: r.created_at,
        updated_at: r.updated_at,
        package_count: Number(r.package_count),
        total_cbm_used: Number(cbmUsed.toFixed(4)),
        total_weight_used: Number(Number(r.total_weight_used).toFixed(2)),
        cbm_utilization_percent: Number(utilization.toFixed(1)),
      };
    });
  }

  public getContainerById(id: string): (ContainerWithStats & { packages: any[] }) | null {
    const row = this.db.prepare('SELECT * FROM containers WHERE id = ?').get(id) as any;
    if (!row) return null;

    const stats = this.db
      .prepare(`
      SELECT
        COUNT(p.id) as package_count,
        COALESCE(SUM(p.cbm), 0) as total_cbm_used,
        COALESCE(SUM(p.weight_kg), 0) as total_weight_used
      FROM packages p
      WHERE p.container_id = ?
    `)
      .get(id) as any;

    const packages = this.db
      .prepare(`
      SELECT p.id, p.internal_tracking_code, p.weight_kg, p.cbm, p.package_type, p.status, u.personal_code as customer_code, u.full_name as customer_name
      FROM packages p
      JOIN users u ON p.user_id = u.id
      WHERE p.container_id = ?
      ORDER BY p.created_at DESC
    `)
      .all(id) as any[];

    const maxCbm = Number(row.max_cbm);
    const cbmUsed = Number(stats?.total_cbm_used || 0);
    const utilization = maxCbm > 0 ? (cbmUsed / maxCbm) * 100 : 0;

    return {
      id: row.id,
      container_number: row.container_number,
      shipping_type: row.shipping_type,
      cost_per_container_usd: Number(row.cost_per_container_usd),
      cost_per_cbm_usd: Number(row.cost_per_cbm_usd),
      cost_per_kg_usd: Number(row.cost_per_kg_usd),
      customs_tax_usd: Number(row.customs_tax_usd),
      max_cbm: maxCbm,
      max_weight_kg: Number(row.max_weight_kg),
      status: row.status,
      etd: row.etd,
      eta: row.eta,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
      package_count: Number(stats?.package_count || 0),
      total_cbm_used: Number(cbmUsed.toFixed(4)),
      total_weight_used: Number(Number(stats?.total_weight_used || 0).toFixed(2)),
      cbm_utilization_percent: Number(utilization.toFixed(1)),
      packages: packages.map((p) => ({
        id: p.id,
        tracking_code: p.internal_tracking_code,
        weight_kg: Number(p.weight_kg),
        cbm: Number(p.cbm),
        package_type: p.package_type,
        status: p.status,
        customer_code: p.customer_code,
        customer_name: p.customer_name,
      })),
    };
  }

  /**
   * Updates container details and automatically propagates status milestones to all enclosed packages.
   */
  public updateContainer(id: string, updates: Partial<Container>): Container {
    const current = this.getContainerById(id);
    if (!current) {
      throw { status: 404, message: 'Container not found' };
    }

    const now = new Date().toISOString();
    const fields: string[] = ['updated_at = ?'];
    const values: any[] = [now];

    const allowed = [
      'shipping_type',
      'cost_per_container_usd',
      'cost_per_cbm_usd',
      'cost_per_kg_usd',
      'customs_tax_usd',
      'max_cbm',
      'max_weight_kg',
      'status',
      'etd',
      'eta',
      'notes',
    ] as const;

    for (const key of allowed) {
      if ((updates as any)[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push((updates as any)[key]);
      }
    }

    values.push(id);
    this.db.prepare(`UPDATE containers SET ${fields.join(', ')} WHERE id = ?`).run(...values);

    // Propagate status change to packages if status was changed
    if (updates.status && updates.status !== current.status) {
      this.propagateContainerStatus(id, updates.status, current.shipping_type);
    }

    return this.getContainerById(id)!;
  }

  /**
   * Assigns multiple packages to a container in bulk.
   */
  public assignPackages(containerId: string, packageIds: string[]): void {
    const container = this.getContainerById(containerId);
    if (!container) {
      throw { status: 404, message: 'Container not found' };
    }

    const now = new Date().toISOString();
    const updateStmt = this.db.prepare(
      `UPDATE packages SET container_id = ?, status = 'in_container', updated_at = ? WHERE id = ?`
    );

    const transaction = this.db.transaction((ids: string[]) => {
      for (const pId of ids) {
        updateStmt.run(containerId, now, pId);
        this.packageService.addTrackingEvent(
          pId,
          'in_container',
          'Packed into Container',
          'تم فرز الشحنة وتثبيتها داخل الحاوية',
          'Origin Logistics Hub',
          false
        );
      }
    });

    transaction(packageIds);
  }

  /**
   * Status change cascades to all enclosed packages.
   */
  private propagateContainerStatus(containerId: string, status: ContainerStatus, shippingType: 'air' | 'sea'): void {
    const packages = this.db
      .prepare('SELECT id FROM packages WHERE container_id = ?')
      .all(containerId) as { id: string }[];

    const now = new Date().toISOString();
    const transitType = shippingType === 'air' ? 'Flight' : 'Vessel';
    const transitTypeAr = shippingType === 'air' ? 'رحلة الشحن الجوي' : 'سفينة الشحن البحري';

    for (const pkg of packages) {
      if (status === 'in_transit') {
        this.db.prepare("UPDATE packages SET status = 'in_transit', updated_at = ? WHERE id = ?").run(now, pkg.id);
        this.packageService.addTrackingEvent(
          pkg.id,
          'in_transit',
          `Departed Origin on ${transitType}`,
          `غادرت الشحنة ميناء/مطار المنشأ عبر ${transitTypeAr} وهي في طريقها إلى العراق`,
          'International Transit',
          false
        );
      } else if (status === 'customs') {
        this.db
          .prepare("UPDATE packages SET status = 'customs_processing', updated_at = ? WHERE id = ?")
          .run(now, pkg.id);
        this.packageService.addTrackingEvent(
          pkg.id,
          'customs_processing',
          'Arrived at Port of Entry - Customs Clearance',
          'وصلت الحاوية إلى المنفذ الجمركي العراقي - جاري التدقيق والتخليص',
          'Iraq Customs Border',
          false
        );
      } else if (status === 'arrived_unpacked') {
        this.db
          .prepare("UPDATE packages SET status = 'to_be_dispatched', updated_at = ? WHERE id = ?")
          .run(now, pkg.id);
        this.packageService.addTrackingEvent(
          pkg.id,
          'to_be_dispatched',
          'Customs Cleared - Ready for Local Dispatch',
          'تم التخليص الجمركي بنجاح ووصلت الشحنة إلى مركز التوزيع - بانتظار تسليمها لشركة التوصيل',
          'Baghdad Main Distribution Center',
          false
        );
      }
    }
  }
}
