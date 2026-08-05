import dotenv from 'dotenv';

dotenv.config();

/**
 * Reads a required environment variable, failing fast at startup if it is
 * missing. Never fall back to a default for secrets — a predictable fallback
 * lets anyone forge credentials.
 */
const required = (key: string): string => {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    throw new Error(
      `Missing required environment variable: ${key}. ` +
        `Set it in backend/.env (see .env.example) before starting the server.`
    );
  }
  return value;
};

const isProduction = process.env.NODE_ENV === 'production';

const jwtSecret = required('JWT_SECRET');
if (isProduction && jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters in production.');
}

// Comma-separated list, e.g. "https://app.example.com,http://localhost:3000"
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

export const env = {
  isProduction,
  port: Number(process.env.PORT) || 5001,
  mongoUri: required('MONGODB_URI'),
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '30d',
  allowedOrigins,
  // Cross-site cookies (frontend and API on different domains) require
  // SameSite=None + Secure, which only works over HTTPS.
  cookieSameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
  cookieSecure: isProduction,
};
