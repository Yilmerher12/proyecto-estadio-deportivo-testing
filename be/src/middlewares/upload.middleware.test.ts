import type { Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { AppError } from '../errors/AppError';
import { validateImageSignature } from './upload.middleware';

// Ejecuta el middleware con un archivo falso (o sin archivo) y devuelve el `next` espiado.
function run(buffer?: Buffer) {
  const req = { file: buffer ? { buffer } : undefined } as Request;
  const next = vi.fn();
  validateImageSignature(req, {} as Response, next);
  return next;
}

// Los primeros bytes ("magic bytes") de cada formato; el resto se rellena con ceros.
const pad = (head: number[]) => Buffer.from([...head, ...new Array(20).fill(0)]);
const JPEG = pad([0xff, 0xd8, 0xff]);
const PNG = pad([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const WEBP = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP'), Buffer.alloc(8)]);

describe('validateImageSignature', () => {
  it('should continue when the request has no file', () => {
    // Arrange + Act
    const next = run(undefined);

    // Assert
    expect(next).toHaveBeenCalledWith();
  });

  it.each([
    { format: 'JPEG', buffer: JPEG },
    { format: 'PNG', buffer: PNG },
    { format: 'WebP', buffer: WEBP },
  ])('should accept a real $format image', ({ buffer }) => {
    // Arrange + Act
    const next = run(buffer);

    // Assert
    expect(next).toHaveBeenCalledWith();
  });

  it('should respond 400 when the file says it is an image but its bytes are not', () => {
    // Arrange: un texto que alguien subió con Content-Type image/png.
    const fake = Buffer.from('esto es solo texto, no una imagen de verdad');

    // Act
    const next = run(fake);

    // Assert
    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe('El archivo no es una imagen válida');
  });
});
