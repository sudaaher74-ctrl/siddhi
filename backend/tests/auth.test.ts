import request from 'supertest';
import jwt from 'jsonwebtoken';
import { describe, expect, it } from 'vitest';
import { app, authed, createUserAndLogin, ORIGIN } from './helpers';
import User from '../src/models/User';

describe('authentication', () => {
  it('registers a user and sets an httpOnly cookie', async () => {
    const res = await request(app).post('/api/auth/register').set('Origin', ORIGIN).send({
      name: 'New Archer',
      phone: '9876543210',
      email: 'new@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(201);
    const cookie = res.headers['set-cookie'][0];
    expect(cookie).toContain('token=');
    expect(cookie).toContain('HttpOnly');
  });

  it('rejects a short password', async () => {
    const res = await request(app).post('/api/auth/register').set('Origin', ORIGIN).send({
      name: 'New Archer',
      phone: '9876543210',
      email: 'short@example.com',
      password: 'abc',
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/at least 8 characters/i);
  });

  it('rejects an invalid email', async () => {
    const res = await request(app).post('/api/auth/register').set('Origin', ORIGIN).send({
      name: 'New Archer',
      phone: '9876543210',
      email: 'not-an-email',
      password: 'password123',
    });
    expect(res.status).toBe(400);
  });

  it('gives the same message for a wrong password and an unknown email', async () => {
    await createUserAndLogin({ email: 'known@example.com', password: 'password123' });

    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .set('Origin', ORIGIN)
      .send({ email: 'known@example.com', password: 'wrongpassword' });
    const unknownEmail = await request(app)
      .post('/api/auth/login')
      .set('Origin', ORIGIN)
      .send({ email: 'nobody@example.com', password: 'wrongpassword' });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body.message).toBe(unknownEmail.body.message);
  });

  it('accepts the auth cookie as well as the Bearer header', async () => {
    const login = await createUserAndLogin({ email: 'cookie@example.com' });
    const loginRes = await request(app)
      .post('/api/auth/login')
      .set('Origin', ORIGIN)
      .send({ email: login.email, password: login.password });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Origin', ORIGIN)
      .set('Cookie', loginRes.headers['set-cookie']);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe('cookie@example.com');
  });

  it('returns 401 (not 500) for a valid token whose user was deleted', async () => {
    const { token, user } = await createUserAndLogin();
    await User.findByIdAndDelete(user._id);

    const res = await authed(request(app).get('/api/auth/me'), token);
    expect(res.status).toBe(401);
  });

  it('rejects a token signed with a different secret', async () => {
    const { user } = await createUserAndLogin();
    const forged = jwt.sign({ id: String(user._id) }, 'fallback_secret');

    const res = await authed(request(app).get('/api/sessions'), forged);
    expect(res.status).toBe(401);
  });

  it('rate limits repeated failed logins', async () => {
    const attempt = () =>
      request(app)
        .post('/api/auth/login')
        .set('Origin', ORIGIN)
        .send({ email: 'brute@example.com', password: 'wrongpassword' });

    let sawLimit = false;
    for (let i = 0; i < 15; i += 1) {
      const res = await attempt();
      if (res.status === 429) {
        sawLimit = true;
        break;
      }
    }
    expect(sawLimit).toBe(true);
  });
});
