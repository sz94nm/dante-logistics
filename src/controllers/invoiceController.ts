import { Request, Response, NextFunction } from 'express';
import { InvoiceService } from '../services/invoiceService';
import { updateInvoicePaymentSchema, updateExchangeRateSchema } from '../utils/validator';

export class InvoiceController {
  constructor(private invoiceService: InvoiceService) {}

  public getMyInvoices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const invoices = this.invoiceService.getInvoicesByUserId(userId);
      res.status(200).json({ invoices });
    } catch (err) {
      next(err);
    }
  };

  public getAllInvoices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const invoices = this.invoiceService.getAllInvoices();
      res.status(200).json({ invoices });
    } catch (err) {
      next(err);
    }
  };

  public getInvoiceByPackageId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const invoice = this.invoiceService.getInvoiceByPackageId(req.params.packageId as string);
      if (!invoice) {
        res.status(404).json({ error: 'Invoice not found' });
        return;
      }

      if (req.user?.role === 'customer' && invoice.user_id !== req.user.userId) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      res.status(200).json({ invoice });
    } catch (err) {
      next(err);
    }
  };

  public updatePayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = updateInvoicePaymentSchema.parse(req.body);
      const invoice = this.invoiceService.updatePayment(req.params.id as string, validated);
      res.status(200).json({ message: 'Payment details updated', invoice });
    } catch (err) {
      next(err);
    }
  };

  public getExchangeRate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rate = this.invoiceService.getGlobalExchangeRate();
      res.status(200).json({ usd_iqd_rate: rate });
    } catch (err) {
      next(err);
    }
  };

  public setExchangeRate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = updateExchangeRateSchema.parse(req.body);
      this.invoiceService.setGlobalExchangeRate(validated.exchange_rate_iqd);
      res.status(200).json({
        message: 'Exchange rate updated successfully',
        usd_iqd_rate: validated.exchange_rate_iqd,
      });
    } catch (err) {
      next(err);
    }
  };
}
