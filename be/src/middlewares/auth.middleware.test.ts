import type { Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { AppError } from '../errors/AppError';
import { generateAccessToken } from '../utils/jwt';
import { authenticate, authorize } from './auth.middleware';

type FakeUser = { userId: string; email: string; role: string };

// Ejecuta authorize(...roles) con un usuario falso y devuelve el `next` espiado.
function run(roles: string[], user?: FakeUser) {
  const req = { user } as Request;
  const next = vi.fn();
  authorize(...roles)(req, {} as Response, next);
  return next;
}

// Ejecuta authenticate con un header Authorization falso y devuelve la petición y el `next`.
function runAuthenticate(authorization?: string) {
  const req = { headers: { authorization } } as Request;
  const next = vi.fn();
  authenticate(req, {} as Response, next);
  return { req, next };
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

describe('authenticate', () => {
  it.each([
    { case: 'there is no Authorization header', header: undefined },
    { case: 'the header does not start with "Bearer "', header: 'Token abc' },
  ])('should respond 401 when $case', ({ header }) => {
    // Arrange + Act
    const { next } = runAuthenticate(header);

    // Assert
    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe('Token de autenticación requerido');
  });

  it('should respond 401 when the token is invalid', () => {
    // Arrange + Act
    const { next } = runAuthenticate('Bearer token-inventado');

    // Assert
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe('Token inválido o expirado');
  });

  it('should put the user of the token in the request and continue', () => {
    // Arrange
    const token = generateAccessToken({ userId: 'u1', email: 'ana@example.com', role: 'admin' });

    // Act
    const { req, next } = runAuthenticate(`Bearer ${token}`);

    // Assert
    expect(req.user).toMatchObject({ userId: 'u1', role: 'admin' });
    expect(next).toHaveBeenCalledWith();
  });
});
