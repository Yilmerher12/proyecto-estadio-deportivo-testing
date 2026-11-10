import bcrypt from 'bcrypt';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as usersRepository from '../repositories/users.repository';
import { verifyAccessToken } from '../utils/jwt';
import * as authService from './auth.service';
import { sendResetPasswordEmail, sendWelcomeEmail } from './email.service';

// Se simulan el repositorio (Mongo) y el correo (Ethereal): aquí solo se prueba la regla.
vi.mock('../repositories/users.repository');
vi.mock('./email.service');

const repo = vi.mocked(usersRepository);

function fakeUser(extra: Record<string, unknown> = {}) {
  return { _id: 'u1', name: 'Ana', email: 'ana@example.com', role: 'user', ...extra } as never;
}

beforeEach(() => {
  vi.resetAllMocks();
  // El servicio hace sendX().catch(...): el doble debe devolver una promesa.
  vi.mocked(sendWelcomeEmail).mockResolvedValue(undefined);
  vi.mocked(sendResetPasswordEmail).mockResolvedValue(undefined);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('register', () => {
  const data = { name: 'Ana', email: 'ana@example.com', password: 'clave-1234' };

  it('should respond 409 and not create the user when the email already exists', async () => {
    // Arrange
    repo.findByEmail.mockResolvedValue(fakeUser());

    // Act + Assert
    await expect(authService.register(data)).rejects.toMatchObject({ statusCode: 409 });
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('should store a hashed password, send the welcome email and return a valid token', async () => {
    // Arrange
    repo.findByEmail.mockResolvedValue(null);
    repo.create.mockResolvedValue(fakeUser());

    // Act
    const { accessToken } = await authService.register(data);

    // Assert
    const saved = repo.create.mock.calls[0][0];
    expect(saved.password).not.toBe(data.password);
    expect(await bcrypt.compare(data.password, saved.password)).toBe(true);
    expect(sendWelcomeEmail).toHaveBeenCalledWith('ana@example.com', 'Ana');
    expect(verifyAccessToken(accessToken)).toMatchObject({ userId: 'u1', role: 'user' });
  });
});

describe('login', () => {
  const credentials = { email: 'ana@example.com', password: 'clave-1234' };

  it('should respond 401 when the user does not exist', async () => {
    // Arrange
    repo.findByEmailWithPassword.mockResolvedValue(null);

    // Act + Assert
    await expect(authService.login(credentials)).rejects.toMatchObject({
      statusCode: 401,
      message: 'Credenciales inválidas',
    });
  });

  it('should respond 401 with the same message when the password is wrong', async () => {
    // Arrange: costo 4 en el hash de prueba para que el test sea rápido.
    const password = await bcrypt.hash('otra-clave', 4);
    repo.findByEmailWithPassword.mockResolvedValue(fakeUser({ password }));

    // Act + Assert: mismo mensaje que usuario inexistente, para no revelar qué correos existen.
    await expect(authService.login(credentials)).rejects.toMatchObject({
      statusCode: 401,
      message: 'Credenciales inválidas',
    });
  });

  it('should return a token with the role of the user when the credentials are right', async () => {
    // Arrange
    const password = await bcrypt.hash(credentials.password, 4);
    repo.findByEmailWithPassword.mockResolvedValue(fakeUser({ password, role: 'admin' }));

    // Act
    const { accessToken } = await authService.login(credentials);

    // Assert
    expect(verifyAccessToken(accessToken)).toMatchObject({ userId: 'u1', role: 'admin' });
  });
});

describe('forgotPassword', () => {
  it('should do nothing (and reveal nothing) when the email is not registered', async () => {
    // Arrange
    repo.findByEmail.mockResolvedValue(null);

    // Act
    await authService.forgotPassword('nadie@example.com');

    // Assert
    expect(repo.saveResetToken).not.toHaveBeenCalled();
    expect(sendResetPasswordEmail).not.toHaveBeenCalled();
  });

  it('should save a token that expires in 1 hour and email the reset link', async () => {
    // Arrange
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T10:00:00.000Z'));
    repo.findByEmail.mockResolvedValue(fakeUser());

    // Act
    await authService.forgotPassword('ana@example.com');

    // Assert
    const [id, token, expiresAt] = repo.saveResetToken.mock.calls[0];
    expect(id).toBe('u1');
    expect(token).toHaveLength(64);
    expect(expiresAt).toEqual(new Date('2026-01-01T11:00:00.000Z'));
    const resetUrl = vi.mocked(sendResetPasswordEmail).mock.calls[0][2];
    expect(resetUrl).toContain(`/reset-password?token=${token}`);
  });
});

describe('resetPassword', () => {
  it('should respond 400 when the token is invalid or expired', async () => {
    // Arrange
    repo.findByResetToken.mockResolvedValue(null);

    // Act + Assert
    await expect(authService.resetPassword('malo', 'nueva-clave-1')).rejects.toMatchObject({
      statusCode: 400,
    });
    expect(repo.updatePassword).not.toHaveBeenCalled();
  });

  it('should save the new password hashed and clear the reset token', async () => {
    // Arrange
    repo.findByResetToken.mockResolvedValue(fakeUser());

    // Act
    await authService.resetPassword('bueno', 'nueva-clave-1');

    // Assert
    const [id, hashed] = repo.updatePassword.mock.calls[0];
    expect(id).toBe('u1');
    expect(await bcrypt.compare('nueva-clave-1', hashed)).toBe(true);
    expect(repo.clearResetToken).toHaveBeenCalledWith('u1');
  });
});
