/**
 * Test bootstrap: provides the environment variables the app requires and
 * uses an in-memory LibSQL SQLite instance, so tests never touch real data.
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'test-secret-that-is-long-enough-for-the-check';
process.env.CORS_ORIGIN = 'http://localhost:3000';
process.env.TURSO_DATABASE_URL = ':memory:';

import { createClient, Client } from '@libsql/client';
import { setDbClient, initTables } from '../src/config/db';
import { afterAll, afterEach, beforeAll } from 'vitest';

let testDb: Client;

beforeAll(async () => {
  testDb = createClient({ url: ':memory:' });
  setDbClient(testDb);
  await initTables(testDb);
});

afterEach(async () => {
  if (testDb) {
    // Clean slate between tests
    await testDb.batch([
      'DELETE FROM users',
      'DELETE FROM sessions',
      'DELETE FROM goals',
      'DELETE FROM equipment',
      'DELETE FROM feedback',
    ]);
  }
});

afterAll(async () => {
  if (testDb) {
    testDb.close();
  }
});
