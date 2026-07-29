import express from 'express';
const router = express.Router();
import { authenticate, requireChurchAdmin, requireChurch, AuthRequest, publicUserSelect } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createServiceSchema, updateServiceSchema, createSegmentSchema } from '../validation/services';
import { reorderSegmentsSchema } from '../validation/templates';
import { jobQueue } from '../services/background';
import { prisma } from '../lib/prisma';

router.get('/', authenticate, requireChurch, async (req: AuthRequest, res: express.Response) => {
  try {
    const { page = '1', limit = '20', status, dateFrom, dateTo } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where: any = { churchId: req.churchId };
    if (status) where.status = status;
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom as string);
      if (dateTo) where.date.lte = new Date(dateTo as string);
    }

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        orderBy: { date: 'asc' },
        skip,
        take: limitNum,
        include: {
          _count: { select: { team: true, songs: true, files: true } },
        },
      }),
      prisma.service.count({ where }),
    ]);

    res.json({
      data: services,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', authenticate, requireChurch, async (req: AuthRequest, res: express.Response) => {
  try {
    const service = await prisma.service.findUnique({
      where: { id: req.params.id },
      include: {
        segments: {
          orderBy: { order: 'asc' },
          include: { ministry: true, responsible: true },
        },
        team: {
          include: {
            user: { select: publicUserSelect },
            ministry: true,
            ministryRole: true,
          },
        },
        songs: { orderBy: { order: 'asc' } },
        files: {
          orderBy: { createdAt: 'desc' },
          include: { uploadedBy: { select: publicUserSelect } },
        },
        positionRequests: {
          include: {
            ministryRole: true,
            user: { select: publicUserSelect },
          },
        },
      },
    });

    if (!service) return res.status(404).json({ error: 'Service not found' });
    if (service.churchId !== req.churchId) return res.status(403).json({ error: 'Access denied' });

    const teamByMinistry = service.team.reduce((acc: any, member) => {
      const ministryName = member.ministry.name;
      if (!acc[ministryName]) acc[ministryName] = [];
      acc[ministryName].push(member);
      return acc;
    }, {});

    res.json({ ...service, teamByMinistry });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticate, requireChurch, requireChurchAdmin, validate(createServiceSchema), async (req: AuthRequest, res: express.Response) => {
  try {
    const { title, date, templateId } = req.body;
    const service = await prisma.service.create({
      data: {
        title,
        churchId: req.churchId!,
        date: new Date(date),
        createdBy: req.userId!,
        ...(templateId && { templateId }),
      },
    });

    res.status(201).json(service);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/:id', authenticate, requireChurch, requireChurchAdmin, validate(updateServiceSchema), async (req: AuthRequest, res: express.Response) => {
  try {
    const service = await prisma.service.findUnique({ where: { id: req.params.id } });
    if (!service || service.churchId !== req.churchId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { title, date, status, notes } = req.body;
    const updated = await prisma.service.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(date && { date: new Date(date) }),
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
      },
    });

    if (status === 'confirmed') {
      jobQueue.enqueue('notify-team', { serviceId: service.id, churchId: req.churchId });
    }

    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', authenticate, requireChurch, requireChurchAdmin, async (req: AuthRequest, res: express.Response) => {
  try {
    const service = await prisma.service.findUnique({ where: { id: req.params.id } });
    if (!service || service.churchId !== req.churchId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    await prisma.service.delete({ where: { id: req.params.id } });
    res.json({ message: 'Service deleted' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:id/segments', authenticate, requireChurch, async (req: AuthRequest, res: express.Response) => {
  try {
    const segments = await prisma.serviceSegment.findMany({
      where: { serviceId: req.params.id },
      orderBy: { order: 'asc' },
      include: { ministry: true, responsible: true },
    });
    res.json(segments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/segments', authenticate, requireChurch, requireChurchAdmin, validate(createSegmentSchema), async (req: AuthRequest, res: express.Response) => {
  try {
    const { title, order, duration, notes } = req.body;
    const lastSegment = order !== undefined ? null : await prisma.serviceSegment.findFirst({
      where: { serviceId: req.params.id },
      orderBy: { order: 'desc' },
    });
    const nextOrder = order ?? ((lastSegment?.order || 0) + 1);

    const segment = await prisma.serviceSegment.create({
      data: {
        serviceId: req.params.id,
        order: nextOrder,
        title,
        durationMin: duration,
        notes,
      },
    });
    res.status(201).json(segment);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/segments/:id', authenticate, requireChurch, requireChurchAdmin, async (req: AuthRequest, res: express.Response) => {
  try {
    const { order, title, durationMin, notes, ministryId, responsibleId } = req.body;
    const segment = await prisma.serviceSegment.update({
      where: { id: req.params.id },
      data: {
        ...(order !== undefined && { order }),
        ...(title && { title }),
        ...(durationMin !== undefined && { durationMin }),
        ...(notes !== undefined && { notes }),
        ...(ministryId !== undefined && { ministryId }),
        ...(responsibleId !== undefined && { responsibleId }),
      },
    });
    res.json(segment);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/segments/:id', authenticate, requireChurch, requireChurchAdmin, async (req: AuthRequest, res: express.Response) => {
  try {
    await prisma.serviceSegment.delete({ where: { id: req.params.id } });
    res.json({ message: 'Segment deleted' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/:id/reorder-segments', authenticate, requireChurch, requireChurchAdmin, validate(reorderSegmentsSchema), async (req: AuthRequest, res: express.Response) => {
  try {
    const { segmentIds } = req.body;
    const service = await prisma.service.findUnique({ where: { id: req.params.id } });
    if (!service || service.churchId !== req.churchId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updates = segmentIds.map((id: string, index: number) =>
      prisma.serviceSegment.update({
        where: { id },
        data: { order: index + 1 },
      })
    );

    await prisma.$transaction(updates);

    const segments = await prisma.serviceSegment.findMany({
      where: { serviceId: req.params.id },
      orderBy: { order: 'asc' },
    });
    res.json(segments);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
