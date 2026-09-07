import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

const getEnv = (key: string, fallback?: string): string => {
  const value = process.env[key];
  if (value && value.trim() !== '') {
    return value;
  }
  if (fallback !== undefined) {
    return fallback;
  }
  throw new Error(
    `Missing required environment variable: ${key}. ` +
      `Set it in backend/.env before starting the server.`
  );
};

const jwtSecret = getEnv(
  'JWT_SECRET',
  isProduction ? undefined : 'dev-super-secret-key-32-chars-long-enough-default'
);

if (isProduction && jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters in production.');
}

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:3001')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

export const env = {
  isProduction,
  port: Number(process.env.PORT) || 5001,
  tursoDatabaseUrl: process.env.TURSO_DATABASE_URL || 'file:siddhi.db',
  tursoAuthToken: process.env.TURSO_AUTH_TOKEN || '',
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '30d',
  allowedOrigins,
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  cookieSameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
  cookieSecure: isProduction,
};
