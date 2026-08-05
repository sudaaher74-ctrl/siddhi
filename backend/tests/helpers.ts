import request from 'supertest';
import { createApp } from '../src/app';
import User from '../src/models/User';

export const app = createApp();

export const ORIGIN = 'http://localhost:3000';

/** Creates a user directly and returns a token by logging in through the API. */
export const createUserAndLogin = async (
  overrides: Partial<{ email: string; password: string; role: 'user' | 'admin' }> = {}
) => {
  const email = overrides.email ?? `archer${Date.now()}${Math.random()}@example.com`;
  const password = overrides.password ?? 'password123';

  const user = await User.create({
    name: 'Test Archer',
    phone: '9999999999',
    email,
    password,
    role: overrides.role ?? 'user',
  });

  const res = await request(app)
    .post('/api/auth/login')
    .set('Origin', ORIGIN)
    .send({ email, password });

  return { user, token: res.body.token as string, email, password };
};

export const authed = (req: request.Test, token: string) =>
  req.set('Origin', ORIGIN).set('Authorization', `Bearer ${token}`);
