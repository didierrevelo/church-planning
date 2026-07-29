import express from 'express';
const router = express.Router();
import { authenticate, requireChurch, requireChurchAdmin, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

router.get('/dashboard', authenticate, requireChurch, async (req: AuthRequest, res: express.Response) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [
      totalServices,
      servicesThisMonth,
      servicesThisYear,
      totalSongs,
      totalMembers,
      totalMinistries,
      upcomingServices,
      recentServices,
    ] = await Promise.all([
      prisma.service.count({ where: { churchId: req.churchId } }),
      prisma.service.count({ where: { churchId: req.churchId, date: { gte: startOfMonth } } }),
      prisma.service.count({ where: { churchId: req.churchId, date: { gte: startOfYear } } }),
      prisma.song.count({ where: { service: { churchId: req.churchId } } }),
      prisma.userChurch.count({ where: { churchId: req.churchId } }),
      prisma.ministry.count({ where: { churchId: req.churchId, isActive: true } }),
      prisma.service.findMany({
        where: { churchId: req.churchId, date: { gte: now } },
        orderBy: { date: 'asc' },
        take: 5,
        select: { id: true, title: true, date: true, status: true },
      }),
      prisma.service.findMany({
        where: { churchId: req.churchId },
        orderBy: { date: 'desc' },
        take: 5,
        select: { id: true, title: true, date: true, status: true, type: true },
      }),
    ]);

    res.json({
      totalServices,
      servicesThisMonth,
      servicesThisYear,
      totalSongs,
      totalMembers,
      totalMinistries,
      upcomingServices,
      recentServices,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/monthly', authenticate, requireChurch, requireChurchAdmin, async (req: AuthRequest, res: express.Response) => {
  try {
    const year = parseInt(req.query.year as string, 10) || new Date().getFullYear();

    const services = await prisma.service.findMany({
      where: {
        churchId: req.churchId,
        date: {
          gte: new Date(year, 0, 1),
          lt: new Date(year + 1, 0, 1),
        },
      },
      select: { id: true, title: true, date: true, type: true, status: true },
      orderBy: { date: 'asc' },
    });

    const monthly = Array.from({ length: 12 }, (_, i) => {
      const monthServices = services.filter(
        (s) => new Date(s.date).getMonth() === i,
      );
      return {
        month: i + 1,
        label: new Date(year, i).toLocaleString('es-ES', { month: 'long' }),
        count: monthServices.length,
        worship: monthServices.filter((s) => s.type === 'worship').length,
        youth: monthServices.filter((s) => s.type === 'youth').length,
        other: monthServices.filter((s) => s.type !== 'worship' && s.type !== 'youth').length,
      };
    });

    res.json({ year, monthly, total: services.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
