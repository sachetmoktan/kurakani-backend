import { z } from 'zod';

export const signupSchema = z.object({
  name: z.string().trim().min(10, 'Name must be at least 10 characters long'),
  email: z.email('Please provide a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  // roles: z.array(z.string()).min(1, 'At least one role'),
});

export const loginSchema = z.object({
  email: z.email('Please provide a valid email address'),

  password: z.string().min(1, 'Password is required'),
});

export type TSignupSchema = z.infer<typeof signupSchema>;
export type TLoginSchema = z.infer<typeof loginSchema>;
