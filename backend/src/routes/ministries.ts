import express from 'express';
const router = express.Router();
import { PrismaClient } from '@prisma/client';
import { authenticate, requireChurchAdmin, requireChurch, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createMinistrySchema, updateMinistrySchema, createRoleSchema, updateRoleSchema } from '../validation/ministries';

const prisma = new PrismaClient();

router.get('/', authenticate, requireChurch, async (req: AuthRequest, res: express.Response) => {
  try {
    const ministries = await prisma.ministry.findMany({
      where: { churchId: req.churchId, isActive: true },
      include: {
        roles: { where: { isActive: true } },
        _count: { select: { userMinistryRoles: true } },
      },
    });
    res.json(ministries);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticate, requireChurch, requireChurchAdmin, validate(createMinistrySchema), async (req: AuthRequest, res: express.Response) => {
  try {
    const { name } = req.body;
    const ministry = await prisma.ministry.create({
      data: { churchId: req.churchId!, name },
    });
    res.status(201).json(ministry);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/:id', authenticate, requireChurch, requireChurchAdmin, validate(updateMinistrySchema), async (req: AuthRequest, res: express.Response) => {
  try {
    const { name, isActive } = req.body;
    const ministry = await prisma.ministry.update({
      where: { id: req.params.id },
      data: { ...(name && { name }), ...(isActive !== undefined && { isActive }) },
    });
    res.json(ministry);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:id/roles', authenticate, requireChurch, async (req: AuthRequest, res: express.Response) => {
  try {
    const roles = await prisma.ministryRole.findMany({
      where: { ministryId: req.params.id, isActive: true },
    });
    res.json(roles);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/roles', authenticate, requireChurch, requireChurchAdmin, validate(createRoleSchema), async (req: AuthRequest, res: express.Response) => {
  try {
    const { name } = req.body;
    const role = await prisma.ministryRole.create({
      data: { name, ministryId: req.params.id },
    });
    res.status(201).json(role);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/roles/:id', authenticate, requireChurch, requireChurchAdmin, validate(updateRoleSchema), async (req: AuthRequest, res: express.Response) => {
  try {
    const { name, isActive } = req.body;
    const role = await prisma.ministryRole.update({
      where: { id: req.params.id },
      data: { ...(name && { name }), ...(isActive !== undefined && { isActive }) },
    });
    res.json(role);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
