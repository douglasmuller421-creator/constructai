// This file must be included in tsconfig "include"
// It augments the Express Request interface globally

import type { Role } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: Role;
        companyId: string | null;
      };
    }
  }
}

export {};