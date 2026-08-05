/**
 * Test bootstrap: provides the environment variables the app requires and
 * swaps MongoDB for an in-memory instance, so tests never touch real data.
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'test-secret-that-is-long-enough-for-the-check';
process.env.CORS_ORIGIN = 'http://localhost:3000';
// Placeholder so `config/env` passes its required-variable check at import
// time; the real in-memory URI is assigned in beforeAll below.
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/test-placeholder';

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { afterAll, afterEach, beforeAll } from 'vitest';

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  await mongoose.connect(process.env.MONGODB_URI);
});

afterEach(async () => {
  // Clean slate between tests without paying to restart the server.
  const collections = await mongoose.connection.db!.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});
