import { createApp } from './app';
import { getDatabase } from './database/connection';
import { initializeSchema } from './database/schema';
import { AuthService } from './services/authService';
import { ENV } from './config/env';

async function bootstrap() {
  const db = getDatabase();
  initializeSchema(db);

  const authService = new AuthService(db);
  await authService.seedDefaultAccounts();

  const app = createApp(db);

  app.listen(ENV.PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 Dante Logistics Tracking System is live!`);
    console.log(`📡 URL: http://localhost:${ENV.PORT}`);
    console.log(`🛡️  Environment: ${ENV.NODE_ENV}`);
    console.log(`📦 Default Manager Account: manager@dante.com / Admin@2026!`);
    console.log(`👷 Default Warehouse Staff: staff@dante.com / Staff@2026!`);
    console.log(`=======================================================`);
  });
}

bootstrap().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
