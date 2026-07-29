import express from 'express';
const router = express.Router();
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { loginSchema, inviteSchema, changePasswordSchema, updateProfileSchema } from '../validation/auth';

const prisma = new PrismaClient();

router.post('/login', validate(loginSchema), async (req: express.Request, res: express.Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (!user.isActive) return res.status(401).json({ error: 'Account inactive' });
    if (!user.password) return res.status(401).json({ error: 'Invalid credentials' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: parseInt(process.env.JWT_EXPIRES_IN!) || 604800 },
    );

    const churches = await prisma.userChurch.findMany({
      where: { userId: user.id },
      include: { church: true },
    });

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
      churches: churches.map((uc) => ({
        id: uc.church.id,
        name: uc.church.name,
        slug: uc.church.slug,
        role: uc.role,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Authentication failed' });
  }
});

router.get('/me', authenticate, async (req: AuthRequest, res: express.Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, name: true, email: true, phone: true, createdAt: true },
    });

    const churches = await prisma.userChurch.findMany({
      where: { userId: req.userId },
      include: { church: true },
    });

    res.json({
      ...user,
      churches: churches.map((uc) => ({
        id: uc.church.id,
        name: uc.church.name,
        slug: uc.church.slug,
        role: uc.role,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/invite', authenticate, validate(inviteSchema), async (req: AuthRequest, res: express.Response) => {
  try {
    if (req.churchRole !== 'admin') {
      return res.status(403).json({ error: 'Church admin only' });
    }

    const { email, name, phone, churchId } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'User already exists' });

    const tempPassword = await bcrypt.hash(crypto.randomUUID().slice(0, 16), 10);
    const user = await prisma.user.create({
      data: { email, name, phone, password: tempPassword },
    });

    await prisma.userChurch.create({
      data: { userId: user.id, churchId, role: 'member' },
    });

    res.status(201).json({
      message: 'Invitación enviada',
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/me', authenticate, validate(updateProfileSchema), async (req: AuthRequest, res: express.Response) => {
  try {
    const { name, phone } = req.body;
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { ...(name && { name }), ...(phone !== undefined && { phone }) },
      select: { id: true, name: true, email: true, phone: true },
    });
    res.json(user);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/password', authenticate, validate(changePasswordSchema), async (req: AuthRequest, res: express.Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user || !user.password) return res.status(404).json({ error: 'User not found' });

    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Current password incorrect' });

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: req.userId },
      data: { password: hashedPassword },
    });

    res.json({ message: 'Password updated' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
