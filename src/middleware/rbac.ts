import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../config/constants';

/**
 * Requires the logged-in user to have at least one of the allowed roles.
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized: Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Forbidden: Access restricted to [${allowedRoles.join(', ')}]`,
      });
      return;
    }

    next();
  };
}
