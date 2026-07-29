import { z } from 'zod';

export const createTemplateSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(200).trim(),
    description: z.string().max(1000).optional(),
    segments: z.array(z.object({
      title: z.string().min(1, 'Segment title required').max(200).trim(),
      durationMin: z.number().int().min(0).optional(),
      notes: z.string().max(2000).optional(),
      ministryId: z.string().uuid().optional().nullable(),
    })).min(1, 'At least one segment required'),
  }),
});

export const updateTemplateSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(200).trim().optional(),
    description: z.string().max(1000).optional(),
    segments: z.array(z.object({
      id: z.string().uuid().optional(),
      title: z.string().min(1).max(200).trim(),
      durationMin: z.number().int().min(0).optional(),
      notes: z.string().max(2000).optional(),
      ministryId: z.string().uuid().optional().nullable(),
    })).optional(),
  }),
});

export const applyTemplateSchema = z.object({
  body: z.object({
    templateId: z.string().uuid('Invalid template ID'),
  }),
});

export const reorderSegmentsSchema = z.object({
  body: z.object({
    segmentIds: z.array(z.string().uuid()).min(1, 'At least one segment required'),
  }),
});
