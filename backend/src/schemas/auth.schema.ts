import { z } from 'zod';

export const loginSchema = z.object({
  phone: z.string().trim().min(1, 'Phone number or username cannot be empty'),
  password: z.string().min(1, 'Password cannot be empty'),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name must be under 100 characters'),
  phone: z.string().trim().min(3, 'Phone must be at least 3 characters').max(20, 'Phone must be under 20 characters'),
  password: z.string().min(4, 'Password must be at least 4 characters').max(100, 'Password must be under 100 characters'),
  role: z.enum(['FARMER', 'OFFICER', 'ADMIN']).optional().default('FARMER'),
  language: z.enum(['en', 'hi']).optional().default('hi'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
