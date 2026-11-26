import mongoose from 'mongoose';

let connectionPromise: Promise<typeof mongoose> | null = null;

export function isDatabaseConfigured(): boolean {
  const uri = process.env.MONGODB_URI?.trim();
  return Boolean(
    uri &&
      !uri.includes('<username>') &&
      !uri.includes('<password>') &&
      !uri.includes('<cluster>')
  );
}

export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export async function connectDB(): Promise<boolean> {
  if (isDatabaseConnected()) {
    return true;
  }

  const uri = process.env.MONGODB_URI?.trim();
  if (!uri || !isDatabaseConfigured()) {
    console.warn(
      '[Auryx Server] MONGODB_URI is not configured yet. API database routes will return 503 until MONGODB_URI is set in .env or server/.env.'
    );
    return false;
  }

  try {
    if (!connectionPromise) {
      connectionPromise = mongoose.connect(uri, {
        serverSelectionTimeoutMS: 8000,
      });
    }
    await connectionPromise;
    console.log('[Auryx Server] Connected to MongoDB Atlas.');
    return true;
  } catch (error) {
    connectionPromise = null;
    console.error('[Auryx Server] MongoDB connection failed:', error);
    return false;
  }
}
