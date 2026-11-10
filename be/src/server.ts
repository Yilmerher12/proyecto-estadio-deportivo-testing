// src/server.ts
import mongoose from 'mongoose';
import { app } from './app';
import { env } from './config/env';
// Inicializa la config de Cloudinary al importar
import './config/cloudinary';

async function main(): Promise<void> {
  await mongoose.connect(env.MONGODB_URI);
  console.log('✅ MongoDB conectado');

  const server = app.listen(env.PORT, () => {
    console.log(`🚀 Servidor escuchando en http://localhost:${env.PORT}`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    console.log(`\n${signal} recibido. Cerrando servidor...`);
    server.close(async () => {
      await mongoose.disconnect();
      console.log('✅ Conexiones cerradas correctamente');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('❌ Error al iniciar el servidor:', err);
  process.exit(1);
});
