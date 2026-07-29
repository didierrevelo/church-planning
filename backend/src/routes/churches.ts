import express from 'express';
const router = express.Router();
import { PrismaClient } from '@prisma/client';
import { authenticate, requireChurchAdmin, requireChurch, AuthRequest, publicUserSelect } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createChurchSchema, updateChurchSchema, addMemberSchema, updateMemberSchema } from '../validation/churches';

const prisma = new PrismaClient();

router.get('/', authenticate, async (req: AuthRequest, res: express.Response) => {
  try {
    const churches = await prisma.userChurch.findMany({
      where: { userId: req.userId },
      include: { church: true },
    });
    res.json(churches.map((uc) => uc.church));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticate, validate(createChurchSchema), async (req: AuthRequest, res: express.Response) => {
  try {
    const { name, slug, address, phone } = req.body;

    const existing = await prisma.church.findUnique({ where: { slug } });
    if (existing) return res.status(400).json({ error: 'Slug already in use' });

    const church = await prisma.church.create({ data: { name, slug, address, phone } });

    await prisma.userChurch.create({
      data: { userId: req.userId!, churchId: church.id, role: 'admin' },
    });

    res.status(201).json(church);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:id/members', authenticate, requireChurch, async (req: AuthRequest, res: express.Response) => {
  try {
    if (req.churchRole !== 'admin') {
      const myMembership = await prisma.userChurch.findUnique({
        where: { userId_churchId: { userId: req.userId!, churchId: req.params.id } },
        include: { user: { select: publicUserSelect } },
      });
      return res.json(myMembership ? [myMembership] : []);
    }

    const members = await prisma.userChurch.findMany({
      where: { churchId: req.params.id },
      include: { user: { select: publicUserSelect } },
    });
    res.json(members);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/members', authenticate, requireChurchAdmin, validate(addMemberSchema), async (req: AuthRequest, res: express.Response) => {
  try {
    const { userId, role } = req.body;

    const existing = await prisma.userChurch.findUnique({
      where: { userId_churchId: { userId, churchId: req.params.id } },
    });
    if (existing) return res.status(400).json({ error: 'User already a member' });

    const member = await prisma.userChurch.create({
      data: { userId, churchId: req.params.id, role },
      include: { user: { select: publicUserSelect } },
    });
    res.status(201).json(member);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/:id/members/:userId', authenticate, requireChurchAdmin, validate(updateMemberSchema), async (req: AuthRequest, res: express.Response) => {
  try {
    const { role } = req.body;
    const member = await prisma.userChurch.update({
      where: { userId_churchId: { userId: req.params.userId, churchId: req.params.id } },
      data: { role },
      include: { user: { select: publicUserSelect } },
    });
    res.json(member);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id/members/:userId', authenticate, requireChurchAdmin, async (req: AuthRequest, res: express.Response) => {
  try {
    if (req.params.userId === req.userId) {
      return res.status(400).json({ error: 'Cannot remove yourself' });
    }
    await prisma.userChurch.delete({
      where: { userId_churchId: { userId: req.params.userId, churchId: req.params.id } },
    });
    res.json({ message: 'Member removed' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/:id', authenticate, requireChurchAdmin, validate(updateChurchSchema), async (req: AuthRequest, res: express.Response) => {
  try {
    const { name, address, phone, isActive } = req.body;
    const church = await prisma.church.update({
      where: { id: req.params.id },
      data: { ...(name && { name }), ...(address !== undefined && { address }), ...(phone !== undefined && { phone }), ...(isActive !== undefined && { isActive }) },
    });
    res.json(church);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
