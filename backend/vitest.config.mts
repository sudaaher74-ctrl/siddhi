import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    // The in-memory MongoDB download/start can be slow on a cold run.
    testTimeout: 30_000,
    hookTimeout: 120_000,
    // Each file gets its own database, so they must not share a process pool
    // that reuses the mongoose connection.
    fileParallelism: false,
  },
});
