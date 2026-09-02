import type { NextFunction, Request, Response } from 'express';
import { verifyJWTToken } from '../service/auth.service.js';

const checkAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authorization = req.headers?.authorization;
  if (!authorization || !authorization.startsWith('Bearer')) return res.redirect('/login');
  const accessToken = authorization.split('Bearer ')[1];
  if (!accessToken) return res.redirect('/login');

  const user = verifyJWTToken(accessToken);
  if (!user) return res.redirect('/login');

  req.user = user;
  next();
};

export default checkAuth;
