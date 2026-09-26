import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    fileParallelism: false,
    maxWorkers: 1,
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/server.ts', 'src/data/seedData.ts'],
    },
    env: {
      NODE_ENV: 'test',
      JWT_SECRET: 'test-environment-jwt-secret-at-least-32-chars-long!',
      PORT: '3999',
    },
  },
});
