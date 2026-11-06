import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export function createRateLimiter(options: { windowMs: number; max: number; message?: string }) {
  const ipMap = new Map<string, RateLimitRecord>();

  // Cleanup expired entries every minute
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of ipMap.entries()) {
      if (now > record.resetTime) {
        ipMap.delete(ip);
      }
    }
  }, 60000).unref();

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const existing = ipMap.get(ip);

    if (!existing || now > existing.resetTime) {
      ipMap.set(ip, {
        count: 1,
        resetTime: now + options.windowMs,
      });
      next();
      return;
    }

    if (existing.count >= options.max) {
      res.status(429).json({
        error: options.message || 'Too many requests, please try again later.',
      });
      return;
    }

    existing.count += 1;
    next();
  };
}
