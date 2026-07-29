import { PrismaClient } from '@prisma/client';

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL || '';
  if (url.includes('pooler.supabase.com') && !url.includes('pgbouncer=true')) {
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}pgbouncer=true`;
  }
  return url;
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasourceUrl: getDatabaseUrl(),
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
