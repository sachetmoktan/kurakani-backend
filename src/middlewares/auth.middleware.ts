import type { NextFunction, Request, Response } from 'express';
import User from '../models/user.model.js';
import { AppError } from '../utils/AppError.js';

// JWT Based
// const checkAuth = async (req: Request, res: Response, next: NextFunction) => {
//   const authorization = req.headers?.authorization;
//   if (!authorization || !authorization.startsWith('Bearer')) return res.redirect('/login');
//   const accessToken = authorization.split('Bearer ')[1];
//   if (!accessToken) return res.redirect('/login');

//   const user = verifyJWTToken(accessToken);
//   if (!user) return res.redirect('/login');

//   req.user = user;
//   next();
// };

const checkAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    if (!req.session.userId) {
      throw new AppError('Authentication required', 401);
    }

    const user = await User.findById(req.session.userId).select('-password');
    if (!user) {
      throw new AppError('User no longer exists', 401);
    }
    req.user = user;
    next();
  } catch (error) {
    // throw new AppError('Authentication failed', 500);
  }
};

export const requiredRoles = (...allowedRoles: String[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }
    const hasRole = req.user.roles.some(role => allowedRoles.includes(role));
    if (!hasRole) {
      throw new AppError('You do not have permission', 403);
    }
    next();
  };
};

export default checkAuth;
