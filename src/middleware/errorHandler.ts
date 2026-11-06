import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation failed',
      details: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    });
    return;
  }

  if (err.status && typeof err.status === 'number') {
    res.status(err.status).json({ error: err.message || 'Error occurred' });
    return;
  }

  // Handle unique constraint SQLite error
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    res.status(409).json({ error: 'Conflict: Record with this unique identifier already exists.' });
    return;
  }

  // Default server error
  console.error('[ServerError]', err);
  res.status(500).json({ error: 'Internal server error' });
}
