import { Request, Response, NextFunction } from 'express';
import * as concessionsService from '../services/concessions.service';
import { createConcessionSchema, updateConcessionSchema } from '../validators/concessions.schema';
import { AppError } from '../errors/AppError';

export async function getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, 'No autenticado');
    const concessions = await concessionsService.getAll(req.user.userId);
    res.json({ status: 'success', data: { concessions } });
  } catch (err) {
    next(err);
  }
}

export async function getById(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const concession = await concessionsService.getById(req.params.id);
    res.json({ status: 'success', data: { concession } });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, 'No autenticado');
    const { body } = createConcessionSchema.parse({ body: req.body });
    const concession = await concessionsService.create(body, req.user.userId, req.file);
    res.status(201).json({ status: 'success', data: { concession } });
  } catch (err) {
    next(err);
  }
}

export async function update(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, 'No autenticado');
    const { body } = updateConcessionSchema.parse({ body: req.body });
    const concession = await concessionsService.update(req.params.id, req.user.userId, body);
    res.json({ status: 'success', data: { concession } });
  } catch (err) {
    next(err);
  }
}

export async function updateImage(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, 'No autenticado');
    if (!req.file) throw new AppError(400, 'No se proporcionó ninguna imagen');
    const concession = await concessionsService.updateImage(
      req.params.id,
      req.user.userId,
      req.file,
    );
    res.json({ status: 'success', data: { concession } });
  } catch (err) {
    next(err);
  }
}

export async function remove(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, 'No autenticado');
    await concessionsService.remove(req.params.id, req.user.userId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
