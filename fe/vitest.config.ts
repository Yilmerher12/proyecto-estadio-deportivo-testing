import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      // Solo la lógica pura: esquemas, servicios y stores. Las pantallas (JSX) quedan fuera por ahora.
      include: ['src/schemas/**', 'src/services/**', 'src/stores/**'],
      exclude: ['src/**/*.test.ts'],
      reporter: ['text', 'html'],
      // Línea base de la semana 1 (0 %). Solo puede subir: ver docs/cobertura-semanal.md.
      thresholds: { statements: 0, branches: 0, functions: 0, lines: 0 },
    },
  },
});
