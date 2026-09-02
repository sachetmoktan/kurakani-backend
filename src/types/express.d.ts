import type { User } from '../service/auth.service.ts';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export {};
