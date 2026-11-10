// src/controllers/auth.controller.ts
import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators/auth.schema';

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { body } = registerSchema.parse({ body: req.body });
    const result = await authService.register(body);
    res.status(201).json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { body } = loginSchema.parse({ body: req.body });
    const result = await authService.login(body);
    res.json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { body } = forgotPasswordSchema.parse({ body: req.body });
    await authService.forgotPassword(body.email);
    // Siempre responder 200 para evitar user enumeration
    res.json({
      status: 'success',
      message: 'Si el correo existe, recibirás instrucciones para restaurar tu contraseña.',
    });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { body } = resetPasswordSchema.parse({ body: req.body });
    await authService.resetPassword(body.token, body.password);
    res.json({ status: 'success', message: 'Contraseña actualizada correctamente.' });
  } catch (err) {
    next(err);
  }
}
