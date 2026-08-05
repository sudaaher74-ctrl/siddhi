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

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
    return;
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as { id: string };
    const user = await User.findById(decoded.id).select('-password');

    // A valid token for a deleted user must not pass — otherwise every
    // downstream `req.user._id` throws a 500.
    if (!user) {
      res.status(401).json({ message: 'Not authorized, user no longer exists' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth failed:', error instanceof Error ? error.message : error);
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

export const admin = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};
