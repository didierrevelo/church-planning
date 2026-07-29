import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  userId?: string;
  user?: any;
  churchId?: string;
  churchRole?: string;
}

export const publicUserSelect = {
  id: true,
  name: true,
};

export const memberUserSelect = {
  id: true,
  name: true,
  email: true,
};

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true, isActive: true },
    });

    if (!user || !user.isActive) {
      res.status(401).json({ error: 'User not found or inactive' });
      return;
    }

    req.userId = user.id;
    req.user = user;

    const churchId = req.headers['x-church-id'] as string;
    if (churchId) {
      const membership = await prisma.userChurch.findUnique({
        where: { userId_churchId: { userId: user.id, churchId } },
      });
      if (!membership) {
        res.status(403).json({ error: 'Not a member of this church' });
        return;
      }
      req.churchId = churchId;
      req.churchRole = membership.role;
    }

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const requireChurch = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.churchId) {
    res.status(400).json({ error: 'X-Church-Id header required' });
    return;
  }
  next();
};

export const requireChurchAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (req.churchRole !== 'admin') {
    res.status(403).json({ error: 'Church admin access required' });
    return;
  }
  next();
};

export const requireChurchLeader = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (req.churchRole !== 'admin' && req.churchRole !== 'leader') {
    res.status(403).json({ error: 'Leader access required' });
    return;
  }
  next();
};
