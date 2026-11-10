// src/services/users.service.ts
import { IUser } from '../models/user.model';
import * as usersRepository from '../repositories/users.repository';
import { uploadToCloudinary, deleteFromCloudinary } from './upload.service';
import { AppError } from '../errors/AppError';

export async function getProfile(userId: string): Promise<IUser> {
  const user = await usersRepository.findById(userId);
  if (!user) throw new AppError(404, 'Usuario no encontrado');
  return user;
}

export async function updateAvatar(userId: string, file: Express.Multer.File): Promise<IUser> {
  const user = await usersRepository.findById(userId);
  if (!user) throw new AppError(404, 'Usuario no encontrado');

  // Eliminar avatar anterior si existe
  if (user.avatarPublicId) {
    await deleteFromCloudinary(user.avatarPublicId);
  }

  const { url, publicId } = await uploadToCloudinary(
    file.buffer,
    'bootcamp/avatars',
    `user-${userId}`,
  );

  const updated = await usersRepository.updateAvatar(userId, url, publicId);
  if (!updated) throw new AppError(500, 'Error al actualizar el avatar');
  return updated;
}
