import express from 'express';
const router = express.Router();
import { authenticate, requireChurchAdmin, requireChurch, AuthRequest, publicUserSelect } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createSongSchema, updateSongSchema } from '../validation/songs';
import { prisma } from '../lib/prisma';

router.get('/:serviceId', authenticate, requireChurch, async (req: AuthRequest, res: express.Response) => {
  try {
    const service = await prisma.service.findUnique({
      where: { id: req.params.serviceId },
      select: { churchId: true },
    });
    if (!service || service.churchId !== req.churchId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const songs = await prisma.song.findMany({
      where: { serviceId: req.params.serviceId },
      orderBy: { order: 'asc' },
      include: { updatedBy: { select: publicUserSelect } },
    });
    res.json(songs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:serviceId', authenticate, requireChurch, validate(createSongSchema), async (req: AuthRequest, res: express.Response) => {
  try {
    const service = await prisma.service.findUnique({
      where: { id: req.params.serviceId },
      select: { churchId: true },
    });
    if (!service || service.churchId !== req.churchId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { title, key, lyricsUrl, sheetMusicUrl, youtubeLink } = req.body;
    const lastSong = await prisma.song.findFirst({
      where: { serviceId: req.params.serviceId },
      orderBy: { order: 'desc' },
    });
    const nextOrder = (lastSong?.order || 0) + 1;
    const song = await prisma.song.create({
      data: {
        serviceId: req.params.serviceId,
        order: nextOrder,
        title,
        key: key || null,
        lyricsUrl: lyricsUrl || null,
        sheetMusicUrl: sheetMusicUrl || null,
        youtubeLink: youtubeLink || null,
        updatedById: req.userId,
      },
    });
    res.status(201).json(song);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/:id', authenticate, requireChurch, validate(updateSongSchema), async (req: AuthRequest, res: express.Response) => {
  try {
    const currentSong = await prisma.song.findUnique({
      where: { id: req.params.id },
      include: { service: { select: { churchId: true } } },
    });
    if (!currentSong || currentSong.service.churchId !== req.churchId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { title, order, key, lyricsUrl, sheetMusicUrl, youtubeLink } = req.body;
    const song = await prisma.song.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(order !== undefined && { order }),
        ...(key !== undefined && { key }),
        ...(lyricsUrl !== undefined && { lyricsUrl }),
        ...(sheetMusicUrl !== undefined && { sheetMusicUrl }),
        ...(youtubeLink !== undefined && { youtubeLink }),
        updatedById: req.userId,
      },
    });

    if (key && currentSong.key && key !== currentSong.key) {
      await prisma.songHistory.create({
        data: {
          songId: song.id,
          field: 'key',
          oldValue: currentSong.key,
          newValue: key,
          modifiedById: req.userId,
        },
      });

      const service = await prisma.service.findUnique({
        where: { id: song.serviceId },
        include: { team: { include: { user: true, ministry: true } } },
      });

      if (service) {
        const musicians = service.team.filter((t) => t.ministry.name === 'Alabanza');
        const notifications = musicians.map((m) => ({
          userId: m.userId,
          churchId: service.churchId,
          type: 'song_key_change' as const,
          message: `El tono de "${song.title}" cambió de ${currentSong.key} a ${key}`,
          referenceId: song.id,
          referenceType: 'song' as const,
        }));
        if (notifications.length > 0) {
          await prisma.notification.createMany({ data: notifications });
        }
      }
    }

    res.json(song);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:id/history', authenticate, requireChurch, async (req: AuthRequest, res: express.Response) => {
  try {
    const song = await prisma.song.findUnique({
      where: { id: req.params.id },
      include: { service: { select: { churchId: true } } },
    });
    if (!song || song.service.churchId !== req.churchId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const history = await prisma.songHistory.findMany({
      where: { songId: req.params.id },
      orderBy: { createdAt: 'desc' },
      include: { modifiedBy: { select: publicUserSelect } },
    });
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', authenticate, requireChurch, async (req: AuthRequest, res: express.Response) => {
  try {
    const song = await prisma.song.findUnique({
      where: { id: req.params.id },
      include: { service: { select: { churchId: true } } },
    });
    if (!song || song.service.churchId !== req.churchId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    await prisma.song.delete({ where: { id: req.params.id } });
    res.json({ message: 'Song deleted' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
