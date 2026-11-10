import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '../errors/AppError';
import { createConcessionSchema } from '../validators/concessions.schema';
import { errorMiddleware } from './error.middleware';

// Respuesta falsa: status() devuelve la misma respuesta para poder encadenar .json().
function run(error: unknown) {
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
  errorMiddleware(error, {} as Request, res as unknown as Response, vi.fn());
  return res;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('errorMiddleware', () => {
  it('should answer with the status and message of an AppError', () => {
    // Arrange + Act
    const res = run(new AppError(409, 'El correo ya está registrado'));

    // Assert
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ status: 'error', message: 'El correo ya está registrado' });
  });

  it('should answer 422 with the invalid fields when the validation fails', () => {
    // Arrange: un error de Zod real, con el precio negativo.
    const result = createConcessionSchema.safeParse({
      body: { name: 'Perro', category: 'Comida', price: -1 },
    });

    // Act
    const res = run(result.error);

    // Assert: el segmento "body" del path se quita, queda solo el campo.
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Datos inválidos',
      details: [{ field: 'price', message: 'El precio no puede ser negativo' }],
    });
  });

  it('should answer 400 when the id in the URL is malformed', () => {
    // Arrange
    const castError = new mongoose.Error.CastError('ObjectId', '123', '_id');

    // Act
    const res = run(castError);

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ status: 'error', message: 'Identificador inválido' });
  });

  it('should answer 400 with the size limit when the file is too big', () => {
    // Arrange + Act
    const res = run(new multer.MulterError('LIMIT_FILE_SIZE'));

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'El archivo supera el tamaño máximo permitido (5 MB)',
    });
  });

  it('should answer 400 with the multer message for an unknown upload error', () => {
    // Arrange + Act
    const res = run(new multer.MulterError('LIMIT_PART_COUNT'));

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].message).toMatch(/^Error de carga:/);
  });

  it('should answer 500 without leaking the error message for an unknown error', () => {
    // Arrange
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Act
    const res = run(new Error('contraseña de la BD: 1234'));

    // Assert
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ status: 'error', message: 'Error interno del servidor' });
  });
});
