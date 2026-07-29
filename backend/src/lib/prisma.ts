import { PrismaClient } from '@prisma/client';

const url = process.env.DATABASE_URL || '';
if (url.includes('pooler.supabase.com') && !url.includes('pgbouncer=true')) {
  const sep = url.includes('?') ? '&' : '?';
  process.env.DATABASE_URL = `${url}${sep}pgbouncer=true`;
}
console.log('[PRISMA] DATABASE_URL starts with:', process.env.DATABASE_URL?.slice(0, 40));
console.log('[PRISMA] Has pgbouncer:', process.env.DATABASE_URL?.includes('pgbouncer=true'));

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Test connection on startup
prisma.$connect()
  .then(() => console.log('[PRISMA] Connected successfully'))
  .catch((e: any) => console.error('[PRISMA] Connection failed:', e?.message || e));

// Test a raw query
prisma.$queryRaw`SELECT 1 AS test`
  .then(() => console.log('[PRISMA] Raw query OK'))
  .catch((e: any) => console.error('[PRISMA] Raw query failed:', e?.message || e));

// Test an ORM query
prisma.user.count()
  .then((c) => console.log('[PRISMA] user.count OK:', c))
  .catch((e: any) => console.error('[PRISMA] user.count failed:', e?.message || e));
