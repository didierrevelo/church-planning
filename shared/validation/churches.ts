import { z } from 'zod';

export const createChurchSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Church name is required').max(200).trim(),
    slug: z
      .string()
      .min(2, 'Slug must be at least 2 characters')
      .max(50)
      .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
    address: z.string().max(500).optional(),
    phone: z.string().max(20).optional(),
  }),
});

export const updateChurchSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(200).trim().optional(),
    address: z.string().max(500).optional(),
    phone: z.string().max(20).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const addMemberSchema = z.object({
  body: z.object({
    userId: z.string().uuid('Invalid user ID'),
    role: z.enum(['admin', 'leader', 'member'], { message: 'Invalid role' }),
  }),
});

export const updateMemberSchema = z.object({
  body: z.object({
    role: z.enum(['admin', 'leader', 'member'], { message: 'Invalid role' }),
  }),
});
