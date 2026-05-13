import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import authRouter from './routes/auth.js';
import sessionsRouter from './routes/sessions.js';
import metricsRouter from './routes/metrics.js';
import adminRouter from './routes/admin.js';
import { errorHandler } from './middleware/error.js';

export function createApp() {
  const app = express();

  const FRONTEND_ORIGINS = (process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin(origin, cb) {
        if (!origin) return cb(null, true);
        const ok = FRONTEND_ORIGINS.some((allowed) => {
          if (allowed === origin) return true;
          if (allowed.includes('*')) {
            const re = new RegExp(
              '^' +
                allowed.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') +
                '$',
            );
            return re.test(origin);
          }
          return false;
        });
        cb(ok ? null : new Error(`Origin ${origin} not allowed by CORS`), ok);
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/sessions', sessionsRouter);
  app.use('/api/metrics', metricsRouter);
  app.use('/api/admin', adminRouter);

  app.use(errorHandler);
  return app;
}
