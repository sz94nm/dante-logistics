import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import Database from 'better-sqlite3';
import { createApiRouter } from './routes/api';
import { errorHandler } from './middleware/errorHandler';

export function createApp(db: Database.Database): Express {
  const app = express();

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allows inline styles & assets for our SPA
      crossOriginEmbedderPolicy: false,
    })
  );

  // Enable CORS
  app.use(cors({ origin: true, credentials: true }));

  // Request parsing with photo payload support
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Static directory for web client
  const publicDir = path.join(__dirname, '../public');
  app.use(express.static(publicDir));

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  // Mount API router
  app.use('/api', createApiRouter(db));

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
}
