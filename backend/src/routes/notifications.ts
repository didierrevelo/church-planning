import express from 'express';
const router = express.Router();
import { authenticate, requireChurch, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

router.get('/', authenticate, requireChurch, async (req: AuthRequest, res: express.Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 20));

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: req.userId, churchId: req.churchId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({
        where: { userId: req.userId, churchId: req.churchId },
      }),
    ]);

    res.json({
      data: notifications,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/unread-count', authenticate, requireChurch, async (req: AuthRequest, res: express.Response) => {
  try {
    const count = await prisma.notification.count({
      where: { userId: req.userId, churchId: req.churchId, read: false },
    });
    res.json({ count });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id/read', authenticate, async (req: AuthRequest, res: express.Response) => {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: req.params.id },
    });
    if (!notification || notification.userId !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updated = await prisma.notification.update({
      where: { id: req.params.id },
      data: { read: true },
    });
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/read-all', authenticate, requireChurch, async (req: AuthRequest, res: express.Response) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.userId, churchId: req.churchId, read: false },
      data: { read: true },
    });
    res.json({ message: 'All notifications marked as read' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/register-token', authenticate, requireChurch, async (req: AuthRequest, res: express.Response) => {
  try {
    const { token, platform } = req.body;
    if (!token) return res.status(400).json({ error: 'Token is required' });

    await prisma.pushToken.upsert({
      where: { userId_churchId_token: { userId: req.userId!, churchId: req.churchId!, token } },
      update: { platform: platform || 'expo' },
      create: { userId: req.userId!, churchId: req.churchId!, token, platform: platform || 'expo' },
    });
    res.json({ message: 'Token registered' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/unregister-token', authenticate, requireChurch, async (req: AuthRequest, res: express.Response) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token is required' });

    await prisma.pushToken.deleteMany({
      where: { token, userId: req.userId!, churchId: req.churchId! },
    });
    res.json({ message: 'Token unregistered' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
