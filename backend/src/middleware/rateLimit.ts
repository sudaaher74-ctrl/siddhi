import rateLimit from 'express-rate-limit';

/**
 * Login and registration are the only unauthenticated write endpoints, so they
 * are the ones worth brute-forcing. Successful logins do not count towards the
 * limit, so a legitimate user is never locked out by their own activity.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please wait 15 minutes and try again.' },
});

/** Broad backstop for the rest of the API. */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many requests. Please slow down.' },
});
