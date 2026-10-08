import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format').max(255),
    password: z.string().min(6, 'Password must be at least 6 characters').max(128),
  }),
});

export const inviteSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format').max(255),
    name: z.string().min(1, 'Name is required').max(100).trim(),
    phone: z.string().max(20).optional(),
    churchId: z.string().uuid('Invalid church ID'),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters').max(128),
  }),
});

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(100).trim(),
    email: z.string().email('Invalid email format').max(255),
    password: z.string().min(8, 'Password must be at least 8 characters').max(128),
    churchName: z.string().min(1, 'Church name is required').max(200).trim(),
    churchSlug: z
      .string()
      .min(2, 'Slug must be at least 2 characters')
      .max(50)
      .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens')
      .optional(),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(100).trim().optional(),
    phone: z.string().max(20).optional(),
  }),
});
