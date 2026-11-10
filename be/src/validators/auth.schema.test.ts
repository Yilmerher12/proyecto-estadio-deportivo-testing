import { describe, expect, it } from 'vitest';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from './auth.schema';

const validRegister = { name: 'Ana Gómez', email: 'ana@example.com', password: 'clave-1234' };

describe('registerSchema', () => {
  it('should accept a valid body', () => {
    // Arrange + Act
    const result = registerSchema.safeParse({ body: validRegister });

    // Assert
    expect(result.success).toBe(true);
  });

  // Valor límite de la contraseña: mínimo 8 caracteres.
  it.each([
    { length: 7, ok: false },
    { length: 8, ok: true },
  ])('should return success=$ok for a password of $length characters', ({ length, ok }) => {
    // Arrange + Act
    const result = registerSchema.safeParse({
      body: { ...validRegister, password: 'x'.repeat(length) },
    });

    // Assert
    expect(result.success).toBe(ok);
  });

  it('should reject an invalid email', () => {
    // Arrange + Act
    const result = registerSchema.safeParse({ body: { ...validRegister, email: 'no-es-correo' } });

    // Assert
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(['body', 'email']);
  });

  it('should reject a name shorter than 2 characters', () => {
    // Arrange + Act
    const result = registerSchema.safeParse({ body: { ...validRegister, name: 'A' } });

    // Assert
    expect(result.success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('should reject an empty password', () => {
    // Arrange + Act
    const result = loginSchema.safeParse({ body: { email: 'ana@example.com', password: '' } });

    // Assert
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('La contraseña es requerida');
  });

  it('should not enforce the 8-character minimum at login', () => {
    // Arrange + Act: al iniciar sesión solo se exige que no esté vacía.
    const result = loginSchema.safeParse({ body: { email: 'ana@example.com', password: 'corta' } });

    // Assert
    expect(result.success).toBe(true);
  });
});

describe('forgotPasswordSchema and resetPasswordSchema', () => {
  it('should reject an invalid email when asking for a reset', () => {
    expect(forgotPasswordSchema.safeParse({ body: { email: 'xxx' } }).success).toBe(false);
  });

  it('should reject an empty reset token', () => {
    const result = resetPasswordSchema.safeParse({ body: { token: '', password: 'clave-1234' } });

    expect(result.success).toBe(false);
  });

  it('should reject a new password shorter than 8 characters', () => {
    const result = resetPasswordSchema.safeParse({ body: { token: 'abc', password: '1234567' } });

    expect(result.success).toBe(false);
  });
});
