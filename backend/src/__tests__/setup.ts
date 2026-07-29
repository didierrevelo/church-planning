import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Ensure DB is reachable; skip integration tests if not
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    console.warn('Database not available — integration tests will be skipped');
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});
