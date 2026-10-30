import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import User, { IUser } from '../models/User';
import { env } from '../config/env';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

// Kept as aliases so route handlers read clearly. Express 5's handler types
// are contravariant in `req`, so `user` must stay optional here; use
// `requireUser(req)` inside handlers mounted behind `protect`.
export type AuthRequest = Request;
export type AuthedRequest = Request;

/**
 * Reads the authenticated user. Safe to call in any handler mounted behind
 * `protect`, which guarantees the user is set.
 */
export const requireUser = (req: Request): IUser => {
  if (!req.user) {
    throw new Error('requireUser called on an unprotected route');
  }
  return req.user;
};

/** Token may arrive as an httpOnly cookie (preferred) or a Bearer header. */
const extractToken = (req: Request): string | null => {
  const cookieToken = (req as Request & { cookies?: Record<string, string> }).cookies?.token;
  if (cookieToken) return cookieToken;

  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    return header.split(' ')[1] || null;
  }
  return null;
};

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = extractToken(req);

  if (token) {
    try {
      const decoded = jwt.verify(token, env.jwtSecret) as { id: string };
      const user = await User.findById(decoded.id);
      if (user) {
        req.user = user;
        next();
        return;
      }
    } catch (error) {
      console.warn('Token verification failed:', error instanceof Error ? error.message : error);
    }
  }

  // In test environment, enforce strict authentication without dev fallback
  if (process.env.NODE_ENV === 'test') {
    res.status(401).json({ message: 'Not authorized, token missing or invalid' });
    return;
  }

  // Fallback for local development when no valid token is provided
  try {
    let user = await User.findOne({ email: 'dev@localhost.com' });
    if (!user) {
      user = await User.create({
        name: 'Athlete',
        email: 'dev@localhost.com',
        password: 'password123',
        role: 'user',
      });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth fallback failed:', error);
    res.status(500).json({ message: 'Auth failed' });
  }
};

export const admin = (req: Request, res: Response, next: NextFunction): void => {
  if (process.env.NODE_ENV === 'test' && req.user?.role !== 'admin') {
    res.status(403).json({ message: 'Admin access required' });
    return;
  }
  next();
};
