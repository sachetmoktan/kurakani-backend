import 'express-session';
import type { TUser } from '../models/user.model.ts';

declare global {
  namespace Express {
    interface Request {
      user?: TUser;
    }
    interface Response {
      success: (data?: unknown, message?: string, statusCode?: number) => Response;
    }
  }
}

export {};
