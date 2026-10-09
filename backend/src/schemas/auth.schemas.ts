import { z } from 'zod';

/**
 * Password policy per PRD OD-13 & AUTH-002:
 * 8 to 72 characters, at least one letter and at least one digit.
 */
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long.')
  .max(72, 'Password cannot exceed 72 characters.')
  .regex(/[A-Za-z]/, 'Password must contain at least one letter.')
  .regex(/[0-9]/, 'Password must contain at least one digit.');

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(1, 'Full name is required.')
      .max(100, 'Full name cannot exceed 100 characters.')
      .optional(),
    name: z
      .string()
      .trim()
      .min(1, 'Full name is required.')
      .max(100, 'Full name cannot exceed 100 characters.')
      .optional(),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('Please enter a valid email address.')
      .max(254, 'Email cannot exceed 254 characters.'),
    password: passwordSchema,
  })
  .transform((data) => ({
    fullName: (data.fullName || data.name || '').trim(),
    email: data.email,
    password: data.password,
  }))
  .refine((data) => data.fullName.length >= 1, {
    message: 'Full name is required.',
    path: ['fullName'],
  })
  .refine((data) => data.fullName.length <= 100, {
    message: 'Full name cannot exceed 100 characters.',
    path: ['fullName'],
  });

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
