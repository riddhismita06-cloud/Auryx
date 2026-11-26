import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import { isDatabaseConfigured, isDatabaseConnected } from './config/db.ts';
import authRoutes from './routes/authRoutes.ts';
import budgetRoutes from './routes/budgetRoutes.ts';
import goalRoutes from './routes/goalRoutes.ts';
import transactionRoutes from './routes/transactionRoutes.ts';
import aiRoutes from './routes/aiRoutes.ts';

export function createExpressApp() {
  const app = express();

  const allowedOrigin = process.env.CLIENT_URL?.trim();
  app.use(
    cors({
      origin: allowedOrigin ? [allowedOrigin, 'http://localhost:3000'] : true,
      credentials: true,
    })
  );

  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      ok: true,
      service: 'Auryx API',
      dbConfigured: isDatabaseConfigured(),
      dbConnected: isDatabaseConnected(),
      jwtConfigured: Boolean(
        process.env.JWT_SECRET?.trim() &&
          process.env.JWT_SECRET.trim() !== 'replace_with_a_long_random_secret_string'
      ),
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/transactions', transactionRoutes);
  app.use('/api/budgets', budgetRoutes);
  app.use('/api/goals', goalRoutes);
  app.use('/api/ai', aiRoutes);

  app.use('/api/*', (_req: Request, res: Response) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[Auryx API Error]:', err);
    res.status(500).json({ error: 'An unexpected server error occurred.' });
  });

  return app;
}
