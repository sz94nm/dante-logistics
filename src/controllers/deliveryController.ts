import { Request, Response, NextFunction } from 'express';
import { DeliveryService } from '../services/deliveryService';
import { updateDeliveryStatusSchema } from '../utils/validator';

export class DeliveryController {
  constructor(private deliveryService: DeliveryService) {}

  public getDispatchManifest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const city = req.query.city as string | undefined;
      const manifest = this.deliveryService.getDispatchManifest(city);
      res.status(200).json({ manifest });
    } catch (err) {
      next(err);
    }
  };

  public updateDeliveryStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = updateDeliveryStatusSchema.parse(req.body);
      this.deliveryService.updateDeliveryStatus(
        req.params.packageId as string,
        validated.status,
        validated.third_party_courier_name,
        validated.third_party_tracking_number
      );
      res.status(200).json({ message: 'Delivery status updated successfully' });
    } catch (err) {
      next(err);
    }
  };
}
