import { Request, Response, NextFunction } from 'express';
import { TrackingService } from '../services/trackingService';
import Database from 'better-sqlite3';

export class TrackingController {
  constructor(private trackingService: TrackingService, private db: Database.Database) {}

  public getTrackingTimeline = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const packageIdOrCode = req.params.identifier;
      const isCustomer = req.user?.role === 'customer';

      // Look up package by internal code or ID
      const pkg = this.db
        .prepare('SELECT id, user_id FROM packages WHERE id = ? OR internal_tracking_code = ?')
        .get(packageIdOrCode, packageIdOrCode) as { id: string; user_id: string } | undefined;

      if (!pkg) {
        res.status(404).json({ error: 'Package not found' });
        return;
      }

      // If logged in as customer, verify package belongs to them
      if (isCustomer && pkg.user_id !== req.user?.userId) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      const timeline = this.trackingService.getPackageTimeline(pkg.id, isCustomer);
      res.status(200).json(timeline);
    } catch (err) {
      next(err);
    }
  };
}
