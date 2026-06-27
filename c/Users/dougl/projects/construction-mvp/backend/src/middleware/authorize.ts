import type { Request, Response, NextFunction } from 'express';
import type { Role } from '@prisma/client';
import { ForbiddenError } from '../utils/errors.js';

export function authorize(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new ForbiddenError('Authentication required');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError(
        `Role '${req.user.role}' is not authorized to access this resource`
      );
    }

    next();
  };
}
