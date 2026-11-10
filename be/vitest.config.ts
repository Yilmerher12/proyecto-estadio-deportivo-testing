import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Valores falsos pero válidos: env.ts cierra el proceso (process.exit) si faltan,
    // y casi todo el código lo importa. Así cualquier test puede importar sin romperse.
    env: {
      MONGODB_URI: 'mongodb://localhost:27018/estadio_unit',
      JWT_ACCESS_SECRET: 'unit_access_secret_de_prueba_minimo_32_caracteres',
      JWT_REFRESH_SECRET: 'unit_refresh_secret_de_prueba_minimo_32_caracteres',
      CLOUDINARY_CLOUD_NAME: 'unit',
      CLOUDINARY_API_KEY: 'unit',
      CLOUDINARY_API_SECRET: 'unit',
    },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      // server.ts solo arranca el puerto y conecta Mongo: no tiene lógica que probar.
      exclude: ['src/server.ts', 'src/**/*.test.ts'],
      reporter: ['text', 'html'],
      // Cierre de la semana 3 (medido: 42.85 / 53.70 / 30.13 / 43.46, redondeado hacia abajo).
      // Solo puede subir: ver docs/cobertura-semanal.md.
      thresholds: { statements: 42, branches: 53, functions: 30, lines: 43 },
    },
  },
});
