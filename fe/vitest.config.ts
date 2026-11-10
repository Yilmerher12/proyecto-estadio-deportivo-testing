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
      // Cierre de la semana 2 (medido: 53.94 / 31.57 / 65.21 / 54.66, redondeado hacia abajo).
      // Solo puede subir: ver docs/cobertura-semanal.md.
      thresholds: { statements: 53, branches: 31, functions: 65, lines: 54 },
    },
  },
});
