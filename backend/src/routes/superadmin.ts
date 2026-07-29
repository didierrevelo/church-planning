import express from 'express';
const router = express.Router();
import { PrismaClient } from '@prisma/client';
import { authenticate, requireSuperAdmin, AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

router.get('/churches', authenticate, requireSuperAdmin, async (req: AuthRequest, res: express.Response) => {
  try {
    const churches = await prisma.church.findMany({
      include: {
        _count: { select: { members: true, services: true, ministries: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(churches);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/users', authenticate, requireSuperAdmin, async (req: AuthRequest, res: express.Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        isSuperAdmin: true,
        createdAt: true,
        churches: {
          include: { church: { select: { id: true, name: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/users/:userId/role', authenticate, requireSuperAdmin, async (req: AuthRequest, res: express.Response) => {
  try {
    const { isSuperAdmin } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.userId },
      data: { isSuperAdmin: !!isSuperAdmin },
      select: { id: true, name: true, email: true, isSuperAdmin: true },
    });
    res.json(user);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
