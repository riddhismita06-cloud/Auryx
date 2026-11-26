import dotenv from 'dotenv';
import path from 'path';
import { createExpressApp } from './app.ts';
import { connectDB } from './config/db.ts';

dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });
dotenv.config();

const PORT = Number(process.env.PORT) || 5000;

async function startStandaloneServer() {
  await connectDB();
  const app = createExpressApp();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Auryx Backend] Express API listening on http://localhost:${PORT}`);
  });
}

startStandaloneServer();
