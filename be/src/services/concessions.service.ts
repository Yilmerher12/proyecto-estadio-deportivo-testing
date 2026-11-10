import { IConcession } from '../models/concession.model';
import * as concessionsRepository from '../repositories/concessions.repository';
import * as usersRepository from '../repositories/users.repository';
import { uploadToCloudinary, deleteFromCloudinary } from './upload.service';
import { sendConcessionCreatedEmail } from './email.service';
import { AppError } from '../errors/AppError';
import type { CreateConcessionInput, UpdateConcessionInput } from '../validators/concessions.schema';

const IMAGES_FOLDER = 'estadio-deportivo/concessions';

async function findOwned(id: string, userId: string): Promise<IConcession> {
  const concession = await concessionsRepository.findById(id);
  if (!concession) throw new AppError(404, 'Concesión no encontrada');
  if (String(concession.createdBy) !== userId) throw new AppError(403, 'No tienes permiso');
  return concession;
}

export async function getAll(userId: string): Promise<IConcession[]> {
  return concessionsRepository.findAll(userId);
}

export async function getById(id: string): Promise<IConcession> {
  const concession = await concessionsRepository.findByIdWithOwner(id);
  if (!concession) throw new AppError(404, 'Concesión no encontrada');
  return concession;
}

export async function create(
  data: CreateConcessionInput,
  userId: string,
  file?: Express.Multer.File,
): Promise<IConcession> {
  let imageUrl: string | undefined;
  let imagePublicId: string | undefined;

  if (file) {
    const result = await uploadToCloudinary(file.buffer, IMAGES_FOLDER);
    imageUrl = result.url;
    imagePublicId = result.publicId;
  }

  const concession = await concessionsRepository.create({
    ...data,
    imageUrl,
    imagePublicId,
    createdBy: userId,
  });

  // Fire-and-forget: el correo no debe bloquear ni romper la respuesta.
  const user = await usersRepository.findById(userId);
  if (user) {
    sendConcessionCreatedEmail(user.email, user.name, concession.name, concession.category).catch(
      (err) => console.error('Error enviando correo de creación:', err),
    );
  }

  return concession;
}

export async function update(
  id: string,
  userId: string,
  data: UpdateConcessionInput,
): Promise<IConcession> {
  await findOwned(id, userId);
  const updated = await concessionsRepository.update(id, data);
  if (!updated) throw new AppError(404, 'Concesión no encontrada');
  return updated;
}

export async function updateImage(
  id: string,
  userId: string,
  file: Express.Multer.File,
): Promise<IConcession> {
  const concession = await findOwned(id, userId);

  // Se sube la nueva primero: si falla, la imagen anterior sigue intacta.
  const { url, publicId } = await uploadToCloudinary(file.buffer, IMAGES_FOLDER);
  const updated = await concessionsRepository.updateImage(id, url, publicId);
  if (!updated) throw new AppError(404, 'Concesión no encontrada');

  if (concession.imagePublicId) {
    await deleteFromCloudinary(concession.imagePublicId).catch((err) =>
      console.error('No se pudo borrar la imagen anterior:', err),
    );
  }
  return updated;
}

export async function remove(id: string, userId: string): Promise<void> {
  const concession = await findOwned(id, userId);

  if (concession.imagePublicId) {
    await deleteFromCloudinary(concession.imagePublicId);
  }
  await concessionsRepository.remove(id);
}
