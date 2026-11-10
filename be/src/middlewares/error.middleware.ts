import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError';

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Multer errors
  if (err instanceof multer.MulterError) {
    const messages: Record<string, string> = {
      LIMIT_FILE_SIZE: 'El archivo supera el tamaño máximo permitido (5 MB)',
      LIMIT_FILE_COUNT: 'Se excedió el número máximo de archivos',
      LIMIT_UNEXPECTED_FILE: 'Campo de archivo inesperado',
    };
    res.status(400).json({
      status: 'error',
      message: messages[err.code] ?? `Error de carga: ${err.message}`,
    });
    return;
  }

  // Validación de Zod: los schemas envuelven todo en { body }, se quita ese segmento
  if (err instanceof ZodError) {
    res.status(422).json({
      status: 'error',
      message: 'Datos inválidos',
      details: err.issues.map((issue) => ({
        field: issue.path.slice(1).join('.') || issue.path.join('.'),
        message: issue.message,
      })),
    });
    return;
  }

  // ObjectId mal formado en la URL (/concessions/123)
  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({ status: 'error', message: 'Identificador inválido' });
    return;
  }

  // AppError conocido
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ status: 'error', message: err.message });
    return;
  }

  // Error genérico
  console.error('Unhandled error:', err);
  res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
}
