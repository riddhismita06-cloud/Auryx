import bcrypt from 'bcrypt';
import type { Request, Response } from 'express';
import { type AuthenticatedRequest, signAuthToken } from '../middleware/auth.ts';
import { UserModel } from '../models/User.ts';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function registerUser(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password, confirmPassword } = req.body as {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    };

    const trimmedName = typeof name === 'string' ? name.trim() : '';
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (trimmedName.length < 2) {
      res.status(400).json({ error: 'Full name must be at least 2 characters.' });
      return;
    }

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }

    if (typeof password !== 'string' || password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      res.status(400).json({ error: 'Passwords do not match.' });
      return;
    }

    const existing = await UserModel.findOne({ email: normalizedEmail }).lean();
    if (existing) {
      res.status(409).json({
        error: 'An account with this email already exists. Please sign in instead.',
      });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const createdUser = await UserModel.create({
      name: trimmedName,
      email: normalizedEmail,
      passwordHash,
    });

    const token = signAuthToken(String(createdUser._id), createdUser.email);

    res.status(201).json({
      token,
      user: {
        id: String(createdUser._id),
        name: createdUser.name,
        email: createdUser.email,
        createdAt: createdUser.createdAt,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('JWT_SECRET')) {
      res.status(500).json({ error: error.message });
      return;
    }
    console.error('[Auth] Register error:', error);
    res.status(500).json({ error: 'Unable to create account right now. Please try again.' });
  }
}

export async function loginUser(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };

    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!EMAIL_REGEX.test(normalizedEmail) || typeof password !== 'string' || !password) {
      res.status(400).json({ error: 'Please provide both a valid email and password.' });
      return;
    }

    const user = await UserModel.findOne({ email: normalizedEmail });
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = signAuthToken(String(user._id), user.email);

    res.json({
      token,
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('JWT_SECRET')) {
      res.status(500).json({ error: error.message });
      return;
    }
    console.error('[Auth] Login error:', error);
    res.status(500).json({ error: 'Unable to sign in right now. Please try again.' });
  }
}

export async function getCurrentUser(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = await UserModel.findById(req.userId).select('-passwordHash').lean();
    if (!user) {
      res.status(404).json({ error: 'User account not found.' });
      return;
    }
    res.json({
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('[Auth] GetMe error:', error);
    res.status(500).json({ error: 'Failed to load user profile.' });
  }
}
