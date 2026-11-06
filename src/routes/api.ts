import { Router } from 'express';
import Database from 'better-sqlite3';
import { AuthService } from '../services/authService';
import { PackageService } from '../services/packageService';
import { ContainerService } from '../services/containerService';
import { InvoiceService } from '../services/invoiceService';
import { TrackingService } from '../services/trackingService';
import { DeliveryService } from '../services/deliveryService';

import { AuthController } from '../controllers/authController';
import { PackageController } from '../controllers/packageController';
import { ContainerController } from '../controllers/containerController';
import { InvoiceController } from '../controllers/invoiceController';
import { TrackingController } from '../controllers/trackingController';
import { DeliveryController } from '../controllers/deliveryController';

import { authenticateJWT } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { createRateLimiter } from '../middleware/rateLimiter';
import { IRAQI_CITIES } from '../config/constants';

export function createApiRouter(db: Database.Database): Router {
  const router = Router();

  // Instantiate services
  const authService = new AuthService(db);
  const packageService = new PackageService(db);
  const containerService = new ContainerService(db, packageService);
  const invoiceService = new InvoiceService(db);
  const trackingService = new TrackingService(db);
  const deliveryService = new DeliveryService(db, packageService);

  // Instantiate controllers
  const authCtrl = new AuthController(authService, db);
  const packageCtrl = new PackageController(packageService);
  const containerCtrl = new ContainerController(containerService);
  const invoiceCtrl = new InvoiceController(invoiceService);
  const trackingCtrl = new TrackingController(trackingService, db);
  const deliveryCtrl = new DeliveryController(deliveryService);

  // Rate limiter for auth routes
  const authLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 100 });

  // Public config routes
  router.get('/config/cities', (_req, res) => {
    res.status(200).json({ cities: IRAQI_CITIES });
  });

  // Auth routes
  router.post('/auth/register', authLimiter, authCtrl.register);
  router.post('/auth/login', authLimiter, authCtrl.login);
  router.get('/auth/me', authenticateJWT, authCtrl.getProfile);
  router.get('/auth/address-pdf', authenticateJWT, authCtrl.downloadAddressPDF);

  // Package routes (Customer, Staff, Manager)
  router.post('/packages/pre-alert', authenticateJWT, requireRole('customer'), packageCtrl.createPreAlert);
  router.post('/packages/intake', authenticateJWT, requireRole('staff', 'manager'), packageCtrl.warehouseIntake);
  router.get('/packages/my', authenticateJWT, requireRole('customer'), packageCtrl.getMyPackages);
  router.get('/packages/all', authenticateJWT, requireRole('staff', 'manager'), packageCtrl.getAllPackages);
  router.get('/packages/:id', authenticateJWT, packageCtrl.getPackageById);

  // Tracking routes
  router.get('/tracking/:identifier', authenticateJWT, trackingCtrl.getTrackingTimeline);

  // Container routes (Staff & Manager)
  router.get('/containers', authenticateJWT, requireRole('staff', 'manager'), containerCtrl.getContainers);
  router.get('/containers/:id', authenticateJWT, requireRole('staff', 'manager'), containerCtrl.getContainerById);
  router.post('/containers', authenticateJWT, requireRole('manager'), containerCtrl.createContainer);
  router.patch('/containers/:id', authenticateJWT, requireRole('manager'), containerCtrl.updateContainer);
  router.post('/containers/:id/assign', authenticateJWT, requireRole('staff', 'manager'), containerCtrl.assignPackages);

  // Invoice & Financials routes
  router.get('/invoices/my', authenticateJWT, requireRole('customer'), invoiceCtrl.getMyInvoices);
  router.get('/invoices/all', authenticateJWT, requireRole('manager'), invoiceCtrl.getAllInvoices);
  router.get('/invoices/package/:packageId', authenticateJWT, invoiceCtrl.getInvoiceByPackageId);
  router.patch('/invoices/:id/payment', authenticateJWT, requireRole('manager'), invoiceCtrl.updatePayment);
  router.get('/finance/exchange-rate', invoiceCtrl.getExchangeRate);
  router.post('/finance/exchange-rate', authenticateJWT, requireRole('manager'), invoiceCtrl.setExchangeRate);

  // Local Iraqi Delivery routes (Manager & Staff)
  router.get('/delivery/manifest', authenticateJWT, requireRole('manager', 'staff'), deliveryCtrl.getDispatchManifest);
  router.patch('/delivery/:packageId/status', authenticateJWT, requireRole('manager', 'staff'), deliveryCtrl.updateDeliveryStatus);

  return router;
}
