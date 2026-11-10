import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Donde el código pide 'react-native' (escrito en Flow, que Node no lee), los tests usan
  // 'react-native-web': los componentes se dibujan como HTML en jsdom y se prueban con
  // Testing Library, igual que en React.
  resolve: { alias: { 'react-native': 'react-native-web' } },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./vitest.setup.ts'],
    server: { deps: { inline: ['react-native-web'] } },
    coverage: {
      provider: 'v8',
      // Lógica pura (esquemas, servicios, stores) y pantallas/componentes probados con Testing Library.
      include: [
        'src/schemas/**',
        'src/services/**',
        'src/stores/**',
        'src/screens/**',
        'src/components/**',
      ],
      exclude: ['src/**/*.test.{ts,tsx}'],
      reporter: ['text', 'html'],
      // Cierre de la semana 3 (medido: 74.80 / 73.07 / 84.00 / 73.98, redondeado hacia abajo).
      // Solo puede subir: ver docs/cobertura-semanal.md.
      thresholds: { statements: 74, branches: 73, functions: 84, lines: 73 },
    },
  },
});
