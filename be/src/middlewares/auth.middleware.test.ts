import type { Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { AppError } from '../errors/AppError';
import { authorize } from './auth.middleware';

// Ejecuta authorize(...roles) con un usuario falso y devuelve el `next` espiado.
function run(roles: string[], user?: { userId: string; email: string; role: string }) {
  const req = { user } as Request;
  const next = vi.fn();
  authorize(...roles)(req, {} as Response, next);
  return next;
}

describe('authorize', () => {
  it('should respond 401 when there is no authenticated user', () => {
    // Arrange + Act
    const next = run(['admin'], undefined);

    // Assert
    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(401);
  });

  it('should respond 403 when the role is not in the allowed list', () => {
    // Arrange + Act
    const next = run(['admin'], { userId: '1', email: 'a@a.com', role: 'user' });

    // Assert
    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(403);
  });

  it('should call next without error when the role is allowed', () => {
    // Arrange + Act
    const next = run(['admin', 'user'], { userId: '1', email: 'a@a.com', role: 'user' });

    // Assert
    expect(next).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith();
  });
});
