import type { User } from '../service/auth.service.ts';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
    interface Response {
      success: (data?: unknown, message?: string, statusCode?: number) => Response;
    }
  }
}

export {};
