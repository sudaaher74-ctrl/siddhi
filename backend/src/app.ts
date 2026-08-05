import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { apiLimiter } from './middleware/rateLimit';

import sessionRoutes from './routes/sessionRoutes';
import authRoutes from './routes/authRoutes';
import equipmentRoutes from './routes/equipmentRoutes';
import adminRoutes from './routes/adminRoutes';
import feedbackRoutes from './routes/feedbackRoutes';
import goalRoutes from './routes/goalRoutes';

/**
 * The Express app, separated from server startup so tests can mount it
 * without opening a port or connecting to the real database.
 */
export const createApp = () => {
  const app = express();

  // Behind Render's proxy, so rate limiting sees the real client IP.
  app.set('trust proxy', 1);

  app.use(
    cors({
      origin: (origin, callback) => {
        // Same-origin/server-to-server requests send no Origin header.
        if (!origin || env.allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`Origin ${origin} is not allowed by CORS`));
        }
      },
      // Required for the httpOnly auth cookie to be sent cross-site.
      credentials: true,
    })
  );

  // Cap body size — arrow plot data is the largest legitimate payload.
  app.use(express.json({ limit: '200kb' }));
  app.use(cookieParser());
  app.use('/api', apiLimiter);

  app.get('/', (req, res) => {
    res.send('API is running...');
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/sessions', sessionRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/equipment', equipmentRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/feedback', feedbackRoutes);
  app.use('/api/goals', goalRoutes);

  app.use((req, res) => {
    res.status(404).json({ message: 'Not found' });
  });

  // Final safety net: log the real error, return a generic message so stack
  // traces and database details never reach the client.
  app.use(
    (
      err: Error,
      req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      console.error('Unhandled error:', err);
      if (res.headersSent) return;
      res.status(500).json({ message: 'Something went wrong' });
    }
  );

  return app;
};
