import { PrismaClient } from '@prisma/client';

const url = process.env.DATABASE_URL || '';
if (url.includes('pooler.supabase.com') && !url.includes('pgbouncer=true')) {
  const sep = url.includes('?') ? '&' : '?';
  process.env.DATABASE_URL = `${url}${sep}pgbouncer=true`;
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;


