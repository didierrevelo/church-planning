import express from 'express';
const router = express.Router();
import { authenticate, requireChurch, AuthRequest, publicUserSelect } from '../middleware/auth';
import { prisma } from '../lib/prisma';

router.get('/', authenticate, requireChurch, async (req: AuthRequest, res: express.Response) => {
  try {
    const members = await prisma.userChurch.findMany({
      where: { churchId: req.churchId },
      include: { user: { select: publicUserSelect } },
    });
    res.json(members);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/positions/:serviceId', authenticate, requireChurch, async (req: AuthRequest, res: express.Response) => {
  try {
    const positions = await prisma.positionRequest.findMany({
      where: { serviceId: req.params.serviceId },
      include: {
        ministryRole: true,
        user: { select: publicUserSelect },
      },
    });
    res.json(positions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/positions/:serviceId', authenticate, requireChurch, async (req: AuthRequest, res: express.Response) => {
  try {
    const { ministryRoleId } = req.body;
    const existing = await prisma.positionRequest.findFirst({
      where: { userId: req.userId, serviceId: req.params.serviceId, ministryRoleId },
    });
    if (existing) {
      return res.status(400).json({ error: 'You already have a request for this position' });
    }

    const position = await prisma.positionRequest.create({
      data: {
        userId: req.userId!,
        serviceId: req.params.serviceId,
        ministryRoleId,
      },
      include: { ministryRole: true, user: { select: publicUserSelect } },
    });
    res.status(201).json(position);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:serviceId/members', authenticate, requireChurch, async (req: AuthRequest, res: express.Response) => {
  try {
    const { userId, ministryId, ministryRoleId } = req.body;

    const existing = await prisma.serviceTeam.findFirst({
      where: { serviceId: req.params.serviceId, userId },
    });
    if (existing) return res.status(400).json({ error: 'User already in team' });

    const member = await prisma.serviceTeam.create({
      data: {
        serviceId: req.params.serviceId,
        userId,
      ministryId,
      ministryRoleId,
      },
      include: {
        user: { select: publicUserSelect },
        ministry: true,
        ministryRole: true,
      },
    });
    res.status(201).json(member);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/:serviceId/members/:id', authenticate, requireChurch, async (req: AuthRequest, res: express.Response) => {
  try {
    const { ministryId, roleId, isConfirmed } = req.body;
    const member = await prisma.serviceTeam.update({
      where: { id: req.params.id },
      data: {
        ...(ministryId && { ministryId }),
        ...(roleId !== undefined && { roleId }),
        ...(isConfirmed !== undefined && { isConfirmed }),
      },
      include: {
        user: { select: publicUserSelect },
        ministry: true,
        ministryRole: true,
      },
    });
    res.json(member);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:serviceId/members/:id', authenticate, requireChurch, async (req: AuthRequest, res: express.Response) => {
  try {
    await prisma.serviceTeam.delete({ where: { id: req.params.id } });
    res.json({ message: 'Team member removed' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
