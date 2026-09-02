import bcrypt from 'bcrypt';
import jwt, { type SignOptions } from 'jsonwebtoken';
import type { JWTPayload } from '../types/auth.types.js';

export const passwordHasher = async (password: string) => {
  const bcrypt_salt = process.env.BCRYPT_SALT || 10;
  try {
    const salt = await bcrypt.genSalt(Number(bcrypt_salt));
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  } catch (err) {
    console.log('Password Hashing Failed: ', err);
    return null;
  }
};

export const hashedPasswordCompare = async (password1: string, password2: string) => {
  try {
    return await bcrypt.compare(password1, password2);
  } catch (err) {
    console.log('Password Comparing Failed: ', err);
    return false;
  }
};

export const generateJWTToken = (payload: JWTPayload) => {
  const secret = process.env.JWT_SECRET_KEY!;
  const expiresIn = process.env.TOKEN_EXPIRES as SignOptions['expiresIn'];
  return jwt.sign(payload, secret, { ...(expiresIn && { expiresIn }) });
};

export const verifyJWTToken = (token: string) => {
  try {
    const secret = process.env.JWT_SECRET_KEY!;
    return jwt.verify(token, secret);
  } catch (err) {
    console.log('Verify Err: ', err);
    return null;
  }
};
