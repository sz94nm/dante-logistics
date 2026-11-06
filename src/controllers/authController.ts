import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { registerUserSchema, loginSchema } from '../utils/validator';
import { generateAddressCardPDF } from '../utils/pdfGenerator';
import Database from 'better-sqlite3';

export class AuthController {
  constructor(private authService: AuthService, private db: Database.Database) {}

  public register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = registerUserSchema.parse(req.body);
      const result = await this.authService.register(validated);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  };

  public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = loginSchema.parse(req.body);
      const result = await this.authService.login(validated.identifier, validated.password);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  public getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const user = this.db
        .prepare(
          'SELECT id, personal_code, full_name, phone, email, city, local_address, nearest_point, role, preferred_language, created_at FROM users WHERE id = ?'
        )
        .get(userId) as any;

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.status(200).json({ user });
    } catch (err) {
      next(err);
    }
  };

  public downloadAddressPDF = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const user = this.db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const nameRow = this.db.prepare("SELECT value FROM system_settings WHERE key = 'warehouse_name'").get() as any;
      const enRow = this.db.prepare("SELECT value FROM system_settings WHERE key = 'warehouse_address_en'").get() as any;
      const zhRow = this.db.prepare("SELECT value FROM system_settings WHERE key = 'warehouse_address_zh'").get() as any;
      const phoneRow = this.db.prepare("SELECT value FROM system_settings WHERE key = 'warehouse_phone'").get() as any;

      const pdfBuffer = await generateAddressCardPDF({
        customer_code: user.personal_code,
        customer_name: user.full_name,
        customer_phone: user.phone,
        warehouse: {
          id: 'origin_1',
          name: nameRow?.value || 'Dante Global Hub',
          address_en: enRow?.value || 'Logistics Park, Baiyun, Guangzhou, China',
          address_zh: zhRow?.value || '中国广东省广州市白云区物流园4栋',
          phone: phoneRow?.value || '+86 138 0013 8000',
          instructions_en: 'Print customer code on parcel',
          instructions_zh: '请在外包装上注明客户代码',
        },
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=Dante_Address_${user.personal_code}.pdf`);
      res.send(pdfBuffer);
    } catch (err) {
      next(err);
    }
  };
}
