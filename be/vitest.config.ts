import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      // server.ts solo arranca el puerto y conecta Mongo: no tiene lógica que probar.
      exclude: ['src/server.ts', 'src/**/*.test.ts'],
      reporter: ['text', 'html'],
    },
  },
});
