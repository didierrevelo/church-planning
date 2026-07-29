import express from 'express';
const router = express.Router();
import { authenticate, requireChurch, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

router.get('/', authenticate, requireChurch, async (req: AuthRequest, res: express.Response) => {
  try {
    const q = (req.query.q as string || '').trim();
    if (!q) return res.json({ services: [], songs: [], members: [], ministries: [] });

    const types = (req.query.types as string || 'services,songs,members,ministries').split(',');

    const [services, songs, members, ministries] = await Promise.all([
      types.includes('services')
        ? prisma.service.findMany({
            where: { churchId: req.churchId, title: { contains: q, mode: 'insensitive' } },
            select: { id: true, title: true, date: true, type: true, status: true },
            orderBy: { date: 'desc' },
            take: 10,
          })
        : [],

      types.includes('songs')
        ? prisma.song.findMany({
            where: { service: { churchId: req.churchId }, title: { contains: q, mode: 'insensitive' } },
            select: { id: true, title: true, key: true, serviceId: true },
            orderBy: { createdAt: 'desc' },
            take: 10,
          })
        : [],

      types.includes('members')
        ? prisma.userChurch.findMany({
            where: {
              churchId: req.churchId,
              user: { name: { contains: q, mode: 'insensitive' } },
            },
            select: { user: { select: { id: true, name: true } }, role: true },
            take: 10,
          })
        : [],

      types.includes('ministries')
        ? prisma.ministry.findMany({
            where: { churchId: req.churchId, name: { contains: q, mode: 'insensitive' } },
            select: { id: true, name: true, isActive: true },
            take: 10,
          })
        : [],
    ]);

    res.json({ services, songs, members, ministries });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
