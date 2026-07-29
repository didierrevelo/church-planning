import express from 'express';
import request from 'supertest';
import { prisma } from '../lib/prisma';
let app: express.Express | null = null;

beforeAll(async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    console.warn('Skipping auth integration tests: no database');
    return;
  }

  app = express();
  app.use(express.json());
  app.use('/auth', require('../routes/auth'));
});

describe('POST /auth/login', () => {
  it('returns 400 for missing body', async () => {
    if (!app) return;
    const res = await request(app).post('/auth/login').send({});
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid email', async () => {
    if (!app) return;
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'bad', password: '123456' });
    expect(res.status).toBe(400);
  });
});
