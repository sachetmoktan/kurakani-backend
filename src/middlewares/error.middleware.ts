import type { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { AppError } from '../utils/AppError.js';

export const globalErrorHandler = (err: unknown, req: Request, res: Response, next: NextFunction) => {
  console.error(err);

  // our custom errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Mongoose validation
  if (err instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(err.errors).map(error => ({
      field: error.path,
      message: error.message,
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  // Mongoose CastError
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({
      success: false,
      message: `Invalid ${err.path}: ${err.value}`,
    });
  }

  // MongoDB duplicate key
  if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: number }).code === 11000) {
    const duplicateError = err as {
      keyValue?: Record<string, unknown>;
    };

    const field = duplicateError.keyValue ? Object.keys(duplicateError.keyValue)[0] : 'field';

    return res.status(409).json({
      success: false,
      message: `${field} already exists`,
    });
  }

  // Unknown errors
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
};
