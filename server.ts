import { setServers } from 'node:dns';
import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { createExpressApp } from './server/app.ts';
import { connectDB } from './server/config/db.ts';

setServers(['8.8.8.8', '8.8.4.4']);
dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });
dotenv.config();

const PORT = Number(process.env.PORT || 3000);

async function startAppServer() {
  await connectDB();
  const app = createExpressApp();

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Auryx] Full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startAppServer();
