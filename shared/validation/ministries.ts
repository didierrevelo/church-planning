import { z } from 'zod';

export const createMinistrySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(100).trim(),
  }),
});

export const updateMinistrySchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).trim().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const createRoleSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Role name is required').max(100).trim(),
  }),
});

export const updateRoleSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).trim().optional(),
    isActive: z.boolean().optional(),
  }),
});
