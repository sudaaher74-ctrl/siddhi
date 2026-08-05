import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app, authed, createUserAndLogin, ORIGIN } from './helpers';

const validSession = {
  name: '70m Practice',
  type: 'Practice',
  distance: '70m',
  arrows: 36,
  score: 320,
  avg: 8.89,
  tens: 12,
  note: 'Felt good',
};

describe('sessions', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/api/sessions').set('Origin', ORIGIN);
    expect(res.status).toBe(401);
  });

  it('saves and returns a session with numeric fields', async () => {
    const { token } = await createUserAndLogin();

    const created = await authed(request(app).post('/api/sessions'), token).send(validSession);
    expect(created.status).toBe(201);
    expect(created.body.score).toBe(320);
    expect(typeof created.body.score).toBe('number');
    expect(created.body.distance).toBe('70m');

    const list = await authed(request(app).get('/api/sessions'), token);
    expect(list.body).toHaveLength(1);
    expect(list.body[0].name).toBe('70m Practice');
  });

  it('coerces numeric strings from older clients', async () => {
    const { token } = await createUserAndLogin();
    const res = await authed(request(app).post('/api/sessions'), token).send({
      ...validSession,
      arrows: '36',
      score: '320',
      avg: '8.89',
      tens: '12',
    });

    expect(res.status).toBe(201);
    expect(res.body.arrows).toBe(36);
  });

  it('rejects a non-numeric score', async () => {
    const { token } = await createUserAndLogin();
    const res = await authed(request(app).post('/api/sessions'), token).send({
      ...validSession,
      score: 'abcd',
    });
    expect(res.status).toBe(400);
  });

  it('rejects a score higher than the arrows allow', async () => {
    const { token } = await createUserAndLogin();
    const res = await authed(request(app).post('/api/sessions'), token).send({
      ...validSession,
      arrows: 6,
      score: 500,
      tens: 6,
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/higher than the maximum/i);
  });

  it('rejects an oversized arrowData payload', async () => {
    const { token } = await createUserAndLogin();
    const res = await authed(request(app).post('/api/sessions'), token).send({
      ...validSession,
      arrowData: 'x'.repeat(150_000),
    });
    expect(res.status).toBe(400);
  });

  it('never returns another user\'s sessions', async () => {
    const a = await createUserAndLogin({ email: 'a@example.com' });
    const b = await createUserAndLogin({ email: 'b@example.com' });

    await authed(request(app).post('/api/sessions'), a.token).send(validSession);

    const res = await authed(request(app).get('/api/sessions'), b.token);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });

  it('ignores a client-supplied user id', async () => {
    const a = await createUserAndLogin({ email: 'owner@example.com' });
    const b = await createUserAndLogin({ email: 'victim@example.com' });

    await authed(request(app).post('/api/sessions'), a.token).send({
      ...validSession,
      user: String(b.user._id),
    });

    const victimList = await authed(request(app).get('/api/sessions'), b.token);
    expect(victimList.body).toHaveLength(0);
  });
});
