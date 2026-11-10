// src/services/auth.service.ts
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { AppError } from '../errors/AppError';
import * as usersRepository from '../repositories/users.repository';
import { generateAccessToken } from '../utils/jwt';
import { sendWelcomeEmail, sendResetPasswordEmail } from './email.service';
import { env } from '../config/env';

export async function register(data: {
  name: string;
  email: string;
  password: string;
}): Promise<{ accessToken: string }> {
  const existing = await usersRepository.findByEmail(data.email);
  if (existing) throw new AppError(409, 'El correo ya está registrado');

  const hashedPassword = await bcrypt.hash(data.password, 12);
  const user = await usersRepository.create({ ...data, password: hashedPassword });

  // Fire-and-forget: el correo no debe bloquear la respuesta
  sendWelcomeEmail(user.email, user.name).catch((err) =>
    console.error('Error enviando correo de bienvenida:', err),
  );

  const accessToken = generateAccessToken({
    userId: String(user._id),
    email: user.email,
    role: user.role,
  });

  return { accessToken };
}

export async function login(data: {
  email: string;
  password: string;
}): Promise<{ accessToken: string }> {
  const user = await usersRepository.findByEmailWithPassword(data.email);
  if (!user) throw new AppError(401, 'Credenciales inválidas');

  const valid = await bcrypt.compare(data.password, user.password);
  if (!valid) throw new AppError(401, 'Credenciales inválidas');

  const accessToken = generateAccessToken({
    userId: String(user._id),
    email: user.email,
    role: user.role,
  });

  return { accessToken };
}

export async function forgotPassword(email: string): Promise<void> {
  // Respuesta siempre la misma para evitar user enumeration
  const user = await usersRepository.findByEmail(email);
  if (!user) return;

  const rawToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

  await usersRepository.saveResetToken(String(user._id), rawToken, expiresAt);

  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${rawToken}`;
  // Fire-and-forget: si se esperara el SMTP, el tiempo de respuesta (o un 500
  // por fallo de correo) delataría qué correos existen (user enumeration).
  sendResetPasswordEmail(user.email, user.name, resetUrl).catch((err) =>
    console.error('Error enviando correo de reset:', err),
  );
}

export async function resetPassword(rawToken: string, newPassword: string): Promise<void> {
  const user = await usersRepository.findByResetToken(rawToken);
  if (!user) throw new AppError(400, 'Token inválido o expirado');

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await usersRepository.updatePassword(String(user._id), hashedPassword);
  await usersRepository.clearResetToken(String(user._id));
}
