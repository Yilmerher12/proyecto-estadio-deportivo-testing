// src/controllers/users.controller.ts
import { Request, Response, NextFunction } from 'express';
import * as usersService from '../services/users.service';
import { AppError } from '../errors/AppError';

export async function getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, 'No autenticado');
    const user = await usersService.getProfile(req.user.userId);
    res.json({ status: 'success', data: { user } });
  } catch (err) {
    next(err);
  }
}

export async function updateAvatar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, 'No autenticado');
    if (!req.file) throw new AppError(400, 'No se proporcionó ninguna imagen');
    const user = await usersService.updateAvatar(req.user.userId, req.file);
    res.json({ status: 'success', data: { user } });
  } catch (err) {
    next(err);
  }
}
