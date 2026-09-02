import type { Request, Response } from 'express';
import User from '../models/user.model.js';
import { generateJWTToken, hashedPasswordCompare, passwordHasher } from '../service/auth.service.js';

export const handleGetAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find({}, { name: 1, email: 1 });
    return res.status(200).json({ data: users, message: 'Users fetched successfully' });
  } catch (err) {
    return res.status(500).json({
      error: 'Users fetching failed',
    });
  }
};

export const handleCreateUser = async (req: Request, res: Response) => {
  const { name, password, email } = req.body;
  if (!name || !password || !email) {
    return res.status(400).json({
      error: 'Name, Email and Password are required',
    });
  }
  try {
    const emailExists = await User.findOne({ email }, { name: 1, email: 1 });
    if (emailExists)
      return res.status(400).json({
        error: 'User with provided email already exists',
      });

    const hashedPassword = await passwordHasher(password);
    if (!hashedPassword) {
      return res.status(500).json({
        error: 'Password hashing failed',
      });
    }

    const result = await User.create({
      name,
      email,
      password: hashedPassword,
    });
    return res.status(201).json({ data: result, message: 'Success!' });
  } catch (err) {
    // need to add custom error handler middleware
    if (err && typeof err === 'object' && 'errorResponse' in err) {
      const errorResponse = err.errorResponse;

      console.log('ErrHere', errorResponse);

      return res.status(400).json({
        error: errorResponse,
      });
    }

    return res.status(500).json({
      error: 'Something went wrong',
    });
  }
};

export const handleLoginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email or Password is missing' });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Email or Password is incorrect' });
    }

    const isPasswordMatching = await hashedPasswordCompare(password, user.password);
    if (!isPasswordMatching) {
      return res.status(400).json({
        error: 'Email or Password is incorrect',
      });
    }

    const token = generateJWTToken({ userId: `${user._id}`, email: user.email });

    return res.status(200).json({
      data: {
        access_token: token,
      },
      message: 'Login Successful',
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Something went wrong',
    });
  }
};
