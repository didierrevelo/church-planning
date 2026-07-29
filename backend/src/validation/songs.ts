import { z } from 'zod';

export const createSongSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(200).trim(),
    key: z.string().max(10).optional(),
    lyricsUrl: z.string().url('Invalid URL').max(500).optional().or(z.literal('')),
    sheetMusicUrl: z.string().url('Invalid URL').max(500).optional().or(z.literal('')),
    youtubeLink: z.string().url('Invalid URL').max(500).optional().or(z.literal('')),
  }),
});

export const updateSongSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200).trim().optional(),
    order: z.number().int().min(0).optional(),
    key: z.string().max(10).optional(),
    lyricsUrl: z.string().url('Invalid URL').max(500).optional().nullable(),
    sheetMusicUrl: z.string().url('Invalid URL').max(500).optional().nullable(),
    youtubeLink: z.string().url('Invalid URL').max(500).optional().nullable(),
  }),
});
