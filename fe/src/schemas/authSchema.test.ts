import { describe, expect, it } from 'vitest';
import { loginSchema, registerSchema } from './authSchema';

const validRegister = {
  username: 'hincha',
  email: 'Hincha@Example.com',
  password: 'clave-123',
  confirmPassword: 'clave-123',
};

describe('loginSchema', () => {
  // Valores límite del usuario: mínimo 2 y máximo 50 caracteres.
  it.each([
    { length: 1, ok: false },
    { length: 2, ok: true },
    { length: 50, ok: true },
    { length: 51, ok: false },
  ])('should return success=$ok for a username of $length characters', ({ length, ok }) => {
    // Arrange + Act
    const result = loginSchema.safeParse({ username: 'u'.repeat(length), password: 'clave-123' });

    // Assert
    expect(result.success).toBe(ok);
  });

  // Valores límite de la contraseña: mínimo 6 y máximo 100.
  it.each([
    { length: 5, ok: false },
    { length: 6, ok: true },
    { length: 100, ok: true },
    { length: 101, ok: false },
  ])('should return success=$ok for a password of $length characters', ({ length, ok }) => {
    // Arrange + Act
    const result = loginSchema.safeParse({ username: 'hincha', password: 'p'.repeat(length) });

    // Assert
    expect(result.success).toBe(ok);
  });

  it('should trim the spaces around the username', () => {
    // Arrange + Act
    const result = loginSchema.safeParse({ username: '  hincha  ', password: 'clave-123' });

    // Assert
    expect(result.data?.username).toBe('hincha');
  });
});

describe('registerSchema', () => {
  it('should accept a valid body and lowercase the email', () => {
    // Arrange + Act
    const result = registerSchema.safeParse(validRegister);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data?.email).toBe('hincha@example.com');
  });

  it('should reject when the passwords do not match and point at confirmPassword', () => {
    // Arrange + Act
    const result = registerSchema.safeParse({ ...validRegister, confirmPassword: 'otra-clave' });

    // Assert
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(['confirmPassword']);
    expect(result.error?.issues[0].message).toBe('Las contraseñas no coinciden');
  });

  it('should reject an invalid email', () => {
    // Arrange + Act
    const result = registerSchema.safeParse({ ...validRegister, email: 'no-es-correo' });

    // Assert
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(['email']);
  });
});
