import type { NextFunction, Request, Response } from 'express';
import User from '../models/user.model.js';
import { hashedPasswordCompare, passwordHasher } from '../service/auth.service.js';
import { AppError } from '../utils/AppError.js';
import { successResponse } from '../utils/SuccessResponse.js';

export const handleGetAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await User.find({}, { name: 1, email: 1 });
    return successResponse(res, users, 'Users fetched successfully', 200);
  } catch (err) {
    next(err);
  }
};

export const handleCreateUser = async (req: Request, res: Response, next: NextFunction) => {
  const { name, password, email } = req.body;
  if (!name || !password || !email) {
    throw new AppError('Name, Email and Password are required', 400);
  }
  try {
    const emailExists = await User.findOne({ email }, { name: 1, email: 1 });
    if (emailExists) throw new AppError('User with provided email already exists', 400);

    const hashedPassword = await passwordHasher(password);
    if (!hashedPassword) {
      throw new AppError('Password hashing failed', 500);
    }

    const result = await User.create({
      name,
      email,
      password: hashedPassword,
    });
    return successResponse(res, result, 'User signup success', 200);
  } catch (err) {
    // // need to add custom error handler middleware
    // if (err && typeof err === 'object' && 'errorResponse' in err) {
    //   const errorResponse = err.errorResponse;

    //   console.log('ErrHere', errorResponse);

    //   return res.status(400).json({
    //     error: errorResponse,
    //   });
    // }
    // console.log('Errprsd', err);
    // return res.status(500).json({
    //   error: 'Something went wrong',
    // });
    next(err);
  }
};

export const handleLoginUser = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req?.body;
  if (!email || !password) {
    throw new AppError('Email or Password is missing', 400);
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError('Email or Password is incorrect', 400);
    }

    const isPasswordMatching = await hashedPasswordCompare(password, user.password);
    if (!isPasswordMatching) {
      throw new AppError('Email or Password is incorrect', 400);
    }

    // JWT Implementation:
    // const token = generateJWTToken({ userId: `${user._id}`, email: user.email });
    // return successResponse(res, { access_token: token }, 'Login Successful', 200);

    // Session Implementation:
    req.session.regenerate(err => {
      if (err) {
        throw new AppError('Could not create session', 500);
      }

      req.session.userId = user._id.toString();

      req.session.save(err => {
        if (err) {
          throw new AppError('Could not save session', 500);
        }
        const data = {
          _id: user._id,
          email: user.email,
          // name: user.name,
          // roles: user.roles,
        };
        return successResponse(res, data, 'Login Successful', 200);
      });
    });
  } catch (err) {
    next(err);
  }
};

export const handleLogoutUser = async (req: Request, res: Response, next: NextFunction) => {
  req.session.destroy(err => {
    if (err) {
      throw new AppError('Could not logout', 500);
    }

    res.clearCookie('connect.sid');
    return successResponse(res, null, 'Logout successful', 200);
  });
};

export const handleSessionValidCheck = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    throw new AppError('Unauthorizedd', 401);
  }

  const user = await User.findById(req.session.userId).select('-password');

  if (!user) {
    throw new AppError('Unauthorizedddd', 401);
  }

  return successResponse(res, user, 'Session Valid', 200);
};
