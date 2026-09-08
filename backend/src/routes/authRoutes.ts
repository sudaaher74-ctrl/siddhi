import express, { Response } from 'express';
import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import User from '../models/User';
import { protect, AuthedRequest, requireUser } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/validate';
import { loginSchema, registerSchema } from '../schemas';
import { authLimiter } from '../middleware/rateLimit';
import { env } from '../config/env';
import { OAuth2Client } from 'google-auth-library';

const router = express.Router();
const googleClient = new OAuth2Client();

const generateToken = (id: string) =>
  jwt.sign({ id }, env.jwtSecret, { expiresIn: env.jwtExpiresIn } as SignOptions);

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * The token goes out as an httpOnly cookie so page scripts (and any XSS)
 * cannot read it. It is also returned in the body for backwards compatibility
 * with clients that still send an Authorization header.
 */
const sendAuth = (
  res: Response,
  user: { _id: unknown; email: string; name?: string; role?: string; avatar?: string },
  status = 200
) => {
  const token = generateToken(String(user._id));

  res.cookie('token', token, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    maxAge: THIRTY_DAYS_MS,
    path: '/',
  });

  res.status(status).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    token,
  });
};


// POST /api/auth/register
router.post('/register', authLimiter, validateBody(registerSchema), async (req, res) => {
  try {
    const { name, phone, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400).json({ message: 'An account with this email already exists' });
      return;
    }

    const user = await User.create({ name, phone, email, password });
    sendAuth(res, user, 201);
  } catch (error) {
    console.error('Registration failed:', error);
    res.status(500).json({ message: 'Could not create account' });
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, validateBody(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      sendAuth(res, user);
    } else {
      // Same message either way, so the response cannot be used to discover
      // which email addresses are registered.
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login failed:', error);
    res.status(500).json({ message: 'Could not sign in' });
  }
});

// POST /api/auth/google - Google OAuth sign-in / registration
router.post('/google', authLimiter, async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential || typeof credential !== 'string') {
      res.status(400).json({ message: 'Google credential is required' });
      return;
    }

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: env.googleClientId || undefined,
      });
      payload = ticket.getPayload();
    } catch (verifyError) {
      console.error('Google token verification failed:', verifyError);
      res.status(401).json({ message: 'Invalid or expired Google credential' });
      return;
    }

    if (!payload || !payload.email) {
      res.status(401).json({ message: 'Google token does not contain a valid email' });
      return;
    }

    const googleId = payload.sub;
    const email = payload.email.toLowerCase();
    const name = payload.name || payload.email.split('@')[0];
    const avatar = payload.picture;

    // Check if user already exists by googleId
    let user = await User.findOne({ googleId });

    if (!user) {
      // Check if user exists by email, and link accounts
      user = await User.findOne({ email });

      if (user) {
        user.googleId = googleId;
        if (!user.avatar && avatar) {
          user.avatar = avatar;
        }
        await user.save();
      } else {
        // Create new athlete user
        user = await User.create({
          name,
          email,
          googleId,
          avatar,
          role: 'user',
        });
      }
    }

    sendAuth(res, user);
  } catch (error) {
    console.error('Google auth failed:', error);
    res.status(500).json({ message: 'Google authentication failed' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    path: '/',
  });
  res.json({ message: 'Logged out' });
});

// GET /api/auth/me - Current user profile
router.get('/me', protect, async (req: AuthedRequest, res) => {
  const { _id, name, email, phone, role, avatar, googleId } = requireUser(req);
  res.json({ _id, name, email, phone, role, avatar, hasGoogleAuth: Boolean(googleId) });
});

export default router;
