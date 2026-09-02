import type { Response } from 'express';
export const successResponse = (res: Response, data: unknown = null, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};
