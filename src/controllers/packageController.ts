import { Request, Response, NextFunction } from 'express';
import { PackageService } from '../services/packageService';
import { preAlertSchema, warehouseIntakeSchema } from '../utils/validator';

export class PackageController {
  constructor(private packageService: PackageService) {}

  public createPreAlert = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const validated = preAlertSchema.parse(req.body);
      const pkg = this.packageService.createPreAlert(userId, validated);
      res.status(201).json({ message: 'Pre-alert registered successfully', package: pkg });
    } catch (err) {
      next(err);
    }
  };

  public warehouseIntake = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = warehouseIntakeSchema.parse(req.body);
      const result = this.packageService.warehouseIntake(validated);
      res.status(201).json({
        message: 'Package intake recorded and invoice generated',
        package: result.package,
        invoice_id: result.invoiceId,
      });
    } catch (err) {
      next(err);
    }
  };

  public getMyPackages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const packages = this.packageService.getCustomerPackages(userId);
      res.status(200).json({ packages });
    } catch (err) {
      next(err);
    }
  };

  public getAllPackages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status, container_id, search } = req.query;
      const packages = this.packageService.getAllPackages({
        status: status as string | undefined,
        container_id: container_id as string | undefined,
        search: search as string | undefined,
      });
      res.status(200).json({ packages });
    } catch (err) {
      next(err);
    }
  };

  public getPackageById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const pkg = this.packageService.getPackageById(req.params.id as string);
      if (!pkg) {
        res.status(404).json({ error: 'Package not found' });
        return;
      }

      // Check ownership if user is customer
      if (req.user?.role === 'customer' && pkg.user_id !== req.user.userId) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      // Hide container_id if customer
      if (req.user?.role === 'customer') {
        (pkg as any).container_id = null;
      }

      res.status(200).json({ package: pkg });
    } catch (err) {
      next(err);
    }
  };
}
