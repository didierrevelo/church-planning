import express from 'express';
const router = express.Router();
import { authenticate, requireChurch, requireChurchAdmin, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createTemplateSchema, updateTemplateSchema, applyTemplateSchema } from '../validation/templates';
import { prisma } from '../lib/prisma';

router.get('/', authenticate, requireChurch, async (req: AuthRequest, res: express.Response) => {
  try {
    const templates = await prisma.serviceTemplate.findMany({
      where: { churchId: req.churchId },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: { select: { segments: true, services: true } },
        segments: { orderBy: { order: 'asc' } },
      },
    });
    res.json(templates);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticate, requireChurch, requireChurchAdmin, validate(createTemplateSchema), async (req: AuthRequest, res: express.Response) => {
  try {
    const { name, description, segments } = req.body;
    const template = await prisma.serviceTemplate.create({
      data: {
        churchId: req.churchId!,
        name,
        description,
        segments: {
          create: segments.map((seg: any, index: number) => ({
            order: index + 1,
            title: seg.title,
            durationMin: seg.durationMin,
            notes: seg.notes,
            ministryId: seg.ministryId,
          })),
        },
      },
      include: { segments: { orderBy: { order: 'asc' } } },
    });
    res.status(201).json(template);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:id', authenticate, requireChurch, async (req: AuthRequest, res: express.Response) => {
  try {
    const template = await prisma.serviceTemplate.findUnique({
      where: { id: req.params.id },
      include: { segments: { orderBy: { order: 'asc' }, include: { ministry: true } } },
    });
    if (!template || template.churchId !== req.churchId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.json(template);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id', authenticate, requireChurch, requireChurchAdmin, validate(updateTemplateSchema), async (req: AuthRequest, res: express.Response) => {
  try {
    const template = await prisma.serviceTemplate.findUnique({ where: { id: req.params.id } });
    if (!template || template.churchId !== req.churchId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { name, description, segments } = req.body;

    const updated = await prisma.serviceTemplate.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(segments && {
          segments: {
            deleteMany: {},
            create: segments.map((seg: any, index: number) => ({
              order: index + 1,
              title: seg.title,
              durationMin: seg.durationMin,
              notes: seg.notes,
              ministryId: seg.ministryId,
            })),
          },
        }),
      },
      include: { segments: { orderBy: { order: 'asc' } } },
    });
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', authenticate, requireChurch, requireChurchAdmin, async (req: AuthRequest, res: express.Response) => {
  try {
    const template = await prisma.serviceTemplate.findUnique({ where: { id: req.params.id } });
    if (!template || template.churchId !== req.churchId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    await prisma.serviceTemplate.delete({ where: { id: req.params.id } });
    res.json({ message: 'Template deleted' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:id/apply/:serviceId', authenticate, requireChurch, requireChurchAdmin, async (req: AuthRequest, res: express.Response) => {
  try {
    const template = await prisma.serviceTemplate.findUnique({
      where: { id: req.params.id },
      include: { segments: { orderBy: { order: 'asc' } } },
    });
    if (!template || template.churchId !== req.churchId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const service = await prisma.service.findUnique({ where: { id: req.params.serviceId } });
    if (!service || service.churchId !== req.churchId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.serviceSegment.deleteMany({ where: { serviceId: req.params.serviceId } });

    await prisma.serviceSegment.createMany({
      data: template.segments.map((seg) => ({
        serviceId: req.params.serviceId,
        order: seg.order,
        title: seg.title,
        durationMin: seg.durationMin,
        notes: seg.notes,
        ministryId: seg.ministryId,
      })),
    });

    const updatedService = await prisma.service.findUnique({
      where: { id: req.params.serviceId },
      include: { segments: { orderBy: { order: 'asc' } } },
    });

    res.json(updatedService);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
