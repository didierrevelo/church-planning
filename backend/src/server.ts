import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import * as Sentry from '@sentry/node';
import { validateEnv } from './utils/env';
import { jobQueue } from './services/background';
import { prisma } from './lib/prisma';

dotenv.config();
validateEnv();

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
  enabled: !!process.env.SENTRY_DSN,
});

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", ...(process.env.CORS_ORIGIN ? [process.env.CORS_ORIGIN] : [])],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: 'same-origin' },
  noSniff: true,
  xssFilter: true,
  hidePoweredBy: true,
  frameguard: { action: 'deny' },
}));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many login attempts, please try again later' },
});

const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? corsOrigin.split(',').map((o) => o.trim())
    : '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Church-Id'],
  credentials: true,
  maxAge: 86400,
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use('/auth', authLimiter, require('./routes/auth'));
app.use('/churches', require('./routes/churches'));
app.use('/services', require('./routes/services'));
app.use('/ministries', require('./routes/ministries'));
app.use('/team', require('./routes/team'));
app.use('/songs', require('./routes/songs'));
app.use('/files', require('./routes/files'));
app.use('/notifications', require('./routes/notifications'));
app.use('/templates', require('./routes/templates'));
app.use('/agent', require('./routes/agent'));
app.use('/search', require('./routes/search'));
app.use('/reports', require('./routes/reports'));
app.use('/admin', require('./routes/admin'));
app.use('/superadmin', require('./routes/superadmin'));

app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      jobsPending: jobQueue.pendingCount,
    });
  } catch (error: any) {
    console.error('[HEALTH] DB error:', error?.message || error);
    res.status(503).json({
      status: 'ERROR',
      error: 'Database connection failed',
      detail: error?.message || String(error),
    });
  }
});

app.use(Sentry.Handlers.errorHandler());

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[ERROR]', err.stack || err.message);
  const errorMessage = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;
  res.status(500).json({ error: errorMessage });
});

process.on('unhandledRejection', (reason: any) => {
  console.error('[FATAL] Unhandled Rejection:', reason?.message || reason);
  Sentry.captureException(reason);
});

process.on('uncaughtException', (error: Error) => {
  console.error('[FATAL] Uncaught Exception:', error.message);
  Sentry.captureException(error);
  process.exit(1);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

export default app;
