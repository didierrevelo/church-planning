import { z } from 'zod';

export const createServiceSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(200).trim(),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date format'),
    time: z.string().max(20).optional(),
    type: z.string().max(50).optional(),
    notes: z.string().max(5000).optional(),
    templateId: z.string().uuid().optional(),
  }),
});

export const updateServiceSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200).trim().optional(),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date format').optional(),
    time: z.string().max(20).optional(),
    type: z.string().max(50).optional(),
    status: z.enum(['draft', 'planned', 'confirmed', 'completed', 'cancelled']).optional(),
    notes: z.string().max(5000).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const createTeamMemberSchema = z.object({
  body: z.object({
    userId: z.string().uuid('Invalid user ID'),
    ministryId: z.string().uuid('Invalid ministry ID'),
    roleId: z.string().uuid('Invalid role ID').optional(),
    ministryRoleId: z.string().uuid('Invalid ministry role ID').optional(),
  }),
});

export const updateTeamMemberSchema = z.object({
  body: z.object({
    ministryId: z.string().uuid('Invalid ministry ID').optional(),
    roleId: z.string().uuid('Invalid role ID').optional(),
    ministryRoleId: z.string().uuid('Invalid ministry role ID').optional(),
    status: z.string().optional(),
    note: z.string().optional(),
    isConfirmed: z.boolean().optional(),
  }),
});

export const createSegmentSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(200).trim(),
    order: z.number().int().min(0).optional(),
    duration: z.number().int().min(0).optional(),
    durationMin: z.number().int().min(0).optional(),
    notes: z.string().max(2000).optional(),
    ministryId: z.string().uuid().optional().nullable(),
    responsibleId: z.string().uuid().optional().nullable(),
  }),
});

export const updateSegmentSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200).trim().optional(),
    order: z.number().int().min(0).optional(),
    duration: z.number().int().min(0).optional(),
    durationMin: z.number().int().min(0).optional(),
    notes: z.string().max(2000).optional(),
    ministryId: z.string().uuid().optional().nullable(),
    responsibleId: z.string().uuid().optional().nullable(),
  }),
});
