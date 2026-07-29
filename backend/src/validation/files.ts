import { z } from 'zod';

const ALLOWED_TYPES = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png', 'gif', 'mp3', 'mp4', 'txt'];

export const uploadFileSchema = z.object({
  body: z.object({
    filename: z
      .string()
      .min(1, 'Filename is required')
      .max(255)
      .regex(/^[a-zA-Z0-9_\-.() ]+$/, 'Filename contains invalid characters')
      .refine(
        (val) => ALLOWED_TYPES.some((t) => val.toLowerCase().endsWith(`.${t}`)),
        `File type not allowed. Allowed: ${ALLOWED_TYPES.join(', ')}`
      ),
    filetype: z.string().min(1, 'File type is required').max(100),
    filesize: z.number().int().min(1, 'File size must be > 0').max(50 * 1024 * 1024, 'File size exceeds 50MB limit'),
    ministryId: z.string().uuid('Invalid ministry ID').optional().nullable(),
  }),
});

export const deleteFileSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid file ID'),
  }),
});
