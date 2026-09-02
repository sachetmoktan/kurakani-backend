import type { NextFunction, Request, Response } from 'express';
import User from '../models/user.model.js';
import { generateJWTToken, hashedPasswordCompare, passwordHasher } from '../service/auth.service.js';
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
  const { email, password } = req.body;
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

    const token = generateJWTToken({ userId: `${user._id}`, email: user.email });

    return successResponse(res, { access_token: token }, 'Login Successful', 200);
  } catch (err) {
    next(err);
  }
};
