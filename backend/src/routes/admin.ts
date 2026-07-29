import express from 'express';
const router = express.Router();
import { PrismaClient } from '@prisma/client';
import { authenticate, requireChurch, requireChurchAdmin, AuthRequest, publicUserSelect } from '../middleware/auth';

const prisma = new PrismaClient();

router.get('/church', authenticate, requireChurch, requireChurchAdmin, async (req: AuthRequest, res: express.Response) => {
  try {
    const church = await prisma.church.findUnique({
      where: { id: req.churchId },
      include: {
        _count: { select: { members: true, ministries: true, services: true } },
      },
    });
    res.json(church);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/members', authenticate, requireChurch, requireChurchAdmin, async (req: AuthRequest, res: express.Response) => {
  try {
    const members = await prisma.userChurch.findMany({
      where: { churchId: req.churchId },
      include: {
        user: { select: publicUserSelect },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(members);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/members/:userId/role', authenticate, requireChurch, requireChurchAdmin, async (req: AuthRequest, res: express.Response) => {
  try {
    const { role } = req.body;
    if (!['admin', 'leader', 'member'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    if (req.params.userId === req.userId) {
      return res.status(400).json({ error: 'Cannot change your own role' });
    }
    const member = await prisma.userChurch.update({
      where: { userId_churchId: { userId: req.params.userId, churchId: req.churchId! } },
      data: { role },
      include: { user: { select: publicUserSelect } },
    });
    res.json(member);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/members/:userId', authenticate, requireChurch, requireChurchAdmin, async (req: AuthRequest, res: express.Response) => {
  try {
    if (req.params.userId === req.userId) {
      return res.status(400).json({ error: 'Cannot remove yourself' });
    }
    await prisma.userChurch.delete({
      where: { userId_churchId: { userId: req.params.userId, churchId: req.churchId! } },
    });
    res.json({ message: 'Member removed' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
