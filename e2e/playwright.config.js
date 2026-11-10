import { defineConfig } from '@playwright/test';

const API_PORT = 3100;

export default defineConfig({
  testDir: './tests',
  // Los tests comparten la misma BD: en serie para que ninguno dependa del orden de otro.
  fullyParallel: false,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    // Con baseURL los tests usan rutas relativas ('/api/v1/...'), igual que en el frontend.
    baseURL: `http://localhost:${API_PORT}`,
  },
  webServer: {
    // Playwright enciende el backend solo y espera a que /health responda.
    command: 'pnpm exec tsx src/server.ts',
    cwd: '../be',
    url: `http://localhost:${API_PORT}/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      NODE_ENV: 'test',
      PORT: String(API_PORT),
      // BD aparte (docker-compose.yml, puerto 27018): nunca la de desarrollo.
      MONGODB_URI: 'mongodb://localhost:27018/estadio_e2e',
      // Valores falsos pero válidos: env.ts cierra el proceso si faltan o son cortos.
      JWT_ACCESS_SECRET: 'e2e_access_secret_de_prueba_minimo_32_caracteres',
      JWT_REFRESH_SECRET: 'e2e_refresh_secret_de_prueba_minimo_32_caracteres',
      CLOUDINARY_CLOUD_NAME: 'e2e',
      CLOUDINARY_API_KEY: 'e2e',
      CLOUDINARY_API_SECRET: 'e2e',
    },
  },
});
