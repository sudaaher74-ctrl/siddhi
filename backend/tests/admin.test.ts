import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app, authed, createUserAndLogin, ORIGIN } from './helpers';

/**
 * These routes were completely unauthenticated. Each test here fails loudly
 * if that regression ever comes back.
 */
describe('admin routes are locked down', () => {
  const endpoints: Array<[string, 'get' | 'put' | 'delete', string]> = [
    ['stats', 'get', '/api/admin/stats'],
    ['user list', 'get', '/api/admin/users'],
    ['feedback list', 'get', '/api/admin/feedback'],
  ];

  it.each(endpoints)('rejects anonymous access to %s', async (_name, method, url) => {
    const res = await request(app)[method](url).set('Origin', ORIGIN);
    expect(res.status).toBe(401);
  });

  it('rejects a signed-in non-admin with 403', async () => {
    const { token } = await createUserAndLogin();
    const res = await authed(request(app).get('/api/admin/users'), token);
    expect(res.status).toBe(403);
  });

  it('allows an admin', async () => {
    const { token } = await createUserAndLogin({ role: 'admin' });
    const res = await authed(request(app).get('/api/admin/users'), token);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('never returns password hashes', async () => {
    const { token } = await createUserAndLogin({ role: 'admin' });
    const res = await authed(request(app).get('/api/admin/users'), token);
    expect(res.body[0]).not.toHaveProperty('password');
  });

  it('refuses to let an anonymous caller delete a user', async () => {
    const { user } = await createUserAndLogin();
    const res = await request(app).delete(`/api/admin/users/${user._id}`).set('Origin', ORIGIN);
    expect(res.status).toBe(401);
  });

  it('stops an admin from demoting themselves', async () => {
    const { token, user } = await createUserAndLogin({ role: 'admin' });
    const res = await authed(
      request(app).put(`/api/admin/users/${user._id}/role`),
      token
    ).send({ role: 'user' });
    expect(res.status).toBe(400);
  });

  it('rejects a malformed user id', async () => {
    const { token } = await createUserAndLogin({ role: 'admin' });
    const res = await authed(request(app).delete('/api/admin/users/not-an-id'), token);
    expect(res.status).toBe(400);
  });
});
