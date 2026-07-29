import express from 'express';
const router = express.Router();
import { authenticate, requireChurch, requireChurchAdmin, AuthRequest, publicUserSelect } from '../middleware/auth';
import { assignTeam } from '../services/agent';
import { prisma } from '../lib/prisma';

router.post('/assign-team', authenticate, requireChurch, requireChurchAdmin, async (req: AuthRequest, res: express.Response) => {
  try {
    const { serviceId } = req.body;
    if (!serviceId) return res.status(400).json({ error: 'serviceId required' });

    const result = await assignTeam(req.churchId!, serviceId, req.userId);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/history', authenticate, requireChurch, async (req: AuthRequest, res: express.Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string, 10) || 20);

    const [runs, total] = await Promise.all([
      prisma.agentRun.findMany({
        where: { churchId: req.churchId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.agentRun.count({ where: { churchId: req.churchId } }),
    ]);

    res.json({
      data: runs.map((r) => ({
        ...r,
        input: r.input ? JSON.parse(r.input) : null,
        output: r.output ? JSON.parse(r.output) : null,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
