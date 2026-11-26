import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { connectDB, isDatabaseConnected } from '../config/db.ts';

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

interface TokenPayload {
  userId: string;
  email: string;
}

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret || secret === 'replace_with_a_long_random_secret_string') {
    throw new Error('JWT_SECRET environment variable is not configured.');
  }
  return secret;
}

export function signAuthToken(userId: string, email: string): string {
  const secret = getJwtSecret();
  return jwt.sign({ userId, email }, secret, { expiresIn: '7d' });
}

export async function requireDatabase(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!isDatabaseConnected()) {
    const connected = await connectDB();
    if (!connected) {
      res.status(503).json({
        error:
          'Database is not connected. Configure MONGODB_URI in your .env file to enable accounts and persistence.',
      });
      return;
    }
  }
  next();
}

export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    res.status(401).json({ error: 'Authentication token is missing.' });
    return;
  }

  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret) as TokenPayload;
    if (!decoded || !decoded.userId) {
      res.status(401).json({ error: 'Invalid authentication token.' });
      return;
    }
    req.userId = decoded.userId;
    next();
  } catch (err) {
    if (err instanceof Error && err.message.includes('JWT_SECRET')) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
  }
}
